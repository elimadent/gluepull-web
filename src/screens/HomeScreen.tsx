import { useMemo } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
import { ConditionStats } from '@/components/ConditionStats';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TimeBlockSection } from '@/components/TimeBlockSection';
import { useWeather } from '@/context/WeatherContext';
import { getBlockForHour, TIME_BLOCKS } from '@/data/timeBlocks';
import {
  conditionsForBlock,
  rankGlues,
  topRecommendations,
  VIABLE_THRESHOLD,
} from '@/logic/recommendation';
import { BlockRecommendation, DailyForecast, WeatherConditions } from '@/types';

function currentConditions(forecast: DailyForecast): WeatherConditions {
  const hour = new Date().getHours();
  const exact = forecast.hourly.find((h) => h.hour === hour);
  const snap = exact ?? forecast.hourly[0];
  return {
    temperatureF: snap.temperatureF,
    humidity: snap.humidity,
    pressureHpa: snap.pressureHpa,
  };
}

/**
 * Build a BlockRecommendation per time block that includes EVERY viable
 * glue for that block's conditions — not just the top 3 — so each block's
 * horizontal scroll row can reveal the full set of matches.
 */
function blocksWithViable(forecast: DailyForecast): BlockRecommendation[] {
  const out: BlockRecommendation[] = [];
  for (const block of TIME_BLOCKS) {
    const conditions = conditionsForBlock(forecast, block);
    if (!conditions) continue;
    const all = rankGlues(conditions);
    const viable = all.filter((s) => s.score >= VIABLE_THRESHOLD);
    // Always show at least the single best, even if nothing clears the bar
    const ranked = viable.length ? viable : all.slice(0, 1);
    out.push({ block, conditions, ranked });
  }
  return out;
}

interface HomeProps {
  onGoManual: () => void;
}

export function HomeScreen({ onGoManual }: HomeProps) {
  const {
    forecast,
    loading,
    error,
    attempted,
    canRefineWithGPS,
    refreshFromIP,
    refineWithGPS,
  } = useWeather();

  const blocks = useMemo(
    () => (forecast ? blocksWithViable(forecast) : []),
    [forecast]
  );
  const current = forecast ? currentConditions(forecast) : null;
  const topNow = current ? topRecommendations(current, 3) : [];
  const activeBlockId = getBlockForHour(new Date().getHours()).id;

  const subtitle = forecast
    ? `${forecast.location.label ?? 'Your location'} · ${
        forecast.source === 'manual' ? 'Manual conditions' : "Today's hourly forecast"
      }`
    : 'Pick the right hot glue for the conditions on your job.';

  return (
    <Screen
      title="GluePull"
      subtitle={subtitle}
      onRefresh={forecast ? refreshFromIP : undefined}
      refreshing={loading}
    >
      {loading && !forecast ? (
        <div className="center-stack">
          <div className="spinner" />
          <span>Pulling local weather…</span>
        </div>
      ) : null}

      {!forecast && !loading && attempted && error ? (
        <div className="welcome">
          <div className="welcome-icon" aria-hidden>
            🌧
          </div>
          <h2 className="welcome-title">Couldn't load your weather</h2>
          <p className="welcome-copy">{error}</p>
          <div className="welcome-actions">
            <button type="button" className="cta primary" onClick={refreshFromIP}>
              <span aria-hidden>↻</span>
              <span>Try again</span>
            </button>
            <button type="button" className="cta secondary" onClick={onGoManual}>
              <span aria-hidden>✏️</span>
              <span>Enter conditions manually</span>
            </button>
          </div>
        </div>
      ) : null}

      {current ? (
        <Section title="Current Conditions">
          <ConditionStats conditions={current} />
          {error ? <p className="inline-warn">{error}</p> : null}
          <div className="location-actions">
            {canRefineWithGPS ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={refineWithGPS}
                disabled={loading}
              >
                <span aria-hidden>📍</span>
                <span>Use precise location</span>
              </button>
            ) : null}
            <button type="button" className="ghost-btn" onClick={onGoManual}>
              <span aria-hidden>✏️</span>
              <span>Override manually</span>
            </button>
          </div>
        </Section>
      ) : null}

      {topNow.length ? (
        <Section
          title="Top 3 picks — compared"
          subtitle="Tap any card to jump down to its full breakdown."
        >
          <ComparisonGrid picks={topNow} />
        </Section>
      ) : null}

      {topNow.length ? (
        <Section
          title="Full breakdown"
          subtitle="Same picks, with the reasons, warnings, pros and cons."
        >
          {topNow.map((s, i) => (
            <GlueCard key={s.glue.id} score={s} rank={i + 1} />
          ))}
        </Section>
      ) : null}

      {blocks.length ? (
        <Section
          title="Today by the hour"
          subtitle="Every glue that works in each block — swipe each row to see more."
        >
          <div className="time-blocks">
            {blocks.map((rec) => (
              <TimeBlockSection
                key={rec.block.id}
                rec={rec}
                active={rec.block.id === activeBlockId}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </Screen>
  );
}
