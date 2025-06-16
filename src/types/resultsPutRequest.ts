export interface ResultsPutRequest {
    patientID: string;
    pastAvgOutState: number[];
    pastDoseDataState: (number|null)[];
}