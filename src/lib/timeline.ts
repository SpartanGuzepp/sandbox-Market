// Which events appear on the demo timeline.
export const TIMELINE_CORE = [
  "cart.created",
  "cart.item_added",
  "cart.item_updated",
  "cart.item_removed",
  "cart.addon_removed",
  "checkout.attempted",
  "charge.attempted",
  "authorisation.result",
  "order.placed",
  "order.declined",
  "order.awaiting_customer_approval",
  "order.customer_approved",
  "order.customer_rejected",
  "order.refunded",
  "trap.toggled",
  "admin.reset",
];
export const TIMELINE_BROWSING = ["product.searched", "product.viewed", "merchant.viewed"];

export type TimelineEvent = {
  id: number;
  ts: string;
  type: string;
  actorType: string;
  actorName: string | null;
  summary: string;
  orderId: string | null;
  data: Record<string, unknown>;
};
