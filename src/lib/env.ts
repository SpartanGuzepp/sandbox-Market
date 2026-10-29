// Reads configuration from environment variables (see .env.example).

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} is not set. See .env.example.`);
  return v;
}

export const config = {
  authoriserUrl: () => process.env.PAYMENT_AUTHORISER_URL?.trim() || null,
  authoriserSecret: () => process.env.PAYMENT_AUTHORISER_SECRET?.trim() || null,
  sendBasketDetails: () => (process.env.SEND_BASKET_DETAILS ?? "").trim().toLowerCase() === "true",
  webhookUrls: () =>
    (process.env.WEBHOOK_URLS ?? "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean),
  webhookSecret: () => process.env.WEBHOOK_SECRET?.trim() || null,
  cartSigningSecret: () => requireEnv("CART_SIGNING_SECRET"),
};
