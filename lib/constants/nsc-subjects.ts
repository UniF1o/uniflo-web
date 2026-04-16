// Canonical list of National Senior Certificate (NSC) subjects.
//
// This constant is the authoritative source for subject names on the frontend.
// It is used to:
//   1. Populate the subject name <select> in the academic records form.
//   2. Validate on submit that each subject name is either from this list
//      or the special "Other" value.
//
// IMPORTANT — do not rename or remove entries without coordinating with
// Partner B. The backend field-mapping service uses these exact strings to
// match subjects to university portal fields. Inconsistent keys will break
// the automation layer for every affected student application.
//
// Source: CAPS (Curriculum and Assessment Policy Statement). All 11 SA
// official language Home Language and First Additional Language variants are
// included. Afrikaans and all isiLanguage variants follow the official CAPS
// naming convention exactly.
export const NSC_SUBJECTS = [
  "Accounting",
  "Afrikaans Home Language",
  "Afrikaans First Additional Language",
  "Agricultural Management Practices",
  "Agricultural Sciences",
  "Agricultural Technology",
  "Business Studies",
  "Civil Technology",
  "Computer Applications Technology",
  "Consumer Studies",
  "Dance Studies",
  "Design",
  "Dramatic Arts",
  "Economics",
  "Electrical Technology",
  "Engineering Graphics and Design",
  "English Home Language",
  "English First Additional Language",
  "French",
  "Geography",
  "German",
  "History",
  "Hospitality Studies",
  "Information Technology",
  "isiNdebele Home Language",
  "isiNdebele First Additional Language",
  "isiXhosa Home Language",
  "isiXhosa First Additional Language",
  "isiZulu Home Language",
  "isiZulu First Additional Language",
  "Life Orientation",
  "Life Sciences",
  "Marine Sciences",
  "Mathematical Literacy",
  "Mathematics",
  "Mechanical Technology",
  "Music",
  "Physical Sciences",
  "Portuguese",
  "Religion Studies",
  "Sepedi Home Language",
  "Sepedi First Additional Language",
  "Sesotho Home Language",
  "Sesotho First Additional Language",
  "Setswana Home Language",
  "Setswana First Additional Language",
  "Siswati Home Language",
  "Siswati First Additional Language",
  "Sport and Exercise Science",
  "Technical Mathematics",
  "Technical Sciences",
  "Tourism",
  "Tshivenda Home Language",
  "Tshivenda First Additional Language",
  "Visual Arts",
  "Xitsonga Home Language",
  "Xitsonga First Additional Language",
] as const;

// Union type of all valid NSC subject name strings.
// Useful for type-checking backend payloads if Partner B provides typed enums.
export type NscSubject = (typeof NSC_SUBJECTS)[number];
