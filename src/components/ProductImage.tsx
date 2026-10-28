// Generated product illustrations, so there are no real product photos or logos anywhere.
const COLOURS: Record<string, string> = {
  black: "#1f2937", white: "#f8fafc", blue: "#2563eb", grey: "#9ca3af", red: "#dc2626",
  green: "#16a34a", orange: "#ea580c", yellow: "#eab308", purple: "#9333ea", assorted: "#64748b",
};

function Shape({ category, fill }: { category: string; fill: string }) {
  const stroke = "#334155";
  switch (category) {
    case "running_shoes":
    case "trail_shoes":
    case "football_boots":
      return (
        <g stroke={stroke} strokeWidth="3" strokeLinejoin="round">
          <path d="M20 110 L22 70 Q40 62 52 48 L70 52 Q78 76 110 82 L168 92 Q182 96 180 110 Z" fill={fill} />
          <path d="M18 110 H182 Q182 122 168 122 H30 Q18 122 18 110 Z" fill={category === "trail_shoes" ? "#475569" : "#e2e8f0"} />
          {category === "football_boots" &&
            [40, 70, 120, 150, 168].map((x) => <rect key={x} x={x - 4} y="122" width="8" height="9" rx="2" fill="#475569" />)}
          {category === "trail_shoes" &&
            [30, 50, 70, 90, 110, 130, 150, 170].map((x) => <path key={x} d={`M${x - 5} 122 l5 6 l5 -6`} fill="#475569" />)}
          <path d="M70 60 L96 74 M66 68 L90 80" fill="none" />
        </g>
      );
    case "socks":
      return (
        <path d="M80 20 H120 V100 Q120 110 130 116 L160 132 Q172 140 164 152 Q156 162 142 156 L92 132 Q80 126 80 112 Z"
          fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      );
    case "apparel":
      return (
        <path d="M70 30 L50 40 L28 70 L48 82 L60 66 V150 H140 V66 L152 82 L172 70 L150 40 L130 30 Q100 52 70 30 Z"
          fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      );
    case "electronics":
      return (
        <g stroke={stroke} strokeWidth="3">
          <rect x="80" y="18" width="40" height="124" rx="10" fill="#cbd5e1" />
          <rect x="62" y="48" width="76" height="64" rx="16" fill={fill} />
          <rect x="72" y="58" width="56" height="44" rx="8" fill="#0f172a" />
          <path d="M84 84 l10 -10 l8 8 l12 -14" stroke="#38bdf8" fill="none" />
        </g>
      );
    case "groceries":
      return (
        <g stroke={stroke} strokeWidth="3" strokeLinejoin="round">
          <path d="M50 60 H150 L140 150 H60 Z" fill="#fde68a" />
          <path d="M75 60 Q75 30 100 30 Q125 30 125 60" fill="none" />
          <circle cx="85" cy="100" r="14" fill="#86efac" />
          <circle cx="115" cy="110" r="14" fill="#fca5a5" />
        </g>
      );
    default: // subscriptions
      return (
        <g stroke={stroke} strokeWidth="3" fill="none">
          <rect x="45" y="40" width="110" height="90" rx="10" fill="#dbeafe" />
          <path d="M80 85 a20 20 0 1 1 6 14" strokeWidth="5" stroke="#1d4ed8" />
          <path d="M78 96 l8 4 l2 -9" stroke="#1d4ed8" strokeWidth="4" />
        </g>
      );
  }
}

export function ProductImage({ category, colour, className = "" }: { category: string; colour?: string | null; className?: string }) {
  const fill = COLOURS[colour ?? ""] ?? "#94a3b8";
  return (
    <svg viewBox="0 0 200 170" role="img" aria-label={`${colour ?? ""} ${category.replace("_", " ")} illustration`}
      className={`w-full bg-slate-50 ${className}`}>
      <Shape category={category} fill={fill} />
    </svg>
  );
}
