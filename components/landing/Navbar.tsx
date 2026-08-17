"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <div className="brand">ShotAtSide</div>

        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#packages">Packages</a>
          <a href="#contact">Contact</a>
          <Link href="/login/client" className="login-link">Client Login</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/client" className="btn-outline">Book a Session</Link>
          <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? "✕" : "☰"}</button>
        </div>
      </div>
    </header>
  );
}
