"use client";

const PORTFOLIO = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=1200&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=60&auto=format&fit=crop",
];

export function Portfolio() {
  return (
    <section id="portfolio" className="portfolio-section">
      <div className="section-head">
        <h3>Featured Portfolio</h3>
        <p className="muted-copy">A selection of recent work, presented as cinematic frames.</p>
      </div>

      <div className="portfolio-grid">
        {PORTFOLIO.map((src, i) => (
          <div key={i} className="portfolio-item" style={{ backgroundImage: `url(${src})` }} />
        ))}
      </div>
    </section>
  );
}
