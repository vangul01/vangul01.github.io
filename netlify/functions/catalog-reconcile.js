import "dotenv/config";

import { timingSafeEqual } from "node:crypto";

import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";
import { requireEnv } from "./lib/env.js";
import { productDraftId } from "./lib/sanity-ids.js";

const projectId = requireEnv("PUBLIC_SANITY_PROJECT_ID");
const reconcileKey = requireEnv("SECRET_CATALOG_KEY");
const dataset = requireEnv("SANITY_DATASET");
const stripeKey = requireEnv("STRIPE_KEY");

function slugify(name) {
  const slug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
  return slug || `product-${Date.now()}`;
}

function parseBool(value) {
  return value === "true" || value === "1";
}

function buildDescription(doc) {
  const parts = [];
  if (doc.materials) parts.push(`Materials: ${doc.materials}`);
  if (doc.dimensions) parts.push(`Dimensions: ${doc.dimensions}`);
  return parts.join(" | ") || null;
}

function secureEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function baseProductId(id) {
  const value = String(id || "");
  return value.startsWith("drafts.")
    ? value.slice("drafts.".length)
    : value;
}

async function listAllStripeProducts(stripe) {
  const products = [];
  let startingAfter;
  do {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...page.data);
    startingAfter = page.data.length
      ? page.data[page.data.length - 1].id
      : undefined;
  } while (startingAfter);
  return products;
}

async function fetchSanityProducts(client) {
  const fields = `_id, name, materials, dimensions`;
  const [published, drafts] = await Promise.all([
    client.fetch(
      `*[_type == "product" && !(_id in path("drafts.**"))]{${fields}}`,
    ),
    client.fetch(`*[_type == "product" && _id in path("drafts.**")]{${fields}}`),
  ]);

  const byStripeId = new Map();
  const unlinked = [];

  for (const doc of [...published, ...drafts]) {
    const isDraft = String(doc._id).startsWith("drafts.");
    const stripeId = baseProductId(doc._id);
    if (!stripeId.startsWith("prod_")) {
      if (!isDraft) {
        unlinked.push({ _id: doc._id, name: doc.name });
      }
      continue;
    }
    const entry = byStripeId.get(stripeId) || {};
    if (isDraft) entry.draft = doc;
    else entry.published = doc;
    byStripeId.set(stripeId, entry);
  }

  return { byStripeId, unlinked };
}

function computeContentDrift(stripeProducts, byStripeId) {
  const drift = [];
  for (const product of stripeProducts) {
    const published = byStripeId.get(product.id)?.published;
    if (!published) continue;
    const checks = [
      {
        field: "name",
        expected: published.name,
        actual: product.name,
      },
      {
        field: "description",
        expected: buildDescription(published),
        actual: product.description,
      },
    ];
    for (const check of checks) {
      const expected = check.expected ?? null;
      const actual = check.actual ?? null;
      if (expected !== actual) {
        drift.push({
          stripeId: product.id,
          name: product.name,
          field: check.field,
          expected,
          actual,
        });
      }
    }
  }
  return drift;
}

async function reconcileDataset({ dataset, stripeKey }, repair) {
  const report = {
    dataset,
    missing: [],
    orphans: [],
    deactivated: [],
    contentDrift: [],
    unlinked: [],
  };
  let provisioned = 0;

  const stripe = createStripeClient(stripeKey);
  const writeToken = repair ? requireEnv("SANITY_WRITE_TOKEN") : undefined;
  const client = createSanityClient({ projectId, dataset, token: writeToken });

  const stripeProducts = await listAllStripeProducts(stripe);
  const { byStripeId, unlinked } = await fetchSanityProducts(client);
  const stripeIds = new Set(stripeProducts.map((p) => p.id));

  report.stripeProductCount = stripeProducts.length;
  report.sanityProductCount = byStripeId.size;

  const missingSource = [];
  const deactivatedSource = [];
  for (const product of stripeProducts) {
    const entry = byStripeId.get(product.id);
    if (!entry) {
      missingSource.push({
        stripeId: product.id,
        name: product.name,
        active: product.active,
      });
      continue;
    }
    if (product.active === false && entry.published) {
      deactivatedSource.push({
        stripeId: product.id,
        name: product.name,
        publishedId: entry.published._id,
        draftId: entry.draft?._id,
      });
    }
  }

  const orphansSource = [];
  for (const [stripeId, entry] of byStripeId.entries()) {
    if (!stripeIds.has(stripeId)) {
      orphansSource.push({
        stripeId,
        publishedId: entry.published?._id,
        draftId: entry.draft?._id,
      });
    }
  }

  const contentDriftSource = computeContentDrift(stripeProducts, byStripeId);

  if (repair) {
    for (const item of missingSource) {
      // Never draft deactivated Stripe products. They stay reported (visible
      // with active:false) but repair skips them.
      if (item.active === false) continue;
      await client.createIfNotExists({
        _id: productDraftId(item.stripeId),
        _type: "product",
        name: item.name || "Untitled product",
        slug: { current: slugify(item.name) },
        category: "misc",
      });
      provisioned += 1;
    }
  }

  report.missing = missingSource;
  report.orphans = orphansSource;
  report.deactivated = deactivatedSource;
  report.contentDrift = contentDriftSource;
  report.unlinked = unlinked;

  console.log(
    `[catalog-reconcile] ${dataset}: ${stripeProducts.length} Stripe products, ` +
      `${byStripeId.size} linked Sanity docs, ${unlinked.length} unlinked, ` +
      `${missingSource.length} missing, ` +
      `${orphansSource.length} orphans, ${deactivatedSource.length} deactivated, ` +
      `${contentDriftSource.length} content drift ` +
      `(repair=${repair}: provisioned ${provisioned})`,
  );

  return { report, provisioned };
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (!secureEqual(event.headers["x-reconcile-key"], reconcileKey)) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  const repair = parseBool(params.get("repair"));

  try {
    const { report, provisioned } = await reconcileDataset(
      { dataset, stripeKey },
      repair,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ dataset, repair, provisioned, report }, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ dataset, error: err.message }, null, 2),
    };
  }
}
