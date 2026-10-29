/**
 * Deterministic Avatar Generation Utility
 * Generates unique, consistent avatars based on user ID or username.
 * Prevents multiple users from displaying the same generic profile photo.
 */

const PRESET_USER_AVATARS = {
  "user-001": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80", // Shri Harini
  "user-002": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80", // Arun Kumar
  "user-003": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80", // Priya Sundaram
  "user-004": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80", // Carlos Mendez
  "user-005": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80", // Amina Al-Mansoor
  "harini": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  "arun": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
  "priya": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
  "carlos": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
  "amina": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
  "aarav": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
};

const COLOR_PAIRS = [
  ["#6366f1", "#4f46e5"], // Indigo
  ["#8b5cf6", "#7c3aed"], // Violet
  ["#06b6d4", "#0891b2"], // Cyan
  ["#10b981", "#059669"], // Emerald
  ["#f59e0b", "#d97706"], // Amber
  ["#ec4899", "#db2777"], // Pink
  ["#3b82f6", "#2563eb"], // Blue
  ["#14b8a6", "#0d9488"], // Teal
  ["#f43f5e", "#e11d48"], // Rose
  ["#a855f7", "#9333ea"]  // Purple
];

/**
 * Get a consistent and unique avatar URL for any user or comment.
 * If a recognized user ID or username is given, uses their dedicated avatar.
 * Otherwise, generates an inline SVG avatar with the user's initials and stable gradient colors.
 */
export function getDeterministicAvatar(item) {
  if (!item) {
    return generateSvgAvatar("U", COLOR_PAIRS[0]);
  }

  const userId = (item.userId || "").toLowerCase();
  const username = (item.username || item.name || "").toLowerCase();

  // 1. Direct preset matching
  if (userId && PRESET_USER_AVATARS[userId]) {
    return PRESET_USER_AVATARS[userId];
  }
  if (username) {
    if (PRESET_USER_AVATARS[username]) return PRESET_USER_AVATARS[username];
    const cleanUser = username.replace(/[\s_-]+/g, "");
    for (const [key, url] of Object.entries(PRESET_USER_AVATARS)) {
      if (cleanUser.includes(key) || key.includes(cleanUser)) {
        return url;
      }
    }
  }

  // 2. If the item already has a valid avatar or userAvatar
  const directAvatar = item.avatar || item.userAvatar;
  if (
    directAvatar &&
    typeof directAvatar === "string" &&
    directAvatar.startsWith("http")
  ) {
    return directAvatar;
  }

  // 3. Generate deterministic SVG initials avatar
  const displayName = item.name || item.username || item.userId || "User";
  const initials = displayName
    .trim()
    .split(/[\s_-]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  // Calculate stable hash from identifier string
  const hashKey = (userId || username || displayName);
  let hash = 0;
  for (let i = 0; i < hashKey.length; i++) {
    hash = hashKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLOR_PAIRS.length;
  const colors = COLOR_PAIRS[colorIndex];

  return generateSvgAvatar(initials, colors);
}

function generateSvgAvatar(initials, [startColor, endColor]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${startColor}"/>
        <stop offset="100%" stop-color="${endColor}"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="40" fill="url(#g)"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
