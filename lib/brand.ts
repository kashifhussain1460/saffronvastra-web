// Single source of truth for the brand name and brand-owned addresses. Import from here; never type them inline.
export const BRAND = {
  name: "SaffronVastra",
  domain: "saffronvastra.com",
  // Legal identity and contact details, as published in the Privacy Policy.
  displayName: "Saffron Vastra",
  legalName: "Saffron Threads",
  url: "https://saffronvastra.com",
  supportEmail: "support@saffronvastra.com",
  phone: "+91 86198 76160",
  address: "125, Abdul Hamid Nagar, Panch Batti, M. I. Road, Jaipur, Rajasthan, India",
  grievanceContact: "Arshad Hussain Naqvi",
} as const;

export const BRAND_NAME_UPPER = BRAND.name.toUpperCase();
