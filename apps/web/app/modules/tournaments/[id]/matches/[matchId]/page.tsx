"use client";

import { use } from "react";
import { useState } from "react";

import { useMatch, useUpdateMatch } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";
import { Breadcrumbs } from "@/_components/breadcrumbs";
import { Button } from "@/_components/button";
import { PageWrapper } from "@/_components/page-wrapper";
import { toast } from "@/_components/toast";
import { usePredictions } from "@/_hooks/use-predictions";

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "error"> = {
  scheduled: "default",
  live: "warning",
  completed: "success",
  cancelled: "error",
};

function maxWins(format: string) {
  if (format === "bo5") return 3;
  if (format === "bo3") return 2;

  return 1;
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { matchId, id: tournamentId } = use(params);
  const { data: match, isPending, isError } = useMatch(matchId);
  const updateMatch = useUpdateMatch();
  const { predictions, setPrediction, removePrediction } = usePredictions();
  const prediction = predictions[matchId];
  const { t } = useTranslation("tournaments");

  if (isPending) {
    return (
      <PageWrapper title={t("match_title")} subtitle={t("match_loading")}>
        <div className="space-y-4">
          <Skeleton height="200px" rounded="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (isError || !match) {
    return (
      <PageWrapper title={t("match_title")} subtitle={t("match_error")}>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {t("match_failed_to_load")}
        </div>
      </PageWrapper>
    );
  }

  const m = match as unknown as Record<string, unknown> & {
    tournament?: { name?: string };
    scheduledAt?: string | number | Date;
  };
  const format = (m.format as string) ?? "bo1";
  const needed = maxWins(format);
  const blueScore = (m.scoreBlue ?? m.score_blue ?? 0) as number;
  const redScore = (m.scoreRed ?? m.score_red ?? 0) as number;
  const status = (m.status as string) ?? "scheduled";
  const isComplete = status === "completed";
  const blueTeam = (m.blueTeam ?? m.blue_team) as Record<string, unknown> | undefined;
  const redTeam = (m.redTeam ?? m.red_team) as Record<string, unknown> | undefined;
  const blueName = (blueTeam?.name as string) ?? t("match_blue_team");
  const redName = (redTeam?.name as string) ?? t("match_red_team");
  const blueColors = blueTeam?.colors as { primary: string; secondary: string } | undefined;
  const redColors = redTeam?.colors as { primary: string; secondary: string } | undefined;

  function recordWin(side: "blue" | "red") {
    const newBlue = side === "blue" ? blueScore + 1 : blueScore;
    const newRed = side === "red" ? redScore + 1 : redScore;
    const decided = newBlue >= needed || newRed >= needed;
    updateMatch.mutate(
      {
        id: matchId,
        scoreBlue: newBlue,
        scoreRed: newRed,
        status: decided ? "completed" : "live",
      },
      {
        onSuccess: () => toast("success", t("match_toast_score_updated")),
        onError: () => toast("error", t("match_toast_score_failed")),
      },
    );
  }

  function setStatus(s: string) {
    updateMatch.mutate(
      { id: matchId, status: s },
      {
        onSuccess: () => toast("success", t("match_toast_status", { status: s })),
        onError: () => toast("error", t("match_toast_status_failed")),
      },
    );
  }

  return (
    <PageWrapper
      title={`${blueName} vs ${redName}`}
      subtitle={`${format.toUpperCase()} · ${m.round_name ?? m.roundName ?? ""}`}
      actions={<Badge variant={statusVariant[status] ?? "default"}>{status}</Badge>}
    >
      <Breadcrumbs
        items={[
          { label: t("title"), href: "/modules/tournaments" },
          {
            label: m.tournament?.name ?? t("match_breadcrumb_tournament"),
            href: `/modules/tournaments/${tournamentId}`,
          },
          { label: `${blueName} vs ${redName}` },
        ]}
      />
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6">
          <TeamSide
            name={blueName}
            colors={blueColors}
            score={blueScore}
            isWinner={isComplete && blueScore > redScore}
          />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold tabular-nums">
              {blueScore} <span className="text-text-muted">:</span> {redScore}
            </span>
            <span className="text-xs text-text-muted">{format.toUpperCase()}</span>
          </div>
          <TeamSide
            name={redName}
            colors={redColors}
            score={redScore}
            isWinner={isComplete && redScore > blueScore}
          />
        </div>

        {!isComplete && (
          <div className="space-y-3">
            <p className="text-center text-xs text-text-muted">{t("match_record_winner")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => recordWin("blue")}
                disabled={updateMatch.isPending}
                className="!border-indigo-500/30 hover:!bg-indigo-500/10"
              >
                {t("match_wins_game", { name: blueName })}
              </Button>
              <Button
                variant="secondary"
                onClick={() => recordWin("red")}
                disabled={updateMatch.isPending}
                className="!border-red-500/30 hover:!bg-red-500/10"
              >
                {t("match_wins_game", { name: redName })}
              </Button>
            </div>
          </div>
        )}

        {status === "scheduled" && (
          <div className="flex justify-center">
            <Button size="sm" variant="secondary" onClick={() => setStatus("live")}>
              {t("match_start")}
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm text-emerald-400">
            {t("match_complete", {
              winner: blueScore > redScore ? blueName : redName,
              score: `${Math.max(blueScore, redScore)}-${Math.min(blueScore, redScore)}`,
            })}
          </div>
        )}

        {m.scheduledAt && (
          <div className="text-center text-xs text-text-muted">
            {t("match_scheduled")} {new Date(m.scheduledAt).toLocaleString()}
          </div>
        )}

        <PredictionPanel
          matchId={matchId}
          blueName={blueName}
          redName={redName}
          blueColors={blueColors}
          redColors={redColors}
          format={format}
          prediction={prediction}
          isComplete={isComplete}
          blueScore={blueScore}
          redScore={redScore}
          onPredict={(winner, score) => setPrediction(matchId, winner, score)}
          onRemove={() => removePrediction(matchId)}
        />
      </div>
    </PageWrapper>
  );
}

function TeamSide({
  name,
  colors,
  score: _score,
  isWinner,
}: {
  name: string;
  colors?: { primary: string; secondary: string };
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className={`flex-1 text-center ${isWinner ? "" : "opacity-70"}`}>
      <div
        className="mx-auto mb-2 h-14 w-14 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${colors?.primary ?? "#6366f1"}, ${colors?.secondary ?? "#8b5cf6"})`,
        }}
      />
      <p className={`text-sm font-semibold ${isWinner ? "text-white" : ""}`}>{name}</p>
    </div>
  );
}

function scoreOptions(format: string) {
  if (format === "bo5") return ["3-0", "3-1", "3-2"];
  if (format === "bo3") return ["2-0", "2-1"];

  return ["1-0"];
}

function PredictionPanel({
  matchId: _matchId,
  blueName,
  redName,
  blueColors,
  redColors,
  format,
  prediction,
  isComplete,
  blueScore,
  redScore,
  onPredict,
  onRemove,
}: {
  matchId: string;
  blueName: string;
  redName: string;
  blueColors?: { primary: string; secondary: string };
  redColors?: { primary: string; secondary: string };
  format: string;
  prediction?: { winner: "blue" | "red"; score: string };
  isComplete: boolean;
  blueScore: number;
  redScore: number;
  onPredict: (winner: "blue" | "red", score: string) => void;
  onRemove: () => void;
}) {
  const [pickWinner, setPickWinner] = useState<"blue" | "red" | null>(null);
  const scores = scoreOptions(format);
  const { t } = useTranslation("tournaments");

  // Check if prediction was correct
  const predictionResult =
    isComplete && prediction
      ? (() => {
          const actualWinner = blueScore > redScore ? "blue" : "red";
          const actualScore = `${Math.max(blueScore, redScore)}-${Math.min(blueScore, redScore)}`;
          const winnerCorrect = prediction.winner === actualWinner;
          const scoreCorrect = prediction.score === actualScore;

          return { winnerCorrect, scoreCorrect, exact: winnerCorrect && scoreCorrect };
        })()
      : null;

  if (prediction) {
    const predName = prediction.winner === "blue" ? blueName : redName;

    return (
      <div
        className={`rounded-lg border p-4 space-y-2 ${
          predictionResult
            ? predictionResult.exact
              ? "border-emerald-500/30 bg-emerald-500/5"
              : predictionResult.winnerCorrect
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-red-500/30 bg-red-500/5"
            : "border-indigo-500/30 bg-indigo-500/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{t("match_your_prediction")}</span>
          {!isComplete && (
            <Button size="sm" variant="ghost" onClick={onRemove}>
              {t("match_change")}
            </Button>
          )}
        </div>
        <p className="text-sm font-semibold">
          {predName} wins {prediction.score}
        </p>
        {predictionResult && (
          <Badge
            variant={
              predictionResult.exact
                ? "success"
                : predictionResult.winnerCorrect
                  ? "warning"
                  : "error"
            }
          >
            {predictionResult.exact
              ? t("match_prediction_exact")
              : predictionResult.winnerCorrect
                ? t("match_prediction_winner")
                : t("match_prediction_wrong")}
          </Badge>
        )}
      </div>
    );
  }

  if (isComplete) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 space-y-3">
      <span className="block text-xs font-medium text-text-muted">
        {t("match_make_prediction")}
      </span>
      {!pickWinner ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPickWinner("blue")}
            className="rounded-lg border border-border-subtle p-3 text-center transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <div
              className="mx-auto mb-2 h-8 w-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${blueColors?.primary ?? "#6366f1"}, ${blueColors?.secondary ?? "#8b5cf6"})`,
              }}
            />
            <span className="text-xs font-medium">{blueName}</span>
          </button>
          <button
            onClick={() => setPickWinner("red")}
            className="rounded-lg border border-border-subtle p-3 text-center transition-colors hover:border-red-500/40 hover:bg-red-500/5"
          >
            <div
              className="mx-auto mb-2 h-8 w-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${redColors?.primary ?? "#6366f1"}, ${redColors?.secondary ?? "#8b5cf6"})`,
              }}
            />
            <span className="text-xs font-medium">{redName}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            {t("match_pick_score", { team: pickWinner === "blue" ? blueName : redName })}
          </p>
          <div className="flex gap-2">
            {scores.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="secondary"
                onClick={() => {
                  onPredict(pickWinner, s);
                  setPickWinner(null);
                }}
              >
                {s}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setPickWinner(null)}>
              {t("back", { ns: "common" })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
