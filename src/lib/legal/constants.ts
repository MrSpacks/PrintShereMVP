/** Operator / Impressum data for PrintShare (CZ) */
export const PLATFORM_OPERATOR = {
  legalName: "Sergei Petukhov",
  form: "fyzicka_osoba" as const,
  ico: "19618492",
  dic: null as string | null,
  isVatPayer: false,
  addressLine: "Radčina 492/20",
  cityLine: "161 00 Praha 6 - Liboc",
  country: "Česká republika",
  email: "web.mr.spacks@gmail.com",
  /** Optional — omitted from public Impressum unless required */
  phone: "+420773947784",
  showPhoneInFooter: false,
  brandName: "PrintShare",
} as const;

/** Bump when VOP / privacy / complaints text materially changes */
export const LEGAL_DOCS_VERSION = "2026-07-20";

export const LEGAL_PATHS = {
  terms: "/legal/terms",
  privacy: "/legal/privacy",
  complaints: "/legal/complaints",
  cookies: "/legal/cookies",
} as const;

/** Příležitostný příjem — annual limit without IČO (CZK) */
export const OCCASIONAL_INCOME_LIMIT_CZK = 50_000;
