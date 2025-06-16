import Link from "next/link";
import PredictChart from "@/components/PredictChart";
import { Patient } from "@/types/patient";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { useState, useEffect } from "react";

interface PatientPageProps {
  patient: Patient;
}

export default function PastPatientPage({ patient }: PatientPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((error) => console.error("Error loading patients:", error));
  }, []);

  const currentPatientIndex = patients.findIndex(p => p.id === patient.id);
  const hasNextPatient = currentPatientIndex < patients.length - 1;
  const hasPreviousPatient = currentPatientIndex > 0;

  const chartData = {
    labels: patient.outcomes.map((_, index) => `Treatment Week ${index + 1}`),
    datasets: [
      {
        type: "line" as const,
        label: "Observed MAL Score",
        backgroundColor: "rgb(65, 105, 225)",
        borderColor: "rgb(65, 105, 225)",
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: "y-left",
        borderDash: [],
        data: patient.outcomes,
      },
      {
        type: "bar" as const,
        label: "Treatment Hours",
        backgroundColor: "rgb(58, 218, 55)",
        borderColor: "white",
        yAxisID: "y-right",
        data: patient.actions,
      },
    ],
  };

  const totalDose = patient.actions.reduce((a, b) => a + b, 0);
  const finalMAL = Math.round(patient.outcomes[patient.outcomes.length - 1] * 1000) / 1000;
  const horizon = (patient.outcomes.length - 1)* 2;

  return (
    <main className="w-full max-w-screen-xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">
      
      {/* Left Column: Info */}
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500">Patient Detail</h2>
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Patient {patient.name}</h1>
          <Badge variant="past">PAST</Badge>
        </div>

        <div className="text-sm text-gray-600 space-y-3">
          <p><strong>Total Treatment Hours:</strong> {totalDose} hours</p>
          <p><strong>Final MAL Score:</strong> {finalMAL}</p>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-2 text-sm text-gray-500">
          <p>This patient's rehabilitation data was observed and recorded over the course of treatment.</p>
        </div>

        <Link href="/patient">
          <Button variant="primary">← Back to Patients Dashboard</Button>
        </Link>
      </div>

      {/* Right Column: Chart + Navigation */}
      <div className="w-full space-y-6">
        <div>
          <h3 className="text-xl font-semibold mt-8 mb-2">Treatment Timeline</h3>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Total Treatment Weeks:</strong> {horizon} treatment weeks
          </p>
          <PredictChart data={chartData} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          {hasPreviousPatient && (
            <Link href={`/patient/${Number(patient.id) - 1}`}>
              <Button variant="outline">← Previous Patient</Button>
            </Link>
          )}
          {!hasPreviousPatient && <div></div>}

          {hasNextPatient && (
            <Link href={`/patient/${Number(patient.id) + 1}`}>
              <Button variant="outline">Next Patient →</Button>
            </Link>
          )}
          {!hasNextPatient && <div></div>}
        </div>
      </div>

    </main>
  );
}
