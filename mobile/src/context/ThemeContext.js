import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT, DARK } from "../config";

const ThemeContext = createContext({
  colors: LIGHT,
  dark: false,
  mode: "system",
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  // mode is one of: "light" | "dark" | "system"
  const [mode, setMode] = useState("system");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("gp_theme");
        if (saved === "light" || saved === "dark" || saved === "system") {
          setMode(saved);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setModePersist = (m) => {
    setMode(m);
    AsyncStorage.setItem("gp_theme", m).catch(() => {});
  };

  const dark = mode === "system" ? system === "dark" : mode === "dark";
  const colors = dark ? DARK : LIGHT;
  const toggle = () => setModePersist(dark ? "light" : "dark");

  const value = useMemo(
    () => ({ colors, dark, mode, setMode: setModePersist, toggle }),
    [colors, dark, mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
