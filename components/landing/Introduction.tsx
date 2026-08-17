"use client";

export function Introduction() {
  return (
    <section id="about" className="intro-section">
      <div className="intro-grid">
        <div className="intro-media" />
        <div className="intro-copy">
          <h2>WE DON'T JUST TAKE PHOTOGRAPHS. WE PRESERVE STORIES.</h2>
          <p>
            Every celebration has its own story. Our approach combines natural emotions,
            cinematic composition and timeless editing to create photographs you will
            want to revisit for years to come.
          </p>

          <div className="stats-grid">
            <div className="stat">
              <strong>10+</strong>
              <span>Years Experience</span>
            </div>
            <div className="stat">
              <strong>500+</strong>
              <span>Events Captured</span>
            </div>
            <div className="stat">
              <strong>1000+</strong>
              <span>Happy Clients</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
