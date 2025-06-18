import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | Rooster - Next.js Dashboard ",
  description: "This is Next.js SignUp Page Rooster Dashboard ",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
