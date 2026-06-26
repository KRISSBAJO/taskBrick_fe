"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  KanbanSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  applyBoardActions,
  generateBoardActionPlan,
  generateBoardSummary,
  getProjectBoard,
  listBoardAiHistory,
  listProjects,
  scanBoardRisks,
  type BoardAiActionPlanResponse,
  type BoardAiApplyResponse,
  type BoardAiHistoryEntry,
  type BoardAiPayload,
  type BoardAiRiskScanResponse,
  type BoardAiSummaryResponse,
  type Project,
  type ProjectBoard,
  type Task,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type BoardAiMode = "summary" | "risk" | "actions";
type BoardAiLoading = BoardAiMode | "apply" | null;
type BoardAiResult =
  | { mode: "summary"; result: BoardAiSummaryResponse }
  | { mode: "risk"; result: BoardAiRiskScanResponse }
  | { mode: "actions"; result: BoardAiActionPlanResponse }
  | null;

const MODE_COPY: Record<BoardAiMode, { eyebrow: string; title: string; helper: string }> = {
  summary: {
    eyebrow: "Executive readout",
    title: "Summary",
    helper: "Board narrative, highlights, risks, and next actions.",
  },
  risk: {
    eyebrow: "Delivery control",
    title: "Risk scan",
    helper: "Find stale work, blocked flow, missing ownership, and deadline pressure.",
  },
  actions: {
    eyebrow: "Review before apply",
    title: "Action plan",
    helper: "Generate task updates or cleanup proposals that require approval.",
  },
};

export default function BoardAiPage() {
  const { auth } = useWorkspaceAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get("projectId") ?? "";
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(requestedProjectId);
  const [board, setBoard] = useState<ProjectBoard | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [aiLoading, setAiLoading] = useState<BoardAiLoading>(null);
  const [result, setResult] = useState<BoardAiResult>(null);
  const [applyResult, setApplyResult] = useState<BoardAiApplyResponse | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(() => new Set());
  const [history, setHistory] = useState<BoardAiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (projectId: string, boardId?: string) => {
    if (!projectId) {
      setHistory([]);
      setHistoryError("");
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    try {
      const historyPage = await listBoardAiHistory(auth.accessToken, {
        boardId,
        limit: 12,
        projectId,
      });
      setHistory(historyPage.data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load Board AI history.";
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
    }
  }, [auth.accessToken]);

  const loadBoard = useCallback(async (projectId = selectedProjectId) => {
    setLoadingBoard(true);
    setError("");
    try {
      const projectPage = await listProjects(auth.accessToken);
      const nextProjects = projectPage.data;
      const nextProjectId = projectId || requestedProjectId || nextProjects[0]?.id || "";
      setProjects(nextProjects);
      setSelectedProjectId(nextProjectId);
      if (!nextProjectId) {
        setBoard(null);
        setHistory([]);
        return;
      }
      const boardData = await getProjectBoard(auth.accessToken, nextProjectId);
      setBoard(normalizeBoard(boardData));
      void loadHistory(nextProjectId, boardData.id);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load board AI workspace.";
      setError(message);
      toast({ title: "Board AI failed to load", description: message, variant: "error" });
    } finally {
      setLoadingBoard(false);
    }
  }, [auth.accessToken, loadHistory, requestedProjectId, selectedProjectId, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBoard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBoard]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const tasks = useMemo(() => board?.columns.flatMap((column) => column.tasks ?? []) ?? [], [board]);
  const boardStats = useMemo(() => getBoardStats(tasks), [tasks]);
  const actionPlan = result?.mode === "actions" ? result.result : null;
  const canRunAi = Boolean(selectedProjectId && board && !loadingBoard);
  const selectedHistory = useMemo(
    () => history.find((entry) => entry.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId],
  );

  async function onProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setResult(null);
    setApplyResult(null);
    setSelectedActionIds(new Set());
    setSelectedHistoryId("");
    await loadBoard(projectId);
  }

  async function runAi(mode: BoardAiMode) {
    if (!selectedProjectId || !board) return;
    setAiLoading(mode);
    setError("");
    setApplyResult(null);
    if (mode !== "actions") {
      setSelectedActionIds(new Set());
    }
    try {
      const payload: BoardAiPayload = { boardId: board.id, projectId: selectedProjectId };
      if (mode === "summary") {
        const summary = await generateBoardSummary(auth.accessToken, payload);
        setResult({ mode, result: summary });
      } else if (mode === "risk") {
        const risk = await scanBoardRisks(auth.accessToken, payload);
        setResult({ mode, result: risk });
      } else {
        const actions = await generateBoardActionPlan(auth.accessToken, payload);
        setSelectedActionIds(new Set());
        setResult({ mode, result: actions });
      }
      toast({
        title: "Board AI ready",
        description: MODE_COPY[mode].helper,
        variant: "success",
      });
      void loadHistory(selectedProjectId, board.id);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to run Board AI.";
      setError(message);
      toast({ title: "Board AI failed", description: message, variant: "error" });
    } finally {
      setAiLoading(null);
    }
  }

  function toggleAction(actionId: string) {
    setSelectedActionIds((current) => {
      const next = new Set(current);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  }

  function selectAllActions() {
    if (!actionPlan) return;
    const allSelected = selectedActionIds.size === actionPlan.proposals.length;
    setSelectedActionIds(allSelected ? new Set() : new Set(actionPlan.proposals.map((proposal) => proposal.actionId)));
  }

  async function applySelectedActions() {
    if (!board || !selectedProjectId || !actionPlan) return;
    const actionIds = [...selectedActionIds];
    if (!actionIds.length) {
      toast({ title: "No actions selected", description: "Select at least one proposal before applying.", variant: "warning" });
      return;
    }
    setAiLoading("apply");
    setError("");
    try {
      const nextApplyResult = await applyBoardActions(auth.accessToken, {
        actionIds,
        boardId: board.id,
        projectId: selectedProjectId,
      });
      setApplyResult(nextApplyResult);
      setResult(null);
      setSelectedActionIds(new Set());
      toast({
        title: nextApplyResult.failed ? "Applied with issues" : "Board actions applied",
        description: `${nextApplyResult.applied} applied, ${nextApplyResult.failed} failed.`,
        variant: nextApplyResult.failed ? "warning" : "success",
      });
      await loadBoard(selectedProjectId);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to apply Board AI actions.";
      setError(message);
      toast({ title: "Board AI apply failed", description: message, variant: "error" });
    } finally {
      setAiLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_16px_55px_rgba(17,17,17,0.08)]">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.45fr)] lg:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/board"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-[13px] font-black text-foreground transition hover:bg-panel-muted"
              >
                <ArrowLeft className="size-4" />
                Back to board
              </Link>
              <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-3 text-[12px] font-black uppercase tracking-[0.12em] text-blue-700">
                <Sparkles className="size-4" />
                AI workspace
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft">Recommendation-only controls</p>
                <h1 className="mt-2 text-[34px] font-black tracking-tight text-foreground md:text-[44px]">Board AI</h1>
                <p className="mt-2 max-w-3xl text-[14px] font-semibold leading-6 text-ink-soft">
                  Generate board summaries, risk scans, and reviewable action plans. Nothing changes on the board until you select proposals and apply them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadBoard(selectedProjectId)}
                disabled={loadingBoard}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-[13px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
              >
                <RefreshCw className={cn("size-4", loadingBoard && "animate-spin")} />
                Refresh board
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-background p-4">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Project board</label>
            <select
              value={selectedProjectId}
              onChange={(event) => void onProjectChange(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-black text-foreground outline-none transition focus:border-primary"
            >
              {projects.length ? projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              )) : (
                <option value="">No projects available</option>
              )}
            </select>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <BoardStat label="Tasks" value={boardStats.total} />
              <BoardStat label="Open" value={boardStats.open} />
              <BoardStat label="Blocked" value={boardStats.blocked} tone={boardStats.blocked ? "red" : "default"} />
              <BoardStat label="Unassigned" value={boardStats.unassigned} tone={boardStats.unassigned ? "amber" : "default"} />
            </div>
          </div>
        </div>

        <div className="border-t border-line bg-[#fbfaf5] px-5 py-3 lg:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] font-bold text-ink-soft">
            <KanbanSquare className="size-4 text-blue-600" />
            <span className="truncate">{selectedProject?.name ?? "Select a project"}</span>
            {board ? <span className="text-ink-soft/50">/</span> : null}
            {board ? <span className="truncate">{board.name}</span> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {(Object.keys(MODE_COPY) as BoardAiMode[]).map((mode) => (
          <ModeCard
            key={mode}
            active={result?.mode === mode}
            disabled={!canRunAi || Boolean(aiLoading)}
            loading={aiLoading === mode}
            mode={mode}
            onClick={() => void runAi(mode)}
          />
        ))}
      </section>

      <BoardAiHistoryPanel
        entries={history}
        error={historyError}
        loading={historyLoading}
        onRefresh={() => void loadHistory(selectedProjectId, board?.id)}
        onSelect={(entryId) => setSelectedHistoryId((current) => current === entryId ? "" : entryId)}
        selectedEntry={selectedHistory}
        selectedId={selectedHistoryId}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {loadingBoard ? (
        <BoardAiSkeleton />
      ) : applyResult ? (
        <ApplyResultPanel
          loading={aiLoading === "actions"}
          onNewPlan={() => void runAi("actions")}
          result={applyResult}
        />
      ) : result ? (
        <BoardAiResultView
          applyResult={applyResult}
          loading={aiLoading}
          onApply={() => void applySelectedActions()}
          onSelectAll={selectAllActions}
          onToggleAction={toggleAction}
          result={result}
          selectedActionIds={selectedActionIds}
        />
      ) : (
        <section className="rounded-[28px] border border-dashed border-line bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Sparkles className="size-6" />
          </span>
          <h2 className="mt-4 text-[22px] font-black tracking-tight text-foreground">Choose how AI should inspect this board</h2>
          <p className="mx-auto mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-ink-soft">
            Use summary for leadership readout, risk scan for delivery control, and action plan when you want reviewable changes.
          </p>
        </section>
      )}
    </div>
  );
}

function ApplyResultPanel({
  loading,
  onNewPlan,
  result,
}: {
  loading: boolean;
  onNewPlan: () => void;
  result: BoardAiApplyResponse;
}) {
  const hasFailures = result.failed > 0;
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Action plan cleared</p>
            <h2 className="mt-1 text-[26px] font-black tracking-tight text-foreground">
              {result.applied} applied, {result.failed} failed
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] font-semibold leading-6 text-ink-soft">
              The reviewed proposals were cleared after the apply attempt so stale pending action IDs cannot be applied again.
              Generate a fresh action plan if the board still needs AI cleanup.
            </p>
          </div>
          <span className={cn(
            "inline-flex size-12 items-center justify-center rounded-2xl",
            hasFailures ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
          )}>
            {hasFailures ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {result.results.map((item) => (
            <article key={item.actionId} className="rounded-2xl border border-line bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
                  item.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                )}>
                  {item.status}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">
                  {item.type}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-black tracking-tight text-foreground">{item.title ?? item.entityType ?? item.actionId}</h3>
              <p className={cn(
                "mt-2 text-[13px] font-bold leading-6",
                item.status === "COMPLETED" ? "text-emerald-700" : "text-red-700",
              )}>
                {item.message ?? item.error ?? "No provider message returned."}
              </p>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-[24px] border border-line bg-white p-4 shadow-sm xl:sticky xl:top-24">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Next move</p>
        <h2 className="mt-1 text-[20px] font-black tracking-tight text-foreground">Start from current board state</h2>
        <p className="mt-3 text-[13px] font-semibold leading-6 text-ink-soft">
          AI action proposals are one-time review records. After any apply attempt, the page clears them to prevent duplicate applies and stale-action errors.
        </p>
        <button
          type="button"
          onClick={onNewPlan}
          disabled={loading}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd400] px-4 text-[13px] font-black text-foreground shadow-[0_16px_34px_rgba(255,212,0,0.28)] transition hover:bg-[#f4c900] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Sparkles className={cn("size-4", loading && "animate-pulse")} />
          {loading ? "Generating..." : "Generate fresh plan"}
        </button>
        <Link
          href="/board"
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-background px-4 text-[13px] font-black text-foreground transition hover:bg-panel-muted"
        >
          <ArrowLeft className="size-4" />
          Back to board
        </Link>
      </aside>
    </section>
  );
}

function BoardAiHistoryPanel({
  entries,
  error,
  loading,
  onRefresh,
  onSelect,
  selectedEntry,
  selectedId,
}: {
  entries: BoardAiHistoryEntry[];
  error: string;
  loading: boolean;
  onRefresh: () => void;
  onSelect: (entryId: string) => void;
  selectedEntry: BoardAiHistoryEntry | null;
  selectedId: string;
}) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff5b8] text-foreground">
            <History className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Saved AI evidence</p>
            <h2 className="mt-1 text-[20px] font-black tracking-tight text-foreground">Board AI history</h2>
            <p className="mt-1 max-w-3xl text-[12px] font-semibold leading-5 text-ink-soft">
              Summaries, risk scans, action plans, and apply attempts are retained with provider usage so the workspace can review what was generated and what actually changed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-[12px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh history
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !entries.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-[118px] animate-pulse rounded-2xl border border-line bg-background" />
          ))}
        </div>
      ) : entries.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              className={cn(
                "rounded-2xl border bg-background p-4 text-left transition hover:border-primary/70 hover:bg-white",
                selectedId === entry.id ? "border-primary ring-2 ring-primary/25" : "border-line",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-ink-soft">
                  {historyTypeLabel(entry.type)}
                </span>
                <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]", historyStatusClass(entry.status))}>
                  {entry.status}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] font-black leading-5 text-foreground">{historyPreview(entry)}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
                <Clock3 className="size-3.5" />
                <span>{formatHistoryDate(entry.createdAt)}</span>
              </div>
              <p className="mt-2 truncate text-[11px] font-semibold text-ink-soft">
                {entry.provider && entry.model ? `${entry.provider} / ${entry.model}` : entry.kind === "apply" ? "Board apply attempt" : "Provider details unavailable"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-background p-6 text-center text-[13px] font-bold text-ink-soft">
          No saved Board AI history for this board yet.
        </div>
      )}

      {selectedEntry ? <BoardAiHistoryDetail entry={selectedEntry} /> : null}
    </section>
  );
}

function BoardAiHistoryDetail({ entry }: { entry: BoardAiHistoryEntry }) {
  const artifact = asHistoryRecord(entry.artifact);
  const findings = historyRecordArray(artifact.findings);
  const proposals = historyRecordArray(artifact.proposals);
  const highlights = historyStringArray(artifact.highlights);
  const risks = historyStringArray(artifact.risks);
  const recommendedActions = historyStringArray(artifact.recommendedActions);
  const bodyText = firstHistoryText(artifact, ["content", "narrative", "summary"]);

  return (
    <div className="mt-4 rounded-[22px] border border-line bg-[#fbfaf5] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Selected record</p>
          <h3 className="mt-1 text-[18px] font-black tracking-tight text-foreground">{historyTypeLabel(entry.type)}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {entry.totalTokens ? (
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
              {entry.totalTokens} tokens
            </span>
          ) : null}
          {typeof entry.estimatedCost === "number" ? (
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
              ${entry.estimatedCost.toFixed(4)}
            </span>
          ) : null}
        </div>
      </div>

      {bodyText ? (
        <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-line bg-white p-4 text-[13px] font-semibold leading-6 text-foreground">
          {bodyText}
        </p>
      ) : null}

      {entry.results?.length ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {entry.results.map((item) => (
            <div key={item.actionId} className="rounded-2xl border border-line bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]", historyStatusClass(item.status))}>
                  {item.status}
                </span>
                <span className="rounded-full bg-background px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-ink-soft">
                  {item.type}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-black text-foreground">{item.title ?? item.entityType ?? item.actionId}</p>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-ink-soft">{item.message ?? item.error ?? "No result message returned."}</p>
            </div>
          ))}
        </div>
      ) : null}

      {findings.length ? (
        <HistoryRecordList title="Findings" records={findings} primaryKey="title" secondaryKey="evidence" />
      ) : null}
      {proposals.length ? (
        <HistoryRecordList title="Proposals" records={proposals} primaryKey="title" secondaryKey="rationale" />
      ) : null}
      {highlights.length ? <HistoryStringList title="Highlights" items={highlights} /> : null}
      {risks.length ? <HistoryStringList title="Risks" items={risks} /> : null}
      {recommendedActions.length ? <HistoryStringList title="Recommended actions" items={recommendedActions} /> : null}

      {entry.error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-700">
          {entry.error}
        </p>
      ) : null}
    </div>
  );
}

function HistoryRecordList({
  primaryKey,
  records,
  secondaryKey,
  title,
}: {
  primaryKey: string;
  records: Record<string, unknown>[];
  secondaryKey: string;
  title: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {records.map((record, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl border border-line bg-white p-3">
            <p className="text-[13px] font-black text-foreground">{stringFromRecord(record, primaryKey) || `${title} ${index + 1}`}</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-ink-soft">{stringFromRecord(record, secondaryKey) || "No detail returned."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryStringList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {items.map((item, index) => (
          <p key={`${title}-${index}`} className="rounded-2xl border border-line bg-white p-3 text-[12px] font-semibold leading-5 text-foreground">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function BoardAiResultView({
  applyResult,
  loading,
  onApply,
  onSelectAll,
  onToggleAction,
  result,
  selectedActionIds,
}: {
  applyResult: BoardAiApplyResponse | null;
  loading: BoardAiLoading;
  onApply: () => void;
  onSelectAll: () => void;
  onToggleAction: (actionId: string) => void;
  result: BoardAiResult;
  selectedActionIds: Set<string>;
}) {
  if (!result) return null;
  if (result.mode === "summary") {
    const summary = result.result;
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <TextPanel title="Board narrative" usage={summary.usage}>{summary.content}</TextPanel>
        <div className="grid gap-4">
          <BulletPanel title="Highlights" items={summary.highlights} tone="blue" />
          <BulletPanel title="Risks" items={summary.risks} tone="red" />
          <BulletPanel title="Recommended actions" items={summary.recommendedActions} tone="green" />
        </div>
      </section>
    );
  }

  if (result.mode === "risk") {
    const risk = result.result;
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <TextPanel title="Risk narrative" usage={risk.usage}>{risk.narrative}</TextPanel>
        <div className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Findings</p>
              <h2 className="mt-1 text-[20px] font-black tracking-tight text-foreground">{risk.findings.length} board signals</h2>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
              Risk scan
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {risk.findings.length ? risk.findings.map((finding, index) => (
              <RiskFindingCard key={`${finding.type}-${finding.taskId ?? finding.columnId ?? index}`} finding={finding} />
            )) : (
              <div className="rounded-2xl border border-dashed border-line bg-background p-6 text-center text-[13px] font-bold text-ink-soft">
                No board risk findings were detected.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const actionPlan = result.result;
  const allSelected = actionPlan.proposals.length > 0 && selectedActionIds.size === actionPlan.proposals.length;
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Proposals</p>
            <h2 className="mt-1 text-[22px] font-black tracking-tight text-foreground">Review action plan</h2>
          </div>
          <button
            type="button"
            onClick={onSelectAll}
            disabled={!actionPlan.proposals.length || Boolean(loading)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-[12px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
          >
            <CheckCircle2 className="size-4" />
            {allSelected ? "Clear selected" : "Select all"}
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {actionPlan.proposals.length ? actionPlan.proposals.map((proposal) => (
            <ActionProposalCard
              key={proposal.actionId}
              proposal={proposal}
              selected={selectedActionIds.has(proposal.actionId)}
              onToggle={() => onToggleAction(proposal.actionId)}
            />
          )) : (
            <div className="rounded-2xl border border-dashed border-line bg-background p-6 text-center text-[13px] font-bold text-ink-soft">
              AI did not return action proposals for this board.
            </div>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-[24px] border border-line bg-white p-4 shadow-sm xl:sticky xl:top-24">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Action plan</p>
        <h2 className="mt-1 text-[20px] font-black tracking-tight text-foreground">Apply selected changes</h2>
        <p className="mt-3 whitespace-pre-wrap text-[13px] font-semibold leading-6 text-ink-soft">{actionPlan.summary}</p>
        <div className="mt-4 rounded-2xl border border-line bg-background p-3">
          <p className="text-[13px] font-black text-foreground">{selectedActionIds.size} of {actionPlan.proposals.length} selected</p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-ink-soft">
            Selected actions run with your current board permissions. Rejected proposals are left untouched.
          </p>
        </div>
        <button
          type="button"
          disabled={loading === "apply" || selectedActionIds.size === 0}
          onClick={onApply}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd400] px-4 text-[13px] font-black text-foreground shadow-[0_16px_34px_rgba(255,212,0,0.28)] transition hover:bg-[#f4c900] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ShieldCheck className={cn("size-4", loading === "apply" && "animate-pulse")} />
          {loading === "apply" ? "Applying..." : "Apply selected"}
        </button>
        {applyResult ? (
          <div className="mt-4 rounded-2xl border border-line bg-background p-3">
            <p className="text-[13px] font-black text-foreground">{applyResult.applied} applied, {applyResult.failed} failed</p>
            <div className="mt-2 grid gap-2">
              {applyResult.results.map((item) => (
                <p
                  key={item.actionId}
                  className={cn(
                    "rounded-xl bg-white px-3 py-2 text-[11px] font-bold",
                    item.status === "COMPLETED" ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {item.status}: {item.message ?? item.error ?? item.title ?? item.type}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function ModeCard({
  active,
  disabled,
  loading,
  mode,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  loading: boolean;
  mode: BoardAiMode;
  onClick: () => void;
}) {
  const copy = MODE_COPY[mode];
  const Icon = mode === "risk" ? AlertTriangle : mode === "actions" ? ShieldCheck : Sparkles;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-[22px] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(17,17,17,0.10)] disabled:cursor-not-allowed disabled:opacity-55",
        active ? "border-foreground ring-2 ring-foreground/10" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
          mode === "risk" ? "bg-red-50 text-red-700" : mode === "actions" ? "bg-[#fff5b8] text-foreground" : "bg-blue-50 text-blue-700",
        )}>
          <Icon className={cn("size-5", loading && "animate-pulse")} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{copy.eyebrow}</span>
          <span className="mt-1 block text-[18px] font-black tracking-tight text-foreground">{copy.title}</span>
          <span className="mt-1 block text-[12px] font-semibold leading-5 text-ink-soft">{copy.helper}</span>
        </span>
      </div>
    </button>
  );
}

function BoardStat({ label, tone = "default", value }: { label: string; tone?: "amber" | "default" | "red"; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2">
      <p className={cn(
        "text-[20px] font-black leading-none",
        tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-foreground",
      )}>
        {value}
      </p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
    </div>
  );
}

function TextPanel({ children, title, usage }: { children: string; title: string; usage: BoardAiSummaryResponse["usage"] }) {
  return (
    <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{title}</p>
          <h2 className="mt-1 text-[22px] font-black tracking-tight text-foreground">AI readout</h2>
        </div>
        <UsageBadge usage={usage} />
      </div>
      <p className="mt-5 whitespace-pre-wrap text-[14px] font-semibold leading-7 text-foreground">{children}</p>
    </section>
  );
}

function BulletPanel({ items, title, tone }: { items: string[]; title: string; tone: "blue" | "green" | "red" }) {
  const toneClass = tone === "red" ? "bg-red-500" : tone === "green" ? "bg-emerald-500" : "bg-blue-500";
  return (
    <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-3 rounded-2xl border border-line bg-background p-3">
            <span className={cn("mt-2 size-2 shrink-0 rounded-full", toneClass)} />
            <p className="text-[13px] font-bold leading-6 text-foreground">{item}</p>
          </div>
        )) : (
          <p className="rounded-2xl border border-dashed border-line bg-background p-4 text-[13px] font-bold text-ink-soft">No items returned.</p>
        )}
      </div>
    </section>
  );
}

function RiskFindingCard({ finding }: { finding: BoardAiRiskScanResponse["findings"][number] }) {
  return (
    <article className="rounded-2xl border border-line bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">{finding.severity}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{finding.type.replaceAll("_", " ")}</span>
      </div>
      <h3 className="mt-3 text-[16px] font-black tracking-tight text-foreground">{finding.title}</h3>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-ink-soft">{finding.evidence}</p>
    </article>
  );
}

function ActionProposalCard({
  onToggle,
  proposal,
  selected,
}: {
  onToggle: () => void;
  proposal: BoardAiActionPlanResponse["proposals"][number];
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-2xl border bg-background p-4 text-left transition hover:border-primary/70",
        selected ? "border-primary ring-2 ring-primary/25" : "border-line",
      )}
    >
      <div className="flex gap-3">
        <span className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border text-[12px] font-black",
          selected ? "border-primary bg-primary text-foreground" : "border-line bg-white",
        )}>
          {selected ? <CheckCircle2 className="size-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-black tracking-tight text-foreground">{proposal.title}</span>
            <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-ink-soft">
              {proposal.type.replace("BOARD_", "").replaceAll("_", " ")}
            </span>
            <span className={cn(
              "rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]",
              proposal.riskLevel === "HIGH"
                ? "bg-red-50 text-red-700"
                : proposal.riskLevel === "MEDIUM"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700",
            )}>
              {proposal.riskLevel}
            </span>
          </span>
          <span className="mt-2 block text-[13px] font-semibold leading-6 text-ink-soft">{proposal.rationale}</span>
          <span className="mt-2 block rounded-xl bg-white px-3 py-2 text-[12px] font-bold leading-5 text-foreground">{proposal.impact}</span>
          {proposal.taskKey ? (
            <span className="mt-3 inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
              {proposal.taskKey}{proposal.columnName ? ` -> ${proposal.columnName}` : ""}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function UsageBadge({ usage }: { usage: BoardAiSummaryResponse["usage"] }) {
  return (
    <span className="rounded-full border border-line bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
      {usage.provider} / {usage.model} / {usage.totalTokens} tokens
    </span>
  );
}

function BoardAiSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="h-[360px] animate-pulse rounded-[24px] border border-line bg-white shadow-sm" />
      <div className="h-[360px] animate-pulse rounded-[24px] border border-line bg-white shadow-sm" />
    </div>
  );
}

function historyPreview(entry: BoardAiHistoryEntry) {
  if (entry.kind === "apply") {
    const applied = entry.results?.filter((result) => result.status === "COMPLETED").length ?? 0;
    const failed = entry.results?.filter((result) => result.status === "FAILED").length ?? 0;
    return `${applied} applied, ${failed} failed`;
  }

  const artifact = asHistoryRecord(entry.artifact);
  const text = firstHistoryText(artifact, ["content", "narrative", "summary"]);
  if (text) return text;

  const proposals = historyRecordArray(artifact.proposals);
  if (proposals.length) return `${proposals.length} proposed board actions`;

  const findings = historyRecordArray(artifact.findings);
  if (findings.length) return `${findings.length} risk findings`;

  return "Saved Board AI generation";
}

function historyTypeLabel(type: string) {
  switch (type) {
    case "board_summary":
      return "Summary";
    case "board_risk_scan":
      return "Risk scan";
    case "board_action_plan":
      return "Action plan";
    case "board_actions_apply":
      return "Apply attempt";
    default:
      return type.replaceAll("_", " ");
  }
}

function historyStatusClass(status: string) {
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function firstHistoryText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function asHistoryRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function historyRecordArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function historyStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

function stringFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getBoardStats(tasks: Task[]) {
  return {
    blocked: tasks.filter((task) => task.card?.flags.isBlocked).length,
    open: tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length,
    total: tasks.length,
    unassigned: tasks.filter((task) => !taskHasAssignee(task)).length,
  };
}

function taskHasAssignee(task: Task) {
  return Boolean(task.card?.assignees?.length || task.assignees?.length);
}

function normalizeBoard(board: ProjectBoard): ProjectBoard {
  return {
    ...board,
    columns: [...board.columns]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((column) => ({ ...column, tasks: [...(column.tasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder) })),
  };
}
