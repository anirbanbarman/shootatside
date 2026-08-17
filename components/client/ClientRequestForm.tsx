"use client";

import { useState } from "react";

import { useProjectContext } from "@/components/providers/ProjectProvider";

const defaultServices = ["Still Photography", "Cinematography", "Drone Shoot"];

export function ClientRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { createProjectRequest } = useProjectContext();
  const [form, setForm] = useState({
    name: "Ani Barman",
    email: "admin@ani.photography.com",
    phone: "8906349799",
    eventType: "Wedding",
    eventDate: "2026-12-25",
    venue: "Kolkata",
    guestCount: 250,
    requirements: "Looking for complete wedding photography and cinematography package.",
    eventSide: "Single Side",
    budget: "₹10,000 - ₹15,000",
    services: defaultServices,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field: string, value: string | number | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleService = (service: string) => {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.venue.trim() || !form.eventDate || !form.eventType.trim()) {
      setError("Please complete the required client details, including the event date.");
      setSuccess("");
      return;
    }

    if (form.services.length === 0) {
      setError("Select at least one photography requirement.");
      setSuccess("");
      return;
    }

    if (Number(form.guestCount) <= 0) {
      setError("Guest count must be greater than 0.");
      setSuccess("");
      return;
    }

    const requirementText = [
      `Event date: ${form.eventDate}`,
      `Event side: ${form.eventSide}`,
      `Budget: ${form.budget}`,
      `Requirements: ${form.services.join(", ")}`,
      form.requirements.trim() ? `Comments: ${form.requirements.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    createProjectRequest({
      name: form.name.trim(),
      email: form.email.trim() || "client@shootatside.com",
      phone: form.phone.trim(),
      eventType: form.eventType.trim(),
      eventDate: form.eventDate,
      venue: form.venue.trim(),
      guestCount: Number(form.guestCount),
      requirements: requirementText,
    });

    setSuccess("Project request created successfully.");
    setError("");
    setForm({
      name: "",
      email: "",
      phone: "",
      eventType: "Wedding",
      eventDate: "",
      venue: "",
      guestCount: 0,
      requirements: "",
      eventSide: "Single Side",
      budget: "₹10,000 - ₹15,000",
      services: defaultServices,
    });

    if (onSuccess) {
      setTimeout(onSuccess, 500);
    }
  };

  return (
    <form id="inquiryForm" className="card client-request-form" onSubmit={(event) => {
      event.preventDefault();
      handleSubmit();
    }}>
      <div className="card-title">Client Information</div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="clientName">Name</label>
          <input id="clientName" type="text" value={form.name} onChange={(event) => handleChange("name", event.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="clientPhone">Phone Number</label>
          <input id="clientPhone" type="tel" value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="clientLocation">Location</label>
          <input id="clientLocation" type="text" value={form.venue} onChange={(event) => handleChange("venue", event.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="eventType">Event Type</label>
          <select id="eventType" value={form.eventType} onChange={(event) => handleChange("eventType", event.target.value)}>
            <option value="Wedding">Wedding</option>
            <option value="Pre Wedding">Pre Wedding</option>
            <option value="Post Wedding">Post Wedding</option>
            <option value="Rice Ceremony">Rice Ceremony</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Thread Ceremony">Thread Ceremony</option>
            <option value="Maternity Shoot">Maternity Shoot</option>
            <option value="Baby New Born Shoot">Baby New Born Shoot</option>
            <option value="Birthday">Birthday</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Event Date</label>
          <input id="eventDate" type="date" value={form.eventDate} onChange={(event) => handleChange("eventDate", event.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="eventSide">Event Side</label>
          <select id="eventSide" value={form.eventSide} onChange={(event) => handleChange("eventSide", event.target.value)}>
            <option value="Single Side">Single Side</option>
            <option value="Both Side">Both Side</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="budget">Budget</label>
          <select id="budget" value={form.budget} onChange={(event) => handleChange("budget", event.target.value)}>
            <option value="₹10,000 - ₹15,000">₹10,000 - ₹15,000</option>
            <option value="₹15,000 - ₹25,000">₹15,000 - ₹25,000</option>
            <option value="₹25,000 - ₹40,000">₹25,000 - ₹40,000</option>
            <option value="₹40,000 - ₹60,000">₹40,000 - ₹60,000</option>
            <option value="₹60,000 - ₹90,000">₹60,000 - ₹90,000</option>
            <option value="Above ₹1 Lakh">Above ₹1 Lakh</option>
          </select>
        </div>

        <div className="form-group full">
          <label>Photography Requirement</label>

          <div className="check-grid">
            {defaultServices.map((service) => (
              <label key={service} className="check-item">
                <input
                  type="checkbox"
                  name="service"
                  value={service}
                  checked={form.services.includes(service)}
                  onChange={() => toggleService(service)}
                />
                {service}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group full">
          <label htmlFor="comments">Comments</label>
          <textarea id="comments" rows={5} value={form.requirements} onChange={(event) => handleChange("requirements", event.target.value)} />
        </div>
      </div>

      {error ? <div className="error-box mt-16">{error}</div> : null}
      {success ? <div className="success-box mt-16">{success}</div> : null}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Submit Inquiry
        </button>
      </div>
    </form>
  );
}
