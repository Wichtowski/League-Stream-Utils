"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useApiClient } from "@lsu/api-client/context";
import { useTeams } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";

import { Badge } from "@/_components/badge";
import { Breadcrumbs } from "@/_components/breadcrumbs";
import { Button } from "@/_components/button";
import { Input, Textarea } from "@/_components/input";
import { PageWrapper } from "@/_components/page-wrapper";
import { toast } from "@/_components/toast";

interface TournamentForm {
  name: string;
  description: string;
  type: "ladder" | "swiss" | "round_robin" | "groups";
  format: "bo1" | "bo3" | "bo5";
  startDate: string;
  endDate: string;
  teamIds: string[];
}

const INITIAL: TournamentForm = {
  name: "",
  description: "",
  type: "ladder",
  format: "bo3",
  startDate: "",
  endDate: "",
  teamIds: [],
};

const STEP_KEYS = [
  "wizard_step_info",
  "wizard_step_format",
  "wizard_step_teams",
  "wizard_step_review",
] as const;

const TYPE_KEYS = ["ladder", "swiss", "round_robin", "groups"] as const;

export default function TournamentWizardPage() {
  const router = useRouter();
  const api = useApiClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TournamentForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation("tournaments");

  const canNext =
    step === 0
      ? form.name.length >= 2
      : step === 1
        ? true
        : step === 2
          ? form.teamIds.length >= 2
          : true;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const tournament = await api.tournaments.create({
        name: form.name,
        type: form.type,
        format: form.format,
        description: form.description || undefined,
      });

      for (const teamId of form.teamIds) {
        await api.tournaments.addTeam(tournament.id, teamId);
      }

      toast("success", t("wizard_toast_created"));
      router.push("/modules/tournaments");
    } catch (e: unknown) {
      toast("error", e instanceof Error ? e.message : t("wizard_toast_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper
      title={t("wizard_title")}
      subtitle={t("wizard_step_label", {
        current: step + 1,
        total: STEP_KEYS.length,
        step: t(STEP_KEYS[step]),
      })}
    >
      <Breadcrumbs
        items={[
          { label: t("title"), href: "/modules/tournaments" },
          { label: t("wizard_breadcrumb") },
        ]}
      />
      <div className="mb-6 flex gap-1">
        {STEP_KEYS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-violet-500" : "bg-surface-raised"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        {step === 0 && <StepInfo form={form} setForm={setForm} />}
        {step === 1 && <StepFormat form={form} setForm={setForm} />}
        {step === 2 && <StepTeams form={form} setForm={setForm} />}
        {step === 3 && <StepReview form={form} />}

        <div className="flex justify-between pt-4">
          <Button
            variant="secondary"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            {step === 0 ? t("cancel", { ns: "common" }) : t("back", { ns: "common" })}
          </Button>

          {step < STEP_KEYS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t("next", { ns: "common" })}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t("creating", { ns: "common" }) : t("create_tournament")}
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function StepInfo({
  form,
  setForm,
}: {
  form: TournamentForm;
  setForm: (f: TournamentForm) => void;
}) {
  const { t } = useTranslation("tournaments");

  return (
    <div className="space-y-4">
      <Input
        label={t("wizard_label_name")}
        id="tname"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder={t("placeholder_name")}
      />
      <Textarea
        label={t("wizard_label_description")}
        id="tdesc"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder={t("wizard_placeholder_description")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("wizard_label_start_date")}
          id="tstart"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <Input
          label={t("wizard_label_end_date")}
          id="tend"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
      </div>
    </div>
  );
}

function StepFormat({
  form,
  setForm,
}: {
  form: TournamentForm;
  setForm: (f: TournamentForm) => void;
}) {
  const { t } = useTranslation("tournaments");

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">{t("wizard_section_type")}</p>
        <div className="grid grid-cols-2 gap-3">
          {TYPE_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setForm({ ...form, type: key as TournamentForm["type"] })}
              className={`rounded-lg border p-4 text-left transition-all ${
                form.type === key
                  ? "border-violet-500/60 bg-violet-500/10"
                  : "border-border-subtle bg-surface-raised hover:border-gray-600"
              }`}
            >
              <span className="block text-sm font-medium">{t(`type_${key}`)}</span>
              <span className="mt-1 block text-xs text-text-muted">{t(`type_${key}_desc`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">{t("wizard_section_format")}</p>
        <div className="flex gap-3">
          {(["bo1", "bo3", "bo5"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setForm({ ...form, format: f })}
              className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                form.format === f
                  ? "border-violet-500/60 bg-violet-500/10"
                  : "border-border-subtle bg-surface-raised hover:border-gray-600"
              }`}
            >
              <span className="block text-sm font-semibold">{f.toUpperCase()}</span>
              <span className="block text-xs text-text-muted">{t(`format_${f}_desc`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTeams({
  form,
  setForm,
}: {
  form: TournamentForm;
  setForm: (f: TournamentForm) => void;
}) {
  const { data: teams, isPending } = useTeams();
  const { t } = useTranslation("tournaments");

  function toggleTeam(id: string) {
    setForm({
      ...form,
      teamIds: form.teamIds.includes(id)
        ? form.teamIds.filter((t) => t !== id)
        : [...form.teamIds, id],
    });
  }

  if (isPending) {
    return <p className="text-sm text-text-muted">{t("wizard_loading_teams")}</p>;
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-8 text-center">
        <p className="text-sm text-text-muted mb-3">{t("wizard_no_teams")}</p>
        <Button size="sm" onClick={() => window.open("/modules/teams/new", "_blank")}>
          {t("wizard_create_team")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">{t("wizard_select_teams_hint")}</p>
      {(teams ?? []).map((t) => {
        const selected = form.teamIds.includes(t.id);
        const seedIndex = form.teamIds.indexOf(t.id);

        return (
          <button
            key={t.id}
            onClick={() => toggleTeam(t.id)}
            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
              selected
                ? "border-violet-500/60 bg-violet-500/10"
                : "border-border-subtle bg-surface-raised hover:border-gray-600"
            }`}
          >
            <div
              className="h-8 w-8 rounded-md flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${t.colors?.primary ?? "#6366f1"}, ${t.colors?.secondary ?? "#8b5cf6"})`,
              }}
            />
            <div className="flex-1">
              <span className="font-medium">{t.name}</span>
              <span className="ml-2 text-text-muted">[{t.tag}]</span>
            </div>
            {selected && <Badge variant="info">Seed #{seedIndex + 1}</Badge>}
          </button>
        );
      })}

      {form.teamIds.length < 2 && (
        <p className="text-center text-xs text-text-muted">{t("wizard_select_teams_empty")}</p>
      )}
    </div>
  );
}

function StepReview({ form }: { form: TournamentForm }) {
  const { data: teams } = useTeams();
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const { t } = useTranslation("tournaments");

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{form.name}</h3>
        {form.description && <p className="mt-1 text-sm text-text-muted">{form.description}</p>}
      </div>

      <div className="flex gap-3">
        <Badge variant="info">{t(`type_${form.type}`)}</Badge>
        <Badge variant="info">{form.format.toUpperCase()}</Badge>
        {form.startDate && (
          <span className="text-xs text-text-muted">
            {form.startDate}
            {form.endDate ? ` — ${form.endDate}` : ""}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
          {t("wizard_teams_count", { count: form.teamIds.length })}
        </h4>
        <div className="space-y-1">
          {form.teamIds.map((id, i) => {
            const team = teamMap.get(id);

            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-xs text-text-muted">#{i + 1}</span>
                {team ? (
                  <>
                    <div
                      className="h-5 w-5 rounded"
                      style={{
                        background: `linear-gradient(135deg, ${team.colors?.primary ?? "#6366f1"}, ${team.colors?.secondary ?? "#8b5cf6"})`,
                      }}
                    />
                    <span>{team.name}</span>
                    <span className="text-text-muted">[{team.tag}]</span>
                  </>
                ) : (
                  <span className="text-text-muted">{id}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
