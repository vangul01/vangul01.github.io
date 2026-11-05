export async function getProductStatus(stripe, id) {
  if (typeof id !== "string" || !id.startsWith("prod_")) {
    return { state: "not_found" };
  }

  try {
    const product = await stripe.products.retrieve(id, {
      expand: ["default_price"],
    });

    if (!product) {
      return { state: "not_found" };
    }

    if (!product.active) {
      return { state: "inactive" };
    }

    const defaultPrice = product.default_price;
    if (!defaultPrice) {
      return { state: "inactive" };
    }

    const price =
      typeof defaultPrice === "string"
        ? await stripe.prices.retrieve(defaultPrice)
        : defaultPrice;

    if (!price || typeof price.unit_amount !== "number") {
      return { state: "inactive" };
    }

    const unavailable = product?.metadata?.unavailable === "true";
    if (unavailable) {
      return {
        state: "unavailable",
        id: price.id,
        amount: price.unit_amount / 100,
        currency: price.currency,
      };
    }

    return {
      state: "available",
      id: price.id,
      amount: price.unit_amount / 100,
      currency: price.currency,
    };
  } catch (err) {
    const msg = err?.message || "";
    const code = err?.code || "";
    if (code === "resource_missing" || /No such product/i.test(msg)) {
      return { state: "not_found" };
    }
    console.error("getProductStatus error:", id, msg);
    return { state: "not_found" };
  }
}
