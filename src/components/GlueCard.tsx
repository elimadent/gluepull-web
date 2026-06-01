import { useState } from 'react';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { PairedRig } from '@/components/PairedRig';
import { ProductImageLightbox } from '@/components/ProductImageLightbox';
import { RankBadge } from '@/components/RankBadge';
import { getAnsonProduct } from '@/data/products';
import { colors } from '@/theme/theme';
import { gunTempLabel } from '@/utils/gunTemp';
import { linkTarget } from '@/utils/link';
import { Glue } from '@/types';

/**
 * Chart-style glue card. Every glue has the same labeled sections in the same
 * order so a tech can scan and compare across cards predictably:
 *
 *   1. Header, rank · photo · name · tagline · (toggle product details)
 *   2. SPECS, strength / gun / pull method / temp / humidity (static)
 *   3. MATCH, current-condition reasons + warnings (dynamic per pick)
 *   4. WHERE IT SHINES, best panel / humidity / damage type
 *   5. PROS / CONS
 *   6. Buy CTA
 */

/** Best-panel-conditions narrative derived from the dataset's range + tier.
 *  Plain text, no icons (the section header already does the labelling). */
function bestPanelConditions(g: Glue): {
  climate: string;
  humidity: string;
  damage: string;
} {
  const tMid = (g.optimalTemp.min + g.optimalTemp.max) / 2;
  let climate: string;
  if (tMid >= 95) climate = 'Sun-baked summer panels';
  else if (tMid >= 80) climate = 'Warm panels & outdoor shade in summer';
  else if (tMid >= 70) climate = 'Indoor shop / mild outdoor, daily-driver';
  else if (tMid >= 60) climate = 'Cool mornings & shoulder seasons';
  else climate = 'Cold panels, winter mornings, refrigerated shops';

  let humidity: string;
  if (g.optimalHumidity.max <= 40) humidity = 'Dry air, desert / arid climates';
  else if (g.optimalHumidity.min >= 55)
    humidity = 'Humid air, Gulf coast, summer monsoons';
  else humidity = 'Average humidity';

  let damage: string;
  if (g.strength === 'Super High')
    damage = 'Lateral tension / collision, big high-tension dents';
  else if (g.strength === 'High')
    damage = 'Slide-hammer pulls on medium-to-large dents';
  else damage = 'Small dings, finish passes, clean release on factory paint';

  return { climate, humidity, damage };
}

function methodLabel(m: Glue['pullMethod']): string {
  return m === 'both' ? 'Slide-hammer + mini-lifter' : m === 'slide-hammer' ? 'Slide-hammer' : 'Mini-lifter';
}

interface GlueCardProps {
  glue: Glue;
  /** When set, shows a #1/#2/#3 medal badge. */
  rank?: number;
  /** Optional per-current-conditions reasons & warnings. Omit on the Library
   *  screen, the catalog should be static (no live scoring against weather). */
  match?: { reasons: string[]; warnings: string[] };
  /** Optional small text pill shown in the header (e.g. "Featured",
   *  "#1 best seller") when the live catalog feed is driving the order. */
  badge?: string;
}

export function GlueCard({ glue, rank, match, badge }: GlueCardProps) {
  const [descOpen, setDescOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const reasons = match?.reasons ?? [];
  const warnings = match?.warnings ?? [];

  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const description = matched ? product.description : null;
  const productUrl = matched ? product.productUrl : null;
  const imageUrl = matched ? product.imageUrl : null;
  const canToggleDesc = matched && !!description;

  const tempRange = glue.publishedTempRange ?? glue.optimalTemp;
  const tempNote = glue.publishedTempRange ? '(maker-published)' : '';
  const { climate, humidity, damage } = bestPanelConditions(glue);

  return (
    <article
      id={`gp-glue-${glue.id}`}
      className={`glue-card${rank === 1 ? ' top' : ''}`}
    >
      {/* Header */}
      <button
        type="button"
        className="glue-head"
        onClick={() => canToggleDesc && setDescOpen((o) => !o)}
        disabled={!canToggleDesc}
        aria-expanded={canToggleDesc ? descOpen : undefined}
      >
        {rank ? <RankBadge rank={rank} /> : null}
        {imageUrl ? (
          <span
            className="product-thumb-wrap"
            role="button"
            tabIndex={0}
            aria-label={`Open large view of ${displayName}`}
            onClick={(e) => {
              // Don't also toggle the description card, opening the image
              // is its own action.
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setLightboxOpen(true);
              }
            }}
          >
            <img
              src={imageUrl}
              alt={`${displayName} product photo`}
              className="product-thumb"
              loading="lazy"
            />
            <span className="product-thumb-zoom" aria-hidden>⤢</span>
          </span>
        ) : (
          <GlueStickPlaceholder color={glue.color} className="product-thumb placeholder-svg" />
        )}
        <div className="glue-head-text">
          {badge ? <span className="glue-flag">{badge}</span> : null}
          <h3 className="glue-name">{displayName}</h3>
          {matched ? (
            <>
              <p className="glue-bestfor">{glue.bestFor}</p>
              {canToggleDesc ? (
                <span className="expand-hint">
                  {descOpen ? '▲ Hide details' : '▼ Product details'}
                </span>
              ) : null}
            </>
          ) : (
            <p className="not-linked">⚠ Not yet listed on ansonpdr.com</p>
          )}
        </div>
      </button>

      {canToggleDesc && descOpen ? (
        <div className="product-desc">{description}</div>
      ) : null}

      {/* Section 1: Specs */}
      <section className="glue-section">
        <h4 className="glue-section-head">Specs</h4>
        <dl className="spec-grid">
          <dt>Strength</dt>
          <dd>{glue.strength}</dd>
          <dt>Gun Setting</dt>
          <dd>{gunTempLabel(glue.gunTemp)}</dd>
          <dt>Pull Method</dt>
          <dd>{methodLabel(glue.pullMethod)}</dd>
          <dt>Panel Temp</dt>
          <dd>
            {tempRange.min}–{tempRange.max}°F
            {tempNote ? <span className="spec-note"> {tempNote}</span> : null}
          </dd>
          <dt>Humidity</dt>
          <dd>{glue.optimalHumidity.min}–{glue.optimalHumidity.max}%</dd>
        </dl>
      </section>

      {/* Section 2: Match notes (dynamic), only shown when match data passed */}
      {match && (reasons.length || warnings.length) ? (
        <section className="glue-section">
          <h4 className="glue-section-head">Match Notes</h4>
          <ul className="match-list">
            {reasons.map((r, i) => (
              <li key={`r${i}`}>
                <span className="bullet-icon good" style={{ color: colors.good }} aria-hidden>✓</span>
                <span>{r}</span>
              </li>
            ))}
            {warnings.map((w, i) => (
              <li key={`w${i}`}>
                <span className="bullet-icon warn" style={{ color: colors.warn }} aria-hidden>⚠</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Section 3: Where it shines */}
      <section className="glue-section">
        <h4 className="glue-section-head">Where It Shines</h4>
        <dl className="spec-grid">
          <dt>Climate</dt>
          <dd>{climate}</dd>
          <dt>Humidity</dt>
          <dd>{humidity}</dd>
          <dt>Best For</dt>
          <dd>{damage}</dd>
        </dl>
      </section>

      {/* Section 3a: Paired rig, gun + puller + tab + release agent */}
      <PairedRig glue={glue} />

      {/* Section 4: Pros / Cons */}
      <section className="glue-section">
        <h4 className="glue-section-head">Pros &amp; Cons</h4>
        <div className="pros-cons">
          <div>
            <h5 className="pc-head good">PROS</h5>
            <ul className="pc-list">
              {glue.pros.map((p, i) => (
                <li key={`p${i}`}>
                  <span className="bullet-icon" style={{ color: colors.good }} aria-hidden>+</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="pc-head bad">CONS</h5>
            <ul className="pc-list">
              {glue.cons.map((c, i) => (
                <li key={`c${i}`}>
                  <span className="bullet-icon" style={{ color: colors.bad }} aria-hidden>−</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5: Buy */}
      {productUrl ? (
        <a
          className="buy"
          href={productUrl}
          target={linkTarget(productUrl)}
          rel="noopener noreferrer"
          aria-label={`Buy ${displayName} on ansonpdr.com`}
        >
          <span aria-hidden>🛒</span>
          <span>Buy on Anson PDR</span>
        </a>
      ) : (
        <div className="buy disabled" aria-disabled="true">
          Product not yet linked
        </div>
      )}

      {lightboxOpen && imageUrl ? (
        <ProductImageLightbox
          src={imageUrl}
          alt={`${displayName} product photo`}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </article>
  );
}
