"use server";
// Actions for the simulated customer banking app (/bank).
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { safeEqual } from "@/lib/api/customer";
import { requireEnv } from "@/lib/env";
import { customerDecision } from "@/lib/payments/process";
import { endSession, requireBank, startSession } from "@/lib/session";

export async function bankLoginAction(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  await new Promise((r) => setTimeout(r, 300));
  if (!safeEqual(pin, requireEnv("CUSTOMER_PIN"))) redirect("/bank/login?error=1");
  await startSession("bank");
  redirect("/bank");
}

export async function bankLogoutAction() {
  await endSession("bank");
  redirect("/bank/login");
}

export async function bankDecisionAction(formData: FormData) {
  await requireBank();
  let error: string | null = null;
  try {
    await customerDecision(String(formData.get("order_id")), formData.get("decision") === "approve");
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Something went wrong.";
  }
  redirect(error ? `/bank?error=${encodeURIComponent(error)}` : "/bank");
}
