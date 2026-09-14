// Property Condition AI — satellite + street-level AI scoring
import { useEffect, useState } from "react";
import { Building2, Satellite, Eye, Star, AlertCircle, Settings, CheckCircle2, Zap, Printer, Database } from "lucide-react";
import { Link } from "wouter";
import { APP_ROUTES } from "@/constants/appRoutes";
import { useSettingsStore } from "@/store";
import { analyzePropertyCondition } from "@/services/propertyConditionServices";
import { showApiErrorToast } from "@/lib/apiToast";
import type { PropertyConditionResult } from "@/types";

const scoreColor = (score: number) =>
  score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

const scoreBg = (score: number) =>
  score >= 75 ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
  : score >= 50 ? "bg-amber-500/15 border-amber-500/20 text-amber-400"
  : "bg-red-500/15 border-red-500/20 text-red-400";

export default function PropertyCondition() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [address, setAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PropertyConditionResult | null>(null);

  const isReady = !!(settings?.google_maps_configured && settings?.anthropic_configured);

  useEffect(() => {
    fetchSettings().catch(() => {});
  }, [fetchSettings]);

  const handleAnalyze = async () => {
    if (!isReady || !address.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await analyzePropertyCondition({ address: address.trim() });
      setResult(data);
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="atlas-page-shell atlas-page-shell--6xl atlas-page-shell--spacious">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="min-w-0">
          <h1 className="atlas-page-title">Property Condition AI</h1>
          <p className="atlas-page-subtitle">
            Satellite and street-level AI scoring for any property address.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={isReady
            ? { backgroundColor: "#34d39920", color: "#34d399", border: "1px solid #34d39930" }
            : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.09)" }
          }
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-emerald-400" : "bg-white/30"}`} />
          {isReady ? "Ready" : "Setup Required"}
        </div>
      </div>

      {/* API Setup Status */}
      {!isReady && (
        <div
          className="rounded-2xl p-6 print:hidden"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-sm mb-3">API Keys Required to Activate</div>
              <div className="space-y-2 mb-5">
                {[
                  { label: "Google Maps API Key", configured: !!settings?.google_maps_configured },
                  { label: "Anthropic API Key", configured: !!settings?.anthropic_configured },
                ].map(({ label, configured }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    {configured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span className={configured ? "text-emerald-400" : "text-white/40"}>
                      {label} {configured ? "— Connected" : "— Not configured"}
                    </span>
                  </div>
                ))}
              </div>
              <Link href={APP_ROUTES.SETTINGS}>
                <a className="atlas-btn text-xs">
                  <Settings className="w-3.5 h-3.5" />
                  Configure in Settings
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={isReady ? "Enter a property address to analyze..." : "Configure API keys in Settings to enable scoring"}
          disabled={!isReady}
          className="flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-5 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={!isReady || !address.trim() || isAnalyzing}
          className="atlas-btn atlas-btn-primary-glow w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Satellite className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {/* How it works */}
      {!result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          {[
            { icon: Satellite, label: "Satellite View", desc: "AI analyzes roof condition, lot maintenance, and structural integrity from above" },
            { icon: Eye, label: "Street View", desc: "Ground-level analysis of exterior condition, curb appeal, and visible damage" },
            { icon: Star, label: "Condition Score", desc: "0–100 score with detailed breakdown by category and actionable notes" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="atlas-panel-gradient rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 atlas-icon-box">
                <Icon className="w-4 h-4 atlas-accent-text" />
              </div>
              <div className="text-white font-bold text-sm mb-1.5">{label}</div>
              <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-5 print:mb-3">
            <div className="flex items-center gap-3">
              <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.18em] print:text-black">Analysis Result</div>
              {result.cached && (
                <div className="atlas-badge-accent flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold print:hidden">
                  <Database className="w-3 h-3" />
                  Cached
                </div>
              )}
            </div>
            <button onClick={handlePrint} className="atlas-btn text-xs print:!hidden">
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>
          </div>

          <div className="atlas-panel-gradient rounded-2xl p-6 print:border print:border-black print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div className="min-w-0">
                <div className="text-white font-bold text-sm print:text-black">{result.address}</div>
                <div className="text-white/40 text-xs mt-1 leading-relaxed print:text-black">{result.notes}</div>
              </div>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border self-start ${scoreBg(result.score)} print:border-black`}>
                <span className="text-2xl font-black" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: scoreColor(result.score) }}>{result.condition}</div>
                  <div className="text-white/25 text-xs print:text-black">/ 100</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: "Roof", score: result.roofScore },
                { label: "Exterior", score: result.exteriorScore },
                { label: "Landscape", score: result.landscapeScore },
              ].map(({ label, score }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/35 font-medium print:text-black">{label}</span>
                    <span className="font-bold" style={{ color: scoreColor(score) }}>{score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden print:hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.14em] mb-2 print:text-black">Satellite View</div>
                {result.satelliteImageBase64 ? (
                  <img
                    src={`data:image/png;base64,${result.satelliteImageBase64}`}
                    alt="Satellite view of property"
                    className="w-full rounded-xl border border-white/10 print:border-black"
                  />
                ) : (
                  <div className="text-white/30 text-xs">Not available</div>
                )}
              </div>
              <div>
                <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.14em] mb-2 print:text-black">Street View</div>
                {result.streetViewAvailable && result.streetViewImageBase64 ? (
                  <img
                    src={`data:image/jpeg;base64,${result.streetViewImageBase64}`}
                    alt="Street view of property"
                    className="w-full rounded-xl border border-white/10 print:border-black"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-white/30 text-xs bg-white/[0.03] border border-white/10 rounded-xl p-4 print:text-black print:border-black">
                    <Building2 className="w-4 h-4" />
                    No Street View coverage for this address — scored from satellite imagery only.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-white/25 text-xs mt-3 print:hidden">
            <Zap className="w-3 h-3" />
            Analyzed {new Date(result.analyzedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
