export interface PatientsPutRequest {
    patientID: string;
    name: string;
    aliasBayesian: string;
    aliasSGLD: string;
    outcomes: number[];
    actions: number[];
    initOutcome: number;
    budget: number;
    maxDose: number;
    horizon: number;
    context: {
        age: number;
        weeksSinceStroke: number;
        leftStroke: boolean;
        male: boolean;
    },
    sgld: boolean,
    modelId?: string;
}