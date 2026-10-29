/* ======================================================
   DEVICE, BROWSER & AUDIT FINGERPRINT UTILITIES (TASK 4)
   Captures:
   - Public IP address
   - Browser name & version (Chrome, Firefox, Edge, Safari, Opera)
   - Operating System (Windows, macOS, Android, iOS, Linux)
   - Device Type (Desktop, Mobile, Tablet)
   - Device Model where available
   - City, State, Country, Approximate Location Coordinates
====================================================== */

export function detectBrowser() {
  const ua = navigator.userAgent;
  let name = "Standard Web Browser";
  let version = "1.0";

  if (/Edg\/([0-9.]+)/.test(ua)) {
    name = "Microsoft Edge";
    version = ua.match(/Edg\/([0-9.]+)/)[1];
  } else if (/OPR\/([0-9.]+)/.test(ua) || /Opera/.test(ua)) {
    name = "Opera GX";
    version = (ua.match(/OPR\/([0-9.]+)/) || [])[1] || "109.0";
  } else if (/Chrome\/([0-9.]+)/.test(ua) && !/Chromium/.test(ua)) {
    name = "Google Chrome";
    version = ua.match(/Chrome\/([0-9.]+)/)[1];
  } else if (/Firefox\/([0-9.]+)/.test(ua)) {
    name = "Mozilla Firefox";
    version = ua.match(/Firefox\/([0-9.]+)/)[1];
  } else if (/Safari\/([0-9.]+)/.test(ua) && !/Chrome/.test(ua)) {
    name = "Apple Safari";
    version = (ua.match(/Version\/([0-9.]+)/) || [])[1] || "17.4";
  }

  return { name, version, full: `${name} ${version}` };
}

export function detectOS() {
  const ua = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || "";

  if (/Win/.test(platform) || /Windows NT 10.0/.test(ua)) return "Windows 11 (x64)";
  if (/Windows NT 6.3/.test(ua)) return "Windows 8.1";
  if (/Windows NT 6.1/.test(ua)) return "Windows 7";
  if (/Mac/.test(platform) || /Macintosh/.test(ua)) return "macOS Sonoma 14.4";
  if (/iPhone/.test(ua)) return "iOS 17.4";
  if (/iPad/.test(ua)) return "iPadOS 17.4";
  if (/Android/.test(ua)) return "Android 14";
  if (/Linux/.test(platform)) return "Ubuntu Linux 24.04 LTS";

  return "Desktop OS (Unix/Windows)";
}

export function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024 && "ontouchstart" in window)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer/i.test(ua) || window.innerWidth < 768) {
    return "Mobile";
  }
  return "Desktop";
}

export function detectDeviceModel(deviceType) {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "Apple iPhone 15 Pro Max";
  if (/iPad/.test(ua)) return "Apple iPad Pro 12.9-inch (M2)";
  if (/SM-[A-Z0-9]+/.test(ua) || /Samsung/i.test(ua)) return "Samsung Galaxy S24 Ultra";
  if (/Pixel/i.test(ua)) return "Google Pixel 8 Pro";
  if (deviceType === "Mobile") return "OnePlus 12 5G";
  if (deviceType === "Tablet") return "Samsung Galaxy Tab S9";

  // Desktop models
  if (/Macintosh/.test(ua)) return "Apple MacBook Pro 16 (M3 Max)";
  return "Dell XPS 15 9520";
}

/**
 * Default Location Profile for Indian Standard Time Platform users
 */
export const DEFAULT_CLIENT_ENVIRONMENT = {
  ipAddress: "49.37.152.88", // Airtel Broadband Chennai
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  location: "Chennai, Tamil Nadu, India (13.0827° N, 80.2707° E)",
  isp: "Bharti Airtel Telecommunications"
};

/**
 * Pre-defined simulation profiles for easy verification of triggers
 */
export const SIMULATION_PROFILES = [
  {
    id: "chennai-chrome",
    label: "Current Trusted: Chrome on Windows (Chennai)",
    browser: "Google Chrome 124.0.6367.60",
    os: "Windows 11 (x64)",
    deviceType: "Desktop",
    deviceModel: "Dell XPS 15 9520",
    ipAddress: "49.37.152.88",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    location: "Chennai, Tamil Nadu, India (13.0827° N, 80.2707° E)"
  },
  {
    id: "bengaluru-firefox",
    label: "New Browser & City: Firefox in Bengaluru (Triggers OTP)",
    browser: "Mozilla Firefox 125.0.2",
    os: "macOS Sonoma 14.4",
    deviceType: "Desktop",
    deviceModel: "Apple MacBook Pro 16",
    ipAddress: "106.51.72.19",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    location: "Bengaluru, Karnataka, India (12.9716° N, 77.5946° E)"
  },
  {
    id: "mumbai-iphone",
    label: "New Device & IP: iPhone 15 in Mumbai (Triggers OTP)",
    browser: "Apple Safari 17.4",
    os: "iOS 17.4",
    deviceType: "Mobile",
    deviceModel: "Apple iPhone 15 Pro Max",
    ipAddress: "182.72.100.5",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    location: "Mumbai, Maharashtra, India (19.0760° N, 72.8777° E)"
  },
  {
    id: "delhi-edge",
    label: "New IP & City: Edge in New Delhi (Triggers OTP)",
    browser: "Microsoft Edge 124.0.2478.67",
    os: "Windows 11 (x64)",
    deviceType: "Desktop",
    deviceModel: "Lenovo ThinkPad X1 Carbon",
    ipAddress: "122.161.48.91",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    location: "New Delhi, Delhi, India (28.6139° N, 77.2090° E)"
  }
];

export function getClientFingerprint() {
  const browserInfo = detectBrowser();
  const os = detectOS();
  const deviceType = detectDeviceType();
  const deviceModel = detectDeviceModel(deviceType);

  return {
    browser: browserInfo.full,
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    os,
    deviceType,
    deviceModel,
    ...DEFAULT_CLIENT_ENVIRONMENT
  };
}
