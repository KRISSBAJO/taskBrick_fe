"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Folder,
  FolderArchive,
  FolderPlus,
  History,
  ImageIcon,
  LayoutTemplate,
  Link2,
  ListChecks,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  Paperclip,
  Pilcrow,
  Plus,
  RefreshCw,
  RotateCcw,
  Rows3,
  Save,
  Search,
  Send,
  ShieldCheck,
  Table2,
  Trash2,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  archiveDocument,
  archiveDocumentFolder,
  createDocument,
  createDocumentFolder,
  createFileAsset,
  createUploadIntent,
  hardDeleteDocument,
  listDocumentFolders,
  listDocuments,
  listDocumentVersions,
  listProjects,
  publishDocument,
  restoreDocument,
  restoreDocumentFolder,
  restoreDocumentVersion,
  updateDocument,
  type DocumentFolder,
  type DocumentPayload,
  type DocumentStatus,
  type DocumentVersion,
  type FileAsset,
  type Project,
  type Visibility,
  type WorkspaceDocument,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { uploadWithIntent } from "@/lib/upload";

type PageMode = "home" | "editor";
type EditorPanel = "write" | "preview";
type DocsToolModal = "actions" | "assistant" | "blocks" | "guide" | "versions" | null;
type PlaceholderPrompt = {
  end: number;
  kind: "date" | "options" | "text";
  label: string;
  options: string[];
  placeholder: string;
  start: number;
};
type DocumentSection = {
  end: number;
  level: number;
  start: number;
  title: string;
};

type DocumentFormState = {
  body: string;
  changeNote: string;
  documentType: string;
  folderId: string;
  projectId: string;
  slug: string;
  status: DocumentStatus;
  summary: string;
  tagsText: string;
  title: string;
  visibility: Visibility;
};

type DocTemplate = {
  id: string;
  title: string;
  description: string;
  documentType: string;
  summary: string;
  tags: string[];
  guide: string[];
  body: string;
  icon: LucideIcon;
  accent: string;
};

const EMPTY_FORM: DocumentFormState = {
  body: "",
  changeNote: "",
  documentType: "GENERAL",
  folderId: "",
  projectId: "",
  slug: "",
  status: "DRAFT",
  summary: "",
  tagsText: "",
  title: "",
  visibility: "TEAM",
};

const statusOptions: Array<{ label: string; value: DocumentStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

const visibilityOptions: Array<{ label: string; value: Visibility }> = [
  { label: "Private", value: "PRIVATE" },
  { label: "Team", value: "TEAM" },
  { label: "Workspace", value: "WORKSPACE" },
  { label: "Organization", value: "ORGANIZATION" },
  { label: "Public", value: "PUBLIC" },
];

const documentTypeOptions = ["GENERAL", "SOP", "REQUIREMENT", "DECISION", "RUNBOOK", "MEETING_NOTE", "POLICY"];

function templateHeaderTable(rows: Array<[string, string]>) {
  return `| Field | Details |
| --- | --- |
${rows.map(([label, value]) => `| ${label} | ${value} |`).join("\n")}`;
}

function templateScopeTable(rows: Array<[string, string]>) {
  return `| Scope area | Details |
| --- | --- |
${rows.map(([label, value]) => `| ${label} | ${value} |`).join("\n")}`;
}

const deliveryHeaderRows: Array<[string, string]> = [
  ["Driver", "[@ mention the driver]"],
  ["Approver", "[@ approver]"],
  ["Contributors", "[@ contributors]"],
  ["Informed", "[@ stakeholders]"],
  ["Objective", "[Summarize the objective in 1-2 sentences]"],
  ["Due date", "[Date]"],
  ["Key outcomes", "[List expected outcomes and success metrics]"],
  ["Status", "[Not started / In progress / Complete]"],
];

const deliveryScopeRows: Array<[string, string]> = [
  ["Must have", "[Add the work that must be delivered]"],
  ["Nice to have", "[Add useful work that is not required for launch]"],
  ["Not in scope", "[Add work that should not be included]"],
];

const docTemplates: DocTemplate[] = [
  {
    id: "project-plan",
    title: "Project plan",
    description: "Scope, owners, milestones, status, risks, and delivery links.",
    documentType: "REQUIREMENT",
    summary: "Project delivery plan with owners, milestones, scope, risks, and related links.",
    tags: ["project", "planning", "delivery"],
    guide: [
      "Write the business outcome first.",
      "Name one accountable owner and one approver.",
      "Separate must-have work from nice-to-have work.",
      "Add milestones with owners and target dates.",
      "List risks before publishing.",
    ],
    icon: LayoutTemplate,
    accent: "bg-blue-50 text-blue-700",
    body: `# Project plan

Use this page to align the team on what is being built, why it matters, who owns it, and how delivery will be measured.

${templateHeaderTable(deliveryHeaderRows)}

## Problem statement
Describe the business or customer problem, why it matters now, and what changes when this project succeeds.

## Scope
${templateScopeTable(deliveryScopeRows)}

## Milestones and deadlines
| Milestone | Owner | Deadline | Status |
| --- | --- | --- | --- |
| [Milestone] | [Owner] | [Date] | [Not started / In progress / Complete] |

## Risks and dependencies
| Risk or dependency | Impact | Owner | Mitigation or next step | Status |
| --- | --- | --- | --- | --- |
| [Risk] | [Low / Medium / High / Critical] | [Owner] | [Mitigation] | [Open / Watching / Closed] |

## Communication plan
| Update | Owner | Cadence | Audience |
| --- | --- | --- | --- |
| [Status update] | [Owner] | [Daily / Weekly / Monthly] | [Stakeholders] |

## Related work
- Project:
- Board:
- Tasks:
- Meetings:
- Decisions:
- Files:`,
  },
  {
    id: "runbook",
    title: "Operational runbook",
    description: "Incident steps, escalation, rollback, and verification.",
    documentType: "RUNBOOK",
    summary: "Operational runbook for response, escalation, rollback, and verification.",
    tags: ["runbook", "operations", "incident"],
    guide: [
      "State when the runbook should be used.",
      "Define owners and backup owners.",
      "Write steps in the exact order operators should follow.",
      "Include rollback and verification.",
      "Link evidence and dashboards.",
    ],
    icon: ListChecks,
    accent: "bg-emerald-50 text-emerald-700",
    body: `# Operational runbook

Use this runbook when a team member needs to complete an operational process safely and consistently.

${templateHeaderTable([
  ["Driver", "[@ primary owner]"],
  ["Approver", "[@ operations lead]"],
  ["Contributors", "[@ support, engineering, security]"],
  ["Informed", "[@ stakeholders]"],
  ["Objective", "[Describe the operation this runbook controls]"],
  ["Review date", "[Date]"],
  ["Escalation path", "[Person, team, or channel]"],
  ["Status", "[Draft / Active / Needs review / Retired]"],
])}

## Problem statement
Explain the operational risk this runbook reduces and when the team should use it.

## Scope
${templateScopeTable([
  ["Use this runbook when", "[Trigger, system, or workflow covered]"],
  ["Do not use this when", "[Condition where another runbook or approval is required]"],
  ["Required access", "[Tools, systems, roles, or permissions]"],
])}

## Procedure
| Step | Owner | Action | Evidence |
| --- | --- | --- | --- |
| 1 | [Owner] | [Action to perform] | [Expected result or link] |

## Rollback plan
| Trigger | Owner | Rollback action | Verification |
| --- | --- | --- | --- |
| [When to roll back] | [Owner] | [Rollback step] | [Healthy signal] |

## Verification
- [ ] [Metric or status is healthy]
- [ ] [Stakeholder notified]
- [ ] [Evidence attached]

## Evidence and audit trail
- Incident/task:
- Logs:
- Screenshots:
- Related docs:
- Final notes:`,
  },
  {
    id: "decision",
    title: "Decision record",
    description: "Decision, context, alternatives, tradeoffs, and follow-up actions.",
    documentType: "DECISION",
    summary: "Decision record with context, alternatives, owner, and follow-up actions.",
    tags: ["decision", "architecture", "governance"],
    guide: [
      "Put the final decision at the top.",
      "Explain why the decision is needed.",
      "Compare options in plain language.",
      "Record risks and tradeoffs.",
      "Create follow-up actions with owners.",
    ],
    icon: CheckCircle2,
    accent: "bg-amber-50 text-amber-700",
    body: `# Decision record

Use this page to record an important decision so future teammates understand what was decided, why it was chosen, and what happens next.

${templateHeaderTable([
  ["Driver", "[@ decision driver]"],
  ["Approver", "[@ final approver]"],
  ["Contributors", "[@ people consulted]"],
  ["Informed", "[@ teams or stakeholders]"],
  ["Objective", "[Summarize what the decision must resolve]"],
  ["Decision date", "[Date]"],
  ["Key outcomes", "[Expected result and success signal]"],
  ["Status", "[Proposed / Approved / Rejected / Superseded]"],
])}

## Problem statement
Explain the situation that led to this decision, the constraint that matters most, and who is affected.

## Scope
${templateScopeTable([
  ["In scope", "[Teams, systems, policies, or workflows covered by this decision]"],
  ["Out of scope", "[Related choices this decision does not settle]"],
  ["Constraints", "[Budget, timing, technical, legal, customer, or operational constraints]"],
])}

## Options considered
| Option | Benefit | Risk | Cost or effort | Decision |
| --- | --- | --- | --- | --- |
| [Option A] | [Benefit] | [Risk] | [Cost or effort] | [Selected / Rejected / Deferred] |

## Final decision
Decision:
[Write the decision in one clear paragraph.]

Reason:
[Explain why this option was selected.]

Tradeoffs accepted:
- [Tradeoff]
- [Tradeoff]

## Follow-up actions
- [ ] [Action] - Owner: [name] - Due: [date]
- [ ] [Action] - Owner: [name] - Due: [date]

## Related links
- Project:
- Tasks:
- Meeting:
- Architecture or policy docs:`,
  },
  {
    id: "how-to",
    title: "How-to article",
    description: "Step-by-step guidance with prerequisites and troubleshooting.",
    documentType: "SOP",
    summary: "Step-by-step how-to guide with prerequisites, procedure, and troubleshooting.",
    tags: ["how-to", "sop", "knowledge"],
    guide: [
      "Start with the outcome.",
      "List prerequisites before steps.",
      "Write one action per step.",
      "Add expected result after important steps.",
      "Include troubleshooting for common failure cases.",
    ],
    icon: BookOpenText,
    accent: "bg-violet-50 text-violet-700",
    body: `# How-to article

Use this guide to help someone complete a task without needing to ask another teammate for help.

${templateHeaderTable([
  ["Driver", "[@ guide owner]"],
  ["Approver", "[@ reviewer]"],
  ["Contributors", "[@ subject experts]"],
  ["Audience", "[Team, role, or user group]"],
  ["Objective", "[What the reader will accomplish]"],
  ["Review date", "[Date]"],
  ["Key outcomes", "[Expected result after completion]"],
  ["Status", "[Draft / Active / Needs review / Retired]"],
])}

## Problem statement
Explain the task this guide helps the reader complete and why the process must be consistent.

## Scope
${templateScopeTable([
  ["Use this guide for", "[Supported workflow, tool, or task]"],
  ["Before you start", "[Access, permission, related project, or required file]"],
  ["Not covered", "[Work that requires a different guide or owner]"],
])}

## Step-by-step instructions
| Step | Action | Expected result |
| --- | --- | --- |
| 1 | [Action] | [What the user should see] |

## Validation
- [ ] [Validation item]
- [ ] [Validation item]

## Troubleshooting
| Problem | Likely cause | Fix |
| --- | --- | --- |
| [What can go wrong] | [Why it happens] | [How to resolve it] |

## Related links
- Related docs:
- Related tasks:
- Related files:
- Owner or support contact:`,
  },
  {
    id: "known-error",
    title: "Known error",
    description: "Error overview, impacted services, workaround, and permanent fix.",
    documentType: "RUNBOOK",
    summary: "Known-error record with impact, workaround, fix, and ownership.",
    tags: ["known-error", "support", "incident"],
    guide: [
      "Describe the symptom in language support can recognize.",
      "Record impacted services and severity.",
      "Document the workaround separately from the permanent fix.",
      "Add reproduction steps and evidence.",
      "Assign an owner and review date.",
    ],
    icon: ShieldCheck,
    accent: "bg-red-50 text-red-700",
    body: `# Known error

Use this page when an issue is known, repeatable, and needs a consistent workaround or permanent fix.

${templateHeaderTable([
  ["Driver", "[@ support or engineering owner]"],
  ["Approver", "[@ incident or service owner]"],
  ["Contributors", "[@ engineering, support, QA]"],
  ["Informed", "[@ impacted teams]"],
  ["Objective", "[Explain the known error and safe workaround]"],
  ["Review date", "[Date]"],
  ["Key outcomes", "[Reduced repeat escalations or permanent fix shipped]"],
  ["Status", "[Active / Monitoring / Fixed / Archived]"],
])}

## Problem statement
Describe the error in language that support, engineering, and operations can recognize quickly.

## Scope
${templateScopeTable([
  ["Impacted area", "[Customer group, team, workflow, service, or feature]"],
  ["Severity", "[Low / Medium / High / Critical]"],
  ["Not impacted", "[Systems, customers, or workflows confirmed out of scope]"],
])}

## How to identify it
| Signal | Example | Source |
| --- | --- | --- |
| [Symptom] | [Error message, UI state, metric, or report] | [Dashboard, log, or report] |

## Steps to reproduce
1. [Step]
2. [Step]
3. [Expected failure]

## Workaround
Temporary workaround:
[What users or support should do now.]

Limitations:
[What the workaround does not solve.]

## Permanent fix
| Fix item | Owner | Target date | Status |
| --- | --- | --- | --- |
| [Engineering or process fix] | [Owner] | [Date] | [Not started / In progress / Complete] |

## Evidence
- Related incident:
- Logs:
- Screenshots:
- Customer examples:
- Linked tasks:

## Review
Close criteria:
- [ ] [Condition that proves this known error is fixed]`,
  },
  {
    id: "meeting-notes",
    title: "Meeting notes",
    description: "Agenda, decisions, attendees, action items, and linked tasks.",
    documentType: "MEETING_NOTE",
    summary: "Meeting notes with agenda, decisions, action items, and related work.",
    tags: ["meeting", "notes", "actions"],
    guide: [
      "Start with the meeting goal.",
      "Record decisions separately from discussion notes.",
      "Assign every action item to an owner.",
      "Include due dates for follow-up.",
      "Link related project, sprint, or task records.",
    ],
    icon: UsersRound,
    accent: "bg-sky-50 text-sky-700",
    body: `# Meeting notes

Use this page to capture meeting outcomes, decisions, owners, and follow-up work.

${templateHeaderTable([
  ["Driver", "[@ facilitator]"],
  ["Approver", "[@ decision owner]"],
  ["Contributors", "[@ attendees]"],
  ["Informed", "[@ stakeholders to notify]"],
  ["Objective", "[Why this meeting is happening]"],
  ["Meeting date", "[Date]"],
  ["Key outcomes", "[Decisions, action items, or risks resolved]"],
  ["Status", "[Scheduled / Completed / Follow-up needed / Cancelled]"],
])}

## Problem statement
Explain the meeting topic, why it needs attention, and what outcome the group must leave with.

## Scope
${templateScopeTable([
  ["In this meeting", "[Topics, decisions, or workstreams covered]"],
  ["Not covered", "[Topics that need a separate meeting or async decision]"],
  ["Required context", "[Project, sprint, task, doc, dashboard, or file links]"],
])}

## Agenda
| Topic | Owner | Time | Outcome needed |
| --- | --- | --- | --- |
| [Topic] | [Owner] | [Time] | [Decision / Input / Update] |

## Decisions made
| Decision | Owner | Date | Follow-up |
| --- | --- | --- | --- |
| [Decision] | [Owner] | [Date] | [Action or link] |

## Action items
- [ ] [Action] - Owner: [name] - Due: [date]
- [ ] [Action] - Owner: [name] - Due: [date]

## Follow-up and evidence
- Summary sent to:
- Recording or transcript:
- Files:
- Risks:

## Related work
- Project:
- Sprint:
- Tasks:
- Files:
- Decisions:`,
  },
];

function documentToForm(document: WorkspaceDocument): DocumentFormState {
  return {
    body: document.body ?? "",
    changeNote: "",
    documentType: document.documentType || "GENERAL",
    folderId: document.folderId ?? "",
    projectId: document.projectId ?? "",
    slug: document.slug ?? "",
    status: document.status,
    summary: document.summary ?? "",
    tagsText: Array.isArray(document.tags) ? document.tags.join(", ") : "",
    title: document.title,
    visibility: document.visibility,
  };
}

function templateToForm(template: DocTemplate): DocumentFormState {
  return {
    ...EMPTY_FORM,
    body: template.body,
    documentType: template.documentType,
    slug: slugify(template.title),
    summary: template.summary,
    tagsText: template.tags.join(", "),
    title: template.title,
  };
}

function compactDate(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function documentDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getActivePlaceholderPrompt(body: string, cursorPosition: number): PlaceholderPrompt | null {
  if (!body.trim()) return null;
  const safePosition = Math.max(0, Math.min(cursorPosition, body.length));
  const lineStart = body.lastIndexOf("\n", Math.max(0, safePosition - 1)) + 1;
  const lineEndIndex = body.indexOf("\n", safePosition);
  const lineEnd = lineEndIndex === -1 ? body.length : lineEndIndex;
  const line = body.slice(lineStart, lineEnd);
  const matches = Array.from(line.matchAll(/\[([^\]]+)\]/g));
  const placeholderMatch =
    matches.find((match) => {
      const localStart = match.index ?? 0;
      const localEnd = localStart + match[0].length;
      const localCursor = safePosition - lineStart;
      return localCursor >= localStart && localCursor <= localEnd;
    }) ??
    matches.find((match) => (match.index ?? 0) >= safePosition - lineStart) ??
    matches.at(-1);
  if (!placeholderMatch || placeholderMatch.index === undefined) return null;

  const placeholder = placeholderMatch[0];
  const label = placeholderMatch[1].trim();
  const start = lineStart + placeholderMatch.index;
  const end = start + placeholder.length;
  const options = label
    .split("/")
    .map((option) => option.trim())
    .filter(Boolean);
  const lower = label.toLowerCase();
  const kind: PlaceholderPrompt["kind"] = lower.includes("date") ? "date" : options.length > 1 ? "options" : "text";

  return {
    end,
    kind,
    label,
    options,
    placeholder,
    start,
  };
}

function getActiveDocumentSection(body: string, cursorPosition: number): DocumentSection | null {
  if (!body.trim()) return null;
  const headingMatches = Array.from(body.matchAll(/^(\#{1,6})\s+(.+)$/gm));
  if (!headingMatches.length) return null;
  const safePosition = Math.max(0, Math.min(cursorPosition, body.length));
  const activeHeadingIndex = headingMatches.findIndex((match, index) => {
    const start = match.index ?? 0;
    const nextStart = headingMatches[index + 1]?.index ?? body.length;
    return safePosition >= start && safePosition < nextStart;
  });
  if (activeHeadingIndex < 0) return null;

  const activeHeading = headingMatches[activeHeadingIndex];
  const level = activeHeading[1].length;
  if (level === 1) return null;

  const start = activeHeading.index ?? 0;
  const title = activeHeading[2].trim();
  const nextPeer = headingMatches.slice(activeHeadingIndex + 1).find((match) => match[1].length <= level);
  const end = nextPeer?.index ?? body.length;
  return { end, level, start, title };
}

function getDocumentSections(body: string): DocumentSection[] {
  if (!body.trim()) return [];
  const headingMatches = Array.from(body.matchAll(/^(\#{1,6})\s+(.+)$/gm));
  return headingMatches
    .map((match, index) => {
      const level = match[1].length;
      const start = match.index ?? 0;
      const nextPeer = headingMatches.slice(index + 1).find((candidate) => candidate[1].length <= level);
      return {
        end: nextPeer?.index ?? body.length,
        level,
        start,
        title: match[2].trim(),
      };
    })
    .filter((section) => section.level > 1);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function countVersions(documents: WorkspaceDocument[]) {
  return documents.reduce((total, document) => total + (document._count?.versions ?? 0), 0);
}

function statusTone(status: DocumentStatus) {
  if (status === "PUBLISHED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "ARCHIVED") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function visibilityLabel(value: Visibility) {
  return visibilityOptions.find((item) => item.value === value)?.label ?? value;
}

function guideForForm(form: DocumentFormState) {
  const normalizedTags = parseTags(form.tagsText).map((tag) => tag.toLowerCase());
  const matchedTemplate =
    docTemplates.find((template) => template.title === form.title) ??
    docTemplates.find(
      (template) =>
        template.documentType === form.documentType &&
        template.tags.some((tag) => normalizedTags.includes(tag.toLowerCase())),
    );

  if (matchedTemplate) return matchedTemplate.guide;

  if (form.documentType === "DECISION") {
    return [
      "Write the final decision first.",
      "Explain the context and constraints.",
      "Compare the realistic options.",
      "Capture risks, tradeoffs, and follow-up actions.",
    ];
  }

  if (form.documentType === "RUNBOOK") {
    return [
      "State when the runbook should be used.",
      "List owner, backup owner, and escalation path.",
      "Write steps in execution order.",
      "Add rollback, verification, and evidence links.",
    ];
  }

  if (form.documentType === "MEETING_NOTE") {
    return [
      "Start with the meeting goal.",
      "Separate agenda, notes, decisions, and actions.",
      "Assign every action to an owner and due date.",
      "Link related projects, tasks, and files.",
    ];
  }

  if (form.documentType === "SOP" || form.documentType === "POLICY") {
    return [
      "Start with who the document is for.",
      "Use short sections and direct instructions.",
      "Include required approvals or exceptions.",
      "Add a review cadence and owner.",
    ];
  }

  return [
    "Start with the reader's goal.",
    "Use clear headings and short paragraphs.",
    "Add owners, dates, links, and related work.",
    "Remove unused prompts before publishing.",
  ];
}

const documentSnippets = [
  {
    label: "Checklist",
    body: `## Checklist
Use this checklist to track clear completion criteria.

- [ ] [Action or condition] - Owner: [name] - Due: [date]
- [ ] [Action or condition] - Owner: [name] - Due: [date]`,
  },
  {
    label: "Decision block",
    body: `## Decision block
${templateHeaderTable([
  ["Driver", "[@ decision driver]"],
  ["Approver", "[@ final approver]"],
  ["Decision date", "[Date]"],
  ["Status", "[Proposed / Approved / Rejected / Superseded]"],
])}

Decision:
[Write the decision in one clear paragraph.]

Reason:
[Explain why this option is best.]

Follow-up:
- [ ] [Action] - Owner: [name] - Due: [date]`,
  },
  {
    label: "Milestone table",
    body: `## Milestones and deadlines
| Milestone | Owner | Deadline | Status |
| --- | --- | --- | --- |
| [Milestone] | [Owner] | [Date] | [Not started / In progress / Complete] |`,
  },
  {
    label: "Risk log",
    body: `## Risk log
| Risk | Impact | Owner | Mitigation or next step | Status |
| --- | --- | --- | --- | --- |
| [Risk] | [Low / Medium / High / Critical] | [Owner] | [Mitigation] | [Open / Watching / Closed] |`,
  },
  {
    label: "Evidence files",
    body: `## Evidence and attachments
Use this section to keep proof close to the decision, incident, or project record.

Files:
- [Attach or drag files into this section]

Notes:
[Explain what the attachment proves and who should review it.]`,
  },
  {
    label: "Review criteria",
    body: `## Review criteria
${templateHeaderTable([
  ["Reviewer", "[@ reviewer]"],
  ["Review date", "[Date]"],
  ["Status", "[Not started / In progress / Approved / Needs changes]"],
])}

This document is ready when:
- [ ] The owner is named.
- [ ] The required stakeholders have reviewed it.
- [ ] Open actions have owners and due dates.
- [ ] Related projects, tasks, or files are linked.`,
  },
];

const statusHelperOptions = ["Not started", "In progress", "Blocked", "Needs review", "Approved", "Complete"];

function fileKind(fileName: string, mimeType?: string | null) {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType?.toLowerCase() ?? "";
  if (lowerMime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerName)) return "image";
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (lowerMime.includes("sheet") || /\.(xls|xlsx|csv)$/i.test(lowerName)) return "spreadsheet";
  if (lowerMime.includes("presentation") || /\.(ppt|pptx)$/i.test(lowerName)) return "presentation";
  if (lowerMime.includes("word") || /\.(doc|docx)$/i.test(lowerName)) return "document";
  return "file";
}

function escapeMarkdownLabel(value: string) {
  return value.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim() || "Attachment";
}

function attachmentMarkdown(asset: Pick<FileAsset, "fileName" | "fileUrl" | "mimeType" | "sizeBytes">) {
  const name = escapeMarkdownLabel(asset.fileName);
  if (fileKind(asset.fileName, asset.mimeType) === "image") {
    return `![${name}](${asset.fileUrl})`;
  }

  const size = asset.sizeBytes ? ` - ${formatFileSize(asset.sizeBytes)}` : "";
  return `[File: ${name}${size}](${asset.fileUrl})`;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export default function DocsPage() {
  const searchParams = useSearchParams();
  const { auth, user } = useWorkspaceAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [mode, setMode] = useState<PageMode>("home");
  const [editorPanel, setEditorPanel] = useState<EditorPanel>("write");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [folderSaving, setFolderSaving] = useState(false);
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DocumentStatus>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | Visibility>("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);

  const canManageDocs = user.permissions.includes("manage:all") || user.permissions.includes("manage:projects");
  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const metrics = useMemo(
    () => ({
      archived: documents.filter((document) => document.status === "ARCHIVED" || document.archivedAt).length,
      draft: documents.filter((document) => document.status === "DRAFT").length,
      folders: folders.length,
      published: documents.filter((document) => document.status === "PUBLISHED").length,
      total: documents.length,
      versions: countVersions(documents),
    }),
    [documents, folders.length],
  );

  const recentDocuments = useMemo(
    () => [...documents].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()).slice(0, 8),
    [documents],
  );

  const loadWorkspaceDocs = useCallback(async () => {
    setLoading(true);
    try {
      const [folderPage, documentPage, projectPage] = await Promise.all([
        listDocumentFolders(auth.accessToken, { includeArchived, limit: 100, page: 1 }),
        listDocuments(auth.accessToken, {
          folderId: folderFilter === "ALL" ? undefined : folderFilter,
          includeArchived,
          limit: 100,
          page: 1,
          search: search.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          visibility: visibilityFilter === "ALL" ? undefined : visibilityFilter,
        }),
        listProjects(auth.accessToken, { limit: 100, page: 1 }),
      ]);

      setFolders(folderPage.data);
      setDocuments(documentPage.data);
      setProjects(projectPage.data);
    } catch (caught) {
      toast({
        title: "Docs could not load",
        description: caught instanceof Error ? caught.message : "Refresh and try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, folderFilter, includeArchived, search, statusFilter, toast, visibilityFilter]);

  useEffect(() => {
    void loadWorkspaceDocs();
  }, [loadWorkspaceDocs]);

  useEffect(() => {
    const documentId = searchParams.get("document");
    if (!documentId || selectedDocumentId === documentId || !documents.length) return;
    const document = documents.find((item) => item.id === documentId);
    if (document) void openDocument(document);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, searchParams, selectedDocumentId]);

  async function openDocument(document: WorkspaceDocument) {
    setSelectedDocumentId(document.id);
    setForm(documentToForm(document));
    setMode("editor");
    setEditorPanel("write");
    try {
      const nextVersions = await listDocumentVersions(auth.accessToken, document.id);
      setVersions(nextVersions);
    } catch (caught) {
      setVersions([]);
      toast({
        title: "Version history could not load",
        description: caught instanceof Error ? caught.message : "The document is still editable.",
        variant: "warning",
      });
    }
  }

  function startBlankDocument() {
    setSelectedDocumentId(null);
    setVersions([]);
    setForm(EMPTY_FORM);
    setMode("editor");
    setEditorPanel("write");
  }

  function startFromTemplate(template: DocTemplate) {
    setSelectedDocumentId(null);
    setVersions([]);
    setForm(templateToForm(template));
    setMode("editor");
    setEditorPanel("write");
  }

  function buildPayload(statusOverride?: DocumentStatus): DocumentPayload {
    return {
      body: form.body.trim() || undefined,
      changeNote: form.changeNote.trim() || undefined,
      documentType: form.documentType.trim() || "GENERAL",
      folderId: form.folderId || undefined,
      projectId: form.projectId || undefined,
      slug: form.slug.trim() || undefined,
      status: statusOverride ?? form.status,
      summary: form.summary.trim() || undefined,
      tags: parseTags(form.tagsText),
      title: form.title.trim(),
      visibility: form.visibility,
    };
  }

  async function saveDocument(event?: FormEvent<HTMLFormElement>, statusOverride?: DocumentStatus) {
    event?.preventDefault();
    if (!canManageDocs) return null;
    if (!form.title.trim()) {
      toast({ title: "Document title is required", variant: "warning" });
      return null;
    }

    setSaving(true);
    try {
      const payload = buildPayload(statusOverride);
      const saved = selectedDocumentId
        ? await updateDocument(auth.accessToken, selectedDocumentId, payload)
        : await createDocument(auth.accessToken, payload);
      toast({ title: selectedDocumentId ? "Document updated" : "Document created", variant: "success" });
      setSelectedDocumentId(saved.id);
      setForm(documentToForm(saved));
      await loadWorkspaceDocs();
      const nextVersions = await listDocumentVersions(auth.accessToken, saved.id);
      setVersions(nextVersions);
      return saved;
    } catch (caught) {
      toast({
        title: "Document was not saved",
        description: caught instanceof Error ? caught.message : "Check required fields and try again.",
        variant: "error",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!canManageDocs) return;
    const saved = selectedDocumentId ? null : await saveDocument(undefined, "DRAFT");
    const documentId = selectedDocumentId ?? saved?.id;
    if (!documentId) return;

    setSaving(true);
    try {
      const published = await publishDocument(auth.accessToken, documentId);
      toast({ title: "Document published", variant: "success" });
      setSelectedDocumentId(published.id);
      setForm(documentToForm(published));
      await loadWorkspaceDocs();
      setVersions(await listDocumentVersions(auth.accessToken, published.id));
    } catch (caught) {
      toast({
        title: "Document was not published",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!selectedDocumentId || !canManageDocs) return;
    const ok = await confirm({
      title: "Archive document?",
      description: "The document leaves active docs but remains recoverable.",
      confirmLabel: "Archive",
      tone: "warning",
    });
    if (!ok) return;

    setSaving(true);
    try {
      const archived = await archiveDocument(auth.accessToken, selectedDocumentId);
      toast({ title: "Document archived", variant: "success" });
      setForm(documentToForm(archived));
      await loadWorkspaceDocs();
    } catch (caught) {
      toast({
        title: "Document was not archived",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!selectedDocumentId || !canManageDocs) return;
    setSaving(true);
    try {
      const restored = await restoreDocument(auth.accessToken, selectedDocumentId);
      toast({ title: "Document restored", variant: "success" });
      setForm(documentToForm(restored));
      await loadWorkspaceDocs();
      setVersions(await listDocumentVersions(auth.accessToken, selectedDocumentId));
    } catch (caught) {
      toast({
        title: "Document was not restored",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleHardDelete() {
    if (!selectedDocumentId || !canManageDocs) return;
    const ok = await confirm({
      title: "Hard delete document?",
      description: "This removes the document and every version snapshot permanently.",
      confirmLabel: "Delete forever",
      tone: "danger",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await hardDeleteDocument(auth.accessToken, selectedDocumentId);
      toast({ title: "Document permanently deleted", variant: "success" });
      setSelectedDocumentId(null);
      setVersions([]);
      setForm(EMPTY_FORM);
      setMode("home");
      await loadWorkspaceDocs();
    } catch (caught) {
      toast({
        title: "Document was not deleted",
        description: caught instanceof Error ? caught.message : "Only tenant managers can hard delete.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageDocs || !folderName.trim()) return;
    setFolderSaving(true);
    try {
      await createDocumentFolder(auth.accessToken, {
        description: folderDescription.trim() || undefined,
        name: folderName.trim(),
      });
      setFolderName("");
      setFolderDescription("");
      setFolderPanelOpen(false);
      toast({ title: "Folder created", variant: "success" });
      await loadWorkspaceDocs();
    } catch (caught) {
      toast({
        title: "Folder was not created",
        description: caught instanceof Error ? caught.message : "Try another folder name.",
        variant: "error",
      });
    } finally {
      setFolderSaving(false);
    }
  }

  async function toggleFolderArchive(folder: DocumentFolder) {
    if (!canManageDocs) return;
    try {
      if (folder.archivedAt) {
        await restoreDocumentFolder(auth.accessToken, folder.id);
        toast({ title: "Folder restored", variant: "success" });
      } else {
        await archiveDocumentFolder(auth.accessToken, folder.id);
        toast({ title: "Folder archived", variant: "success" });
      }
      await loadWorkspaceDocs();
    } catch (caught) {
      toast({
        title: "Folder action failed",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    }
  }

  async function handleRestoreVersion(version: DocumentVersion) {
    if (!selectedDocumentId || !canManageDocs) return;
    const ok = await confirm({
      title: `Restore version ${version.version}?`,
      description: "A new version will be created from this snapshot.",
      confirmLabel: "Restore version",
      tone: "warning",
    });
    if (!ok) return;

    setSaving(true);
    try {
      const restored = await restoreDocumentVersion(auth.accessToken, selectedDocumentId, version.version, {
        changeNote: `Restored version ${version.version}`,
      });
      toast({ title: `Version ${version.version} restored`, variant: "success" });
      setForm(documentToForm(restored));
      await loadWorkspaceDocs();
      setVersions(await listDocumentVersions(auth.accessToken, selectedDocumentId));
    } catch (caught) {
      toast({
        title: "Version was not restored",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function copyDocumentLink() {
    const saved = selectedDocumentId ? null : await saveDocument(undefined, "DRAFT");
    const documentId = selectedDocumentId ?? saved?.id;
    if (!documentId) {
      toast({ title: "Save the document before sharing", variant: "warning" });
      return;
    }

    const target = `${window.location.origin}/docs?document=${documentId}`;
    try {
      await navigator.clipboard.writeText(target);
      toast({
        title: "Document link copied",
        description: "This link opens the exact document.",
        variant: "success",
      });
    } catch {
      toast({ title: "Could not copy link", variant: "warning" });
    }
  }

  if (mode === "editor") {
    return (
      <DocumentWorkspace
        accessToken={auth.accessToken}
        canManageDocs={canManageDocs}
        copyDocumentLink={copyDocumentLink}
        editorPanel={editorPanel}
        folders={folders}
        form={form}
        handleArchive={handleArchive}
        handleHardDelete={handleHardDelete}
        handlePublish={handlePublish}
        handleRestore={handleRestore}
        handleRestoreVersion={handleRestoreVersion}
        loading={loading}
        projects={projects}
        saving={saving}
        selectedDocument={selectedDocument}
        setEditorPanel={setEditorPanel}
        setForm={setForm}
        setMode={setMode}
        versions={versions}
        saveDocument={saveDocument}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-[#fbfaf7] px-4 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-[28px] border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_18px_40px_rgba(255,212,0,0.22)]">
              <BookOpenText className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Knowledge base</span>
                <span className="rounded-full border border-line bg-[#fbfaf5] px-3 py-1 text-xs font-black text-ink-soft">{metrics.total} docs</span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">Docs that make work repeatable.</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink-soft">
                Create project plans, runbooks, policies, decisions, meeting notes, and operational knowledge with folders,
                templates, publishing, version history, and workspace visibility controls.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadWorkspaceDocs()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
                Refresh
              </button>
              {canManageDocs ? (
                <>
                  <button
                    type="button"
                    onClick={() => setFolderPanelOpen((value) => !value)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted"
                  >
                    <FolderPlus className="size-4" aria-hidden="true" />
                    Folder
                  </button>
                  <button
                    type="button"
                    onClick={startBlankDocument}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_14px_28px_rgba(255,212,0,0.22)] transition hover:bg-primary-dark"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Create
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <StarterCard
            icon={FileText}
            title="Create a page"
            description="Start a blank page for notes, policies, or project knowledge."
            action="Create page"
            onClick={startBlankDocument}
          />
          <StarterCard
            icon={FolderPlus}
            title="Set up a space"
            description="Create a folder for projects, teams, clients, or departments."
            action="Create folder"
            onClick={() => setFolderPanelOpen(true)}
          />
          <StarterCard
            icon={Table2}
            title="Use a template"
            description="Build from project plans, runbooks, decisions, and known errors."
            action="Pick template"
            onClick={() => {
              const section = document.getElementById("doc-templates");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <StarterCard
            icon={History}
            title="Pick up work"
            description="Continue from recently updated pages and version history."
            action="View recent"
            onClick={() => {
              const section = document.getElementById("recent-docs");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </section>

        <section id="doc-templates" className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
          <SectionHeader
            eyebrow="Recommended templates"
            title="Start with a strong structure"
            action={<span className="text-xs font-black text-ink-soft">{docTemplates.length} templates</span>}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {docTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onClick={() => startFromTemplate(template)} />
            ))}
          </div>
        </section>

        {folderPanelOpen ? (
          <form onSubmit={handleCreateFolder} className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm md:grid-cols-[1fr_2fr_auto_auto]">
            <input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Folder name"
              className={inputClass}
            />
            <input
              value={folderDescription}
              onChange={(event) => setFolderDescription(event.target.value)}
              placeholder="Short description"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={folderSaving || !folderName.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] disabled:opacity-60"
            >
              {folderSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FolderPlus className="size-4" aria-hidden="true" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setFolderPanelOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </form>
        ) : null}

        <section className="rounded-[24px] border border-line bg-white p-3 shadow-sm">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_180px_180px_190px_auto]">
            <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3">
              <Search className="size-4 text-ink-soft" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search docs, policies, runbooks..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-ink-soft/70"
              />
            </label>
            <FilterSelect value={folderFilter} onChange={setFolderFilter}>
              <option value="ALL">All folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "ALL" | DocumentStatus)}>
              <option value="ALL">All status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={visibilityFilter} onChange={(value) => setVisibilityFilter(value as "ALL" | Visibility)}>
              <option value="ALL">All visibility</option>
              {visibilityOptions.map((visibility) => (
                <option key={visibility.value} value={visibility.value}>
                  {visibility.label}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={() => setIncludeArchived((value) => !value)}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-black transition",
                includeArchived ? "border-[#111111] bg-[#111111] text-white" : "border-line bg-white text-foreground hover:bg-panel-muted",
              )}
            >
              {includeArchived ? "Including archived" : "Active only"}
            </button>
          </div>
        </section>

        <div id="recent-docs" className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <FolderPanel
            canManageDocs={canManageDocs}
            folders={folders}
            folderFilter={folderFilter}
            metrics={metrics}
            setFolderFilter={setFolderFilter}
            toggleFolderArchive={toggleFolderArchive}
          />

          <section className="overflow-hidden rounded-[24px] border border-line bg-white shadow-sm">
            <div className="border-b border-line p-4">
              <SectionHeader
                eyebrow="Pick up where you left off"
                title="Recently updated"
                action={loading ? <Loader2 className="size-4 animate-spin text-ink-soft" aria-hidden="true" /> : <span className="text-xs font-black text-ink-soft">{documents.length} matched</span>}
              />
            </div>
            <div className="divide-y divide-line">
              {recentDocuments.map((document) => (
                <DocumentListRow key={document.id} document={document} onOpen={() => void openDocument(document)} />
              ))}
              {!recentDocuments.length && !loading ? (
                <EmptyState
                  icon={FileText}
                  title="No documents match this view"
                  description="Create a page from a template or adjust your filters."
                  action={canManageDocs ? <button type="button" onClick={startBlankDocument} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-[#111111]">Create document</button> : null}
                />
              ) : null}
            </div>
          </section>

          <aside className="grid gap-5 content-start">
            <MiniStatPanel metrics={metrics} />
            <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
              <SectionHeader eyebrow="Governance" title="Knowledge controls" />
              <div className="mt-4 grid gap-2">
                <GovernanceRow icon={ShieldCheck} label="Version snapshots" value={`${metrics.versions} stored`} />
                <GovernanceRow icon={LockKeyhole} label="Visibility controls" value="Private to public" />
                <GovernanceRow icon={Folder} label="Folder organization" value={`${metrics.folders} spaces`} />
                <GovernanceRow icon={Send} label="Publishing flow" value={`${metrics.published} live`} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DocumentWorkspace({
  accessToken,
  canManageDocs,
  copyDocumentLink,
  editorPanel,
  folders,
  form,
  handleArchive,
  handleHardDelete,
  handlePublish,
  handleRestore,
  handleRestoreVersion,
  projects,
  saving,
  selectedDocument,
  setEditorPanel,
  setForm,
  setMode,
  versions,
  saveDocument,
}: {
  accessToken: string;
  canManageDocs: boolean;
  copyDocumentLink: () => Promise<void>;
  editorPanel: EditorPanel;
  folders: DocumentFolder[];
  form: DocumentFormState;
  handleArchive: () => Promise<void>;
  handleHardDelete: () => Promise<void>;
  handlePublish: () => Promise<void>;
  handleRestore: () => Promise<void>;
  handleRestoreVersion: (version: DocumentVersion) => Promise<void>;
  loading: boolean;
  projects: Project[];
  saving: boolean;
  selectedDocument: WorkspaceDocument | null;
  setEditorPanel: (value: EditorPanel) => void;
  setForm: (updater: DocumentFormState | ((current: DocumentFormState) => DocumentFormState)) => void;
  setMode: (value: PageMode) => void;
  versions: DocumentVersion[];
  saveDocument: (event?: FormEvent<HTMLFormElement>, statusOverride?: DocumentStatus) => Promise<WorkspaceDocument | null>;
}) {
  const writingGuide = guideForForm(form);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [helperOwner, setHelperOwner] = useState("");
  const [helperDueDate, setHelperDueDate] = useState("");
  const [helperStatus, setHelperStatus] = useState(statusHelperOptions[1]);
  const [toolModal, setToolModal] = useState<DocsToolModal>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [riskTitle, setRiskTitle] = useState("");
  const [riskImpact, setRiskImpact] = useState("Medium");
  const [riskMitigation, setRiskMitigation] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const activePrompt = useMemo(() => getActivePlaceholderPrompt(form.body, cursorPosition), [cursorPosition, form.body]);
  const activeSection = useMemo(() => getActiveDocumentSection(form.body, cursorPosition), [cursorPosition, form.body]);
  const documentSections = useMemo(() => getDocumentSections(form.body), [form.body]);
  const activePromptKey = activePrompt ? `${activePrompt.start}:${activePrompt.end}:${activePrompt.placeholder}` : "";
  const activeSectionKey = activeSection ? `${activeSection.start}:${activeSection.end}:${activeSection.title}` : "";
  const [promptValue, setPromptValue] = useState("");
  const [promptCustomValue, setPromptCustomValue] = useState("");
  const [dismissedPromptKey, setDismissedPromptKey] = useState("");
  const [dismissedSectionKey, setDismissedSectionKey] = useState("");
  const [sectionDeleteKey, setSectionDeleteKey] = useState("");
  const visiblePrompt = activePromptKey && activePromptKey !== dismissedPromptKey ? activePrompt : null;
  const visibleSection = activeSectionKey && activeSectionKey !== dismissedSectionKey ? activeSection : null;
  const assistantTargetKey = visiblePrompt ? `prompt:${activePromptKey}` : visibleSection ? `section:${activeSectionKey}` : "";
  const lastAssistantTargetRef = useRef("");

  useEffect(() => {
    if (!activePrompt) {
      setPromptValue("");
      setPromptCustomValue("");
      return;
    }

    setPromptValue(activePrompt.kind === "options" ? activePrompt.options[0] ?? "" : "");
    setPromptCustomValue("");
  }, [activePromptKey]);

  useEffect(() => {
    if (editorPanel !== "write" || !assistantTargetKey || assistantTargetKey === lastAssistantTargetRef.current) return;
    lastAssistantTargetRef.current = assistantTargetKey;
    setToolModal("assistant");
  }, [assistantTargetKey, editorPanel]);

  const assistantModalCopy = visiblePrompt
    ? {
        description: "Replace only the selected placeholder, then return to the document.",
        title: "Replace prompt",
      }
    : visibleSection
      ? {
          description: "Review or remove only the selected section.",
          title: "Section tools",
        }
      : {
          description: "Insert status updates, milestone rows, and risk rows into the document.",
          title: "Smart inserters",
        };

  function syncCursorFromTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setCursorPosition(textarea.selectionStart ?? 0);
  }

  function appendSnippet(snippet: string) {
    setForm((current) => ({
      ...current,
      body: `${current.body.trimEnd()}${current.body.trim() ? "\n\n" : ""}${snippet}`.trimStart(),
    }));
  }

  function insertAtCursor(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      appendSnippet(snippet);
      return;
    }

    const start = textarea.selectionStart ?? form.body.length;
    const end = textarea.selectionEnd ?? form.body.length;
    const before = form.body.slice(0, start).trimEnd();
    const after = form.body.slice(end).trimStart();
    const nextBody = `${before}${before ? "\n\n" : ""}${snippet}${after ? "\n\n" : ""}${after}`.trimStart();
    setForm((current) => ({ ...current, body: nextBody }));
    window.setTimeout(() => {
      textarea.focus();
      const nextCursor = (before ? before.length + 2 : 0) + snippet.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
      setCursorPosition(nextCursor);
    }, 0);
  }

  function replaceBodyRange(start: number, end: number, replacement: string) {
    const nextBody = `${form.body.slice(0, start)}${replacement}${form.body.slice(end)}`;
    setForm((current) => ({ ...current, body: nextBody }));
    const nextCursor = start + replacement.length;
    window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
      setCursorPosition(nextCursor);
    }, 0);
  }

  function applyActivePromptValue() {
    if (!activePrompt || !canManageDocs) return;
    const rawValue =
      activePrompt.kind === "date"
        ? documentDate(promptValue)
        : activePrompt.kind === "options" && promptValue !== "__custom"
          ? promptValue
          : promptCustomValue.trim();
    const replacement = rawValue.trim();
    if (!replacement) {
      toast({
        title: "Choose a value first",
        description: "Pick a date, select an option, or type the custom value to insert.",
        variant: "warning",
      });
      return;
    }

    replaceBodyRange(activePrompt.start, activePrompt.end, replacement);
  }

  async function removeActiveSection() {
    if (!activeSection || !canManageDocs) return;
    const section = activeSection;
    const sectionKey = activeSectionKey;
    setSectionDeleteKey(sectionKey);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(section.start, section.end);
      setCursorPosition(section.start);
    }

    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    const approved = await confirm({
      title: `Remove "${section.title}"?`,
      description: "This will remove the heading and all content inside this section. Review the highlighted selection before confirming.",
      confirmLabel: "Remove section",
      cancelLabel: "Keep section",
      tone: "danger",
    });

    if (!approved) {
      setSectionDeleteKey("");
      return;
    }

    const before = form.body.slice(0, section.start).trimEnd();
    const after = form.body.slice(section.end).trimStart();
    const nextBody = `${before}${before && after ? "\n\n" : ""}${after}`;
    setForm((current) => ({ ...current, body: nextBody }));
    setSectionDeleteKey("");
    setDismissedSectionKey("");
    window.setTimeout(() => {
      const nextTextarea = textareaRef.current;
      const nextCursor = Math.min(before.length, nextBody.length);
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCursor, nextCursor);
      setCursorPosition(nextCursor);
    }, 0);
  }

  function insertStatusHelper() {
    insertAtCursor(`## Status update
Owner:
${helperOwner.trim() || "[Owner]"}

Target date:
${helperDueDate || "[Date]"}

Status:
${helperStatus}

Notes:
[Add the latest update, blocker, decision, or next step.]`);
  }

  function jumpToSection(section: DocumentSection) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const headingEnd = form.body.indexOf("\n", section.start);
    const nextCursor = headingEnd === -1 ? section.start : headingEnd + 1;
    textarea.setSelectionRange(nextCursor, nextCursor);
    setCursorPosition(nextCursor);
  }

  function insertMilestoneRow() {
    const row = `| ${milestoneTitle.trim() || "[Milestone]"} | ${helperOwner.trim() || "[Owner]"} | ${helperDueDate ? documentDate(helperDueDate) : "[Date]"} | ${helperStatus} |`;
    insertAtCursor(row);
    setMilestoneTitle("");
  }

  function insertRiskRow() {
    const row = `| ${riskTitle.trim() || "[Risk]"} | ${riskImpact} | ${helperOwner.trim() || "[Owner]"} | ${riskMitigation.trim() || "[Mitigation]"} | ${helperStatus} |`;
    insertAtCursor(row);
    setRiskTitle("");
    setRiskMitigation("");
  }

  async function uploadDocumentFile(file: File) {
    if (!canManageDocs || uploadingFile) return;
    if (!form.title.trim()) {
      toast({ title: "Add a title before uploading", description: "Documents need a title before files can be attached.", variant: "warning" });
      return;
    }

    setUploadingFile(true);
    try {
      const saved = selectedDocument ?? (await saveDocument(undefined, "DRAFT"));
      if (!saved) return;

      const intent = await createUploadIntent(accessToken, {
        entityId: saved.id,
        entityType: "DOCUMENT",
        fileName: file.name,
        mimeType: file.type || undefined,
        scope: "DOCUMENT",
        sizeBytes: file.size,
        visibility: form.visibility,
      });
      const uploadedUrl = await uploadWithIntent(intent, file);
      const asset = await createFileAsset(accessToken, {
        entityId: saved.id,
        entityType: "DOCUMENT",
        fileName: file.name,
        fileUrl: uploadedUrl,
        metadata: {
          insertedFrom: "docs-editor",
          originalName: file.name,
        },
        mimeType: file.type || undefined,
        provider: intent.provider,
        scope: "DOCUMENT",
        sizeBytes: file.size,
        storageKey: intent.storageKey,
        visibility: form.visibility,
      });

      const markdown = attachmentMarkdown(asset);
      if (activePrompt && /^attach|^drag|files?/i.test(activePrompt.label)) {
        replaceBodyRange(activePrompt.start, activePrompt.end, markdown);
      } else {
        insertAtCursor(markdown);
      }
      toast({
        title: fileKind(asset.fileName, asset.mimeType) === "image" ? "Image inserted" : "File attached",
        description: asset.fileName,
        variant: "success",
      });
    } catch (caught) {
      toast({
        title: "Attachment upload failed",
        description: caught instanceof Error ? caught.message : "The file could not be uploaded.",
        variant: "error",
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-dvh bg-[#fafaf8]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setMode("home")}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Docs
          </button>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-soft">
            {selectedDocument ? `Updated ${compactDate(selectedDocument.updatedAt)}` : "Unsaved draft"}
          </span>
          <span className={cn("rounded-xl border px-3 py-1 text-xs font-black", statusTone(form.status))}>{form.status}</span>
          {canManageDocs ? (
            <>
              <button
                type="button"
                onClick={() => void copyDocumentLink()}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted"
              >
                <Link2 className="size-4" aria-hidden="true" />
                Share
              </button>
              <button
                type="button"
                onClick={() => void saveDocument()}
                disabled={saving || !form.title.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={saving || !form.title.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_14px_28px_rgba(255,212,0,0.18)] transition hover:bg-primary-dark disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden="true" />
                Publish
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-8">

          {/* LEFT: writing area */}
          <form onSubmit={(event) => void saveDocument(event)} className="min-w-0">
            <article>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: current.slug || slugify(event.target.value),
                    title: event.target.value,
                  }))
                }
                disabled={!canManageDocs}
                placeholder="Untitled page"
                className="w-full border-none bg-transparent text-[2.5rem] font-black leading-[1.15] tracking-tight text-foreground outline-none placeholder:text-slate-300"
              />
              <input
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                disabled={!canManageDocs}
                placeholder="Short outcome or description..."
                className="mt-2 w-full border-none bg-transparent text-base font-semibold text-ink-soft outline-none placeholder:text-slate-300/70"
              />

              {editorPanel === "preview" ? (
                <DocumentFactsBar folders={folders} form={form} projects={projects} />
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-line py-3">
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DocumentStatus }))}
                    disabled={!canManageDocs}
                    className={cn("h-8 rounded-xl border px-2.5 text-xs font-black outline-none disabled:opacity-60", statusTone(form.status))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.visibility}
                    onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as Visibility }))}
                    disabled={!canManageDocs}
                    className="h-8 rounded-xl border border-line bg-white px-2.5 text-xs font-black outline-none disabled:opacity-60"
                  >
                    {visibilityOptions.map((visibility) => (
                      <option key={visibility.value} value={visibility.value}>
                        {visibility.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.documentType}
                    onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))}
                    disabled={!canManageDocs}
                    className="h-8 rounded-xl border border-line bg-white px-2.5 text-xs font-black outline-none disabled:opacity-60"
                  >
                    {documentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.folderId}
                    onChange={(event) => setForm((current) => ({ ...current, folderId: event.target.value }))}
                    disabled={!canManageDocs}
                    className="h-8 rounded-xl border border-line bg-white px-2.5 text-xs font-black outline-none disabled:opacity-60"
                  >
                    <option value="">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.projectId}
                    onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
                    disabled={!canManageDocs}
                    className="h-8 rounded-xl border border-line bg-white px-2.5 text-xs font-black outline-none disabled:opacity-60"
                  >
                    <option value="">Workspace-wide</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-line bg-[#fbfaf7] p-1">
                  <button
                    type="button"
                    onClick={() => setEditorPanel("write")}
                    className={cn("h-8 rounded-lg px-4 text-sm font-black transition", editorPanel === "write" ? "bg-[#111111] text-white" : "text-ink-soft")}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorPanel("preview")}
                    className={cn("h-8 rounded-lg px-4 text-sm font-black transition", editorPanel === "preview" ? "bg-[#111111] text-white" : "text-ink-soft")}
                  >
                    Preview
                  </button>
                </div>
                <input
                  value={form.tagsText}
                  onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                  disabled={!canManageDocs}
                  placeholder="Tags: project, runbook, policy"
                  className="h-9 min-w-[180px] flex-1 rounded-xl border border-line bg-white px-3 text-sm font-semibold outline-none"
                />
                <input
                  value={form.changeNote}
                  onChange={(event) => setForm((current) => ({ ...current, changeNote: event.target.value }))}
                  disabled={!canManageDocs}
                  placeholder="Change note"
                  className="h-9 min-w-[160px] flex-1 rounded-xl border border-line bg-white px-3 text-sm font-semibold outline-none"
                />
              </div>

              {editorPanel === "write" ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadDocumentFile(file);
                    }}
                  />
                  <StructuredDocumentEditor
                    activeSection={activeSection}
                    body={form.body}
                    canManageDocs={canManageDocs}
                    documentSections={documentSections}
                    onAttachFile={() => fileInputRef.current?.click()}
                    onBodyChange={(body) => setForm((current) => ({ ...current, body }))}
                    onDropFile={(file) => void uploadDocumentFile(file)}
                    onJump={jumpToSection}
                    onRawCursorChange={syncCursorFromTextarea}
                    rawTextareaRef={textareaRef}
                    uploadingFile={uploadingFile}
                  />
                </>
              ) : (
                <MarkdownPreview body={form.body} />
              )}
            </article>
          </form>

          {/* Supporting tools */}
          <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ToolLaunchCard
              active={Boolean(visiblePrompt || visibleSection)}
              description={visiblePrompt ? `Replace ${visiblePrompt.label.toLowerCase()} without hunting in the body.` : visibleSection ? `Review or remove "${visibleSection.title}".` : "Prompts, table rows, status helpers, and section controls."}
              eyebrow="Writing"
              icon={Pilcrow}
              onOpen={() => setToolModal("assistant")}
              title={visiblePrompt ? "Replace prompt" : visibleSection ? "Section tools" : "Smart inserters"}
            />
            <ToolLaunchCard
              description="Insert checklists, decision blocks, milestones, risk logs, evidence, and review criteria."
              eyebrow="Blocks"
              icon={Plus}
              onOpen={() => setToolModal("blocks")}
              title="Add structure"
            />
            <ToolLaunchCard
              count={writingGuide.length}
              description="Short completion guide for the selected document template."
              eyebrow="Guide"
              icon={BookOpenText}
              onOpen={() => setToolModal("guide")}
              title="Template steps"
            />
            <ToolLaunchCard
              description="Copy a document link, archive, restore, or remove the page where allowed."
              eyebrow="Controls"
              icon={Copy}
              onOpen={() => setToolModal("actions")}
              title="Page actions"
            />
            <ToolLaunchCard
              count={versions.length}
              description="Restore a prior snapshot or inspect what changed over time."
              eyebrow="History"
              icon={History}
              onOpen={() => setToolModal("versions")}
              title="Versions"
            />
          </aside>

          <DocsEditorModal
            description={assistantModalCopy.description}
            icon={Pilcrow}
            onClose={() => setToolModal(null)}
            open={toolModal === "assistant"}
            title={assistantModalCopy.title}
          >
            {visiblePrompt ? (
              <PromptReplacementPanel
                activePrompt={visiblePrompt}
                canManageDocs={canManageDocs}
                customPromptValue={promptCustomValue}
                onApplyPrompt={applyActivePromptValue}
                onClosePrompt={() => setDismissedPromptKey(activePromptKey)}
                onCustomPromptValueChange={setPromptCustomValue}
                onPromptValueChange={setPromptValue}
                promptValue={promptValue}
              />
            ) : visibleSection ? (
              <SectionReviewPanel
                activeSection={visibleSection}
                canManageDocs={canManageDocs}
                onCloseSection={() => setDismissedSectionKey(activeSectionKey)}
                onRemoveSection={removeActiveSection}
                reviewingSection={activeSectionKey === sectionDeleteKey}
              />
            ) : (
              <AuthoringAssistant
                activePrompt={null}
                activePromptKey=""
                activeSection={null}
                activeSectionKey=""
                canManageDocs={canManageDocs}
                customPromptValue={promptCustomValue}
                dueDate={helperDueDate}
                helperStatus={helperStatus}
                milestoneTitle={milestoneTitle}
                onApplyPrompt={applyActivePromptValue}
                onClosePrompt={() => undefined}
                onCloseSection={() => undefined}
                onCustomPromptValueChange={setPromptCustomValue}
                onDueDateChange={setHelperDueDate}
                onInsertMilestoneRow={insertMilestoneRow}
                onInsertRiskRow={insertRiskRow}
                onInsertStatusUpdate={insertStatusHelper}
                onMilestoneTitleChange={setMilestoneTitle}
                onOwnerChange={setHelperOwner}
                onPromptValueChange={setPromptValue}
                onRemoveSection={removeActiveSection}
                onRiskImpactChange={setRiskImpact}
                onRiskMitigationChange={setRiskMitigation}
                onRiskTitleChange={setRiskTitle}
                onStatusChange={setHelperStatus}
                owner={helperOwner}
                promptValue={promptValue}
                reviewingSection={false}
                riskImpact={riskImpact}
                riskMitigation={riskMitigation}
                riskTitle={riskTitle}
              />
            )}
          </DocsEditorModal>

          <DocsEditorModal
            description="Insert reusable document structure at the cursor, or attach evidence files."
            icon={Plus}
            onClose={() => setToolModal(null)}
            open={toolModal === "blocks"}
            title="Add document block"
          >
            <BlockLibraryPanel
              canManageDocs={canManageDocs}
              documentSnippets={documentSnippets}
              onAttachFile={() => fileInputRef.current?.click()}
              onClose={() => setToolModal(null)}
              onInsertSnippet={insertAtCursor}
              uploadingFile={uploadingFile}
            />
          </DocsEditorModal>

          <DocsEditorModal
            description="Use this checklist to decide when the page is ready to share."
            icon={BookOpenText}
            onClose={() => setToolModal(null)}
            open={toolModal === "guide"}
            title="Template guide"
          >
            <WritingGuideCard guide={writingGuide} />
          </DocsEditorModal>

          <DocsEditorModal
            description="Manage document sharing, archive state, and destructive actions."
            icon={Copy}
            onClose={() => setToolModal(null)}
            open={toolModal === "actions"}
            title="Page controls"
          >
            <PageActionsPanel
              canManageDocs={canManageDocs}
              copyDocumentLink={copyDocumentLink}
              handleArchive={handleArchive}
              handleHardDelete={handleHardDelete}
              handleRestore={handleRestore}
              selectedDocument={selectedDocument}
            />
          </DocsEditorModal>

          <DocsEditorModal
            description="Restore previous content snapshots when a document needs to roll back."
            icon={History}
            onClose={() => setToolModal(null)}
            open={toolModal === "versions"}
            title="Version history"
          >
            <VersionHistoryPanel
              canManageDocs={canManageDocs}
              handleRestoreVersion={handleRestoreVersion}
              versions={versions}
            />
          </DocsEditorModal>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-ink-soft/70 focus:border-primary disabled:bg-panel-muted disabled:text-ink-soft";

const metadataCardInputClass =
  "mt-2 h-11 w-full rounded-xl border border-line bg-[#fbfaf7] px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-ink-soft/70 focus:border-[#111111] disabled:bg-panel-muted disabled:text-ink-soft";

const sideActionClass =
  "inline-flex h-10 w-full items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:bg-panel-muted";

function DocumentFactsBar({
  folders,
  form,
  projects,
}: {
  folders: DocumentFolder[];
  form: DocumentFormState;
  projects: Project[];
}) {
  const facts = [
    { label: "Status", tone: statusTone(form.status), value: statusOptions.find((item) => item.value === form.status)?.label ?? form.status },
    { label: "Visibility", value: visibilityLabel(form.visibility) },
    { label: "Type", value: documentTypeLabel(form.documentType) },
    { label: "Folder", value: folderFactLabel(folders, form.folderId) },
    { label: "Project", value: projectFactLabel(projects, form.projectId) },
  ];

  return (
    <div className="mt-5 border-y border-line py-3">
      <div className="flex flex-wrap gap-2">
        {facts.map((fact) => (
          <FactChip key={fact.label} label={fact.label} tone={fact.tone} value={fact.value} />
        ))}
      </div>
    </div>
  );
}

function FactChip({ label, tone, value }: { label: string; tone?: string; value: string }) {
  return (
    <span className={cn("inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-black text-foreground", tone ?? "border-line")}>
      <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function documentTypeLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function folderFactLabel(folders: DocumentFolder[], folderId: string) {
  if (!folderId) return "No folder";
  return folders.find((folder) => folder.id === folderId)?.name ?? "Folder";
}

function projectFactLabel(projects: Project[], projectId: string) {
  if (!projectId) return "Workspace-wide";
  return projects.find((project) => project.id === projectId)?.name ?? "Project";
}

function ToolLaunchCard({
  active = false,
  count,
  description,
  eyebrow,
  icon: Icon,
  onOpen,
  title,
}: {
  active?: boolean;
  count?: number;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  onOpen: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group rounded-[24px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-md",
        active ? "border-primary bg-[#fffdf1]" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", active ? "bg-[#111111] text-primary" : "bg-panel-muted text-ink-soft")}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {typeof count === "number" ? (
          <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-black text-ink-soft">{count}</span>
        ) : null}
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">{eyebrow}</p>
      <h3 className="mt-1 text-base font-black text-foreground">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-ink-soft">{description}</p>
    </button>
  );
}

function DocsEditorModal({
  children,
  description,
  icon: Icon,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-line bg-[#fffdf1] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-sm">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-foreground">{title}</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink-soft">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(86vh-92px)] overflow-y-auto p-5 tb-scrollbar">{children}</div>
      </div>
    </div>
  );
}

function BlockLibraryPanel({
  canManageDocs,
  documentSnippets,
  onAttachFile,
  onClose,
  onInsertSnippet,
  uploadingFile,
}: {
  canManageDocs: boolean;
  documentSnippets: Array<{ body: string; label: string }>;
  onAttachFile: () => void;
  onClose: () => void;
  onInsertSnippet: (body: string) => void;
  uploadingFile: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {documentSnippets.map((snippet) => (
          <button
            key={snippet.label}
            type="button"
            onClick={() => {
              onInsertSnippet(snippet.body);
              onClose();
            }}
            disabled={!canManageDocs}
            className="group flex items-start gap-3 rounded-2xl border border-line bg-[#fbfaf7] p-4 text-left transition hover:border-[#111111] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-[#111111]">
              <Plus className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-foreground">{snippet.label}</span>
              <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-4 text-ink-soft">
                {snippet.body.split("\n").find((line) => line.trim() && !line.startsWith("##"))?.replace(/\[|\]/g, "") || "Structured content block"}
              </span>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onAttachFile}
        disabled={!canManageDocs || uploadingFile}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploadingFile ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
        {uploadingFile ? "Uploading" : "Upload file"}
      </button>
    </div>
  );
}

function PageActionsPanel({
  canManageDocs,
  copyDocumentLink,
  handleArchive,
  handleHardDelete,
  handleRestore,
  selectedDocument,
}: {
  canManageDocs: boolean;
  copyDocumentLink: () => Promise<void>;
  handleArchive: () => Promise<void>;
  handleHardDelete: () => Promise<void>;
  handleRestore: () => Promise<void>;
  selectedDocument: WorkspaceDocument | null;
}) {
  const archived = Boolean(selectedDocument?.archivedAt);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => void copyDocumentLink()} className={sideActionClass}>
        <Link2 className="size-4" aria-hidden="true" />
        Copy document link
      </button>
      {selectedDocument ? (
        archived ? (
          <button type="button" onClick={() => void handleRestore()} disabled={!canManageDocs} className={sideActionClass}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Restore document
          </button>
        ) : (
          <button type="button" onClick={() => void handleArchive()} disabled={!canManageDocs} className={sideActionClass}>
            <Archive className="size-4" aria-hidden="true" />
            Archive document
          </button>
        )
      ) : null}
      {selectedDocument ? (
        <button
          type="button"
          onClick={() => void handleHardDelete()}
          disabled={!canManageDocs}
          className="inline-flex h-10 w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete document
        </button>
      ) : null}
    </div>
  );
}

function VersionHistoryPanel({
  canManageDocs,
  handleRestoreVersion,
  versions,
}: {
  canManageDocs: boolean;
  handleRestoreVersion: (version: DocumentVersion) => Promise<void>;
  versions: DocumentVersion[];
}) {
  if (!versions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-[#fbfaf7] px-4 py-8 text-center text-sm font-semibold text-ink-soft">
        Save this page to create the first version snapshot.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {versions.map((version) => (
        <div key={version.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white p-4">
          <div>
            <p className="text-sm font-black text-foreground">Version {version.version}</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">{compactDate(version.createdAt)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{version.changeNote || "No change note"}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleRestoreVersion(version)}
            disabled={!canManageDocs}
            className="inline-flex h-9 shrink-0 items-center rounded-xl border border-line bg-white px-3 text-xs font-black text-foreground transition hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}

function DocumentMap({
  activeSection,
  onJump,
  sections,
}: {
  activeSection: DocumentSection | null;
  onJump: (section: DocumentSection) => void;
  sections: DocumentSection[];
}) {
  return (
    <section className="rounded-[28px] border border-line bg-[#fbfaf7] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-ink-soft shadow-sm">
            <ListChecks className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">Document map</p>
            <p className="text-sm font-black text-foreground">{sections.length || "No"} sections in this page</p>
          </div>
        </div>
        <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-black text-ink-soft">
          Click a section to jump
        </span>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 tb-scrollbar">
        {sections.length ? (
          sections.map((section) => {
            const active = activeSection?.start === section.start;
            return (
              <button
                key={`${section.start}-${section.title}`}
                type="button"
                onClick={() => onJump(section)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition",
                  active ? "border-[#111111] bg-[#111111] text-white" : "border-line bg-white text-slate-700 hover:border-[#111111]",
                  section.level > 2 && "text-xs font-semibold",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-slate-300")} />
                {section.title.replace(/^\d+\.\s*/, "")}
              </button>
            );
          })
        ) : (
          <p className="w-full rounded-2xl border border-dashed border-line bg-white px-4 py-5 text-center text-sm font-semibold text-ink-soft">
            Add headings to build a page map.
          </p>
        )}
      </div>
    </section>
  );
}

type StructuredDocSection = {
  content: string;
  heading: string;
  level: 2;
};

type ParsedStructuredDocument = {
  lead: string;
  leadTitle: string;
  sections: StructuredDocSection[];
};

function StructuredDocumentEditor({
  activeSection,
  body,
  canManageDocs,
  documentSections,
  onAttachFile,
  onBodyChange,
  onDropFile,
  onJump,
  onRawCursorChange,
  rawTextareaRef,
  uploadingFile,
}: {
  activeSection: DocumentSection | null;
  body: string;
  canManageDocs: boolean;
  documentSections: DocumentSection[];
  onAttachFile: () => void;
  onBodyChange: (body: string) => void;
  onDropFile: (file: File) => void;
  onJump: (section: DocumentSection) => void;
  onRawCursorChange: () => void;
  rawTextareaRef: RefObject<HTMLTextAreaElement | null>;
  uploadingFile: boolean;
}) {
  const parsed = useMemo(() => parseStructuredDocumentBody(body), [body]);

  const updateLead = (lead: string) => {
    onBodyChange(buildStructuredDocumentBody(parsed.leadTitle, lead, parsed.sections));
  };

  const updateSection = (sectionIndex: number, content: string) => {
    const sections = parsed.sections.map((section, index) => (index === sectionIndex ? { ...section, content } : section));
    onBodyChange(buildStructuredDocumentBody(parsed.leadTitle, parsed.lead, sections));
  };

  const removeSection = (sectionIndex: number) => {
    const sections = parsed.sections.filter((_, index) => index !== sectionIndex);
    onBodyChange(buildStructuredDocumentBody(parsed.leadTitle, parsed.lead, sections));
  };

  return (
    <div className="mt-8 space-y-8">
      <DocumentMap activeSection={activeSection} sections={documentSections} onJump={onJump} />

      <section className="rounded-[32px] border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-5">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-dark">Structured authoring</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Fill the page like a working document</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
              Edit the template through fields, tables, checklists, and sections. The saved version remains markdown-compatible for previews, sharing, and version snapshots.
            </p>
          </div>
          <button
            type="button"
            onClick={onAttachFile}
            disabled={!canManageDocs || uploadingFile}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-black text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingFile ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
            {uploadingFile ? "Uploading" : "Attach file"}
          </button>
        </div>

        <div className="mt-6 space-y-8">
          {parsed.lead || !parsed.sections.length ? (
            <StructuredSectionCard
              canManageDocs={canManageDocs}
              content={parsed.lead}
              eyebrow="Opening"
              onChange={updateLead}
              title="Summary and ownership"
            />
          ) : null}

          <div
            className="rounded-[24px] border border-dashed border-line bg-[#fbfaf7] px-5 py-5 text-center transition hover:border-primary-dark hover:bg-[#fffdf1]"
            onDragOver={(event) => {
              if (!canManageDocs) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (!canManageDocs) return;
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) onDropFile(file);
            }}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-black text-foreground">
              <ImageIcon className="size-4 text-primary-dark" aria-hidden="true" />
              Drop an image, PDF, spreadsheet, or document into this page
            </div>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Images render inline in preview. Other files become secure document links.</p>
          </div>

          {parsed.sections.length ? (
            <div className="grid gap-7">
              {parsed.sections.map((section, index) => (
                <StructuredSectionCard
                  key={`${section.heading}-${index}`}
                  canManageDocs={canManageDocs}
                  content={section.content}
                  eyebrow={`Section ${index + 1}`}
                  onChange={(content) => updateSection(index, content)}
                  onRemove={() => removeSection(index)}
                  removable
                  title={section.heading}
                />
              ))}
            </div>
          ) : null}

          <details className="rounded-[24px] border border-line bg-[#fbfaf7] p-4">
            <summary className="cursor-pointer text-sm font-black text-foreground">Advanced: edit raw markdown</summary>
            <textarea
              ref={rawTextareaRef}
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              onClick={onRawCursorChange}
              onFocus={onRawCursorChange}
              onKeyUp={onRawCursorChange}
              onSelect={onRawCursorChange}
              disabled={!canManageDocs}
              className="mt-4 min-h-[420px] w-full resize-y rounded-[20px] border border-line bg-white px-5 py-5 font-mono text-sm leading-7 text-slate-700 outline-none focus:border-[#111111] disabled:text-ink-soft"
            />
          </details>
        </div>
      </section>
    </div>
  );
}

function StructuredSectionCard({
  canManageDocs,
  content,
  eyebrow,
  onChange,
  onRemove,
  removable = false,
  title,
}: {
  canManageDocs: boolean;
  content: string;
  eyebrow: string;
  onChange: (content: string) => void;
  onRemove?: () => void;
  removable?: boolean;
  title: string;
}) {
  const table = useMemo(() => extractFirstMarkdownTable(content), [content]);
  const checklist = useMemo(() => extractChecklist(content), [content]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-[#fbfaf7] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-dark">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">{title}</h3>
        </div>
        {removable && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canManageDocs}
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </button>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">
        {table ? (
          <EditableMarkdownTable block={table} canManageDocs={canManageDocs} onChange={onChange} />
        ) : checklist ? (
          <EditableChecklist block={checklist} canManageDocs={canManageDocs} onChange={onChange} />
        ) : (
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Section content</span>
            <textarea
              value={content.trimStart()}
              onChange={(event) => onChange(event.target.value)}
              disabled={!canManageDocs}
              placeholder="Write the useful information for this section."
              className="mt-3 min-h-[180px] w-full resize-y rounded-[22px] border border-line bg-white px-5 py-4 text-base font-medium leading-8 text-slate-700 outline-none focus:border-[#111111] disabled:bg-panel-muted disabled:text-ink-soft"
            />
          </label>
        )}
      </div>
    </section>
  );
}

type MarkdownTableBlock = {
  after: string;
  before: string;
  headers: string[];
  rows: string[][];
};

function EditableMarkdownTable({
  block,
  canManageDocs,
  onChange,
}: {
  block: MarkdownTableBlock;
  canManageDocs: boolean;
  onChange: (content: string) => void;
}) {
  const updateBefore = (before: string) => onChange(buildContentWithTable({ ...block, before }));
  const updateAfter = (after: string) => onChange(buildContentWithTable({ ...block, after }));
  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    const rows = block.rows.map((row, currentRowIndex) =>
      currentRowIndex === rowIndex ? row.map((cell, currentCellIndex) => (currentCellIndex === cellIndex ? value : cell)) : row,
    );
    onChange(buildContentWithTable({ ...block, rows }));
  };
  const addRow = () => {
    onChange(buildContentWithTable({ ...block, rows: [...block.rows, block.headers.map(() => "")] }));
  };

  return (
    <div className="space-y-5">
      {block.before.trim() ? (
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Section note</span>
          <textarea
            value={block.before.trimStart()}
            onChange={(event) => updateBefore(event.target.value)}
            disabled={!canManageDocs}
            className="mt-3 min-h-[110px] w-full resize-y rounded-[20px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-slate-700 outline-none focus:border-[#111111] disabled:bg-panel-muted"
          />
        </label>
      ) : null}

      <div className="overflow-hidden rounded-[22px] border border-line shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white text-left">
            <thead>
              <tr className="bg-slate-50">
                {block.headers.map((header) => (
                  <th key={header} className="border-b border-line px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {header || "Field"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.rows.length ? block.rows : [block.headers.map(() => "")]).map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b border-line last:border-b-0">
                  {block.headers.map((header, cellIndex) => (
                    <td
                      key={`${header}-${cellIndex}`}
                      className={cn(
                        "align-top border-r border-line p-2 last:border-r-0",
                        cellIndex === 0 ? "min-w-[190px]" : "min-w-[340px]",
                      )}
                    >
                      <StructuredTableInput
                        disabled={!canManageDocs}
                        header={header}
                        onChange={(value) => updateCell(rowIndex, cellIndex, value)}
                        value={row[cellIndex] ?? ""}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={!canManageDocs}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-[#fbfaf7] px-4 text-sm font-black text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add row
      </button>

      {block.after.trim() ? (
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Notes after table</span>
          <textarea
            value={block.after.trimStart()}
            onChange={(event) => updateAfter(event.target.value)}
            disabled={!canManageDocs}
            className="mt-3 min-h-[110px] w-full resize-y rounded-[20px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-slate-700 outline-none focus:border-[#111111] disabled:bg-panel-muted"
          />
        </label>
      ) : null}
    </div>
  );
}

function StructuredTableInput({
  disabled,
  header,
  onChange,
  value,
}: {
  disabled: boolean;
  header: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const normalizedValue = displayMarkdownTableCell(value);
  const [draft, setDraft] = useState(normalizedValue);
  const placeholder = promptPlaceholder(value) || header;
  const choices = tableChoicesForHeader(header, normalizedValue);
  const lowerHeader = header.toLowerCase();

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  const updateDraft = (nextValue: string) => {
    setDraft(nextValue);
    onChange(nextValue);
  };

  if (lowerHeader.includes("date") || lowerHeader.includes("deadline") || lowerHeader.includes("due")) {
    return (
      <input
        type="date"
        value={toDateInputValue(draft)}
        onChange={(event) => updateDraft(formatDateForDocument(event.target.value))}
        disabled={disabled}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-[#111111] disabled:bg-panel-muted"
      />
    );
  }

  if (choices.length) {
    return (
      <select
        value={choices.includes(draft) ? draft : ""}
        onChange={(event) => updateDraft(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-[#111111] disabled:bg-panel-muted"
      >
        <option value="">{placeholder}</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    );
  }

  return (
    <textarea
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      rows={draft.length > 80 || draft.includes("\n") ? 3 : 1}
      className="min-h-10 w-full resize-y whitespace-pre-wrap break-words rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold leading-6 text-foreground outline-none placeholder:text-slate-400 focus:border-[#111111] disabled:bg-panel-muted"
    />
  );
}

type ChecklistBlock = {
  after: string;
  before: string;
  items: Array<{ checked: boolean; text: string }>;
};

function EditableChecklist({
  block,
  canManageDocs,
  onChange,
}: {
  block: ChecklistBlock;
  canManageDocs: boolean;
  onChange: (content: string) => void;
}) {
  const updateItem = (itemIndex: number, patch: Partial<{ checked: boolean; text: string }>) => {
    const items = block.items.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item));
    onChange(buildContentWithChecklist({ ...block, items }));
  };
  const addItem = () => onChange(buildContentWithChecklist({ ...block, items: [...block.items, { checked: false, text: "" }] }));

  return (
    <div className="space-y-5">
      {block.before.trim() ? (
        <textarea
          value={block.before.trimStart()}
          onChange={(event) => onChange(buildContentWithChecklist({ ...block, before: event.target.value }))}
          disabled={!canManageDocs}
          className="min-h-[110px] w-full resize-y rounded-[20px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-slate-700 outline-none focus:border-[#111111] disabled:bg-panel-muted"
        />
      ) : null}
      <div className="grid gap-3">
        {block.items.map((item, index) => (
          <label key={`check-${index}`} className="flex items-center gap-3 rounded-2xl border border-line bg-[#fbfaf7] px-4 py-3">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(event) => updateItem(index, { checked: event.target.checked })}
              disabled={!canManageDocs}
              className="size-5 rounded border-line accent-[#111111]"
            />
            <input
              value={stripPromptBrackets(item.text)}
              onChange={(event) => updateItem(index, { text: event.target.value })}
              disabled={!canManageDocs}
              placeholder={promptPlaceholder(item.text) || "Checklist item"}
              className="min-w-0 flex-1 border-none bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-slate-400"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        disabled={!canManageDocs}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add item
      </button>
      {block.after.trim() ? (
        <textarea
          value={block.after.trimStart()}
          onChange={(event) => onChange(buildContentWithChecklist({ ...block, after: event.target.value }))}
          disabled={!canManageDocs}
          className="min-h-[110px] w-full resize-y rounded-[20px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-slate-700 outline-none focus:border-[#111111] disabled:bg-panel-muted"
        />
      ) : null}
    </div>
  );
}

function parseStructuredDocumentBody(body: string): ParsedStructuredDocument {
  const normalized = body.replace(/\r\n/g, "\n");
  const matches = Array.from(normalized.matchAll(/^##\s+(.+)$/gm));
  const rawLead = matches.length ? normalized.slice(0, matches[0].index ?? 0).trimEnd() : normalized.trimEnd();
  const titleMatch = rawLead.match(/^#\s+.+(?:\n|$)/);
  const leadTitle = titleMatch?.[0].trimEnd() ?? "";
  const lead = titleMatch ? rawLead.slice(titleMatch[0].length).trimStart() : rawLead;
  const sections = matches.map((match, index) => {
    const headingLine = match[0];
    const start = (match.index ?? 0) + headingLine.length;
    const next = matches[index + 1]?.index ?? normalized.length;
    return {
      content: normalized.slice(start, next).replace(/^\n+/, "").trimEnd(),
      heading: match[1].trim(),
      level: 2 as const,
    };
  });
  return { lead, leadTitle, sections };
}

function buildStructuredDocumentBody(leadTitle: string, lead: string, sections: StructuredDocSection[]) {
  const leadParts = [leadTitle.trim(), lead.trim()].filter(Boolean).join("\n\n");
  const sectionParts = sections.map((section) => `## ${section.heading}\n${section.content.trim()}`.trim());
  return [leadParts, ...sectionParts].filter(Boolean).join("\n\n").trimEnd();
}

function extractFirstMarkdownTable(content: string): MarkdownTableBlock | null {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].includes("|") || !isMarkdownSeparatorLine(lines[index + 1])) continue;
    const tableLines: string[] = [lines[index], lines[index + 1]];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor].includes("|")) {
      tableLines.push(lines[cursor]);
      cursor += 1;
    }
    const headers = splitMarkdownRow(tableLines[0]);
    const rows = tableLines.slice(2).map((line) => normalizeTableRow(splitMarkdownRow(line), headers.length));
    return {
      after: lines.slice(cursor).join("\n").trim(),
      before: lines.slice(0, index).join("\n").trim(),
      headers,
      rows,
    };
  }
  return null;
}

function extractChecklist(content: string): ChecklistBlock | null {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const itemIndexes = lines
    .map((line, index) => ({ index, match: line.match(/^\s*-\s+\[([ xX])\]\s+(.*)$/) }))
    .filter((item): item is { index: number; match: RegExpMatchArray } => Boolean(item.match));
  if (!itemIndexes.length) return null;
  const first = itemIndexes[0].index;
  const last = itemIndexes[itemIndexes.length - 1].index;
  return {
    after: lines.slice(last + 1).join("\n").trim(),
    before: lines.slice(0, first).join("\n").trim(),
    items: itemIndexes.map(({ match }) => ({ checked: match[1].toLowerCase() === "x", text: match[2] })),
  };
}

function buildContentWithTable(block: MarkdownTableBlock) {
  const tableRows = [
    formatMarkdownRow(block.headers),
    formatMarkdownRow(block.headers.map(() => "---")),
    ...block.rows.map((row) => formatMarkdownRow(normalizeTableRow(row, block.headers.length))),
  ];
  return [block.before.trim(), tableRows.join("\n"), block.after.trim()].filter(Boolean).join("\n\n");
}

function buildContentWithChecklist(block: ChecklistBlock) {
  const items = block.items.map((item) => `- [${item.checked ? "x" : " "}] ${item.text || "[Checklist item]"}`).join("\n");
  return [block.before.trim(), items, block.after.trim()].filter(Boolean).join("\n\n");
}

function splitMarkdownRow(row: string) {
  const cells: string[] = [];
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  let current = "";
  let escaped = false;

  for (const char of trimmed) {
    if (char === "|" && !escaped) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    if (char === "\\" && !escaped) {
      escaped = true;
      current += char;
      continue;
    }
    escaped = false;
    current += char;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/\\\|/g, "|"));
}

function formatMarkdownRow(cells: string[]) {
  return `| ${cells.map((cell) => formatMarkdownTableCell(cell)).join(" | ")} |`;
}

function formatMarkdownTableCell(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return " ";
  return normalized.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function isMarkdownSeparatorLine(line: string) {
  const cells = splitMarkdownRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function normalizeTableRow(row: string[], length: number) {
  return Array.from({ length }, (_, index) => row[index] ?? "");
}

function stripPromptBrackets(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[([^\]]+)\]$/);
  return match ? "" : value;
}

function displayMarkdownTableCell(value: string) {
  return stripPromptBrackets(value).replace(/<br\s*\/?>/gi, "\n").replace(/\\\|/g, "|");
}

function promptPlaceholder(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^\[([^\]]+)\]$/);
  return match?.[1] ?? "";
}

function tableChoicesForHeader(header: string, currentValue: string) {
  const lower = header.trim().toLowerCase();
  let choices: string[] = [];
  if (lower.includes("status") || lower === "decision") {
    choices = ["Not started", "In progress", "Complete", "Draft", "Active", "Needs review", "Retired", "Open", "Watching", "Closed", "Selected", "Rejected", "Deferred", "Superseded"];
  } else if (lower.includes("impact") || lower.includes("severity")) {
    choices = ["Low", "Medium", "High", "Critical"];
  } else if (lower.includes("cadence")) {
    choices = ["Daily", "Weekly", "Monthly", "Quarterly", "As needed"];
  }
  return currentValue && !choices.includes(currentValue) ? [...choices, currentValue] : choices;
}

function toDateInputValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function formatDateForDocument(value: string) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function AuthoringCommandBar({
  blockMenuOpen,
  canManageDocs,
  documentSnippets,
  onAttachFile,
  onCloseBlockMenu,
  onInsertSnippet,
  onOpenBlockMenu,
  uploadingFile,
}: {
  blockMenuOpen: boolean;
  canManageDocs: boolean;
  documentSnippets: Array<{ body: string; label: string }>;
  onAttachFile: () => void;
  onCloseBlockMenu: () => void;
  onInsertSnippet: (body: string) => void;
  onOpenBlockMenu: () => void;
  uploadingFile: boolean;
}) {
  return (
    <div className="relative rounded-[28px] border border-line bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">Write mode</p>
          <h2 className="text-lg font-black text-foreground">Build the page from clean blocks</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink-soft">
            Use helpers for sections, tables, dates, statuses, prompts, and evidence. Preview hides unused instructions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenBlockMenu}
            disabled={!canManageDocs}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add block
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onAttachFile}
            disabled={!canManageDocs || uploadingFile}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line bg-[#fbfaf7] px-4 text-sm font-black text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingFile ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
            {uploadingFile ? "Uploading" : "Upload"}
          </button>
        </div>
      </div>

      {blockMenuOpen ? (
        <div className="absolute left-3 top-[calc(100%+8px)] z-20 w-[min(600px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_rgba(17,17,17,0.18)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">Block library</p>
              <p className="text-sm font-black text-foreground">Insert reusable document structure</p>
            </div>
            <button
              type="button"
              onClick={onCloseBlockMenu}
              className="inline-flex size-8 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
              aria-label="Close block menu"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-1 p-2 sm:grid-cols-2">
            {documentSnippets.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => {
                  onInsertSnippet(snippet.body);
                  onCloseBlockMenu();
                }}
                className="group flex items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#fbfaf7]"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-[#111111]">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-foreground">{snippet.label}</span>
                  <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-4 text-ink-soft">
                    {snippet.body.split("\n").find((line) => line.trim() && !line.startsWith("##"))?.replace(/\[|\]/g, "") || "Structured content block"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PromptReplacementPanel({
  activePrompt,
  canManageDocs,
  customPromptValue,
  onApplyPrompt,
  onClosePrompt,
  onCustomPromptValueChange,
  onPromptValueChange,
  promptValue,
}: {
  activePrompt: PlaceholderPrompt;
  canManageDocs: boolean;
  customPromptValue: string;
  onApplyPrompt: () => void;
  onClosePrompt: () => void;
  onCustomPromptValueChange: (value: string) => void;
  onPromptValueChange: (value: string) => void;
  promptValue: string;
}) {
  const promptTitle =
    activePrompt.kind === "date"
      ? "Date prompt"
      : activePrompt.kind === "options"
        ? "Choice prompt"
        : "Text prompt";
  const showCustomInput = activePrompt.kind === "text" || promptValue === "__custom";

  return (
    <section className="rounded-[24px] border border-[#b9ccff] bg-[#eef2ff] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3154d4]">{promptTitle}</p>
          <h3 className="mt-1 break-words text-lg font-black text-foreground">Replace {activePrompt.placeholder}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Enter the final value for this one placeholder. No section tools or table helpers are shown here.
          </p>
        </div>
        <button
          type="button"
          onClick={onClosePrompt}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl border border-[#b9ccff] bg-white text-ink-soft transition hover:border-[#3154d4] hover:text-[#3154d4]"
          aria-label="Close prompt helper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        {activePrompt.kind === "date" ? (
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Pick date
            <input
              type="date"
              value={promptValue}
              onChange={(event) => onPromptValueChange(event.target.value)}
              disabled={!canManageDocs}
              className="mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold normal-case tracking-normal text-foreground outline-none focus:border-[#3154d4] disabled:bg-panel-muted"
            />
          </label>
        ) : null}

        {activePrompt.kind === "options" ? (
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Choose value
            <select
              value={promptValue}
              onChange={(event) => onPromptValueChange(event.target.value)}
              disabled={!canManageDocs}
              className="mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold normal-case tracking-normal text-foreground outline-none focus:border-[#3154d4] disabled:bg-panel-muted"
            >
              {activePrompt.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__custom">Other value...</option>
            </select>
          </label>
        ) : null}

        {showCustomInput ? (
          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {activePrompt.kind === "text" ? "Replacement" : "Custom value"}
            <input
              value={customPromptValue}
              onChange={(event) => onCustomPromptValueChange(event.target.value)}
              disabled={!canManageDocs}
              placeholder={activePrompt.kind === "text" ? "Type the final text" : "Type another option"}
              className="mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold normal-case tracking-normal text-foreground outline-none focus:border-[#3154d4] disabled:bg-panel-muted"
            />
          </label>
        ) : null}

        <button
          type="button"
          onClick={onApplyPrompt}
          disabled={!canManageDocs}
          className="h-12 rounded-2xl bg-[#3154d4] px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(49,84,212,0.24)] transition hover:bg-[#2645c0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Replace prompt
        </button>
      </div>
    </section>
  );
}

function SectionReviewPanel({
  activeSection,
  canManageDocs,
  onCloseSection,
  onRemoveSection,
  reviewingSection,
}: {
  activeSection: DocumentSection;
  canManageDocs: boolean;
  onCloseSection: () => void;
  onRemoveSection: () => void;
  reviewingSection: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border p-5 shadow-sm transition",
        reviewingSection ? "border-red-300 bg-red-50" : "border-line bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("text-[10px] font-black uppercase tracking-[0.18em]", reviewingSection ? "text-red-700" : "text-primary-dark")}>
            {reviewingSection ? "Confirm removal" : "Current section"}
          </p>
          <h3 className="mt-1 break-words text-lg font-black text-foreground">{activeSection.title}</h3>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink-soft">
            This panel only manages the selected section. The section is highlighted for removal before it is deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseSection}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
          aria-label="Close section helper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRemoveSection}
          disabled={!canManageDocs}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
            reviewingSection
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
          )}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {reviewingSection ? "Confirm remove section" : "Remove section"}
        </button>
        <button
          type="button"
          onClick={onCloseSection}
          className="inline-flex h-11 items-center rounded-2xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted"
        >
          Keep section
        </button>
      </div>
    </section>
  );
}

function AuthoringAssistant({
  activePrompt,
  activeSection,
  canManageDocs,
  customPromptValue,
  dueDate,
  helperStatus,
  milestoneTitle,
  onApplyPrompt,
  onClosePrompt,
  onCloseSection,
  onCustomPromptValueChange,
  onDueDateChange,
  onInsertMilestoneRow,
  onInsertRiskRow,
  onInsertStatusUpdate,
  onMilestoneTitleChange,
  onOwnerChange,
  onPromptValueChange,
  onRemoveSection,
  onRiskImpactChange,
  onRiskMitigationChange,
  onRiskTitleChange,
  onStatusChange,
  owner,
  promptValue,
  reviewingSection,
  riskImpact,
  riskMitigation,
  riskTitle,
}: {
  activePrompt: PlaceholderPrompt | null;
  activePromptKey: string;
  activeSection: DocumentSection | null;
  activeSectionKey: string;
  canManageDocs: boolean;
  customPromptValue: string;
  dueDate: string;
  helperStatus: string;
  milestoneTitle: string;
  onApplyPrompt: () => void;
  onClosePrompt: () => void;
  onCloseSection: () => void;
  onCustomPromptValueChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onInsertMilestoneRow: () => void;
  onInsertRiskRow: () => void;
  onInsertStatusUpdate: () => void;
  onMilestoneTitleChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onPromptValueChange: (value: string) => void;
  onRemoveSection: () => void;
  onRiskImpactChange: (value: string) => void;
  onRiskMitigationChange: (value: string) => void;
  onRiskTitleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  owner: string;
  promptValue: string;
  reviewingSection: boolean;
  riskImpact: string;
  riskMitigation: string;
  riskTitle: string;
}) {
  const promptTitle =
    activePrompt?.kind === "date"
      ? "Date prompt"
      : activePrompt?.kind === "options"
        ? "Option prompt"
        : "Text prompt";
  const showCustomInput = activePrompt?.kind === "text" || promptValue === "__custom";

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-[#fafaf8] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#111111]">
            <Pilcrow className="size-3.5 text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">Writing tools</p>
            <p className="text-sm font-black text-foreground">Smart inserters</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-black text-ink-soft">
          <Rows3 className="size-3" aria-hidden="true" />
          Markdown
        </span>
      </div>

      <div className="divide-y divide-line">
        {activePrompt ? (
          <div className="bg-[#eef2ff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3154d4]">{promptTitle}</p>
                <p className="mt-0.5 text-sm font-black text-foreground">Replace [{activePrompt.placeholder}]</p>
              </div>
              <button
                type="button"
                onClick={onClosePrompt}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-[#b9ccff] bg-white text-ink-soft transition hover:text-foreground"
                aria-label="Close prompt helper"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {activePrompt.kind === "date" ? (
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  Pick date
                  <input
                    type="date"
                    value={promptValue}
                    onChange={(event) => onPromptValueChange(event.target.value)}
                    disabled={!canManageDocs}
                    className="mt-1 h-9 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-[#3154d4] disabled:bg-panel-muted"
                  />
                </label>
              ) : null}
              {activePrompt.kind === "options" ? (
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  Choose value
                  <select
                    value={promptValue}
                    onChange={(event) => onPromptValueChange(event.target.value)}
                    disabled={!canManageDocs}
                    className="mt-1 h-9 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
                  >
                    {activePrompt.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value="__custom">Other value...</option>
                  </select>
                </label>
              ) : null}
              {showCustomInput ? (
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  {activePrompt.kind === "text" ? "Replacement" : "Custom value"}
                  <input
                    value={customPromptValue}
                    onChange={(event) => onCustomPromptValueChange(event.target.value)}
                    disabled={!canManageDocs}
                    placeholder={activePrompt.kind === "text" ? "Type the final text" : "Type another option"}
                    className="mt-1 h-9 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
                  />
                </label>
              ) : null}
              <button
                type="button"
                onClick={onApplyPrompt}
                disabled={!canManageDocs}
                className="mt-1 h-9 w-full rounded-xl bg-[#3154d4] text-sm font-black text-white transition hover:bg-[#2645c0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace prompt
              </button>
            </div>
          </div>
        ) : null}

        {activeSection ? (
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3 transition",
              reviewingSection ? "bg-red-50" : "bg-white",
            )}
          >
            <div className="min-w-0">
              <p className={cn("text-[10px] font-black uppercase tracking-[0.14em]", reviewingSection ? "text-red-700" : "text-ink-soft")}>
                {reviewingSection ? "Selected for removal" : "Current section"}
              </p>
              <p className="mt-0.5 truncate text-sm font-black text-foreground">{activeSection.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onRemoveSection}
                disabled={!canManageDocs}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-black transition disabled:opacity-50",
                  reviewingSection ? "border-red-300 bg-red-600 text-white hover:bg-red-700" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                )}
              >
                <Trash2 className="size-3" aria-hidden="true" />
                Remove
              </button>
              <button
                type="button"
                onClick={onCloseSection}
                className="inline-flex size-8 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
                aria-label="Close section helper"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="size-4 text-primary-dark" aria-hidden="true" />
            <p className="text-sm font-black text-foreground">Status update</p>
          </div>
          <div className="grid gap-2">
            <input
              value={owner}
              onChange={(event) => onOwnerChange(event.target.value)}
              disabled={!canManageDocs}
              placeholder="Owner name"
              className="h-9 w-full rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none focus:border-[#111111] focus:bg-white disabled:bg-panel-muted"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => onDueDateChange(event.target.value)}
                disabled={!canManageDocs}
                className="h-9 w-full rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none focus:border-[#111111] focus:bg-white disabled:bg-panel-muted"
              />
              <select
                value={helperStatus}
                onChange={(event) => onStatusChange(event.target.value)}
                disabled={!canManageDocs}
                className="h-9 w-full rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none disabled:bg-panel-muted"
              >
                {statusHelperOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={onInsertStatusUpdate}
            disabled={!canManageDocs}
            className="mt-3 h-9 w-full rounded-xl bg-primary text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert update
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Table2 className="size-4 text-primary-dark" aria-hidden="true" />
            <p className="text-sm font-black text-foreground">Milestone row</p>
          </div>
          <div className="flex gap-2">
            <input
              value={milestoneTitle}
              onChange={(event) => onMilestoneTitleChange(event.target.value)}
              disabled={!canManageDocs}
              placeholder="Milestone title"
              className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none focus:border-[#111111] focus:bg-white disabled:bg-panel-muted"
            />
            <button
              type="button"
              onClick={onInsertMilestoneRow}
              disabled={!canManageDocs}
              className="h-9 shrink-0 rounded-xl border border-line bg-[#fbfaf7] px-3 text-sm font-black text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add row
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Table2 className="size-4 text-amber-600" aria-hidden="true" />
            <p className="text-sm font-black text-foreground">Risk row</p>
          </div>
          <div className="grid gap-2">
            <div className="flex gap-2">
              <input
                value={riskTitle}
                onChange={(event) => onRiskTitleChange(event.target.value)}
                disabled={!canManageDocs}
                placeholder="Risk title"
                className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none focus:border-[#111111] focus:bg-white disabled:bg-panel-muted"
              />
              <select
                value={riskImpact}
                onChange={(event) => onRiskImpactChange(event.target.value)}
                disabled={!canManageDocs}
                className="h-9 w-24 shrink-0 rounded-xl border border-line bg-[#fafaf8] px-2 text-sm font-semibold outline-none disabled:bg-panel-muted"
              >
                {["Low", "Medium", "High", "Critical"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                value={riskMitigation}
                onChange={(event) => onRiskMitigationChange(event.target.value)}
                disabled={!canManageDocs}
                placeholder="Mitigation plan"
                className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-[#fafaf8] px-3 text-sm font-semibold outline-none focus:border-[#111111] focus:bg-white disabled:bg-panel-muted"
              />
              <button
                type="button"
                onClick={onInsertRiskRow}
                disabled={!canManageDocs}
                className="h-9 shrink-0 rounded-xl border border-line bg-[#fbfaf7] px-3 text-sm font-black text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add row
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnippetButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs font-black text-foreground shadow-sm transition hover:border-[#111111] hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="size-3.5 text-primary-dark" aria-hidden="true" />
      {label}
    </button>
  );
}

function PlaceholderPromptHelper({
  customValue,
  disabled,
  onApply,
  onClose,
  onCustomValueChange,
  onValueChange,
  prompt,
  value,
}: {
  customValue: string;
  disabled: boolean;
  onApply: () => void;
  onClose: () => void;
  onCustomValueChange: (value: string) => void;
  onValueChange: (value: string) => void;
  prompt: PlaceholderPrompt | null;
  value: string;
}) {
  if (!prompt) {
    return null;
  }

  const promptTitle =
    prompt.kind === "date"
      ? "Date prompt"
      : prompt.kind === "options"
        ? "Option prompt"
        : "Text prompt";
  const showCustomInput = prompt.kind === "text" || value === "__custom";

  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-4xl rounded-[20px] border border-primary/60 bg-[#fffdf1] p-3 pr-12 shadow-[0_24px_70px_rgba(17,17,17,0.22)] sm:bottom-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
        aria-label="Close prompt helper"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-dark">Fill selected prompt</p>
          <p className="mt-1 text-sm font-black text-foreground">{promptTitle}: {prompt.placeholder}</p>
        </div>

        {prompt.kind === "date" ? (
          <label className="min-w-[180px] text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
            Pick date
            <input
              type="date"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              disabled={disabled}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
            />
          </label>
        ) : null}

        {prompt.kind === "options" ? (
          <label className="min-w-[220px] text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
            Choose value
            <select
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              disabled={disabled}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
            >
              {prompt.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__custom">Other value...</option>
            </select>
          </label>
        ) : null}

        {showCustomInput ? (
          <label className="min-w-[220px] flex-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
            {prompt.kind === "text" ? "Replacement" : "Custom value"}
            <input
              value={customValue}
              onChange={(event) => onCustomValueChange(event.target.value)}
              disabled={disabled}
              placeholder={prompt.kind === "text" ? "Type the final text" : "Type another option"}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
            />
          </label>
        ) : null}

        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="h-10 rounded-xl bg-[#111111] px-4 text-sm font-black text-white shadow-sm transition hover:bg-black disabled:opacity-50"
        >
          Replace prompt
        </button>
      </div>
    </div>
  );
}

function SectionControl({
  disabled,
  onClose,
  onRemove,
  reviewing,
  section,
}: {
  disabled: boolean;
  onClose: () => void;
  onRemove: () => void;
  reviewing: boolean;
  section: DocumentSection | null;
}) {
  if (!section) return null;

  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm transition",
        reviewing
          ? "border-red-300 bg-red-50 shadow-[0_0_0_3px_rgba(239,68,68,0.10)]"
          : "border-line bg-white",
      )}
    >
      <div className="min-w-0">
        <p className={cn("text-[10px] font-black uppercase tracking-[0.16em]", reviewing ? "text-red-700" : "text-ink-soft")}>
          {reviewing ? "Section selected for removal" : "Current section"}
        </p>
        <p className="truncate text-sm font-black text-foreground">{section.title}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50",
            reviewing ? "border-red-300 bg-red-600 text-white hover:bg-red-700" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
          )}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          {reviewing ? "Confirming..." : "Remove section"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-[#111111] hover:text-foreground"
          aria-label="Close section helper"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function StructuredFieldHelper({
  disabled,
  dueDate,
  onDueDateChange,
  onInsert,
  onOwnerChange,
  onStatusChange,
  owner,
  status,
}: {
  disabled: boolean;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  onInsert: () => void;
  onOwnerChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  owner: string;
  status: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[180px] flex-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
          Owner
          <input
            value={owner}
            onChange={(event) => onOwnerChange(event.target.value)}
            disabled={disabled}
            placeholder="Owner name"
            className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
          />
        </label>
        <label className="min-w-[150px] text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
          Date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            disabled={disabled}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
          />
        </label>
        <label className="min-w-[170px] text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
          Status
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            disabled={disabled}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none disabled:bg-panel-muted"
          >
            {statusHelperOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onInsert}
          disabled={disabled}
          className="h-10 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] shadow-sm transition hover:bg-primary-dark disabled:opacity-50"
        >
          Insert update
        </button>
      </div>
    </div>
  );
}

function WritingGuideCard({ guide }: { guide: string[] }) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <SectionHeader eyebrow="Template guide" title="Complete these sections" />
      <div className="mt-4 grid gap-2">
        {guide.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-2xl border border-line bg-[#fbfaf7] p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-[#111111]">
              {index + 1}
            </span>
            <p className="text-sm font-semibold leading-5 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterSelect({ children, onChange, value }: { children: ReactNode; onChange: (value: string) => void; value: string }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-line bg-white px-3 text-sm font-black outline-none">
      {children}
    </select>
  );
}

function SectionHeader({ action, eyebrow, title }: { action?: ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">{eyebrow}</p>
        <h2 className="text-base font-black text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StarterCard({
  action,
  description,
  icon: Icon,
  onClick,
  title,
}: {
  action: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  title: string;
}) {
  return (
    <button type="button" onClick={onClick} className="group rounded-[24px] border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-md">
      <div className="flex h-24 items-center justify-center rounded-2xl bg-[#f4f7ff]">
        <Icon className="size-8 text-[#3154d4]" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-black text-foreground">{title}</h3>
      <p className="mt-1 min-h-10 text-sm font-semibold leading-5 text-ink-soft">{description}</p>
      <p className="mt-5 text-sm font-black text-[#3154d4]">{action}</p>
    </button>
  );
}

function TemplateCard({ onClick, template }: { onClick: () => void; template: DocTemplate }) {
  const Icon = template.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-[24px] border border-line bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-[0_20px_40px_rgba(17,17,17,0.10)]"
    >
      <div className="flex h-[148px] flex-col justify-between border-b border-line bg-[#fafaf8] p-5">
        <span className={cn("inline-flex size-11 items-center justify-center rounded-2xl", template.accent)}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h3 className="text-[15px] font-black leading-snug text-foreground">{template.title}</h3>
      </div>
      <div className="p-5">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink-soft">{template.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm font-black text-[#111111] transition group-hover:text-[#3154d4]">Use template →</span>
          {template.guide?.length ? (
            <span className="rounded-full border border-line bg-panel-muted px-2.5 py-1 text-[11px] font-black text-ink-soft">
              {template.guide.length} steps
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function FolderPanel({
  canManageDocs,
  folders,
  folderFilter,
  metrics,
  setFolderFilter,
  toggleFolderArchive,
}: {
  canManageDocs: boolean;
  folders: DocumentFolder[];
  folderFilter: string;
  metrics: { total: number };
  setFolderFilter: (value: string) => void;
  toggleFolderArchive: (folder: DocumentFolder) => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-line bg-white shadow-sm">
      <div className="border-b border-line p-4">
        <SectionHeader eyebrow="Spaces" title="Folders" />
      </div>
      <div className="space-y-2 p-3">
        <button
          type="button"
          onClick={() => setFolderFilter("ALL")}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition",
            folderFilter === "ALL" ? "border-[#111111] bg-[#111111] text-white" : "border-line bg-white text-foreground hover:bg-panel-muted",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Folder className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate text-sm font-black">All documents</span>
          </span>
          <span className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-black">{metrics.total}</span>
        </button>
        {folders.map((folder) => (
          <div key={folder.id} className="group rounded-xl border border-line bg-white p-2">
            <button
              type="button"
              onClick={() => setFolderFilter(folder.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-panel-muted"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {folder.archivedAt ? <FolderArchive className="size-4 text-ink-soft" aria-hidden="true" /> : <Folder className="size-4 text-primary-dark" aria-hidden="true" />}
                  <span className="truncate text-sm font-black text-foreground">{folder.name}</span>
                </span>
                <span className="mt-1 block truncate text-[11px] font-semibold text-ink-soft">{folder.description || `${folder._count?.documents ?? 0} docs`}</span>
              </span>
              <span className="rounded-lg bg-panel-muted px-2 py-1 text-[11px] font-black text-ink-soft">{folder._count?.documents ?? 0}</span>
            </button>
            {canManageDocs ? (
              <button
                type="button"
                onClick={() => void toggleFolderArchive(folder)}
                className="mt-1 hidden w-full rounded-lg px-2 py-1 text-left text-[11px] font-black text-ink-soft transition hover:bg-panel-muted group-hover:block"
              >
                {folder.archivedAt ? "Restore folder" : "Archive folder"}
              </button>
            ) : null}
          </div>
        ))}
        {!folders.length ? <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm font-semibold text-ink-soft">No folders yet.</p> : null}
      </div>
    </section>
  );
}

function DocumentListRow({ document, onOpen }: { document: WorkspaceDocument; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-[#fbfaf7]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-panel-muted text-ink-soft">
        <FileText className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-black text-foreground">{document.title}</span>
        <span className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-ink-soft">{document.summary || document.body || "No summary yet."}</span>
        <span className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black text-ink-soft">
          <span className={cn("rounded-lg border px-2 py-1", statusTone(document.status))}>{document.status}</span>
          <span className="rounded-lg bg-panel-muted px-2 py-1">{document.documentType.replace(/_/g, " ")}</span>
          <span className="rounded-lg bg-panel-muted px-2 py-1">{visibilityLabel(document.visibility)}</span>
          {document.folder ? <span className="rounded-lg bg-panel-muted px-2 py-1">{document.folder.name}</span> : null}
          {document.project ? <span className="rounded-lg bg-panel-muted px-2 py-1">{document.project.key}</span> : null}
        </span>
      </span>
      <span className="hidden shrink-0 text-right text-xs font-semibold text-ink-soft sm:block">
        Updated
        <span className="mt-1 block font-black text-foreground">{compactDate(document.updatedAt)}</span>
      </span>
    </button>
  );
}

function MiniStatPanel({ metrics }: { metrics: { draft: number; folders: number; published: number; total: number; versions: number } }) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <SectionHeader eyebrow="Overview" title="Library health" />
      <div className="mt-4 grid gap-2">
        <StatRow icon={FileText} label="Documents" value={metrics.total} />
        <StatRow icon={Send} label="Published" value={metrics.published} tone="text-emerald-700" />
        <StatRow icon={Clock3} label="Drafts" value={metrics.draft} tone="text-amber-700" />
        <StatRow icon={Folder} label="Folders" value={metrics.folders} tone="text-blue-700" />
        <StatRow icon={History} label="Versions" value={metrics.versions} />
      </div>
    </section>
  );
}

function StatRow({ icon: Icon, label, tone = "text-foreground", value }: { icon: LucideIcon; label: string; tone?: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[#fbfaf7] px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-black text-foreground">
        <Icon className="size-4 text-ink-soft" aria-hidden="true" />
        {label}
      </span>
      <span className={cn("text-lg font-black", tone)}>{value}</span>
    </div>
  );
}

function GovernanceRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[#fbfaf7] px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-black text-foreground">
        <Icon className="size-4 text-primary-dark" aria-hidden="true" />
        {label}
      </span>
      <span className="text-xs font-black text-ink-soft">{value}</span>
    </div>
  );
}

function MetadataCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-line bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function MarkdownPreview({ body }: { body: string }) {
  const blocks = parseMarkdownBlocks(body);
  if (!blocks.length) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line px-5 py-12 text-center">
        <FileText className="mx-auto size-8 text-ink-soft" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-black text-foreground">Nothing to preview yet.</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Write content first, then switch back to preview.</p>
      </div>
    );
  }
  return <div className="tb-doc-preview mt-8 grid gap-5">{blocks}</div>;
}

function normalizePreviewText(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed || isTemplateInstructionLine(trimmed)) return null;

  const bracketOnly = trimmed.match(/^\[([^\]]+)\]$/);
  if (!bracketOnly) return trimmed;

  const inner = bracketOnly[1].trim();
  if (isOptionSet(inner)) return inner;
  return isTemplatePlaceholder(inner) ? null : inner;
}

function normalizePreviewCell(raw: string) {
  return normalizePreviewText(raw) ?? "";
}

function isTemplateInstructionLine(value: string) {
  const lower = value.toLowerCase();
  return [
    "use this page when",
    "use this page to",
    "use this guide",
    "by the end of this guide",
    "you need:",
    "this document is ready when",
    "this runbook is complete when",
    "the runbook is complete when",
  ].some((prefix) => lower.startsWith(prefix));
}

function isTemplatePlaceholder(value: string) {
  const lower = value.toLowerCase();
  if (!lower) return true;
  if (lower.startsWith("@")) return true;
  if (/^(write|explain|describe|list|add|select|choose|replace|summarize|record|document|capture|enter|type)\b/.test(lower)) return true;
  if (/^(name|date|owner|step|risk|impact|mitigation|dependency|condition|action|decision|reason|follow-up)\b/.test(lower)) return true;
  if (/^(what|who|why|how|where|when|team or|customer group|engineering or|temporary workaround|planned fix|@)\b/.test(lower)) return true;
  if (/^(second symptom|expected failure|customer examples?|linked tasks?)\b/.test(lower)) return true;
  if (lower.includes("mention")) return true;
  if (lower.includes("stakeholder")) return true;
  if (lower.includes("subject expert")) return true;
  if (lower.includes("success signal")) return true;
  if (lower.includes("responsible for the fix")) return true;
  if (lower.includes("error message, ui state")) return true;
  if (lower.includes("workaround does not solve")) return true;
  if (lower.includes("proves this known error is fixed")) return true;
  return false;
}

function isOptionSet(value: string) {
  return value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean).length > 1;
}

function parseMarkdownBlocks(body: string) {
  const lines = body.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = normalizePreviewText(lines[index]) ?? "";
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const rawCells = lines[index]
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim());
        const separator = rawCells.every((cell) => /^:?-{2,}:?$/.test(cell));
        const cells = rawCells.map(normalizePreviewCell);
        if (!separator && cells.some(Boolean)) rows.push(cells);
        index += 1;
      }
      if (rows.length) blocks.push(<PreviewTable key={`table-${index}`} rows={rows} />);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim();
        if (!item.startsWith("- ") && !item.startsWith("* ")) break;
        items.push(item.slice(2));
        index += 1;
      }
      const hasChecklist = items.some((item) => /^\[[ xX]\]\s+/.test(item));
      if (hasChecklist) {
        const renderedItems = items
          .map((item, itemIndex) => {
            const checked = /^\[[xX]\]\s+/.test(item);
            const label = normalizePreviewText(item.replace(/^\[[ xX]\]\s+/, ""));
            if (!label) return null;
            return (
              <div key={`${item}-${itemIndex}`} className="flex items-start gap-3 rounded-xl border border-line bg-white px-3 py-2">
                <span
                  className={cn(
                    "mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-black",
                    checked ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-line bg-[#fbfaf7]",
                  )}
                >
                  {checked ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : null}
                </span>
                <span className="text-base font-medium leading-7 text-slate-700">{label}</span>
              </div>
            );
          })
          .filter(Boolean);
        if (!renderedItems.length) continue;
        blocks.push(
          <div key={`checklist-${index}`} className="grid gap-2">
            {renderedItems}
          </div>,
        );
      } else {
        const visibleItems = items.map(normalizePreviewText).filter((item): item is string => Boolean(item));
        if (!visibleItems.length) continue;
        blocks.push(
          <ul key={`list-${index}`} className="ml-6 list-disc space-y-2 text-base font-medium leading-7 text-slate-700">
            {visibleItems.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`}>{item}</li>
            ))}
          </ul>,
        );
      }
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim();
        if (!/^\d+\.\s+/.test(item)) break;
        const visibleItem = normalizePreviewText(item.replace(/^\d+\.\s+/, ""));
        if (visibleItem) items.push(visibleItem);
        index += 1;
      }
      if (!items.length) continue;
      blocks.push(
        <ol key={`ordered-${index}`} className="ml-6 list-decimal space-y-2 text-base font-medium leading-7 text-slate-700">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{item}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push(<PreviewImage key={`image-${index}`} alt={imageMatch[1]} src={imageMatch[2]} />);
      index += 1;
      continue;
    }
    const fileMatch = line.match(/^\[File:\s*([^\]]+)\]\(([^)]+)\)$/);
    if (fileMatch) {
      blocks.push(<PreviewFileLink key={`file-${index}`} label={fileMatch[1]} url={fileMatch[2]} />);
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${index}`} className="pt-3 text-xl font-black text-foreground">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${index}`} className="pt-5 text-2xl font-black text-foreground">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h1 key={`h1-${index}`} className="pt-3 text-3xl font-black text-foreground">{line.slice(2)}</h1>);
    } else {
      blocks.push(<p key={`p-${index}`} className="text-base font-medium leading-8 text-slate-700">{line}</p>);
    }
    index += 1;
  }
  return blocks;
}

function optionTone(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("complete") || lower.includes("approved") || lower.includes("active") || lower.includes("fixed") || lower.includes("closed")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (lower.includes("progress") || lower.includes("watch") || lower.includes("monitor") || lower.includes("needs review")) {
    return "bg-amber-100 text-amber-700";
  }
  if (lower.includes("critical") || lower.includes("high") || lower.includes("rejected") || lower.includes("blocked") || lower.includes("open")) {
    return "bg-red-100 text-red-700";
  }
  if (lower.includes("draft") || lower.includes("not started") || lower.includes("deferred") || lower.includes("archived") || lower.includes("retired")) {
    return "bg-slate-100 text-slate-700";
  }
  return "bg-blue-50 text-blue-700";
}

function PreviewInlineText({ value }: { value: string }) {
  if (!value) return <span className="text-slate-300"> </span>;
  if (!isOptionSet(value)) return <>{value}</>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {value
        .split("/")
        .map((option) => option.trim())
        .filter(Boolean)
        .map((option) => (
          <span key={option} className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase", optionTone(option))}>
            {option}
          </span>
        ))}
    </span>
  );
}

function PreviewTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  const [head, ...body] = rows;
  const hiddenHeader = head.length === 2 && ["field", "scope area"].includes((head[0] ?? "").toLowerCase()) && (head[1] ?? "").toLowerCase() === "details";
  const bodyRows = hiddenHeader ? body : body;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        {!hiddenHeader ? (
          <thead className="bg-[#f3f4f6]">
            <tr>
              {head.map((cell, index) => (
                <th key={`${cell}-${index}`} className="border-r border-line px-4 py-3 font-black text-foreground last:border-r-0">
                  <PreviewInlineText value={cell} />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-t border-line">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${cell}-${cellIndex}`}
                  className={cn(
                    "border-r border-line px-4 py-3 text-sm last:border-r-0",
                    cellIndex === 0 ? "w-[210px] bg-[#f3f4f6] font-black text-foreground" : "font-medium text-slate-700",
                  )}
                >
                  <PreviewInlineText value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewImage({ alt, src }: { alt: string; src: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <img src={src} alt={alt || "Document image"} className="max-h-[520px] w-full object-contain bg-[#fbfaf7]" />
      {alt ? <figcaption className="border-t border-line px-4 py-2 text-xs font-semibold text-ink-soft">{alt}</figcaption> : null}
    </figure>
  );
}

function PreviewFileLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-[#111111]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-panel-muted text-ink-soft">
        <Paperclip className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-foreground">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-ink-soft">Open attachment</span>
      </span>
      <Link2 className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
    </a>
  );
}

function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-panel-muted text-ink-soft">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-base font-black text-foreground">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
