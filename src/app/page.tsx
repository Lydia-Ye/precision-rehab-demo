"use client";

import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="w-full max-w-screen-xl mx-auto px-6 py-12 flex flex-col items-center gap-16">
      {/* Hero Section */}
      <section className="text-center max-w-4xl space-y-6">
        <h1 className="text-5xl font-bold leading-tight text-[var(--foreground)]">
          Smart Stroke Rehabilitation with AI
        </h1>
        <p className="text-[var(--foreground)] text-lg">
          Our precision rehabilitation system uses real patient data and adaptive AI to recommend the most effective treatment plans. Monitor progress, simulate outcomes, and personalize rehabilitation like never before.
        </p>

        {/* Get Started Section */}
        <h2 className="text-3xl font-semibold mt-8">Get Started</h2>
        <p className="text-[var(--foreground)] text-base mb-6">
          Begin by exploring the <strong>Patient Dashboard</strong>, where you'll find data from both past and current patients. From there, you can monitor progress, adjust treatment plans, and see how our AI adapts to each individual case.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button variant="primary" onClick={() => router.push("/patient")}>Patient Dashboard</Button>
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full max-w-4xl text-center space-y-10">
        <h2 className="text-3xl font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[var(--foreground)] text-base">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-2">1. Learn from Data</h3>
            <p>We use a large database of stroke patient outcomes to build a population-level understanding of treatment response.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-2">2. Adapt to the Individual</h3>
            <p>As new patient data comes in, our AI refines its model to tailor the rehabilitation plan for the specific person.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-2">3. Optimize with AI</h3>
            <p>Using a reinforcement learning algorithm, we simulate and recommend the best possible dose schedule over time.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-lg mb-2">4. Compare & Customize</h3>
            <p>Clinicians and patients can edit manual schedules and see how they compare to model-generated predictions.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
