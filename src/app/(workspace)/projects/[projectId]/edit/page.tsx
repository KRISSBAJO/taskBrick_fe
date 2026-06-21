"use client";

import { use } from "react";
import { ProjectFormWizard } from "@/components/project-form-wizard";

export default function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return <ProjectFormWizard mode="edit" projectId={projectId} />;
}
