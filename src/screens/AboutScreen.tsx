import { Screen } from '@/components/Screen';

/**
 * Dedicated "Why GluePull" page — the marketing/explainer content that used
 * to live as a collapsible at the top of Home. Now its own tab so first-time
 * Shopify visitors who tap About get the full pitch, and repeat users on
 * Home aren't blocked by it.
 */
export function AboutScreen() {
  return (
    <Screen
      title="About GluePull"
      subtitle="Why this tool exists, and how it changes a PDR job."
    >
      <article className="about-page">
        <header className="about-page-head">
          <div className="about-eyebrow">Why GluePull</div>
          <h2 className="about-headline">
            Find the right glue for the right situation
          </h2>
        </header>

        <div className="about-body">
          <p>
            PDR glue can feel overwhelming at first. There are dozens of options,
            different colors, different strengths, different temperatures — and
            every tech has heard ten different opinions on what "works best."
          </p>
          <p>
            <strong>That's exactly why we built this tool.</strong>
          </p>
          <p>
            Instead of guessing, this system helps match the right glue, tab, and
            pulling method to your actual working conditions — temperature,
            humidity, panel type, dent style, and tool setup. The goal is simple:
          </p>

          <blockquote className="about-pull">
            Less trial and error. More consistent pulls. Faster repairs.
          </blockquote>

          <p>
            The truth is, the "best glue" does not exist universally. The best
            glue is the one that matches:
          </p>
          <ul className="about-list">
            <li>the weather</li>
            <li>the panel temperature</li>
            <li>the type of dent</li>
            <li>the tab you're using</li>
            <li>and the tool you're pulling with</li>
          </ul>

          <p>When those variables line up correctly, everything changes.</p>

          <h4 className="about-subhead">You get</h4>
          <ul className="about-list checked">
            <li>cleaner pulls</li>
            <li>better holding power</li>
            <li>less glue failure</li>
            <li>fewer wasted attempts</li>
            <li>faster cycle times</li>
            <li>and more control during the repair</li>
          </ul>

          <p>
            That means{' '}
            <strong>less frustration, less downtime, and more profit.</strong>
          </p>

          <p>
            What seems like an endless selection of glues eventually becomes one of
            the biggest advantages in your toolbox once you understand when and
            why each glue performs best.
          </p>
          <p>
            This recommendation system is designed to shorten that learning curve
            and help both new and experienced techs quickly find a setup that
            works in real-world conditions.
          </p>
          <p className="about-closer">
            When the right glue is paired with the right environment and the right
            tool, PDR becomes <em>faster, easier, and far more repeatable.</em>
          </p>
        </div>
      </article>
    </Screen>
  );
}
