"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

// Pages with their own fixed bottom bars keep that space free.
const HIDDEN_ON = ["/cart", "/checkout", "/products/", "/order-confirmation"];

// Modave "back to top" button: a 48px dark circle bottom-right, shown once the page has scrolled.
// Below lg it sits above the fixed mobile toolbar.
export default function ScrollTopButton() {
  const pathname = usePathname() || "/";
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`))) return null;
  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 xl:right-10 bottom-[calc(var(--bottom-nav-h,0px)+16px)] xl:bottom-10 z-30 w-12 h-12 rounded-full bg-primary text-on-primary inline-flex items-center justify-center hover:bg-primary-hover transition-[opacity,transform,background-color] duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp aria-hidden="true" className="w-5 h-5" />
    </button>
  );
}
