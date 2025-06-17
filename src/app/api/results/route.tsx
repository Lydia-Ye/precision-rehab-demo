import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { ResultsPostRequest } from "@/types/resultsPostRequest";
import { ResultsPostResponse } from "@/types/resultsPostResponse";
import { ResultsPutRequest } from "@/types/resultsPutRequest";
import { generatePredictionResults } from "@/mock/resultsGenerator";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

// Helper function to load prediction results from file
async function loadPredictionResults(patientId: string) {
  try {
    const resultsPath = path.join(
      process.cwd(),
      "src/mock/prediction_results",
      patientId,
      `recommended_schedule_results_${patientId}.json`
    );
    
    const resultsData = await fs.readFile(resultsPath, "utf-8");
    const results = JSON.parse(resultsData);
    
    // Check if the file has the new structure with iterations
    if (results.iter_1) {
      // New structure: randomly select one iteration
      const iterations = Object.keys(results).filter(key => key.startsWith('iter_'));
      if (iterations.length > 0) {
        const randomIterKey = iterations[Math.floor(Math.random() * iterations.length)];
        const selectedIteration = results[randomIterKey];
        
        return {
          maxPrediction: selectedIteration.maxPrediction,
          minPrediction: selectedIteration.minPrediction,
          meanPrediction: selectedIteration.meanPrediction,
          dosage: selectedIteration.dosage,
        };
      }
    } else {
      // Old structure: use the data directly
      return {
        maxPrediction: results.maxPrediction,
        minPrediction: results.minPrediction,
        meanPrediction: results.meanPrediction,
        dosage: results.dosage,
      };
    }
    
    return null;
  } catch (error) {
    console.log(`Failed to load prediction results for patient ${patientId}:`, error);
    return null;
  }
}

// POST route makes a request for recommended results.
export async function POST(req: Request) {
  try {
    const data: ResultsPostRequest = await req.json();

    // Read patient data from patients.json
    const patientsRaw = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(patientsRaw);
    const patient = patients.find((p: Patient) => p.id === data.id);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get the last outcome from the patient's data
    const lastOutcome = patient.outcomes && patient.outcomes.length > 0 
      ? patient.outcomes[patient.outcomes.length - 1] 
      : 0;

    // Format request params.
    const params = {
      patientId: data.id,
      budget: data.budget,
      horizon: data.horizon,
      y_init: lastOutcome,
    };

    // Try to load prediction results from file first
    let results = await loadPredictionResults(String(params.patientId));
    
    // If file loading fails, fall back to generating recommended results
    if (!results) {
      results = await generatePredictionResults(
        String(params.patientId),
        params.budget,
        params.horizon,
        params.y_init,
        patient.maxDose
      );
    }

    // Return results.
    const response: ResultsPostResponse = {
      message: "Results obtained",
      maxOutcome: results.maxPrediction,
      minOutcome: results.minPrediction,
      meanOutcome: results.meanPrediction,
      dosage: results.dosage,
    }
    return NextResponse.json(response);

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to obtain results" }, { status: 500 });
  }
}

// PUT route updates a patient's past results in the database.
export async function PUT(req: Request) {
  try {
    // Read request parameters.
    const data: ResultsPutRequest = await req.json();

    // Find existing patient record.
    const patientsRaw = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(patientsRaw);
    const patient = patients.find((p: Patient) => p.id === data.patientID);

    // Update patient record.
    patient.outcomes = data.pastAvgOutState;
    patient.actions = data.pastDoseDataState;

    // Persist new data to disk.
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    return NextResponse.json({ result: patient }, { status: 200 });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
