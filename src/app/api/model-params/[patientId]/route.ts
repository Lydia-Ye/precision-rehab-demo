import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    
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
            return NextResponse.json(selectedIteration.last_param);
          }
        }
      } else {
        // Old structure: use the data directly
        if (results.last_param) {
          return NextResponse.json(results.last_param);
        }
      }
    } catch {
      console.log(`No recommended schedule results for patient ${patientId}`);
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
            return NextResponse.json(selectedIteration.last_param);
          }
        }
      } else {
        // Old structure: use the data directly
        if (results.last_param) {
          return NextResponse.json(results.last_param);
        }
      }
    } catch {
      console.log(`No manual schedule results for patient ${patientId}`);
    }
    
    return NextResponse.json({ error: "No model parameters found" }, { status: 404 });
  } catch (error) {
    console.error("Error loading model parameters:", error);
    return NextResponse.json({ error: "Failed to load model parameters" }, { status: 500 });
  }
} 