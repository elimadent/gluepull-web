import { Screen } from '@/components/Screen';
import { tipSections } from '@/data/tips';
import { linkTarget } from '@/utils/link';

/**
 * Editorial layout — each tip card is structured like a small print-magazine
 * spread: section eyebrow, large title, dek (subtitle), photo of the real
 * tool the section is about, zero-padded numbered steps, and a "Tool shown"
 * footer linking to the actual product on ansonpdr.com.
 */
export function TipsScreen() {
  return (
    <Screen title="Tech Tips" subtitle="A working field guide for hot-glue PDR.">
      {tipSections.map((section, idx) => (
        <article key={section.id} className="tip-card editorial">
          <header className="tip-editorial-head">
            {section.featured ? (
              <img
                src={section.featured.image}
                alt={section.featured.name}
                className="tip-hero-img"
                loading="lazy"
              />
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
      ))}
    </Screen>
  );
}
