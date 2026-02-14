// import Google from "@auth/core/providers/google";
// import { Password } from "@convex-dev/auth/providers/Password";
// import { convexAuth } from "@convex-dev/auth/server";

// export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
//   providers: [
//     Google,
//     Password({
//       profile(params) {
//         return {
//           email: params.email as string,
//           name: (params.username ?? params.name ?? params.email) as string,
//         };
//       },
//     }),
//   ],
// });


import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

import { convexAuth } from "@convex-dev/auth/server";

import { DataModel } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, CustomPassword],
});