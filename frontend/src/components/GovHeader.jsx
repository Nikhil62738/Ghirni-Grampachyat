import { useI18n } from "../context/I18nContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function GovHeader({ right }) {
  const { t, lang, setLang } = useI18n();
  const { dark, toggle } = useTheme();

  return (
    <header className="shadow-sm">
      {/* Top government utility strip */}
      <div className="gov-strip">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1">
          <span>
            {lang === "en"
              ? "Government of Maharashtra \u2022 Rural Development Department"
              : "\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0936\u093E\u0938\u0928 \u2022 \u0917\u094D\u0930\u093E\u092E\u0935\u093F\u0915\u093E\u0938 \u0935\u093F\u092D\u093E\u0917"}
          </span>
          <span className="hidden sm:inline">
            {lang === "en" ? "Tq. Malkapur, Dist. Buldhana - 443102" : "\u0924\u093E. \u092E\u0932\u0915\u093E\u092A\u0942\u0930, \u091C\u093F. \u092C\u0941\u0932\u0922\u093E\u0923\u093E - 443102"}
          </span>
        </div>
      </div>

      {/* Saffron-white-green tricolor accent */}
      <div className="tricolor-bar" />

      {/* Main masthead */}
      <div className="bg-gov text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="gov-emblem">GP</div>
            <div>
              <div className="text-base font-bold leading-tight">
                {t("appName")}
              </div>
              <div className="text-xs opacity-80">{t("tagline")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "mr" : "en")}
              className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10"
            >
              {lang === "en" ? "\u092E\u0930\u093E\u0920\u0940" : "English"}
            </button>
            <button
              type="button"
              onClick={toggle}
              className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10"
              title="Toggle theme"
            >
              {dark ? "\u2600\uFE0F" : "\u{1F319}"}
            </button>
            {right}
          </div>
        </div>
      </div>

      <div className="tricolor-bar" />
    </header>
  );
}
