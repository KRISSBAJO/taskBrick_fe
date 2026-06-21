import { type ReactNode } from "react";
import { SiteAdminShell } from "@/components/site-admin-shell";

export default function SiteAdminLayout({ children }: { children: ReactNode }) {
  return <SiteAdminShell>{children}</SiteAdminShell>;
}
