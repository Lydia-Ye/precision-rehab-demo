import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Define interfaces for the prediction result structures
interface LastParam {
  a: number;
  b: number;
  c: number;
  noise_scale: number;
  sig_slope: number;
  sig_offset: number;
  error_scale: number;
}

interface RecommendedScheduleResult {
  patient_id: string;
  timestamp: string;
  schedule_type: "recommended";
  last_param: LastParam;
  past_outcomes: number[];
  past_actions: (number | null)[];
  y_init: number;
  maxPrediction: number[];
  minPrediction: number[];
  meanPrediction: number[];
  dosage: number[];
}

interface ManualScheduleResult {
  patient_id: string;
  timestamp: string;
  schedule_type: "manual";
  last_param: LastParam;
  past_outcomes: number[];
  past_actions: (number | null)[];
  y_init: number;
  future_actions: number[];
  max_outcomes: number[];
  min_outcomes: number[];
  median_trajectory: number[];
  median_actions: number[];
  median_score: number;
}

interface PredictionResults {
  recommended?: RecommendedScheduleResult;
  manual?: ManualScheduleResult;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    
    const results: PredictionResults = {};

    // Load recommended schedule results
    const recommendedPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `recommended_schedule_results_${patientId}.json`
    );
    
    try {
      const recommendedData = await fs.readFile(recommendedPath, "utf-8");
      const recommendedResults = JSON.parse(recommendedData);
      
      // Check if the file has the new structure with iterations
      if (recommendedResults.iter_1) {
        // New structure: randomly select one iteration
        const iterations = Object.keys(recommendedResults).filter(key => key.startsWith('iter_'));
        if (iterations.length > 0) {
          const randomIterKey = iterations[Math.floor(Math.random() * iterations.length)];
          results.recommended = recommendedResults[randomIterKey];
        }
      } else {
        // Old structure: use the data directly
        results.recommended = recommendedResults;
      }
    } catch (error) {
      console.log(`No recommended schedule results for patient ${patientId}:`, error);
    }

    // Load manual schedule results
    const manualPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `manual_schedule_results_${patientId}.json`
    );
    
    try {
      const manualData = await fs.readFile(manualPath, "utf-8");
      const manualResults = JSON.parse(manualData);
      
      // Check if the file has the new structure with iterations
      if (manualResults.iter_1) {
        // New structure: randomly select one iteration
        const iterations = Object.keys(manualResults).filter(key => key.startsWith('iter_'));
        if (iterations.length > 0) {
          const randomIterKey = iterations[Math.floor(Math.random() * iterations.length)];
          results.manual = manualResults[randomIterKey];
        }
      } else {
        // Old structure: use the data directly
        results.manual = manualResults;
      }
    } catch (error) {
      console.log(`No manual schedule results for patient ${patientId}:`, error);
    }

    if (Object.keys(results).length === 0) {
      return NextResponse.json({ error: "No prediction results found" }, { status: 404 });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error loading prediction results:", error);
    return NextResponse.json({ error: "Failed to load prediction results" }, { status: 500 });
  }
} 