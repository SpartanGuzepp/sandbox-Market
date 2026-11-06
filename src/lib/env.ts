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
  customerPin: () => {
    // Trimmed: a space or newline pasted into the environment variable must not break the PIN.
    const pin = process.env.CUSTOMER_PIN?.trim();
    if (!pin) throw new Error("Environment variable CUSTOMER_PIN is not set. See .env.example.");
    return pin;
  },
};

/** For the admin Overview: whether CUSTOMER_PIN is set and its length, never its value. */
export function customerPinStatus() {
  const raw = process.env.CUSTOMER_PIN ?? "";
  const trimmed = raw.trim();
  return { set: trimmed.length > 0, length: trimmed.length, hadSurroundingWhitespace: raw.length !== trimmed.length };
}
