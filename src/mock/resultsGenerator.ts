import { mockModelParams } from './modelParams';

// Helper function to generate mock results
export const generatePredictionResults = (
  patientId: string | undefined, 
  budget: number, 
  horizon: number, 
  y_init: number, 
  maxDose: number,
) => {
  // Constants from the real model
  const MAX_MAL = 5.0; // Maximum MAL score
  const SIG_SLOPE = 0.2; // Sigmoid slope parameter
  const SIG_OFFSET = -3; // Sigmoid offset parameter
  const NUM_SIMULATIONS = 10; // Number of models in ensemble

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

  // Get model parameters from mock data
  const getModelParams = () => {
    // If we have a patient ID, try to get their specific parameters
    if (patientId) {
      const modelAlias = `${patientId}_Patient_${patientId}_bayes_version_1`;
      const params = mockModelParams[modelAlias];
      if (params) {
        return {
          a: params.alpha,
          b: params.beta,
          c: params.gamma,
          noise: params.delta * 0.1 // Scale down delta for noise
        };
      }
    }
    
    // If no specific parameters found, use a default set
    return {
      a: 0.8,
      b: 0.2,
      c: 0.1,
      noise: 0.1
    };
  };

  // Generate predictions for each model in the ensemble
  const ensemblePredictions = Array.from({ length: NUM_SIMULATIONS }, () => {
    const params = getModelParams();
    const outcomes = [y_init];
    const actions = [];
    let remainingBudget = budget;

    // Generate trajectory
    for (let i = 0; i < horizon; i++) {
      // Allocate the maximum possible dose each week
      const action = Math.min(maxDose, remainingBudget);
      actions.push(action);
      remainingBudget -= action;

      // Calculate next state and outcome
      const currentState = outcomeToState(outcomes[i]);
      const nextState = params.a * currentState + 
                       params.b * action + 
                       params.c * outcomes[i] + 
                       (Math.random() - 0.5) * params.noise;
      const nextOutcome = stateToOutcome(nextState);
      outcomes.push(Math.max(0, Math.min(MAX_MAL, nextOutcome)));
    }

    return { outcomes: outcomes.slice(0, horizon), actions };
  });

  // Stack predictions and compute statistics
  const stackedOutcomes = ensemblePredictions.map(p => p.outcomes);
  const meanPrediction = Array.from({ length: horizon }, (_, i) => {
    const values = stackedOutcomes.map(p => p[i]);
    return values.reduce((a, b) => a + b, 0) / values.length;
  });

  // Calculate 95% confidence intervals
  const maxPrediction = Array.from({ length: horizon }, (_, i) => {
    const values = stackedOutcomes.map(p => p[i]);
    return Math.min(MAX_MAL, meanPrediction[i] + 0.2 + Math.random() * 0.1);
  });

  const minPrediction = Array.from({ length: horizon }, (_, i) => {
    const values = stackedOutcomes.map(p => p[i]);
    return Math.max(0, meanPrediction[i] - 0.2 - Math.random() * 0.1);
  });

  // Select a representative action sequence
  const selectedActions = ensemblePredictions[Math.floor(Math.random() * NUM_SIMULATIONS)].actions;

  return {
    maxPrediction,
    minPrediction,
    meanPrediction,
    dosage: selectedActions,
  };
};

// Helper function to generate predictions for manual schedules
export const generateManualScheduleResults = (
  y_init: number,
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
    // Use the mock parameters if available, otherwise use defaults
    const a = param.alpha || 0.8;
    const b = param.beta || 0.2;
    const c = param.gamma || 0.1;
    const noise = (Math.random() - 0.5) * (param.delta || 0.1);
    
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