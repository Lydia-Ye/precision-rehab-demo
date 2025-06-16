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
      alpha: 0.8,
      beta: 0.2,
      gamma: 0.5,
      delta: 1.2,
      eta: 0.1,
      zeta: 0.9,
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
    const newBayesAlias = `${data.aliasBayesian}_updated`;
    patient.modelBayesian.modelAlias = newBayesAlias;
    patient.modelBayesian.modelUri = generateMockModelUri(newBayesAlias);

    // Update mock Bayesian parameters
    const mockParams = mockModelParams[data.aliasBayesian] || {
      alpha: 0.8,
      beta: 0.2,
      gamma: 0.5,
      delta: 1.2,
      eta: 0.1,
      zeta: 0.9,
    };
    mockModelParams[newBayesAlias] = mockParams;

    // Update the patient in the array
    patients[patientIndex] = patient;

    // Persist new data to disk with proper formatting
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    // Return updated patient
    return NextResponse.json({ message: "Patient updated", patient: patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
