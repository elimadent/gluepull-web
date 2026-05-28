import { useMemo } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
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
import { BlockRecommendation, DailyForecast } from '@/types';

function blocksWithViable(forecast: DailyForecast): BlockRecommendation[] {
  const out: BlockRecommendation[] = [];
  for (const block of TIME_BLOCKS) {
    const cond = conditionsForBlock(forecast, block);
    if (!cond) continue;
    const all = rankGlues(cond);
    const viable = all.filter((s) => s.score >= VIABLE_THRESHOLD);
    const ranked = viable.length ? viable : all.slice(0, 1);
    out.push({ block, conditions: cond, ranked });
  }
  return out;
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  ariaLabel: string;
}

/** Stepper: typeable number field with − and + buttons and a unit suffix. */
function Stepper({ value, min, max, step = 1, unit, onChange, ariaLabel }: StepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const handleType = (raw: string) => {
    if (raw === '' || raw === '-') return onChange(min);
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(clamp(Math.round(n)));
  };
  return (
    <div className="stepper" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clamp(value - step))}
        aria-label={`Decrease ${ariaLabel}`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        className="stepper-input"
        value={value}
        onChange={(e) => handleType(e.target.value)}
        aria-label={ariaLabel}
      />
      <span className="stepper-unit">{unit}</span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(clamp(value + step))}
        aria-label={`Increase ${ariaLabel}`}
      >
        +
      </button>
    </div>
  );
}

export function HomeScreen() {
  const {
    conditions,
    forecast,
    loading,
    error,
    locationLabel,
    setTemperature,
    setHumidity,
    detectLocation,
  } = useWeather();

  const topNow = useMemo(() => topRecommendations(conditions, 3), [conditions]);
  const blocks = useMemo(
    () => (forecast ? blocksWithViable(forecast) : []),
    [forecast]
  );
  const activeBlockId = getBlockForHour(new Date().getHours()).id;

  const subtitle = locationLabel
    ? `${locationLabel} · auto-detected (approximate)`
    : 'Set conditions below, or auto-detect from your location.';

  return (
    <Screen title="GluePull" subtitle={subtitle}>
      <Section
        title="Your conditions"
        subtitle="Drag, type, or auto-detect — recommendations update live."
      >
        <div className="conditions-card">
          <button
            type="button"
            className="detect-btn"
            onClick={detectLocation}
            disabled={loading}
          >
            <span aria-hidden>📍</span>
            <span>{loading ? 'Detecting…' : 'Auto-detect from my location'}</span>
          </button>
          {error ? <p className="inline-warn">{error}</p> : null}

          <div className="cond-field">
            <div className="cond-row">
              <span className="cond-label-text">
                <span aria-hidden>🌡️</span>
                <span>Temperature</span>
              </span>
              <span className="cond-value">
                {Math.round(conditions.temperatureF)}°F
              </span>
            </div>
            <input
              type="range"
              className="gp-slider"
              min={-10}
              max={140}
              step={1}
              value={Math.round(conditions.temperatureF)}
              onChange={(e) => setTemperature(Number(e.target.value))}
              aria-label="Temperature slider"
            />
            <div className="cond-stepper-row">
              <Stepper
                value={Math.round(conditions.temperatureF)}
                min={-10}
                max={140}
                step={1}
                unit="°F"
                onChange={setTemperature}
                ariaLabel="Temperature in Fahrenheit"
              />
            </div>
          </div>

          <div className="cond-field">
            <div className="cond-row">
              <span className="cond-label-text">
                <span aria-hidden>💧</span>
                <span>Humidity</span>
              </span>
              <span className="cond-value">
                {Math.round(conditions.humidity)}%
              </span>
            </div>
            <input
              type="range"
              className="gp-slider"
              min={0}
              max={100}
              step={1}
              value={Math.round(conditions.humidity)}
              onChange={(e) => setHumidity(Number(e.target.value))}
              aria-label="Humidity slider"
            />
            <div className="cond-stepper-row">
              <Stepper
                value={Math.round(conditions.humidity)}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setHumidity}
                ariaLabel="Relative humidity in percent"
              />
            </div>
          </div>
        </div>
      </Section>

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
            <GlueCard
              key={s.glue.id}
              glue={s.glue}
              rank={i + 1}
              match={{ reasons: s.reasons, warnings: s.warnings }}
            />
          ))}
        </Section>
      ) : null}

      {blocks.length ? (
        <Section
          title="Today by the hour"
          subtitle="From your auto-detected forecast — swipe each row to see more."
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
