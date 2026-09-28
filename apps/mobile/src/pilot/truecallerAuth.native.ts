import { NativeModules, Platform } from "react-native";
export type TruecallerProof = {
  authorizationCode: string;
  codeVerifier: string;
};
const bridge = NativeModules.DuitTruecaller as
  | { clientId: string; authorize(): Promise<TruecallerProof | null> }
  | undefined;
export function canUseTruecaller(clientId?: string | null) {
  return (
    Platform.OS === "android" &&
    !!clientId &&
    bridge?.clientId === clientId &&
    !!bridge?.authorize
  );
}
export async function authorizeTruecaller(
  clientId?: string | null,
): Promise<TruecallerProof | null> {
  if (!canUseTruecaller(clientId) || !bridge)
    throw new Error("Use your mobile number to sign in.");
  return bridge.authorize();
}
