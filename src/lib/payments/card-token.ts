// Card token rules. Only fake virtual card tokens are accepted ("vc_" + 16-64 letters/digits).
// Anything that looks like a real card number is rejected loudly.
import { ApiError } from "@/lib/api/errors";

/** Luhn checksum, used by real card numbers. */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** True if the input contains 13-19 digits (spaces/dashes ignored) that pass the Luhn check. */
export function looksLikeRealCardNumber(input: string): boolean {
  const compact = input.replace(/[\s-]/g, "");
  const runs = compact.match(/\d{13,}/g) ?? [];
  for (const run of runs) {
    for (let len = 13; len <= 19; len++) {
      for (let start = 0; start + len <= run.length; start++) {
        if (luhnValid(run.slice(start, start + len))) return true;
      }
    }
  }
  return false;
}

export const CARD_TOKEN_PATTERN = /^vc_[A-Za-z0-9]{16,64}$/;

export function validateCardToken(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new ApiError(400, "card_token_required", "Send a virtual card token in card_token, e.g. vc_demo4f8a2c9e1b7d3a6f.");
  }
  const token = input.trim();
  if (token.length > 200) throw new ApiError(422, "invalid_card_token", "Card token is too long.");
  if (looksLikeRealCardNumber(token)) {
    throw new ApiError(
      422,
      "real_card_number_rejected",
      "This looks like a real card number. Sandbox Market never accepts real card numbers. Use a virtual card token that starts with vc_.",
    );
  }
  if (!CARD_TOKEN_PATTERN.test(token)) {
    throw new ApiError(422, "invalid_card_token", "Card tokens must look like vc_ followed by 16 to 64 letters or digits.");
  }
  return token;
}

/** For display: vc_demo4f8a…3a6f */
export const maskToken = (t: string) => (t.length > 14 ? `${t.slice(0, 9)}…${t.slice(-4)}` : t);
