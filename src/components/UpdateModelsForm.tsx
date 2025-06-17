"use client"

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import ModelInfoDropdown from "@/components/ModelInfoDropdown";

interface UpdateModelsFormProps {
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>; 
    updateModels: (newMaxDose: number, sgld: boolean) => Promise<void>;
    updateModelTimestamp: () => void;
    patientId: string;
    setShowModelInfo: React.Dispatch<React.SetStateAction<boolean>>;
}

function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

export default function UpdateModelsForm({ setShowForm, updateModels, updateModelTimestamp, patientId, setShowModelInfo }: UpdateModelsFormProps) {
    // Loading for updating patient models.
    const [updateLoading, setUpdateLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [bayesianParam, setBayesianParam] = useState<Record<string, number> | null>(null);

    // Dropdown state.
    const dropdownRef = useRef<HTMLDivElement>(null);

    const MAX_DOSE = 20;
    const SIMULATED_DELAY = 5000; // 3 seconds delay
    const ITERATIONS = 5; // Number of iterations to simulate

    // Fetch bayesianParam for this patientId
    useEffect(() => {
        if (!patientId) return;
        fetch(`/api/model-params/${patientId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setBayesianParam(data))
            .catch(() => setBayesianParam(null));
    }, [patientId, lastUpdate]);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // setDropdownOpen(false);
      }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (updateLoading) {
            setProgress(0);
            setStatusMessage("Initializing model update...");
            
            // Simulate the update process with different stages
            const stages = [
                { progress: 30, message: "Updating prediction model..." },
                { progress: 80, message: "Finalizing update..." }
            ];

            let currentStage = 0;
            interval = setInterval(() => {
                if (currentStage < stages.length) {
                    setProgress(stages[currentStage].progress);
                    setStatusMessage(stages[currentStage].message);
                    currentStage++;
                } else {
                    clearInterval(interval!);
                }
            }, SIMULATED_DELAY / stages.length);
        } else {
            setProgress(100);
            setTimeout(() => setProgress(0), 400);
            setTimeout(() => setStatusMessage("") , 400);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [updateLoading]);

    // Load last update time from localStorage on mount
    useEffect(() => {
        if (!patientId) return;
        const stored = localStorage.getItem(`lastModelUpdate_${patientId}`);
        if (stored) setLastUpdate(stored);
    }, [patientId]);

    // Function when submitting update.
    const submitForm = async (sgld: boolean) => {
        setUpdateLoading(true);
        setStatusMessage("Updating prediction model...");
        try {
            // Simulate the update process with delay
            await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
            
            // Randomly select an iteration number for the model parameters
            const selectedIteration = Math.floor(Math.random() * ITERATIONS) + 1;
            console.log(`Selected model parameters from iteration ${selectedIteration}`);
            
            await updateModels(MAX_DOSE, sgld);
            updateModelTimestamp();
            const now = new Date().toISOString();
            setLastUpdate(now);
            localStorage.setItem(`lastModelUpdate_${patientId}`, now);
        } catch (error) {
            console.error(error);
        } finally {
            setUpdateLoading(false);
            setShowForm(false);
        }
    }

    return (
        <form className="mb-4 space-y-6 min-w-[380px] max-w-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold">Treatment Model</h2>
         
                <Button
                    type="button"
                    variant="danger"
                    onClick={() => setShowForm(false)}
                    className="ml-auto"
                >
                    Close
                </Button>
            </div>

            <div className="text-sm text-gray-500 border-t border-[var(--color-border)] pt-4">
                <p>
                    The model learns from each observed dose and outcome, updating its predictions using Bayesian reinforcement learning to support personalized rehabilitation planning.
                </p>

                {/* Inline dropdown for model parameters */}
                <ModelInfoDropdown patient={{ id: patientId } as any} bayesianParam={bayesianParam} />

                {lastUpdate && (
                    <p className="mt-2 text-green-700 font-medium">Last model update: {formatDateTime(lastUpdate)}</p>
                )}
            </div>


            {/* Single Button for Bayesian Model Update */}
            <Button
                type="button"
                variant="primary"
                className="w-full flex justify-center items-center"
                onClick={() => submitForm(false)}
                disabled={updateLoading}
            >
                {updateLoading ? (
                    <span className="flex items-center justify-center w-full">
                        <span className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Updating...
                    </span>
                ) : (
                    <>Update Treatment Model</>
                )}
            </Button>

            {/* Progress Bar and Status Message */}
            {updateLoading && statusMessage && (
                <div className="w-full flex justify-center z-20 mb-2 mt-4">
                    <div className="max-w-lg w-full mx-auto px-6 py-3 bg-green-50 border border-green-300 rounded-lg shadow text-green-900 text-base font-semibold flex items-center justify-center text-center tracking-wide" style={{letterSpacing: '0.01em', fontSize: '1.1rem'}}>
                        {statusMessage}
                    </div>
                </div>
            )}
            {updateLoading && (
                <div className="w-full h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                    <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </form>
    )
}