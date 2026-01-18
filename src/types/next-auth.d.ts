import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's role. */
      role?: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    /** The user's role. */
    role?: string;
  }
}