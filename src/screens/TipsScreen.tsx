import { Screen } from '@/components/Screen';
import { tipSections } from '@/data/tips';

const SECTION_ICON: Record<string, string> = {
  prep: '✨',
  heat: '🔥',
  'glue-choice': '🎨',
  pulling: '🧲',
};

export function TipsScreen() {
  return (
    <Screen title="Tech Tips" subtitle="Get the most out of every pull.">
      {tipSections.map((section) => (
        <div key={section.id} className="tip-card">
          <div className="tip-head">
            <div className="tip-icon-wrap" aria-hidden>
              {SECTION_ICON[section.id] ?? '💡'}
            </div>
            <h3 className="tip-title">{section.title}</h3>
          </div>
          {section.steps.map((step, i) => (
            <div key={i} className="tip-step">
              <div className="num">{i + 1}</div>
              <div className="text">{step}</div>
            </div>
          ))}
        </div>
      ))}
    </Screen>
  );
}
