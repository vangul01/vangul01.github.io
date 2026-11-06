const LIST_CHUNK_SIZE = 10;

function logNotFound(id) {
  console.log("getProductStatus: not_found reason=not_found", id);
}

function logNoDefaultPrice(id) {
  console.log("getProductStatus: unavailable reason=no_default_price", id);
}

async function statusFromProduct(stripe, product) {
  if (!product) {
    logNotFound(product?.id);
    return { state: "not_found" };
  }

  if (product.active === false) {
    return { state: "inactive" };
  }

  const defaultPrice = product.default_price;
  if (!defaultPrice) {
    logNoDefaultPrice(product.id);
    return { state: "unavailable" };
  }

  const price =
    typeof defaultPrice === "string"
      ? await stripe.prices.retrieve(defaultPrice)
      : defaultPrice;

  if (!price || typeof price.unit_amount !== "number") {
    logNoDefaultPrice(product.id);
    return { state: "unavailable" };
  }

  if (product?.metadata?.unavailable === "true") {
    return { state: "unavailable" };
  }

  return {
    state: "available",
    id: price.id,
    amount: price.unit_amount / 100,
    currency: price.currency,
  };
}

export async function getProductStatus(stripe, id) {
  if (typeof id !== "string" || !id.startsWith("prod_")) {
    console.log("getProductStatus: not_found reason=invalid_id", id);
    return { state: "not_found" };
  }

  try {
    const product = await stripe.products.retrieve(id, {
      expand: ["default_price"],
    });

    if (!product) {
      logNotFound(id);
      return { state: "not_found" };
    }

    return await statusFromProduct(stripe, product);
  } catch (err) {
    const msg = err?.message || "";
    const code = err?.code || err?.raw?.code || "";
    if (code === "resource_missing" || /No such product/i.test(msg)) {
      logNotFound(id);
      return { state: "not_found" };
    }
    console.error("getProductStatus error:", id, msg);
    return { state: "not_found" };
  }
}

export async function getProductStatuses(stripe, ids) {
  const statuses = {};
  const valid = [];
  const seen = new Set();

  for (const raw of Array.isArray(ids) ? ids : []) {
    const id = typeof raw === "string" ? raw : String(raw ?? "");
    if (!id.startsWith("prod_")) {
      console.log("getProductStatus: not_found reason=invalid_id", id);
      statuses[id] = { state: "not_found" };
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    valid.push(id);
  }

  const chunks = [];
  for (let i = 0; i < valid.length; i += LIST_CHUNK_SIZE) {
    chunks.push(valid.slice(i, i + LIST_CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    const found = new Map();

    try {
      const list = await stripe.products.list({
        ids: chunk,
        limit: chunk.length,
        expand: ["data.default_price"],
      });
      for (const product of list.data) {
        found.set(product.id, product);
      }
    } catch (err) {
      console.error("getProductStatuses list error:", err.message);
    }

    for (const id of chunk) {
      const product = found.get(id);
      statuses[id] = product
        ? await statusFromProduct(stripe, product)
        : await getProductStatus(stripe, id);
    }
  }

  return statuses;
}
