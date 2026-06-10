// Login page — premium split-screen design, branded per client
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Eye, EyeOff, ArrowRight, MapPin, Brain, TrendingUp, Shield } from "lucide-react";
import { APP_ROUTES } from "@/constants/appRoutes";
import { getApiErrorMessage } from "@/lib/apiToast";
import { cn } from "@/lib/utils";
import { login } from "@/services/authServices";
import { useAuthStore } from "@/store";
import { loginSchema, type LoginFormValues } from "@/validations";

interface LoginProps {
  companyName: string;
  accentColor: string;
}

const FEATURE_ITEMS = [
  { icon: MapPin, label: "County Scraper", desc: "Daily motivated seller leads from your target counties" },
  { icon: Brain, label: "Property Condition AI", desc: "Satellite + street view scoring with GPT-4 Vision" },
  { icon: TrendingUp, label: "Insurance Gap Finder", desc: "Underinsured properties under financial pressure" },
  { icon: Shield, label: "Distress Signals", desc: "Social, obituary, and fire damage monitoring" },
];

const inputClassName =
  "w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all";

export default function Login({ companyName, accentColor }: LoginProps) {
  const setCredentials = useAuthStore((s) => s.setCredentials);
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = handleSubmit(async (data) => {
    setApiError("");
    setLoading(true);
    try {
      const session = await login(data);
      setCredentials({
        user: session.user!,
        token: session.accessToken,
        refreshToken: session.refreshToken || undefined,
      });
    } catch (err) {
      setApiError(getApiErrorMessage(err));
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="relative hidden md:flex flex-col w-[52%] flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #0a0a14 60%, #0d0d1a 100%)" }} />
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at 20% 40%, ${accentColor} 0%, transparent 55%)` }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-[#080810]" />
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              A
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">Atlas</div>
              <div className="text-white/40 text-xs">{companyName}</div>
            </div>
          </div>
          <div className="mt-16 mb-12">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] mb-5 px-3 py-1.5 rounded-full border"
              style={{ color: accentColor, borderColor: accentColor + "40", backgroundColor: accentColor + "12" }}
            >
              Private Access Only
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Your full-time<br />
              <span style={{ color: accentColor }}>data team,</span><br />
              built into one app.
            </h1>
            <p className="text-white/45 text-base leading-relaxed max-w-[380px]">
              Atlas connects to county records, satellite imagery, and AI to surface motivated sellers in your market — every single day.
            </p>
          </div>
          <div className="space-y-4 mb-12">
            {FEATURE_ITEMS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: accentColor + "18", border: `1px solid ${accentColor}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div>
                  <div className="text-white/80 text-sm font-semibold">{label}</div>
                  <div className="text-white/35 text-xs mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto text-white/20 text-xs">Atlas by {companyName} · Confidential</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:px-16 bg-[#080810]">
        <div className="md:hidden flex items-center gap-3 mb-10 self-start">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: accentColor }}
          >
            A
          </div>
          <div>
            <div className="text-white font-bold text-sm">Atlas</div>
            <div className="text-white/40 text-xs">{companyName}</div>
          </div>
        </div>
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome back.
            </h2>
            <p className="text-white/40 text-sm">
              I&apos;m Atlas &mdash;{" "}
              <span className="font-medium" style={{ color: accentColor }}>
                your full-time data agent.
              </span>
            </p>
          </div>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-white/50 text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
                Email / Username
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                autoComplete="username"
                aria-invalid={!!errors.email}
                className={cn(inputClassName, errors.email && "border-red-500/40 focus:border-red-500/50")}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-white/50 text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className={cn(inputClassName, "pr-12", errors.password && "border-red-500/40 focus:border-red-500/50")}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white transition-colors"
                >
                  {showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>
            {apiError && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {apiError}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 mt-1"
              style={{ backgroundColor: accentColor, boxShadow: `0 4px 24px ${accentColor}40` }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Atlas
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link
              href={APP_ROUTES.SIGNUP}
              className="font-semibold hover:underline"
              style={{ color: accentColor }}
            >
              Sign up
            </Link>
          </p>
          <div className="mt-8 pt-6 border-t border-white/[0.07]">
            <p className="text-white/20 text-xs text-center">
              Secure private access &middot; {companyName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
