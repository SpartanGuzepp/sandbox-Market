// Deterministic review generator: the same product id always produces the same reviews,
// so every reset gives an identical database.
import type { SeedProduct } from "./products";

type ReviewTemplate = { rating: number; title: string; body: string };

const AUTHORS = [
  "Lena M.", "Marco B.", "Sofia R.", "Jonas K.", "Aline D.", "Tobias W.", "Chiara F.", "Nils H.",
  "Mira S.", "Elias G.", "Noemi T.", "Luca P.", "Ines V.", "Felix A.", "Hanna L.", "Matteo C.",
];

const POOLS: Record<string, ReviewTemplate[]> = {
  running_shoes: [
    { rating: 5, title: "Great for daily runs", body: "Comfortable straight out of the box. I've done about 150 km and they still feel fresh." },
    { rating: 4, title: "Good, runs slightly small", body: "Nice cushioning and grip. I'd go half a size up." },
    { rating: 5, title: "Light and fast", body: "Used them for a 10k race and set a personal best. Very happy." },
    { rating: 3, title: "OK but firm", body: "Decent shoe, but firmer than I expected. Fine for short runs." },
    { rating: 4, title: "Solid all-rounder", body: "Works for easy runs and intervals. The upper breathes well in summer." },
  ],
  trail_shoes: [
    { rating: 5, title: "Excellent grip", body: "Grips well on wet roots and rocks. My feet stayed comfortable on a 25 km trail run." },
    { rating: 4, title: "Protective", body: "Rock plate does its job. Slightly heavy on flat sections." },
    { rating: 5, title: "Perfect for the mountains", body: "Stable on descents and the lacing holds the foot well." },
    { rating: 3, title: "Narrow fit", body: "Good shoe but quite narrow for my feet." },
  ],
  football_boots: [
    { rating: 5, title: "Great touch on the ball", body: "Comfortable from the first training session. Good grip on dry grass." },
    { rating: 4, title: "Good boots", body: "Solid boots for the price. Took two sessions to break in." },
    { rating: 4, title: "Happy with them", body: "Studs work well on our club pitch. True to size." },
  ],
  socks: [
    { rating: 5, title: "No blisters", body: "Did a half marathon in these, no blisters at all." },
    { rating: 4, title: "Comfortable", body: "Soft and they stay in place. Washed many times without holes." },
    { rating: 4, title: "Good value", body: "Good quality for the price." },
    { rating: 3, title: "Bit thin", body: "Fine for summer, a bit thin for winter." },
  ],
  apparel: [
    { rating: 5, title: "Fits perfectly", body: "True to size and very comfortable on long runs." },
    { rating: 4, title: "Nice quality", body: "Good fabric and finish. Colour is slightly darker than in the photo." },
    { rating: 4, title: "Does the job", body: "Light, dries quickly, no chafing." },
  ],
  electronics: [
    { rating: 5, title: "Works great", body: "Easy setup, pairs quickly and the battery lasts as advertised." },
    { rating: 4, title: "Good device", body: "Does what it should. The app could be a bit more intuitive." },
    { rating: 4, title: "Reliable", body: "Using it daily for two months without any problems." },
    { rating: 2, title: "Connection drops", body: "Occasionally loses connection. Support was helpful though." },
  ],
  groceries: [
    { rating: 5, title: "Tasty", body: "Very good quality, will order again." },
    { rating: 4, title: "Good", body: "Fresh and well packed." },
    { rating: 5, title: "Favourite", body: "Our household favourite. Good value." },
  ],
  subscriptions: [
    { rating: 5, title: "Worth it", body: "Arrives on time every month. Easy to pause when I'm away." },
    { rating: 4, title: "Good subscription", body: "Nice selection. Cancelling is easy if you need to." },
    { rating: 4, title: "Happy so far", body: "Three months in and happy with it." },
  ],
};

const SHADY: ReviewTemplate[] = [
  { rating: 5, title: "Very good product!!!", body: "Very good product, fast shipping, recommend seller!!!" },
  { rating: 5, title: "Excellent", body: "Excellent quality 100% same as original. Thank you!" },
  { rating: 5, title: "Super", body: "Super price super product. A+++" },
  { rating: 5, title: "Best", body: "Best shop, best price. Will buy again." },
];

// Small seeded random generator (mulberry32) so results are repeatable.
function rng(seedText: string) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeedReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  daysAgo: number;
};

export function generateReviews(product: SeedProduct): SeedReview[] {
  const rand = rng(product.id);
  const isShady = product.merchantId === "mer_topdeal";
  const isNew = product.merchantId === "mer_fernweh";
  const pool = isShady ? SHADY : POOLS[product.category] ?? POOLS.groceries;
  const count = isNew ? 1 : 2 + Math.floor(rand() * 4); // 2..5 (new merchant: 1)
  const usedTemplates = new Set<number>();
  const usedAuthors = new Set<number>();
  const out: SeedReview[] = [];
  for (let i = 0; i < count; i++) {
    let t = Math.floor(rand() * pool.length);
    while (usedTemplates.has(t) && usedTemplates.size < pool.length) t = (t + 1) % pool.length;
    usedTemplates.add(t);
    let a = Math.floor(rand() * AUTHORS.length);
    while (usedAuthors.has(a)) a = (a + 1) % AUTHORS.length;
    usedAuthors.add(a);
    const tpl = pool[t];
    out.push({
      id: `rev_${product.id.slice(4)}_${i + 1}`,
      productId: product.id,
      author: AUTHORS[a],
      rating: tpl.rating,
      title: tpl.title,
      body: tpl.body,
      daysAgo: isNew ? 2 + i : 5 + Math.floor(rand() * 300),
    });
  }
  return out;
}
