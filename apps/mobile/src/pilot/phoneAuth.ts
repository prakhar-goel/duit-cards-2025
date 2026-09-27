// Web uses Firebase's reCAPTCHA; Android resolves phoneAuth.native.ts instead.
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { get } from "./api";
let verifier: RecaptchaVerifier | undefined;
export async function sendPhoneCode(phone: string) {
  const { firebase } = await get("/auth/capabilities");
  if (!firebase?.apiKey)
    throw new Error("Phone sign-in is not configured on this server yet.");
  const app = getApps()[0] || initializeApp(firebase);
  verifier?.clear();
  verifier = new RecaptchaVerifier(getAuth(app), "phone-recaptcha", {
    size: "invisible",
  });
  const confirmation = await signInWithPhoneNumber(
    getAuth(app),
    phone,
    verifier,
  );
  return async (code: string) =>
    (await confirmation.confirm(code)).user.getIdToken(true);
}
export function watchPhoneSignIn(_onToken: (token: string) => void) {
  return () => {};
}
export async function clearPhoneSignIn() {
  verifier?.clear();
  verifier = undefined;
  if (getApps().length) await signOut(getAuth());
}
