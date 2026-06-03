import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { ProductImageLightbox } from '@/components/ProductImageLightbox';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SynergyStack } from '@/components/SynergyStack';
import { useWeather } from '@/context/WeatherContext';
import { getAnsonProduct } from '@/data/products';
import { aggregateGluePicks } from '@/logic/recommendation';
import { fetchMultiDayForecast } from '@/services/weather';
import { gunTempCompact, panelTempRange } from '@/utils/gunTemp';
import { DailyForecast, Glue } from '@/types';

type Horizon = 'week' | 'month';
/* Open-Meteo's free forecast caps at 16 days; days 17–30 are projected by
 * cycling the 16-day pattern (see fetchMultiDayForecast). The user wants a
 * full 30-day stocking horizon for "This Month". */
const DAYS: Record<Horizon, number> = { week: 7, month: 30 };

/** Compact horizontal row: small thumbnail left, info + buy right.
 *  Image is bounded to ~80px so it doesn't dominate the card. */
function PlanRow({ glue, days, totalDays }: { glue: Glue; days: number; totalDays: number }) {
  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const imageUrl = matched ? product.imageUrl : null;
  const dayLabel = days === 1 ? 'day' : 'days';
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <article className="plan-card">
      {imageUrl ? (
        <button
          type="button"
          className="plan-card-thumb plan-card-thumb-btn"
          onClick={() => setZoomOpen(true)}
          aria-label={`Open large view of ${displayName}`}
        >
          <img src={imageUrl} alt="" loading="lazy" />
          <span className="plan-card-zoom" aria-hidden>⤢</span>
        </button>
      ) : (
        <div className="plan-card-thumb">
          <GlueStickPlaceholder color={glue.color} />
        </div>
      )}
      <div className="plan-card-body">
        <div className="plan-card-head">
          <h3 className="plan-card-name">{displayName}</h3>
          <span
            className="plan-card-badge"
            aria-label={`Top pick on ${days} of ${totalDays} ${dayLabel}`}
            title={`Wins ${days} of ${totalDays} forecasted days`}
          >
            <strong>{days}</strong>
            <span className="plan-card-badge-sub">{dayLabel}</span>
          </span>
        </div>
        <p className="plan-card-meta">
          {glue.strength} strength · Panel {panelTempRange(glue).range}
        </p>
        <p className="plan-card-meta">{gunTempCompact(glue.gunTemp)}</p>
        {matched ? (
          <AddToCartButton
            className="buy compact"
            label="Buy on Anson"
            product={{
              glueId: glue.id,
              name: displayName,
              imageUrl,
              description: product.description ?? undefined,
              productUrl: product.productUrl,
            }}
          />
        ) : (
          <span className="not-linked">Not listed</span>
        )}
      </div>
      {zoomOpen && imageUrl ? (
        <ProductImageLightbox
          src={imageUrl}
          alt={displayName}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}
    </article>
  );
}

/**
 * Job Planner, multi-day buy list keyed off the GLOBAL location set on Home.
 *
 * Plan no longer owns its own location state; whatever was picked on Home
 * (auto-detect / US state / search) drives the forecast load here. If the
 * user hasn't set a location yet we show a prompt instead of guessing.
 */
export function PlanScreen() {
  const { location } = useWeather();
  const [horizon, setHorizon] = useState<Horizon>('week');
  const [days, setDays] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (h: Horizon) => {
      if (!location) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMultiDayForecast(location, DAYS[h]);
        setDays(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load forecast.');
        setDays([]);
      } finally {
        setLoading(false);
      }
    },
    [location]
  );

  // Auto-rebuild whenever the global location changes (or first arrives).
  useEffect(() => {
    if (!location) {
      setDays([]);
      return;
    }
    void load(horizon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, horizon]);

  const picks = useMemo(() => aggregateGluePicks(days), [days]);
  const totalDays = days.length;
  const horizonLabel =
    horizon === 'week' ? 'next 7 days' : `next ${totalDays || 16} days`;
  const locationLabel = location?.label ?? null;
  const subtitle = locationLabel
    ? `Pre-buy the right glues and tools for the ${horizonLabel} of weather at ${locationLabel}. Switch the horizon below; everything rebuilds automatically.`
    : 'Pre-buy the right glues for the days ahead. Set a location on the Home tab and this page builds your shopping list automatically.';

  return (
    <Screen title="Job Planner" subtitle={subtitle}>
      <div className="toggle-row">
        {(['week', 'month'] as Horizon[]).map((h) => (
          <button
            key={h}
            type="button"
            className={`toggle${horizon === h ? ' active' : ''}`}
            onClick={() => setHorizon(h)}
          >
            {h === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {!location ? (
        <div className="welcome" style={{ marginTop: 16 }}>
          <div className="welcome-icon" aria-hidden>📍</div>
          <h2 className="welcome-title">Set your location on Home</h2>
          <p className="welcome-copy">
            Home is where you set your working location and conditions -
            everything else in the app (including this buy list) reads from
            there. Head to the Home tab and pick a state, search a city/zip,
            or auto-detect.
          </p>
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
          <div className="icon" aria-hidden>🌧</div>
          <div>{error}</div>
          <div className="actions">
            <button
              type="button"
              className="primary"
              onClick={() => void load(horizon)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {picks.length ? (
        <Section
          title="Buy these glues"
          subtitle={`Each card is a glue that wins the most days in your ${horizonLabel} forecast. Buy by how often you'll actually use it.`}
        >
          <div className="plan-grid">
            {picks.map(({ glue, days: d }) => (
              <PlanRow key={glue.id} glue={glue} days={d} totalDays={totalDays} />
            ))}
          </div>
        </Section>
      ) : null}

      {picks.length ? (
        <Section
          title="Dial In Your Pull"
          subtitle="You've found the glue that fits the conditions. Now match it with the right gun, tabs, tools, and prep to get cleaner, stronger, more repeatable pulls."
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
