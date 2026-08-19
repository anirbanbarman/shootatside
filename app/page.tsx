"use client";

import Link from "next/link";

import { Hero } from "@/components/landing/Hero";
import { Introduction } from "@/components/landing/Introduction";
import { Navbar } from "@/components/landing/Navbar";
import { Portfolio } from "@/components/landing/Portfolio";
import { Services } from "@/components/landing/Services";

const packages = [
  { name: "Signature Wedding", price: "₹75,000", detail: "8 hours • 2 photographers • cinematic edits" },
  { name: "Pre-Wedding Story", price: "₹45,000", detail: "4 hours • styling • location guidance" },
  { name: "Corporate Coverage", price: "₹30,000", detail: "6 hours • team coverage • highlight reel" },
];

const testimonials = [
  { name: "Ananya & Rohan", quote: "The team captured the day beautifully. Every frame felt cinematic and personal." },
  { name: "Aisha Khan", quote: "Our portraits felt genuine and elevated. The entire experience was seamless." },
  { name: "Monica Saha", quote: "Professional, calm, and incredibly detail-focused. Highly recommended." },
];

export default function Home() {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Introduction />
      <Services />
      <Portfolio />

      <section id="packages" className="packages-section">
        <div className="section-head">
          <h3>Photography Packages</h3>
          <p className="muted-copy">Tailored collections for weddings, portraits, events and brands.</p>
        </div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <article key={pkg.name} className="package-card">
              <span className="package-tag">Most Loved</span>
              <h4>{pkg.name}</h4>
              <div className="price">{pkg.price}</div>
              <p className="muted-copy">{pkg.detail}</p>
              <Link href="/client" className="btn-primary small">Book Now</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <div className="section-head">
          <h3>Client Love</h3>
          <p className="muted-copy">Words from clients who trusted us with their milestones.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card">
              <p>“{item.quote}”</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="booking-cta">
        <div>
          <p className="eyebrow">Let’s plan your story</p>
          <h3>Ready to create timeless memories?</h3>
        </div>
        <div className="cta-actions">
          <Link href="/client" className="btn-primary">Book a Session</Link>
          <Link href="/login/client" className="btn-outline">Client Login</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand">ShotAtSide</div>
        <p>© 2026 ShotAtSide Photography Studio</p>
      </footer>
    </div>
  );
}
