import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { Timeline } from "@/components/Timeline";

export const metadata: Metadata = { title: "Demo timeline · Sandbox Market" };

export default async function TimelinePage() {
  await requireAdmin();
  return <Timeline />;
}
