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

// Helper function to generate predictions for manual schedules
export const generateManualScheduleResults = (
  y_init: number,
  pastActions: number[],
  futureActions: number[],
  params: Record<string, number>[]
) => {
  // Calculate the impact of each dose on the outcome
  const calculateDoseImpact = (dose: number, param: Record<string, number>) => {
    // Simulate a dose-response relationship
    const baseEffect = param.alpha * dose;
    const diminishingEffect = param.beta * Math.log(1 + dose);
    const interactionEffect = param.gamma * dose * y_init;
    return baseEffect + diminishingEffect + interactionEffect;
  };

  // Generate predictions for future outcomes
  const futureOutcomes = futureActions.map((dose, i) => {
    // Use the corresponding parameter set for this prediction
    const param = params[i % params.length];
    
    // Calculate the impact of this dose
    const impact = calculateDoseImpact(dose, param);
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 0.1;
    
    // Calculate the new outcome
    const newOutcome = y_init + impact + variation;
    
    // Ensure outcome stays within reasonable bounds (0 to 1)
    return Math.max(0, Math.min(1, newOutcome));
  });

  // Calculate min and max outcomes with some variance
  const maxOutcomes = futureOutcomes.map(outcome => 
    Math.min(1, outcome + 0.1 + Math.random() * 0.05)
  );
  const minOutcomes = futureOutcomes.map(outcome => 
    Math.max(0, outcome - 0.1 - Math.random() * 0.05)
  );

  return {
    future_outcomes: futureOutcomes,
    max_outcomes: maxOutcomes,
    min_outcomes: minOutcomes,
  };
}; 