
import Link from "next/link";
import LandingInteractions from "./LandingInteractions";
import styles from "./landing.module.css";

const capabilities = [
  {
    number: "01",
    symbol: "⌁",
    title: "Railway infrastructure",
    description:
      "Explore railway-track and station geometry sourced from OpenStreetMap.",
    status: "IMPLEMENTED",
  },
  {
    number: "02",
    symbol: "⌕",
    title: "Station exploration",
    description:
      "Search for stations and navigate the railway map. Station intelligence reliability is still being worked on.",
    status: "IN PROGRESS",
  },
  {
    number: "03",
    symbol: "↗",
    title: "Train-status integrations",
    description:
      "NTES running-status integration and RailRadar detailed train lookup.",
    status: "INTEGRATED",
  },
  {
    number: "04",
    symbol: "◎",
    title: "Initial train visualization",
    description:
      "Display a test train with a station-based calculated position, not continuous locomotive GPS.",
    status: "PROTOTYPE",
  },
];

const roadmap = [
  {
    number: "01",
    symbol: "⌖",
    status: "PLANNED",
    title: "Nationwide train radar",
    description:
      "Discover and display many trains that are currently running across India.",
  },
  {
    number: "02",
    symbol: "⌁",
    status: "IN DEVELOPMENT",
    title: "Track-aware positioning",
    description:
      "Estimate train positions along actual railway geometry using available running information.",
  },
  {
    number: "03",
    symbol: "∿",
    status: "PLANNED",
    title: "Traffic and delay intelligence",
    description:
      "Explore delay patterns and understand activity across railway corridors.",
  },
  {
    number: "04",
    symbol: "↺",
    status: "PLANNED",
    title: "Historical replay",
    description:
      "Review recorded train movements and explore how the network changes over time.",
  },
];

function NetworkVisual() {
  return (
    <div className={styles.networkFrame}>
      <div className={styles.visualTop}>
        <span className={styles.visualEyebrow}>
          <span className={styles.liveDot} />
          RAIL NETWORK / INDIA
        </span>
        <span className={styles.visualMode}>CONCEPT VIEW</span>
      </div>

      <svg
        className={styles.networkSvg}
        viewBox="0 0 700 420"
        role="img"
        aria-label="Conceptual illustration of interconnected railway routes and stations"
      >
        <defs>
          <pattern id="rp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#243541" strokeWidth=".7" />
          </pattern>
          <radialGradient id="rp-glow">
            <stop offset="0%" stopColor="#35cddd" stopOpacity=".17" />
            <stop offset="100%" stopColor="#35cddd" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="700" height="420" fill="url(#rp-grid)" />
        <ellipse cx="355" cy="205" rx="280" ry="205" fill="url(#rp-glow)" />

        <g fill="none" stroke="#304a58" strokeWidth="2" strokeLinejoin="round">
          <path d="M-20 285 95 230 180 260 275 160 375 190 475 95 580 140 720 45" />
          <path d="M20 410 120 330 180 260 275 315 370 275 455 325 575 275 720 340" />
          <path d="M-10 105 100 165 180 260 275 315 320 430" />
          <path d="M180 260 220 135 300 75 375 190 370 275" />
          <path d="M375 190 470 235 575 275 625 195 580 140" />
          <path d="M475 95 470 235 455 325" />
          <path d="M100 165 95 230" />
        </g>

        <path
          className={styles.routePulse}
          d="M-20 285 95 230 180 260 275 160 375 190 475 95 580 140 720 45"
          fill="none"
          stroke="#45d5e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M180 260 220 135 300 75 375 190 370 275"
          fill="none"
          stroke="#45d5e5"
          strokeWidth="2"
          strokeOpacity=".6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g fill="#0d1720" stroke="#56dce9" strokeWidth="2">
          <circle cx="95" cy="230" r="5" />
          <circle cx="180" cy="260" r="6" />
          <circle cx="275" cy="160" r="5" />
          <circle cx="375" cy="190" r="7" />
          <circle cx="475" cy="95" r="5" />
          <circle cx="580" cy="140" r="5" />
          <circle cx="300" cy="75" r="5" />
          <circle cx="370" cy="275" r="5" />
          <circle cx="575" cy="275" r="5" />
        </g>

        <g fill="#d8faff" fontSize="10" fontFamily="Arial, sans-serif" letterSpacing="1">
          <text x="72" y="215">STATION A</text>
          <text x="194" y="281">JUNCTION</text>
          <text x="390" y="177">NETWORK HUB</text>
          <text x="485" y="80">STATION B</text>
        </g>

        <g transform="translate(375 190)">
          <circle r="21" fill="#45d5e5" opacity=".08" />
          <circle r="13" fill="#45d5e5" opacity=".14" />
          <circle r="5" fill="#8af3fb" />
        </g>
      </svg>

      <div className={styles.visualFooter}>
        <span><span className={styles.legendLine} /> Railway corridors</span>
        <span><span className={styles.legendDot} /> Station nodes</span>
      </div>

      <p className={styles.visualNote}>
        Conceptual infrastructure illustration · Not live train positions
      </p>
    </div>
  );
}

function RailIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={styles.brandIcon}>
      <path d="M15 5h18a5 5 0 0 1 5 5v20a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V10a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 24h22M17 12h14M18 37l-5 6m17-6 5 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="17" cy="30" r="2" fill="currentColor" />
      <circle cx="31" cy="30" r="2" fill="currentColor" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main id="top" className={styles.page}>
      <LandingInteractions />

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.liveDot} />
              INDIAN RAILWAY INTELLIGENCE
            </div>

            <h1>
              See India&apos;s railway
              <br />
              network <span>in motion.</span>
            </h1>

            <p className={styles.heroDescription}>
              Explore India&apos;s railway infrastructure, connect available
              train-running information, and discover a clearer view of the network.
            </p>

            <div className={styles.heroActions}>
              <Link href="/map" className={styles.primaryCta}>
                Explore RailPulse <span aria-hidden="true">↗</span>
              </Link>
              <a href="#about" className={styles.secondaryCta}>
                Discover the project <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className={styles.heroFootnote}>
              <span className={styles.footnoteLine} />
              A RAILWAY INTELLIGENCE PROTOTYPE
            </div>
          </div>

          <div className={styles.heroVisual}>
            <NetworkVisual />
            <div className={styles.visualCaption}>
              <span>INDIA / RAIL NETWORK</span>
              <span>INFRASTRUCTURE LAYER</span>
            </div>
          </div>
        </div>

        <a href="#about" className={styles.scrollCue}>
          <span className={styles.scrollCueLine} />
          SCROLL TO EXPLORE
        </a>

        <div className={styles.heroIndex} aria-hidden="true">
          <span>01</span>
          <span className={styles.indexLine} />
          <span>03</span>
        </div>
      </section>

      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutHeading}>
          <span className={styles.sectionLabel}>01 / THE IDEA</span>
          <h2>
            One network.
            <br />
            A clearer picture.
          </h2>
        </div>

        <div className={styles.aboutCopy}>
          <p className={styles.aboutLead}>
            RailPulse brings railway infrastructure and available train-running
            information into one interactive experience.
          </p>
          <p>
            It combines railway geometry from OpenStreetMap with NTES and
            RailRadar integrations, creating a foundation for map-based
            exploration and railway intelligence.
          </p>

          <div className={styles.sourceList}>
            <div>
              <span className={styles.sourceNumber}>01</span>
              <span>
                <strong>OpenStreetMap</strong>
                <small>Railway infrastructure geometry</small>
              </span>
            </div>
            <div>
              <span className={styles.sourceNumber}>02</span>
              <span>
                <strong>NTES + RailRadar</strong>
                <small>Available train-running information</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className={styles.capabilitiesSection}>
        <div className={styles.sectionTop}>
          <div>
            <span className={styles.sectionLabel}>02 / THE FOUNDATION</span>
            <h2>What works today.</h2>
          </div>
          <p>
            An evolving prototype. Current capabilities are shown honestly,
            including areas still being improved.
          </p>
        </div>

        <div className={styles.currentGrid}>
          {capabilities.map((item) => (
            <article key={item.number} className={styles.currentCard}>
              <div className={styles.cardTop}>
                <span className={styles.cardNumber}>{item.number}</span>
                <span className={styles.cardIcon} aria-hidden="true">{item.symbol}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className={styles.status}>
                <span className={styles.statusDot} />
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section id="roadmap" className={styles.roadmapSection}>
        <div className={styles.sectionTop}>
          <div>
            <span className={styles.sectionLabel}>03 / THE ROAD AHEAD</span>
            <h2>From a map to intelligence.</h2>
          </div>
          <p>
            The next steps toward a broader view of India&apos;s railway network.
            These features are planned or in development.
          </p>
        </div>

        <div className={styles.roadmapGrid}>
          {roadmap.map((item) => (
            <article key={item.number} className={styles.roadmapCard}>
              <div className={styles.roadmapMeta}>
                <span>{item.number} / FUTURE</span>
                <span className={styles.planned}>{item.status}</span>
              </div>
              <span className={styles.roadmapIcon} aria-hidden="true">{item.symbol}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className={styles.roadmapArrow} aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCtaGrid} aria-hidden="true" />
        <span className={styles.sectionLabel}>YOUR VIEW OF THE NETWORK</span>
        <h2>
          The railway network,
          <br />
          <span>at a different scale.</span>
        </h2>
        <p>
          Explore the infrastructure and available train information in the
          RailPulse map.
        </p>
        <Link href="/map" className={styles.primaryCta}>
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}>
          <RailIcon />
          <span>RAIL<span className={styles.brandAccent}>PULSE</span></span>
        </Link>

        <span className={styles.footerTagline}>
          See India&apos;s railway network in motion.
        </span>

        <a href="#top" className={styles.backToTop}>
          Back to top ↑
        </a>
      </footer>
    </main>
  );
}
