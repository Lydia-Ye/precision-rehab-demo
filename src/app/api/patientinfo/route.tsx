import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { Patient } from "@/types/patient";
import { PatientinfoPutRequest } from "@/types/patientinfoRoute";

const filePath = path.join(process.cwd(), "src/app/api/data/patients.json");

// PUT route updates patient information without affecting the model.
export async function PUT(req: Request) {
  try {
    const data: PatientinfoPutRequest = await req.json();

    // Find current patient in database.
    const patientFileData = await fs.readFile(filePath, "utf-8");
    const patients = JSON.parse(patientFileData);
    const patient: Patient = patients.find((p: Patient) => p.id === data.patientID);

    // Update patient horizon.
    patient.horizon = data.newHorizon;

    // Persist new data to disk.
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    // Return new patient.
    return NextResponse.json({ message: "Patient info updated", patient: patient });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed to update patient info" }, { status: 500 });
  }
}