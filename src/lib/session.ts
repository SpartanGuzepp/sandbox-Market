// Tiny signed-cookie sessions for the admin panel and the simulated banking app.
// Cookie value: "<role>.<expiry>.<hmac>", signed with SESSION_SECRET.
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeEqual } from "@/lib/api/customer";
import { requireEnv } from "@/lib/env";

export type Role = "admin" | "bank";
const COOKIE: Record<Role, string> = { admin: "sm_admin", bank: "sm_bank" };
const TTL_SECONDS = 60 * 60 * 12;

const sign = (payload: string) => createHmac("sha256", requireEnv("SESSION_SECRET")).update(payload).digest("hex");

export async function startSession(role: Role) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${role}.${exp}`;
  (await cookies()).set(COOKIE[role], `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession(role: Role) {
  (await cookies()).delete(COOKIE[role]);
}

export async function hasSession(role: Role): Promise<boolean> {
  const value = (await cookies()).get(COOKIE[role])?.value;
  if (!value) return false;
  const [r, exp, mac] = value.split(".");
  if (r !== role || !exp || !mac) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return safeEqual(mac, sign(`${r}.${exp}`));
}

export async function requireAdmin() {
  if (!(await hasSession("admin"))) redirect("/admin/login");
}

export async function requireBank() {
  if (!(await hasSession("bank"))) redirect("/bank/login");
}
