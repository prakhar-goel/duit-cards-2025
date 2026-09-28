export type TruecallerProof = {
  authorizationCode: string;
  codeVerifier: string;
};
export function canUseTruecaller(_clientId?: string | null) {
  return false;
}
export async function authorizeTruecaller(
  _clientId?: string | null,
): Promise<TruecallerProof | null> {
  return null;
}
