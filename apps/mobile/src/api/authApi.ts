import { apiPost } from "./client";
import { setTokens } from "./authStorage";
import type { OnboardingProfilePayload } from "../onboarding/state";

export type AuthUser = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
};

type SignupResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function signup(
  email: string,
  password: string,
  onboardingProfile?: OnboardingProfilePayload
): Promise<AuthUser> {
  const res = await apiPost<SignupResponse>("/auth/signup", { email, password, onboardingProfile });
  await setTokens(res.accessToken, res.refreshToken);
  return res.user;
}
