export interface PredictionResult {
  patient_id: string;
  timestamp: string;
  schedule_type: "recommended" | "manual";
  last_param: Record<string, number>;
  past_outcomes: number[];
  past_actions: (number | null)[];
  y_init: number;
  maxPrediction?: number[];
  minPrediction?: number[];
  meanPrediction?: number[];
  dosage?: number[];
  future_actions?: number[];
  max_outcomes?: number[];
  min_outcomes?: number[];
  median_trajectory?: number[];
  median_actions?: number[];
  median_score?: number;
} 