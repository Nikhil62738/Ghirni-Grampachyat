import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("gp_user");
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post("/auth/taxpayer/login", {
      identifier,
      password,
    });
    const token = res.data.data.token;
    const u = res.data.data.user;
    await AsyncStorage.setItem("gp_token", token);
    await AsyncStorage.setItem("gp_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["gp_token", "gp_user"]);
    setUser(null);
  };

  const ctxValue = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
