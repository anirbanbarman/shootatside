"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-media" role="img" aria-label="Hero image" />

      <div className="hero-content">
        <div className="eyebrow">CAPTURING</div>
        <h1>
          MOMENTS
          <br />
          THAT LAST
          <br />
          FOREVER
        </h1>
        <p className="hero-sub">Wedding • Portrait • Event • Fashion</p>

        <div className="hero-cta">
          <Link href="#portfolio" className="btn-primary">Explore Portfolio</Link>
          <Link href="/client" className="btn-outline">Book a Session</Link>
        </div>
      </div>
    </section>
  );
}
