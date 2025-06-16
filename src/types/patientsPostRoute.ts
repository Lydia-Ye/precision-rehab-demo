// Similar to Patient interface except with id and model parameters to be filled in later.
export interface PatientsPostRequest {
    name: string;
    budget: number;
    maxDose: number;
    age: number;
    weeksSinceStroke: number;
    leftStroke: boolean;
    male: boolean;

    horizon: number;

    past: boolean;
    outcomes: number[];
    actions: number[];
}

export interface PatientsPostResponse {

}