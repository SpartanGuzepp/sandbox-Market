// 60 invented products. Prices are in EUR, written in euros here and converted to cents when seeding.
import type { ProductAttributes } from "../schema";

export type SeedProduct = {
  id: string;
  merchantId: string;
  title: string;
  category: string;
  attributes: ProductAttributes;
  price: number;
  shipping: number;
  description: string;
  isRecurring?: boolean;
  billingInterval?: "month";
};

const SHOE = ["38", "39", "40", "41", "42", "43", "44", "45", "46"];
const JUNIOR = ["30", "31", "32", "33", "34", "35", "36", "37"];
const SOCK = ["35-38", "39-42", "43-46"];
const APPAREL = ["XS", "S", "M", "L", "XL"];

export const seedProducts: SeedProduct[] = [
  // ---------- Alpenstride Sports (reputable sportswear) ----------
  {
    id: "prd_alp_run_001", merchantId: "mer_alpenstride", title: "Alpenstride Glide 3 Running Shoe", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "engineered mesh", weight_g: 265, drop_mm: 8, surface: "road" },
    price: 129, shipping: 4.9,
    description: "Our everyday road trainer. Soft foam midsole, breathable mesh upper and a durable rubber outsole for daily miles.",
  },
  {
    id: "prd_alp_run_002", merchantId: "mer_alpenstride", title: "Alpenstride Tempo Racer", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "knit upper", weight_g: 215, drop_mm: 6, surface: "road" },
    price: 159, shipping: 4.9,
    description: "Lightweight and responsive shoe for tempo runs and races up to the half marathon.",
  },
  {
    id: "prd_alp_run_003", merchantId: "mer_alpenstride", title: "Alpenstride Cloudline Daily Trainer", category: "running_shoes",
    attributes: { colour: "white", sizes: SHOE, material: "engineered mesh", weight_g: 280, drop_mm: 10, surface: "road" },
    price: 119, shipping: 4.9,
    description: "Extra-cushioned trainer for easy days and long runs. Wide toe box.",
  },
  {
    id: "prd_alp_run_004", merchantId: "mer_alpenstride", title: "Alpenstride Glide 3 Running Shoe, Ocean Blue", category: "running_shoes",
    attributes: { colour: "blue", sizes: SHOE, material: "engineered mesh", weight_g: 265, drop_mm: 8, surface: "road" },
    price: 129, shipping: 4.9,
    description: "The Glide 3 in Ocean Blue. Same soft foam midsole and breathable upper as the original colourway.",
  },
  {
    id: "prd_alp_run_005", merchantId: "mer_alpenstride", title: "Alpenstride Carbon Racer Elite", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "monofilament mesh, carbon plate", weight_g: 195, drop_mm: 8, surface: "road" },
    price: 229, shipping: 0,
    description: "Our premium race-day shoe with a full-length carbon plate and high-rebound foam. Free shipping.",
  },
  {
    id: "prd_alp_fb_001", merchantId: "mer_alpenstride", title: "Alpenstride Strike FG Football Boot", category: "football_boots",
    attributes: { colour: "black", sizes: SHOE, material: "synthetic upper", surface: "firm ground", studs: "moulded" },
    price: 139, shipping: 4.9,
    description: "Firm-ground football boot with a grippy textured upper for close ball control.",
  },
  {
    id: "prd_alp_fb_002", merchantId: "mer_alpenstride", title: "Alpenstride Strike Junior Football Boot", category: "football_boots",
    attributes: { colour: "red", sizes: JUNIOR, material: "synthetic upper", surface: "firm ground", studs: "moulded" },
    price: 69, shipping: 4.9,
    description: "The Strike for young players. Hook-and-loop strap, firm-ground studs.",
  },
  {
    id: "prd_alp_fb_003", merchantId: "mer_alpenstride", title: "Alpenstride Pitchmaster SG Football Boot", category: "football_boots",
    attributes: { colour: "white", sizes: SHOE, material: "leather upper", surface: "soft ground", studs: "screw-in metal" },
    price: 159, shipping: 4.9,
    description: "Soft-ground boot with screw-in studs for wet natural grass. Premium leather upper.",
  },
  {
    id: "prd_alp_trl_001", merchantId: "mer_alpenstride", title: "Alpenstride Ridge Trail Shoe", category: "trail_shoes",
    attributes: { colour: "grey", sizes: SHOE, material: "ripstop mesh", weight_g: 300, lug_mm: 4, surface: "trail" },
    price: 149, shipping: 4.9,
    description: "Grippy, protective trail shoe with 4 mm lugs and a rock plate for technical mountain paths.",
  },
  {
    id: "prd_alp_trl_002", merchantId: "mer_alpenstride", title: "Alpenstride Ridge Waterproof Trail Shoe", category: "trail_shoes",
    attributes: { colour: "green", sizes: SHOE, material: "waterproof membrane", weight_g: 330, lug_mm: 5, surface: "trail" },
    price: 169, shipping: 4.9,
    description: "The Ridge with a waterproof membrane for wet and muddy days.",
  },
  {
    id: "prd_alp_trl_003", merchantId: "mer_alpenstride", title: "Alpenstride Scree Junior Trail Shoe", category: "trail_shoes",
    attributes: { colour: "orange", sizes: JUNIOR, material: "ripstop mesh", lug_mm: 4, surface: "trail" },
    price: 79, shipping: 4.9,
    description: "A sturdy trail shoe for kids who like to explore. Quick-lace system.",
  },
  {
    id: "prd_alp_sock_001", merchantId: "mer_alpenstride", title: "Alpenstride Run Socks 3-Pack", category: "socks",
    attributes: { colour: "black", sizes: SOCK, material: "recycled polyester", pack: 3 },
    price: 19.9, shipping: 4.9,
    description: "Lightweight, seamless running socks with arch support. Pack of three pairs.",
  },
  {
    id: "prd_alp_sock_002", merchantId: "mer_alpenstride", title: "Alpenstride Merino Trail Socks", category: "socks",
    attributes: { colour: "grey", sizes: SOCK, material: "merino wool blend", pack: 1 },
    price: 24.9, shipping: 4.9,
    description: "Cushioned merino socks that stay warm when wet. Odour-resistant.",
  },
  {
    id: "prd_alp_app_001", merchantId: "mer_alpenstride", title: "Alpenstride Featherweight Running Jacket", category: "apparel",
    attributes: { colour: "blue", sizes: APPAREL, material: "ripstop nylon", weight_g: 120 },
    price: 119, shipping: 4.9,
    description: "Wind- and shower-resistant jacket that packs into its own pocket.",
  },
  {
    id: "prd_alp_app_002", merchantId: "mer_alpenstride", title: "Alpenstride Tech Tee", category: "apparel",
    attributes: { colour: "white", sizes: APPAREL, material: "recycled polyester" },
    price: 39, shipping: 4.9,
    description: "Quick-dry running t-shirt with flat seams.",
  },
  {
    id: "prd_alp_app_003", merchantId: "mer_alpenstride", title: "Alpenstride Split Shorts", category: "apparel",
    attributes: { colour: "black", sizes: APPAREL, material: "polyester, inner brief" },
    price: 45, shipping: 4.9,
    description: "Race shorts with side splits, an inner brief and a zipped back pocket.",
  },
  {
    id: "prd_alp_app_004", merchantId: "mer_alpenstride", title: "Alpenstride Thermal Tights", category: "apparel",
    attributes: { colour: "black", sizes: APPAREL, material: "brushed elastane" },
    price: 69, shipping: 4.9,
    description: "Brushed-inside tights for cold winter runs. Reflective details.",
  },

  {
    id: "prd_alp_sub_001", merchantId: "mer_alpenstride", title: "Alpenstride Run Club Membership (monthly)", category: "subscriptions",
    attributes: { material: "membership", term: "monthly, cancel any time" },
    price: 14.9, shipping: 0, isRecurring: true, billingInterval: "month",
    description: "Weekly group runs, 10% off all gear and a members-only training plan. Billed monthly until cancelled.",
  },

  // ---------- Voltigo Electronics (reputable electronics) ----------
  {
    id: "prd_vol_el_001", merchantId: "mer_voltigo", title: "Voltigo Pulse GPS Running Watch", category: "electronics",
    attributes: { colour: "black", material: "polymer case, silicone strap", battery_days: 14, gps: true },
    price: 249, shipping: 5.9,
    description: "GPS running watch with wrist heart rate, training load and 14-day battery life.",
  },
  {
    id: "prd_vol_el_002", merchantId: "mer_voltigo", title: "Voltigo Pulse Lite Fitness Band", category: "electronics",
    attributes: { colour: "black", material: "silicone", battery_days: 10, gps: false },
    price: 49, shipping: 5.9,
    description: "Slim fitness band that tracks steps, sleep and heart rate.",
  },
  {
    id: "prd_vol_el_003", merchantId: "mer_voltigo", title: "Voltigo SoundLoop Sport Earbuds", category: "electronics",
    attributes: { colour: "white", material: "plastic, silicone ear hooks", battery_hours: 8, water_resistance: "IPX5" },
    price: 89, shipping: 5.9,
    description: "Wireless sport earbuds with secure ear hooks and sweat resistance.",
  },
  {
    id: "prd_vol_el_004", merchantId: "mer_voltigo", title: "Voltigo HeartSync Chest Strap", category: "electronics",
    attributes: { colour: "black", sizes: ["S-M", "L-XL"], material: "textile strap" },
    price: 59, shipping: 5.9,
    description: "Accurate chest heart-rate sensor that pairs with watches and apps.",
  },
  {
    id: "prd_vol_el_005", merchantId: "mer_voltigo", title: "Voltigo PowerCell 10000 Power Bank", category: "electronics",
    attributes: { colour: "grey", material: "aluminium", capacity_mah: 10000 },
    price: 39, shipping: 5.9,
    description: "Compact 10,000 mAh power bank with USB-C fast charging.",
  },
  {
    id: "prd_vol_el_006", merchantId: "mer_voltigo", title: "Voltigo Trailbeam Head Torch", category: "electronics",
    attributes: { colour: "black", material: "plastic, elastic band", lumens: 400 },
    price: 34.9, shipping: 5.9,
    description: "400-lumen rechargeable head torch for early-morning and night runs.",
  },
  {
    id: "prd_vol_el_007", merchantId: "mer_voltigo", title: "Voltigo Arcwave Bluetooth Speaker", category: "electronics",
    attributes: { colour: "blue", material: "fabric, rubber", battery_hours: 12, water_resistance: "IPX7" },
    price: 79, shipping: 5.9,
    description: "Waterproof portable speaker with 12 hours of playback.",
  },
  {
    id: "prd_vol_el_008", merchantId: "mer_voltigo", title: "Voltigo USB-C Fast Charger 65W", category: "electronics",
    attributes: { colour: "white", material: "plastic", watts: 65 },
    price: 29.9, shipping: 5.9,
    description: "65 W USB-C charger for phones, watches and laptops.",
  },
  {
    id: "prd_vol_sub_001", merchantId: "mer_voltigo", title: "Voltigo Pulse Premium Coaching Plan (monthly)", category: "subscriptions",
    attributes: { material: "digital service", term: "monthly, cancel any time" },
    price: 9.9, shipping: 0, isRecurring: true, billingInterval: "month",
    description: "Personalised training plans and recovery advice in the Voltigo app. Billed every month until cancelled.",
  },

  // ---------- Lindenhof Market (reputable general store) ----------
  {
    id: "prd_lin_gro_001", merchantId: "mer_lindenhof", title: "Lindenhof Alpine Oat Porridge 1 kg", category: "groceries",
    attributes: { material: "wholegrain oats", weight_g: 1000, vegan: true },
    price: 6.9, shipping: 6.9,
    description: "Wholegrain oat flakes from mountain farms. Ready in three minutes.",
  },
  {
    id: "prd_lin_gro_002", merchantId: "mer_lindenhof", title: "Lindenhof Dark Chocolate 72% 100 g", category: "groceries",
    attributes: { material: "cocoa, sugar, cocoa butter", weight_g: 100, vegan: true },
    price: 3.5, shipping: 6.9,
    description: "Smooth dark chocolate with 72% cocoa.",
  },
  {
    id: "prd_lin_gro_003", merchantId: "mer_lindenhof", title: "Lindenhof Energy Bar Box (12 × 40 g)", category: "groceries",
    attributes: { material: "oats, dates, nuts", weight_g: 480, flavour: "apricot almond" },
    price: 18.9, shipping: 6.9,
    description: "Twelve soft energy bars for long runs and hikes.",
  },
  {
    id: "prd_lin_gro_004", merchantId: "mer_lindenhof", title: "Lindenhof Electrolyte Tablets, Lemon", category: "groceries",
    attributes: { material: "effervescent tablets", count: 20, flavour: "lemon" },
    price: 8.9, shipping: 6.9,
    description: "Twenty effervescent electrolyte tablets. Low sugar.",
  },
  {
    id: "prd_lin_gro_005", merchantId: "mer_lindenhof", title: "Lindenhof Mountain Honey 500 g", category: "groceries",
    attributes: { material: "honey", weight_g: 500 },
    price: 12.5, shipping: 6.9,
    description: "Creamy blossom honey from alpine beekeepers.",
  },
  {
    id: "prd_lin_gro_006", merchantId: "mer_lindenhof", title: "Lindenhof Whole Bean Coffee, Medium Roast 1 kg", category: "groceries",
    attributes: { material: "arabica coffee beans", weight_g: 1000 },
    price: 24.9, shipping: 6.9,
    description: "Balanced medium roast with notes of nuts and caramel.",
  },
  {
    id: "prd_lin_gro_007", merchantId: "mer_lindenhof", title: "Lindenhof Sparkling Water 6 × 1.5 L", category: "groceries",
    attributes: { material: "mineral water", volume_l: 9 },
    price: 5.4, shipping: 6.9,
    description: "Six bottles of naturally sparkling mineral water.",
  },
  {
    id: "prd_lin_gro_008", merchantId: "mer_lindenhof", title: "Lindenhof Trail Mix 500 g", category: "groceries",
    attributes: { material: "nuts, raisins, seeds", weight_g: 500 },
    price: 9.9, shipping: 6.9,
    description: "Salted nuts, raisins and seeds. The classic hiking snack.",
  },
  {
    id: "prd_lin_run_001", merchantId: "mer_lindenhof", title: "Lindenhof Basic Running Shoe", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "mesh", weight_g: 300, surface: "road" },
    price: 49.9, shipping: 6.9,
    description: "A simple, comfortable running shoe for beginners and everyday wear.",
  },
  {
    id: "prd_lin_sock_001", merchantId: "mer_lindenhof", title: "Lindenhof Everyday Cotton Socks 5-Pack", category: "socks",
    attributes: { colour: "black", sizes: SOCK, material: "cotton blend", pack: 5 },
    price: 14.9, shipping: 6.9,
    description: "Soft everyday cotton socks. Five pairs.",
  },
  {
    id: "prd_lin_sock_002", merchantId: "mer_lindenhof", title: "Lindenhof Wool Hiking Socks", category: "socks",
    attributes: { colour: "grey", sizes: SOCK, material: "wool blend", pack: 1 },
    price: 17.9, shipping: 6.9,
    description: "Warm, cushioned hiking socks with reinforced heel and toe.",
  },
  {
    id: "prd_lin_app_001", merchantId: "mer_lindenhof", title: "Lindenhof Basic Hoodie", category: "apparel",
    attributes: { colour: "grey", sizes: APPAREL, material: "organic cotton" },
    price: 49, shipping: 6.9,
    description: "Comfortable organic-cotton hoodie with a kangaroo pocket.",
  },
  {
    id: "prd_lin_app_002", merchantId: "mer_lindenhof", title: "Lindenhof Rain Poncho", category: "apparel",
    attributes: { colour: "yellow", sizes: ["One size"], material: "PVC-free coated polyester" },
    price: 19.9, shipping: 6.9,
    description: "Lightweight poncho that fits over a backpack.",
  },
  {
    id: "prd_lin_sub_001", merchantId: "mer_lindenhof", title: "Lindenhof Coffee Club, 1 kg monthly", category: "subscriptions",
    attributes: { material: "arabica coffee beans", term: "monthly, cancel any time" },
    price: 22.9, shipping: 0, isRecurring: true, billingInterval: "month",
    description: "One kilo of freshly roasted beans delivered every month. Billed monthly until cancelled.",
  },
  {
    id: "prd_lin_sub_002", merchantId: "mer_lindenhof", title: "Lindenhof Sock Club, 3 pairs monthly", category: "subscriptions",
    attributes: { colour: "assorted", sizes: SOCK, term: "monthly, cancel any time" },
    price: 12.9, shipping: 0, isRecurring: true, billingInterval: "month",
    description: "Three pairs of fun everyday socks every month. Billed monthly until cancelled.",
  },
  {
    id: "prd_lin_sub_003", merchantId: "mer_lindenhof", title: "Lindenhof Protein Snack Box, monthly", category: "subscriptions",
    attributes: { material: "assorted snacks", term: "monthly, cancel any time" },
    price: 29.9, shipping: 0, isRecurring: true, billingInterval: "month",
    description: "A monthly box of high-protein bars and snacks. Billed monthly until cancelled.",
  },

  // ---------- Fernweh Trail Co. (legitimate, brand new) ----------
  {
    id: "prd_fer_trl_001", merchantId: "mer_fernweh", title: "Fernweh Kammweg Trail Runner", category: "trail_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "recycled ripstop", weight_g: 290, lug_mm: 4, surface: "trail" },
    price: 139, shipping: 7.5,
    description: "Handmade in small batches. A nimble trail runner for forest paths and ridgelines.",
  },
  {
    id: "prd_fer_trl_002", merchantId: "mer_fernweh", title: "Fernweh Hochpfad Trail Shoe", category: "trail_shoes",
    attributes: { colour: "orange", sizes: SHOE, material: "abrasion-resistant mesh", weight_g: 315, lug_mm: 5, surface: "trail" },
    price: 155, shipping: 7.5,
    description: "Our most protective shoe, for rocky alpine trails.",
  },
  {
    id: "prd_fer_trl_003", merchantId: "mer_fernweh", title: "Fernweh Waldlauf Light Trail Shoe", category: "trail_shoes",
    attributes: { colour: "green", sizes: SHOE, material: "breathable mesh", weight_g: 260, lug_mm: 3, surface: "trail" },
    price: 119, shipping: 7.5,
    description: "Light and flexible, made for soft forest ground.",
  },
  {
    id: "prd_fer_trl_004", merchantId: "mer_fernweh", title: "Fernweh Kammweg Trail Runner, Women's Fit", category: "trail_shoes",
    attributes: { colour: "purple", sizes: ["36", "37", "38", "39", "40", "41", "42"], material: "recycled ripstop", weight_g: 270, lug_mm: 4, surface: "trail" },
    price: 139, shipping: 7.5,
    description: "The Kammweg on a narrower last with a lower-volume heel.",
  },
  {
    id: "prd_fer_run_001", merchantId: "mer_fernweh", title: "Fernweh Asphalt Road Shoe", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "recycled knit", weight_g: 255, drop_mm: 8, surface: "road" },
    price: 109, shipping: 7.5,
    description: "Our first road shoe: simple, durable and made with recycled materials.",
  },
  {
    id: "prd_fer_sock_001", merchantId: "mer_fernweh", title: "Fernweh Trail Socks 2-Pack", category: "socks",
    attributes: { colour: "green", sizes: SOCK, material: "merino blend", pack: 2 },
    price: 16, shipping: 7.5,
    description: "Two pairs of merino-blend trail socks.",
  },
  {
    id: "prd_fer_app_001", merchantId: "mer_fernweh", title: "Fernweh Merino Long Sleeve", category: "apparel",
    attributes: { colour: "grey", sizes: APPAREL, material: "merino wool" },
    price: 79, shipping: 7.5,
    description: "Fine merino base layer for cool mornings on the trail.",
  },

  // ---------- TopDeal Warehouse 24 (shady) ----------
  {
    id: "prd_top_run_001", merchantId: "mer_topdeal", title: "PREMIUM Carbon Racer Elite PRO Running Shoe -85% SALE", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "premium material" },
    price: 29.9, shipping: 0,
    description: "Top quality premium carbon racing shoe!!! Same as original. 100% authentic. Limited stock, order now before price goes up!",
  },
  {
    id: "prd_top_run_002", merchantId: "mer_topdeal", title: "Black Running Shoe Pro Speed Men Women", category: "football_boots",
    attributes: { colour: "black", sizes: SHOE, material: "synthetic", surface: "firm ground", studs: "13 moulded studs" },
    price: 34.9, shipping: 0,
    description: "Pro speed black running shoe for men and women. Lightweight, great grip, fast delivery!",
  },
  {
    id: "prd_top_run_003", merchantId: "mer_topdeal", title: "Ultra Light Running Shoe Breathable", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "mesh" },
    price: 19.9, shipping: 0,
    description: "Ultra light breathable running shoe. Best price on the market. Free shipping!",
  },
  {
    id: "prd_top_trl_001", merchantId: "mer_topdeal", title: "Waterproof Trail Running Shoe Outdoor", category: "trail_shoes",
    attributes: { colour: "grey", sizes: SHOE, material: "waterproof" },
    price: 39.9, shipping: 0,
    description: "Waterproof outdoor trail shoe for all terrain. Super deal price!",
  },
  {
    id: "prd_top_el_001", merchantId: "mer_topdeal", title: "Wireless Earbuds Pro Max Bass Sport", category: "electronics",
    attributes: { colour: "black", material: "plastic" },
    price: 14.9, shipping: 0,
    description: "Pro max bass wireless earbuds. Best sound. 1000 hours battery.",
  },
  {
    id: "prd_top_app_001", merchantId: "mer_topdeal", title: "Running Jacket Windproof Waterproof Premium", category: "apparel",
    attributes: { colour: "blue", sizes: APPAREL, material: "premium fabric" },
    price: 17.9, shipping: 0,
    description: "Premium windproof and waterproof jacket. Top quality, low price!",
  },

  // ---------- AIpenstride Sports (look-alike of Alpenstride) ----------
  {
    id: "prd_aip_run_001", merchantId: "mer_aipenstride", title: "Alpenstride Glide 3 Running Shoe", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "engineered mesh", weight_g: 265, drop_mm: 8, surface: "road" },
    price: 99, shipping: 4.9,
    description: "Our everyday road trainer. Soft foam midsole, breathable mesh upper and a durable rubber outsole for daily miles.",
  },
  {
    id: "prd_aip_run_002", merchantId: "mer_aipenstride", title: "Alpenstride Carbon Racer Elite", category: "running_shoes",
    attributes: { colour: "black", sizes: SHOE, material: "monofilament mesh, carbon plate", weight_g: 195, drop_mm: 8, surface: "road" },
    price: 149, shipping: 0,
    description: "Our premium race-day shoe with a full-length carbon plate and high-rebound foam. Free shipping.",
  },
  {
    id: "prd_aip_fb_001", merchantId: "mer_aipenstride", title: "Alpenstride Strike FG Football Boot", category: "football_boots",
    attributes: { colour: "black", sizes: SHOE, material: "synthetic upper", surface: "firm ground", studs: "moulded" },
    price: 99, shipping: 4.9,
    description: "Firm-ground football boot with a grippy textured upper for close ball control.",
  },
  {
    id: "prd_aip_sock_001", merchantId: "mer_aipenstride", title: "Alpenstride Run Socks 3-Pack", category: "socks",
    attributes: { colour: "black", sizes: SOCK, material: "recycled polyester", pack: 3 },
    price: 14.9, shipping: 4.9,
    description: "Lightweight, seamless running socks with arch support. Pack of three pairs.",
  },
];
