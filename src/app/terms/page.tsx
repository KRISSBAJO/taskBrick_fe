import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms | TaskBricks",
  description: "Terms for using the TaskBricks workspace platform.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Terms of service"
      description="These terms explain the basic responsibilities for using TaskBricks as a secure project and operations workspace."
      sections={[
        {
          title: "Workspace responsibility",
          body: "Tenant owners are responsible for inviting the right users, assigning roles, maintaining billing information, and configuring security settings appropriate for their organization.",
        },
        {
          title: "Acceptable use",
          body: "Users must not abuse the service, attempt unauthorized access, bypass tenant boundaries, upload unlawful content, or use automation in ways that degrade service reliability.",
        },
        {
          title: "Availability",
          body: "We work to keep TaskBricks available and reliable, but some features may depend on third-party providers such as email, storage, payments, AI, or authentication services.",
        },
        {
          title: "Changes",
          body: "We may update product capabilities, policies, or these terms as the platform evolves. Material changes should be communicated through the product or account channels.",
        },
      ]}
    />
  );
}
