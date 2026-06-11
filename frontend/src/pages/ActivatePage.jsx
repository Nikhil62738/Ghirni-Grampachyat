import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import GovHeader from "../components/GovHeader.jsx";
import { Alert } from "../components/ui.jsx";

// Steps: lookup -> otp -> password
export default function ActivatePage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState("lookup");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  const lookup = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/taxpayer/lookup", { identifier });
      if (data.data.found) {
        setMaskedEmail(data.data.maskedEmail || "");
        setInfo(
          "Your taxpayer record is available. Please activate your account.",
        );
        setStep("confirm");
      }
    } catch (err) {
      setError(
        err.message ||
          "Your information is not available in Gram Panchayat records. Please contact Gram Panchayat Office.",
      );
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/taxpayer/request-otp", {
        identifier,
      });
      setInfo("An OTP has been sent to your registered email " + maskedEmail);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const activate = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/auth/taxpayer/activate", {
        identifier,
        otp,
        password,
      });
      login(data.data.token, data.data.user);
      navigate("/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <GovHeader />
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="card">
          <h2 className="mb-4 text-lg font-bold">Activate Taxpayer Account</h2>
          <Alert type="error">{error}</Alert>
          <Alert type="success">{info}</Alert>

          {step === "lookup" && (
            <form onSubmit={lookup} className="space-y-3">
              <div>
                <label className="label">Email or Mobile Number</label>
                <input
                  className="input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? "..." : "Search Records"}
              </button>
            </form>
          )}

          {step === "confirm" && (
            <div className="space-y-3">
              <button
                className="btn-primary w-full"
                onClick={requestOtp}
                disabled={busy}
              >
                {busy ? "..." : "Activate Account (Send OTP)"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <form onSubmit={activate} className="space-y-3">
              <div>
                <label className="label">Enter OTP</label>
                <input
                  className="input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Create Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? "..." : "Verify & Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
