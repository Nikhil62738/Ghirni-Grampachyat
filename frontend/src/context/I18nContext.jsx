import { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations.js";

const I18nContext = createContext({
  lang: "en",
  t: (k) => k,
  setLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("gp_lang") || "en",
  );

  const setLangPersist = (l) => {
    setLang(l);
    localStorage.setItem("gp_lang", l);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  const value = { lang, t, setLang: setLangPersist };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
