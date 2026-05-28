import { useState } from 'react';
import { Chip } from '@/components/Chip';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { RankBadge } from '@/components/RankBadge';
import { getAnsonProduct } from '@/data/products';
import { colors } from '@/theme/theme';
import { linkTarget } from '@/utils/link';
import { Glue, GlueScore } from '@/types';

/**
 * Translate the dataset's optimalTemp/optimalHumidity/strength into the
 * shop-friendly "what panel conditions is this best for" lines that show
 * inline on every glue card.
 */
function bestPanelConditions(g: Glue): string[] {
  const lines: string[] = [];
  const tMid = (g.optimalTemp.min + g.optimalTemp.max) / 2;
  if (tMid >= 95) lines.push('☀️ Sun-baked panels — runs through summer heat without softening');
  else if (tMid >= 80) lines.push('🌤️ Warm panels & outdoor shade in summer');
  else if (tMid >= 70) lines.push('🏢 Indoor shop / mild outdoor — the daily-driver window');
  else if (tMid >= 60) lines.push('⛅ Cool mornings & shoulder seasons');
  else lines.push('❄️ Cold panels — winter mornings, refrigerated shops');

  if (g.optimalHumidity.max <= 40) lines.push('🏜 Best in dry air — desert / arid climates');
  else if (g.optimalHumidity.min >= 55) lines.push('💧 Holds up in humid air — Gulf coast, summer monsoons');
  else lines.push('🌫 Comfortable across an average humidity range');

  if (g.strength === 'Super High') {
    lines.push('💪 Lateral tension / collision damage — big high-tension dents');
  } else if (g.strength === 'High') {
    lines.push('🔨 Slide-hammer pulls on medium-to-large dents');
  } else {
    lines.push('🪶 Small dings, finish passes, clean release on factory paint');
  }
  return lines;
}

// NOTE: glue.color (Nude/Brown/Black/etc) intentionally not rendered as a chip
// any more — it's already visible in the product photo and the product name.

interface GlueCardProps {
  score: GlueScore;
  /** When set, shows a #1/#2/#3 medal badge. */
  rank?: number;
}

function Bullet({ icon, tint, text }: { icon: string; tint: string; text: string }) {
  return (
    <div className="bullet">
      <span className="icon" style={{ color: tint }} aria-hidden>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

export function GlueCard({ score, rank }: GlueCardProps) {
  const [descOpen, setDescOpen] = useState(false);
  const { glue, reasons, warnings } = score;

  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const description = matched ? product.description : null;
  const productUrl = matched ? product.productUrl : null;
  const imageUrl = matched ? product.imageUrl : null;
  const canToggleDesc = matched && !!description;

  return (
    <article
      id={`gp-glue-${glue.id}`}
      className={`glue-card${rank === 1 ? ' top' : ''}`}
    >
      <button
        type="button"
        className="glue-head"
        onClick={() => canToggleDesc && setDescOpen((o) => !o)}
        disabled={!canToggleDesc}
        aria-expanded={canToggleDesc ? descOpen : undefined}
      >
        {rank ? <RankBadge rank={rank} /> : null}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${displayName} product photo`}
            className="product-thumb"
            loading="lazy"
          />
        ) : (
          <GlueStickPlaceholder color={glue.color} className="product-thumb placeholder-svg" />
        )}
        <div className="glue-head-text">
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

      <div className="chips">
        <Chip label={`${glue.strength} strength`} />
        <Chip label={`${glue.gunTemp} gun`} />
        <Chip label={glue.pullMethod} />
      </div>

      <div className="best-for-panel">
        <div className="best-for-label">Best Panel Conditions</div>
        <ul className="best-for-list">
          {bestPanelConditions(glue).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {reasons.length ? (
        <div className="bullets">
          {reasons.map((r, i) => (
            <Bullet key={`r${i}`} icon="✓" tint={colors.good} text={r} />
          ))}
        </div>
      ) : null}

      {warnings.length ? (
        <div className="bullets">
          {warnings.map((w, i) => (
            <Bullet key={`w${i}`} icon="⚠" tint={colors.warn} text={w} />
          ))}
        </div>
      ) : null}

      <div className="pros-cons">
        <div>
          <h4 className="good">PROS</h4>
          {glue.pros.map((p, i) => (
            <Bullet key={`p${i}`} icon="+" tint={colors.good} text={p} />
          ))}
        </div>
        <div>
          <h4 className="bad">CONS</h4>
          {glue.cons.map((c, i) => (
            <Bullet key={`c${i}`} icon="−" tint={colors.bad} text={c} />
          ))}
        </div>
      </div>

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
    </article>
  );
}
