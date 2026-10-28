// Product categories, used by the shop navigation, the API and the OpenAPI spec.
export const CATEGORIES = [
  { id: "running_shoes", label: "Running shoes" },
  { id: "trail_shoes", label: "Trail shoes" },
  { id: "football_boots", label: "Football boots" },
  { id: "socks", label: "Socks" },
  { id: "apparel", label: "Apparel" },
  { id: "electronics", label: "Electronics" },
  { id: "groceries", label: "Groceries" },
  { id: "subscriptions", label: "Subscriptions" },
] as const;

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
