"use client";

import { useState } from "react";

import { useTournaments, useCreateTournament, useDeleteTournament } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import type { Tournament } from "@lsu/types";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { DataTable } from "@/_components/data-table";
import { EmptyState } from "@/_components/empty-state";
import { Input, Select, Textarea } from "@/_components/input";
import { Modal } from "@/_components/modal";
import { PageWrapper } from "@/_components/page-wrapper";
import { toast } from "@/_components/toast";

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "error"> = {
  draft: "default",
  registration: "info",
  active: "success",
  completed: "default",
  cancelled: "error",
};

export default function TournamentsPage() {
  const { data: tournaments, isPending, isError } = useTournaments();
  const createTournament = useCreateTournament();
  const deleteTournament = useDeleteTournament();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "ladder", format: "bo3", description: "" });
  const { t } = useTranslation("tournaments");

  function handleCreate() {
    createTournament.mutate(
      {
        name: form.name,
        type: form.type,
        format: form.format,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ name: "", type: "ladder", format: "bo3", description: "" });
          toast("success", t("toast_created"));
        },
        onError: () => toast("error", t("toast_create_failed")),
      },
    );
  }

  return (
    <PageWrapper
      title={t("title")}
      subtitle={t("subtitle")}
      actions={<Button onClick={() => setShowCreate(true)}>{t("create_tournament")}</Button>}
    >
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="56px" rounded="lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {t("failed_to_load")}
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                header: t("col_tournament"),
                render: (row: Tournament) => <span className="font-medium">{row.name}</span>,
              },
              {
                key: "type",
                header: t("col_type"),
                render: (row: Tournament) => (
                  <span className="text-text-muted capitalize">{row.type?.replace("_", " ")}</span>
                ),
                className: "w-32",
              },
              {
                key: "format",
                header: t("col_format"),
                render: (row: Tournament) => (
                  <Badge variant="info">{row.format?.toUpperCase()}</Badge>
                ),
                className: "w-24",
              },
              {
                key: "status",
                header: t("col_status"),
                render: (row: Tournament) => (
                  <Badge variant={statusVariant[row.status] ?? "default"}>{row.status}</Badge>
                ),
                className: "w-28",
              },
              {
                key: "teams",
                header: t("col_teams"),
                render: (row: Tournament) => (
                  <span className="text-text-muted">{row.registeredTeams?.length ?? 0}</span>
                ),
                className: "w-20",
              },
              {
                key: "actions",
                header: "",
                render: (row: Tournament) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t("confirm_delete", { ns: "common", name: row.name }))) {
                        deleteTournament.mutate(row.id, {
                          onSuccess: () => toast("success", t("toast_deleted")),
                          onError: () => toast("error", t("toast_delete_failed")),
                        });
                      }
                    }}
                  >
                    {t("delete", { ns: "common" })}
                  </Button>
                ),
                className: "w-20 text-right",
              },
            ]}
            data={tournaments ?? []}
            keyExtractor={(row: Tournament) => row.id}
            emptyMessage=""
          />
          {(tournaments ?? []).length === 0 && (
            <EmptyState
              message={t("empty_state")}
              actionLabel={t("empty_action")}
              actionHref="/modules/tournaments/new"
            />
          )}
        </>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t("modal_title")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              {t("cancel", { ns: "common" })}
            </Button>
            <Button onClick={handleCreate} disabled={!form.name || createTournament.isPending}>
              {createTournament.isPending
                ? t("creating", { ns: "common" })
                : t("create", { ns: "common" })}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("label_name")}
            id="t-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("placeholder_name")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t("label_type")}
              id="t-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: "ladder", label: t("type_ladder") },
                { value: "swiss", label: t("type_swiss") },
                { value: "round_robin", label: t("type_round_robin") },
                { value: "groups", label: t("type_groups") },
              ]}
            />
            <Select
              label={t("label_format")}
              id="t-format"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              options={[
                { value: "bo1", label: t("format_bo1") },
                { value: "bo3", label: t("format_bo3") },
                { value: "bo5", label: t("format_bo5") },
              ]}
            />
          </div>
          <Textarea
            label={t("label_description")}
            id="t-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t("placeholder_description")}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
