import "dotenv/config";

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
  const [published, drafts] = await Promise.all([
    client.fetch(
      `*[_type == "product"]{_id, stripeProductId, archived, inStock}`,
    ),
    client.fetch(
      `*[_type == "product" && _id in path("drafts.**")]{_id, stripeProductId, archived, inStock}`,
    ),
  ]);
  const byStripeId = new Map();
  for (const doc of [...published, ...drafts]) {
    if (!doc.stripeProductId) continue;
    const entry = byStripeId.get(doc.stripeProductId) || {};
    if (String(doc._id).startsWith("drafts.")) entry.draft = doc;
    else entry.published = doc;
    byStripeId.set(doc.stripeProductId, entry);
  }
  return byStripeId;
}

async function reconcileDataset(name, { dataset, stripeKey }, repair) {
  const report = { dataset, missing: [], orphans: [], deactivated: [] };
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
  const sanityByStripeId = await fetchSanityProducts(client);
  const stripeIds = new Set(stripeProducts.map((p) => p.id));

  report.stripeProductCount = stripeProducts.length;
  report.sanityProductCount = sanityByStripeId.size;

  const missingSource = [];
  const deactivatedSource = [];
  for (const product of stripeProducts) {
    const entry = sanityByStripeId.get(product.id);
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
        sanityId: entry.published._id,
      });
    }
  }

  const orphansSource = [];
  for (const [stripeProductId, entry] of sanityByStripeId.entries()) {
    if (!stripeIds.has(stripeProductId)) {
      orphansSource.push({
        stripeProductId,
        publishedId: entry.published?._id,
        draftId: entry.draft?._id,
      });
    }
  }

  if (repair) {
    if (!writeToken) {
      report.error = "Repair requested but SANITY_WRITE_TOKEN is not set";
      return { report, provisioned, archived };
    }
    for (const item of missingSource) {
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
      await Promise.allSettled([
        client.patch(`product.${item.stripeId}`, patch).commit(),
        client.patch(`drafts.product.${item.stripeId}`, patch).commit(),
      ]);
      archived += 1;
    }
  }

  report.missing = missingSource;
  report.orphans = orphansSource;
  report.deactivated = deactivatedSource;

  console.log(
    `[catalog-reconcile] ${name}: ${stripeProducts.length} Stripe products, ` +
      `${sanityByStripeId.size} Sanity docs, ${missingSource.length} missing, ` +
      `${orphansSource.length} orphans, ${deactivatedSource.length} deactivated ` +
      `(repair=${repair}: provisioned ${provisioned}, archived ${archived})`,
  );

  return { report, provisioned, archived };
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (event.headers["x-reconcile-key"] !== reconcileKey) {
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