"use client";

import { useState } from "react";

import {
  useDraftSessions,
  useCreateDraftSession,
  useDeleteDraftSession,
} from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import type { DraftSession } from "@lsu/types";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { DataTable } from "@/_components/data-table";
import { Modal } from "@/_components/modal";
import { PageWrapper } from "@/_components/page-wrapper";

const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
  waiting: "default",
  active: "success",
  paused: "warning",
  completed: "info",
};

export default function DraftPage() {
  const { data: sessions, isPending, isError } = useDraftSessions();
  const createSession = useCreateDraftSession();
  const deleteSession = useDeleteDraftSession();
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation("draft");

  function handleQuickCreate() {
    createSession.mutate(
      {
        config: {
          seriesType: "bo3",
          currentGame: 1,
          totalGames: 3,
          isFearlessDraft: false,
          patchName: "latest",
          timers: { pickPhase: 30, banPhase: 30 },
        },
        teams: {
          blue: { name: t("blue_side") },
          red: { name: t("red_side") },
        },
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  return (
    <PageWrapper
      title={t("title")}
      subtitle={t("subtitle")}
      actions={<Button onClick={() => setShowCreate(true)}>{t("new_session")}</Button>}
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
        <DataTable
          columns={[
            {
              key: "teams",
              header: t("col_match"),
              render: (s: DraftSession) => (
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">{s.teams?.blue?.name ?? t("blue")}</span>
                  <span className="text-text-muted">{t("vs", { ns: "common" })}</span>
                  <span className="text-red-400">{s.teams?.red?.name ?? t("red")}</span>
                </div>
              ),
            },
            {
              key: "phase",
              header: t("col_phase"),
              render: (s: DraftSession) => (
                <span className="text-text-muted capitalize">{s.currentPhase}</span>
              ),
              className: "w-28",
            },
            {
              key: "turn",
              header: t("col_turn"),
              render: (s: DraftSession) => (
                <span className="text-text-muted">{s.turnNumber}/22</span>
              ),
              className: "w-20",
            },
            {
              key: "status",
              header: t("col_status"),
              render: (s: DraftSession) => (
                <Badge variant={statusVariant[s.status] ?? "default"}>{s.status}</Badge>
              ),
              className: "w-28",
            },
            {
              key: "actions",
              header: "",
              render: (s: DraftSession) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("delete_session"))) deleteSession.mutate(s.id);
                  }}
                >
                  {t("delete", { ns: "common" })}
                </Button>
              ),
              className: "w-20 text-right",
            },
          ]}
          data={sessions ?? []}
          keyExtractor={(s: DraftSession) => s.id}
          emptyMessage={t("empty_state")}
        />
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
            <Button onClick={handleQuickCreate} disabled={createSession.isPending}>
              {createSession.isPending ? t("creating", { ns: "common" }) : t("quick_create")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">{t("quick_create_description")}</p>
      </Modal>
    </PageWrapper>
  );
}
