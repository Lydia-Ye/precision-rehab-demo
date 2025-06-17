export interface ModelPrediction {
  maxOut: number[];
  futureAvgOut: number[];
  minOut: number[];
  futureDoseData: number[];
}

export async function loadPredictionResults(patientId: string): Promise<{
  recommended?: ModelPrediction;
  manual?: ModelPrediction;
} | null> {
  try {
    const response = await fetch(`/api/prediction-results/${patientId}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (!data) {
      return null;
    }

    const results: {
      recommended?: ModelPrediction;
      manual?: ModelPrediction;
    } = {};

    // Process recommended schedule results
    if (data.recommended) {
      results.recommended = {
        maxOut: data.recommended.maxPrediction || [],
        futureAvgOut: data.recommended.meanPrediction || [],
        minOut: data.recommended.minPrediction || [],
        futureDoseData: data.recommended.dosage || []
      };
    }

    // Process manual schedule results
    if (data.manual) {
      results.manual = {
        maxOut: data.manual.max_outcomes || [],
        futureAvgOut: data.manual.median_trajectory || [],
        minOut: data.manual.min_outcomes || [],
        futureDoseData: data.manual.median_actions || []
      };
    }

    return results;
  } catch (error) {
    console.error(`Error loading prediction results for patient ${patientId}:`, error);
    return null;
  }
}

export function hasPredictionResults(patientId: string): boolean {
  // Check if prediction results exist for the given patient ID
  // For now, we know patients 11 and 12 have results
  return ["11", "12"].includes(patientId);
} 