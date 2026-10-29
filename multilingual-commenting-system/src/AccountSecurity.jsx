import React, { useState, useEffect } from "react";
import {
  getIstDate,
  isMorningIST,
  formatIstTime,
  getAutoThemeForTime,
  applyThemeToDOM,
  saveThemePreference
} from "./themeUtils";
import {
  getClientFingerprint,
  SIMULATION_PROFILES
} from "./deviceUtils";

const API_BASE = import.meta.env.VITE_API_BASE || (
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : "/api"
);

export default function AccountSecurity({
  currentUser,
  currentTheme,
  setCurrentTheme,
  themeMode,
  setThemeMode,
  onNotify
}) {
  const [auditRecords, setAuditRecords] = useState([]);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all"); // all | success | otp | failed
  const [trustedDurationDays, setTrustedDurationDays] = useState(30);

  // OTP Challenge State
  const [otpModalActive, setOtpModalActive] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [trustDeviceChecked, setTrustDeviceChecked] = useState(true);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Current client info
  const [clientInfo] = useState(() => getClientFingerprint());
  const [istTimeDisplay, setIstTimeDisplay] = useState(() => formatIstTime());

  // IST Time display interval
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTimeDisplay(formatIstTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // OTP countdown interval
  useEffect(() => {
    if (!otpModalActive || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpModalActive, otpCountdown]);

  // Load audit records and trusted devices
  async function loadSecurityData() {
    setLoading(true);
    try {
      const [recsRes, trustRes] = await Promise.all([
        fetch(`${API_BASE}/security/records/${currentUser.userId}`),
        fetch(`${API_BASE}/security/trusted-devices/${currentUser.userId}`)
      ]);
      if (recsRes.ok) {
        const d = await recsRes.json();
        setAuditRecords(d.records || []);
      }
      if (trustRes.ok) {
        const d = await trustRes.json();
        setTrustedDevices(d.trustedDevices || []);
      }
    } catch (err) {
      console.warn("Could not fetch remote security data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurityData();
  }, [currentUser.userId]);

  // Handle Manual Theme Toggle
  function handleManualThemeToggle(newTheme) {
    setCurrentTheme(newTheme);
    setThemeMode("manual");
    applyThemeToDOM(newTheme);
    saveThemePreference({ mode: "manual", manualTheme: newTheme });

    // Persist to backend
    fetch(`${API_BASE}/security/update-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.userId,
        manualTheme: newTheme
      })
    }).catch(() => {});

    onNotify?.(`Theme manually set to ${newTheme.toUpperCase()} mode. Preference saved.`, "success");
  }

  // Reset to Automatic IST Mode
  function handleResetToAutoTheme() {
    const autoTheme = getAutoThemeForTime();
    setCurrentTheme(autoTheme);
    setThemeMode("auto");
    applyThemeToDOM(autoTheme);
    saveThemePreference({ mode: "auto", manualTheme: null });

    fetch(`${API_BASE}/security/update-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.userId,
        manualTheme: null
      })
    }).catch(() => {});

    onNotify?.(`Theme reset to Automatic IST Schedule (${autoTheme.toUpperCase()}).`, "info");
  }

  // Simulate Login Flow (Handles both normal and OTP challenges)
  async function triggerSimulatedLogin(profile, simulatedTime = null) {
    setLoading(true);
    try {
      const payload = {
        userId: currentUser.userId,
        username: currentUser.username,
        browser: profile.browser,
        os: profile.os,
        deviceType: profile.deviceType,
        deviceModel: profile.deviceModel,
        ipAddress: profile.ipAddress,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        approxLocation: profile.location,
        simulatedTimestamp: simulatedTime
      };

      const res = await fetch(`${API_BASE}/security/login-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.requiresOtp) {
        setPendingChallenge(data);
        setOtpModalActive(true);
        setOtpCode("");
        setOtpError(null);
        setOtpCountdown(60);
        onNotify?.(`🚨 OTP Verification Required: ${data.reason}`, "info");
      } else {
        // Automatic login allowed
        if (themeMode === "auto" && data.theme) {
          setCurrentTheme(data.theme);
          applyThemeToDOM(data.theme);
        }
        onNotify?.(`✓ Trusted session authenticated (${profile.browser} in ${profile.city})`, "success");
      }

      await loadSecurityData();
    } catch (err) {
      onNotify?.(`Login attempt simulation failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP
  async function handleVerifyOtp() {
    if (!pendingChallenge || !otpCode.trim()) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch(`${API_BASE}/security/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: pendingChallenge.tempToken,
          otp: otpCode.trim(),
          trustDevice: trustDeviceChecked,
          trustDurationDays: trustedDurationDays,
          userId: currentUser.userId
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOtpModalActive(false);
        setPendingChallenge(null);
        setOtpCode("");

        if (themeMode === "auto" && data.theme) {
          setCurrentTheme(data.theme);
          applyThemeToDOM(data.theme);
        }

        onNotify?.(
          trustDeviceChecked
            ? `✓ Device verified & added to Trusted Devices for ${trustedDurationDays} days!`
            : "✓ Verification successful! Session authenticated.",
          "success"
        );
        await loadSecurityData();
      } else {
        setOtpError(data.message || "Invalid OTP code. Please try again.");
      }
    } catch (err) {
      setOtpError(`Verification request failed: ${err.message}`);
    } finally {
      setVerifyingOtp(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (!pendingChallenge) return;
    try {
      const res = await fetch(`${API_BASE}/security/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: pendingChallenge.tempToken,
          channel: pendingChallenge.deliveryChannel || "email"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPendingChallenge((prev) => ({
          ...prev,
          demoOtpCode: data.demoOtpCode
        }));
        setOtpCountdown(60);
        setOtpError(null);
        onNotify?.(`New OTP code dispatched via ${pendingChallenge.deliveryChannel.toUpperCase()}.`, "info");
      }
    } catch (err) {
      setOtpError("Failed to resend OTP.");
    }
  }

  // Revoke Trusted Device
  async function handleRevokeDevice(deviceId, revokeAll = false) {
    try {
      const res = await fetch(`${API_BASE}/security/revoke-trusted-device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          deviceId,
          revokeAll
        })
      });
      if (res.ok) {
        onNotify?.(revokeAll ? "All trusted devices have been revoked." : "Trusted device revoked.", "info");
        await loadSecurityData();
      }
    } catch (err) {
      onNotify?.("Failed to revoke device.", "error");
    }
  }

  // Filter audit records
  const filteredRecords = auditRecords.filter((rec) => {
    if (filterType === "success") return rec.status === "SUCCESS";
    if (filterType === "otp") return rec.status === "OTP_VERIFIED" || rec.status === "OTP_REQUIRED";
    if (filterType === "failed") return rec.status === "FAILED_OTP";
    return true;
  });

  const morningWindowActive = isMorningIST();

  return (
    <div className="account-security-container">
      {/* ---------------- SECTION 1: HEADER & ADAPTIVE THEME HERO ---------------- */}
      <section className="card security-hero-card">
        <div className="security-hero-content">
          <div className="security-shield-icon">🛡️</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2>Account Security & Personalized Experience</h2>
              <span className="security-health-pill protected">
                ✓ 2FA Shield Active · 98% Security Rating
              </span>
            </div>
            <p className="card-subtitle" style={{ marginTop: "4px" }}>
              Intelligent IST-driven adaptive themes, anomaly detection for unknown devices/locations, and granular session control.
            </p>
          </div>
        </div>

        {/* Adaptive Theme Engine Banner */}
        <div className="adaptive-theme-box">
          <div className="adaptive-theme-info">
            <div className="theme-indicator-icon">
              {currentTheme === "light" ? "☀️" : "🌙"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong>Current Theme: {currentTheme.toUpperCase()}</strong>
                <span className={`theme-mode-badge ${themeMode}`}>
                  {themeMode === "auto" ? "⚡ AUTO IST ADAPTED" : "✏️ USER OVERRIDE"}
                </span>
              </div>
              <div className="theme-sub-hint">
                {themeMode === "auto" ? (
                  morningWindowActive ? (
                    <span>🌅 Morning IST Window active (5:00 AM - 12:00 PM IST) → <strong>Light Theme Enabled</strong></span>
                  ) : (
                    <span>🌌 Afternoon/Night IST Window active (12:00 PM - 5:00 AM IST) → <strong>Dark Theme Enabled</strong></span>
                  )
                ) : (
                  <span>User custom override active and saved to profile. Persists across future sessions and devices.</span>
                )}
              </div>
              <div className="ist-clock-badge">
                🕒 Current IST Time: <strong>{istTimeDisplay}</strong>
              </div>
            </div>
          </div>

          <div className="adaptive-theme-actions">
            <div className="manual-theme-group">
              <button
                className={`theme-toggle-btn ${currentTheme === "light" ? "active" : ""}`}
                onClick={() => handleManualThemeToggle("light")}
                title="Switch to Light Theme"
              >
                ☀️ Light
              </button>
              <button
                className={`theme-toggle-btn ${currentTheme === "dark" ? "active" : ""}`}
                onClick={() => handleManualThemeToggle("dark")}
                title="Switch to Dark Theme"
              >
                🌙 Dark
              </button>
            </div>

            {themeMode === "manual" && (
              <button className="reset-auto-btn" onClick={handleResetToAutoTheme}>
                ⚡ Reset to Auto IST
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 2: CURRENT DEVICE & QUICK SIMULATOR ---------------- */}
      <div className="security-grid-top">
        {/* Current Active Session Card */}
        <section className="card active-session-card">
          <div className="card-title-row">
            <div>
              <h3>🖥️ Current Session Details</h3>
              <p className="card-subtitle">Active environment monitored for security integrity.</p>
            </div>
            <span className="live-session-pill">● THIS DEVICE</span>
          </div>

          <div className="session-details-grid">
            <div className="detail-item">
              <span className="detail-label">Browser & Version</span>
              <strong className="detail-value">{clientInfo.browser}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Operating System</span>
              <strong className="detail-value">{clientInfo.os}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Device Type & Model</span>
              <strong className="detail-value">{clientInfo.deviceType} · {clientInfo.deviceModel}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Public IP Address</span>
              <strong className="detail-value" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                {clientInfo.ipAddress}
              </strong>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Approximate Location & ISP</span>
              <strong className="detail-value">
                📍 {clientInfo.location} · {clientInfo.isp}
              </strong>
            </div>
          </div>
        </section>

        {/* Security Challenge & Login Simulator */}
        <section className="card simulator-card">
          <div className="card-title-row">
            <div>
              <h3>⚡ Security Verification Simulator</h3>
              <p className="card-subtitle">Test new browser, IP, location, and IST morning/night triggers.</p>
            </div>
          </div>

          <div className="sim-buttons-stack">
            <button
              className="sim-action-btn"
              onClick={() => {
                // Morning IST: 8:00 AM IST = 2:30 AM UTC
                const morning = new Date("2026-10-08T02:30:00Z").getTime();
                triggerSimulatedLogin(SIMULATION_PROFILES[0], morning);
              }}
            >
              <span>🌅 Test Morning Login (8:00 AM IST)</span>
              <span className="sim-tag">Auto Light Theme</span>
            </button>

            <button
              className="sim-action-btn"
              onClick={() => {
                // Evening IST: 8:00 PM IST = 14:30 UTC
                const evening = new Date("2026-10-08T14:30:00Z").getTime();
                triggerSimulatedLogin(SIMULATION_PROFILES[0], evening);
              }}
            >
              <span>🌌 Test Evening Login (8:00 PM IST)</span>
              <span className="sim-tag">Auto Dark Theme</span>
            </button>

            <button
              className="sim-action-btn danger"
              onClick={() => triggerSimulatedLogin(SIMULATION_PROFILES[1])}
            >
              <span>🚨 Simulate Login from New Browser (Firefox in Bengaluru)</span>
              <span className="sim-tag danger">Triggers OTP</span>
            </button>

            <button
              className="sim-action-btn danger"
              onClick={() => triggerSimulatedLogin(SIMULATION_PROFILES[2])}
            >
              <span>📱 Simulate Login from New Mobile Device (iPhone in Mumbai)</span>
              <span className="sim-tag danger">Triggers OTP</span>
            </button>

            <button
              className="sim-action-btn danger"
              onClick={() => triggerSimulatedLogin(SIMULATION_PROFILES[3])}
            >
              <span>📍 Simulate Login from New IP & City (Edge in New Delhi)</span>
              <span className="sim-tag danger">Triggers OTP</span>
            </button>
          </div>
        </section>
      </div>

      {/* ---------------- SECTION 3: TRUSTED DEVICES MANAGEMENT ---------------- */}
      <section className="card trusted-devices-section">
        <div className="card-title-row">
          <div>
            <h3>🔒 Trusted Devices ({trustedDevices.length})</h3>
            <p className="card-subtitle">
              Verified devices that skip OTP verification during their trust period.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <label>Trust Period:</label>
              <select
                className="trust-period-select"
                value={trustedDurationDays}
                onChange={(e) => setTrustedDurationDays(Number(e.target.value))}
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Recommended)</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {trustedDevices.length > 0 && (
              <button
                className="secondary-btn danger-outline"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => handleRevokeDevice(null, true)}
              >
                Revoke All Devices
              </button>
            )}
          </div>
        </div>

        {trustedDevices.length === 0 ? (
          <div className="empty-devices-box">
            <span>🛡️ No trusted devices recorded yet. Log in from a new environment to verify and trust.</span>
          </div>
        ) : (
          <div className="trusted-devices-grid">
            {trustedDevices.map((dev) => {
              const daysRemaining = Math.max(
                0,
                Math.round((Number(dev.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24))
              );

              return (
                <div key={dev.id} className="trusted-device-card">
                  <div className="dev-card-header">
                    <div className="dev-icon">
                      {dev.deviceType === "Mobile" ? "📱" : dev.deviceType === "Tablet" ? "📟" : "💻"}
                    </div>
                    <div>
                      <strong>{dev.deviceName || dev.browser}</strong>
                      <div className="dev-subtext">{dev.os} · {dev.deviceModel}</div>
                    </div>
                    <span className="trusted-badge">TRUSTED</span>
                  </div>

                  <div className="dev-card-body">
                    <div className="dev-meta-row">
                      <span>IP Address:</span>
                      <code>{dev.ipAddress}</code>
                    </div>
                    <div className="dev-meta-row">
                      <span>Location:</span>
                      <span>{dev.location}</span>
                    </div>
                    <div className="dev-meta-row">
                      <span>Expires in:</span>
                      <strong style={{ color: daysRemaining <= 3 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                        {daysRemaining} days
                      </strong>
                    </div>
                  </div>

                  <div className="dev-card-footer">
                    <button
                      className="revoke-dev-btn"
                      onClick={() => handleRevokeDevice(dev.id)}
                    >
                      ✕ Revoke Trust
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- SECTION 4: DETAILED LOGIN AUDIT TRAIL & HISTORY ---------------- */}
      <section className="card login-audit-section">
        <div className="card-title-row">
          <div>
            <h3>📜 Login Activity & Security Audit Trail</h3>
            <p className="card-subtitle">
              Comprehensive tamper-evident records of all login attempts, OTP challenges, and anomalies.
            </p>
          </div>

          {/* Filters */}
          <div className="audit-filter-pills">
            <button
              className={`filter-pill ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All Activity ({auditRecords.length})
            </button>
            <button
              className={`filter-pill ${filterType === "success" ? "active" : ""}`}
              onClick={() => setFilterType("success")}
            >
              Successful
            </button>
            <button
              className={`filter-pill ${filterType === "otp" ? "active" : ""}`}
              onClick={() => setFilterType("otp")}
            >
              OTP Challenged
            </button>
            <button
              className={`filter-pill ${filterType === "failed" ? "active" : ""}`}
              onClick={() => setFilterType("failed")}
            >
              Failed Attempts
            </button>
          </div>
        </div>

        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Status / Result</th>
                <th>Timestamp (IST)</th>
                <th>Browser & OS</th>
                <th>Device & Model</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Theme Applied</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                    No audit records matching this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const dateStr = new Date(r.timestamp).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  });

                  return (
                    <tr key={r.id}>
                      <td>
                        {r.status === "SUCCESS" && (
                          <span className="status-badge success">✓ SUCCESS</span>
                        )}
                        {r.status === "OTP_VERIFIED" && (
                          <span className="status-badge verified">🛡️ OTP VERIFIED</span>
                        )}
                        {r.status === "OTP_REQUIRED" && (
                          <span className="status-badge challenge">⚠️ OTP REQUIRED</span>
                        )}
                        {r.status === "FAILED_OTP" && (
                          <span className="status-badge failed">❌ FAILED OTP</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontSize: "12px" }}>
                        {dateStr}
                      </td>
                      <td>
                        <strong>{r.browser}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.os}</div>
                      </td>
                      <td>
                        <span>{r.deviceType}</span>
                        {r.deviceModel && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.deviceModel}</div>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>{r.ipAddress}</code>
                      </td>
                      <td style={{ fontSize: "12px" }}>
                        {r.location || `${r.city || ""}, ${r.state || ""}`}
                      </td>
                      <td>
                        <span className={`theme-applied-pill ${r.themeApplied || "dark"}`}>
                          {r.themeApplied === "light" ? "☀️ Light" : "🌙 Dark"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================================
          MODAL: TWO-FACTOR OTP VERIFICATION CHALLENGE
      ====================================================== */}
      {otpModalActive && pendingChallenge && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-dialog otp-challenge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <div className="otp-modal-icon">🔐</div>
              <div>
                <h3>Security Verification Required</h3>
                <span className="otp-subheading">Unrecognized environment detected</span>
              </div>
            </div>

            <div className="otp-modal-body">
              {/* Trigger Warning Box */}
              <div className="otp-trigger-banner">
                <strong>🚨 Detection Trigger:</strong>
                <div>{pendingChallenge.reason}</div>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px", lineHeight: "1.5" }}>
                A 6-digit One-Time Password (OTP) has been sent to your registered contact:
              </p>

              <div className="contact-destination-badge">
                <span>📬 {pendingChallenge.targetContact}</span>
                <span className="delivery-type">({pendingChallenge.deliveryChannel?.toUpperCase()})</span>
              </div>

              {/* Quick Demo Helper Box for Testing */}
              {pendingChallenge.demoOtpCode && (
                <div
                  className="demo-otp-helper"
                  onClick={() => setOtpCode(pendingChallenge.demoOtpCode)}
                  title="Click to automatically fill demo code"
                >
                  <span style={{ fontSize: "12px" }}>🔑 <strong>Demo Test Code:</strong></span>
                  <code className="demo-code-pill">{pendingChallenge.demoOtpCode}</code>
                  <span style={{ fontSize: "11px", color: "var(--accent-cyan)", marginLeft: "auto" }}>
                    (Click to fill)
                  </span>
                </div>
              )}

              {/* OTP Digits Input */}
              <div className="otp-input-wrap">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="otp-code-input"
                  autoFocus
                />
              </div>

              {otpError && (
                <div className="otp-error-alert">
                  ⚠️ {otpError}
                </div>
              )}

              {/* Trust Device Option */}
              <div className="trust-device-checkbox-wrap">
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={trustDeviceChecked}
                    onChange={(e) => setTrustDeviceChecked(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong>Mark this device and browser as trusted</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                      Skip OTP challenges on this device for the next {trustedDurationDays} days.
                    </p>
                  </div>
                </label>
              </div>

              {/* Expiry & Resend Timer */}
              <div className="otp-timer-row">
                {otpCountdown > 0 ? (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Code expires in <strong>{otpCountdown}s</strong>
                  </span>
                ) : (
                  <button className="resend-code-btn" onClick={handleResendOtp}>
                    🔄 Resend OTP Code
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                className="secondary-btn"
                onClick={() => {
                  setOtpModalActive(false);
                  setPendingChallenge(null);
                }}
              >
                Cancel Login
              </button>
              <button
                className="primary-btn"
                onClick={handleVerifyOtp}
                disabled={otpCode.length < 6 || verifyingOtp}
              >
                {verifyingOtp ? "Verifying..." : "Verify & Continue →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
