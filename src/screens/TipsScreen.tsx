import { Screen } from '@/components/Screen';
import {
  GlueSticksIcon,
  HeatGunIcon,
  MiniLifterIcon,
  PanelPrepIcon,
} from '@/components/TipIcons';
import { tipSections } from '@/data/tips';

const SECTION_ICON: Record<
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
    <Screen title="Tech Tips" subtitle="Get the most out of every pull.">
      {tipSections.map((section) => {
        const Icon = SECTION_ICON[section.id];
        return (
          <div key={section.id} className="tip-card">
            <div className="tip-head">
              <div className="tip-icon-wrap" aria-hidden>
                {Icon ? (
                  <Icon width={26} height={26} />
                ) : (
                  <span>💡</span>
                )}
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
        );
      })}
    </Screen>
  );
}
