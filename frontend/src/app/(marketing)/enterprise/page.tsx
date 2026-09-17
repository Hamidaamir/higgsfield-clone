import type { Metadata } from "next";
import { Building2, Lock, ShieldCheck, Users } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Enterprise" };

export default function EnterprisePage() {
  return (
    <ProductPage
      eyebrow="Enterprise"
      title="Higgsfield for teams"
      description="SSO, shared workspaces, usage controls and volume pricing for studios and brands."
      status="preview"
      statusNote="Enterprise administration is out of scope for this build. The generation engine is the same one you can try for free today."
      primary={{ label: "Try it free", href: "/signup" }}
      secondary={{ label: "See pricing", href: "/pricing" }}
      seed="enterprise"
      features={[
        { icon: Lock, title: "SSO", text: "SAML and OIDC sign-in for your whole organization." },
        { icon: Users, title: "Shared workspaces", text: "Projects, assets and history shared across the team." },
        { icon: ShieldCheck, title: "Governance", text: "Usage limits, audit logs and content controls." },
        { icon: Building2, title: "Volume pricing", text: "Committed-use discounts and dedicated support." },
      ]}
    />
  );
}
