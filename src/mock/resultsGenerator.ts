import fs from 'fs/promises';
import path from 'path';

// Helper function to load model parameters from prediction results files
async function loadModelParamsFromFile(patientId: string) {
  try {
    // Try to load from recommended schedule results first
    const recommendedPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `recommended_schedule_results_${patientId}.json`
    );
    
    try {
      const resultsData = await fs.readFile(recommendedPath, "utf-8");
      const results = JSON.parse(resultsData);
      
      if (results.last_param) {
        return {
          a: results.last_param.a,
          b: results.last_param.b,
          c: results.last_param.c,
          noise: results.last_param.noise_scale,
          sig_slope: results.last_param.sig_slope,
          sig_offset: results.last_param.sig_offset,
          error_scale: results.last_param.error_scale
        };
      }
    } catch {
      // If recommended file doesn't exist, try manual schedule results
    }

    // Try to load from manual schedule results
    const manualPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `manual_schedule_results_${patientId}.json`
    );
    
    const resultsData = await fs.readFile(manualPath, "utf-8");
    const results = JSON.parse(resultsData);
    
    if (results.last_param) {
      return {
        a: results.last_param.a,
        b: results.last_param.b,
        c: results.last_param.c,
        noise: results.last_param.noise_scale,
        sig_slope: results.last_param.sig_slope,
        sig_offset: results.last_param.sig_offset,
        error_scale: results.last_param.error_scale
      };
    }
    
    return null;
  } catch (error) {
    console.log(`Failed to load model parameters for patient ${patientId}:`, error);
    return null;
  }
}

// Helper function to generate mock results
export const generatePredictionResults = async (
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

  // Get model parameters from prediction results files
  const getModelParams = async () => {
    // If we have a patient ID, try to get their specific parameters from files
    if (patientId) {
      const params = await loadModelParamsFromFile(patientId);
      if (params) {
        return {
          a: params.a,
          b: params.b,
          c: params.c,
          noise: params.noise * 0.1 // Scale down noise for ensemble
        };
      }
    }
    
    // If no specific parameters found, use a default set based on real data patterns
    return {
      a: 0.7, // State transition parameter
      b: 0.15, // Action effect parameter
      c: 1.8, // Outcome effect parameter
      noise: 0.3
    };
  };

  // Generate predictions for each model in the ensemble
  const params = await getModelParams();
  const ensemblePredictions = Array.from({ length: NUM_SIMULATIONS }, () => {
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
  const maxPrediction = Array.from({ length: horizon }, (_, i) =>
    Math.min(MAX_MAL, meanPrediction[i] + 0.2 + Math.random() * 0.1)
  );

  const minPrediction = Array.from({ length: horizon }, (_, i) =>
    Math.max(0, meanPrediction[i] - 0.2 - Math.random() * 0.1)
  );

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
export const generateManualScheduleResults = async (
  patientId: string | undefined,
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

  // Get model parameters from prediction results files
  const getModelParams = async () => {
    if (patientId) {
      const fileParams = await loadModelParamsFromFile(patientId);
      if (fileParams) {
        return {
          a: fileParams.a,
          b: fileParams.b,
          c: fileParams.c,
          noise: fileParams.noise
        };
      }
    }
    
    // If no specific parameters found, use a default set based on real data patterns
    return {
      a: 0.7,
      b: 0.15,
      c: 1.8,
      noise: 0.3
    };
  };

  // Calculate the next state based on current state, action, and parameters
  const calculateNextState = async (currentState: number, action: number, param: Record<string, number>) => {
    // Get the actual model parameters from files if available
    const modelParams = await getModelParams();
    
    // Use the provided parameters if they have the right format, otherwise use file parameters
    const a = param.alpha || param.a || modelParams.a;
    const b = param.beta || param.b || modelParams.b;
    const c = param.gamma || param.c || modelParams.c;
    const noise = (Math.random() - 0.5) * (param.delta || param.noise || modelParams.noise);
    
    // State transition equation from the real model
    return a * currentState + b * action + c * y_init + noise;
  };

  // Generate predictions for future outcomes
  const futureOutcomes = [];
  for (let i = 0; i < futureActions.length; i++) {
    // Use the corresponding parameter set for this prediction
    const param = params[i % params.length];
    
    // Convert current outcome to state
    const currentState = outcomeToState(y_init);
    
    // Calculate next state
    const nextState = await calculateNextState(currentState, futureActions[i], param);
    
    // Convert back to outcome
    const nextOutcome = stateToOutcome(nextState);
    
    // Ensure outcome stays within reasonable bounds (0 to MAX_MAL)
    futureOutcomes.push(Math.max(0, Math.min(MAX_MAL, nextOutcome)));
  }

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