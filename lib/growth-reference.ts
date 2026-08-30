export type GrowthReference = {
  ageMonths: number;
  heightMinCm: number;
  heightMaxCm: number;
  weightMinKg: number;
};

type FullGrowthReference = GrowthReference & { weightMaxKg: number };

// Age-only envelope: lower -2 SD and upper +2 SD across the two WHO charts.
// ponytail: fixed 12–48 month table keeps this feature transparent; add a proper
// sex-specific LMS calculator only when the product deliberately collects that input.
const references: FullGrowthReference[] = [
  { ageMonths: 12, heightMinCm: 68.9, heightMaxCm: 80.5, weightMinKg: 7.0, weightMaxKg: 12.0 },
  { ageMonths: 13, heightMinCm: 70.0, heightMaxCm: 81.8, weightMinKg: 7.2, weightMaxKg: 12.3 },
  { ageMonths: 14, heightMinCm: 71.0, heightMaxCm: 83.0, weightMinKg: 7.4, weightMaxKg: 12.6 },
  { ageMonths: 15, heightMinCm: 72.0, heightMaxCm: 84.2, weightMinKg: 7.6, weightMaxKg: 12.8 },
  { ageMonths: 16, heightMinCm: 73.0, heightMaxCm: 85.4, weightMinKg: 7.7, weightMaxKg: 13.1 },
  { ageMonths: 17, heightMinCm: 74.0, heightMaxCm: 86.5, weightMinKg: 7.9, weightMaxKg: 13.4 },
  { ageMonths: 18, heightMinCm: 74.9, heightMaxCm: 87.7, weightMinKg: 8.1, weightMaxKg: 13.7 },
  { ageMonths: 19, heightMinCm: 75.8, heightMaxCm: 88.8, weightMinKg: 8.2, weightMaxKg: 13.9 },
  { ageMonths: 20, heightMinCm: 76.7, heightMaxCm: 89.8, weightMinKg: 8.4, weightMaxKg: 14.2 },
  { ageMonths: 21, heightMinCm: 77.5, heightMaxCm: 90.9, weightMinKg: 8.6, weightMaxKg: 14.5 },
  { ageMonths: 22, heightMinCm: 78.4, heightMaxCm: 91.9, weightMinKg: 8.7, weightMaxKg: 14.7 },
  { ageMonths: 23, heightMinCm: 79.2, heightMaxCm: 92.9, weightMinKg: 8.9, weightMaxKg: 15.0 },
  { ageMonths: 24, heightMinCm: 79.3, heightMaxCm: 93.2, weightMinKg: 9.0, weightMaxKg: 15.3 },
  { ageMonths: 25, heightMinCm: 80.0, heightMaxCm: 94.2, weightMinKg: 9.2, weightMaxKg: 15.5 },
  { ageMonths: 26, heightMinCm: 80.8, heightMaxCm: 95.2, weightMinKg: 9.4, weightMaxKg: 15.8 },
  { ageMonths: 27, heightMinCm: 81.5, heightMaxCm: 96.1, weightMinKg: 9.5, weightMaxKg: 16.1 },
  { ageMonths: 28, heightMinCm: 82.2, heightMaxCm: 97.0, weightMinKg: 9.7, weightMaxKg: 16.3 },
  { ageMonths: 29, heightMinCm: 82.9, heightMaxCm: 97.9, weightMinKg: 9.8, weightMaxKg: 16.6 },
  { ageMonths: 30, heightMinCm: 83.6, heightMaxCm: 98.7, weightMinKg: 10.0, weightMaxKg: 16.9 },
  { ageMonths: 31, heightMinCm: 84.3, heightMaxCm: 99.6, weightMinKg: 10.1, weightMaxKg: 17.1 },
  { ageMonths: 32, heightMinCm: 84.9, heightMaxCm: 100.4, weightMinKg: 10.3, weightMaxKg: 17.4 },
  { ageMonths: 33, heightMinCm: 85.6, heightMaxCm: 101.2, weightMinKg: 10.4, weightMaxKg: 17.6 },
  { ageMonths: 34, heightMinCm: 86.2, heightMaxCm: 102.0, weightMinKg: 10.5, weightMaxKg: 17.8 },
  { ageMonths: 35, heightMinCm: 86.8, heightMaxCm: 102.7, weightMinKg: 10.7, weightMaxKg: 18.1 },
  { ageMonths: 36, heightMinCm: 87.4, heightMaxCm: 103.5, weightMinKg: 10.8, weightMaxKg: 18.3 },
  { ageMonths: 37, heightMinCm: 88.0, heightMaxCm: 104.2, weightMinKg: 10.9, weightMaxKg: 18.6 },
  { ageMonths: 38, heightMinCm: 88.6, heightMaxCm: 105.0, weightMinKg: 11.1, weightMaxKg: 18.8 },
  { ageMonths: 39, heightMinCm: 89.2, heightMaxCm: 105.7, weightMinKg: 11.2, weightMaxKg: 19.0 },
  { ageMonths: 40, heightMinCm: 89.8, heightMaxCm: 106.4, weightMinKg: 11.3, weightMaxKg: 19.3 },
  { ageMonths: 41, heightMinCm: 90.4, heightMaxCm: 107.1, weightMinKg: 11.5, weightMaxKg: 19.5 },
  { ageMonths: 42, heightMinCm: 90.9, heightMaxCm: 107.8, weightMinKg: 11.6, weightMaxKg: 19.8 },
  { ageMonths: 43, heightMinCm: 91.5, heightMaxCm: 108.5, weightMinKg: 11.7, weightMaxKg: 20.1 },
  { ageMonths: 44, heightMinCm: 92.0, heightMaxCm: 109.1, weightMinKg: 11.8, weightMaxKg: 20.4 },
  { ageMonths: 45, heightMinCm: 92.5, heightMaxCm: 109.8, weightMinKg: 12.0, weightMaxKg: 20.7 },
  { ageMonths: 46, heightMinCm: 93.1, heightMaxCm: 110.4, weightMinKg: 12.1, weightMaxKg: 20.9 },
  { ageMonths: 47, heightMinCm: 93.6, heightMaxCm: 111.1, weightMinKg: 12.2, weightMaxKg: 21.2 },
  { ageMonths: 48, heightMinCm: 94.1, heightMaxCm: 111.7, weightMinKg: 12.3, weightMaxKg: 21.5 },
];

export function growthReferenceForAge(ageInMonths: number) {
  if (ageInMonths < 12) return null;
  const ageMonths = Math.min(48, Math.max(12, Math.round(ageInMonths)));
  return references[ageMonths - 12];
}
