// Single source of truth for the brand name and brand-owned addresses. Import from here; never type them inline.
export const BRAND = {
  name: "SaffronVastra",
  domain: "saffronvastra.com",
  // Legal identity and contact details, as published in the Privacy Policy.
  displayName: "Saffron Vastra",
  legalName: "Saffron Vastra",
  url: "https://saffronvastra.com",
  supportEmail: "support@saffronvastra.com",
  phone: "+91 82093 43979",
  address: "125, Abdul Hameed Nagar, Panch Batti, M.I. Road, Jaipur, Rajasthan 302001, India",
  grievanceContact: "Arshad Hussain Naqvi",
} as const;

export const BRAND_NAME_UPPER = BRAND.name.toUpperCase();
