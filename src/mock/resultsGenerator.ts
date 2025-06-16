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
  // Constants from the real model
  const MAX_MAL = 5.0; // Maximum MAL score
  const SIG_SLOPE = 0.2; // Sigmoid slope parameter
  const SIG_OFFSET = -3; // Sigmoid offset parameter

  // Helper function to convert outcome to state (mimicking the real model)
  const outcomeToState = (y: number) => {
    const sigmoidInput = Math.log(y / MAX_MAL) - Math.log(1 - y / MAX_MAL);
    return (sigmoidInput - SIG_OFFSET) / SIG_SLOPE;
  };

  // Helper function to convert state to outcome (mimicking the real model)
  const stateToOutcome = (x: number) => {
    const sigmoid = 1 / (1 + Math.exp(-(SIG_SLOPE * x + SIG_OFFSET)));
    return MAX_MAL * sigmoid;
  };

  // Calculate the next state based on current state, action, and parameters
  const calculateNextState = (currentState: number, action: number, param: Record<string, number>) => {
    const a = param.a || 0.8; // Default value if not provided
    const b = param.b || 0.2; // Default value if not provided
    const c = param.c || 0.1; // Default value if not provided
    const noise = (Math.random() - 0.5) * 0.1; // Small random noise
    
    // State transition equation from the real model
    return a * currentState + b * action + c * y_init + noise;
  };

  // Generate predictions for future outcomes
  const futureOutcomes = futureActions.map((dose, i) => {
    // Use the corresponding parameter set for this prediction
    const param = params[i % params.length];
    
    // Convert current outcome to state
    const currentState = outcomeToState(y_init);
    
    // Calculate next state
    const nextState = calculateNextState(currentState, dose, param);
    
    // Convert back to outcome
    const nextOutcome = stateToOutcome(nextState);
    
    // Ensure outcome stays within reasonable bounds (0 to MAX_MAL)
    return Math.max(0, Math.min(MAX_MAL, nextOutcome));
  });

  // Calculate uncertainty bounds (similar to the real model's 95% confidence intervals)
  const maxOutcomes = futureOutcomes.map(outcome => 
    Math.min(MAX_MAL, outcome + 0.2 + Math.random() * 0.1)
  );
  const minOutcomes = futureOutcomes.map(outcome => 
    Math.max(0, outcome - 0.2 - Math.random() * 0.1)
  );

  return {
    future_outcomes: futureOutcomes,
    max_outcomes: maxOutcomes,
    min_outcomes: minOutcomes,
  };
}; 