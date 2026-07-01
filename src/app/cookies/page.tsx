import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookies | TaskBricks",
  description: "How TaskBricks uses cookies and local browser storage.",
};

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Cookie notice"
      description="TaskBricks uses cookies and browser storage to keep sessions secure and make the workspace experience reliable."
      sections={[
        {
          title: "Essential cookies",
          body: "Essential cookies support login, refresh sessions, workspace routing, CSRF protection, and trusted-device flows. These are required for core product functionality.",
        },
        {
          title: "Preference storage",
          body: "We may store interface preferences such as selected workspace, theme, filters, and dismissed notices so the application behaves consistently between visits.",
        },
        {
          title: "Security signals",
          body: "Cookies and storage may help detect suspicious sessions, protect accounts, and support audit trails for tenant and platform administrators.",
        },
        {
          title: "Third-party services",
          body: "Payment, analytics, AI, upload, and authentication providers may set their own cookies when those integrations are used or embedded in the application.",
        },
      ]}
    />
  );
}
