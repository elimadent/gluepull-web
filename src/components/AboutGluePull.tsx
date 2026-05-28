/**
 * "Why GluePull" hero intro — the marketing copy that explains the tool's
 * value proposition to first-time visitors. Lives at the top of Home so
 * Shopify product-page visitors see it before scrolling to the picker.
 *
 * Renders as a collapsible <details>: open by default for first impressions,
 * one tap to hide once you've read it.
 */
export function AboutGluePull() {
  return (
    <details className="about-card" open>
      <summary>
        <span className="collapsible-eyebrow">Why GluePull</span>
        <span className="collapsible-title">
          Find the right glue for the right situation
        </span>
        <span className="collapsible-chev" aria-hidden>▾</span>
      </summary>
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
          That means <strong>less frustration, less downtime, and more profit.</strong>
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
    </details>
  );
}
