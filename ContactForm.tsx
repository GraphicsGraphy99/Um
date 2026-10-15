"use client";
import { useState } from "react";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't send your message. Please try again.");
      setError(false); setMessage("Thanks for reaching out. Your message has been received.");
      form.reset();
    } catch (err) {
      setError(true); setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <form className="form-card" onSubmit={submit}>
    {message && <div role="status" className={`notice ${error ? "error" : ""}`}>{message}</div>}
    <div className="form-grid">
      <div className="form-row"><label htmlFor="name">Name</label><input className="field" id="name" name="name" required minLength={2} maxLength={100} autoComplete="name"/></div>
      <div className="form-row"><label htmlFor="email">Email</label><input className="field" id="email" name="email" type="email" required maxLength={254} autoComplete="email"/></div>
    </div>
    <div className="form-row"><label htmlFor="subject">Subject</label><input className="field" id="subject" name="subject" required minLength={2} maxLength={160}/></div>
    <div className="form-row"><label htmlFor="message">Message</label><textarea className="textarea" id="message" name="message" rows={6} required minLength={10} maxLength={5000}/></div>
    <div aria-hidden="true" style={{position:"absolute",left:"-10000px"}}><label htmlFor="website">Leave this blank</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
    <p className="help-text">By sending this form, you agree that your details may be stored to respond to your enquiry. We do not sell your information.</p>
    <button className="button" disabled={busy} type="submit">{busy ? "Sending…" : "Send message"}</button>
  </form>;
}
