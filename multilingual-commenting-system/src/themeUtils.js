/* ======================================================
   THEME & IST TIME UTILITIES (TASK 4)
   Adapts theme based on Indian Standard Time (IST):
   - 5:00 AM to 12:00 PM IST => Light Theme
   - All other time periods  => Dark Theme
   Supports user manual overrides saved in profile/localStorage
====================================================== */

export const THEME_STORAGE_KEY = "multilingual_user_theme_pref_v2";

/**
 * Converts a given Date or timestamp into Indian Standard Time (UTC+5:30)
 */
export function getIstDate(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  // UTC offset in milliseconds
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  // IST is UTC + 5 hours 30 mins
  return new Date(utcMs + (5.5 * 3600000));
}

/**
 * Checks whether an IST date falls in the morning window (5:00 AM <= time < 12:00 PM IST)
 */
export function isMorningIST(dateInput = new Date()) {
  const ist = getIstDate(dateInput);
  const hour = ist.getHours();
  // 5:00 AM (inclusive) to 12:00 PM (exclusive)
  return hour >= 5 && hour < 12;
}

/**
 * Returns the automatic theme ("light" or "dark") based on IST login time
 */
export function getAutoThemeForTime(dateInput = new Date()) {
  return isMorningIST(dateInput) ? "light" : "dark";
}

/**
 * Formats IST time for user display e.g. "08:45 AM IST"
 */
export function formatIstTime(dateInput = new Date()) {
  const ist = getIstDate(dateInput);
  const timeStr = ist.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  return `${timeStr} IST`;
}

/**
 * Reads user's theme preference from localStorage or returns "auto"
 */
export function readSavedThemePreference() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { mode: "auto", manualTheme: null };
    return JSON.parse(raw);
  } catch {
    return { mode: "auto", manualTheme: null };
  }
}

/**
 * Persists user's theme preference
 */
export function saveThemePreference(preference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
  } catch (err) {
    console.error("Theme storage save failed:", err);
  }
}

/**
 * Applies the theme directly to document root and body
 */
export function applyThemeToDOM(theme) {
  const validTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", validTheme);
  document.body.setAttribute("data-theme", validTheme);
  if (validTheme === "light") {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  } else {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  }
  return validTheme;
}
