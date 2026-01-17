import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import MicrosoftEntraId from "@auth/core/providers/microsoft-entra-id";
import { DataModel } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params["email"] as string,
      name: (params["name"] as string) || "User",
      role: "pending" as const,
    };
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    CustomPassword,
    Google({
      profile(profile) {
        return {
          email: profile["email"] as string,
          name: profile["name"] as string,
          image: profile["picture"] as string,
          role: "pending" as const,
        };
      },
    }),
    MicrosoftEntraId({
      profile(profile) {
        return {
          email: profile["email"] as string,
          name: profile["name"] as string,
          image: profile["picture"] as string,
          role: "pending" as const,
        };
      },
    }),
  ],
});
