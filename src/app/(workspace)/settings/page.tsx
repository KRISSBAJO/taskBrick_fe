"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Copy,
  Globe,
  HelpCircle,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  QrCode,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { useToast } from "@/components/toast-provider";
import {
  API_BASE_URL,
  WS_BASE_URL,
  changePassword,
  createFileAsset,
  createSupportRequest,
  createUploadIntent,
  disableMfa,
  enableTotp,
  getAccountHelp,
  getAccountOverview,
  getIdentitySecurityOverview,
  regenerateBackupCodes,
  revokeTrustedDevice,
  setupTotp,
  getMe,
  listAccountWorkspaces,
  listGuestWorkspaces,
  listTeams,
  updateMyProfile,
  type AccountHelp,
  type AccountOverview,
  type AccountWorkspace,
  type IdentitySecurityOverview,
  type GuestWorkspace,
  type SupportRequestPayload,
  type Team,
  type TotpSetupResponse,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";
import { uploadWithIntent } from "@/lib/upload";

// Tab system

type SettingsTab = "profile" | "workspace" | "guest" | "support" | "connections" | "security";

const TABS: Array<{ id: SettingsTab; label: string; icon: LucideIcon }> = [
  { id: "profile",     label: "Manage account",   icon: User },
  { id: "workspace",   label: "Your workspaces",  icon: BriefcaseBusiness },
  { id: "guest",       label: "Guest spaces",     icon: Users },
  { id: "support",     label: "Help and support", icon: HelpCircle },
  { id: "connections", label: "Connections",      icon: Globe },
  { id: "security",    label: "Security",         icon: Shield },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-NG", label: "English (Nigeria)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
];

// Settings page

export default function SettingsPage() {
  const { auth, user, logout, updateUser } = useWorkspaceAuth();
  const { toast } = useToast();
  const access = getAccessProfile(user);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [accountOverview, setAccountOverview] = useState<AccountOverview | null>(null);
  const [accountHelp, setAccountHelp] = useState<AccountHelp | null>(null);
  const [guestWorkspaces, setGuestWorkspaces] = useState<GuestWorkspace[]>([]);
  const [workspaces, setWorkspaces] = useState<AccountWorkspace[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [securityMessage, setSecurityMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [identityOverview, setIdentityOverview] = useState<IdentitySecurityOverview | null>(null);
  const [totpSetup, setTotpSetup] = useState<TotpSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl ?? "");
  const [supportMessage, setSupportMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const visibleTabs = useMemo(() => TABS.filter((tab) => {
    if (tab.id === "connections") return access.canViewDeveloperConnections;
    if (tab.id === "security") return access.canViewSecurity;
    return true;
  }), [access.canViewDeveloperConnections, access.canViewSecurity]);
  const selectedTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : "profile";

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, workspaceResult, guestResult, helpResult, identityResult, teamResult] = await Promise.allSettled([
        getAccountOverview(auth.accessToken),
        listAccountWorkspaces(auth.accessToken, { limit: 100 }),
        listGuestWorkspaces(auth.accessToken, { limit: 100 }),
        getAccountHelp(auth.accessToken),
        getIdentitySecurityOverview(auth.accessToken),
        access.canViewPeopleDirectory ? listTeams(auth.accessToken) : Promise.resolve({ data: [] }),
      ]);

      setAccountOverview(overviewResult.status === "fulfilled" ? overviewResult.value : null);
      setWorkspaces(workspaceResult.status === "fulfilled" ? workspaceResult.value.data : []);
      setGuestWorkspaces(guestResult.status === "fulfilled" ? guestResult.value.data : []);
      setAccountHelp(helpResult.status === "fulfilled" ? helpResult.value : null);
      setIdentityOverview(identityResult.status === "fulfilled" ? identityResult.value : null);
      setTeams(teamResult.status === "fulfilled" ? teamResult.value.data : []);

      const failedCore = [overviewResult, workspaceResult, guestResult, helpResult].filter((result) => result.status === "rejected");
      if (failedCore.length >= 4) {
        const reason = failedCore[0]?.reason;
        setError(reason instanceof Error ? reason.message : "Unable to load account settings.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [access.canViewPeopleDirectory, auth.accessToken]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadSettings(), 0);
    return () => window.clearTimeout(t);
  }, [loadSettings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setProfileAvatar(user.avatarUrl ?? ""), 0);
    return () => window.clearTimeout(timeout);
  }, [user.avatarUrl]);

  function copyToClipboard(value: string, key: string) {
    void navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 2000);
    });
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ ok: false, text: "New passwords do not match." });
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(auth.accessToken, {
        currentPassword,
        newPassword,
        revokeOtherSessions: formData.get("revokeOtherSessions") === "on",
      });
      setSecurityMessage({ ok: true, text: result.message });
      form.reset();
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to change password." });
    } finally {
      setChangingPassword(false);
    }
  }

  async function onStartTotp() {
    setSecurityMessage(null);
    try {
      const result = await setupTotp(auth.accessToken, { label: user.email });
      setTotpSetup(result);
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to start MFA setup." });
    }
  }

  async function onEnableTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!totpSetup) return;
    setSecurityMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await enableTotp(auth.accessToken, {
        factorId: totpSetup.factorId,
        code: String(formData.get("code") ?? ""),
      });
      setBackupCodes(result.backupCodes);
      setTotpSetup(null);
      setSecurityMessage({ ok: true, text: "MFA is now enabled. Store the backup codes securely." });
      await loadSettings();
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to enable MFA." });
    }
  }

  async function onDisableMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await disableMfa(auth.accessToken, {
        currentPassword: String(formData.get("currentPassword") ?? ""),
        code: String(formData.get("code") ?? "") || undefined,
      });
      setSecurityMessage({ ok: true, text: "MFA has been disabled and trusted devices were revoked." });
      form.reset();
      await loadSettings();
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to disable MFA." });
    }
  }

  async function onRegenerateBackupCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const result = await regenerateBackupCodes(auth.accessToken, { code: String(formData.get("code") ?? "") });
      setBackupCodes(result.backupCodes);
      setSecurityMessage({ ok: true, text: "Backup codes regenerated." });
      await loadSettings();
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to regenerate backup codes." });
    }
  }

  async function onRevokeTrustedDevice(deviceId: string) {
    try {
      await revokeTrustedDevice(auth.accessToken, deviceId);
      setSecurityMessage({ ok: true, text: "Trusted device revoked." });
      await loadSettings();
    } catch (caught) {
      setSecurityMessage({ ok: false, text: caught instanceof Error ? caught.message : "Unable to revoke device." });
    }
  }

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: optionalText(formData.get("firstName")),
      lastName: optionalText(formData.get("lastName")),
      timezone: optionalText(formData.get("timezone")),
      locale: optionalText(formData.get("locale")),
      avatarUrl: optionalText(formData.get("avatarUrl")),
    };

    setProfileSaving(true);
    try {
      const profile = await updateMyProfile(auth.accessToken, payload);
      const refreshed = await getMe(auth.accessToken).catch(() => user);
      updateUser({
        ...refreshed,
        firstName: profile.firstName ?? refreshed.firstName,
        lastName: profile.lastName ?? refreshed.lastName,
        avatarUrl: profile.avatarUrl ?? refreshed.avatarUrl ?? null,
        timezone: profile.timezone ?? refreshed.timezone ?? null,
        locale: profile.locale ?? refreshed.locale ?? null,
      });
      toast({ title: "Profile updated", description: "Your name and avatar are ready for workspace cards.", variant: "success" });
    } catch (caught) {
      toast({ title: "Profile update failed", description: caught instanceof Error ? caught.message : "Unable to save profile.", variant: "error" });
    } finally {
      setProfileSaving(false);
    }
  }

  async function onSupportRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSupportMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: SupportRequestPayload = {
      category: String(formData.get("category") ?? "WORKSPACE") as SupportRequestPayload["category"],
      priority: String(formData.get("priority") ?? "NORMAL") as SupportRequestPayload["priority"],
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      sourceUrl: window.location.pathname,
    };

    if (!payload.subject || !payload.message) {
      setSupportMessage({ ok: false, text: "Subject and message are required." });
      return;
    }

    setSupportSubmitting(true);
    try {
      const result = await createSupportRequest(auth.accessToken, payload);
      setSupportMessage({ ok: true, text: result.message });
      toast({ title: "Support request sent", description: result.message, variant: "success" });
      form.reset();
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : "Unable to create support request.";
      setSupportMessage({ ok: false, text });
      toast({ title: "Support request failed", description: text, variant: "error" });
    } finally {
      setSupportSubmitting(false);
    }
  }

  async function onAvatarFileChange(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Use an image file", description: "Profile photos must be PNG, JPG, WebP, GIF, or another image type.", variant: "error" });
      return;
    }

    setAvatarUploading(true);
    try {
      const intent = await createUploadIntent(auth.accessToken, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        scope: "PROFILE",
        entityType: "PROFILE",
        visibility: "PRIVATE",
      });
      const uploadedUrl = await uploadWithIntent(intent, file);
      await createFileAsset(auth.accessToken, {
        fileName: file.name,
        fileUrl: uploadedUrl,
        storageKey: intent.storageKey,
        provider: intent.provider,
        mimeType: file.type || intent.mimeType || undefined,
        sizeBytes: file.size,
        scope: "PROFILE",
        entityType: "PROFILE",
        visibility: "PRIVATE",
        metadata: {
          source: "profile-avatar-upload",
          kind: "avatar",
        },
      });
      const profile = await updateMyProfile(auth.accessToken, { avatarUrl: uploadedUrl });
      const refreshed = await getMe(auth.accessToken).catch(() => user);
      setProfileAvatar(uploadedUrl);
      updateUser({
        ...refreshed,
        avatarUrl: profile.avatarUrl ?? uploadedUrl,
      });
      toast({ title: "Profile image updated", description: "Your photo will appear on tasks and team views.", variant: "success" });
    } catch (caught) {
      toast({ title: "Upload failed", description: caught instanceof Error ? caught.message : "Unable to upload profile image.", variant: "error" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim() ||
    user.email.slice(0, 2).toUpperCase();
  const avatarPreview = profileAvatar.trim() || user.avatarUrl || "";
  const workspaceMail = user.internalEmail ?? user.internalMailbox?.address ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* page header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Identity, workspace scope, API connections, and security.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={loading}
          aria-label="Refresh settings"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft transition hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
        </button>
      </header>

      {/* error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1 tb-scrollbar">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all whitespace-nowrap",
              selectedTab === id
                ? "bg-foreground text-white shadow-sm"
                : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {selectedTab === "profile" && (
        <div className="space-y-4 tb-reveal">

          {/* identity hero */}
          <div className="overflow-hidden rounded-2xl bg-[#0f1117] text-white shadow-[0_24px_60px_rgba(17,17,17,0.22)]">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              {/* avatar */}
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#ffd400] text-2xl font-extrabold text-[#111] shadow-[0_0_32px_rgba(255,212,0,0.22)]">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              {/* identity */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-white">{displayName}</h2>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                    {user.status}
                  </span>
                </div>
                <div className="grid gap-1 text-sm">
                  <p className="text-white/80">
                    <span className="font-bold text-white">Workspace mail:</span>{" "}
                    <span className="break-all">{workspaceMail ?? "Creating mailbox..."}</span>
                  </p>
                  <p className="text-white/45">
                    <span className="font-bold text-white/60">Login email:</span>{" "}
                    <span className="break-all">{user.email}</span>
                  </p>
                </div>

                {/* IDs row */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <CopyChip
                    label="Tenant"
                    value={user.tenantId}
                    copied={copiedKey === "tenant"}
                    onCopy={() => copyToClipboard(user.tenantId, "tenant")}
                    dark
                  />
                  <CopyChip
                    label="User ID"
                    value={user.id}
                    copied={copiedKey === "uid"}
                    onCopy={() => copyToClipboard(user.id, "uid")}
                    dark
                  />
                </div>
              </div>
            </div>

            {/* roles strip */}
            {user.roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-6 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Roles</span>
                  {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-lg border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary"
                  >
                    {role}
                  </span>
                ))}
                <span className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-white/55">
                  Effective: {roleLabel(user)}
                </span>
              </div>
            )}
          </div>

          <SettingsCard
            icon={Camera}
            title="Profile details"
            subtitle="Shown on task cards, comments, meetings, and team views"
          >
            <form onSubmit={onSaveProfile} className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                <div className="rounded-2xl border border-line bg-background p-4">
                  <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl bg-[#ffd400] text-2xl font-black text-foreground shadow-sm">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void onAvatarFileChange(event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-black text-foreground transition hover:bg-panel-muted disabled:opacity-60"
                  >
                    {avatarUploading ? <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
                    {avatarUploading ? "Uploading..." : "Upload image"}
                  </button>
                  <p className="mt-2 text-center text-[11px] font-semibold text-ink-soft">
                    Upload from your computer. No image link required.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput label="First name" name="firstName" defaultValue={user.firstName} />
                    <TextInput label="Last name" name="lastName" defaultValue={user.lastName} />
                  </div>
                  <input type="hidden" name="avatarUrl" value={profileAvatar} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectInput
                      label="Timezone"
                      name="timezone"
                      defaultValue={user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
                      options={TIMEZONE_OPTIONS.map((value) => ({ value, label: value }))}
                    />
                    <SelectInput
                      label="Locale"
                      name="locale"
                      defaultValue={user.locale ?? "en-US"}
                      options={LOCALE_OPTIONS}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="tb-yellow-button inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
              >
                {profileSaving ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                Save profile
              </button>
            </form>
          </SettingsCard>

          {/* permissions */}
          <SettingsCard
            icon={ShieldCheck}
            title="Permissions"
            subtitle={`${user.permissions.length} granted`}
          >
            {user.permissions.length > 0 ? (
              <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto tb-scrollbar">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="rounded-lg border border-line bg-background px-2.5 py-1 text-[11px] font-semibold text-ink-soft"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-ink-soft">No permissions returned.</p>
            )}
          </SettingsCard>

          {/* danger zone */}
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-panel shadow-sm">
            <div className="border-b border-red-100 px-5 py-3.5">
              <h3 className="text-sm font-bold text-red-700">Danger zone</h3>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Sign out of this session</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Clears all locally stored tokens and returns you to the login screen.
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE TAB */}
      {selectedTab === "workspace" && (
        <div className="space-y-4 tb-reveal">
          <AccountMetricStrip
            items={[
              { label: "Workspaces", value: accountOverview?.counts.workspaces ?? workspaces.length },
              { label: "Projects", value: accountOverview?.counts.projects ?? 0 },
              { label: "Teams", value: accountOverview?.counts.teams ?? teams.length },
              { label: "Open tasks", value: accountOverview?.counts.assignedOpenTasks ?? 0 },
            ]}
          />
          <SettingsCard
            icon={BriefcaseBusiness}
            title="Your workspaces"
            subtitle={`${workspaces.length} visible to your account`}
          >
            {loading ? (
              <SkeletonList count={3} />
            ) : workspaces.length ? (
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <WorkspaceRow key={ws.id} workspace={ws} />
                ))}
              </div>
            ) : (
              <EmptyRow label="No workspaces found." />
            )}
          </SettingsCard>

          {access.canViewPeopleDirectory ? (
            <SettingsCard
              icon={Settings}
              title="Teams"
              subtitle={`${teams.length} teams`}
            >
              {loading ? (
                <SkeletonList count={3} />
              ) : teams.length ? (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <TeamRow key={team.id} team={team} />
                  ))}
                </div>
              ) : (
                <EmptyRow label="No teams found." />
              )}
            </SettingsCard>
          ) : (
            <SettingsCard icon={Lock} title="Team directory" subtitle="Role-limited view">
              <p className="text-sm font-medium text-ink-soft">
                Your workspace list is visible here. Tenant-wide team and people directories remain restricted to users with people-directory access.
              </p>
            </SettingsCard>
          )}
        </div>
      )}

      {/* GUEST TAB */}
      {selectedTab === "guest" && (
        <div className="space-y-4 tb-reveal">
          <SettingsCard icon={Users} title="Guest workspaces" subtitle={`${guestWorkspaces.length} invited project spaces`}>
            <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              TaskBricks currently scopes one tenant per login. This view shows project spaces where your account was explicitly added as a member.
            </p>
            {loading ? (
              <SkeletonList count={3} />
            ) : guestWorkspaces.length ? (
              <div className="space-y-2">
                {guestWorkspaces.map((workspace) => (
                  <GuestWorkspaceRow key={workspace.id} workspace={workspace} />
                ))}
              </div>
            ) : (
              <EmptyRow label="No guest workspace invitations found." />
            )}
          </SettingsCard>
        </div>
      )}

      {/* SUPPORT TAB */}
      {selectedTab === "support" && (
        <div className="space-y-4 tb-reveal">
          <div className="grid gap-3 md:grid-cols-2">
            {(accountHelp?.categories ?? []).map((category) => (
              <SupportCategoryCard key={category.id} title={category.title} body={category.description} />
            ))}
            {!accountHelp?.categories.length ? (
              <SupportCategoryCard title="Support center" body="Create a request and tenant admins will be notified in-app." />
            ) : null}
          </div>

          <SettingsCard icon={HelpCircle} title="Create support request" subtitle="Recorded in audit trail and routed to tenant admins">
            <form onSubmit={onSupportRequest} className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectInput
                  label="Category"
                  name="category"
                  defaultValue="WORKSPACE"
                  options={[
                    { value: "ACCOUNT", label: "Account" },
                    { value: "WORKSPACE", label: "Workspace" },
                    { value: "BILLING", label: "Billing" },
                    { value: "SECURITY", label: "Security" },
                    { value: "TECHNICAL", label: "Technical" },
                    { value: "FEATURE", label: "Feature request" },
                  ]}
                />
                <SelectInput
                  label="Priority"
                  name="priority"
                  defaultValue="NORMAL"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "NORMAL", label: "Normal" },
                    { value: "HIGH", label: "High" },
                    { value: "URGENT", label: "Urgent" },
                  ]}
                />
              </div>
              <TextInput label="Subject" name="subject" />
              <label className="grid gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">Message</span>
                <textarea
                  className="min-h-32 rounded-lg border border-line bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  name="message"
                  placeholder="Describe the issue, expected behavior, and what you already tried."
                  required
                />
              </label>
              {supportMessage ? (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold",
                    supportMessage.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {supportMessage.text}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={supportSubmitting}
                className="tb-yellow-button inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
              >
                {supportSubmitting ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <HelpCircle className="size-4" aria-hidden="true" />}
                Send request
              </button>
            </form>
          </SettingsCard>
        </div>
      )}

      {/* CONNECTIONS TAB */}
      {selectedTab === "connections" && (
        <div className="space-y-4 tb-reveal">
          <SettingsCard icon={Globe} title="API endpoint" subtitle="TaskBricks REST API">
            <EndpointBlock
              label="Base URL"
              value={API_BASE_URL}
              copied={copiedKey === "api"}
              onCopy={() => copyToClipboard(API_BASE_URL, "api")}
            />
          </SettingsCard>

          <SettingsCard icon={Zap} title="Realtime endpoint" subtitle="WebSocket / Server-Sent Events">
            <EndpointBlock
              label="WS URL"
              value={WS_BASE_URL}
              copied={copiedKey === "ws"}
              onCopy={() => copyToClipboard(WS_BASE_URL, "ws")}
            />
          </SettingsCard>

          <SettingsCard icon={Activity} title="Developer access boundary" subtitle="No raw session secrets shown">
            <p className="text-sm font-medium text-ink-soft">
              API endpoints are visible only to users with tenant, security, or integration administration rights. Raw access and refresh tokens are intentionally hidden from the UI.
            </p>
          </SettingsCard>
        </div>
      )}

      {/* SECURITY TAB */}
      {selectedTab === "security" && (
        <div className="space-y-4 tb-reveal">
          <SettingsCard icon={KeyRound} title="Change password" subtitle="Credential lifecycle">
            <form onSubmit={onChangePassword} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <PasswordInput label="Current password" name="currentPassword" autoComplete="current-password" />
                <PasswordInput label="New password" name="newPassword" autoComplete="new-password" />
                <PasswordInput label="Confirm password" name="confirmPassword" autoComplete="new-password" />
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-line bg-background px-4 py-3 text-sm font-semibold text-ink-soft">
                <input
                  name="revokeOtherSessions"
                  type="checkbox"
                  defaultChecked
                  className="mt-1 size-4 rounded border-line accent-[#ffd400]"
                />
                <span>
                  Revoke other active sessions after password change.
                  <span className="mt-0.5 block text-[11px] font-medium text-ink-soft">
                    Keeps this browser signed in while forcing older devices to authenticate again.
                  </span>
                </span>
              </label>
              {securityMessage ? (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold",
                    securityMessage.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {securityMessage.text}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={changingPassword}
                className="tb-yellow-button inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
              >
                {changingPassword ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
                Change password
              </button>
            </form>
          </SettingsCard>

          <SettingsCard icon={ShieldCheck} title="Multi-factor authentication" subtitle="Authenticator app and backup codes">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-line bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {identityOverview?.mfa.enabled ? "MFA is enabled" : "MFA is not enabled"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-ink-soft">
                      Remaining backup codes: {identityOverview?.mfa.backupCodes.remaining ?? 0}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-black uppercase",
                      identityOverview?.mfa.enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {identityOverview?.mfa.enabled ? "Protected" : "Action needed"}
                  </span>
                </div>

                {!identityOverview?.mfa.enabled ? (
                  <button type="button" onClick={onStartTotp} className="tb-yellow-button mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black">
                    <QrCode className="size-4" aria-hidden="true" />
                    Set up authenticator
                  </button>
                ) : (
                  <form onSubmit={onDisableMfa} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <PasswordInput label="Current password" name="currentPassword" autoComplete="current-password" />
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">MFA code</span>
                      <input className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="code" placeholder="123456" />
                    </label>
                    <button type="submit" className="h-10 self-end rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700">
                      Disable
                    </button>
                  </form>
                )}
              </div>

              {totpSetup ? (
                <form onSubmit={onEnableTotp} className="rounded-xl border border-line bg-background p-4">
                  <p className="text-sm font-black text-foreground">Scan or enter this secret</p>
                  <div className="mt-3 rounded-lg border border-line bg-panel p-3">
                    <p className="break-all font-mono text-xs font-bold text-foreground">{totpSetup.secret}</p>
                  </div>
                  <a href={totpSetup.otpauthUrl} className="mt-2 block truncate text-xs font-bold text-ink-soft underline">
                    {totpSetup.otpauthUrl}
                  </a>
                  <label className="mt-3 grid gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">Authenticator code</span>
                    <input name="code" className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="123456" required />
                  </label>
                  <button type="submit" className="tb-yellow-button mt-3 h-10 w-full rounded-lg text-sm font-black">
                    Enable MFA
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-line bg-background p-4">
                  <p className="text-sm font-black text-foreground">Backup code vault</p>
                  {backupCodes.length ? (
                    <div className="mt-3 grid gap-1">
                      {backupCodes.map((code) => (
                        <code key={code} className="rounded-lg bg-panel px-2 py-1 text-xs font-black text-foreground">{code}</code>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={onRegenerateBackupCodes} className="mt-3 grid gap-2">
                      <input name="code" className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="MFA code" />
                      <button type="submit" disabled={!identityOverview?.mfa.enabled} className="h-10 rounded-lg border border-line bg-panel text-sm font-black disabled:opacity-50">
                        Regenerate backup codes
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </SettingsCard>

          <SettingsCard icon={Laptop} title="Trusted devices and login history" subtitle="Device-aware account security">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-ink-soft">Trusted devices</p>
                <div className="grid gap-2">
                  {(identityOverview?.trustedDevices ?? []).map((device) => (
                    <div key={device.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-foreground">{device.name ?? "Trusted browser"}</p>
                        <p className="truncate text-[11px] text-ink-soft">{device.ipAddress ?? "unknown IP"} / expires {shortDate(device.expiresAt)}</p>
                      </div>
                      {device.status === "ACTIVE" ? (
                        <button type="button" onClick={() => void onRevokeTrustedDevice(device.id)} className="rounded-lg border border-line bg-panel px-2 py-1 text-xs font-black">
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {identityOverview?.trustedDevices.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-background p-4 text-sm font-semibold text-ink-soft">No trusted devices yet.</p> : null}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-ink-soft">Recent login activity</p>
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 tb-scrollbar">
                  {(identityOverview?.loginHistory ?? []).map((item) => (
                    <div key={item.id} className="rounded-xl border border-line bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-foreground">{item.method}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", item.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-soft">{shortDate(item.createdAt)} / {item.ipAddress ?? "unknown IP"}{item.suspicious ? " / suspicious" : ""}</p>
                    </div>
                  ))}
                  {identityOverview?.loginHistory.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-background p-4 text-sm font-semibold text-ink-soft">No login history yet.</p> : null}
                </div>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Lock}
            title="Active security controls"
            subtitle="Enterprise-grade protection layers"
          >
            <div className="space-y-2">
              {[
                { label: "JWT session tokens",    desc: "Signed HS256 / RS256 access + refresh pair", icon: KeyRound },
                { label: "Tenant isolation",       desc: "All queries are scoped to the authenticated tenant", icon: ShieldCheck },
                { label: "RBAC permissions",       desc: "Role-based access control on every API route", icon: Shield },
                { label: "Audit-ready API",        desc: "All mutations are logged with actor + timestamp", icon: BadgeCheck },
                { label: "Rate limiting",          desc: "Per-tenant throttling on all endpoints", icon: Zap },
                { label: "Secure token refresh",   desc: "Silent refresh flow with rotation support", icon: RefreshCw },
              ].map(({ label, desc, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 rounded-xl border border-line bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Icon className="size-3.5 text-emerald-600" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-ink-soft">{desc}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Shield}
            title="2026 compliance posture"
            subtitle="Platform security standards"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "SOC 2 ready",       color: "#10b981" },
                { label: "GDPR compliant",    color: "#10b981" },
                { label: "CCPA aligned",      color: "#10b981" },
                { label: "ISO 27001 track",   color: "#f59e0b" },
                { label: "PCI-DSS level 3",   color: "#f59e0b" },
                { label: "HIPAA review",      color: "#94a3b8" },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-line bg-background px-3.5 py-2.5"
                >
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-soft">
              Green = active - Amber = in progress - Grey = planned
            </p>
          </SettingsCard>
        </div>
      )}
    </div>
  );
}

// Sub-components

function AccountMetricStrip({ items }: { items: Array<{ label: string; value: number | string }> }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-line bg-panel p-2 shadow-sm sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "rounded-xl bg-background px-4 py-3",
            index > 0 && "sm:border-l sm:border-line",
          )}
        >
          <p className="text-xl font-black text-foreground">{item.value}</p>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-ink-soft">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function SupportCategoryCard({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
        <HelpCircle className="size-4 text-primary-dark" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-black text-foreground">{title}</h3>
      <p className="mt-1 text-sm font-medium leading-6 text-ink-soft">{body}</p>
    </div>
  );
}

function TextInput({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">{label}</span>
      <input
        className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        defaultValue={defaultValue ?? ""}
        name={name}
      />
    </label>
  );
}

function SelectInput({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  const hasDefault = options.some((option) => option.value === defaultValue);
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">{label}</span>
      <select
        className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        defaultValue={hasDefault ? defaultValue ?? "" : ""}
        name={name}
      >
        {!hasDefault && defaultValue ? <option value={defaultValue}>{defaultValue}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function PasswordInput({
  autoComplete,
  label,
  name,
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-widest text-ink-soft">{label}</span>
      <input
        autoComplete={autoComplete}
        className="h-10 rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        minLength={12}
        name={name}
        type="password"
        required
      />
    </label>
  );
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function shortDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function SettingsCard({
  children,
  icon: Icon,
  subtitle,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
          <Icon className="size-3.5 text-primary-dark" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-[11px] text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CopyChip({
  copied,
  dark,
  label,
  onCopy,
  value,
}: {
  copied: boolean;
  dark?: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
        dark
          ? "border border-white/10 bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
          : "border border-line bg-background text-ink-soft hover:bg-panel-muted",
      )}
    >
      <span className={cn(dark ? "text-white/25" : "text-ink-soft/60")}>{label}:</span>
      <span className={cn("font-mono", dark ? "text-white/60" : "text-foreground")}>
        {value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value}
      </span>
      {copied ? (
        <CheckCircle2 className="size-3 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
    </button>
  );
}

function EndpointBlock({
  copied,
  label,
  onCopy,
  truncate,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  truncate?: boolean;
  value: string;
}) {
  const display = truncate && value.length > 64 ? `${value.slice(0, 32)}...${value.slice(-12)}` : value;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <CheckCircle2 className="size-3 text-emerald-600" aria-hidden="true" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="overflow-x-auto px-3 py-2.5 font-mono text-[12px] text-foreground tb-scrollbar">
        {display}
      </p>
    </div>
  );
}

function WorkspaceRow({ workspace }: { workspace: AccountWorkspace }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-background px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-extrabold text-primary-dark">
        {workspace.name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{workspace.name}</p>
        <p className="truncate text-[11px] text-ink-soft">
          {workspace.slug} - {workspace._count?.projects ?? 0} projects - {workspace._count?.teams ?? 0} teams
        </p>
        {workspace.description ? <p className="truncate text-[11px] text-ink-soft">{workspace.description}</p> : null}
      </div>
      <span className="shrink-0 rounded-lg border border-line bg-panel px-2 py-0.5 text-[10px] font-bold text-ink-soft">
        {workspace.canManage ? "Manage" : "View"}
      </span>
    </div>
  );
}

function GuestWorkspaceRow({ workspace }: { workspace: GuestWorkspace }) {
  return (
    <div className="rounded-xl border border-line bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-extrabold text-emerald-700">
          {workspace.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{workspace.name}</p>
          <p className="truncate text-[11px] text-ink-soft">
            {workspace.projectCount} project{workspace.projectCount === 1 ? "" : "s"} - {workspace.role ?? "member"}
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-line bg-panel px-2 py-0.5 text-[10px] font-bold text-ink-soft">
          Guest
        </span>
      </div>
      {workspace.projects.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {workspace.projects.slice(0, 5).map((project) => (
            <span key={project.id} className="rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-bold text-ink-soft">
              {project.key} - {project.status}
            </span>
          ))}
          {workspace.projects.length > 5 ? (
            <span className="rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-bold text-ink-soft">
              +{workspace.projects.length - 5} more
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TeamRow({ team }: { team: Team }) {
  const memberCount = team._count?.members ?? 0;
  const projectCount = team._count?.projects ?? 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-background px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0f1117] text-[11px] font-extrabold text-white">
        {team.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{team.name}</p>
        <p className="text-[11px] text-ink-soft">
          {memberCount} member{memberCount !== 1 ? "s" : ""} - {projectCount} project{projectCount !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-lg border border-line bg-panel px-2 py-0.5 text-[10px] font-bold text-ink-soft">
        {team.workspace?.name ?? "Global"}
      </span>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-panel-muted" />
      ))}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line py-6 text-center">
      <p className="text-sm italic text-ink-soft">{label}</p>
    </div>
  );
}
