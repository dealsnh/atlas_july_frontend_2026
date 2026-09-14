import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { getMessageFromApiPayload, unwrapData } from "@/services/apiShared";
import type {
  AnalyzePropertyConditionApiResponse,
  AnalyzePropertyConditionPayload,
  PropertyConditionResult,
} from "@/types";

/** Cold analysis (satellite + street view fetch + vision scoring) can run ~10s; give it real headroom. */
const ANALYZE_TIMEOUT_MS = 45_000;

function extractResult(payload: unknown): PropertyConditionResult {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as AnalyzePropertyConditionApiResponse;
    if (!envelope.success || !envelope.data) {
      throw new Error(getMessageFromApiPayload(payload) || "Failed to analyze property");
    }
    return envelope.data;
  }

  const data = unwrapData(payload as ApiData<PropertyConditionResult>);
  if (data && typeof data === "object") return data;
  throw new Error("Unexpected response analyzing property");
}

export async function analyzePropertyCondition(
  payload: AnalyzePropertyConditionPayload,
): Promise<PropertyConditionResult> {
  const data = await apiInvoker<AnalyzePropertyConditionApiResponse | ApiData<PropertyConditionResult>>(
    END_POINT.propertyCondition.analyze,
    "POST",
    payload,
    undefined,
    { timeout: ANALYZE_TIMEOUT_MS },
  );
  return extractResult(data);
}
