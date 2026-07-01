import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy | TaskBricks",
  description: "How TaskBricks handles workspace, account, and operational data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy policy"
      description="TaskBricks keeps tenant work data scoped to the workspace and uses it only to operate, secure, and improve the product."
      sections={[
        {
          title: "Information we process",
          body: "We process account details, workspace membership, project records, tasks, meetings, files, messages, audit events, and usage signals needed to run the application.",
        },
        {
          title: "How we use data",
          body: "Data is used for authentication, authorization, collaboration, notifications, billing, AI-assisted features when enabled, support, abuse prevention, and service reliability.",
        },
        {
          title: "Tenant boundaries",
          body: "Workspace data is tenant-scoped. Internal mail, projects, teams, and conversations are isolated by tenant so the same person can participate in multiple workspaces without cross-workspace leakage.",
        },
        {
          title: "Security",
          body: "TaskBricks uses role-based access controls, audit logs, signed upload intents, encrypted secrets, and session controls to reduce unauthorized access to workspace data.",
        },
      ]}
    />
  );
}
