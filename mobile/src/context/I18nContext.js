import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "../i18n/translations";

const I18nContext = createContext({
  lang: "en",
  t: (k) => k,
  setLang: () => {},
  toggleLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("gp_lang");
        if (saved === "en" || saved === "mr") setLang(saved);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setLangPersist = (l) => {
    setLang(l);
    AsyncStorage.setItem("gp_lang", l).catch(() => {});
  };

  const toggleLang = () => setLangPersist(lang === "en" ? "mr" : "en");

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  const value = { lang, t, setLang: setLangPersist, toggleLang };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
