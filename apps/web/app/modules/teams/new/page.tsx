"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useApiClient } from "@lsu/api-client/context";

import { Breadcrumbs } from "@/_components/breadcrumbs";
import { Button } from "@/_components/button";
import { Input } from "@/_components/input";
import { PageWrapper } from "@/_components/page-wrapper";
import { toast } from "@/_components/toast";

type Role = "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";

interface PlayerDraft {
  inGameName: string;
  tag: string;
  role: Role;
  isSub: boolean;
  firstName: string;
  lastName: string;
  country: string;
}

interface StaffDraft {
  name: string;
  role: string;
}

interface TeamForm {
  name: string;
  tag: string;
  country: string;
  colors: { primary: string; secondary: string; accent: string };
  players: PlayerDraft[];
  staff: StaffDraft[];
}

const INITIAL: TeamForm = {
  name: "",
  tag: "",
  country: "",
  colors: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#a78bfa" },
  players: [],
  staff: [],
};

const STEPS = ["Identity", "Colors", "Roster", "Staff", "Review"] as const;

const COLOR_PRESETS = [
  { label: "Indigo", primary: "#6366f1", secondary: "#8b5cf6", accent: "#a78bfa" },
  { label: "Red", primary: "#ef4444", secondary: "#f87171", accent: "#fca5a5" },
  { label: "Emerald", primary: "#10b981", secondary: "#34d399", accent: "#6ee7b7" },
  { label: "Amber", primary: "#f59e0b", secondary: "#fbbf24", accent: "#fcd34d" },
  { label: "Cyan", primary: "#06b6d4", secondary: "#22d3ee", accent: "#67e8f9" },
  { label: "Rose", primary: "#f43f5e", secondary: "#fb7185", accent: "#fda4af" },
];

export default function TeamWizardPage() {
  const router = useRouter();
  const api = useApiClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TeamForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const canNext =
    step === 0
      ? form.name.length >= 2 && form.tag.length >= 1
      : step === 1
        ? true
        : step === 2
          ? form.players.length >= 1
          : step === 3
            ? true
            : true;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const team = await api.teams.create({
        name: form.name,
        tag: form.tag,
        colors: form.colors,
        country: form.country || undefined,
      });

      for (const p of form.players) {
        await api.teams.addPlayer(team.id, {
          name: p.inGameName,
          role: p.role,
          country: p.country || undefined,
        });
      }

      toast("success", "Team created!");
      router.push("/modules/teams");
    } catch (e: unknown) {
      toast("error", e instanceof Error ? e.message : "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper
      title="Create Team"
      subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
    >
      <Breadcrumbs items={[{ label: "Teams", href: "/modules/teams" }, { label: "New Team" }]} />
      <div className="mb-6 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-indigo-500" : "bg-surface-raised"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        {step === 0 && <StepIdentity form={form} setForm={setForm} />}
        {step === 1 && <StepColors form={form} setForm={setForm} />}
        {step === 2 && <StepRoster form={form} setForm={setForm} />}
        {step === 3 && <StepStaff form={form} setForm={setForm} />}
        {step === 4 && <StepReview form={form} />}

        <div className="flex justify-between pt-4">
          <Button
            variant="secondary"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {step === 3 ? "Review" : "Next"}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Team"}
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function StepIdentity({ form, setForm }: { form: TeamForm; setForm: (f: TeamForm) => void }) {
  return (
    <div className="space-y-4">
      <Input
        label="Team Name"
        id="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Team Liquid"
      />
      <Input
        label="Tag / Abbreviation"
        id="tag"
        value={form.tag}
        onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })}
        placeholder="TL"
        maxLength={5}
      />
      <Input
        label="Country (optional)"
        id="country"
        value={form.country}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
        placeholder="South Korea"
      />
    </div>
  );
}

function StepColors({ form, setForm }: { form: TeamForm; setForm: (f: TeamForm) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Primary"
          id="primary"
          type="color"
          value={form.colors.primary}
          onChange={(e) =>
            setForm({ ...form, colors: { ...form.colors, primary: e.target.value } })
          }
        />
        <Input
          label="Secondary"
          id="secondary"
          type="color"
          value={form.colors.secondary}
          onChange={(e) =>
            setForm({ ...form, colors: { ...form.colors, secondary: e.target.value } })
          }
        />
        <Input
          label="Accent"
          id="accent"
          type="color"
          value={form.colors.accent}
          onChange={(e) => setForm({ ...form, colors: { ...form.colors, accent: e.target.value } })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">Presets</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() =>
                setForm({
                  ...form,
                  colors: { primary: p.primary, secondary: p.secondary, accent: p.accent },
                })
              }
              className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs transition-colors hover:border-indigo-500/40"
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <p className="mb-2 text-xs text-text-muted">Preview</p>
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${form.colors.primary}, ${form.colors.secondary})`,
            }}
          />
          <div>
            <span className="font-semibold">{form.name || "Team Name"}</span>
            <span className="ml-2 text-text-muted">[{form.tag || "TAG"}]</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRoster({ form, setForm }: { form: TeamForm; setForm: (f: TeamForm) => void }) {
  const [draft, setDraft] = useState<PlayerDraft>({
    inGameName: "",
    tag: "",
    role: "TOP",
    isSub: false,
    firstName: "",
    lastName: "",
    country: "",
  });

  function addPlayer() {
    if (!draft.inGameName || !draft.tag) return;
    setForm({ ...form, players: [...form.players, { ...draft }] });
    setDraft({
      inGameName: "",
      tag: "",
      role: "TOP",
      isSub: false,
      firstName: "",
      lastName: "",
      country: "",
    });
  }

  function removePlayer(i: number) {
    setForm({ ...form, players: form.players.filter((_, idx) => idx !== i) });
  }

  const ROLES: Role[] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];

  return (
    <div className="space-y-4">
      {form.players.length > 0 && (
        <div className="space-y-2">
          {form.players.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm"
            >
              <span className="w-16 text-xs text-text-muted">{p.role}</span>
              <span className="font-medium">{p.inGameName}</span>
              <span className="text-text-muted">#{p.tag}</span>
              {p.isSub && <span className="text-xs text-amber-400">Sub</span>}
              <button
                onClick={() => removePlayer(i)}
                className="ml-auto text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
        <p className="text-xs font-medium text-text-muted">Add Player</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="In-Game Name"
            id="ign"
            value={draft.inGameName}
            onChange={(e) => setDraft({ ...draft, inGameName: e.target.value })}
            placeholder="Faker"
          />
          <Input
            label="Tag"
            id="ptag"
            value={draft.tag}
            onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
            placeholder="KR1"
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1 flex-1">
            <label className="block text-xs font-medium text-text-muted">Role</label>
            <div className="flex gap-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setDraft({ ...draft, role: r })}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    draft.role === r
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                      : "bg-surface-raised text-text-muted border border-border-subtle hover:border-gray-600"
                  }`}
                >
                  {r === "BOTTOM" ? "BOT" : r === "JUNGLE" ? "JGL" : r === "SUPPORT" ? "SUP" : r}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-text-muted pb-1">
            <input
              type="checkbox"
              checked={draft.isSub}
              onChange={(e) => setDraft({ ...draft, isSub: e.target.checked })}
              className="rounded"
            />
            Sub
          </label>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={addPlayer}
          disabled={!draft.inGameName || !draft.tag}
        >
          Add Player
        </Button>
      </div>

      {form.players.length === 0 && (
        <p className="text-center text-xs text-text-muted">Add at least 1 player to continue</p>
      )}
    </div>
  );
}

function StepStaff({ form, setForm }: { form: TeamForm; setForm: (f: TeamForm) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Coach");

  function addStaff() {
    if (!name) return;
    setForm({ ...form, staff: [...form.staff, { name, role }] });
    setName("");
    setRole("Coach");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Add coaches, managers, or analysts. This step is optional.
      </p>

      {form.staff.length > 0 && (
        <div className="space-y-2">
          {form.staff.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-text-muted">— {s.role}</span>
              <button
                onClick={() =>
                  setForm({ ...form, staff: form.staff.filter((_, idx) => idx !== i) })
                }
                className="ml-auto text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Name"
            id="sname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kim"
          />
          <Input
            label="Role"
            id="srole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Coach"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={addStaff} disabled={!name}>
          Add Staff
        </Button>
      </div>
    </div>
  );
}

function StepReview({ form }: { form: TeamForm }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-12 w-12 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${form.colors.primary}, ${form.colors.secondary})`,
            }}
          />
          <div>
            <h3 className="font-semibold">{form.name}</h3>
            <span className="text-sm text-text-muted">[{form.tag}]</span>
            {form.country && <span className="ml-2 text-sm text-text-muted">{form.country}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Roster ({form.players.length})
          </h4>
          {form.players.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-16 text-xs text-text-muted">{p.role}</span>
              <span>{p.inGameName}</span>
              <span className="text-text-muted">#{p.tag}</span>
              {p.isSub && <span className="text-xs text-amber-400">Sub</span>}
            </div>
          ))}
        </div>

        {form.staff.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Staff ({form.staff.length})
            </h4>
            {form.staff.map((s, i) => (
              <div key={i} className="text-sm">
                <span>{s.name}</span>
                <span className="text-text-muted"> — {s.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
