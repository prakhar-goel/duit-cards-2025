import { NativeModules, Platform } from "react-native";
const bridge = NativeModules.DuitPhoneNumberHint as
  { requestNumber(): Promise<string | null> } | undefined;
export const canChoosePhoneNumber =
  Platform.OS === "android" && !!bridge?.requestNumber;
export async function choosePhoneNumber(): Promise<string | null> {
  if (!canChoosePhoneNumber || !bridge) return null;
  const number = await bridge.requestNumber();
  // Preserve the country code supplied by Android. Never infer one from locale.
  return number?.replace(/[\s()-]/g, "") || null;
}
