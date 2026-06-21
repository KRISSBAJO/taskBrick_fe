import type { ProjectStatus } from "./api";

export type Metric = {
  label: string;
  value: string;
  change: string;
  tone: "teal" | "amber" | "red" | "blue";
};

export type WorkspaceProject = {
  id: string;
  key: string;
  name: string;
  owner: string;
  team: string;
  status: ProjectStatus;
  health: "On track" | "At risk" | "Needs review";
  progress: number;
  due: string;
  budget: string;
};

export type BoardTask = {
  id: string;
  title: string;
  project: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  due: string;
  estimate: string;
};

export type BoardColumn = {
  id: string;
  title: string;
  tasks: BoardTask[];
};

export const metrics: Metric[] = [
  { label: "Active work", value: "42", change: "+8 this week", tone: "teal" },
  { label: "Sprint delivery", value: "87%", change: "+12% velocity", tone: "blue" },
  { label: "Open risks", value: "6", change: "2 need owners", tone: "amber" },
  { label: "Blocked tasks", value: "3", change: "-5 since Friday", tone: "red" },
];

export const projects: WorkspaceProject[] = [
  {
    id: "prj-platform",
    key: "ENG",
    name: "Platform Reliability",
    owner: "Ada Lovelace",
    team: "Platform",
    status: "ACTIVE",
    health: "On track",
    progress: 74,
    due: "Jul 18",
    budget: "$86k",
  },
  {
    id: "prj-mobile",
    key: "MOB",
    name: "Mobile Beta",
    owner: "Grace Hopper",
    team: "Product",
    status: "PLANNING",
    health: "Needs review",
    progress: 38,
    due: "Aug 04",
    budget: "$42k",
  },
  {
    id: "prj-client",
    key: "CS",
    name: "Client Portal Migration",
    owner: "Katherine Johnson",
    team: "Delivery",
    status: "ACTIVE",
    health: "At risk",
    progress: 61,
    due: "Jun 28",
    budget: "$118k",
  },
  {
    id: "prj-reports",
    key: "REP",
    name: "Executive Reporting",
    owner: "Mary Jackson",
    team: "Operations",
    status: "ON_HOLD",
    health: "Needs review",
    progress: 46,
    due: "Sep 12",
    budget: "$33k",
  },
];

export const boardColumns: BoardColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      {
        id: "TB-1021",
        title: "Map workspace permissions to project roles",
        project: "ENG",
        priority: "High",
        assignee: "AL",
        due: "Jun 20",
        estimate: "5 pts",
      },
      {
        id: "TB-1038",
        title: "Draft onboarding checklist for external clients",
        project: "CS",
        priority: "Medium",
        assignee: "KJ",
        due: "Jun 22",
        estimate: "3 pts",
      },
    ],
  },
  {
    id: "todo",
    title: "Ready",
    tasks: [
      {
        id: "TB-1044",
        title: "Create portfolio rollup filters",
        project: "REP",
        priority: "Medium",
        assignee: "MJ",
        due: "Jun 24",
        estimate: "3 pts",
      },
      {
        id: "TB-1049",
        title: "Connect invitation audit events",
        project: "ENG",
        priority: "Low",
        assignee: "GH",
        due: "Jun 27",
        estimate: "2 pts",
      },
    ],
  },
  {
    id: "progress",
    title: "In progress",
    tasks: [
      {
        id: "TB-1051",
        title: "Ship tenant-aware project list endpoint",
        project: "ENG",
        priority: "Critical",
        assignee: "AL",
        due: "Today",
        estimate: "8 pts",
      },
      {
        id: "TB-1056",
        title: "Refine mobile release burndown",
        project: "MOB",
        priority: "High",
        assignee: "GH",
        due: "Jun 18",
        estimate: "5 pts",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    tasks: [
      {
        id: "TB-1062",
        title: "Approve reporting dashboard schema",
        project: "REP",
        priority: "High",
        assignee: "MJ",
        due: "Jun 17",
        estimate: "2 pts",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "TB-1064",
        title: "Add workspace health check to API docs",
        project: "ENG",
        priority: "Low",
        assignee: "AL",
        due: "Jun 14",
        estimate: "1 pt",
      },
    ],
  },
];

export const teamMembers = [
  { name: "Ada Lovelace", role: "Platform Owner", team: "Platform", load: 82, status: "Focused" },
  { name: "Grace Hopper", role: "Product Lead", team: "Product", load: 67, status: "Available" },
  { name: "Katherine Johnson", role: "Delivery Manager", team: "Delivery", load: 91, status: "At capacity" },
  { name: "Mary Jackson", role: "Operations Lead", team: "Operations", load: 58, status: "Available" },
];

export const activity = [
  "Platform Reliability moved TB-1051 to In progress",
  "Client Portal Migration logged a new budget risk",
  "Mobile Beta added two sprint goals",
  "Executive Reporting paused a milestone",
];
