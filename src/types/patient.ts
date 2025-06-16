export interface Patient {
    // User-defined on creation.
    name: string;
    budget: number;
    maxDose: number;
    age: number;
    weeksSinceStroke: number;
    leftStroke: boolean;
    male: boolean;

    // Fixed horizon.
    horizon: number;

    // Used to keep track of past data.
    past: boolean;
    outcomes: number[];
    actions: number[];

    // Created on registering model with mlflow.
    id: string;

    // Model data to sync with mlflow.
    modelBayesian: {
        modelAlias: string;
        modelUri: string;
    };
    modelSGLD: {
        modelAlias: string;
        modelUri: string;
    }
}