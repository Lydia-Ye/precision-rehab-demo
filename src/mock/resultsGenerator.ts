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
      
      // Check if the file has the new structure with iterations
      if (results.iter_1) {
        // New structure: randomly select one iteration
        const iterations = Object.keys(results).filter(key => key.startsWith('iter_'));
        if (iterations.length > 0) {
          const randomIterKey = iterations[Math.floor(Math.random() * iterations.length)];
          const selectedIteration = results[randomIterKey];
          
          if (selectedIteration.last_param) {
            return {
              a: selectedIteration.last_param.a,
              b: selectedIteration.last_param.b,
              c: selectedIteration.last_param.c,
              noise: selectedIteration.last_param.noise_scale,
              sig_slope: selectedIteration.last_param.sig_slope,
              sig_offset: selectedIteration.last_param.sig_offset,
              error_scale: selectedIteration.last_param.error_scale
            };
          }
        }
      } else {
        // Old structure: use the data directly
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
    
    try {
      const resultsData = await fs.readFile(manualPath, "utf-8");
      const results = JSON.parse(resultsData);
      
      // Check if the file has the new structure with iterations
      if (results.iter_1) {
        // New structure: randomly select one iteration
        const iterations = Object.keys(results).filter(key => key.startsWith('iter_'));
        if (iterations.length > 0) {
          const randomIterKey = iterations[Math.floor(Math.random() * iterations.length)];
          const selectedIteration = results[randomIterKey];
          
          if (selectedIteration.last_param) {
            return {
              a: selectedIteration.last_param.a,
              b: selectedIteration.last_param.b,
              c: selectedIteration.last_param.c,
              noise: selectedIteration.last_param.noise_scale,
              sig_slope: selectedIteration.last_param.sig_slope,
              sig_offset: selectedIteration.last_param.sig_offset,
              error_scale: selectedIteration.last_param.error_scale
            };
          }
        }
      } else {
        // Old structure: use the data directly
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
      }
    } catch {
      // If manual file doesn't exist, return null
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
      b: 0.85, // Action effect parameter
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
    Math.min(MAX_MAL, meanPrediction[i] + 0.3 + Math.random() * 0.1)
  );

  const minPrediction = Array.from({ length: horizon }, (_, i) =>
    Math.max(0, meanPrediction[i] - 0.3 - Math.random() * 0.1)
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
  params: Record<string, number>[],
  recommendedActions?: number[],
  recommendedPredictions?: { mean: number[]; min: number[]; max: number[] },
) => {

    // if the actions are the same, use the recommended predictions
    if (recommendedActions && recommendedPredictions) {
      if (recommendedActions.every((action, i) => action === futureActions[i])) {
        return recommendedPredictions;
      }
    }

  // --- NEW: Try to load patient-specific parameters from file ---
  let fileParams: {
    a?: number;
    b?: number;
    c?: number;
    noise_scale?: number;
    noise?: number;
    sig_slope?: number;
    sig_offset?: number;
  } | null = null;
  if (patientId) {
    fileParams = await loadModelParamsFromFile(patientId);
  }

  // Use parameters from param, fallback to defaults if missing
  const a = fileParams?.a ?? 0.7;
  const b = fileParams?.b ?? 0.15;
  const c = fileParams?.c ?? 1.8;
  const noise_scale = fileParams?.noise_scale ?? fileParams?.noise ?? 0.3;
  const sig_slope = fileParams?.sig_slope ?? 0.2;
  const sig_offset = fileParams?.sig_offset ?? -3;
  const MAX_MAL = 5.0;

  // Helper functions for state <-> outcome
  const outcomeToState = (y: number) => (Math.log(y / MAX_MAL) - sig_offset) / sig_slope;
  const stateToOutcome = (x: number) => MAX_MAL * (1 / (1 + Math.exp(-(sig_slope * x + sig_offset))));

  // Number of simulations for uncertainty bounds (backend uses 100+)
  const NUM_SIMULATIONS = 100;

  // Store all simulated trajectories
  const allOutcomes = [];

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    let state = outcomeToState(y_init);
    let outcome = y_init;
    let budget_to_go = futureActions.reduce((a, b) => a + b, 0);

    const outcomes = [];
    for (let i = 0; i < futureActions.length; i++) {
      let action = futureActions[i];
      if (budget_to_go < action) action = budget_to_go;
      budget_to_go -= action;

      // Gaussian noise, mean 0, stddev = noise_scale
      const noise =
        noise_scale > 0
          ? (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())) * noise_scale
          : 0;

      // State transition
      state = a * state + b * action + c * outcome + noise;
      outcome = stateToOutcome(state);

      // Clamp outcome
      outcome = Math.max(0, Math.min(MAX_MAL, outcome));
      outcomes.push(outcome);
    }
    allOutcomes.push(outcomes);
  }

  // Convert allOutcomes to shape [NUM_SIMULATIONS, futureActions.length]
  // Compute percentiles for min/max, and median for main prediction
  const getPercentile = (arr: number[], p: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
  };

  // For each time step, collect all outcomes and compute percentiles
  const nSteps = futureActions.length;
  const future_outcomes: number[] = [];
  const min_outcomes: number[] = [];
  const max_outcomes: number[] = [];

  for (let t = 0; t < nSteps; t++) {
    const stepOutcomes = allOutcomes.map((traj) => traj[t]);
    // Median for main prediction
    future_outcomes.push(getPercentile(stepOutcomes, 50));
    // 2.5th and 97.5th percentiles for bounds
    min_outcomes.push(getPercentile(stepOutcomes, 2.5));
    max_outcomes.push(getPercentile(stepOutcomes, 97.5));
  }

  // --- Normalization/Blending Step ---
  console.log("Recommended actions", recommendedActions);
  console.log("Recommended predictions", recommendedPredictions);
  console.log("Future actions", futureActions);
  console.log("Future predictions", future_outcomes); 

  // Blend the first predicted value with the last observed value
  let blend_alpha = 0.6; // 0 = use prediction, 1 = use y_init, 0.5 = halfway

  if (recommendedActions && recommendedActions[0] < futureActions[0]) {
    blend_alpha = 1.8;
    // Calculate the difference between blended and original first point
    const original_first = future_outcomes[0];
    future_outcomes[0] = blend_alpha * y_init + (1 - blend_alpha) * future_outcomes[0];
    min_outcomes[0] = blend_alpha * y_init * 0.9 + (1 - blend_alpha) * min_outcomes[0];
    max_outcomes[0] = blend_alpha * y_init * 1.1 + (1 - blend_alpha) * max_outcomes[0];
    
    // Calculate the difference to propagate
    const first_point_diff = (future_outcomes[0] - original_first) * 1.2;
    
    // Propagate the difference to all subsequent points with decreasing effect
    for (let i = 1; i < future_outcomes.length; i++) {
      const decayFactor = Math.exp(-0.1 * i); // Exponential decay
      future_outcomes[i] += first_point_diff * decayFactor;
      min_outcomes[i] += first_point_diff * decayFactor;
      max_outcomes[i] += first_point_diff * decayFactor;
    }
  } else {
    blend_alpha = 0.5;
    
    // Calculate the difference between blended and original first point
    const original_first = future_outcomes[0];
    future_outcomes[0] = blend_alpha * y_init + (1 - blend_alpha) * future_outcomes[0];
    min_outcomes[0] = blend_alpha * y_init * 0.9 + (1 - blend_alpha) * min_outcomes[0];
    max_outcomes[0] = blend_alpha * y_init * 1.1 + (1 - blend_alpha) * max_outcomes[0];
    
    // Calculate the difference to propagate
    const first_point_diff = future_outcomes[0] - original_first;
    
    // Propagate the difference to all subsequent points
    for (let i = 1; i < future_outcomes.length; i++) {
      const decayFactor = Math.exp(-0.05 * i); // Exponential decay
      future_outcomes[i] += first_point_diff * decayFactor;
      min_outcomes[i] += first_point_diff * decayFactor;
      max_outcomes[i] += first_point_diff * decayFactor;
    }
  }


  return {
    future_outcomes,
    min_outcomes,
    max_outcomes,
  };
};