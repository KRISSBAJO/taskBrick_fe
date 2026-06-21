"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FolderPlus, RefreshCw } from "lucide-react";
import {
  createProject,
  getStoredAuth,
  listTeams,
  listWorkspaces,
  type Team,
  type Workspace,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/toast-provider";

const projectCurrencyOptions = ["USD", "NGN", "GBP", "EUR", "CAD", "AUD", "ZAR", "GHS", "KES"];

export function ProjectCreateForm({ disabledReason, onCreated }: { disabledReason?: string; onCreated?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const { toast } = useToast();
  const setMessage = useCallback(
    (message: { text: string; ok: boolean } | null) => {
      if (!message?.text) return;
      toast({
        title: message.ok ? "Done" : "Action failed",
        description: message.text,
        variant: message.ok ? "success" : "error",
      });
    },
    [toast],
  );

  const availableTeams = useMemo(
    () => teams.filter((team) => !team.workspaceId || !workspaceId || team.workspaceId === workspaceId),
    [teams, workspaceId],
  );

  const loadOptions = useCallback(async () => {
    const auth = getStoredAuth();

    if (!auth) {
      setMessage({ text: "Sign in to create projects.", ok: false });
      setLoadingOptions(false);
      return;
    }

    setLoadingOptions(true);
    setMessage(null);

    try {
      const [workspacePage, teamPage] = await Promise.all([
        listWorkspaces(auth.accessToken),
        listTeams(auth.accessToken),
      ]);

      setWorkspaces(workspacePage.data);
      setTeams(teamPage.data);
      setWorkspaceId((current) => current || workspacePage.data[0]?.id || "");
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to load options.",
        ok: false,
      });
    } finally {
      setLoadingOptions(false);
    }
  }, [setMessage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadOptions(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadOptions]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabledReason) {
      setMessage({ text: disabledReason, ok: false });
      return;
    }
    setLoading(true);
    setMessage(null);

    const auth = getStoredAuth();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!auth) {
      setMessage({ text: "Sign in to create projects.", ok: false });
      setLoading(false);
      return;
    }

    const selectedTeamId = String(formData.get("teamId") ?? "");
    const optionalValue = (key: string) => {
      const value = String(formData.get(key) ?? "").trim();
      return value || undefined;
    };
    const optionalNumber = (key: string) => {
      const value = Number(formData.get(key) || 0);
      return Number.isFinite(value) && value > 0 ? value : undefined;
    };

    try {
      await createProject(auth.accessToken, {
        workspaceId: String(formData.get("workspaceId") ?? ""),
        teamId: selectedTeamId || undefined,
        key: String(formData.get("key") ?? "").toUpperCase(),
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: "PLANNING",
        progress: 0,
        currency: String(formData.get("currency") || "USD").toUpperCase(),
        contractValue: optionalNumber("contractValue"),
        clientName: optionalValue("clientName"),
        clientEmail: optionalValue("clientEmail"),
        clientPhone: optionalValue("clientPhone"),
        locationName: optionalValue("locationName"),
        addressLine1: optionalValue("addressLine1"),
        city: optionalValue("city"),
        state: optionalValue("state"),
        country: optionalValue("country"),
        billingCode: optionalValue("billingCode"),
        costCenter: optionalValue("costCenter"),
      });
      form.reset();
      setMessage({ text: "Project created successfully.", ok: true });
      onCreated?.();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create project.",
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-panel shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <FolderPlus className="size-3.5 text-[#111111]" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">New project</h2>
            <p className="text-[11px] text-ink-soft">Posts to the TaskBricks API</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadOptions()}
          disabled={loadingOptions}
          aria-label="Refresh options"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-background text-ink-soft transition hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loadingOptions && "animate-spin")} aria-hidden="true" />
        </button>
        {disabledReason ? (
          <p className="mt-2 text-center text-xs font-semibold text-red-600">{disabledReason}</p>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
          Workspace
          <select
            className={inputClass}
            name="workspaceId"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            required
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
          Team
          <select className={inputClass} name="teamId">
            <option value="">No team</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
          Key
          <input
            className={cn(inputClass, "uppercase")}
            name="key"
            maxLength={16}
            placeholder="PROJ"
            required
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
          Name
          <input
            className={inputClass}
            name="name"
            placeholder="My project"
            required
          />
        </label>

        <label className="grid gap-1.5 text-xs font-semibold text-ink-soft sm:col-span-2">
          Description
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none resize-none"
            name="description"
            placeholder="What is this project about?"
          />
        </label>

        <div className="sm:col-span-2">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">
            Project profile
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Currency
              <select className={inputClass} name="currency" defaultValue="USD">
                {projectCurrencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Contract value
              <input className={inputClass} min={0} name="contractValue" placeholder="0" type="number" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Client
              <input className={inputClass} name="clientName" placeholder="Client or sponsor" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Client email
              <input className={inputClass} name="clientEmail" placeholder="stakeholder@company.com" type="email" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Location
              <input className={inputClass} name="locationName" placeholder="Office, region, or site" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Address
              <input className={inputClass} name="addressLine1" placeholder="Street address" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              City
              <input className={inputClass} name="city" placeholder="City" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              State / region
              <input className={inputClass} name="state" placeholder="State or region" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Country
              <input className={inputClass} name="country" placeholder="Country" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Client phone
              <input className={inputClass} name="clientPhone" placeholder="+1 555 0100" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Billing code
              <input className={inputClass} name="billingCode" placeholder="PO / billing ref" />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
              Cost center
              <input className={inputClass} name="costCenter" placeholder="Department code" />
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <button
          type="submit"
          disabled={Boolean(disabledReason) || loading || loadingOptions || workspaces.length === 0}
          className="tb-yellow-button w-full rounded-lg py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}
