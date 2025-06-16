export interface ResultsPostRequest {
    alias: string;
    budget: number;
    horizon: number;
    sgld: boolean;
    y_init?: number;
}