import { Screen } from '@/components/Screen';
import {
  GlueSticksIcon,
  HeatGunIcon,
  MiniLifterIcon,
  PanelPrepIcon,
} from '@/components/TipIcons';
import { tipSections } from '@/data/tips';
import { linkTarget } from '@/utils/link';

/**
 * Editorial layout — each tip card is structured like a small print-magazine
 * spread. When a section has a real Anson product to feature, its photo is
 * the section thumbnail and a "Tool shown" footer links to the product. When
 * Anson doesn't carry the relevant tool (e.g. handheld heat guns / torches),
 * the section falls back to a hand-drawn SVG illustration of the right tool.
 */
const FALLBACK_ICON: Record<
  string,
  (props: React.SVGProps<SVGSVGElement>) => JSX.Element
> = {
  prep: PanelPrepIcon,
  heat: HeatGunIcon,
  'glue-choice': GlueSticksIcon,
  pulling: MiniLifterIcon,
};

export function TipsScreen() {
  return (
    <Screen title="Tech Tips" subtitle="A working field guide for hot-glue PDR.">
      {tipSections.map((section, idx) => {
        const Icon = FALLBACK_ICON[section.id];
        return (
          <article key={section.id} className="tip-card editorial">
            <header className="tip-editorial-head">
              {section.featured ? (
                <img
                  src={section.featured.image}
                  alt={section.featured.name}
                  className="tip-hero-img"
                  loading="lazy"
                />
              ) : Icon ? (
                <div className="tip-hero-svg" aria-hidden>
                  <Icon width={56} height={56} />
                </div>
              ) : null}
              <div className="tip-head-text">
                <div className="tip-eyebrow">
                  Lesson {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className="tip-title-editorial">{section.title}</h3>
                {section.subtitle ? (
                  <p className="tip-dek">{section.subtitle}</p>
                ) : null}
              </div>
            </header>

            <ol className="tip-steps-list">
              {section.steps.map((step, i) => (
                <li key={i} className="tip-step-editorial">
                  <span className="tip-step-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="tip-step-text">{step}</span>
                </li>
              ))}
            </ol>

            {section.featured ? (
              <footer className="tip-footer">
                <span className="tip-footer-label">Tool shown</span>
                <a
                  className="tip-footer-link"
                  href={section.featured.url}
                  target={linkTarget(section.featured.url)}
                  rel="noopener noreferrer"
                >
                  {section.featured.name} →
                </a>
              </footer>
            ) : null}
          </article>
        );
      })}
    </Screen>
  );
}
