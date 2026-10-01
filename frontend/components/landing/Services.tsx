"use client";

import Link from "next/link";

const SERVICES = [
  {
    title: "Wedding Photography",
    desc: "Capture every emotion, ritual and celebration.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=60&auto=format&fit=crop",
  },
  {
    title: "Pre-Wedding Photography",
    desc: "Creative couple portraits and cinematic storytelling.",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=60&auto=format&fit=crop",
  },
  {
    title: "Event Photography",
    desc: "Corporate events, birthdays, anniversaries and celebrations.",
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=60&auto=format&fit=crop",
  },
  {
    title: "Portrait Photography",
    desc: "Professional portraits and personal branding.",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=60&auto=format&fit=crop",
  },
  {
    title: "Fashion Photography",
    desc: "Editorial and fashion photography.",
    img: "https://images.unsplash.com/photo-1519841474723-3f8b1c1b5b8c?w=1200&q=60&auto=format&fit=crop",
  },
  {
    title: "Product Photography",
    desc: "Professional product and commercial photography.",
    img: "https://images.unsplash.com/photo-1515548212856-55b7c8ea7d6b?w=1200&q=60&auto=format&fit=crop",
  },
];

export function Services() {
  return (
    <section id="services" className="services-section">
      <div className="section-head">
        <h3>Our Services</h3>
        <p className="muted-copy">Cinematic photography across categories — crafted with care.</p>
      </div>

      <div className="services-grid">
        {SERVICES.map((s) => (
          <article key={s.title} className="service-card">
            <div className="service-media" style={{ backgroundImage: `url(${s.img})` }} />
            <div className="service-body">
              <h4>{s.title}</h4>
              <p className="muted-copy">{s.desc}</p>
              <div className="service-actions">
                <Link href="/login/client" className="link-button">Explore Service</Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="below-services-cta">
        <Link href="/login/client" className="btn-outline">Client Login</Link>
      </div>
    </section>
  );
}
