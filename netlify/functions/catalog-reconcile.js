import "dotenv/config";

import { timingSafeEqual } from "node:crypto";

import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const reconcileKey = process.env.SECRET_CATALOG_KEY;
const writeToken = process.env.SANITY_WRITE_TOKEN;
const productionDataset =
  process.env.SANITY_PRODUCTION_DATASET || "production";
const developmentDataset =
  process.env.SANITY_DEVELOPMENT_DATASET || "development";

if (!projectId) {
  throw new Error("Missing Sanity project id");
}
if (!reconcileKey) {
  throw new Error("Missing SECRET_CATALOG_KEY");
}

const DATASETS = {
  production: {
    dataset: productionDataset,
    stripeKey: process.env.SECRET_STRIPE_LIVE_KEY,
  },
  development: {
    dataset: developmentDataset,
    stripeKey: process.env.SECRET_STRIPE_TEST_KEY,
  },
};

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

function stripDraftSuffix(name) {
  if (typeof name === "string" && name.endsWith(" _DRAFT")) {
    return name.slice(0, -" _DRAFT".length);
  }
  return name;
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
  const fields = `_id, stripeProductId, archived, inStock, name, materials, dimensions`;
  const [published, drafts] = await Promise.all([
    client.fetch(
      `*[_type == "product" && !(_id in path("drafts.**"))]{${fields}}`,
    ),
    client.fetch(`*[_type == "product" && _id in path("drafts.**")]{${fields}}`),
  ]);
  const byStripeId = new Map();
  const docsByStripeId = new Map();
  for (const doc of [...published, ...drafts]) {
    if (!doc.stripeProductId) continue;
    const entry = byStripeId.get(doc.stripeProductId) || {};
    if (String(doc._id).startsWith("drafts.")) entry.draft = doc;
    else entry.published = doc;
    byStripeId.set(doc.stripeProductId, entry);
    const list = docsByStripeId.get(doc.stripeProductId) || [];
    list.push(doc);
    docsByStripeId.set(doc.stripeProductId, list);
  }
  return { byStripeId, docsByStripeId };
}

function computeDuplicates(docsByStripeId) {
  const duplicates = [];
  for (const [stripeProductId, docs] of docsByStripeId.entries()) {
    const publishedDocs = docs.filter(
      (d) => !String(d._id).startsWith("drafts."),
    );
    const draftDocs = docs.filter((d) => String(d._id).startsWith("drafts."));
    const validDraftIds = new Set(
      publishedDocs.map((d) => `drafts.${d._id}`),
    );
    const unpairedDrafts = draftDocs.filter(
      (d) => !validDraftIds.has(d._id),
    );
    if (publishedDocs.length <= 1 && unpairedDrafts.length === 0) continue;
    const items = [];
    publishedDocs.forEach((d, i) => {
      items.push({
        _id: d._id,
        archived: d.archived,
        inStock: d.inStock,
        ...(i > 0 ? { note: "extra published doc (duplicate listing)" } : {}),
      });
    });
    draftDocs.forEach((d) => {
      items.push({
        _id: d._id,
        archived: d.archived,
        inStock: d.inStock,
        ...(unpairedDrafts.includes(d)
          ? { note: "unpaired draft" }
          : {}),
      });
    });
    duplicates.push({ stripeProductId, docs: items });
  }
  return duplicates;
}

function computeContentDrift(stripeProducts, byStripeId) {
  const drift = [];
  for (const product of stripeProducts) {
    const published = byStripeId.get(product.id)?.published;
    if (!published) continue;
    const checks = [
      {
        field: "name",
        expected: stripDraftSuffix(published.name),
        actual: product.name,
      },
      {
        field: "active",
        expected: !published.archived,
        actual: product.active,
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

async function reconcileDataset(name, { dataset, stripeKey }, repair) {
  const report = {
    dataset,
    missing: [],
    orphans: [],
    deactivated: [],
    duplicates: [],
    contentDrift: [],
  };
  let provisioned = 0;
  let archived = 0;

  if (!stripeKey) {
    report.error = `Missing ${
      name === "production" ? "SECRET_STRIPE_LIVE_KEY" : "SECRET_STRIPE_TEST_KEY"
    }`;
    return { report, provisioned, archived };
  }

  const stripe = createStripeClient(stripeKey);
  const client = createSanityClient({ projectId, dataset, token: writeToken });

  const stripeProducts = await listAllStripeProducts(stripe);
  const { byStripeId, docsByStripeId } = await fetchSanityProducts(client);
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
    if (
      product.active === false &&
      entry.published &&
      entry.published.archived !== true
    ) {
      deactivatedSource.push({
        stripeId: product.id,
        name: product.name,
        publishedId: entry.published._id,
        draftId: entry.draft?._id,
      });
    }
  }

  const orphansSource = [];
  for (const [stripeProductId, entry] of byStripeId.entries()) {
    if (!stripeIds.has(stripeProductId)) {
      orphansSource.push({
        stripeProductId,
        publishedId: entry.published?._id,
        draftId: entry.draft?._id,
      });
    }
  }

  // Report-only buckets — repair never touches these (re-publishing or
  // merging docs is editorial judgement).
  const duplicatesSource = computeDuplicates(docsByStripeId);
  const contentDriftSource = computeContentDrift(stripeProducts, byStripeId);

  if (repair) {
    if (!writeToken) {
      report.error = "Repair requested but SANITY_WRITE_TOKEN is not set";
      return { report, provisioned, archived };
    }
    for (const item of missingSource) {
      // Never draft deactivated Stripe products. They stay reported (visible
      // with active:false) but repair skips them.
      if (item.active === false) continue;
      await client.createIfNotExists({
        _id: `drafts.product.${item.stripeId}`,
        _type: "product",
        stripeProductId: item.stripeId,
        name: `${item.name || "Untitled product"} _DRAFT`,
        slug: { current: slugify(item.name) },
        inStock: false,
        archived: false,
        category: "misc",
      });
      provisioned += 1;
    }
    const patch = { set: { archived: true, inStock: false } };
    for (const item of orphansSource) {
      const ids = [item.publishedId, item.draftId].filter(Boolean);
      await Promise.allSettled(
        ids.map((id) => client.patch(id, patch).commit()),
      );
      archived += ids.length;
    }
    for (const item of deactivatedSource) {
      const ids = [item.publishedId, item.draftId].filter(Boolean);
      await Promise.allSettled(
        ids.map((id) => client.patch(id, patch).commit()),
      );
      archived += ids.length;
    }
  }

  report.missing = missingSource;
  report.orphans = orphansSource;
  report.deactivated = deactivatedSource;
  report.duplicates = duplicatesSource;
  report.contentDrift = contentDriftSource;

  console.log(
    `[catalog-reconcile] ${name}: ${stripeProducts.length} Stripe products, ` +
      `${byStripeId.size} Sanity docs, ${missingSource.length} missing, ` +
      `${orphansSource.length} orphans, ${deactivatedSource.length} deactivated, ` +
      `${duplicatesSource.length} duplicate groups, ${contentDriftSource.length} content drift ` +
      `(repair=${repair}: provisioned ${provisioned}, archived ${archived})`,
  );

  return { report, provisioned, archived };
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (!secureEqual(event.headers["x-reconcile-key"], reconcileKey)) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const params = new URLSearchParams(event.queryStringParameters || {});
  const requested = params.get("dataset");
  const repair = parseBool(params.get("repair"));

  if (requested && !DATASETS[requested]) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Unknown dataset "${requested}" (use development or production)`,
      }),
    };
  }

  const names = requested ? [requested] : Object.keys(DATASETS);
  const datasets = {};
  let provisioned = 0;
  let archived = 0;

  for (const name of names) {
    try {
      const { report, provisioned: p, archived: a } = await reconcileDataset(
        name,
        DATASETS[name],
        repair,
      );
      datasets[name] = report;
      provisioned += p;
      archived += a;
    } catch (err) {
      datasets[name] = { error: err.message };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      { repair, provisioned, archived, datasets },
      null,
      2,
    ),
  };
}