import { useEffect, useState } from "react";
import { useI18n } from "../context/I18nContext.jsx";

// Where the Android app (.apk) is served from.
// - If you host it elsewhere, set VITE_APP_DOWNLOAD_URL in Netlify.
// - Otherwise it falls back to a file in /public/downloads.
const CONFIGURED_URL = import.meta.env.VITE_APP_DOWNLOAD_URL || "";
const FALLBACK_URL = "/downloads/gp-ghirni-tax.apk";
const DOWNLOAD_URL = CONFIGURED_URL || FALLBACK_URL;

// Shows once per browser session when the site is opened.
export default function AppDownloadModal() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  // null = still checking, true = file exists, false = not published yet
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("gp_app_promo_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check whether a real app file is actually available before offering it.
  useEffect(() => {
    if (!open || available !== null) return;
    // If a custom URL is configured we assume it is valid (a HEAD request to an
    // external host can be blocked by CORS), otherwise probe the local file.
    if (CONFIGURED_URL) {
      setAvailable(true);
      return;
    }
    let cancelled = false;
    fetch(FALLBACK_URL, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        // A real .apk responds with an octet-stream; the SPA fallback returns
        // index.html (text/html), so treat HTML as "not published yet".
        const type = res.headers.get("content-type") || "";
        setAvailable(res.ok && !type.includes("text/html"));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, available]);

  const close = () => {
    sessionStorage.setItem("gp_app_promo_dismissed", "1");
    setOpen(false);
  };

  if (!open) return null;

  const mr = lang === "mr";

  const features = mr
    ? [
        "\u0915\u0930 \u092A\u093E\u0939\u093E \u0935 \u0911\u0928\u0932\u093E\u0907\u0928 \u092D\u0930\u093E",
        "\u0921\u093F\u091C\u093F\u091F\u0932 \u092A\u093E\u0935\u0924\u094D\u092F\u093E \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u093E",
        "\u0938\u0942\u091A\u0928\u093E \u0935 \u0938\u094D\u092E\u0930\u0923\u092A\u0924\u094D\u0930\u0947 \u092E\u093F\u0933\u0935\u093E",
      ]
    : [
        "View dues and pay tax online",
        "Download digital receipts with QR",
        "Get reminders and notifications",
      ];

  const downloadLabel = mr
    ? "Android \u0938\u093E\u0920\u0940 \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u093E"
    : "Download for Android";
  const comingSoonLabel = mr
    ? "\u0932\u0935\u0915\u0930\u091A \u092F\u0947\u0924 \u0906\u0939\u0947"
    : "Coming soon";
  const comingSoonNote = mr
    ? "\u092E\u094B\u092C\u093E\u0907\u0932 \u0905\u0945\u092A \u0932\u0935\u0915\u0930\u091A \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u094B\u0908\u0932. \u0924\u094B\u092A\u0930\u094D\u092F\u0902\u0924 \u0915\u0943\u092A\u092F\u093E \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u0935\u093E\u092A\u0930\u093E."
    : "The mobile app will be available soon. Please use the website for now.";
  const continueLabel = mr
    ? "\u0935\u0947\u092C\u0935\u0930 \u0938\u0941\u0930\u0942 \u0920\u0947\u0935\u093E"
    : "Continue on web";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="tricolor-bar" />
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gov text-xl font-bold text-white">
            GP
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gov dark:text-white">
              {mr
                ? "\u0906\u092E\u091A\u0947 \u092E\u094B\u092C\u093E\u0907\u0932 \u0905\u0945\u092A \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u093E"
                : "Download our Mobile App"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
              {mr
                ? "\u0917\u094D\u0930\u093E\u092E\u092A\u0902\u091A\u093E\u092F\u0924 \u0918\u093F\u0930\u0923\u0940 \u0915\u0930 \u0905\u0945\u092A"
                : "Gram Panchayat Ghirni Tax App for Android"}
            </p>
          </div>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            X
          </button>
        </div>

        <ul className="space-y-2 px-5 pb-2 text-sm text-slate-600 dark:text-slate-300">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-india" />
              {f}
            </li>
          ))}
        </ul>

        {available === false ? (
          <p className="mx-5 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {comingSoonNote}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 p-5 pt-3 sm:flex-row">
          {available === true ? (
            <a
              href={DOWNLOAD_URL}
              download
              className="btn-primary flex-1 text-center"
              onClick={close}
            >
              {downloadLabel}
            </a>
          ) : (
            <button
              className="btn-primary flex-1 cursor-not-allowed text-center opacity-60"
              disabled
            >
              {available === null ? "..." : comingSoonLabel}
            </button>
          )}
          <button onClick={close} className="btn-outline flex-1">
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
