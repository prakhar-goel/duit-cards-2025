import {
  getAuth,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "@react-native-firebase/auth";

export async function sendPhoneCode(phone: string) {
  const confirmation = await signInWithPhoneNumber(getAuth(), phone);
  return async (code: string) => {
    const result = await confirmation.confirm(code);
    if (!result) throw new Error("Please request a new code.");
    return result.user.getIdToken(true);
  };
}
export function watchPhoneSignIn(onToken: (token: string) => void) {
  return onAuthStateChanged(getAuth(), (user) => {
    if (user)
      void user
        .getIdToken(true)
        .then(onToken)
        .catch(() => {});
  });
}
export async function clearPhoneSignIn() {
  await signOut(getAuth());
}
