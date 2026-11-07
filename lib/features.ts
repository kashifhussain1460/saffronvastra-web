// Feature switches for the storefront and admin panel.

/**
 * Colour variants are TEMPORARILY switched off: only size variants are shown and chosen.
 *
 * While this is false:
 *  - the admin product form hides the colour editor and saves every size under one default colour
 *    (DEFAULT_COLOUR, the same value the API assigns when no colour is sent);
 *  - the storefront hides colour pickers, swatches, the colour filter and colour labels on line items,
 *    and picks the variant by size alone.
 * Existing products keep their stored colours, and orders, cart and the API are unchanged.
 * Set this back to true to restore every colour control; no other change is needed.
 */
export const COLOUR_VARIANTS_ENABLED = false;

/** Colour used for new variants while colour variants are off (matches the API default). */
export const DEFAULT_COLOUR = { name: "Standard", hex: "#1A1A1A" } as const;
