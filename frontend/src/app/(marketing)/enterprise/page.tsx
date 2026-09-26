import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "Enterprise" };

export default function EnterprisePage() {
  return (
    <ConceptPage
      eyebrow="Concept / Teams"
      title="For teams"
      description="What this studio would need to run inside an organisation: single sign-on, shared workspaces, usage controls and pricing that fits a team rather than a person."
      note="Preview only. There is no organisation, workspace, role, audit log or team billing in this build — accounts are individual. The generation engine described here is the same one any account can use for free today."
      seed="enterprise"
      primary={{ label: "Create a free account", href: "/signup" }}
      secondary={{ label: "See plans", href: "/pricing" }}
      points={[
        { title: "Single sign-on", text: "SAML and OIDC sign-in for a whole organisation." },
        { title: "Shared workspaces", text: "Projects, assets and archives visible across a team." },
        { title: "Governance", text: "Usage limits, audit trails and content controls." },
        { title: "Team pricing", text: "Committed-use terms instead of per-person plans." },
      ]}
    />
  );
}
