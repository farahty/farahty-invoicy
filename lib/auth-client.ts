import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Organization exports
export const { useActiveOrganization, useListOrganizations } = authClient;

export const organization = authClient.organization;

// Wrapper functions for password reset
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = authClient as any;

export const forgetPassword = async ({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo: string;
}) => {
  // Try different method names based on better-auth version
  if (client.forgetPassword) {
    return client.forgetPassword({ email, redirectTo });
  }
  if (client.forgotPassword) {
    return client.forgotPassword({ email, redirectTo });
  }
  if (client.sendResetPasswordEmail) {
    return client.sendResetPasswordEmail({ email, redirectTo });
  }
  throw new Error("Password reset method not available");
};

export const resetPassword = async ({
  newPassword,
  token,
}: {
  newPassword: string;
  token: string;
}) => {
  if (client.resetPassword) {
    return client.resetPassword({ newPassword, token });
  }
  throw new Error("Reset password method not available");
};
