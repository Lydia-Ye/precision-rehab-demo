import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { PatientsPostRequest } from "@/types/patientsPostRoute";
import { PatientsPutRequest } from "@/types/patientsPutRequest";
import { mockModelParams } from "@/mock/modelParams";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

// Helper function to generate mock model URI
const generateMockModelUri = (alias: string) => `mock://models/${alias}`;

// GET route fetches all the patients from the JSON file.
export async function GET() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(data);
    return NextResponse.json(patients);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

// POST route adds a new patient to the JSON file.
export async function POST(req: Request) {
  try {
    // Read new patient data.
    const requestData: PatientsPostRequest = await req.json();
    const newPatient = requestData as Patient;

    // Read existing patients JSON.
    const data = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(data);

    // Create ID and model metadata.
    newPatient.id = (patients.length + 1).toString();
    newPatient.modelBayesian = {
      modelAlias: `${newPatient.id}_Patient_${newPatient.name.replace(/\s+/g, "_")}_bayes_version_1`,
      modelUri: "",
    };

    // Mock Bayesian model registration
    newPatient.modelBayesian.modelUri = generateMockModelUri(newPatient.modelBayesian.modelAlias);
    mockModelParams[newPatient.modelBayesian.modelAlias] = {
      a: 0.7,
      b: 0.15,
      c: 1.8,
      noise_scale: 0.3,
      sig_slope: 0.2,
      sig_offset: -3.0,
      error_scale: 0.0,
    };

    // Push new patient to existing patients JSON.
    patients.push(newPatient);

    // Write back to JSON file.
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    return NextResponse.json({ message: "Patient added", patient: newPatient });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

// PUT route updates patient parameters with the Bayesian update model.
export async function PUT(req: Request) {
  try {
    const data: PatientsPutRequest = await req.json();

    // Removes null value from end of dosage if exists.
    if (data.actions[data.actions.length - 1] === null) {
      data.actions = data.actions.slice(0, data.actions.length - 1);
    }

    // Find current patient in database.
    const patientFileData = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(patientFileData);
    const patientIndex = patients.findIndex((p: Patient) => p.id === data.patientID);
    
    if (patientIndex === -1) {
      throw new Error("Patient not found");
    }

    const patient = patients[patientIndex];

    // Update all patient fields
    patient.name = data.name || patient.name;
    patient.budget = data.budget;
    patient.maxDose = data.maxDose;
    patient.age = data.context.age;
    patient.weeksSinceStroke = data.context.weeksSinceStroke;
    patient.leftStroke = data.context.leftStroke;
    patient.male = data.context.male;
    patient.horizon = data.horizon;

    // Mock Bayesian model update
    console.log("Updating Bayes Model");
    // Use a time-based version for the model alias, but do not keep appending suffixes
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    // Remove any previous _vYYYYMMDD_HHMMSS suffix from the alias
    const baseAlias = data.aliasBayesian.replace(/_v\d{8}_\d{6}$/, "");
    const newBayesAlias = `${baseAlias}_v${timestamp}`;
    patient.modelBayesian.modelAlias = newBayesAlias;
    patient.modelBayesian.modelUri = generateMockModelUri(newBayesAlias);

    // Update mock Bayesian parameters
    // Generate new random parameters for each update in the correct format
    function randomizeParam(base: number, spread: number = 0.2) {
      return +(base + (Math.random() - 0.5) * spread).toFixed(3);
    }
    const prevParams = mockModelParams[data.aliasBayesian] || {
      a: 0.7,
      b: 0.15,
      c: 1.8,
      noise_scale: 0.3,
      sig_slope: 0.2,
      sig_offset: -3.0,
      error_scale: 0.0,
    };
    mockModelParams[newBayesAlias] = {
      a: randomizeParam(prevParams.a),
      b: randomizeParam(prevParams.b),
      c: randomizeParam(prevParams.c, 0.5),
      noise_scale: randomizeParam(prevParams.noise_scale, 0.2),
      sig_slope: randomizeParam(prevParams.sig_slope, 0.05),
      sig_offset: randomizeParam(prevParams.sig_offset, 0.2),
      error_scale: randomizeParam(prevParams.error_scale, 0.05),
    };

    // Update the patient in the array
    patients[patientIndex] = patient;

    // Persist new data to disk with proper formatting
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    // Randomly select a new model id for the patient
    const modelDir = path.join(process.cwd(), "src/mock/prediction_results", data.patientID);
    let files = await fs.readdir(modelDir);
    files = files.filter(f => f.endsWith('.json'));
    const modelIds = files.map(f => f.replace('.json', ''));
    const currentModelId = data.modelId || '0';
    const otherModelIds = modelIds.filter(id => id !== currentModelId);
    let newModelId = currentModelId;
    if (otherModelIds.length > 0) {
      newModelId = otherModelIds[Math.floor(Math.random() * otherModelIds.length)];
    }

    // Return updated patient and new modelId
    return NextResponse.json({ message: "Patient updated", patient: patient, newModelId });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
