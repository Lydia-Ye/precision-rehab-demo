import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateManualScheduleResults } from "@/mock/resultsGenerator";

// Helper function to load recommended prediction results from file
async function loadRecommendedPredictionResults(patientId: string) {
  try {
    const resultsPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `recommended_schedule_results_${patientId}.json`
    );

    const resultsData = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(resultsData);

    // If the file has iterations, pick a random one
    let iter = results;
    const iterKeys = Object.keys(results).filter(k => k.startsWith("iter_"));
    if (iterKeys.length > 0) {
      const randomKey = iterKeys[Math.floor(Math.random() * iterKeys.length)];
      iter = results[randomKey];
    }

    return {
      maxPrediction: iter.maxPrediction,
      minPrediction: iter.minPrediction,
      meanPrediction: iter.meanPrediction,
      dosage: iter.dosage,
    };
  } catch (error) {
    console.log(`Failed to load recommended prediction results for patient ${patientId}:`, error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { id, params, y_init, future_actions } = data;

    // Try to load recommended prediction results from file first
    const recommendedResults = await loadRecommendedPredictionResults(String(id));

    let results = null;

    if (recommendedResults) {
      results = await generateManualScheduleResults(
        String(id),
        y_init,
        future_actions,
        params,
        recommendedResults.dosage,
        // array of min, max, mean predictions
        {
          min: recommendedResults.minPrediction,
          mean: recommendedResults.meanPrediction,
          max: recommendedResults.maxPrediction
        }
      )
    } else {
      results = await generateManualScheduleResults(
        String(id),
        y_init,
        future_actions,
        params
      )
    }

    // Map the results to match the expected format
    results = {
      maxPrediction: results.max_outcomes,
      minPrediction: results.min_outcomes,
      meanPrediction: results.future_outcomes,
      dosage: future_actions,
    };

    return NextResponse.json(results);
  } catch (error) {
  console.error("Manual prediction error:", error);
  return NextResponse.json({ error: "Failed to generate manual predictions" }, { status: 500 });
}
} 