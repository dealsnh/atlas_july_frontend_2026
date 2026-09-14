export interface PropertyConditionResult {
  address: string;
  score: number;
  condition: string;
  roofScore: number;
  exteriorScore: number;
  landscapeScore: number;
  notes: string;
  satelliteImageBase64: string | null;
  streetViewImageBase64: string | null;
  streetViewAvailable: boolean;
  analyzedAt: string;
  cached: boolean;
}

export interface AnalyzePropertyConditionPayload {
  address: string;
}

export interface AnalyzePropertyConditionApiResponse {
  success: boolean;
  message?: string;
  data?: PropertyConditionResult;
  error?: { message: string; details?: Record<string, unknown> };
  requestId?: string;
}
