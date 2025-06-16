// Mock results data for each patient, keyed by patient ID
export const mockResults: Record<string, {
  maxPrediction: number[];
  minPrediction: number[];
  meanPrediction: number[];
  dosage: number[];
}> = {
  "11": {
    maxPrediction: [0.85, 0.86, 0.87, 0.88, 0.89],
    minPrediction: [0.65, 0.66, 0.67, 0.68, 0.69],
    meanPrediction: [0.75, 0.76, 0.77, 0.78, 0.79],
    dosage: [0.2, 0.3, 0.4, 0.5, 0.6],
  },
  "12": {
    maxPrediction: [0.82, 0.83, 0.84, 0.85, 0.86],
    minPrediction: [0.62, 0.63, 0.64, 0.65, 0.66],
    meanPrediction: [0.72, 0.73, 0.74, 0.75, 0.76],
    dosage: [0.15, 0.25, 0.35, 0.45, 0.55],
  },
  "13": {
    maxPrediction: [0.88, 0.89, 0.90, 0.91, 0.92],
    minPrediction: [0.68, 0.69, 0.70, 0.71, 0.72],
    meanPrediction: [0.78, 0.79, 0.80, 0.81, 0.82],
    dosage: [0.25, 0.35, 0.45, 0.55, 0.65],
  },
  "14": {
    maxPrediction: [0.79, 0.80, 0.81, 0.82, 0.83],
    minPrediction: [0.59, 0.60, 0.61, 0.62, 0.63],
    meanPrediction: [0.69, 0.70, 0.71, 0.72, 0.73],
    dosage: [0.18, 0.28, 0.38, 0.48, 0.58],
  },
  "15": {
    maxPrediction: [0.91, 0.92, 0.93, 0.94, 0.95],
    minPrediction: [0.71, 0.72, 0.73, 0.74, 0.75],
    meanPrediction: [0.81, 0.82, 0.83, 0.84, 0.85],
    dosage: [0.22, 0.32, 0.42, 0.52, 0.62],
  },
};