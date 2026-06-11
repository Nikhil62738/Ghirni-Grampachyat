import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("gp_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.data.user);
    } catch (err) {
      localStorage.removeItem("gp_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = (token, userObj) => {
    localStorage.setItem("gp_token", token);
    setUser(userObj);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      /* ignore */
    }
    localStorage.removeItem("gp_token");
    setUser(null);
  };

  const hasPermission = (perm) => {
    if (!user || user.role !== "admin") return false;
    return user.isSuperAdmin || (user.permissions || []).includes(perm);
  };

  const value = { user, loading, login, logout, hasPermission, reload: loadMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
