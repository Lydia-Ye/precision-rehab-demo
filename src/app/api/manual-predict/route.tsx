import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateManualScheduleResults } from "@/mock/resultsGenerator";

// Helper function to load manual prediction results from file
async function loadManualPredictionResults(patientId: string) {
  try {
    const resultsPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `manual_schedule_results_${patientId}.json`
    );
    
    const resultsData = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(resultsData);
    
    return {
      maxPrediction: results.max_outcomes,
      minPrediction: results.min_outcomes,
      meanPrediction: results.median_trajectory,
      dosage: results.median_actions,
    };
  } catch (error) {
    console.log(`Failed to load manual prediction results for patient ${patientId}:`, error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { id, params, y_init, future_actions } = data;

    // Try to load manual prediction results from file first
    let results = await loadManualPredictionResults(String(id));
    
    // If file loading fails, fall back to generating manual results
    if (!results) {
      const manualResults = generateManualScheduleResults(
        y_init,
        future_actions,
        params
      );
      
      // Map the results to match the expected format
      results = {
        maxPrediction: manualResults.max_outcomes,
        minPrediction: manualResults.min_outcomes,
        meanPrediction: manualResults.future_outcomes,
        dosage: future_actions,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Manual prediction error:", error);
    return NextResponse.json({ error: "Failed to generate manual predictions" }, { status: 500 });
  }
} 