// Shared luxury form classes for sign-in, registration, and account pages.
// Matches Saffron Vastra luxury editorial styling: soft tinted inputs, black pill buttons.

export const inputBase =
  "block w-full h-12 rounded-lg bg-[#EDEEF2] border border-transparent px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-stone-400 focus:bg-white disabled:opacity-60 read-only:bg-stone-100 font-sans";

export const inputClass = (invalid = false) =>
  `${inputBase} ${invalid ? "!border-red-400 !bg-red-50/50 focus:!border-red-500" : ""}`;

export const textareaClass =
  "block w-full rounded-lg bg-[#EDEEF2] border border-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-stone-400 focus:bg-white resize-none font-sans";

export const labelClass = "block mb-1.5 text-xs font-semibold text-stone-800 font-sans tracking-tight";

export const btnPrimary =
  "w-full inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#18181B] hover:bg-black text-white text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none group cursor-pointer font-sans";

export const btnOutline =
  "w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-stone-300 bg-white text-stone-800 text-xs font-semibold transition-all hover:border-stone-900 hover:text-stone-950 disabled:opacity-50 disabled:pointer-events-none shadow-xs group cursor-pointer font-sans";

/** Small square-cornered dark button used in tables */
export const btnSmall =
  "inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 rounded-lg bg-[#18181B] hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-50 font-sans";

export const btnSmallOutline =
  "inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold transition-colors hover:border-stone-900 hover:text-stone-950 disabled:opacity-50 font-sans";

export const errorText = "mt-1.5 text-xs text-red-600 font-sans";

export const sectionTitle = "font-heading text-2xl lg:text-3xl font-medium text-stone-900 tracking-tight";
