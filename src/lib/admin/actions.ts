"use server";
// Admin panel actions. Every action checks the admin session first:
// server actions can be called directly, so the page guard alone is not enough.
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { agentKeys, attackScenarios } from "@/db/schema";
import { resetAndSeed } from "@/db/seed";
import { ApiError } from "@/lib/api/errors";
import { safeEqual } from "@/lib/api/customer";
import { requireEnv } from "@/lib/env";
import { logEvent } from "@/lib/events";
import { newId } from "@/lib/ids";
import { refundOrder } from "@/lib/payments/process";
import { simulateRenewal, simulateRogueCharge } from "@/lib/payments/subscriptions";
import { endSession, requireAdmin, startSession } from "@/lib/session";

const ADMIN = { type: "admin" as const, name: "Admin" };
const msg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Something went wrong.");

export async function adminLoginAction(formData: FormData) {
  const pw = String(formData.get("password") ?? "");
  await new Promise((r) => setTimeout(r, 300)); // slow down password guessing a little
  if (!safeEqual(pw, requireEnv("ADMIN_PASSWORD"))) redirect("/admin/login?error=1");
  await startSession("admin");
  redirect("/admin");
}

export async function adminLogoutAction() {
  await endSession("admin");
  redirect("/admin/login");
}

export async function toggleTrapAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const enabled = formData.get("enabled") === "true";
  await db.update(attackScenarios).set({ enabled, updatedAt: new Date() }).where(eq(attackScenarios.id, id));
  await logEvent({ actor: ADMIN, type: "trap.toggled", summary: `Trap ${id} switched ${enabled ? "ON" : "OFF"}`, data: { trap_id: id, enabled } });
  revalidatePath("/admin/traps");
}

export async function setAllTrapsAction(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("enabled") === "true";
  await db.update(attackScenarios).set({ enabled, updatedAt: new Date() });
  await logEvent({ actor: ADMIN, type: "trap.toggled", summary: `All traps switched ${enabled ? "ON" : "OFF"}`, data: { all: true, enabled } });
  revalidatePath("/admin/traps");
}

export async function resetDatabaseAction(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "RESET") redirect("/admin?error=" + encodeURIComponent("Type RESET to confirm."));
  await resetAndSeed(db);
  await logEvent({ actor: ADMIN, type: "admin.reset", summary: "Database reset and reseeded" });
  redirect("/admin?ok=" + encodeURIComponent("Database reset to the known starting state."));
}

export type CreateKeyState = { key?: string; name?: string; error?: string };

export async function createAgentKeyAction(_prev: CreateKeyState, formData: FormData): Promise<CreateKeyState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return { error: "Give the key a name, e.g. 'Leashed agent v1'." };
  const key = "ak_" + randomBytes(24).toString("base64url");
  await db.insert(agentKeys).values({
    id: newId("agk", 10),
    name,
    prefix: key.slice(0, 10),
    keyHash: createHash("sha256").update(key).digest("hex"),
  });
  await logEvent({ actor: ADMIN, type: "agent_key.created", summary: `Created API key '${name}'` });
  revalidatePath("/admin/agents");
  return { key, name };
}

export async function revokeAgentKeyAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const [k] = await db.update(agentKeys).set({ revokedAt: new Date() }).where(eq(agentKeys.id, id)).returning();
  if (k) await logEvent({ actor: ADMIN, type: "agent_key.revoked", summary: `Revoked API key '${k.name}'` });
  revalidatePath("/admin/agents");
}

export async function refundOrderAction(formData: FormData) {
  await requireAdmin();
  let error: string | null = null;
  try {
    await refundOrder(String(formData.get("id")));
  } catch (e) {
    error = msg(e);
  }
  redirect(error ? `/admin/orders?error=${encodeURIComponent(error)}` : "/admin/orders?ok=Refunded");
}

export async function simulateRenewalAction(formData: FormData) {
  await requireAdmin();
  let text: string;
  try {
    const { order, authorisation } = await simulateRenewal(String(formData.get("id")));
    text = `Renewal ${order.id}: ${authorisation.decision.toUpperCase()}: ${authorisation.reason}`;
  } catch (e) {
    redirect(`/admin/subscriptions?error=${encodeURIComponent(msg(e))}`);
  }
  redirect(`/admin/subscriptions?ok=${encodeURIComponent(text)}`);
}

export async function simulateRogueChargeAction(formData: FormData) {
  await requireAdmin();
  let text: string;
  try {
    const { order, authorisation } = await simulateRogueCharge(String(formData.get("id")));
    text = `Rogue charge ${order.id}: ${authorisation.decision.toUpperCase()}: ${authorisation.reason}`;
  } catch (e) {
    redirect(`/admin/subscriptions?error=${encodeURIComponent(msg(e))}`);
  }
  redirect(`/admin/subscriptions?ok=${encodeURIComponent(text)}`);
}
