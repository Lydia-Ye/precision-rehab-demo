"use client"

import { Patient } from "@/types/patient";
import Button from "@/components/ui/Button";

interface ModelInfoOverlayProps {
    patient: Patient;
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>; 
    bayesianParam?: Record<string, number> | null;
}

export default function ModelInfoOverlay({
  patient,
  setShowForm,
  bayesianParam 
}: ModelInfoOverlayProps) {
    return (
        <div className="flex flex-col gap-8 min-w-[380px] max-w-lg mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-4">
                <h2 className="text-2xl font-bold text-center w-full">Model Info</h2>
                <Button
                    type="button"
                    variant="danger"
                    onClick={() => setShowForm(false)}
                    className="ml-auto"
                >
                    Close
                </Button>
            </div>

            {/* Model Alias */}
            <div className="flex flex-col items-center gap-2">
                <h3 className="font-semibold text-xl mb-1 text-center">Current Bayesian Model:</h3>
                <div className="text-base font-mono text-gray-700 break-all text-center">{patient.modelBayesian.modelAlias}</div>
            </div>

            {/* Model Parameters */}
            {bayesianParam && (
                <div className="flex flex-col items-center mt-2">
                    <h3 className="font-semibold text-lg mb-2 text-center">Bayesian Model Parameters:</h3>
                    <ul className="text-base space-y-1 text-center">
                        {Object.entries(bayesianParam).map(([key, value]) => (
                            <li key={key}>
                                <span className="font-semibold">{key}:</span> <span className="font-mono">{value.toFixed(3)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}