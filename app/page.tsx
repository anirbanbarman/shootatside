"use client";

import Link from "next/link";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ClientDashboard } from "@/components/client/ClientDashboard";
import { useProjectContext } from "@/components/providers/ProjectProvider";
import { Carousel } from "@/components/common/Carousel";

export default function Home() {
  const { view, currentUser } = useProjectContext();

  if (!currentUser) {
    return (
      <div className="landing-shell">
        <div className="landing-carousel">
          <Carousel />
        </div>

        <div className="portal-shell">
          <div className="portal-card">
            <p className="eyebrow">Access Portal</p>
            <h1>Client Portal</h1>
            <p className="muted-copy">Open your client dashboard to view quotes and requests.</p>
            <div className="portal-actions">
              <Link href="/login/client" className="portal-button client">
                Client Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="content-panel app-shell-main">
      {view === "admin" ? <AdminDashboard /> : <ClientDashboard />}
    </main>
  );
}
