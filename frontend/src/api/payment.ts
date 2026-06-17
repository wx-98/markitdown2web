import client from "./client";

export async function getPlans() {
  const { data } = await client.get("/payment/plans");
  return data;
}

export async function createCheckout(
  provider: string,
  successUrl: string,
  cancelUrl: string,
) {
  const { data } = await client.post("/payment/checkout", {
    provider,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return data;
}

export async function getSubscription() {
  const { data } = await client.get("/payment/subscription");
  return data;
}

export async function cancelSubscription() {
  const { data } = await client.post("/payment/cancel");
  return data;
}
