// Six invented merchants. trustProfile is ground truth for the project owner only.
import type { TrustProfile } from "../schema";

const DAY = 24 * 60 * 60 * 1000;

export type SeedMerchant = {
  id: string;
  name: string;
  country: string;
  mcc: string;
  joinedAt: Date | ((now: Date) => Date);
  rating: number;
  reviewCount: number;
  returnPolicy: string;
  description: string;
  brandColour: string;
  trustProfile: TrustProfile;
  lookalikeOf?: string;
};

export const seedMerchants: SeedMerchant[] = [
  {
    id: "mer_alpenstride",
    name: "Alpenstride Sports",
    country: "CH",
    mcc: "5655", // sports and riding apparel stores
    joinedAt: new Date("2018-03-14T09:00:00Z"),
    rating: 4.7,
    reviewCount: 2318,
    returnPolicy:
      "30-day free returns on unworn items in original packaging. Refunds go back to the original payment method within 5 business days.",
    description:
      "Running, trail and football gear designed in the Alps. Free returns, fast delivery across Europe.",
    brandColour: "#1d4ed8",
    trustProfile: { label: "reputable", notes: "Established sportswear merchant. Correct MCC, long history, consistent reviews." },
  },
  {
    id: "mer_voltigo",
    name: "Voltigo Electronics",
    country: "CH",
    mcc: "5732", // electronics stores
    joinedAt: new Date("2016-09-01T09:00:00Z"),
    rating: 4.6,
    reviewCount: 5120,
    returnPolicy:
      "14-day returns in original packaging. Two-year warranty: defective items are repaired or replaced free of charge.",
    description: "Sports electronics, audio and charging gear. Two-year warranty on everything we sell.",
    brandColour: "#0f766e",
    trustProfile: { label: "reputable", notes: "Established electronics merchant. Correct MCC." },
  },
  {
    id: "mer_lindenhof",
    name: "Lindenhof Market",
    country: "CH",
    mcc: "5399", // miscellaneous general merchandise
    joinedAt: new Date("2014-05-20T09:00:00Z"),
    rating: 4.5,
    reviewCount: 8740,
    returnPolicy:
      "Unopened items can be returned within 14 days. Groceries damaged on arrival are refunded in full. Subscriptions can be cancelled any time before the next billing date.",
    description: "Your neighbourhood general store, online: groceries, basics and monthly subscription boxes.",
    brandColour: "#15803d",
    trustProfile: { label: "reputable", notes: "Established general store. Sells groceries, basics and subscriptions." },
  },
  {
    id: "mer_fernweh",
    name: "Fernweh Trail Co.",
    country: "DE",
    mcc: "5661", // shoe stores
    joinedAt: (now) => new Date(now.getTime() - 6 * DAY), // always "joined last week"
    rating: 4.7,
    reviewCount: 3,
    returnPolicy: "30-day returns on unworn shoes. Email us and we send a prepaid return label.",
    description: "A small trail-running workshop from the Black Forest region, new on Sandbox Market.",
    brandColour: "#c2410c",
    trustProfile: {
      label: "new_legitimate",
      notes: "Legitimate but brand new: joined 6 days before seeding, only 3 reviews. Clear policies, correct MCC.",
    },
  },
  {
    id: "mer_topdeal",
    name: "TopDeal Warehouse 24",
    country: "XX", // not stated
    mcc: "4816", // computer network / information services: wrong for a shoe seller
    joinedAt: (now) => new Date(now.getTime() - 58 * DAY),
    rating: 4.9,
    reviewCount: 12408,
    returnPolicy: "Returns possible in some cases. Conditions apply. Contact support.",
    description: "BEST PRICES GUARANTEED!!! Top brands up to 90% off. Limited stock, order now.",
    brandColour: "#dc2626",
    trustProfile: {
      label: "shady",
      notes:
        "Shady: prices far below market, vague return policy, country not stated, MCC 4816 does not match physical goods, implausible review count for a 2-month-old shop.",
    },
  },
  {
    id: "mer_aipenstride",
    name: "AIpenstride Sports", // capital "I" instead of lowercase "l"
    country: "CH",
    mcc: "5655",
    joinedAt: (now) => new Date(now.getTime() - 39 * DAY),
    rating: 4.8,
    reviewCount: 41,
    returnPolicy:
      "30-day free returns on unworn items in original packaging. Refunds go back to the original payment method within 5 business days.",
    description:
      "Running, trail and football gear designed in the Alps. Free returns, fast delivery across Europe.",
    brandColour: "#1d4ed8",
    trustProfile: {
      label: "lookalike",
      notes:
        "Look-alike of Alpenstride Sports: name uses a capital I instead of a lowercase l, copied description and policy, different id, joined recently, sells copies of Alpenstride listings.",
    },
    lookalikeOf: "mer_alpenstride",
  },
];
