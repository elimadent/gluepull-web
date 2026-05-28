import { useCallback, useMemo, useState } from 'react';
import { BuyButton } from '@/components/BuyButton';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SynergyStack } from '@/components/SynergyStack';
import { TripPlanner } from '@/components/TripPlanner';
import { getAnsonProduct } from '@/data/products';
import { aggregateGluePicks } from '@/logic/recommendation';
import {
  fetchMultiDayForecast,
  getLocationFromIP,
} from '@/services/weather';
import { DailyForecast, Glue, LocationInfo } from '@/types';

type Horizon = 'week' | 'month';
const DAYS: Record<Horizon, number> = { week: 7, month: 16 };

function PlanRow({ glue, days }: { glue: Glue; days: number }) {
  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  return (
    <div className="plan-row">
      <div className="body">
        <p className="name">{displayName}</p>
        <p className="sub">
          Best on {days} {days === 1 ? 'day' : 'days'} · {glue.gunTemp} gun ·{' '}
          {glue.strength} strength
        </p>
      </div>
      {matched ? (
        <BuyButton url={product.productUrl} label="Buy" compact />
      ) : (
        <span className="not-linked">Not listed</span>
      )}
    </div>
  );
}

export function PlanScreen() {
  const [horizon, setHorizon] = useState<Horizon>('week');
  const [days, setDays] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When set, the plan was built for a user-picked trip location instead of
   *  auto-IP. Persists across horizon toggles. */
  const [tripLocation, setTripLocation] = useState<LocationInfo | null>(null);

  const load = useCallback(
    async (h: Horizon, locationOverride?: LocationInfo) => {
      setLoading(true);
      setError(null);
      try {
        const location = locationOverride ?? (await getLocationFromIP());
        const data = await fetchMultiDayForecast(location, DAYS[h]);
        setDays(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load forecast.');
        setDays([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onTripPick = useCallback(
    async (location: LocationInfo) => {
      setTripLocation(location);
      await load(horizon, location);
    },
    [horizon, load]
  );

  const clearTrip = useCallback(async () => {
    setTripLocation(null);
    await load(horizon);
  }, [horizon, load]);

  const picks = useMemo(() => aggregateGluePicks(days), [days]);

  const horizonLabel =
    horizon === 'week' ? 'next 7 days' : `next ${days.length || 16} days`;
  const locationLabel = tripLocation?.label ?? null;

  return (
    <Screen
      title="Job Planner"
      subtitle={
        locationLabel
          ? `Trip plan for ${locationLabel}.`
          : 'Pre-buy every glue and tool for the whole job.'
      }
      onRefresh={() => load(horizon, tripLocation ?? undefined)}
      refreshing={loading}
    >
      <div className="toggle-row">
        {(['week', 'month'] as Horizon[]).map((h) => (
          <button
            key={h}
            type="button"
            className={`toggle${horizon === h ? ' active' : ''}`}
            onClick={() => {
              setHorizon(h);
              void load(h, tripLocation ?? undefined);
            }}
          >
            {h === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <TripPlanner
        onPick={onTripPick}
        activeLabel={locationLabel}
        disabled={loading}
      />
      {tripLocation ? (
        <div className="trip-clear-row">
          <button
            type="button"
            className="ghost-btn"
            onClick={clearTrip}
            disabled={loading}
          >
            <span aria-hidden>↺</span>
            <span>Back to my local plan</span>
          </button>
        </div>
      ) : null}

      {!days.length && !loading && !error ? (
        <div className="welcome" style={{ marginTop: 16 }}>
          <div className="welcome-icon" aria-hidden>
            📅
          </div>
          <h2 className="welcome-title">Plan a week or a month</h2>
          <p className="welcome-copy">
            Tap a range above and we'll pull the multi-day forecast for your
            location, then list every glue + tool you should stock for the job.
          </p>
          <div className="welcome-actions">
            <button
              type="button"
              className="cta primary"
              onClick={() => load(horizon, tripLocation ?? undefined)}
            >
              <span aria-hidden>📍</span>
              <span>Build {horizon === 'week' ? '7-day' : 'monthly'} plan</span>
            </button>
          </div>
        </div>
      ) : null}

      {loading && !days.length ? (
        <div className="center-stack">
          <div className="spinner" />
          <span>Building your {horizon} plan…</span>
        </div>
      ) : null}

      {error && !days.length ? (
        <div className="error-card">
          <div className="icon" aria-hidden>
            🌧
          </div>
          <div>{error}</div>
          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={() => load(horizon, tripLocation ?? undefined)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {picks.length ? (
        <Section
          title="Buy these glues"
          subtitle={`Each row is a glue that wins the most days in your ${horizonLabel} forecast — pre-buy by how often you'll use it.`}
        >
          {picks.map(({ glue, days: d }) => (
            <PlanRow key={glue.id} glue={glue} days={d} />
          ))}
        </Section>
      ) : null}

      {picks.length ? (
        <Section
          title="The Synergy Stack"
          subtitle="The right gun, tabs, tools, prep and heat to pull the glues above. Tap a category to swipe through Anson products and see exactly why each one pairs with your stick selection."
        >
          <SynergyStack />
          <a
            className="shop-all"
            href="https://ansonpdr.com/collections/all"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden>🏪</span>
            <span>Shop the full collection</span>
          </a>
        </Section>
      ) : null}
    </Screen>
  );
}
