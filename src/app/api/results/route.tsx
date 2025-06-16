import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { ResultsPostRequest } from "@/types/resultsPostRequest";
import { ResultsPostResponse } from "@/types/resultsPostResponse";
import { ResultsPutRequest } from "@/types/resultsPutRequest";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

// POST route makes a request for results using a model alias.
export async function POST(req: Request) {
  try {
    const data: ResultsPostRequest = await req.json();

    // Format request params.
    const params = {
      alias: data.alias,
      budget: data.budget,
      horizon: data.horizon,
      sgld: data.sgld,
      y_init: data.y_init, 
    };

    // Make request to mlflow model.
    const modelResponse = await fetch("http://localhost:5001/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!modelResponse.ok) throw new Error("Failed to obtain results");
    const results = await modelResponse.json();

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
