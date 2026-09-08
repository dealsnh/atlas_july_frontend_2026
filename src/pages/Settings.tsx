/**
 * Settings.tsx — Atlas Settings & Configuration
 * Sections:
 * 1. API Keys — Bright Data, ATTOM, Skip Trace, ScraperAPI
 * 2. Email Delivery — SMTP + recipient list
 */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showApiErrorToast, showApiSuccessToast } from "@/lib/apiToast";
import { cn } from "@/lib/utils";
import { formatLastScrapeTime } from "@/lib/dateTimeFormat";
import { prepareSettingsSavePayload } from "@/services/settingsServices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsStore, useStatsStore, settingsToFormValues } from "@/store";
import { settingsSaveSchema, testEmailSchema, type SettingsSaveFormValues, type TestEmailFormValues } from "@/validations";
import {
  ChevronDown, ChevronRight, Save, Eye, EyeOff,
  Mail, Key, RefreshCw, Zap, Info, Unlock
} from "lucide-react";


function Section({ title, icon, children, defaultOpen = true, accentClass }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentClass?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={accentClass || "shrink-0 atlas-accent-text"}>{icon}</span>
          <span className="font-semibold text-white text-left">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
      </button>
      {open && <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-2">{children}</div>}
    </div>
  );
}


function InputField({
  label,
  hint,
  masked,
  error,
  className,
  ...inputProps
}: {
  label: string;
  hint?: string;
  masked?: boolean;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const inputType = masked && !show ? "password" : (inputProps.type ?? "text");

  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      <div className="relative">
        <input
          {...inputProps}
          type={inputType}
          aria-invalid={!!error}
          className={cn(
            "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors",
            error && "border-red-500/40 focus:border-red-500/50",
            className,
          )}
        />
        {masked && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-white/35">{hint}</p>
      ) : null}
    </div>
  );
}

export default function Settings() {
  const settings = useSettingsStore((s) => s.settings);
  const isLoading = useSettingsStore((s) => s.isLoading);
  const saving = useSettingsStore((s) => s.isSaving);
  const testingEmail = useSettingsStore((s) => s.isTestingEmail);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const saveSettings = useSettingsStore((s) => s.saveSettings);
  const testEmail = useSettingsStore((s) => s.testEmail);
  const stats = useStatsStore((s) => s.stats);
  const statsLoading = useStatsStore((s) => s.isLoading);
  const fetchStats = useStatsStore((s) => s.fetchStats);

  const [expandedCounty, setExpandedCounty] = useState<string | null>(null);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SettingsSaveFormValues>({
    resolver: zodResolver(settingsSaveSchema),
    defaultValues: {
      smtp_host: "",
      smtp_port: "587",
      smtp_user: "",
      smtp_pass: "",
      smtp_from: "",
      email_recipients: "",
      auto_skip_trace: "false",
      bright_data_user: "",
      bright_data_pass: "",
      scraper_api_key: "",
      skip_trace_key: "",
      attom_api_key: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const {
    register: registerTestEmail,
    handleSubmit: handleTestEmailSubmit,
    reset: resetTestEmail,
    formState: { errors: testEmailErrors },
  } = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: { email: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const autoSkipTrace = watch("auto_skip_trace");

  useEffect(() => {
    fetchSettings()
      .then((data) => reset(settingsToFormValues(data) as SettingsSaveFormValues))
      .catch((e) => showApiErrorToast(e));
  }, [fetchSettings, reset]);

  useEffect(() => {
    fetchStats().catch((e) => showApiErrorToast(e));
  }, [fetchStats]);

  const handleSave = handleSubmit(async (parsed) => {
    if (!settings) return;

    try {
      const { settings: updated, message } = await saveSettings(
        prepareSettingsSavePayload(parsed, settings),
      );
      reset(settingsToFormValues(updated) as SettingsSaveFormValues);
      showApiSuccessToast(message ?? "Settings saved successfully");
    } catch (e) {
      showApiErrorToast(e);
    }
  });

  const handleOpenTestEmailDialog = () => {
    resetTestEmail({ email: "" });
    setShowTestEmailDialog(true);
  };

  const handleTestEmail = handleTestEmailSubmit(async (data) => {
    try {
      const { message } = await testEmail(data);
      showApiSuccessToast(message ?? "Test email sent successfully");
      setShowTestEmailDialog(false);
    } catch (e: unknown) {
      showApiErrorToast(e);
    }
  });

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }


  const statCardVariants = [
    { surface: "atlas-accent-surface", value: "atlas-accent-text" },
    { surface: "bg-emerald-500/10 border border-emerald-500/20", value: "text-emerald-300" },
    { surface: "bg-orange-500/10 border border-orange-500/20", value: "text-orange-300" },
    { surface: "bg-white/5 border border-white/10", value: "text-white" },
    { surface: "bg-slate-700/30 border border-slate-600/30", value: "text-slate-300" },
  ] as const;


  return (
    <div className="atlas-page-shell atlas-page-shell--5xl">
      <div>
        <h1 className="atlas-page-title">Settings</h1>
        <p className="atlas-page-subtitle">Configure Atlas, manage lead sources, and set up API keys</p>
      </div>

      {/* LIVE DATABASE STATS */}
      {statsLoading && !stats ? (
        <div className="flex items-center justify-center py-10 text-white/40">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
      ) : stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
              <div className="text-xs text-white/40 mt-1">Total leads</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.today.toLocaleString()}</div>
              <div className="text-xs text-white/40 mt-1">Added today</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {formatLastScrapeTime(stats.lastScrapeTime)}
              </div>
              <div className="text-xs text-white/40 mt-1">Last scrape</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {formatLastScrapeTime(stats.lastRun)}
              </div>
              <div className="text-xs text-white/40 mt-1">Last run</div>
            </div>
          </div>

          {stats.byType.length > 0 && (
            <div className="space-y-3">
              <div className="atlas-label">Leads by type</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {stats.byType.map((item, index) => {
                  const variant = statCardVariants[index % statCardVariants.length];
                  return (
                    <div
                      key={item.lead_type}
                      className={`${variant.surface} rounded-xl p-4 text-center`}
                    >
                      <div className={`text-2xl font-bold ${variant.value}`}>
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/50 mt-1 leading-snug">{item.lead_type}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.byCounty.length > 0 && (
            <div className="space-y-3">
              <div className="atlas-label">Leads by county</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {stats.byCounty.map((item, index) => {
                  const variant = statCardVariants[index % statCardVariants.length];
                  return (
                    <div
                      key={item.county}
                      className={`${variant.surface} rounded-xl p-4 text-center`}
                    >
                      <div className={`text-2xl font-bold ${variant.value}`}>
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/50 mt-1">{item.county}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* API KEYS */}
      <Section title="API Keys" icon={<Key className="w-5 h-5" />} accentClass="text-orange-400">
        <div className="space-y-6">

          {/* Bright Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" /> Bright Data Proxy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Required for Jefferson County AL tax delinquent — JCCAL ArcGIS is behind Imperva WAF</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${settings.bright_data_configured ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/45" : "bg-purple-500/25 text-purple-300 border-purple-500/45"}`}>
                {settings.bright_data_configured ? "✓ Configured" : "Not configured"}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <InputField
                label="Bright Data Username"
                placeholder="brd-customer-xxxxxx-zone-xxxxx"
                hint="From Bright Data dashboard → Proxies → Residential → Access parameters"
                error={errors.bright_data_user?.message}
                {...register("bright_data_user")}
              />
              <InputField
                label="Bright Data Password"
                placeholder="Your zone password"
                error={errors.bright_data_pass?.message}
                {...register("bright_data_pass")}
              />
            </div>
          </div>

          <hr className="border-slate-700/50" />

          {/* ATTOM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-medium text-white">ATTOM Data API</h3>
                <p className="text-xs text-slate-500 mt-0.5">Unlocks tax delinquent for Morgan, Montgomery, Shelby, Limestone, Autauga, Elmore AL (~$150/mo)</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${settings.attom_configured ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/45" : "bg-orange-500/25 text-orange-300 border-orange-500/45"}`}>
                {settings.attom_configured ? "✓ Configured" : "Not configured"}
              </span>
            </div>
            <InputField
              label="ATTOM API Key"
              placeholder="Your ATTOM API key"
              hint="From api.gateway.attomdata.com → Account → API Keys"
              error={errors.attom_api_key?.message}
              {...register("attom_api_key")}
            />
          </div>

          <hr className="border-slate-700/50" />

          {/* ScraperAPI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-medium text-white">ScraperAPI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Optional proxy for JS-rendered county portals (~$29/mo)</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${settings.scraper_api_configured ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/45" : "bg-slate-600/25 text-slate-400 border-slate-600/45"}`}>
                {settings.scraper_api_configured ? "✓ Configured" : "Not configured"}
              </span>
            </div>
            <InputField
              label="ScraperAPI Key"
              placeholder="Your ScraperAPI key"
              hint="From scraperapi.com → Dashboard → API Key"
              error={errors.scraper_api_key?.message}
              {...register("scraper_api_key")}
            />
          </div>

          <hr className="border-slate-700/50" />

          {/* Easy Button Skip Trace */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" /> Easy Button Skip Trace
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Appends phone numbers and emails to leads on import. Only skip trace provider supported.</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${settings.skip_trace_configured ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/45" : "bg-slate-600/25 text-slate-400 border-slate-600/45"}`}>
                {settings.skip_trace_configured ? "✓ Configured" : "Not configured"}
              </span>
            </div>
            <InputField
              label="Easy Button Skip Trace API Key"
              placeholder="Your Easy Button Skip Trace API key"
              hint="From Easy Button Skip Trace dashboard → API Access"
              error={errors.skip_trace_key?.message}
              {...register("skip_trace_key")}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300">Auto skip-trace on import</label>
              <button
                type="button"
                onClick={() =>
                  setValue("auto_skip_trace", autoSkipTrace === "true" ? "false" : "true", {
                    shouldValidate: true,
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoSkipTrace === "true" ? "bg-emerald-500" : "bg-slate-600"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoSkipTrace === "true" ? "translate-x-4.5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-xs text-slate-500">{autoSkipTrace === "true" ? "On — leads are skip-traced automatically" : "Off — skip trace manually from the leads dashboard"}</span>
            </div>
          </div>

          <div className="pt-2">
            <button type="button" onClick={() => void handleSave()} disabled={saving} className="atlas-btn disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save API Keys"}
            </button>
          </div>
        </div>
      </Section>

      {/* EMAIL DELIVERY */}
      <Section title="Email Delivery" icon={<Mail className="w-5 h-5" />} accentClass="text-emerald-400">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 rounded-lg px-4 py-3 border border-slate-700/40">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />
            <span>A CSV of all new leads is emailed every day at <strong className="text-white">6:00 AM Eastern Time</strong>. Configure SMTP credentials below to enable delivery. Gmail works with an App Password — enable 2FA first, then create an App Password at <span className="text-blue-300">myaccount.google.com/apppasswords</span>.</span>
          </div>

          {/* Gmail Quick-Setup */}
          <div className="flex flex-wrap gap-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setValue("smtp_host", "smtp.gmail.com", { shouldValidate: true });
                setValue("smtp_port", "587", { shouldValidate: true });
                const smtpUser = getValues("smtp_user");
                if (smtpUser) {
                  setValue("smtp_from", smtpUser, { shouldValidate: true });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium transition-colors border border-slate-600"
            >
              <span>⚡</span> Use Gmail Defaults
            </button>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-blue-300 rounded text-xs font-medium transition-colors border border-slate-600"
            >
              <span>🔑</span> Create Gmail App Password →
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="SMTP Host"
              placeholder="smtp.gmail.com"
              hint="Gmail: smtp.gmail.com | Outlook: smtp.office365.com"
              error={errors.smtp_host?.message}
              {...register("smtp_host")}
            />
            <InputField
              label="SMTP Port"
              placeholder="587"
              hint="587 for TLS (recommended) | 465 for SSL"
              error={errors.smtp_port?.message}
              {...register("smtp_port")}
            />
            <InputField
              label="SMTP Username"
              placeholder="your@gmail.com"
              error={errors.smtp_user?.message}
              {...register("smtp_user")}
            />
            <InputField
              label="SMTP Password"
              placeholder="App Password (not your login password)"
              hint="Gmail: use a 16-character App Password, not your account password"
              error={errors.smtp_pass?.message}
              {...register("smtp_pass")}
            />
            <InputField
              label="From Address"
              placeholder="atlas@nationalhouses.com"
              hint="The 'From' name shown in email clients"
              error={errors.smtp_from?.message}
              {...register("smtp_from")}
            />
            <InputField
              label="Recipients"
              placeholder="tina@nationalhouses.com, team@nationalhouses.com"
              hint="Comma-separated list of email addresses to receive the daily CSV"
              error={errors.email_recipients?.message}
              {...register("email_recipients")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={() => void handleSave()} disabled={saving} className="atlas-btn disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Email Settings"}
            </button>
            <button
              onClick={handleOpenTestEmailDialog}
              disabled={testingEmail}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Test Email
            </button>
          </div>
        </div>
      </Section>

      <Dialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
        <DialogContent className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Send Test Email</DialogTitle>
            <DialogDescription className="text-white/45">
              Enter the email address that should receive a test message using your saved SMTP settings.
            </DialogDescription>
          </DialogHeader>
          <InputField
            label="Recipient Email"
            placeholder="example@mail.com"
            hint="This address will receive the test email."
            error={testEmailErrors.email?.message}
            {...registerTestEmail("email")}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowTestEmailDialog(false)}
              disabled={testingEmail}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 border border-white/10 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleTestEmail()}
              disabled={testingEmail}
              className="atlas-btn disabled:opacity-50"
            >
              {testingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {testingEmail ? "Sending..." : "Send Test Email"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
