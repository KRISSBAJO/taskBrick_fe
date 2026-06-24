"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileUp,
  FolderOpen,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  addTeamMember,
  bulkInviteTenantUsers,
  cancelTeamMemberInvite,
  createTeam,
  inviteTenantUser,
  inviteTeamMember,
  listPermissions,
  listRoles,
  listTeamMembers,
  listTeams,
  listUsers,
  listWorkspaces,
  removeTeamMember,
  resendTeamMemberInvite,
  updateTeamMemberRole,
  type BulkInviteUserInput,
  type BulkInviteUsersResponse,
  type Permission,
  type Role,
  type Team,
  type TeamMember,
  type TenantUser,
  type Workspace,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatShortDate, userInitials } from "@/lib/workspace-ui";

type DetailTab = "members" | "invite" | "add" | "directory" | "bulk" | "roles";

const teamRoleOptions = ["Owner", "Lead", "Manager", "Member", "Viewer"];

const TEAM_ACCENTS = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899",
];
function teamAccent(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TEAM_ACCENTS[h % TEAM_ACCENTS.length]!;
}
function teamInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function TeamPage() {
  const { auth } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [teams,           setTeams]           = useState<Team[]>([]);
  const [users,           setUsers]           = useState<TenantUser[]>([]);
  const [roles,           setRoles]           = useState<Role[]>([]);
  const [permissions,     setPermissions]     = useState<Permission[]>([]);
  const [selectedTeamId,  setSelectedTeamId]  = useState("");
  const [members,         setMembers]         = useState<TeamMember[]>([]);
  const [loadingDir,      setLoadingDir]      = useState(true);
  const [loadingMembers,  setLoadingMembers]  = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState("");
  const [message,         setMessage]         = useState<{ text: string; ok: boolean } | null>(null);
  const [showComposer,    setShowComposer]    = useState(false);
  const [query,           setQuery]           = useState("");
  const [activeTab,       setActiveTab]       = useState<DetailTab>("members");

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  const loadDirectory = useCallback(async () => {
    setLoadingDir(true); setError("");
    try {
      const [teamPage, userPage, roleList, permList] = await Promise.all([
        listTeams(auth.accessToken), listUsers(auth.accessToken),
        listRoles(auth.accessToken), listPermissions(auth.accessToken),
      ]);
      setTeams(teamPage.data); setUsers(userPage.data);
      setRoles(roleList); setPermissions(permList);
      setSelectedTeamId((cur) => cur || teamPage.data[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load team data.");
    } finally { setLoadingDir(false); }
  }, [auth.accessToken]);

  const loadMembers = useCallback(async (teamId = selectedTeamId) => {
    if (!teamId) { setMembers([]); return; }
    setLoadingMembers(true); setMessage(null);
    try { setMembers(await listTeamMembers(auth.accessToken, teamId)); }
    catch (err) { setMessage({ text: err instanceof Error ? err.message : "Unable to load members.", ok: false }); }
    finally { setLoadingMembers(false); }
  }, [auth.accessToken, selectedTeamId]);

  useEffect(() => { const t = window.setTimeout(() => void loadDirectory(), 0); return () => window.clearTimeout(t); }, [loadDirectory]);
  useEffect(() => { const t = window.setTimeout(() => void loadMembers(selectedTeamId), 0); return () => window.clearTimeout(t); }, [loadMembers, selectedTeamId]);

  const filteredTeams = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return teams;
    return teams.filter((t) => [t.name, t.description, t.workspace?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(text)));
  }, [query, teams]);

  const memberUserIds    = useMemo(() => new Set(members.map((m) => m.userId)), [members]);
  const addableUsers     = useMemo(() => users.filter((u) => !memberUserIds.has(u.id)), [memberUserIds, users]);
  const activeMembers    = members.filter((m) => m.user.status === "ACTIVE").length;
  const invitedMembers   = members.filter((m) => m.user.status === "INVITED").length;
  const uniquePerms      = useMemo(() => {
    const keys = new Set<string>();
    members.forEach((m) => derivePermissions(m).forEach((p) => keys.add(permKey(p))));
    return keys.size;
  }, [members]);

  async function onTeamCreated(team: Team) {
    setShowComposer(false); setSelectedTeamId(team.id); setActiveTab("members");
    await loadDirectory();
  }

  async function onInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!selectedTeam) return;
    const form = e.currentTarget, fd = new FormData(form);
    const roleIds = fd.getAll("roleIds").map(String).filter(Boolean);
    setSaving(true); setMessage(null);
    try {
      await inviteTeamMember(auth.accessToken, selectedTeam.id, {
        email: String(fd.get("email") || ""), firstName: String(fd.get("firstName") || ""),
        lastName: String(fd.get("lastName") || ""), teamRole: String(fd.get("teamRole") || "Member"), roleIds,
      });
      form.reset(); setMessage({ text: "User invited and added to the team.", ok: true });
      toast({ title: "User invited", description: "The account was created and added to this team.", variant: "success" });
      await Promise.all([loadMembers(selectedTeam.id), loadDirectory()]);
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to invite user.";
      setMessage({ text: description, ok: false });
      toast({ title: "Invite failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  async function onInviteTenantUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const roleIds = fd.getAll("roleIds").map(String).filter(Boolean);

    setSaving(true);
    setMessage(null);
    try {
      await inviteTenantUser(auth.accessToken, {
        email: String(fd.get("email") || ""),
        firstName: String(fd.get("firstName") || ""),
        lastName: String(fd.get("lastName") || ""),
        roleIds,
      });
      form.reset();
      toast({ title: "Tenant user invited", description: "The user can now be assigned to teams, projects, and tasks.", variant: "success" });
      await loadDirectory();
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to create tenant user.";
      toast({ title: "Tenant invite failed", description, variant: "error" });
      setMessage({ text: description, ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function onBulkInviteUsers(payload: {
    users: BulkInviteUserInput[];
    defaultRoleIds?: string[];
    sendInvites?: boolean;
  }): Promise<BulkInviteUsersResponse> {
    setSaving(true);
    setMessage(null);
    try {
      const result = await bulkInviteTenantUsers(auth.accessToken, payload);
      toast({
        title: "Bulk import finished",
        description: `${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed.`,
        variant: result.failed ? "warning" : "success",
      });
      await loadDirectory();
      return result;
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to import tenant users.";
      toast({ title: "Bulk import failed", description, variant: "error" });
      setMessage({ text: description, ok: false });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function onAddExisting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!selectedTeam) return;
    const form = e.currentTarget, fd = new FormData(form);
    const userId = String(fd.get("userId") || "");
    if (!userId) return;
    setSaving(true); setMessage(null);
    try {
      await addTeamMember(auth.accessToken, selectedTeam.id, { userId, role: String(fd.get("teamRole") || "Member") });
      form.reset(); setMessage({ text: "Member added to the team.", ok: true });
      toast({ title: "Member added", description: "The tenant user now belongs to this team.", variant: "success" });
      await Promise.all([loadMembers(selectedTeam.id), loadDirectory()]);
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to add member.";
      setMessage({ text: description, ok: false });
      toast({ title: "Add member failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  async function onUpdateRole(member: TeamMember, role: string) {
    if (!selectedTeam) return;
    setSaving(true); setMessage(null);
    try {
      await updateTeamMemberRole(auth.accessToken, selectedTeam.id, member.userId, role);
      setMembers((cur) => cur.map((m) => m.id === member.id ? { ...m, role } : m));
      setMessage({ text: "Team role updated.", ok: true });
      toast({ title: "Team role updated", description: `${displayName(member.user)} is now ${role}.`, variant: "success" });
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to update role.";
      setMessage({ text: description, ok: false });
      toast({ title: "Role update failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  async function onRemoveMember(member: TeamMember) {
    if (!selectedTeam) return;
    const confirmed = await confirm({
      title: "Remove team member?",
      description: `Remove ${displayName(member.user)} from ${selectedTeam.name}? Their account stays in the tenant, but they lose this team's access.`,
      confirmLabel: "Remove member",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true); setMessage(null);
    try {
      await removeTeamMember(auth.accessToken, selectedTeam.id, member.userId);
      setMembers((cur) => cur.filter((m) => m.id !== member.id));
      setMessage({ text: "Member removed.", ok: true });
      toast({ title: "Member removed", description: `${displayName(member.user)} was removed from ${selectedTeam.name}.`, variant: "success" });
      await loadDirectory();
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to remove member.";
      setMessage({ text: description, ok: false });
      toast({ title: "Remove member failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  async function onResendInvite(member: TeamMember) {
    if (!selectedTeam) return;
    setSaving(true); setMessage(null);
    try {
      const result = await resendTeamMemberInvite(auth.accessToken, selectedTeam.id, member.userId);
      const description = result.delivery === "in_app"
        ? "The existing user was notified in the app."
        : "The invite email was sent again.";
      setMessage({ text: description, ok: true });
      toast({ title: "Invite resent", description, variant: "success" });
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to resend invitation.";
      setMessage({ text: description, ok: false });
      toast({ title: "Resend failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  async function onCancelInvite(member: TeamMember) {
    if (!selectedTeam) return;
    const confirmed = await confirm({
      title: "Cancel invitation?",
      description: `Cancel the pending invite for ${displayName(member.user)}? They will be removed from ${selectedTeam.name}.`,
      confirmLabel: "Cancel invite",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true); setMessage(null);
    try {
      await cancelTeamMemberInvite(auth.accessToken, selectedTeam.id, member.userId);
      setMembers((cur) => cur.filter((m) => m.id !== member.id));
      setMessage({ text: "Invitation cancelled.", ok: true });
      toast({ title: "Invitation cancelled", description: `${displayName(member.user)} was removed from ${selectedTeam.name}.`, variant: "success" });
      await loadDirectory();
    } catch (err) {
      const description = err instanceof Error ? err.message : "Unable to cancel invitation.";
      setMessage({ text: description, ok: false });
      toast({ title: "Cancel failed", description, variant: "error" });
    }
    finally { setSaving(false); }
  }

  const TABS: { id: DetailTab; label: string; icon: ReactNode }[] = [
    { id: "members", label: `Members (${members.length})`, icon: <Users className="size-3.5" /> },
    { id: "invite",  label: "Invite",   icon: <Mail className="size-3.5" /> },
    { id: "add",     label: "Add user", icon: <UserPlus className="size-3.5" /> },
    { id: "directory", label: `Tenant users (${users.length})`, icon: <ClipboardList className="size-3.5" /> },
    { id: "bulk", label: "Bulk upload", icon: <FileUp className="size-3.5" /> },
    { id: "roles",   label: "Roles",    icon: <BookOpen className="size-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Page hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] px-5 py-4"
        style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)", boxShadow: "0 0 20px rgba(255,212,0,0.35)" }}
          >
            <Users className="size-5 text-[#111111]" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight text-white">Team management</h1>
            <p className="text-[12px] text-white/35">Invite users, manage roles, and inspect RBAC permissions.</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "Teams",       value: teams.length },
              { label: "Users",       value: users.length },
              { label: "Roles",       value: roles.length },
              { label: "Permissions", value: permissions.length },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[17px] font-black leading-none text-white">{value}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadDirectory()}
              disabled={loadingDir}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.07] px-3 text-[12px] font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", loadingDir && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="tb-yellow-button inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-black"
            >
              <Plus className="size-3.5" />
              New team
            </button>
          </div>
        </div>
      </div>

      {/* ── Team composer modal ───────────────────────────────── */}
      {showComposer && (
        <TeamModal onClose={() => setShowComposer(false)}>
          <TeamComposer token={auth.accessToken} onCancel={() => setShowComposer(false)} onCreated={onTeamCreated} />
        </TeamModal>
      )}

      {/* ── Banners ───────────────────────────────────────────── */}
      {error   && <Banner ok={false}>{error}</Banner>}
      {message && <Banner ok={message.ok}>{message.text}</Banner>}

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="grid min-h-[680px] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* ── Team list sidebar ─────────────────────────────── */}
        <aside className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams…"
              className="h-9 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto tb-scrollbar">
            {loadingDir ? (
              <div className="grid gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[72px] animate-pulse rounded-xl bg-panel-muted" />
                ))}
              </div>
            ) : filteredTeams.length ? (
              <div className="grid gap-1.5">
                {filteredTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    active={team.id === selectedTeamId}
                    onSelect={() => { setSelectedTeamId(team.id); setActiveTab("members"); }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2">
                <CircleDot className="size-6 text-line" />
                <p className="text-[12px] font-bold text-ink-soft">No teams found</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right panel ───────────────────────────────────── */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-line bg-panel shadow-sm">
          {selectedTeam ? (
            <>
              {/* Team identity banner */}
              <div className="shrink-0 border-b border-line px-5 py-4">
                <div className="flex flex-wrap items-start gap-4">
                  {/* Avatar */}
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
                    style={{ background: teamAccent(selectedTeam.name) }}
                  >
                    {teamInitials(selectedTeam.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-foreground">{selectedTeam.name}</h2>
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {selectedTeam.description || "No description."}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-ink-soft">
                      {selectedTeam.workspace?.name ?? "Tenant-wide"}
                    </p>
                  </div>

                  {/* Member stats */}
                  <div className="flex items-center gap-4">
                    {[
                      { label: "Members", value: members.length },
                      { label: "Active",  value: activeMembers   },
                      { label: "Invited", value: invitedMembers  },
                      { label: "Perms",   value: uniquePerms     },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-[18px] font-black leading-none text-foreground">{value}</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tab bar */}
                <div className="mt-4 flex gap-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                        activeTab === tab.id
                          ? "bg-foreground text-white shadow-sm"
                          : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="min-h-0 flex-1 overflow-y-auto tb-scrollbar">
                {activeTab === "members" && (
                  <MemberList
                    loading={loadingMembers}
                    members={members}
                    saving={saving}
                    onCancelInvite={onCancelInvite}
                    onRemove={onRemoveMember}
                    onResendInvite={onResendInvite}
                    onUpdateRole={onUpdateRole}
                  />
                )}
                {activeTab === "invite" && (
                  <div className="p-5">
                    <InviteForm roles={roles} saving={saving} onSubmit={onInvite} />
                  </div>
                )}
                {activeTab === "add" && (
                  <div className="p-5">
                    <AddExistingForm users={addableUsers} saving={saving} onSubmit={onAddExisting} />
                  </div>
                )}
                {activeTab === "directory" && (
                  <TenantUsersPanel
                    roles={roles}
                    saving={saving}
                    users={users}
                    onInvite={onInviteTenantUser}
                  />
                )}
                {activeTab === "bulk" && (
                  <BulkUserImportPanel
                    roles={roles}
                    saving={saving}
                    onImport={onBulkInviteUsers}
                  />
                )}
                {activeTab === "roles" && (
                  <RoleCatalog roles={roles} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
              <span
                className="flex size-14 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
              >
                <Users className="size-6 text-white/40" />
              </span>
              <div className="text-center">
                <h3 className="text-sm font-black text-foreground">No team selected</h3>
                <p className="mt-1 text-sm text-ink-soft">Create or select a team to manage members.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─── Team card (sidebar) ──────────────────────────────────────────────────── */

function TeamCard({ active, onSelect, team }: { active: boolean; onSelect: () => void; team: Team }) {
  const accent = teamAccent(team.name);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition",
        active
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-transparent bg-background hover:border-line hover:bg-panel-muted",
      )}
    >
      {/* Active left stripe */}
      {active && <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />}

      <div className="flex items-center gap-3 pl-0.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white"
          style={{ background: active ? accent : "#111111" }}
        >
          {teamInitials(team.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-foreground">{team.name}</p>
          <p className="truncate text-[11px] text-ink-soft">{team.workspace?.name ?? "Tenant-wide"}</p>
        </div>
        <ChevronRight className={cn("size-4 shrink-0 transition", active ? "text-foreground" : "text-line group-hover:text-ink-soft")} />
      </div>

      <div className="mt-2.5 flex items-center gap-3 pl-0.5 text-[10px] font-semibold text-ink-soft">
        <span className="flex items-center gap-1">
          <Users className="size-3" />{team._count?.members ?? 0} members
        </span>
        <span className="flex items-center gap-1">
          <FolderOpen className="size-3" />{team._count?.projects ?? 0} projects
        </span>
      </div>
    </button>
  );
}

/* ─── Member list ──────────────────────────────────────────────────────────── */

function MemberList({ loading, members, onCancelInvite, onRemove, onResendInvite, onUpdateRole, saving }: {
  loading: boolean;
  members: TeamMember[];
  onCancelInvite: (m: TeamMember) => void;
  onRemove: (m: TeamMember) => void;
  onResendInvite: (m: TeamMember) => void;
  onUpdateRole: (m: TeamMember, role: string) => void;
  saving: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse rounded-xl bg-panel-muted" />
        ))}
      </div>
    );
  }
  if (!members.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-8">
        <CircleDot className="size-6 text-line" />
        <p className="text-[13px] font-bold text-ink-soft">No members yet</p>
        <p className="text-[12px] text-ink-soft">Use the Invite or Add user tabs to add people.</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-line">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          saving={saving}
          onCancelInvite={onCancelInvite}
          onRemove={onRemove}
          onResendInvite={onResendInvite}
          onUpdateRole={onUpdateRole}
        />
      ))}
    </div>
  );
}

function MemberRow({ member, onCancelInvite, onRemove, onResendInvite, onUpdateRole, saving }: {
  member: TeamMember;
  onCancelInvite: (m: TeamMember) => void;
  onRemove: (m: TeamMember) => void;
  onResendInvite: (m: TeamMember) => void;
  onUpdateRole: (m: TeamMember, role: string) => void;
  saving: boolean;
}) {
  const tenantRoles = member.user.roles?.map((r) => r.role) ?? [];
  const perms       = derivePermissions(member);
  const isInvited   = member.user.status === "INVITED";

  return (
    <article className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-panel-muted/60">
      {/* Avatar */}
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[10px] font-black text-white">
        {userInitials(member.user)}
      </span>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-foreground">{displayName(member.user)}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[11px] text-ink-soft">{member.user.email}</span>
          <StatusBadge status={member.user.status} />
          {member.createdAt && (
            <span className="text-[10px] text-ink-soft/60">· joined {formatShortDate(member.createdAt)}</span>
          )}
        </div>
      </div>

      {/* Tenant roles */}
      <div className="hidden min-w-0 max-w-[180px] shrink-0 lg:block">
        {tenantRoles.length ? (
          <div className="flex flex-wrap gap-1">
            {tenantRoles.slice(0, 2).map((r) => (
              <span key={r.id} className="inline-flex items-center gap-0.5 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[9px] font-black text-foreground">
                <ShieldCheck className="size-2.5 text-primary-dark" />{r.name}
              </span>
            ))}
            {tenantRoles.length > 2 && (
              <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-bold text-ink-soft">+{tenantRoles.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-ink-soft/50">No RBAC role</span>
        )}
        {perms.length > 0 && (
          <p className="mt-1 text-[10px] text-ink-soft/50">{perms.length} permission{perms.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Team role select */}
      <div className="shrink-0">
        <select
          name={`role-${member.id}`}
          value={member.role || "Member"}
          disabled={saving}
          onChange={(e) => onUpdateRole(member, e.target.value)}
          className="h-8 rounded-lg border border-line bg-background px-2 text-[12px] font-bold text-foreground transition focus:border-primary focus:outline-none disabled:opacity-50"
        >
          {teamRoleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Remove — visible on hover */}
      <div className="flex shrink-0 items-center gap-1.5">
        {isInvited ? (
          <>
            <button
              type="button"
              onClick={() => onResendInvite(member)}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-background px-2 text-[11px] font-black text-foreground transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" />
              Resend
            </button>
            <button
              type="button"
              onClick={() => onCancelInvite(member)}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 text-[11px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onRemove(member)}
            disabled={saving}
            className="rounded-lg p-1.5 text-ink-soft/30 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-0"
            aria-label="Remove member"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}

/* ─── Invite form ──────────────────────────────────────────────────────────── */

function InviteForm({ onSubmit, roles, saving }: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  roles: Role[];
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)", boxShadow: "0 0 14px rgba(255,212,0,0.28)" }}>
          <Mail className="size-4 text-[#111111]" />
        </span>
        <div>
          <h3 className="text-[14px] font-black text-foreground">Invite new user</h3>
          <p className="text-[12px] text-ink-soft">Creates or reuses a tenant user account and adds them to this team.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="First name">
          <input name="firstName" required maxLength={80} className={fieldCls} />
        </FormField>
        <FormField label="Last name">
          <input name="lastName" required maxLength={80} className={fieldCls} />
        </FormField>
        <FormField label="Email address">
          <input name="email" required type="email" maxLength={255} className={fieldCls} />
        </FormField>
        <FormField label="Team role">
          <select name="teamRole" defaultValue="Member" className={fieldCls}>
            {teamRoleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
      </div>

      {roles.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Assign RBAC roles</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-start gap-2 rounded-xl border border-line bg-background px-3 py-2.5 transition hover:border-primary/40 hover:bg-panel-muted">
                <input name="roleIds" type="checkbox" value={role.id} className="mt-0.5 accent-[#ffd400]" />
                <span className="min-w-0">
                  <span className="block text-[12px] font-black text-foreground">{role.name}</span>
                  <span className="block text-[11px] text-ink-soft">{role.permissions?.length ?? 0} permissions</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="tb-yellow-button mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black disabled:opacity-60"
      >
        <UserPlus className="size-4" />
        {saving ? "Inviting…" : "Invite and add to team"}
      </button>
    </form>
  );
}

/* ─── Add existing user form ───────────────────────────────────────────────── */

function AddExistingForm({ onSubmit, saving, users }: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  users: TenantUser[];
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-foreground">
          <UserPlus className="size-4 text-primary" />
        </span>
        <div>
          <h3 className="text-[14px] font-black text-foreground">Add existing user</h3>
          <p className="text-[12px] text-ink-soft">Attach a current tenant user to this team without sending an invite email.</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-10 text-center">
          <Users className="mx-auto size-6 text-ink-soft/50" />
          <p className="mt-2 text-[13px] font-bold text-ink-soft">All tenant users are already in this team.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <FormField label="Select user">
              <select name="userId" required className={fieldCls}>
                <option value="">Choose a user…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{displayName(u)} — {u.email}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Team role">
              <select name="teamRole" defaultValue="Member" className={fieldCls}>
                {teamRoleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-background text-[13px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-60"
          >
            <Plus className="size-4" />
            {saving ? "Adding…" : "Add to team"}
          </button>
        </>
      )}
    </form>
  );
}

/* ─── Role catalog ─────────────────────────────────────────────────────────── */

function TenantUsersPanel({
  onInvite,
  roles,
  saving,
  users,
}: {
  onInvite: (e: FormEvent<HTMLFormElement>) => void;
  roles: Role[];
  saving: boolean;
  users: TenantUser[];
}) {
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return users;
    return users.filter((user) =>
      [displayName(user), user.email, user.status, ...(user.roles?.map((role) => role.role.name) ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text)),
    );
  }, [search, users]);

  return (
    <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-2xl border border-line bg-background">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Tenant directory</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[15px] font-black text-foreground">{filteredUsers.length} users matched</h3>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users, email, status, role..."
                className="h-9 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-line">
          {filteredUsers.length ? (
            filteredUsers.map((user) => (
              <article key={user.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-panel-muted/70">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="size-10 rounded-xl object-cover" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[11px] font-black text-white">
                    {userInitials(user)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-foreground">{displayName(user)}</p>
                  <p className="truncate text-[11px] text-ink-soft">{user.email}</p>
                </div>
                <div className="hidden min-w-0 max-w-[280px] flex-1 flex-wrap justify-end gap-1 md:flex">
                  {user.roles?.length ? (
                    user.roles.slice(0, 3).map((assignment) => (
                      <span key={assignment.role.id} className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-[9px] font-black text-foreground">
                        {assignment.role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-ink-soft">No RBAC role</span>
                  )}
                  {(user.roles?.length ?? 0) > 3 ? (
                    <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
                      +{(user.roles?.length ?? 0) - 3}
                    </span>
                  ) : null}
                </div>
                <StatusBadge status={user.status} />
              </article>
            ))
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-8">
              <Users className="size-7 text-line" />
              <p className="text-[13px] font-bold text-ink-soft">No tenant users match this search.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-background p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[#111111]">
            <UserPlus className="size-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-black text-foreground">Create tenant user</h3>
            <p className="text-[12px] text-ink-soft">Invite a user without adding them to a team yet.</p>
          </div>
        </div>

        <form onSubmit={onInvite} className="grid gap-3">
          <FormField label="First name">
            <input name="firstName" required maxLength={80} className={fieldCls} />
          </FormField>
          <FormField label="Last name">
            <input name="lastName" required maxLength={80} className={fieldCls} />
          </FormField>
          <FormField label="Email address">
            <input name="email" required type="email" maxLength={255} className={fieldCls} />
          </FormField>

          {roles.length ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">RBAC roles</p>
              <div className="mt-2 grid gap-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-start gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 transition hover:border-primary/40">
                    <input name="roleIds" type="checkbox" value={role.id} className="mt-0.5 accent-[#ffd400]" />
                    <span>
                      <span className="block text-[12px] font-black text-foreground">{role.name}</span>
                      <span className="block text-[11px] text-ink-soft">{role.permissions?.length ?? 0} permissions</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="tb-yellow-button mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-black disabled:opacity-60"
          >
            <Mail className="size-4" />
            {saving ? "Inviting..." : "Invite tenant user"}
          </button>
        </form>
      </section>
    </div>
  );
}

function BulkUserImportPanel({
  onImport,
  roles,
  saving,
}: {
  onImport: (payload: {
    users: BulkInviteUserInput[];
    defaultRoleIds?: string[];
    sendInvites?: boolean;
  }) => Promise<BulkInviteUsersResponse>;
  roles: Role[];
  saving: boolean;
}) {
  const [csv, setCsv] = useState("email,firstName,lastName,roles\nada@example.com,Ada,Lovelace,Member");
  const [defaultRoleIds, setDefaultRoleIds] = useState<string[]>([]);
  const [sendInvites, setSendInvites] = useState(true);
  const [result, setResult] = useState<BulkInviteUsersResponse | null>(null);

  const preview = useMemo(() => parseTenantUserCsv(csv, roles), [csv, roles]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function submitImport() {
    if (!preview.rows.length || preview.errors.length) return;
    const users = preview.rows.map((row) => ({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      roleIds: row.roleIds,
    }));
    const response = await onImport({ users, defaultRoleIds, sendInvites });
    setResult(response);
  }

  return (
    <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-2xl border border-line bg-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Bulk tenant import</p>
            <h3 className="mt-1 text-[16px] font-black text-foreground">Upload users from CSV</h3>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-soft">
              Use columns: email, firstName, lastName, roles. Roles can be role names or IDs separated by semicolon or pipe.
            </p>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-panel px-4 text-[13px] font-black text-foreground transition hover:bg-panel-muted">
            <FileUp className="size-4" />
            Choose CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
          </label>
        </div>

        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={12}
          className="mt-4 w-full resize-y rounded-2xl border border-line bg-panel p-4 font-mono text-[12px] leading-6 text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
          placeholder="email,firstName,lastName,roles"
        />

        <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-panel p-3">
          <label className="flex items-center gap-2 text-[13px] font-bold text-foreground">
            <input
              type="checkbox"
              checked={sendInvites}
              onChange={(event) => setSendInvites(event.target.checked)}
              className="accent-[#ffd400]"
            />
            Send invitation emails to newly created users
          </label>

          {roles.length ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Default roles for every imported user</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.map((role) => {
                  const checked = defaultRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() =>
                        setDefaultRoleIds((current) =>
                          checked ? current.filter((id) => id !== role.id) : [...current, role.id],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] font-black transition",
                        checked
                          ? "border-primary bg-primary text-[#111111]"
                          : "border-line bg-background text-ink-soft hover:text-foreground",
                      )}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void submitImport()}
          disabled={saving || !preview.rows.length || preview.errors.length > 0}
          className="tb-yellow-button mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black disabled:opacity-50"
        >
          <FileUp className="size-4" />
          {saving ? "Importing..." : `Import ${preview.rows.length} users`}
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-background">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Preview</p>
          <h3 className="mt-1 text-[15px] font-black text-foreground">{preview.rows.length} valid rows</h3>
        </div>

        {preview.errors.length ? (
          <div className="space-y-2 p-4">
            {preview.errors.map((error) => (
              <div key={error} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">
                {error}
              </div>
            ))}
          </div>
        ) : null}

        <div className="max-h-[420px] overflow-y-auto tb-scrollbar">
          {preview.rows.length ? (
            <div className="divide-y divide-line">
              {preview.rows.map((row) => (
                <article key={`${row.rowNumber}-${row.email}`} className="px-4 py-3">
                  <p className="text-[13px] font-black text-foreground">
                    {row.firstName || row.lastName ? `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() : row.email}
                  </p>
                  <p className="text-[11px] text-ink-soft">{row.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.roleNames.length ? row.roleNames.map((roleName) => (
                      <span key={roleName} className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
                        {roleName}
                      </span>
                    )) : (
                      <span className="text-[10px] text-ink-soft">No row roles</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-8">
              <FileUp className="size-7 text-line" />
              <p className="text-[13px] font-bold text-ink-soft">Paste or upload a CSV to preview users.</p>
            </div>
          )}
        </div>

        {result ? (
          <div className="border-t border-line p-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                ["Created", result.created, "text-emerald-700"],
                ["Updated", result.updated, "text-blue-700"],
                ["Skipped", result.skipped, "text-amber-700"],
                ["Failed", result.failed, "text-red-700"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-line bg-panel p-2">
                  <p className={cn("text-lg font-black", color as string)}>{value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RoleCatalog({ roles }: { roles: Role[] }) {
  if (!roles.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-8">
        <BookOpen className="size-6 text-line" />
        <p className="text-[13px] font-bold text-ink-soft">No roles available</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => {
        const rolePerms = role.permissions?.map((rp) => rp.permission) ?? [];
        return (
          <article key={role.id} className="rounded-xl border border-line bg-background p-4 transition hover:border-primary/30 hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black text-foreground">{role.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                  {role.description || "No description."}
                </p>
              </div>
              {role.isSystem && (
                <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-amber-700">System</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {rolePerms.slice(0, 4).map((p) => (
                <span key={p.id} className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-bold text-ink-soft">
                  {p.action}:{p.subject}
                </span>
              ))}
              {rolePerms.length > 4 && (
                <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">+{rolePerms.length - 4}</span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-bold text-ink-soft/60">{rolePerms.length} permission{rolePerms.length !== 1 ? "s" : ""}</p>
          </article>
        );
      })}
    </div>
  );
}

/* ─── Team modal ───────────────────────────────────────────────────────────── */

function TeamModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-panel shadow-2xl ring-1 ring-line">
        {/* Dark header */}
        <div
          className="relative overflow-hidden px-5 py-4"
          style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)", boxShadow: "0 0 16px rgba(255,212,0,0.4)" }}
              >
                <Users className="size-4 text-[#111111]" />
              </span>
              <div>
                <p className="text-[13px] font-black text-white">Create new team</p>
                <p className="text-[11px] text-white/40">Organize members by unit or workspace</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Team composer ────────────────────────────────────────────────────────── */

function TeamComposer({ onCancel, onCreated, token }: {
  onCancel: () => void;
  onCreated: (team: Team) => void;
  token: string;
}) {
  const [saving,     setSaving]     = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [message,    setMessage]    = useState<{ text: string; ok: boolean } | null>(null);
  const [nameValue,  setNameValue]  = useState("");

  useEffect(() => {
    listWorkspaces(token).then((p) => setWorkspaces(p.data)).catch(() => setWorkspaces([]));
  }, [token]);

  const accent   = nameValue.trim() ? teamAccent(nameValue.trim()) : "#e8e0c8";
  const initials = nameValue.trim() ? teamInitials(nameValue.trim()) : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, fd = new FormData(form);
    setSaving(true); setMessage(null);
    try {
      const team = await createTeam(token, {
        name:        String(fd.get("name") || ""),
        description: String(fd.get("description") || "") || undefined,
        workspaceId: String(fd.get("workspaceId") || "") || undefined,
      });
      form.reset(); setNameValue(""); onCreated(team);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to create team.", ok: false });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Live avatar preview */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-line bg-background px-4 py-3.5 transition-all">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white transition-all duration-300"
          style={{
            background: initials ? accent : "#e8e0c8",
            boxShadow: initials ? `0 6px 20px ${accent}50` : "none",
          }}
        >
          {initials ?? <Users className="size-5 text-[#a09580]" />}
        </span>
        <div className="min-w-0">
          <p className={cn("truncate text-[14px] font-black transition-colors", nameValue.trim() ? "text-foreground" : "text-ink-soft/50")}>
            {nameValue.trim() || "Your team name"}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-soft">Avatar preview — updates as you type</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_188px]">
        <FormField label="Team name">
          <input
            name="name"
            required
            autoFocus
            maxLength={120}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="e.g. Frontend Platform"
            className={fieldCls}
          />
        </FormField>
        <FormField label="Workspace">
          <select name="workspaceId" className={fieldCls}>
            <option value="">Tenant-wide</option>
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </FormField>
        <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft sm:col-span-2">
          Description
          <textarea
            name="description"
            rows={3}
            placeholder="What does this team work on?"
            className="w-full resize-none rounded-lg border border-line bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-ink-soft/60 transition focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      {message && <div className="mt-3"><Banner ok={message.ok}>{message.text}</Banner></div>}

      <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-line px-5 text-[13px] font-bold text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !nameValue.trim()}
          className="tb-yellow-button inline-flex h-10 items-center gap-2 rounded-xl px-6 text-[13px] font-black disabled:opacity-55"
        >
          {saving ? (
            <>
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-foreground/25 border-t-foreground" />
              Creating…
            </>
          ) : (
            <>
              <Users className="size-3.5" />
              Create team
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ─── Shared micro-components ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status?: string }) {
  const s       = status || "UNKNOWN";
  const active  = s === "ACTIVE";
  const invited = s === "INVITED";
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-black",
      active  && "bg-emerald-50 text-emerald-700",
      invited && "bg-amber-50 text-amber-700",
      !active && !invited && "bg-slate-100 text-slate-500",
    )}>
      {active ? <CheckCircle2 className="size-2.5" /> : <CircleDot className="size-2.5" />}
      {s}
    </span>
  );
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">
      {label}{children}
    </label>
  );
}

function Banner({ children, ok }: { children: ReactNode; ok: boolean }) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-[13px] font-bold", ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
      {children}
    </div>
  );
}

/* ─── Pure helpers ─────────────────────────────────────────────────────────── */

type ParsedTenantUserRow = BulkInviteUserInput & {
  rowNumber: number;
  roleNames: string[];
};

function parseTenantUserCsv(csv: string, roles: Role[]) {
  const roleByToken = new Map<string, Role>();
  roles.forEach((role) => {
    roleByToken.set(role.id.toLowerCase(), role);
    roleByToken.set(role.name.toLowerCase(), role);
  });

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ParsedTenantUserRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  lines.forEach((line, index) => {
    const rowNumber = index + 1;
    const columns = splitCsvLine(line);
    const [rawEmail, firstName, lastName, rawRoles] = columns;
    const email = String(rawEmail || "").trim().toLowerCase();

    if (rowNumber === 1 && email === "email") return;

    if (!email) {
      errors.push(`Row ${rowNumber}: email is required.`);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNumber}: ${email} is not a valid email address.`);
      return;
    }

    if (seenEmails.has(email)) {
      errors.push(`Row ${rowNumber}: ${email} appears more than once.`);
      return;
    }

    seenEmails.add(email);

    const roleNames: string[] = [];
    const roleIds = String(rawRoles || "")
      .split(/[;|]/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => {
        const role = roleByToken.get(token.toLowerCase());
        if (!role) {
          errors.push(`Row ${rowNumber}: role "${token}" does not exist in this tenant.`);
          return "";
        }
        roleNames.push(role.name);
        return role.id;
      })
      .filter(Boolean);

    rows.push({
      rowNumber,
      email,
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      roleIds,
      roleNames,
    });
  });

  return { rows, errors };
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function derivePermissions(member: TeamMember) {
  const map = new Map<string, Permission>();
  member.user.roles?.forEach((a) => a.role.permissions?.forEach((rp) => map.set(permKey(rp.permission), rp.permission)));
  return [...map.values()].sort((a, b) => permKey(a).localeCompare(permKey(b)));
}
function permKey(p: Permission) { return `${p.action}:${p.subject}`; }
function displayName(u: { email: string; firstName?: string | null; lastName?: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

const fieldCls = "h-9 w-full rounded-lg border border-line bg-background px-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";
