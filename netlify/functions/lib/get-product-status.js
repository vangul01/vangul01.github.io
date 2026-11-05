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
      console.log("getProductStatus: not_found reason=not_found", id);
      return { state: "not_found" };
    }

    if (product.active === false) {
      return { state: "inactive" };
    }

    const defaultPrice = product.default_price;
    if (!defaultPrice) {
      console.log("getProductStatus: unavailable reason=no_default_price", id);
      return { state: "unavailable" };
    }

    const price =
      typeof defaultPrice === "string"
        ? await stripe.prices.retrieve(defaultPrice)
        : defaultPrice;

    if (!price || typeof price.unit_amount !== "number") {
      console.log("getProductStatus: unavailable reason=no_default_price", id);
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
  } catch (err) {
    const msg = err?.message || "";
    const code = err?.code || err?.raw?.code || "";
    if (code === "resource_missing" || /No such product/i.test(msg)) {
      console.log("getProductStatus: not_found reason=not_found", id);
      return { state: "not_found" };
    }
    console.error("getProductStatus error:", id, msg);
    return { state: "not_found" };
  }
}
