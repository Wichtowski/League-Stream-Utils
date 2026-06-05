"use client";

import { useState } from "react";

import { useCommentators, useCreateCommentator, useDeleteCommentator } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import type { Commentator } from "@lsu/types";
import { Skeleton } from "@lsu/ui/skeleton";

import { Button } from "@/_components/button";
import { DataTable } from "@/_components/data-table";
import { Input } from "@/_components/input";
import { Modal } from "@/_components/modal";
import { PageWrapper } from "@/_components/page-wrapper";
import { toast } from "@/_components/toast";

export default function CommentatorsPage() {
  const { data, isPending, isError } = useCommentators();
  const create = useCreateCommentator();
  const remove = useDeleteCommentator();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [twitter, setTwitter] = useState("");
  const { t } = useTranslation("commentators");

  function handleCreate() {
    const socialLinks: Record<string, string> = {};
    if (twitter) socialLinks.twitter = twitter;
    create.mutate(
      { name, socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName("");
          setTwitter("");
          toast("success", t("toast_added"));
        },
        onError: () => toast("error", t("toast_add_failed")),
      },
    );
  }

  return (
    <PageWrapper
      title={t("title")}
      subtitle={t("subtitle")}
      actions={<Button onClick={() => setShowCreate(true)}>{t("add_commentator")}</Button>}
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
              key: "name",
              header: t("col_name"),
              render: (c: Commentator) => <span className="font-medium">{c.name}</span>,
            },
            {
              key: "social",
              header: t("col_social"),
              render: (c: Commentator) => {
                const links = c.socialLinks as Record<string, string> | null;
                if (!links || Object.keys(links).length === 0) {
                  return <span className="text-text-muted">—</span>;
                }

                return (
                  <span className="text-text-muted text-xs">
                    {Object.entries(links)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "",
              render: (c: Commentator) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("confirm_delete", { ns: "common", name: c.name }))) {
                      remove.mutate(c.id, {
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
          data={data ?? []}
          keyExtractor={(c: Commentator) => c.id}
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
            <Button onClick={handleCreate} disabled={!name || create.isPending}>
              {create.isPending ? t("adding", { ns: "common" }) : t("add", { ns: "common" })}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t("label_name")}
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("placeholder_name")}
          />
          <Input
            label={t("label_twitter")}
            id="c-twitter"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder={t("placeholder_twitter")}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
