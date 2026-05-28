import { useMemo, useState } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
import { ConditionStats } from '@/components/ConditionStats';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TimelineRow } from '@/components/TimelineRow';
import { useWeather } from '@/context/WeatherContext';
import { getBlockForHour } from '@/data/timeBlocks';
import { recommendForBlocks, topRecommendations } from '@/logic/recommendation';
import { DailyForecast, WeatherConditions } from '@/types';

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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const blocks = useMemo(
    () => (forecast ? recommendForBlocks(forecast) : []),
    [forecast]
  );
  const current = forecast ? currentConditions(forecast) : null;
  const topNow = current ? topRecommendations(current, 3) : [];
  const activeBlockId = getBlockForHour(new Date().getHours()).id;
  const selected = blocks.find((b) => b.block.id === selectedBlockId);

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
          subtitle="Tap a card below for full pros, cons, and product details."
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
          title="Today's Timeline"
          subtitle="Best glue for each block. Tap a block for ranked picks."
        >
          {blocks.map((rec) => (
            <TimelineRow
              key={rec.block.id}
              recommendation={rec}
              active={rec.block.id === activeBlockId}
              onPress={() =>
                setSelectedBlockId((prev) =>
                  prev === rec.block.id ? null : rec.block.id
                )
              }
            />
          ))}
        </Section>
      ) : null}

      {selected ? (
        <Section
          title={`${selected.block.label} Picks`}
          subtitle={`${Math.round(selected.conditions.temperatureF)}°F · ${Math.round(
            selected.conditions.humidity
          )}% RH`}
        >
          <ComparisonGrid picks={selected.ranked} />
        </Section>
      ) : null}
    </Screen>
  );
}
