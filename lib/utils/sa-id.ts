// Validation utilities for South African 13-digit ID numbers.
//
// An SA ID is structured as YYMMDD SSSS C A Z where:
//   YYMMDD  — date of birth
//   SSSS    — sequence (0000-4999 = female, 5000-9999 = male)
//   C       — citizenship (0 = citizen, 1 = permanent resident)
//   A       — always 8 (legacy field, not validated)
//   Z       — Luhn check digit

export type SAIDValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateSAID(
  id: string,
  dateOfBirth?: string,
): SAIDValidationResult {
  if (!/^\d{13}$/.test(id)) {
    return { valid: false, reason: "SA ID number must be exactly 13 digits." };
  }

  // Validate the embedded date component (YYMMDD).
  const month = parseInt(id.slice(2, 4), 10);
  const day = parseInt(id.slice(4, 6), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      valid: false,
      reason: "ID number contains an invalid date. Please check it.",
    };
  }

  // Luhn checksum: odd-position digits (0-indexed: 0,2,4…10) are summed
  // directly; even-position digits (1,3,5…11) are concatenated, the resulting
  // number is doubled, and its digits are summed. The total mod 10 must be 0
  // when the check digit is included.
  const oddSum = [0, 2, 4, 6, 8, 10]
    .map((i) => parseInt(id[i], 10))
    .reduce((acc, d) => acc + d, 0);

  const evenDigits = [1, 3, 5, 7, 9, 11].map((i) => id[i]).join("");
  const evenSum = (parseInt(evenDigits, 10) * 2)
    .toString()
    .split("")
    .reduce((acc, d) => acc + parseInt(d, 10), 0);

  const checkDigit = (10 - ((oddSum + evenSum) % 10)) % 10;
  if (checkDigit !== parseInt(id[12], 10)) {
    return {
      valid: false,
      reason: "ID number is invalid. Please double-check it.",
    };
  }

  // Cross-check against the date-of-birth field when provided.
  // Century is inferred: YY >= 25 → 19xx, YY < 25 → 20xx (matches most matrics).
  if (dateOfBirth) {
    const yy = parseInt(id.slice(0, 2), 10);
    const century = yy >= 25 ? 1900 : 2000;
    const idDOB = `${century + yy}-${id.slice(2, 4)}-${id.slice(4, 6)}`;
    if (idDOB !== dateOfBirth) {
      return {
        valid: false,
        reason:
          "The date of birth in your ID number doesn't match the date of birth you entered.",
      };
    }
  }

  return { valid: true };
}
