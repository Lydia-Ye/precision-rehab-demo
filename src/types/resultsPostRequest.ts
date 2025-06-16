export interface ResultsPostRequest {
    id: string | number;
    alias: string;
    budget: number;
    horizon: number;
    y_init?: number;
}