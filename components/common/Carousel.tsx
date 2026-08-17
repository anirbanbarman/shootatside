"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Weddings",
    subtitle: "Cinematic wedding photography and videography",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80&auto=format&fit=crop",
  },
  {
    title: "Pre-Wedding",
    subtitle: "Capture your love story in cinematic frames",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1600&q=80&auto=format&fit=crop",
  },
  {
    title: "Events & Moments",
    subtitle: "From birthdays to corporate events — we cover it all",
    image: "https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=1600&q=80&auto=format&fit=crop",
  },
];

export function Carousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="carousel">
      <div className="carousel-inner">
        {slides.map((s, i) => (
          <div key={s.title} className={`carousel-slide ${i === index ? "active" : ""}`} style={{ backgroundImage: `url(${s.image})` }}>
            <div className="carousel-overlay">
              <h2>{s.title}</h2>
              <p>{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="carousel-control prev" onClick={prev} aria-label="Previous slide">
        ‹
      </button>
      <button type="button" className="carousel-control next" onClick={next} aria-label="Next slide">
        ›
      </button>

      <div className="carousel-dots">
        {slides.map((_, i) => (
          <button key={i} type="button" className={`dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
