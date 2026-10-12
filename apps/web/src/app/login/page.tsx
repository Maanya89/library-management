import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Staff sign in",
  description: "Sign in to the Shelfwise library desk.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
