"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import CurrentPredictChart from "@/components/CurrentPredictChart";
import UpdateModelsForm from "@/components/UpdateModelsForm";
import UploadDataForm from "@/components/UploadDataForm";
import ModelInfoOverlay from "@/components/ModelInfoOverlay";
import PatientEditForm from "@/components/PatientEditForm";
import ManualScheduleForm from "@/components/ManualScheduleForm";
import PredictionSummary from "@/components/PredictionSummary";

import { Patient } from "@/types/patient";
import { ResultsPostRequest } from "@/types/resultsPostRequest";
import { ResultsPostResponse } from "@/types/resultsPostResponse";
import { PatientsPutRequest } from "@/types/patientsPutRequest";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { mockModelParams } from '@/mock/modelParams';

interface PatientPageProps {
  patient: Patient;
  setPatient: React.Dispatch<React.SetStateAction<Patient | null>>;
}
interface ModelPrediction {
  maxOut: number[];
  futureAvgOut: number[];
  minOut: number[];
  futureDoseData: number[];
}

export default function NewPatientPage({ patient, setPatient }: PatientPageProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [showPatientEdit, setShowPatientEdit] = useState(false);
  const [showManualScheduleForm, setShowManualScheduleForm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

const [bayesianParam, setBayesianParam] = useState<Record<string, number> | null>(null);
const [selectedModels, setSelectedModels] = useState({
  bayesian: false,
  sgld: false,
  manual: false,
});

useEffect(() => {
  const params = mockModelParams[patient.modelBayesian.modelAlias] || null;
  setBayesianParam(params);
}, [patient.modelBayesian.modelAlias]);


  // Closes dropdown element on clicking outside the component.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [resultsLoading, setResultsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);


  const [pastAvgOut, setPastAvgOut] = useState<number[]>(patient.outcomes);
  const [pastDoseData, setPastDoseData] = useState<number[]>(patient.actions);
  
  // Replace individual prediction states with combined states
  const [bayesianPrediction, setBayesianPrediction] = useState<ModelPrediction>({
    maxOut: [],
    futureAvgOut: [],
    minOut: [],
    futureDoseData: []
  });

  const [sgldPrediction, setSgldPrediction] = useState<ModelPrediction>({
    maxOut: [],
    futureAvgOut: [],
    minOut: [],
    futureDoseData: []
  });

  const [manualPrediction, setManualPrediction] = useState<ModelPrediction>({
    maxOut: [],
    futureAvgOut: [],
    minOut: [],
    futureDoseData: []
  });

  const plotManual = () => {
    setDropdownOpen(false);
    setShowManualScheduleForm(true);
  };

  const clearGraph = () => {
    setBayesianPrediction({
      maxOut: [],
      futureAvgOut: [],
      minOut: [],
      futureDoseData: []
    });
    setSgldPrediction({
      maxOut: [],
      futureAvgOut: [],
      minOut: [],
      futureDoseData: []
    });
    setManualPrediction({
      maxOut: [],
      futureAvgOut: [],
      minOut: [],
      futureDoseData: []
    });
    // Reset checkbox states
    setSelectedModels({
      bayesian: false,
      sgld: false,
      manual: false,
    });
  };

  const getResults = async (sgld: boolean) => {
    try {
      setDropdownOpen(false);
      setResultsLoading(true);
      const requestBody: ResultsPostRequest = {
        id: patient.id,
        alias: sgld ? patient.modelSGLD.modelAlias : patient.modelBayesian.modelAlias,
        budget: patient.budget - pastDoseData.reduce((acc, curr) => acc + curr, 0),
        horizon: patient.horizon - pastAvgOut.length + 1,
        y_init: pastAvgOut.at(-1),
      };
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error("Failed to obtain results");
      const data: ResultsPostResponse = await res.json();
      
      if (sgld) {
        setSgldPrediction({
          maxOut: data.maxOutcome,
          futureAvgOut: data.meanOutcome,
          minOut: data.minOutcome,
          futureDoseData: data.dosage
        });
      } else {
        setBayesianPrediction({
          maxOut: data.maxOutcome,
          futureAvgOut: data.meanOutcome,
          minOut: data.minOutcome,
          futureDoseData: data.dosage
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleManualSchedule = async (futureActions: number[]) => {
    try {
      const requestBody = {
        params: Array.from({ length: 10 }, () => ({ ...bayesianParam })),
        y_init: pastAvgOut.at(-1),
        past_actions: pastDoseData,
        future_actions: futureActions,
      };

      const res = await fetch("/api/manual-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error("Manual prediction failed");

      const data = await res.json();

      setManualPrediction({
        maxOut: data.max_outcomes,
        futureAvgOut: data.future_outcomes,
        minOut: data.min_outcomes,
        futureDoseData: futureActions
      });

    } catch (err) {
      console.error("Manual schedule prediction error:", err);
    }
  };

// Function to call PUT route to update models.
  const updateModels = async (newMaxDose: number, sgld: boolean) => {
    // Clear all prediction visualizations before updating
    setBayesianPrediction({ maxOut: [], futureAvgOut: [], minOut: [], futureDoseData: [] });
    setSgldPrediction({ maxOut: [], futureAvgOut: [], minOut: [], futureDoseData: [] });
    setManualPrediction({ maxOut: [], futureAvgOut: [], minOut: [], futureDoseData: [] });
    setSelectedModels({ bayesian: false, sgld: false, manual: false });
    try {
      setUpdateLoading(true);
      setUpdateProgress(0);

      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const requestBody: PatientsPutRequest = {
        patientID: patient.id,
        name: patient.name,
        aliasBayesian: patient.modelBayesian.modelAlias,
        aliasSGLD: patient.modelSGLD.modelAlias,
        outcomes: pastAvgOut,
        actions: pastDoseData,
        initOutcome: pastAvgOut[pastAvgOut.length - 1],
        budget: patient.budget,
        maxDose: newMaxDose,
        horizon: patient.horizon,
        context: {
          age: patient.age,
          weeksSinceStroke: patient.weeksSinceStroke,
          leftStroke: patient.leftStroke,
          male: patient.male,
        },
        sgld: sgld
      };

      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error("Failed to update model");
      const data = await res.json();
      setPatient(data.patient);
      setUpdateProgress(100); // Complete progress bar
      setTimeout(() => setUpdateProgress(0), 500); // Reset after short delay
    } catch (error) {
      console.error(error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const totalDose = pastDoseData.reduce((a, b) => a + b, 0);
  const currentMAL = Math.round(pastAvgOut[pastAvgOut.length - 1] * 1000) / 1000;

  const hasPastData = pastAvgOut.length > 0 && pastDoseData.length > 0;

  // Update past data when new data is uploaded.
  const handleDataUpdated = (newAvgOut: number[], newDoseData: (number|null)[]) => {
    setPastAvgOut(newAvgOut);
    setPastDoseData(newDoseData as number[]);
  };

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

  const handleCloseManualScheduleForm = () => {
    setShowManualScheduleForm(false);
    if (manualPrediction.futureAvgOut.length === 0) {
      setSelectedModels(prev => ({ ...prev, manual: false }));
    }
  };

  const [lastModelUpdate, setLastModelUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!patient?.id) return;
    const stored = localStorage.getItem(`lastModelUpdate_${patient.id}`);
    if (stored) setLastModelUpdate(stored);
  }, [patient?.id]);

  const updateModelTimestamp = () => {
    if (!patient?.id) return;
    const now = new Date().toISOString();
    setLastModelUpdate(now);
    localStorage.setItem(`lastModelUpdate_${patient.id}`, now);
  };

  return (
    <>
      {showManualScheduleForm && (
        <div className='fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50' onClick={handleCloseManualScheduleForm}>
          <div className='bg-white rounded-2xl shadow-lg p-6 text-center' onClick={(e) => e.stopPropagation()}>
            <ManualScheduleForm
              readonlyOutcomes={pastAvgOut}
              readonlyActions={pastDoseData}
              onSubmit={handleManualSchedule}
              setShowForm={setShowManualScheduleForm}
              maxDose={patient.maxDose}
              horizon={patient.horizon}
              budget={patient.budget}
              onClose={handleCloseManualScheduleForm}
            />
          </div>
        </div>
      )}

      {showUpdateForm && (
        <div
          className='fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50'
          onClick={() => setShowUpdateForm(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full'
            onClick={(e) => e.stopPropagation()}
          >
            <UpdateModelsForm
              setShowForm={setShowUpdateForm}
              updateModels={updateModels}
              updateModelTimestamp={updateModelTimestamp}
              patientId={patient.id}
              setShowModelInfo={setShowModelInfo}
            />
          </div>
        </div>
      )}

      {showUploadForm && (
        <div
          className='fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50'
          onClick={() => setShowUploadForm(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-lg p-6 max-w-3xl w-full'
            onClick={(e) => e.stopPropagation()}
          >
            <UploadDataForm
              patientID={patient.id}
              pastAvgOut={pastAvgOut}
              pastDoseData={pastDoseData}
              setShowForm={setShowUploadForm}
              onDataUpdated={handleDataUpdated}
              onRequestModelUpdate={() => updateModels(patient.maxDose, false)}
              updateModelTimestamp={updateModelTimestamp}
            />
          </div>
        </div>
      )}

      {showModelInfo && (
        <div
          className='fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50'
          onClick={() => setShowModelInfo(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full'
            onClick={(e) => e.stopPropagation()}
          >
            <ModelInfoOverlay
              patient={patient}
              setShowForm={setShowModelInfo}
              bayesianParam={bayesianParam}
            />
          </div>
        </div>
      )}

      {showPatientEdit && (
        <div
          className='fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50'
          onClick={() => setShowPatientEdit(false)}
        >
          <div
            className='bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full text-center'
            onClick={(e) => e.stopPropagation()}
          >
            <PatientEditForm
              patient={patient}
              setPatient={setPatient}
              setShowForm={setShowPatientEdit}
              updateModelTimestamp={updateModelTimestamp}
            />
          </div>
        </div>
      )}

      <main className="w-full max-w-screen-xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">
        {/* Left Column: Info */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-500">Patient Detail</h2>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Patient {patient.name}</h1>
            <Badge variant="active">ACTIVE</Badge>
          </div>

          <div className="text-sm text-gray-600 space-y-3">
            <p><strong>Total Treatment Weeks:</strong> {patient.horizon * 2} weeks</p>
            <p><strong>Total Treatment Hours:</strong> {totalDose} hours</p>
            <p><strong>Remaining Treatment Hours:</strong> {patient.budget - totalDose} hours</p>
            <p><strong>Latest observed MAL Score:</strong> {currentMAL}</p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-56"
              variant="secondary"
              onClick={() => setShowPatientEdit(true)}
            >
              Patient Details
            </Button>

            <Button
              onClick={() => setShowUploadForm(true)}
              variant="secondary"
              className="w-56"
            >
              Observed Data
            </Button>

            <Button
              className="w-56"
              variant="secondary"
              onClick={() => setShowUpdateForm(true)}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <p>Updating Models...</p>
                  <div
                    className='absolute bottom-0 left-0 h-1 bg-white transition-all duration-300 ease-out'
                    style={{ width: `${updateProgress}%` }}
                  />
                </>
              ) : (
                <p>Prediction Model</p>
              )}
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                Predict Recovery Outcomes
              </h2>
              <div className="relative group">
                <span className="text-gray-400 cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </span>
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-64 p-2 bg-[var(--foreground)]/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                  The model uses Bayesian reinforcement learning to predict recovery outcomes based on treatment schedules and patient data.
                </div>
              </div>
            </div>

            {!hasPastData && (
              <div className="text-xs text-red-500 mb-2">Please upload patient data before predicting outcomes.</div>
            )}
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedModels.bayesian}
                  onChange={(e) => {
                    if (!hasPastData) return;
                    setSelectedModels(prev => ({ ...prev, bayesian: e.target.checked }));
                    if (e.target.checked) {
                      getResults(false);
                    } else {
                      setBayesianPrediction({
                        maxOut: [],
                        futureAvgOut: [],
                        minOut: [],
                        futureDoseData: []
                      });
                    }
                  }}
                  className="form-checkbox text-green-600"
                  disabled={!hasPastData}
                />
                <span className="text-sm text-gray-700">Recommended Schedule</span>
                <div className="relative group">
                  <span className="text-gray-400 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-64 p-2 bg-[var(--foreground)]/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                    AI-recommended treatment schedule optimized for maximum recovery potential.
                  </div>
                </div>
              </label>
              <br />
              
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedModels.manual}
                  onChange={(e) => {
                    if (!hasPastData) return;
                    setSelectedModels(prev => ({ ...prev, manual: e.target.checked }));
                    if (e.target.checked) {
                      plotManual();
                    } else {
                      setManualPrediction({
                        maxOut: [],
                        futureAvgOut: [],
                        minOut: [],
                        futureDoseData: []
                      });
                    }
                  }}
                  className="form-checkbox text-green-600"
                  disabled={!hasPastData}
                />
                <span className="text-sm text-gray-700">Manual Schedule</span>
                <div className="relative group">
                  <span className="text-gray-400 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 w-64 p-2 bg-[var(--foreground)]/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                    Create and test your own custom treatment schedule.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <Button
            className="mt-4"
            variant="danger"
            onClick={() => clearGraph()}
            style={{ display: (bayesianPrediction.futureAvgOut.length > 0 || 
                              sgldPrediction.futureAvgOut.length > 0 || 
                              manualPrediction.futureAvgOut.length > 0) ? 'block' : 'none' }}
          >
            Clear Prediction
          </Button>
          
          {/* TODO: Add data table */}           
          {/* <Button
            className="mt-4"
          >
            Show Data Table
          </Button> */} 

          <div>
            <Link href="/patient">
              <Button variant="primary">← Back to Patients Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className='w-full'>
          <h3 className="text-xl font-semibold mb-2">Treatment Timeline</h3>
          <CurrentPredictChart
            pastAvgOut={pastAvgOut}
            pastDoseData={pastDoseData}
            bayesianPrediction={bayesianPrediction}
            sgldPrediction={sgldPrediction}
            manualPrediction={manualPrediction}
            horizon={patient.horizon}
          />

          <PredictionSummary
            pastAvgOut={pastAvgOut}
            bayesianPrediction={bayesianPrediction}
            manualPrediction={manualPrediction}
          />

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
    </>
  );
}