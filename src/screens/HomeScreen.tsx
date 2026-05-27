import { useMemo, useState } from 'react';
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

const isInsecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  if (protocol === 'https:') return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  return true;
};

interface HomeProps {
  onGoManual: () => void;
}

export function HomeScreen({ onGoManual }: HomeProps) {
  const {
    forecast,
    loading,
    error,
    attemptedAutoLocation,
    refreshFromLocation,
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
      onRefresh={forecast ? refreshFromLocation : undefined}
      refreshing={loading}
    >
      {!forecast && !loading ? (
        <div className="welcome">
          <div className="welcome-icon" aria-hidden>
            🌡️
          </div>
          <h2 className="welcome-title">Get today's glue picks</h2>
          <p className="welcome-copy">
            Match the right Anson PDR hot glue to today's weather. Use your
            location for the live forecast, or punch in conditions by hand.
          </p>

          <div className="welcome-actions">
            <button
              type="button"
              className="cta primary"
              onClick={refreshFromLocation}
            >
              <span aria-hidden>📍</span>
              <span>Use my location</span>
            </button>
            <button type="button" className="cta secondary" onClick={onGoManual}>
              <span aria-hidden>✏️</span>
              <span>Enter conditions manually</span>
            </button>
          </div>

          {isInsecureContext() ? (
            <p className="welcome-hint">
              Heads up: your browser may block location requests over plain HTTP.
              Manual Entry always works.
            </p>
          ) : null}

          {error && attemptedAutoLocation ? (
            <p className="welcome-hint warn">⚠ {error}</p>
          ) : null}
        </div>
      ) : null}

      {loading && !forecast ? (
        <div className="center-stack">
          <div className="spinner" />
          <span>Pulling local weather…</span>
        </div>
      ) : null}

      {current ? (
        <Section title="Current Conditions">
          <ConditionStats conditions={current} />
          {error ? <p className="inline-warn">{error}</p> : null}
        </Section>
      ) : null}

      {topNow.length ? (
        <Section
          title="Recommended Right Now"
          subtitle={
            topNow.length > 1
              ? 'Ranked best-first for current conditions.'
              : 'Best match for current conditions.'
          }
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
          {selected.ranked.map((s, i) => (
            <GlueCard key={s.glue.id} score={s} rank={i + 1} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
