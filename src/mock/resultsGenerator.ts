// Helper function to generate mock results
export const generatePredictionResults = (patientId: string | undefined, budget: number, horizon: number, y_init: number) => {
  // Generate random but consistent results based on the patient ID or a default seed
  const seed = patientId ? 
    patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    Math.floor(Math.random() * 1000);

  // Create a seeded random number generator
  const random = (min: number, max: number) => {
    const x = Math.sin(seed + Math.random()) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  // Use y_init as the base prediction and add small variations for future predictions
  const basePrediction = y_init;
  const variance = 0.1; // Variance in predictions

  // Generate arrays of predictions for each time step
  // First value is y_init, subsequent values have small increases
  const maxPrediction = Array.from({ length: horizon }, (_, i) => 
    i === 0 ? y_init : basePrediction + variance + (i * 0.01)
  );
  const minPrediction = Array.from({ length: horizon }, (_, i) => 
    i === 0 ? y_init : basePrediction - variance + (i * 0.01)
  );
  const meanPrediction = Array.from({ length: horizon }, (_, i) => 
    i === 0 ? y_init : basePrediction + (i * 0.01)
  );

  return {
    maxPrediction,
    minPrediction,
    meanPrediction,
    dosage: Array.from({ length: horizon }, (_, i) => 
      (budget / horizon) * (1 + random(-0.1, 0.1)) * (i + 1) / horizon
    ),
  };
}; 