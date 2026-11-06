import { afterEach, describe, expect, it } from "vitest";
import { authenticateCustomer } from "@/lib/api/customer";
import { customerPinStatus } from "@/lib/env";

const req = (headers: Record<string, string>) => new Request("http://x/api/v1/orders/ord_1/approve", { method: "POST", headers });
const original = process.env.CUSTOMER_PIN;
afterEach(() => {
  process.env.CUSTOMER_PIN = original;
});

describe("customer PIN check", () => {
  it("accepts the PIN even if the stored value has a trailing newline or spaces", () => {
    process.env.CUSTOMER_PIN = "482913\n";
    expect(() => authenticateCustomer(req({ "X-Customer-Pin": "482913" }))).not.toThrow();
    process.env.CUSTOMER_PIN = "  482913 ";
    expect(() => authenticateCustomer(req({ "X-Customer-Pin": "482913" }))).not.toThrow();
  });
  it("still rejects a wrong or missing PIN, and agent keys", () => {
    process.env.CUSTOMER_PIN = "482913";
    expect(() => authenticateCustomer(req({ "X-Customer-Pin": "000000" }))).toThrowError(/Wrong PIN/);
    expect(() => authenticateCustomer(req({}))).toThrowError(/X-Customer-Pin header/);
    expect(() => authenticateCustomer(req({ "X-Customer-Pin": "482913", "X-Agent-Key": "ak_x" }))).toThrowError(/Only the customer/);
  });
  it("treats an empty or whitespace-only PIN as not set", () => {
    process.env.CUSTOMER_PIN = "  ";
    expect(() => authenticateCustomer(req({ "X-Customer-Pin": "x" }))).toThrowError(/CUSTOMER_PIN is not set/);
    expect(customerPinStatus()).toEqual({ set: false, length: 0, hadSurroundingWhitespace: true });
  });
  it("reports length and stray whitespace without the value", () => {
    process.env.CUSTOMER_PIN = "482913\n";
    expect(customerPinStatus()).toEqual({ set: true, length: 6, hadSurroundingWhitespace: true });
  });
});
