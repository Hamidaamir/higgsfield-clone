import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Sign up" };

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return <AuthCard mode="signup" nextPath={next} />;
}
