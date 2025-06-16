"use client"

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";

import { Patient } from "@/types/patient";
import PastPatientPage from "@/components/PastPatientPage";
import NewPatientPage from "@/components/NewPatientPage";

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default function PatientPage({ params }: PatientPageProps) {
  // Obtain ID parameter.
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Patient information.
  const [patient, setPatient] = useState<Patient|null>(null);

  // Page is loading while patient data is being fetched.
  const [loading, setLoading] = useState(true);
  
  // Fetch patients from JSON file
  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => {
        const patient = data.find((p: Patient) => p.id === id);

        // Show 404 if patient doesn't exist.
        if (!patient) return notFound();

        setPatient(patient);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading patients:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {loading || !patient ? 
        (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">Loading patient data...</p>
            </div>
          </div>
        ) 
        : 
        (
          <>
            {patient.past ? 
              (
                <PastPatientPage patient={patient} />
              ) 
              : 
              (
                <NewPatientPage patient={patient} setPatient={setPatient} />         
              )
            } 
          </>         
        )
      }    
    </div>
  );
}