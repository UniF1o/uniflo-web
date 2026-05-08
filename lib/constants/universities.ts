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
