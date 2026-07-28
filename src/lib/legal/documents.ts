export type LegalDocId = "terms" | "privacy" | "complaints" | "cookies";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  effectiveFrom: string;
  sections: LegalSection[];
}

export const legalDocumentsCs: Record<LegalDocId, LegalDocument> = {
  terms: {
    title: "Obchodní podmínky (VOP)",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Provozovatel",
        paragraphs: [
          "Provozovatelem platformy PrintShare je Sergei Petukhov, IČO 19618492, sídlo Radčina 492/20, 161 00 Praha 6 - Liboc, e-mail web.mr.spacks@gmail.com (dále jen „Provozovatel“).",
        ],
      },
      {
        heading: "2. Předmět služby",
        paragraphs: [
          "PrintShare zprostředkovává kontakt mezi zákazníkem a místním výrobcem 3D tisku (makerem). Zákazník nahraje model (např. STL/OBJ), zvolí výrobce a způsob doručení a vytvoří objednávku.",
          "Smlouva o zhotovení výtisku vzniká mezi zákazníkem a makerem. Provozovatel provozuje technickou platformu a může účtovat poplatek za zprostředkování.",
        ],
      },
      {
        heading: "3. Objednávka a cena",
        paragraphs: [
          "Cena zobrazená na mapě je orientační odhad podle objemu modelu, nastavení tisku makera a ceny za gram. Finální cenu a termín potvrzuje maker v rámci objednávky.",
          "Minimální cena objednávky může být stanovena makerem.",
        ],
      },
      {
        heading: "4. Individuální výroba a odstoupení od smlouvy",
        paragraphs: [
          "Výrobek je zhotovován na míru podle podkladů dodaných zákazníkem (custom STL/OBJ a zvolené parametry). V souladu s § 1837 písm. d) občanského zákoníku se na takovou smlouvu neuplatní právo spotřebitele odstoupit od smlouvy do 14 dnů bez uvedení důvodu.",
          "Tím není dotčeno právo na reklamaci vad dle reklamačního řádu.",
        ],
      },
      {
        heading: "5. Povinnosti zákazníka a makera",
        paragraphs: [
          "Zákazník odpovídá za to, že má právo model použít a že obsah modelu neporušuje právní předpisy.",
          "Maker odpovídá za kvalitu tisku dle domluvených parametrů a za správnost svých údajů (včetně IČO, pokud jej uvádí).",
        ],
      },
      {
        heading: "6. Reklamace a spory",
        paragraphs: [
          "Reklamace se řídí Reklamačním řádem. Spotřebitelé mohou využít mimosoudní řešení sporů prostřednictvím České obchodní inspekce (www.coi.cz).",
        ],
      },
    ],
  },
  privacy: {
    title: "Zásady ochrany osobních údajů",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Správce",
        paragraphs: [
          "Správcem osobních údajů je Sergei Petukhov, IČO 19618492, sídlo Radčina 492/20, 161 00 Praha 6 - Liboc, e-mail web.mr.spacks@gmail.com.",
        ],
      },
      {
        heading: "2. Jaké údaje zpracováváme",
        paragraphs: [
          "Účet: jméno, e-mail, heslo (hash) nebo údaje z Google OAuth.",
          "Objednávky: údaje o modelu (metadata), adresa doručení / výdejní místo, komunikace v chatu, platební a stavové údaje.",
          "Maker profil: adresa dílny, ceny, materiály, volitelně IČO.",
        ],
      },
      {
        heading: "3. Účely a právní základy",
        paragraphs: [
          "Plnění smlouvy a poskytnutí služby (čl. 6 odst. 1 písm. b) GDPR).",
          "Oprávněný zájem na bezpečnosti, prevenci podvodů a zlepšování služby (čl. 6 odst. 1 písm. f) GDPR).",
          "Plnění právních povinností (účetnictví, reklamace) (čl. 6 odst. 1 písm. c) GDPR).",
          "Souhlas se cookies analytiky / marketingu, pokud jej udělíte (čl. 6 odst. 1 písm. a) GDPR) — v současnosti analytiku nenačítáme.",
        ],
      },
      {
        heading: "4. Příjemci a zpracovatelé",
        paragraphs: [
          "Hosting a databáze (např. Vercel, Neon), úložiště souborů (Vercel Blob), e-mail / OAuth (Google), budoucí platební poskytovatel (Stripe), dopravci (např. Zásilkovna).",
        ],
      },
      {
        heading: "5. Doba uložení a práva",
        paragraphs: [
          "Údaje uchováváme po dobu nutnou pro poskytnutí služby a plnění zákonných povinností. Soubory modelů mohou být po dokončení objednávky automaticky smazány dle nastavení platformy.",
          "Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost a námitku. Stížnost můžete podat u Úřadu pro ochranu osobních údajů (www.uoou.cz).",
        ],
      },
    ],
  },
  complaints: {
    title: "Reklamační řád",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Rozsah",
        paragraphs: [
          "Tento reklamační řád upravuje reklamaci vad výtisku zhotoveného makerem prostřednictvím platformy PrintShare.",
        ],
      },
      {
        heading: "2. Jak reklamovat",
        paragraphs: [
          "Reklamaci uplatněte bez zbytečného odkladu u makera přes chat objednávky a/nebo e-mailem na web.mr.spacks@gmail.com s číslem objednávky, popisem vady a fotografiemi.",
        ],
      },
      {
        heading: "3. Vyřízení",
        paragraphs: [
          "Maker (případně Provozovatel při sporu) posoudí reklamaci. Možná řešení: oprava / nový výtisk, sleva, vrácení části nebo celé ceny tisku — dle charakteru vady.",
          "Lhůta vyřízení se řídí právními předpisy; o průběhu budete informováni.",
        ],
      },
      {
        heading: "4. Co není vadou",
        paragraphs: [
          "Odchylky vyplývající z vlastností technologie 3D tisku, pokud byly předem sjednány, a vady způsobené vadným nebo neúplným modelem dodaným zákazníkem.",
        ],
      },
    ],
  },
  cookies: {
    title: "Zásady používání cookies",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Nezbytné cookies",
        paragraphs: [
          "Používáme nezbytné cookies a lokální úložiště pro přihlášení (session), jazyk a uložení volby souhlasu s cookies. Tyto technologie jsou nutné pro fungování webu.",
        ],
      },
      {
        heading: "2. Analytika a marketing",
        paragraphs: [
          "Volitelné analytické a marketingové skripty se nenačítají, dokud aktivně nekliknete na „Přijmout“. Zatím žádné takové skripty nenasazujeme.",
        ],
      },
      {
        heading: "3. Změna volby",
        paragraphs: [
          "Svou volbu můžete změnit smazáním údaji v prohlížeči (localStorage klíč printshare_cookie_consent) nebo kontaktováním web.mr.spacks@gmail.com.",
        ],
      },
    ],
  },
};

export const legalDocumentsEn: Record<LegalDocId, LegalDocument> = {
  terms: {
    title: "Terms of Service",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Operator",
        paragraphs: [
          "The PrintShare platform is operated by Sergei Petukhov, Company ID (IČO) 19618492, registered address Radčina 492/20, 161 00 Prague 6 - Liboc, Czech Republic, email web.mr.spacks@gmail.com (the “Operator”).",
        ],
      },
      {
        heading: "2. Service",
        paragraphs: [
          "PrintShare connects customers with local 3D-print makers. Customers upload a model (e.g. STL/OBJ), choose a maker and delivery method, and place an order.",
          "The manufacturing contract is between the customer and the maker. The Operator provides the platform and may charge a facilitation fee.",
        ],
      },
      {
        heading: "3. Orders and pricing",
        paragraphs: [
          "Map prices are estimates based on model volume, the maker’s print settings, and price per gram. The maker confirms the final price and timeline in the order flow.",
        ],
      },
      {
        heading: "4. Custom manufacture and withdrawal",
        paragraphs: [
          "Goods are made to the customer’s specifications (custom STL/OBJ and parameters). Under Czech Civil Code § 1837(d), the consumer’s 14-day right to withdraw without giving a reason does not apply to such contracts.",
          "This does not affect warranty / defect claims under the Complaints Policy.",
        ],
      },
      {
        heading: "5. Duties",
        paragraphs: [
          "Customers must have rights to use the uploaded model and must not upload illegal content.",
          "Makers are responsible for print quality per agreed parameters and for the accuracy of their business details (including IČO when provided).",
        ],
      },
      {
        heading: "6. Complaints and disputes",
        paragraphs: [
          "Complaints follow the Complaints Policy. Consumers may use out-of-court dispute resolution via the Czech Trade Inspection Authority (www.coi.cz).",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Controller",
        paragraphs: [
          "The data controller is Sergei Petukhov, IČO 19618492, Radčina 492/20, 161 00 Prague 6 - Liboc, email web.mr.spacks@gmail.com.",
        ],
      },
      {
        heading: "2. Data we process",
        paragraphs: [
          "Account data, order metadata, chat, maker workshop details (including optional IČO), and technical logs needed to run the service.",
        ],
      },
      {
        heading: "3. Purposes and legal bases",
        paragraphs: [
          "Contract performance, legitimate interests (security, fraud prevention), legal obligations, and consent for optional analytics/marketing cookies if you click Accept (none are loaded at present).",
        ],
      },
      {
        heading: "4. Recipients",
        paragraphs: [
          "Infrastructure providers (e.g. Vercel, Neon, Blob storage), Google OAuth, future payment processors (Stripe), and delivery partners (e.g. Packeta/Zásilkovna).",
        ],
      },
      {
        heading: "5. Retention and rights",
        paragraphs: [
          "We retain data as needed for the service and legal duties. Model files may be auto-deleted after order completion according to platform settings.",
          "You may request access, rectification, erasure, restriction, portability, or object. You may lodge a complaint with the Czech DPA (www.uoou.cz).",
        ],
      },
    ],
  },
  complaints: {
    title: "Complaints Policy",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "This policy covers defects in prints made by makers via PrintShare.",
        ],
      },
      {
        heading: "2. How to complain",
        paragraphs: [
          "Contact the maker via order chat and/or email web.mr.spacks@gmail.com with the order ID, defect description, and photos without undue delay.",
        ],
      },
      {
        heading: "3. Resolution",
        paragraphs: [
          "Possible remedies include reprint, discount, or partial/full refund of the print price, depending on the defect. You will be informed of progress.",
        ],
      },
      {
        heading: "4. Not a defect",
        paragraphs: [
          "Ordinary process limitations of 3D printing when disclosed in advance, and issues caused by a defective or incomplete customer-supplied model.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    effectiveFrom: "2026-07-20",
    sections: [
      {
        heading: "1. Necessary cookies",
        paragraphs: [
          "We use necessary cookies/local storage for session login, language, and storing your cookie consent choice.",
        ],
      },
      {
        heading: "2. Analytics and marketing",
        paragraphs: [
          "Optional analytics/marketing scripts do not load until you click Accept. We do not ship such scripts at present.",
        ],
      },
      {
        heading: "3. Changing your choice",
        paragraphs: [
          "Clear localStorage key printshare_cookie_consent or email web.mr.spacks@gmail.com.",
        ],
      },
    ],
  },
};

export function getLegalDocument(
  id: LegalDocId,
  locale: "cs" | "en"
): LegalDocument {
  return locale === "en" ? legalDocumentsEn[id] : legalDocumentsCs[id];
}
