interface PriceTagProps {
  price: number;
  compareAtPrice?: number;
  className?: string;
  /** Show the derived "-N%" figure next to the struck-through price (default true). */
  showDiscount?: boolean;
  /** Where the struck-through compare price sits: Modave cards put it before the sale price. */
  comparePosition?: "before" | "after";
  /** Text size of the selling price (default "sm" keeps the original look). */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = { sm: "", md: "text-base", lg: "text-xl sm:text-2xl" } as const;
const COMPARE_SIZE_CLASS = { sm: "text-[11px]", md: "text-sm", lg: "text-base" } as const;

export default function PriceTag({
  price,
  compareAtPrice,
  className = "",
  showDiscount = true,
  comparePosition = "after",
  size = "sm",
}: PriceTagProps) {
  const hasCompare = !!compareAtPrice && compareAtPrice > price;
  const discount = hasCompare ? Math.round((1 - price / compareAtPrice!) * 100) : 0;
  const compare = hasCompare ? (
    <span className={`${COMPARE_SIZE_CLASS[size]} text-ink-muted line-through`}>
      <span className="sr-only">Was </span>₹{compareAtPrice!.toLocaleString("en-IN")}
    </span>
  ) : null;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0 ${className}`}>
      {comparePosition === "before" && compare}
      <span className={`font-sans font-semibold ${SIZE_CLASS[size]} ${hasCompare ? "text-secondary" : "text-ink"}`}>
        {hasCompare && <span className="sr-only">Now </span>}₹{price.toLocaleString("en-IN")}
      </span>
      {comparePosition === "after" && compare}
      {hasCompare && showDiscount && discount > 0 && (
        <span className={`${COMPARE_SIZE_CLASS[size]} font-medium text-secondary`}>-{discount}%</span>
      )}
    </div>
  );
}
