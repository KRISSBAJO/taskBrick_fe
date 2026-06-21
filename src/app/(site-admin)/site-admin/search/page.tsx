"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  FileSearch,
  FolderOpen,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  sitePlatformSearch,
  type SitePlatformSearchCategory,
  type SitePlatformSearchResponse,
  type SitePlatformSearchResult,
} from "@/lib/api";
import {
  EmptyState,
  FilterButton,
  MetricCard,
  OperationsHero,
  OpsPanel,
  RowCard,
  SearchInput,
  StatusBadge,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

const CATEGORIES: Array<{ value: SitePlatformSearchCategory; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "TENANTS", label: "Tenants" },
  { value: "USERS", label: "Users" },
  { value: "PROJECTS", label: "Projects" },
  { value: "TASKS", label: "Tasks" },
  { value: "EVENTS", label: "Events" },
  { value: "AUDIT", label: "Audit" },
];

const emptyResponse: SitePlatformSearchResponse = {
  data: [],
  facets: {},
  query: { search: "", category: "ALL" },
  meta: { page: 1, limit: 30, total: 0, totalPages: 0 },
};

export default function SiteAdminSearchPage() {
  const { auth } = useWorkspaceAuth();
  const [result, setResult] = useState<SitePlatformSearchResponse>(emptyResponse);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SitePlatformSearchCategory>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await sitePlatformSearch(auth.accessToken, { limit: 40, search: query || undefined, category }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to run platform search.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, category, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => ({
    tenants: result.facets.TENANTS ?? 0,
    users: result.facets.USERS ?? 0,
    projects: result.facets.PROJECTS ?? 0,
    tasks: result.facets.TASKS ?? 0,
    events: result.facets.EVENTS ?? 0,
    audit: result.facets.AUDIT ?? 0,
  }), [result.facets]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <OperationsHero
        icon={Search}
        label="Platform search"
        title="Cross-tenant search console"
        description={`${formatNumber(result.meta.total)} matched records across tenants, users, projects, tasks, events, and audit logs`}
        accent="#111111"
      >
        <button type="button" onClick={() => load()} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Refresh
        </button>
      </OperationsHero>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Building2} label="Tenants" value={metrics.tenants} subtext="matched organizations" tone="#6d5dd3" />
        <MetricCard icon={Users} label="Users" value={metrics.users} subtext="matched identities" tone="#2563eb" />
        <MetricCard icon={FolderOpen} label="Projects" value={metrics.projects} subtext="delivery objects" tone="#047857" />
        <MetricCard icon={ListChecks} label="Tasks" value={metrics.tasks} subtext="work items" tone="#d89b00" />
        <MetricCard icon={Activity} label="Events" value={metrics.events} subtext="security signals" tone={metrics.events ? "#dc2626" : "#047857"} />
        <MetricCard icon={FileSearch} label="Audit" value={metrics.audit} subtext="immutable trail" tone="#111111" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by tenant, email, project key, task title, event type, audit action..." />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <FilterButton key={item.value} active={category === item.value} onClick={() => setCategory(item.value)}>
                {item.label}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <OpsPanel accent="#111111" eyebrow="Search results" title={`${formatNumber(result.meta.total)} records matched`}>
          {loading ? (
            <EmptyState text="Searching platform records..." />
          ) : result.data.length === 0 ? (
            <EmptyState text="No records matched the current search and category." />
          ) : (
            <div className="space-y-3">
              {result.data.map((item) => <SearchResultRow key={`${item.type}:${item.id}`} item={item} />)}
            </div>
          )}
        </OpsPanel>

        <div className="space-y-5">
          <OpsPanel accent="#047857" eyebrow="Boundary" title="Permission-aware search">
            <div className="space-y-3 text-sm font-semibold leading-6 text-[#5f574c]">
              <p>
                Results are returned only from the platform-admin backend route guarded by JWT plus `PlatformAdminGuard`.
              </p>
              <p>
                Private tenant content is summarized as metadata and linked to Site Admin detail pages instead of exposing workspace-only actions here.
              </p>
            </div>
            <div className="mt-4 rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700" style={{ border: "1px solid #bbf7d0" }}>
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#111111]">Tenant isolation stays backend-owned</p>
                  <p className="text-[11px] font-semibold text-[#766f63]">Frontend only renders returned, audited results.</p>
                </div>
              </div>
            </div>
          </OpsPanel>

          <OpsPanel accent="#ffd400" eyebrow="Facets" title="Current result mix">
            <div className="space-y-2">
              {CATEGORIES.filter((item) => item.value !== "ALL").map((item) => (
                <div key={item.value} className="flex items-center justify-between rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                  <span className="text-[12px] font-black text-[#111111]">{item.label}</span>
                  <span className="text-sm font-black text-[#111111]">{formatNumber(result.facets[item.value] ?? 0)}</span>
                </div>
              ))}
            </div>
          </OpsPanel>
        </div>
      </div>
    </div>
  );
}

function SearchResultRow({ item }: { item: SitePlatformSearchResult }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={item.type} />
          {item.tenant ? <StatusBadge value={item.tenant.slug} /> : null}
          {item.updatedAt ? <span className="text-[11px] font-semibold text-[#8a8375]">Updated {formatDate(item.updatedAt)}</span> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{item.title}</p>
        {item.subtitle ? <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#665f54]">{item.subtitle}</p> : null}
        {item.tenant ? (
          <Link href={`/site-admin/tenants/${item.tenant.id}`} className="mt-2 inline-flex text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">
            {item.tenant.name} @{item.tenant.slug}
          </Link>
        ) : null}
      </div>
      <div className="flex items-center justify-start lg:justify-end">
        <Link href={item.url} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white transition hover:bg-[#2a2a2a]">
          Open
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </RowCard>
  );
}
