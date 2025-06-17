import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get('modelId') || '0';

    // Try to load from the new structure
    const resultsPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `${modelId}.json`
    );

    try {
      const resultsData = await fs.readFile(resultsPath, "utf-8");
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
      console.log(`No prediction results for patient ${patientId} with model ID ${modelId}`);
    }

    return NextResponse.json({ error: "No model parameters found" }, { status: 404 });
  } catch (error) {
    console.error("Error loading model parameters:", error);
    return NextResponse.json({ error: "Failed to load model parameters" }, { status: 500 });
  }
} 