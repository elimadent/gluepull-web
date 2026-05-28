import { Screen } from '@/components/Screen';

/**
 * About Glue IQ. Editorial single-page pitch that walks the user from the
 * problem (glue failure is environmental) to the solution (independent
 * testing-backed recommendations). Mirrors the existing visual language:
 * gold-bullet lists, green-check benefit lists, and a gold-italic pull
 * quote that sets off the thesis.
 */
export function AboutScreen() {
  return (
    <Screen
      title="About Glue IQ"
      subtitle="Find the right glue for the conditions you're working in."
    >
      <article className="about-page">
        <header className="about-page-head">
          <div className="about-eyebrow">Why Glue IQ</div>
          <h2 className="about-headline">
            Find the right glue for the conditions you're working in.
          </h2>
        </header>

        <div className="about-body">
          <p>
            PDR glue does not perform the same in every environment. Temperature,
            humidity, panel heat, sun exposure, cold metal, and changing weather
            can all affect how well a glue sticks, pulls, and releases.
          </p>

          <p>
            That is why the "best glue" does not exist universally. The best glue
            is the one that matches:
          </p>
          <ul className="about-list">
            <li>the weather</li>
            <li>the panel temperature</li>
            <li>the type of dent</li>
            <li>the tab you're using</li>
            <li>and the tool you're pulling with</li>
          </ul>

          <p>
            When those variables line up correctly, everything changes. The goal
            is simple:
          </p>

          <blockquote className="about-pull">
            Less trial and error. More consistent pulls. Faster repairs.
          </blockquote>

          <p>
            When you match the precise chemical behavior of the glue to your
            environment, you get:
          </p>
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

          <h3 className="about-subhead">Backed by Independent Testing</h3>
          <p>
            To make sure these recommendations actually work in the field, we did
            not rely on manufacturer marketing. Our system is powered by
            independent, third-party dynamometer testing conducted by industry
            experts at Dentless Touch and Perfect Pull.
          </p>
          <p>
            Using custom-built mechanical testing devices under highly controlled
            conditions, technicians measured the absolute static load-to-failure
            thresholds of the industry's top adhesives.
          </p>

          <p>Here is what the data proved:</p>
          <ul className="about-list">
            <li>
              <strong>Strength is relative.</strong> A glue's absolute tensile
              strength fluctuates massively based on ambient temperature and
              relative humidity.
            </li>
            <li>
              <strong>Lower strength isn't always worse.</strong> The data
              highlights the highly specialized nature of modern polymer
              chemistry. A rigid adhesive might transfer shock perfectly for fast
              hail damage, while an elastic adhesive with a lower baseline static
              pull will excel in freezing winter temperatures where rigid
              formulas shatter on impact.
            </li>
          </ul>

          <p>
            We utilize this nuanced, objective data to look past the label. Once
            you understand how each glue reacts to real-world weather and panel
            conditions, choosing the right stick becomes one of the biggest
            advantages in your toolbox.
          </p>

          <blockquote className="about-pull about-pull-closer">
            <em>
              When the right glue is paired with the right environment and the
              right tool, PDR becomes faster, easier, and far more repeatable.
            </em>
          </blockquote>
        </div>
      </article>
    </Screen>
  );
}
