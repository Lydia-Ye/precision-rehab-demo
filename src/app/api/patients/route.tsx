import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { PatientsPostRequest } from "@/types/patientsPostRoute";
import { PatientsPutRequest } from "@/types/patientsPutRequest";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

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
    newPatient.modelSGLD = {
      modelAlias: `${newPatient.id}_Patient_${newPatient.name.replace(/\s+/g, "_")}_SGLD_version_1`,
      modelUri: "",
    };

    // Register SGLD model with MLFlow.
    const context = [
      newPatient.age, // Age
      newPatient.weeksSinceStroke, // Weeks since stroke
      newPatient.leftStroke ? 1 : 0, // Binary: Left stroke
      newPatient.male ? 1 : 0, // Binary: Male
    ];
    const paramsSGLD = {
      budget: newPatient.budget,
      max_dose: newPatient.maxDose,
      alias: newPatient.modelSGLD.modelAlias,
      context: context,
      sgld: true,
    };
    const modelResponseSGLD = await fetch("http://localhost:5001/api/newpatient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paramsSGLD),
    });
    if (!modelResponseSGLD.ok) throw new Error("Failed to create SGLD model");
    newPatient.modelSGLD.modelUri = await modelResponseSGLD.text();

    // Register Bayesian model with MLFlow.
    const paramsBayes = {
      budget: newPatient.budget,
      max_dose: newPatient.maxDose,
      alias: newPatient.modelBayesian.modelAlias,
      sgld: false,
    };
    console.log("reached");
    const modelResponseBayes = await fetch("http://localhost:5001/api/newpatient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paramsBayes),
    });
    if (!modelResponseBayes.ok) throw new Error("Failed to create bayesian model");
    newPatient.modelBayesian.modelUri = await modelResponseBayes.text();

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

    if (data.sgld) {
      // Make request to update SGLD model.
      console.log("Updating SGLD Model");
      const paramsSGLD = {
        alias: data.aliasSGLD,
        actions: data.actions,
        init_outcome: data.initOutcome,
        context: data.context,
        max_dose: data.maxDose,
        sgld: true,
      };
      const responseSGLD = await fetch("http://localhost:5001/api/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paramsSGLD),
      });
      if (!responseSGLD.ok) throw new Error("Failed to obtain results");
      const resultsSGLD = await responseSGLD.json();

      // Update with new model metadata.
      patient.modelSGLD.modelAlias = resultsSGLD.new_alias;
      patient.modelSGLD.modelUri = resultsSGLD.new_uri;
    }

    // Make request to update Bayesian model.
    console.log("Updating Bayes Model");
    const paramsBayes = {
      alias: data.aliasBayesian,
      outcomes: data.outcomes,
      actions: data.actions,
      budget: data.budget,
      max_dose: data.maxDose,
      init_outcome: data.initOutcome,
      context: data.context,
      sgld: false,
    };
    const responseBayes = await fetch("http://localhost:5001/api/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paramsBayes),
    });
    if (!responseBayes.ok) {
      const responseError = await responseBayes.json();
      throw new Error(responseError.error);
    }
    const resultsBayes = await responseBayes.json();

    // Update with new model metadata.
    patient.modelBayesian.modelAlias = resultsBayes.new_alias;
    patient.modelBayesian.modelUri = resultsBayes.new_uri;

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
