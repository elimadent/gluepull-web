import { useEffect, useMemo, useState } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
import { GlueCard } from '@/components/GlueCard';
import { LocationPicker } from '@/components/LocationPicker';
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

/** Stepper: typeable number field with − and + buttons and a unit suffix.
 *
 *  While focused the input keeps a local draft string the user can backspace
 *  to empty / overtype freely, we DON'T snap to `min` on empty as that fights
 *  the user. We only commit valid finite numbers to `onChange`; on blur, if
 *  the draft is empty or unparseable, we restore the underlying value. Focus
 *  selects-all so tap-then-type replaces the value cleanly. */
function Stepper({ value, min, max, step = 1, unit, onChange, ariaLabel }: StepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));

  // Pick up external changes (slider drag, +/-, auto-detect) when not editing.
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const handleChange = (raw: string) => {
    setDraft(raw);
    // Leave underlying value alone while the draft is empty / mid-edit ("-",
    // "1.", etc.). Only commit when we get a finite number.
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(clamp(Math.round(n)));
  };

  const handleBlur = () => {
    setFocused(false);
    if (draft === '' || draft === '-' || draft === '.' || draft === '-.' ||
        !Number.isFinite(Number(draft))) {
      setDraft(String(value));
    } else {
      // Make the visible text reflect the clamped/rounded committed value.
      setDraft(String(clamp(Math.round(Number(draft)))));
    }
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
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          // Select-all so a tap-then-type replaces the existing number.
          e.currentTarget.select();
        }}
        onBlur={handleBlur}
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
    location,
    setTemperature,
    setHumidity,
  } = useWeather();

  const topNow = useMemo(() => topRecommendations(conditions, 3), [conditions]);
  const blocks = useMemo(
    () => (forecast ? blocksWithViable(forecast) : []),
    [forecast]
  );
  const activeBlockId = getBlockForHour(new Date().getHours()).id;

  const subtitle = location
    ? `${location.label ?? 'Selected location'} · settings here drive every tab.`
    : 'Set your location and conditions, they drive every tab.';

  return (
    <Screen title="Glue IQ" subtitle={subtitle}>
      <Section
        title="Location"
        subtitle="Set where you'll actually be pulling dents. Glue IQ pulls live temperature and humidity for this spot, ranks the glues that match today's conditions, recommends the gun, tabs, and pull tool that go with them, and builds a 30-day buy list on the Plan tab. Change it any time and every screen rebuilds."
      >
        <LocationPicker />
      </Section>

      <Section
        title="Conditions"
        subtitle="Drag, type, or get the live readings from your picked location."
      >
        <div className="conditions-card">
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
          title="Top 3 picks, compared"
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
          subtitle="From your auto-detected forecast, swipe each row to see more."
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
