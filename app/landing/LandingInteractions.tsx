
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

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

export default function LandingInteractions() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateScroll = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;

        setScrolled(window.scrollY > 24);
        setProgress(
          scrollable > 0
            ? Math.min(100, (window.scrollY / scrollable) * 100)
            : 0
        );

        frame = 0;
      });
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);

    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div
        className={styles.scrollProgress}
        aria-hidden="true"
        style={{ width: `${progress}%` }}
      />

      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <Link href="/" className={styles.brand} aria-label="RailPulse home" onClick={closeMenu}>
          <RailIcon />
          <span>RAIL<span className={styles.brandAccent}>PULSE</span></span>
        </Link>

        <nav
          id="railpulse-navigation"
          className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ""}`}
          aria-label="Main navigation"
        >
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#capabilities" onClick={closeMenu}>Capabilities</a>
          <a href="#roadmap" onClick={closeMenu}>Roadmap</a>

          <Link href="/map" className={`${styles.navCta} ${styles.mobileCta}`} onClick={closeMenu}>
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        <Link href="/map" className={`${styles.navCta} ${styles.desktopCta}`}>
          Get started <span aria-hidden="true">↗</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="railpulse-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </header>
    </>
  );
}
