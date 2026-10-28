import Link from "next/link";
import Image from "next/image";

// The owner's primary logo (public/SaffronVastra.png), prepared as transparent web assets in public/images/brand/:
// "full" is the complete lockup (SV monogram over the SaffronVastra wordmark), "wordmark" is the name line alone
// for compact bars where the full lockup would be too small to read, "mark" is the SV monogram.
const ASSETS = {
  full: { src: "/images/brand/saffronvastra-logo.png", width: 800, height: 585 },
  wordmark: { src: "/images/brand/saffronvastra-wordmark.png", width: 900, height: 159 },
  mark: { src: "/images/brand/saffronvastra-mark.png", width: 512, height: 512 },
  // the floral SV monogram used in the header
  header: { src: "/images/brand/saffronvastra-header.png", width: 480, height: 375 },
} as const;

const HEIGHTS = {
  full: { sm: "h-16", md: "h-20", lg: "h-24" },
  wordmark: { sm: "h-[22px]", md: "h-6", lg: "h-7" },
  mark: { sm: "h-8", md: "h-10", lg: "h-12" },
  header: { sm: "h-9", md: "h-11", lg: "h-14" },
} as const;

interface LogoProps {
  variant?: "light" | "dark"; // "light" = for dark backgrounds (the ink artwork is inverted to white)
  kind?: keyof typeof ASSETS;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}

export default function Logo({ variant = "dark", kind = "wordmark", className = "", size = "md", priority = false }: LogoProps) {
  const asset = ASSETS[kind];
  return (
    <Link
      href="/"
      className={`inline-flex items-center group transition-opacity hover:opacity-80 ${className}`}
      aria-label="SaffronVastra home"
    >
      <Image
        src={asset.src}
        alt="SaffronVastra"
        width={asset.width}
        height={asset.height}
        priority={priority}
        className={`${HEIGHTS[kind][size]} w-auto select-none ${variant === "light" ? "invert" : ""}`}
      />
    </Link>
  );
}
