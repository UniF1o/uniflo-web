import type { components } from "@/lib/api/schema";

type University = components["schemas"]["UniversityRead"];

// Placeholder universities for local development and UI testing.
// Remove once Partner B has seeded real data in the staging environment.
export const SEED_UNIVERSITIES: University[] = [
  {
    id: "seed-uct",
    name: "University of Cape Town",
    website: "https://www.uct.ac.za",
    portal_url: "https://applyonline.uct.ac.za",
    open_date: "2026-04-01",
    close_date: "2026-09-30",
    is_active: true,
  },
  {
    id: "seed-wits",
    name: "University of the Witwatersrand",
    website: "https://www.wits.ac.za",
    portal_url: "https://www.wits.ac.za/apply",
    open_date: "2026-03-01",
    close_date: "2026-08-31",
    is_active: true,
  },
  {
    id: "seed-uj",
    name: "University of Johannesburg",
    website: "https://www.uj.ac.za",
    portal_url: "https://www.uj.ac.za/apply",
    open_date: "2026-06-01",
    close_date: "2026-10-31",
    is_active: true,
  },
];
