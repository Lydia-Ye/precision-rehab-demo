export interface ModelPrediction {
  maxOut: number[];
  futureAvgOut: number[];
  minOut: number[];
  futureDoseData: number[];
  currentModelId: string;
}

export async function loadPredictionResults(patientId: string, modelId: string = '0'): Promise<{
  recommended?: ModelPrediction;
} | null> {
  try {
    const response = await fetch(`/api/prediction-results/${patientId}?modelId=${modelId}`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (!data) {
      return null;
    }

    const results: {
      recommended?: ModelPrediction;
    } = {};

    // Process recommended schedule results
    if (data.recommended) {
      results.recommended = {
        maxOut: data.recommended.maxPrediction || [],
        futureAvgOut: data.recommended.meanPrediction || [],
        minOut: data.recommended.minPrediction || [],
        futureDoseData: data.recommended.dosage || [],
        currentModelId: modelId
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