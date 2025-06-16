"use client";

import React from "react";

export default function MorePage() {
  return (
    <main className="w-full max-w-screen-md mx-auto px-6 py-12 space-y-12 text-[var(--foreground)]">
      {/* Page Title */}
      <section className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-clip-text">More About This App</h1>
        <p className="text-base ">Model Details · Contact</p>
      </section>

      {/* About Section */}
      <section className="space-y-4 bg-[var(--color-muted)] p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-[var(--color-primary)]">About the App</h2>
        <p className="text-[var(--foreground)]">
          This platform supports AI-powered, personalized rehabilitation planning for stroke survivors. Clinicians and researchers can explore patient data, adjust dose schedules, and simulate recovery outcomes over time.
        </p>
        <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]">
          <li>Track and manage both active and past patients</li>
          <li>Visualize predicted recovery outcomes based on dose plans</li>
          <li>Compare clinician-edited vs. AI-optimized treatment schedules</li>
        </ul>
      </section>

      {/* Model Section */}
      <section className="space-y-4 bg-[var(--color-muted)] p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-[var(--color-primary)]">How the AI Model Works</h2>
        <p className="text-[var(--foreground)]">
          The underlying model is based on a hierarchical Bayesian framework and a reinforcement learning algorithm called <strong>Posterior Sampling for Contextual Reinforcement Learning (PSCRL)</strong>.
        </p>
        <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]">
          <li>Starts with prior knowledge from past patients</li>
          <li>Learns and updates based on individual patient responses</li>
          <li>Adapts treatment to maximize motor recovery outcomes</li>
        </ul>
        <p className="text-sm text-[var(--color-secondary)]">
          Model reference: Schweighofer et al., 2023. Validated with DOSE and EXCITE datasets.
        </p>
      </section>

      {/* Contact Section */}
      <section className="space-y-4 bg-[var(--color-muted)] p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-[var(--color-primary)]">Contact Us</h2>
        <p className="text-[var(--foreground)]">If you&apos;re interested in collaboration, feedback, or learning more:</p>
        <ul className="list-disc list-inside text-[var(--foreground)]">
          <li>Email: <a className="text-[var(--color-primary)] underline" href="mailto:dongzeye@usc.edu">dongzeye@usc.edu</a></li>
          <li>Email: <a className="text-[var(--color-primary)] underline" href="mailto:schweigh@usc.edu">schweigh@usc.edu</a></li>
        </ul>
      </section>
    </main>
  );
}
