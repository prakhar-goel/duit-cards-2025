import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
export const phoneDigits = (value: string) =>
  value.replace(/[^0-9]/g, "").slice(0, 15);
export function internationalPhone(country: CountryCode, digits: string) {
  if (!digits) return "";
  return (
    parsePhoneNumberFromString(digits, country)?.number ||
    `+${getCountryCallingCode(country)}${digits}`
  );
}
