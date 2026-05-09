// Hardcoded list of South African public universities used by the landing
// page's "Supported universities" grid as a trust signal.
//
// This is *marketing copy*, not the source of truth for application
// targeting — the backend's `universities` table is authoritative there.
// When the marketing list and the live data drift, the backend wins.
export interface MarketingUniversity {
  name: string;
  city: string;
  // Short marketing label, e.g. "UCT" — used for compact footer mentions.
  shortName: string;
}

// Featured universities surfaced on the landing-page marquee. Each carries a
// brand colour so we can render a recognisable wordmark chip without
// shipping copyrighted SVG logos. Replace `brandColor` mappings here when
// official assets are sourced.
export interface FeaturedUniversity extends MarketingUniversity {
  brandColor: string;
  // The label shown inside the colored disc — usually the shortName, but
  // some unis read better with a bespoke 2–4 character mark.
  mark: string;
}

export const FEATURED_UNIVERSITIES: FeaturedUniversity[] = [
  {
    shortName: "UCT",
    mark: "UCT",
    name: "University of Cape Town",
    city: "Cape Town",
    brandColor: "#7c1b14",
  },
  {
    shortName: "Wits",
    mark: "Wits",
    name: "University of the Witwatersrand",
    city: "Johannesburg",
    brandColor: "#0a3a5e",
  },
  {
    shortName: "Stellenbosch",
    mark: "SU",
    name: "Stellenbosch University",
    city: "Stellenbosch",
    brandColor: "#7e1124",
  },
  {
    shortName: "UP",
    mark: "UP",
    name: "University of Pretoria",
    city: "Pretoria",
    brandColor: "#a41e22",
  },
  {
    shortName: "UKZN",
    mark: "UKZN",
    name: "University of KwaZulu-Natal",
    city: "Durban",
    brandColor: "#90262c",
  },
  {
    shortName: "UJ",
    mark: "UJ",
    name: "University of Johannesburg",
    city: "Johannesburg",
    brandColor: "#d35400",
  },
];

export const SA_UNIVERSITIES: MarketingUniversity[] = [
  { shortName: "UCT", name: "University of Cape Town", city: "Cape Town" },
  {
    shortName: "Wits",
    name: "University of the Witwatersrand",
    city: "Johannesburg",
  },
  {
    shortName: "Stellenbosch",
    name: "Stellenbosch University",
    city: "Stellenbosch",
  },
  { shortName: "UP", name: "University of Pretoria", city: "Pretoria" },
  { shortName: "UKZN", name: "University of KwaZulu-Natal", city: "Durban" },
  { shortName: "UJ", name: "University of Johannesburg", city: "Johannesburg" },
  { shortName: "Rhodes", name: "Rhodes University", city: "Makhanda" },
  { shortName: "NWU", name: "North-West University", city: "Potchefstroom" },
  {
    shortName: "UFS",
    name: "University of the Free State",
    city: "Bloemfontein",
  },
  { shortName: "NMU", name: "Nelson Mandela University", city: "Gqeberha" },
  {
    shortName: "UWC",
    name: "University of the Western Cape",
    city: "Cape Town",
  },
  { shortName: "UNISA", name: "University of South Africa", city: "Pretoria" },
  {
    shortName: "TUT",
    name: "Tshwane University of Technology",
    city: "Pretoria",
  },
  { shortName: "DUT", name: "Durban University of Technology", city: "Durban" },
  {
    shortName: "CPUT",
    name: "Cape Peninsula University of Technology",
    city: "Cape Town",
  },
  { shortName: "UL", name: "University of Limpopo", city: "Polokwane" },
  { shortName: "Univen", name: "University of Venda", city: "Thohoyandou" },
  { shortName: "UFH", name: "University of Fort Hare", city: "Alice" },
  { shortName: "UMP", name: "University of Mpumalanga", city: "Mbombela" },
  {
    shortName: "Sol Plaatje",
    name: "Sol Plaatje University",
    city: "Kimberley",
  },
  { shortName: "WSU", name: "Walter Sisulu University", city: "Mthatha" },
  {
    shortName: "VUT",
    name: "Vaal University of Technology",
    city: "Vanderbijlpark",
  },
  {
    shortName: "MUT",
    name: "Mangosuthu University of Technology",
    city: "Durban",
  },
  {
    shortName: "CUT",
    name: "Central University of Technology",
    city: "Bloemfontein",
  },
  {
    shortName: "Smu",
    name: "Sefako Makgatho Health Sciences University",
    city: "Pretoria",
  },
  {
    shortName: "UniZulu",
    name: "University of Zululand",
    city: "KwaDlangezwa",
  },
];
