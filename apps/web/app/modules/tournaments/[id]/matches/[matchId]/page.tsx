'use client';

import { use } from 'react';
import { useState } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { useMatch, useUpdateMatch } from '@lsu/tournament/hooks';
import { Skeleton } from '@lsu/ui/skeleton';
import { Breadcrumbs } from '@/_components/breadcrumbs';
import { toast } from '@/_components/toast';
import { usePredictions } from '@/_hooks/use-predictions';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  scheduled: 'default',
  live: 'warning',
  completed: 'success',
  cancelled: 'error',
};

function maxWins(format: string) {
  if (format === 'bo5') return 3;
  if (format === 'bo3') return 2;
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

  if (isPending) {
    return (
      <PageWrapper title="Match" subtitle="Loading…">
        <div className="space-y-4">
          <Skeleton height="200px" rounded="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (isError || !match) {
    return (
      <PageWrapper title="Match" subtitle="Error">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load match
        </div>
      </PageWrapper>
    );
  }

  const m = match as any;
  const format = m.format ?? 'bo1';
  const needed = maxWins(format);
  const blueScore = m.scoreBlue ?? m.score_blue ?? 0;
  const redScore = m.scoreRed ?? m.score_red ?? 0;
  const status = m.status ?? 'scheduled';
  const isComplete = status === 'completed';
  const blueName = m.blueTeam?.name ?? m.blue_team?.name ?? 'Blue Team';
  const redName = m.redTeam?.name ?? m.red_team?.name ?? 'Red Team';
  const blueColors = m.blueTeam?.colors ?? m.blue_team?.colors;
  const redColors = m.redTeam?.colors ?? m.red_team?.colors;

  function recordWin(side: 'blue' | 'red') {
    const newBlue = side === 'blue' ? blueScore + 1 : blueScore;
    const newRed = side === 'red' ? redScore + 1 : redScore;
    const decided = newBlue >= needed || newRed >= needed;
    updateMatch.mutate({
      id: matchId,
      scoreBlue: newBlue,
      scoreRed: newRed,
      status: decided ? 'completed' : 'live',
    }, {
      onSuccess: () => toast('success', 'Score updated'),
      onError: () => toast('error', 'Failed to update score'),
    });
  }

  function setStatus(s: string) {
    updateMatch.mutate({ id: matchId, status: s }, {
      onSuccess: () => toast('success', `Match ${s}`),
      onError: () => toast('error', 'Failed to update status'),
    });
  }

  return (
    <PageWrapper
      title={`${blueName} vs ${redName}`}
      subtitle={`${format.toUpperCase()} · ${m.round_name ?? m.roundName ?? ''}`}
      actions={
        <Badge variant={statusVariant[status] ?? 'default'}>{status}</Badge>
      }
    >
      <Breadcrumbs items={[
        { label: 'Tournaments', href: '/modules/tournaments' },
        { label: m.tournament?.name ?? 'Tournament', href: `/modules/tournaments/${tournamentId}` },
        { label: `${blueName} vs ${redName}` },
      ]} />
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
            <p className="text-center text-xs text-text-muted">Record game winner</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => recordWin('blue')}
                disabled={updateMatch.isPending}
                className="!border-indigo-500/30 hover:!bg-indigo-500/10"
              >
                {blueName} wins game
              </Button>
              <Button
                variant="secondary"
                onClick={() => recordWin('red')}
                disabled={updateMatch.isPending}
                className="!border-red-500/30 hover:!bg-red-500/10"
              >
                {redName} wins game
              </Button>
            </div>
          </div>
        )}

        {status === 'scheduled' && (
          <div className="flex justify-center">
            <Button size="sm" variant="secondary" onClick={() => setStatus('live')}>
              Start Match
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm text-emerald-400">
            Match complete — {blueScore > redScore ? blueName : redName} wins {Math.max(blueScore, redScore)}-{Math.min(blueScore, redScore)}
          </div>
        )}

        {m.scheduledAt && (
          <div className="text-center text-xs text-text-muted">
            Scheduled: {new Date(m.scheduledAt).toLocaleString()}
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
  score,
  isWinner,
}: {
  name: string;
  colors?: { primary: string; secondary: string };
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className={`flex-1 text-center ${isWinner ? '' : 'opacity-70'}`}>
      <div
        className="mx-auto mb-2 h-14 w-14 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${colors?.primary ?? '#6366f1'}, ${colors?.secondary ?? '#8b5cf6'})`,
        }}
      />
      <p className={`text-sm font-semibold ${isWinner ? 'text-white' : ''}`}>{name}</p>
    </div>
  );
}

function scoreOptions(format: string) {
  if (format === 'bo5') return ['3-0', '3-1', '3-2'];
  if (format === 'bo3') return ['2-0', '2-1'];
  return ['1-0'];
}

function PredictionPanel({
  matchId,
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
  prediction?: { winner: 'blue' | 'red'; score: string };
  isComplete: boolean;
  blueScore: number;
  redScore: number;
  onPredict: (winner: 'blue' | 'red', score: string) => void;
  onRemove: () => void;
}) {
  const [pickWinner, setPickWinner] = useState<'blue' | 'red' | null>(null);
  const scores = scoreOptions(format);

  // Check if prediction was correct
  const predictionResult = isComplete && prediction
    ? (() => {
        const actualWinner = blueScore > redScore ? 'blue' : 'red';
        const actualScore = `${Math.max(blueScore, redScore)}-${Math.min(blueScore, redScore)}`;
        const winnerCorrect = prediction.winner === actualWinner;
        const scoreCorrect = prediction.score === actualScore;
        return { winnerCorrect, scoreCorrect, exact: winnerCorrect && scoreCorrect };
      })()
    : null;

  if (prediction) {
    const predName = prediction.winner === 'blue' ? blueName : redName;
    return (
      <div
        className={`rounded-lg border p-4 space-y-2 ${
          predictionResult
            ? predictionResult.exact
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : predictionResult.winnerCorrect
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-red-500/30 bg-red-500/5'
            : 'border-indigo-500/30 bg-indigo-500/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">Your Prediction</span>
          {!isComplete && (
            <Button size="sm" variant="ghost" onClick={onRemove}>
              Change
            </Button>
          )}
        </div>
        <p className="text-sm font-semibold">
          {predName} wins {prediction.score}
        </p>
        {predictionResult && (
          <Badge variant={predictionResult.exact ? 'success' : predictionResult.winnerCorrect ? 'warning' : 'error'}>
            {predictionResult.exact ? 'Exact!' : predictionResult.winnerCorrect ? 'Winner correct' : 'Wrong'}
          </Badge>
        )}
      </div>
    );
  }

  if (isComplete) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 space-y-3">
      <span className="block text-xs font-medium text-text-muted">Make a prediction</span>
      {!pickWinner ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPickWinner('blue')}
            className="rounded-lg border border-border-subtle p-3 text-center transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5"
          >
            <div
              className="mx-auto mb-2 h-8 w-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${blueColors?.primary ?? '#6366f1'}, ${blueColors?.secondary ?? '#8b5cf6'})`,
              }}
            />
            <span className="text-xs font-medium">{blueName}</span>
          </button>
          <button
            onClick={() => setPickWinner('red')}
            className="rounded-lg border border-border-subtle p-3 text-center transition-colors hover:border-red-500/40 hover:bg-red-500/5"
          >
            <div
              className="mx-auto mb-2 h-8 w-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${redColors?.primary ?? '#6366f1'}, ${redColors?.secondary ?? '#8b5cf6'})`,
              }}
            />
            <span className="text-xs font-medium">{redName}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Pick score for {pickWinner === 'blue' ? blueName : redName}
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
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
