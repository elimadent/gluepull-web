import { useState } from 'react';
import { AccessoryRow } from '@/components/AccessoryRow';
import { Chip } from '@/components/Chip';
import { RankBadge } from '@/components/RankBadge';
import { getAnsonProduct } from '@/data/products';
import { bundleForGlue } from '@/logic/bundles';
import { colors } from '@/theme/theme';
import { GlueScore } from '@/types';

interface GlueCardProps {
  score: GlueScore;
  /** When set, shows a #1/#2/#3 medal badge. */
  rank?: number;
  /** Show the expandable "matching tools" bundle. Default true. */
  showBundle?: boolean;
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

export function GlueCard({ score, rank, showBundle = true }: GlueCardProps) {
  const [descOpen, setDescOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const { glue, score: value, reasons, warnings } = score;

  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const description = matched ? product.description : null;
  const productUrl = matched ? product.productUrl : null;
  const imageUrl = matched ? product.imageUrl : null;

  const bundle = showBundle ? bundleForGlue(glue) : [];
  const canToggleDesc = matched && !!description;

  return (
    <article className={`glue-card${rank === 1 ? ' top' : ''}`}>
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
          <div className="product-thumb placeholder" aria-hidden>
            🔥
          </div>
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
        <div className="glue-score">
          <div className="glue-score-value">{value}</div>
          <div className="glue-score-label">match</div>
        </div>
      </button>

      {canToggleDesc && descOpen ? (
        <div className="product-desc">{description}</div>
      ) : null}

      <div className="chips">
        <Chip label={glue.color} tint={colors.accent} />
        <Chip label={`${glue.strength} strength`} />
        <Chip label={`${glue.gunTemp} gun`} />
        <Chip label={glue.pullMethod} />
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
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buy ${displayName} on ansonpdr.com`}
        >
          <span aria-hidden>🛒</span>
          <span>View on Anson PDR</span>
        </a>
      ) : (
        <div className="buy disabled" aria-disabled="true">
          Product not yet linked
        </div>
      )}

      {showBundle && bundle.length ? (
        <>
          <button
            type="button"
            className="bundle-toggle"
            onClick={() => setBundleOpen((o) => !o)}
            aria-expanded={bundleOpen}
          >
            <span aria-hidden>📦</span>
            <span>
              {bundleOpen
                ? 'Hide matching tools'
                : `Matching tools & kit (${bundle.length})`}
            </span>
            <span className="chev" aria-hidden>
              {bundleOpen ? '▲' : '▼'}
            </span>
          </button>
          {bundleOpen
            ? bundle.map((acc) => <AccessoryRow key={acc.id} accessory={acc} />)
            : null}
        </>
      ) : null}
    </article>
  );
}
