import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import GovHeader from "../components/GovHeader.jsx";
import { Alert } from "../components/ui.jsx";

export default function LoginPage() {
  const { t, lang } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("taxpayer");

  // taxpayer login
  const [identifier, setIdentifier] = useState("");
  const [tpPassword, setTpPassword] = useState("");
  // admin login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      login(data.data.token, data.data.user);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitTaxpayer = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/taxpayer/login", {
        identifier,
        password: tpPassword,
      });
      login(data.data.token, data.data.user);
      navigate("/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const notices =
    lang === "en"
      ? [
          "Pay your property and house tax online securely.",
          "Download digitally signed receipts with QR verification.",
          "For corrections in your record, contact the Gram Panchayat Office.",
        ]
      : [
          "\u0906\u092A\u0932\u093E \u092E\u093E\u0932\u092E\u0924\u094D\u0924\u093E \u0935 \u0918\u0930\u092A\u091F\u094D\u091F\u0940 \u0915\u0930 \u0911\u0928\u0932\u093E\u0907\u0928 \u092D\u0930\u093E.",
          "QR \u092A\u0921\u0924\u093E\u0933\u0923\u0940\u0938\u0939 \u092A\u093E\u0935\u0924\u094D\u092F\u093E \u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u093E.",
          "\u0928\u094B\u0902\u0926\u0940\u0924 \u0926\u0941\u0930\u0941\u0938\u094D\u0924\u0940\u0938\u093E\u0920\u0940 \u0917\u094D\u0930\u093E\u092E\u092A\u0902\u091A\u093E\u092F\u0924 \u0915\u093E\u0930\u094D\u092F\u093E\u0932\u092F\u093E\u0936\u0940 \u0938\u0902\u092A\u0930\u094D\u0915 \u0938\u093E\u0927\u093E.",
        ];

  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-8 px-4 py-10 md:grid-cols-2">
        {/* Left: citizen services intro + notices */}
        <section className="order-2 md:order-1">
          <h1 className="text-2xl font-bold text-gov dark:text-white">
            {lang === "en"
              ? "Citizen Services Portal"
              : "\u0928\u093E\u0917\u0930\u093F\u0915 \u0938\u0947\u0935\u093E \u092A\u094B\u0930\u094D\u091F\u0932"}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("appName")} &mdash; {t("tagline")}
          </p>

          <div className="mt-5 space-y-3">
            {notices.map((n) => (
              <div key={n} className="gov-notice">
                {n}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="card">
              <div className="text-lg font-bold text-gov dark:text-gov-light">
                100%
              </div>
              <div className="text-xs text-slate-500">
                {lang === "en"
                  ? "Digital"
                  : "\u0921\u093F\u091C\u093F\u091F\u0932"}
              </div>
            </div>
            <div className="card">
              <div className="text-lg font-bold text-gov dark:text-gov-light">
                24x7
              </div>
              <div className="text-xs text-slate-500">
                {lang === "en"
                  ? "Online"
                  : "\u0911\u0928\u0932\u093E\u0907\u0928"}
              </div>
            </div>
            <div className="card">
              <div className="text-lg font-bold text-gov dark:text-gov-light">
                QR
              </div>
              <div className="text-xs text-slate-500">
                {lang === "en"
                  ? "Verified"
                  : "\u092A\u0921\u0924\u093E\u0933\u0923\u0940"}
              </div>
            </div>
          </div>
        </section>

        {/* Right: login card */}
        <section className="order-1 md:order-2">
          <div className="card border-t-4 border-saffron">
            <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-700">
              <button
                type="button"
                onClick={() => {
                  setTab("taxpayer");
                  setError("");
                }}
                className={
                  "gov-tab " +
                  (tab === "taxpayer" ? "gov-tab-active" : "gov-tab-idle")
                }
              >
                {t("taxpayerLogin")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("admin");
                  setError("");
                }}
                className={
                  "gov-tab " +
                  (tab === "admin" ? "gov-tab-active" : "gov-tab-idle")
                }
              >
                {t("adminLogin")}
              </button>
            </div>

            <Alert type="error">{error}</Alert>

            {tab === "taxpayer" ? (
              <form onSubmit={submitTaxpayer} className="space-y-3">
                <div>
                  <label className="label">{t("emailOrMobile")}</label>
                  <input
                    className="input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">{t("password")}</label>
                  <input
                    type="password"
                    className="input"
                    value={tpPassword}
                    onChange={(e) => setTpPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-primary w-full" disabled={busy}>
                  {busy ? "..." : t("login")}
                </button>
                <p className="text-center text-sm text-slate-500">
                  <Link to="/activate" className="text-gov underline">
                    {t("activateAccount")}
                  </Link>
                </p>
                <p className="text-center text-xs text-slate-400">
                  {lang === "en"
                    ? "Are you an administrator?"
                    : "\u0906\u092A\u0923 \u092A\u094D\u0930\u0936\u093E\u0938\u0915 \u0906\u0939\u093E\u0924?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("admin");
                      setError("");
                    }}
                    className="text-gov underline"
                  >
                    {t("adminLogin")}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={submitAdmin} className="space-y-3">
                <div className="gov-notice mb-1">
                  {lang === "en"
                    ? "Restricted area \u2014 Gram Panchayat staff only."
                    : "\u092A\u094D\u0930\u0935\u0947\u0936 \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927\u093F\u0924 \u2014 \u0915\u0947\u0935\u0933 \u0917\u094D\u0930\u093E\u092E\u092A\u0902\u091A\u093E\u092F\u0924 \u0915\u0930\u094D\u092E\u091A\u093E\u0930\u0940."}
                </div>
                <div>
                  <label className="label">{t("email")}</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">{t("password")}</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-primary w-full" disabled={busy}>
                  {busy ? "..." : t("login")}
                </button>
                <p className="text-center text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("taxpayer");
                      setError("");
                    }}
                    className="text-gov underline"
                  >
                    {lang === "en"
                      ? "Back to Taxpayer Login"
                      : "\u0915\u0930\u0926\u093E\u0924\u093E \u0932\u0949\u0917\u093F\u0928\u0915\u0921\u0947 \u092A\u0930\u0924"}
                  </button>
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Government footer */}
      <footer className="gov-footer mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/80">
          <div className="font-semibold text-white">{t("appName")}</div>
          <div>
            Gram Panchayat Ghirni, Tq. Malkapur, Dist. Buldhana - 443102
          </div>
          <div className="mt-1 opacity-70">
            &copy; {new Date().getFullYear()} Gram Panchayat Ghirni. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
