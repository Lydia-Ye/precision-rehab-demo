import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { ResultsPostRequest } from "@/types/resultsPostRequest";
import { ResultsPostResponse } from "@/types/resultsPostResponse";
import { ResultsPutRequest } from "@/types/resultsPutRequest";
import { mockResults } from "@/mock/results";
import { generatePredictionResults } from "@/mock/resultsGenerator";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

// POST route makes a request for results using a model alias.
export async function POST(req: Request) {
  try {
    const data: ResultsPostRequest = await req.json();

    // Format request params.
    const params = {
      patientId: data.id,
      alias: data.alias,
      budget: data.budget,
      horizon: data.horizon,
      y_init: data.y_init, 
    };

    // Get mock results - either from predefined data or generate new ones
    let results = mockResults[params.patientId];
    if (!results) {
      results = generatePredictionResults(params.patientId, params.budget, params.horizon, params.y_init);
      // Store the generated results for future use
      mockResults[params.patientId] = results;
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
