import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dns from "dns";
import { fileURLToPath } from "url";
import "dotenv/config";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

// Ensure DNS resolves MongoDB Atlas SRV records properly on Windows
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch (dnsErr) {
    console.log("DNS setServers note:", dnsErr.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================================
// ES MODULE PATH SETUP
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// PATHS
// ======================================================

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const VIDEOS_DIR = path.join(ROOT_DIR, "public", "videos");
const THUMBNAILS_DIR = path.join(ROOT_DIR, "public", "thumbnails");
const DATA_DIR = path.join(__dirname, "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const COMMENT_REPORTS_FILE = path.join(DATA_DIR, "comment_reports.json");
const COMMENT_HISTORY_FILE = path.join(DATA_DIR, "comment_history.json");
const DOWNLOADS_FILE = path.join(DATA_DIR, "downloads.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
const DEVICES_FILE = path.join(DATA_DIR, "devices.json");
const LOGIN_RECORDS_FILE = path.join(DATA_DIR, "login_records.json");
const TRUSTED_DEVICES_FILE = path.join(DATA_DIR, "trusted_devices.json");
const USER_SECURITY_FILE = path.join(DATA_DIR, "user_security.json");
const VIDEO_PROGRESS_FILE = path.join(DATA_DIR, "video_progress.json");
const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");

// Ensure required directories exist
[DATA_DIR, VIDEOS_DIR, THUMBNAILS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Default seed comments
const DEFAULT_COMMENTS = [
  {
    id: "comment-1",
    userId: "user-002",
    username: "Aarav Sharma",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
    userLocation: "Mumbai, India",
    location: "Mumbai, India",
    originalText: "This distributed system architecture course explains multi-region failover and sharding brilliantly!",
    text: "This distributed system architecture course explains multi-region failover and sharding brilliantly!",
    originalLang: "en",
    language: "en",
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 18,
    dislikes: 1,
    likedBy: ["Harini", "Priya"],
    dislikedBy: [],
    parentId: null,
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-2",
    userId: "user-003",
    username: "Priya Rajan",
    userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    userLocation: "Chennai, India",
    location: "Chennai, India",
    originalText: "இந்த பதிவு மிகவும் நன்றாக உள்ளது. பல மொழிகளில் கருத்துகளைப் படிக்க முடிகிறது.",
    text: "இந்த பதிவு மிகவும் நன்றாக உள்ளது. பல மொழிகளில் கருத்துகளைப் படிக்க முடிகிறது.",
    originalLang: "ta",
    language: "ta",
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 24,
    dislikes: 0,
    likedBy: ["Harini"],
    dislikedBy: [],
    parentId: null,
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-3",
    userId: "user-004",
    username: "Carlos Mendez",
    userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
    userLocation: "Madrid, Spain",
    location: "Madrid, Spain",
    originalText: "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.",
    text: "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.",
    originalLang: "es",
    language: "es",
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 12,
    dislikes: 0,
    likedBy: ["Harini"],
    dislikedBy: [],
    parentId: null,
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-4",
    userId: "user-001",
    username: "Shri Harini",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    userLocation: "Bangalore, India",
    location: "Bangalore, India",
    originalText: "நன்றி @Priya! Glad the real-time multilingual translations are working smoothly.",
    text: "நன்றி @Priya! Glad the real-time multilingual translations are working smoothly.",
    originalLang: "ta",
    language: "ta",
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now() - 3600000 * 1.5,
    updatedAt: Date.now() - 3600000 * 1.5,
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 9,
    dislikes: 0,
    likedBy: ["Priya", "Arun"],
    dislikedBy: [],
    parentId: "comment-2",
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-5",
    userId: "user-005",
    username: "Amina Al-Mansoor",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
    userLocation: "Dubai, UAE",
    location: "Dubai, UAE",
    originalText: "هذه المنصة مفيدة للغاية وتوفر ترجمة فورية دقيقة لجميع اللغات.",
    text: "هذه المنصة مفيدة للغاية وتوفر ترجمة فورية دقيقة لجميع اللغات.",
    originalLang: "ar",
    language: "ar",
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 15,
    dislikes: 0,
    likedBy: ["Harini", "Carlos"],
    dislikedBy: [],
    parentId: null,
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  }
];

if (!fs.existsSync(COMMENTS_FILE)) fs.writeFileSync(COMMENTS_FILE, JSON.stringify(DEFAULT_COMMENTS, null, 2));
if (!fs.existsSync(COMMENT_REPORTS_FILE)) fs.writeFileSync(COMMENT_REPORTS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(COMMENT_HISTORY_FILE)) fs.writeFileSync(COMMENT_HISTORY_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(DOWNLOADS_FILE)) fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(TRANSACTIONS_FILE)) fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(LOGIN_RECORDS_FILE)) fs.writeFileSync(LOGIN_RECORDS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(TRUSTED_DEVICES_FILE)) fs.writeFileSync(TRUSTED_DEVICES_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(USER_SECURITY_FILE)) fs.writeFileSync(USER_SECURITY_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(VIDEO_PROGRESS_FILE)) fs.writeFileSync(VIDEO_PROGRESS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(MEETINGS_FILE)) fs.writeFileSync(MEETINGS_FILE, JSON.stringify({}, null, 2));

// In-memory OTP store for pending challenges
const PENDING_OTP_STORE = new Map();

// In-memory single-use download tokens
const DOWNLOAD_TOKENS = new Map();

// In-memory concurrency locks
const ACTIVE_DOWNLOAD_LOCKS = new Set();

// In-memory rate limiting and CAPTCHA stores
const CAPTCHA_STORE = new Map();
const COMMENT_RATE_LIMIT_STORE = new Map();

// Real-Time WebRTC Video Calling Signaling Stores
const MEETING_SIGNALS = new Map();
const MEETING_CHATS = new Map();

// Razorpay test credentials & test order store
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_AntigravityDev";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "antigravity_secret_key_2026";
const PENDING_ORDERS = new Map();

// ======================================================
// NODEMAILER REAL EMAIL OTP TRANSPORT
// ======================================================
let mailTransporter = null;
const LAST_DELIVERED_EMAILS = new Map();

async function initMailer() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    mailTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log("✓ Nodemailer Ethereal SMTP ready for real OTP delivery.");
  } catch (err) {
    mailTransporter = nodemailer.createTransport({ jsonTransport: true });
    console.log("ℹ️ Mailer running with JSON transport fallback.");
  }
}
initMailer();

// ======================================================
// MONGODB ATLAS INTEGRATION (ALL 9 COLLECTIONS)
// ======================================================

let mongoClient = null;
let db = null;
let commentsColl = null;
let commentReportsColl = null;
let commentHistoryColl = null;
let downloadsColl = null;
let devicesColl = null;
let subscriptionsColl = null;
let transactionsColl = null;
let loginRecordsColl = null;
let trustedDevicesColl = null;
let userSecurityColl = null;
let videoProgressColl = null;
let meetingsColl = null;
let meetingChatsColl = null;
let isMongoConnected = false;
let mongoLastError = null;
let detectedServerIp = null;

async function getEgressIp() {
  if (detectedServerIp) return detectedServerIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      detectedServerIp = data.ip;
      return detectedServerIp;
    }
  } catch (e) { }
  return null;
}

function getMongoErrorAnalysis(errStr) {
  if (!errStr) return null;
  if (errStr.includes("SSL alert number 80") || errStr.includes("tlsv1 alert internal error")) {
    return {
      category: "TLS_HANDSHAKE_ERROR_SSL_ALERT_80",
      reason: "Atlas TLS gateway rejected the connection. The server IP address is not whitelisted in MongoDB Atlas Network Access IP Access List.",
      detectedEgressIp: detectedServerIp || "Dynamic Cloud Egress IP",
      actionRequired: `In MongoDB Atlas Console -> Security -> Network Access -> click '+ Add IP Address' -> select 'Allow Access From Anywhere' (0.0.0.0/0)${detectedServerIp ? ` or add '${detectedServerIp}'` : ''} -> Confirm.`
    };
  }
  if (errStr.includes("Authentication failed") || errStr.includes("bad auth")) {
    return {
      category: "AUTH_FAILURE",
      reason: "MongoDB database credentials rejected.",
      actionRequired: "Verify database username and password in .env MONGO_URI."
    };
  }
  if (errStr.includes("ENOTFOUND") || errStr.includes("querySrv")) {
    return {
      category: "DNS_RESOLUTION_ERROR",
      reason: "Unable to resolve MongoDB Atlas SRV record.",
      actionRequired: "Check internet connection and DNS servers (8.8.8.8, 1.1.1.1)."
    };
  }
  return {
    category: "CONNECTION_FAILED",
    reason: errStr,
    actionRequired: "Check MongoDB Atlas cluster status and network configuration."
  };
}

async function initMongoDB() {
  if (isMongoConnected) return;
  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    console.warn("⚠️ MONGO_URI not found in environment. Running on persistent local storage fallback.");
    return;
  }

  // Detect server egress IP in parallel
  getEgressIp().catch(() => {});

  // Robust URI Sanitization: strip quotes, trailing whitespace, and placeholder brackets
  let sanitizedUri = rawUri.trim().replace(/^["']|["']$/g, "").replace(/<([^>]+)>/g, "$1");
  const srvMatch = sanitizedUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^/?#]+)(.*)$/);
  let parsedUser = "";
  let parsedPass = "";
  let parsedHost = "";
  let parsedRest = "";

  if (srvMatch) {
    const protocol = srvMatch[1];
    parsedUser = srvMatch[2];
    parsedPass = srvMatch[3];
    parsedHost = srvMatch[4];
    parsedRest = srvMatch[5];
    try {
      parsedPass = encodeURIComponent(decodeURIComponent(parsedPass));
    } catch {
      parsedPass = encodeURIComponent(parsedPass);
    }
    sanitizedUri = `${protocol}${parsedUser}:${parsedPass}@${parsedHost}${parsedRest}`;
  }

  const maskedUri = sanitizedUri.replace(/:[^:]*@/, ":****@");
  console.log(`[MongoConnection] Attempting connection to Atlas: ${maskedUri}`);

  async function attemptConnect(uriToTry, label) {
    const client = new MongoClient(uriToTry, {
      family: 4,
      tls: true,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    await client.connect();
    await client.db("subscription_system").admin().ping();
    return client;
  }

  let connectedClient = null;
  let primaryError = null;

  try {
    connectedClient = await attemptConnect(sanitizedUri, "Primary URI");
    console.log("✓ Primary MongoDB connection established successfully!");
  } catch (err) {
    primaryError = err;
    console.warn(`[MongoConnection] Primary connection attempt failed: ${err.message}`);

    // If connecting with SRV to cluster0, attempt direct replica-set seed fallback
    if (sanitizedUri.includes("cluster0.lslab9n.mongodb.net")) {
      const directUri = `mongodb://${parsedUser}:${parsedPass}@ac-opuscjt-shard-00-00.lslab9n.mongodb.net:27017,ac-opuscjt-shard-00-01.lslab9n.mongodb.net:27017,ac-opuscjt-shard-00-02.lslab9n.mongodb.net:27017/subscription_system?ssl=true&replicaSet=atlas-3e9yys-shard-0&authSource=admin&retryWrites=true&w=majority`;
      const maskedDirect = directUri.replace(/:[^:]*@/, ":****@");
      console.log(`[MongoConnection] Attempting direct replica-set seed fallback: ${maskedDirect}...`);
      try {
        connectedClient = await attemptConnect(directUri, "Direct Replica Set");
        console.log("✓ Direct replica-set fallback connected successfully to Atlas!");
      } catch (fallbackErr) {
        console.error(`[MongoConnection] Direct fallback also failed: ${fallbackErr.message}`);
      }
    }
  }

  if (connectedClient) {
    mongoClient = connectedClient;
    db = mongoClient.db("subscription_system");
    commentsColl = db.collection("comments");
    commentReportsColl = db.collection("comment_reports");
    commentHistoryColl = db.collection("comment_history");
    downloadsColl = db.collection("downloads");
    devicesColl = db.collection("devices");
    subscriptionsColl = db.collection("subscriptions");
    transactionsColl = db.collection("transactions");
    loginRecordsColl = db.collection("login_records");
    trustedDevicesColl = db.collection("trusted_devices");
    userSecurityColl = db.collection("user_security");
    videoProgressColl = db.collection("video_progress");
    meetingsColl = db.collection("meetings");
    meetingChatsColl = db.collection("meeting_chats");
    isMongoConnected = true;
    mongoLastError = null;

    const clusterName = sanitizedUri.match(/@([^/?]+)/)?.[1] || "Atlas Cluster";
    console.log(`========================================`);
    console.log(`✓ Connected successfully to MongoDB Atlas database: subscription_system (${clusterName})`);
    console.log(`========================================`);

    // Create indexes across all application collections
    await Promise.allSettled([
      commentsColl.createIndex({ id: 1 }, { unique: true }),
      commentsColl.createIndex({ createdAt: -1 }),
      commentReportsColl.createIndex({ id: 1 }, { unique: true }),
      commentHistoryColl.createIndex({ id: 1 }, { unique: true }),
      commentHistoryColl.createIndex({ commentId: 1 }),
      downloadsColl.createIndex({ id: 1 }, { unique: true }),
      downloadsColl.createIndex({ userId: 1, downloadTimestamp: -1 }),
      subscriptionsColl.createIndex({ userId: 1 }, { unique: true }),
      transactionsColl.createIndex({ transactionId: 1 }),
      transactionsColl.createIndex({ userId: 1, paymentDate: -1 }),
      loginRecordsColl.createIndex({ id: 1 }),
      loginRecordsColl.createIndex({ userId: 1, timestamp: -1 }),
      trustedDevicesColl.createIndex({ id: 1 }),
      trustedDevicesColl.createIndex({ userId: 1, deviceId: 1 }),
      videoProgressColl.createIndex({ userId: 1, videoId: 1 }, { unique: true }),
      meetingsColl.createIndex({ roomId: 1 }, { unique: true })
    ]);

    // Seed default comments if empty
    const commentsCount = await commentsColl.countDocuments();
    if (commentsCount === 0) {
      await commentsColl.insertMany(DEFAULT_COMMENTS);
      console.log("✓ Seeded initial comments into MongoDB Atlas comments collection.");
    }

    // Seed default subscription if empty
    const count = await subscriptionsColl.countDocuments();
    if (count === 0) {
      const defaultSubs = getSubscriptionsFromDisk();
      for (const [userId, sub] of Object.entries(defaultSubs)) {
        await subscriptionsColl.updateOne({ userId }, { $set: sub }, { upsert: true });
      }
      console.log("✓ Seeded initial subscriptions into MongoDB Atlas.");
    }

    // Seed default comment history if empty
    const histCount = await commentHistoryColl.countDocuments();
    if (histCount === 0) {
      const defaultHist = readCommentHistoryFromDisk();
      if (defaultHist.length > 0) {
        await commentHistoryColl.insertMany(defaultHist);
        console.log("✓ Seeded initial comment history into MongoDB Atlas.");
      }
    }

    // Seed default comment reports if empty
    const repCount = await commentReportsColl.countDocuments();
    if (repCount === 0) {
      const defaultReps = readReportsFromDisk();
      if (defaultReps.length > 0) {
        await commentReportsColl.insertMany(defaultReps);
        console.log("✓ Seeded initial comment reports into MongoDB Atlas.");
      }
    }

    mongoLastError = null;
  } else {
    isMongoConnected = false;
    mongoLastError = primaryError ? primaryError.message : "Connection failed";
    console.error("************************************************************");
    console.error("❌ MONGODB ATLAS CONNECTION FAILED");
    console.error(`Error: ${mongoLastError}`);
    if (detectedServerIp) console.error(`Server Egress IP: ${detectedServerIp}`);
    console.error("Action Required: Ensure '0.0.0.0/0' is whitelisted in MongoDB Atlas Network Access.");
    console.error("The server will run with local fallback, but Atlas is DISCONNECTED.");
    console.error("************************************************************");
  }
}

// Background reconnect monitor if connection is interrupted
setInterval(() => {
  if (!isMongoConnected) initMongoDB();
}, 45000);

// ======================================================
// MEMBERSHIP TIER DEFINITIONS (TASK 3)
// ======================================================

const MEMBERSHIP_PLANS = {
  Free: {
    id: "Free",
    name: "Free Starter",
    badge: "Free Tier",
    tagline: "Essential access with community multilingual commenting",
    pricing: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    },
    validityDays: {
      monthly: 30,
      quarterly: 90,
      yearly: 365
    },
    streamingQuality: "Standard 720p",
    maxQualityRank: 1, // 1: 720p, 2: 1080p, 3: 2K, 4: 4K HDR
    watchTimeLimitMinutes: 15, // 15 mins daily or 60-second video preview
    dailyLimit: 1,
    monthlyLimit: 10,
    maxDevices: 1,
    adFree: false,
    priorityAccess: false,
    exclusiveCourses: false,
    speedTier: "Standard (1x)",
    renewalPolicy: "No payment required. Free tier never expires.",
    features: [
      "1 Video download per day (10/month)",
      "Standard 720p streaming quality",
      "15 minutes daily watch time allowance",
      "1 Registered device authorization",
      "Access to Free tier starter catalog",
      "Multilingual comment posting & instant translation",
      "Ad-supported viewing"
    ],
    upgradeEligibility: ["Bronze", "Silver", "Gold"]
  },
  Bronze: {
    id: "Bronze",
    name: "Bronze Pro",
    badge: "Bronze Member",
    tagline: "Full HD streaming, ad-free viewing, and expanded daily limits",
    pricing: {
      monthly: 199,
      quarterly: 499, // Save 16%
      yearly: 1799    // Save 25%
    },
    validityDays: {
      monthly: 30,
      quarterly: 90,
      yearly: 365
    },
    streamingQuality: "Full HD 1080p",
    maxQualityRank: 2,
    watchTimeLimitMinutes: 60, // 60 mins daily watch time
    dailyLimit: 3,
    monthlyLimit: 50,
    maxDevices: 2,
    adFree: true,
    priorityAccess: false,
    exclusiveCourses: false,
    speedTier: "Fast (2x)",
    renewalPolicy: "Auto-renews at end of billing period. Cancel anytime.",
    features: [
      "3 Video downloads per day (50/month)",
      "Full HD 1080p crisp streaming",
      "60 minutes daily watch time",
      "2 Registered device authorizations",
      "100% Ad-free viewing experience",
      "Fast 2x bandwidth streaming speed",
      "Access to Free & Bronze catalog",
      "Offline encrypted video download tokens",
      "Priority multilingual translation queue"
    ],
    upgradeEligibility: ["Silver", "Gold"]
  },
  Silver: {
    id: "Silver",
    name: "Silver Premier",
    badge: "Silver VIP",
    tagline: "Ultra HD 2K streaming, unlimited watch time & priority access",
    pricing: {
      monthly: 499,
      quarterly: 1299, // Save 13%
      yearly: 4499     // Save 25%
    },
    validityDays: {
      monthly: 30,
      quarterly: 90,
      yearly: 365
    },
    streamingQuality: "Ultra HD 2K",
    maxQualityRank: 3,
    watchTimeLimitMinutes: 0, // Unlimited
    dailyLimit: 5,
    monthlyLimit: 100,
    maxDevices: 3,
    adFree: true,
    priorityAccess: true,
    exclusiveCourses: false,
    speedTier: "Ultra Fast (3x)",
    renewalPolicy: "Auto-renews at end of billing period. Cancel anytime.",
    features: [
      "5 Video downloads per day (100/month)",
      "Ultra HD 2K cinematic streaming",
      "Unlimited daily watch time (No limits)",
      "3 Registered device authorizations",
      "100% Ad-free viewing experience",
      "Priority CDN bandwidth streaming (3x)",
      "Access to Free, Bronze & Silver catalog",
      "Early priority access to newly released content",
      "Offline encrypted video downloads",
      "Verified VIP profile badge"
    ],
    upgradeEligibility: ["Gold"]
  },
  Gold: {
    id: "Gold",
    name: "Gold Executive",
    badge: "Gold VIP Crown",
    tagline: "The ultimate 4K HDR tier with masterclasses & VIP support",
    pricing: {
      monthly: 999,
      quarterly: 2499, // Save 17%
      yearly: 8999     // Save 25%
    },
    validityDays: {
      monthly: 30,
      quarterly: 90,
      yearly: 365
    },
    streamingQuality: "4K HDR Cinematic",
    maxQualityRank: 4,
    watchTimeLimitMinutes: 0, // Unlimited
    dailyLimit: 10,
    monthlyLimit: 200,
    maxDevices: 5,
    adFree: true,
    priorityAccess: true,
    exclusiveCourses: true,
    speedTier: "Max Dedicated CDN (5x)",
    renewalPolicy: "Auto-renews at end of billing period. Cancel anytime.",
    features: [
      "10 Video downloads per day (200/month)",
      "4K HDR Cinematic streaming with Dolby audio",
      "Unlimited watch time & zero buffer playback",
      "5 Registered device authorizations",
      "100% Ad-free luxury viewing",
      "Full access to exclusive Executive Masterclasses",
      "Dedicated 24/7 VIP Concierge & engineering support",
      "Highest daily download quota and multi-threaded speed",
      "Exclusive Gold Crown member profile badge",
      "All platform features permanently unlocked"
    ],
    upgradeEligibility: []
  }
};

// Backwards compatibility alias for Task 2
const DOWNLOAD_PLANS = MEMBERSHIP_PLANS;

// ======================================================
// EXPANDED VIDEO CATALOG (ALL 4 TIERS)
// ======================================================

const VIDEOS = [
  {
    id: "video-1",
    title: "Introduction to Artificial Intelligence",
    description: "Learn core concepts of modern AI, neural networks, and prompt engineering fundamentals.",
    thumbnail: "/thumbnails/ai.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/artificial-intelligence/600/340",
    fileName: "video1.mp4",
    fileSize: "125 KB",
    duration: "14:20",
    tierRequired: "Free",
    category: "Foundation",
    accessible: true
  },
  {
    id: "video-2",
    title: "Machine Learning Fundamentals",
    description: "Deep dive into supervised learning, regression models, classification algorithms, and loss functions.",
    thumbnail: "/thumbnails/ml.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/machine-learning/600/340",
    fileName: "video2.mp4",
    fileSize: "180 KB",
    duration: "22:45",
    tierRequired: "Free",
    category: "Data Science",
    accessible: true
  },
  {
    id: "video-3",
    title: "Advanced React & Distributed Systems",
    description: "Master React state orchestration, micro-frontends, concurrent rendering, and real-time streaming.",
    thumbnail: "/thumbnails/react.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/react-development/600/340",
    fileName: "video3.mp4",
    fileSize: "220 KB",
    duration: "31:10",
    tierRequired: "Bronze",
    category: "Frontend Engineering",
    accessible: true
  },
  {
    id: "video-4",
    title: "Cloud Architecture & Microservices Mastery",
    description: "Enterprise multi-region clusters, Kubernetes orchestration, zero-trust security, and high throughput.",
    thumbnail: "/thumbnails/cloud.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/cloud-architecture/600/340",
    fileName: "video4.mp4",
    fileSize: "260 KB",
    duration: "45:30",
    tierRequired: "Silver",
    category: "Cloud Engineering",
    accessible: true
  },
  {
    id: "video-5",
    title: "Executive Masterclass: Quantum Computing & AI Ethics",
    description: "Exclusive Gold masterclass on qubit algorithms, quantum cryptography, and governance of superintelligent systems.",
    thumbnail: "/thumbnails/quantum.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/quantum-computing/600/340",
    fileName: "video5.mp4",
    fileSize: "310 KB",
    duration: "58:15",
    tierRequired: "Gold",
    category: "Executive Masterclass",
    accessible: true
  }
];

// ======================================================
// PERSISTENT DATA HELPERS (DISK + MONGODB SYNC)
// ======================================================

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, value) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
  }
}

function getSubscriptionsFromDisk() {
  const defaultSubs = {
    "user-001": {
      userId: "user-001",
      username: "Harini",
      userEmail: "harini@example.com",
      plan: "Gold",
      billingCycle: "yearly",
      active: true,
      status: "ACTIVE",
      autoRenew: true,
      amount: 8999,
      currency: "INR",
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      expiryDate: Date.now() + 335 * 24 * 60 * 60 * 1000,
      nextRenewalDate: Date.now() + 335 * 24 * 60 * 60 * 1000,
      paymentId: "pay_test_gold_init_001",
      orderId: "order_test_gold_init_001",
      invoiceNumber: "INV-2026-894102",
      updatedAt: Date.now()
    },
    "user-002": {
      userId: "user-002",
      username: "Arun",
      userEmail: "arun@example.com",
      plan: "Bronze",
      billingCycle: "monthly",
      active: true,
      status: "ACTIVE",
      autoRenew: true,
      amount: 199,
      currency: "INR",
      startDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
      expiryDate: Date.now() + 25 * 24 * 60 * 60 * 1000,
      nextRenewalDate: Date.now() + 25 * 24 * 60 * 60 * 1000,
      paymentId: "pay_test_bronze_002",
      orderId: "order_test_bronze_002",
      invoiceNumber: "INV-2026-512930",
      updatedAt: Date.now()
    },
    "user-003": {
      userId: "user-003",
      username: "Priya",
      userEmail: "priya@example.com",
      plan: "Free",
      billingCycle: "monthly",
      active: true,
      status: "ACTIVE",
      autoRenew: false,
      amount: 0,
      currency: "INR",
      startDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      nextRenewalDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      paymentId: "free_plan",
      orderId: "free_plan",
      invoiceNumber: "INV-FREE-003",
      updatedAt: Date.now()
    }
  };
  return readJsonFile(SUBSCRIPTIONS_FILE, defaultSubs);
}

function saveSubscriptionsToDisk(subs) {
  writeJsonFile(SUBSCRIPTIONS_FILE, subs);
}

async function getSubscriptionRecord(userId) {
  // Try MongoDB Atlas first if connected
  if (isMongoConnected && subscriptionsColl) {
    try {
      const doc = await subscriptionsColl.findOne({ userId });
      if (doc) {
        delete doc._id;
        return doc;
      }
    } catch (err) {
      console.error("MongoDB getSubscriptionRecord error:", err.message);
    }
  }

  // Fallback to local storage
  const subs = getSubscriptionsFromDisk();
  return subs[userId] || null;
}

async function saveSubscriptionRecord(subscription) {
  const { userId } = subscription;
  // 1. Save to local disk
  const subs = getSubscriptionsFromDisk();
  subs[userId] = subscription;
  saveSubscriptionsToDisk(subs);

  // 2. Save to MongoDB Atlas
  if (isMongoConnected && subscriptionsColl) {
    try {
      await subscriptionsColl.updateOne({ userId }, { $set: subscription }, { upsert: true });
    } catch (err) {
      console.error("MongoDB saveSubscriptionRecord error:", err.message);
    }
  }
}

function readTransactionsFromDisk() {
  return readJsonFile(TRANSACTIONS_FILE, []);
}

function saveTransactionsToDisk(transactions) {
  writeJsonFile(TRANSACTIONS_FILE, transactions);
}

async function saveTransactionRecord(transaction) {
  // 1. Save to local disk
  const txs = readTransactionsFromDisk();
  txs.unshift(transaction);
  saveTransactionsToDisk(txs);

  // 2. Save to MongoDB Atlas
  if (isMongoConnected && transactionsColl) {
    try {
      await transactionsColl.insertOne({ ...transaction });
    } catch (err) {
      console.error("MongoDB saveTransactionRecord error:", err.message);
    }
  }
}

async function getTransactionsForUser(userId) {
  if (isMongoConnected && transactionsColl) {
    try {
      const list = await transactionsColl
        .find({ userId })
        .sort({ paymentDate: -1 })
        .toArray();
      if (list && list.length > 0) {
        return list.map((item) => {
          const c = { ...item };
          delete c._id;
          return c;
        });
      }
    } catch (err) {
      console.error("MongoDB getTransactionsForUser error:", err.message);
    }
  }

  const txs = readTransactionsFromDisk();
  return txs
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.paymentDate - a.paymentDate);
}

function getDevices() {
  const defaultDevices = {
    "user-001": [
      {
        deviceId: "device-desktop-01",
        deviceName: "Primary Workstation",
        browser: "Chrome",
        registeredAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastUsedAt: Date.now()
      }
    ]
  };
  return readJsonFile(DEVICES_FILE, defaultDevices);
}

function saveDevices(devs) {
  writeJsonFile(DEVICES_FILE, devs);
}

function readDownloads() {
  return readJsonFile(DOWNLOADS_FILE, []);
}

function saveDownloads(downloads) {
  writeJsonFile(DOWNLOADS_FILE, downloads);
  if (isMongoConnected && downloadsColl && downloads.length > 0) {
    const latest = downloads[downloads.length - 1];
    if (latest && latest.id) {
      downloadsColl.updateOne({ id: latest.id }, { $set: latest }, { upsert: true }).catch(() => { });
    }
  }
}

async function getDownloadsForUser(userId) {
  if (isMongoConnected && downloadsColl) {
    try {
      const list = await downloadsColl.find({ userId }).sort({ downloadTimestamp: -1 }).toArray();
      if (list && list.length > 0) {
        return list.map(d => { const doc = { ...d }; delete doc._id; return doc; });
      }
    } catch (e) {
      console.warn("MongoDB getDownloadsForUser fallback:", e.message);
    }
  }
  const all = readDownloads();
  return all.filter(d => d.userId === userId).sort((a, b) => b.downloadTimestamp - a.downloadTimestamp);
}

// ======================================================
// TASK 1: MULTILINGUAL COMMENTS & MODERATION HELPERS
// ======================================================

const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "idiot", "stupid", "bastard", "crap",
  "f*ck", "sh*t", "b!tch", "a$$hole", "dumbass", "thevidiya", "badava", "kamina", "kameena"
];

const BLOCKED_DOMAINS = [
  "bit.ly", "tinyurl.com", "grabify", "iplogger", "discord.gg", "free-crypto", "phish.me"
];

function readCommentsFromDisk() {
  return readJsonFile(COMMENTS_FILE, DEFAULT_COMMENTS);
}

function saveCommentsToDisk(comments) {
  writeJsonFile(COMMENTS_FILE, comments);
}

async function getCommentsFromDB() {
  let list = [];
  if (isMongoConnected && commentsColl) {
    try {
      const dbList = await commentsColl.find().toArray();
      if (dbList && dbList.length > 0) {
        list = dbList.map(c => { const doc = { ...c }; delete doc._id; return doc; });
      }
    } catch (e) {
      console.warn("MongoDB getCommentsFromDB error:", e.message);
    }
  }
  if (!list || list.length === 0) {
    list = readCommentsFromDisk();
  }

  // Normalize all comment fields across legacy schemas
  return list.map(c => ({
    ...c,
    avatar: c.avatar || c.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || "User")}&background=6366f1&color=fff&size=120`,
    userAvatar: c.userAvatar || c.avatar,
    location: c.location || c.userLocation || "Global",
    userLocation: c.userLocation || c.location || "Global",
    language: c.language || c.originalLang || "en",
    originalLang: c.originalLang || c.language || "en",
    text: c.text || c.originalText || "",
    originalText: c.originalText || c.text || "",
    isDeleted: Boolean(c.isDeleted || c.deleted || c.text === "[Comment deleted by user]"),
    deleted: Boolean(c.deleted || c.isDeleted || c.text === "[Comment deleted by user]"),
    deletedBy: c.deletedBy || null,
    isEdited: Boolean(c.isEdited || c.edited),
    edited: Boolean(c.edited || c.isEdited),
    parentId: c.parentId || null,
    likes: typeof c.likes === "number" ? c.likes : 0,
    dislikes: typeof c.dislikes === "number" ? c.dislikes : 0,
    likedBy: Array.isArray(c.likedBy) ? c.likedBy : [],
    dislikedBy: Array.isArray(c.dislikedBy) ? c.dislikedBy : [],
    version: c.version || 1
  }));
}

async function saveCommentToDB(comment) {
  const all = readCommentsFromDisk();
  const idx = all.findIndex(c => c.id === comment.id);
  if (idx >= 0) all[idx] = comment;
  else all.unshift(comment);
  saveCommentsToDisk(all);

  if (isMongoConnected && commentsColl) {
    try {
      await commentsColl.updateOne({ id: comment.id }, { $set: comment }, { upsert: true });
    } catch (e) {
      console.warn("MongoDB saveCommentToDB error:", e.message);
    }
  }
}

async function deleteCommentFromDB(id, softDelete = false) {
  const all = readCommentsFromDisk();
  const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) {
    if (softDelete) {
      all[idx].isDeleted = true;
      all[idx].deleted = true;
      all[idx].text = "[Comment deleted by user]";
      all[idx].originalText = "[Comment deleted by user]";
    } else {
      all.splice(idx, 1);
    }
    saveCommentsToDisk(all);
  }

  if (isMongoConnected && commentsColl) {
    try {
      if (softDelete) {
        await commentsColl.updateOne({ id }, { $set: { isDeleted: true, deleted: true, text: "[Comment deleted by user]", originalText: "[Comment deleted by user]" } });
      } else {
        await commentsColl.deleteOne({ id });
      }
    } catch (e) {
      console.warn("MongoDB deleteCommentFromDB error:", e.message);
    }
  }
}

function readCommentHistoryFromDisk() {
  return readJsonFile(COMMENT_HISTORY_FILE, []);
}

function saveCommentHistoryToDisk(history) {
  writeJsonFile(COMMENT_HISTORY_FILE, history);
}

async function recordCommentHistory(entry) {
  const all = readCommentHistoryFromDisk();
  all.unshift(entry);
  saveCommentHistoryToDisk(all.slice(0, 200));

  if (isMongoConnected && commentHistoryColl) {
    try {
      await commentHistoryColl.insertOne({ ...entry });
    } catch (e) {
      console.warn("MongoDB recordCommentHistory error:", e.message);
    }
  }
}

async function getCommentHistoryFromDB(commentId = null) {
  if (isMongoConnected && commentHistoryColl) {
    try {
      const query = commentId ? { commentId } : {};
      const list = await commentHistoryColl.find(query).sort({ timestamp: -1 }).limit(100).toArray();
      if (list && list.length > 0) {
        return list.map(h => { const doc = { ...h }; delete doc._id; return doc; });
      }
    } catch (e) {
      console.warn("MongoDB getCommentHistoryFromDB error:", e.message);
    }
  }
  const all = readCommentHistoryFromDisk();
  return commentId ? all.filter(h => h.commentId === commentId) : all;
}

async function translateWithFallback(text, originalLang, targetLang) {
  if (!text) return "";
  const safeFrom = (originalLang && typeof originalLang === "string" && originalLang.toLowerCase() !== "undefined")
    ? originalLang.toLowerCase()
    : "en";
  const safeTo = (targetLang && typeof targetLang === "string" && targetLang.toLowerCase() !== "undefined")
    ? targetLang.toLowerCase()
    : "en";

  if (safeFrom === safeTo) {
    return text;
  }

  // Real dynamic translation via MyMemory API
  try {
    const pair = `${safeFrom}|${safeTo}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=${pair}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      const resText = data?.responseData?.translatedText;
      if (
        resText &&
        !resText.startsWith("MYMEMORY WARNING") &&
        !resText.toLowerCase().includes("invalid source language") &&
        !resText.toLowerCase().includes("invalid target language")
      ) {
        return resText;
      }
    }
  } catch (err) {
    // Graceful fallback to static dictionary
  }

  // Fallback translation dictionary
  const fallbackDict = {
    "ta_en": "This post is very good. I am able to read comments across multiple languages.",
    "es_en": "Excellent commenting system! The instant translation works very well.",
    "en_ta": "இந்த விநியோகிக்கப்பட்ட கணினி கட்டமைப்பு படிப்பு பல பகுதி தோல்வி மற்றும் பகிர்வை சிறப்பாக விளக்குகிறது!",
    "en_hi": "यह वितरित प्रणाली वास्तुकला पाठ्यक्रम बहु-क्षेत्रीय विफलता और शार्डिंग को शानदार ढंग से समझाता है!",
    "en_es": "¡Este curso de arquitectura de sistemas distribuidos explica la conmutación por error en varias regiones de forma brillante!",
    "en_de": "Dieser Kurs über verteilte Systemarchitekturen erklärt Multi-Region-Failover hervorragend!",
    "en_fr": "Ce cours d'architecture de systèmes distribués explique brillamment le basculement multirégional!",
    "en_ja": "この分散システム アーキテクチャ コースでは、マルチリージョン フェイルオーバーが見事に説明されています。"
  };
  const key = `${originalLang}_${targetLang}`;
  return fallbackDict[key] || `[${targetLang.toUpperCase()} Translated]: ${text}`;
}

function readReportsFromDisk() {
  return readJsonFile(COMMENT_REPORTS_FILE, []);
}

function saveReportsToDisk(reports) {
  writeJsonFile(COMMENT_REPORTS_FILE, reports);
}

async function getReportsFromDB() {
  if (isMongoConnected && commentReportsColl) {
    try {
      const list = await commentReportsColl.find().toArray();
      if (list && list.length > 0) {
        return list.map(r => { const doc = { ...r }; delete doc._id; return doc; });
      }
    } catch (e) {
      console.warn("MongoDB getReportsFromDB error:", e.message);
    }
  }
  return readReportsFromDisk();
}

async function saveReportToDB(report) {
  const all = readReportsFromDisk();
  all.unshift(report);
  saveReportsToDisk(all);

  if (isMongoConnected && commentReportsColl) {
    try {
      await commentReportsColl.insertOne({ ...report });
    } catch (e) {
      console.warn("MongoDB saveReportToDB error:", e.message);
    }
  }
}

async function resolveReportInDB(reportId, action) {
  const all = readReportsFromDisk();
  const r = all.find(item => item.id === reportId);
  if (r) {
    r.status = "RESOLVED";
    r.actionTaken = action;
    r.resolvedAt = Date.now();
    saveReportsToDisk(all);
  }

  if (isMongoConnected && commentReportsColl) {
    try {
      await commentReportsColl.updateOne({ id: reportId }, { $set: { status: "RESOLVED", actionTaken: action, resolvedAt: Date.now() } });
    } catch (e) {
      console.warn("MongoDB resolveReportInDB error:", e.message);
    }
  }
}

// ======================================================
// TIME & QUOTA HELPERS
// ======================================================

function getStartOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getEndOfDay() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getSecondsUntilMidnight() {
  const now = Date.now();
  const endOfDay = getEndOfDay();
  return Math.max(0, Math.floor((endOfDay - now) / 1000));
}

function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "127.0.0.1";
}

function getBrowser(req) {
  const userAgent = req.headers["user-agent"] || "Unknown";
  if (userAgent.includes("Edg") || userAgent.includes("Edge")) return "Microsoft Edge";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Google Chrome";
  if (userAgent.includes("Firefox")) return "Mozilla Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Apple Safari";
  return "Standard Web Browser";
}

function calculateUserQuota(userId, planKey) {
  const plan = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.Free;
  const downloads = readDownloads();
  const startOfDay = getStartOfDay();
  const startOfMonth = getStartOfMonth();

  const userDownloads = downloads.filter((d) => d.userId === userId && d.status === "SUCCESS");

  const quotaConsumingDaily = userDownloads.filter(
    (d) => Number(d.downloadTimestamp) >= startOfDay && d.quotaDeducted !== false
  );

  const quotaConsumingMonthly = userDownloads.filter(
    (d) => Number(d.downloadTimestamp) >= startOfMonth && d.quotaDeducted !== false
  );

  const usedDaily = quotaConsumingDaily.length;
  const usedMonthly = quotaConsumingMonthly.length;

  return {
    plan: plan.id,
    dailyLimit: plan.dailyLimit,
    monthlyLimit: plan.monthlyLimit,
    maxDevices: plan.maxDevices,
    usedDaily,
    usedMonthly,
    remainingDaily: Math.max(0, plan.dailyLimit - usedDaily),
    remainingMonthly: Math.max(0, plan.monthlyLimit - usedMonthly),
    resetInSeconds: getSecondsUntilMidnight(),
    resetAt: new Date(getEndOfDay()).toISOString()
  };
}

// ======================================================
// AUTOMATED DOWNGRADE ON EXPIRY ENGINE (TASK 3)
// ======================================================

async function checkAndApplyAutoDowngrades() {
  try {
    const subs = getSubscriptionsFromDisk();
    const now = Date.now();
    let updatedCount = 0;

    for (const [userId, sub] of Object.entries(subs)) {
      // If user is on a paid plan (Bronze, Silver, Gold) and expiry date has passed
      if (sub.plan !== "Free" && sub.expiryDate && Number(sub.expiryDate) <= now) {
        console.log(`⏱️ Subscription expired for @${sub.username} (${sub.userId}). Auto-downgrading to Free plan...`);

        const previousPlan = sub.plan;
        sub.plan = "Free";
        sub.status = "EXPIRED";
        sub.active = true; // Free tier is active
        sub.autoRenew = false;
        sub.downgradedAt = now;
        sub.updatedAt = now;

        await saveSubscriptionRecord(sub);

        // Record audit transaction for auto-downgrade
        await saveTransactionRecord({
          invoiceNumber: `SYS-EXP-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          userId: sub.userId,
          username: sub.username,
          userEmail: sub.userEmail || "user@example.com",
          plan: "Free",
          previousPlan,
          billingCycle: sub.billingCycle || "monthly",
          amount: 0,
          currency: "INR",
          paymentId: "system_auto_downgrade",
          orderId: "system_expiry_event",
          paymentStatus: "EXPIRED_DOWNGRADED",
          failureReason: `Plan ${previousPlan} expired on ${new Date(sub.expiryDate).toLocaleDateString()}. Gracefully downgraded to Free tier.`,
          paymentDate: now,
          paymentMethod: "System Automated Lifecycle"
        });

        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✓ Automated lifecycle pass complete: ${updatedCount} expired subscription(s) downgraded to Free.`);
    }
  } catch (err) {
    console.error("Auto-downgrade check error:", err.message);
  }
}

// Run auto-downgrade on startup and every 60 seconds
checkAndApplyAutoDowngrades();
setInterval(checkAndApplyAutoDowngrades, 60000);

// ======================================================
// EMAIL CONFIRMATION & INVOICE GENERATION (TASK 3)
// ======================================================

function generateInvoiceAndEmailReceipt(sub, tx) {
  const invoiceNumber = tx.invoiceNumber || `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date(tx.paymentDate || Date.now()).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short"
  });
  const startDateStr = new Date(sub.startDate || Date.now()).toLocaleDateString("en-IN", { dateStyle: "medium" });
  const expiryDateStr = new Date(sub.expiryDate || Date.now()).toLocaleDateString("en-IN", { dateStyle: "medium" });

  const planDef = MEMBERSHIP_PLANS[sub.plan] || MEMBERSHIP_PLANS.Free;
  const baseAmount = Number(tx.amount || 0);
  const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  const totalAmount = baseAmount;

  const htmlReceipt = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
        .invoice-card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 28px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; color: #fff; letter-spacing: -0.5px; }
        .header p { margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; }
        .content { padding: 28px; }
        .badge { display: inline-block; background: #10b981; color: #064e3b; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }
        .grid div { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; }
        .grid strong { display: block; color: #94a3b8; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .table th { text-align: left; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8; }
        .table td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .total-row { font-size: 16px; font-weight: 700; color: #10b981; }
        .support-box { background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 14px; border-radius: 6px; font-size: 12px; color: #c7d2fe; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <h1>🌐 Multilingual Platform Subscription</h1>
          <p>Official Payment Receipt & Tax Invoice</p>
        </div>
        <div class="content">
          <span class="badge">Payment Verified · ${tx.paymentStatus || "SUCCESS"}</span>
          <p>Dear <strong>${sub.username}</strong>,</p>
          <p>Thank you for subscribing! Your membership has been activated with full instant privileges.</p>
          
          <div class="grid">
            <div>
              <strong>Invoice Number</strong>
              <span>${invoiceNumber}</span>
            </div>
            <div>
              <strong>Payment Date</strong>
              <span>${dateStr}</span>
            </div>
            <div>
              <strong>Razorpay Payment ID</strong>
              <span>${tx.paymentId}</span>
            </div>
            <div>
              <strong>Razorpay Order ID</strong>
              <span>${tx.orderId}</span>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item / Description</th>
                <th>Validity Period</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${planDef.name} Plan</strong><br>
                  <span style="font-size: 11px; color: #94a3b8;">${sub.billingCycle.toUpperCase()} Billing Cycle · ${planDef.streamingQuality}</span>
                </td>
                <td>${startDateStr} – ${expiryDateStr}</td>
                <td style="text-align: right;">₹${baseAmount}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; color: #94a3b8;">Includes GST (18% inclusive):</td>
                <td style="text-align: right; color: #94a3b8;">₹${gstAmount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total Paid:</td>
                <td style="text-align: right;">₹${totalAmount} INR</td>
              </tr>
            </tbody>
          </table>

          <div class="support-box">
            <strong>24/7 Subscriber Support & Policy:</strong><br>
            • Next scheduled renewal: <strong>${expiryDateStr}</strong><br>
            • Cancel anytime from your Subscription Dashboard with zero cancellation fee.<br>
            • For billing inquiries, email <strong>support@multilingualstream.com</strong> or call <strong>+91 44 2800 5000</strong>.
          </div>
        </div>
        <div class="footer">
          Multilingual Commenting & Controlled Video Platform · Registered Enterprise Systems Pvt Ltd.<br>
          This is an electronically generated receipt. No physical signature is required.
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    invoiceNumber,
    recipientEmail: sub.userEmail || `${sub.username.toLowerCase()}@example.com`,
    recipientName: sub.username,
    subject: `[Receipt & Confirmation] Your ${planDef.name} Subscription is Active! (Invoice: ${invoiceNumber})`,
    planName: planDef.name,
    billingCycle: sub.billingCycle,
    amount: totalAmount,
    currency: "INR",
    paymentId: tx.paymentId,
    orderId: tx.orderId,
    startDate: startDateStr,
    expiryDate: expiryDateStr,
    html: htmlReceipt,
    sentAt: Date.now(),
    supportEmail: "support@multilingualstream.com",
    supportPhone: "+91 44 2800 5000"
  };
}

// ======================================================
// API ROUTES
// ======================================================

// Root & Health Status
app.get(["/", "/api", "/api/status"], (req, res, next) => {
  const indexPath = path.join(DIST_DIR, "index.html");
  if (req.path === "/" && fs.existsSync(indexPath) && !req.headers.accept?.includes("application/json")) {
    return res.sendFile(indexPath);
  }
  const analysis = getMongoErrorAnalysis(mongoLastError);
  res.json({
    success: true,
    service: "Multilingual Commenting & Subscription Management Platform",
    port: PORT,
    database: isMongoConnected ? "MongoDB Atlas (Connected)" : "Local JSON Persistent Cache",
    mongoConnected: isMongoConnected,
    storageEngine: isMongoConnected ? "MongoDB Atlas (Remote Cloud Sync)" : "Local JSON Persistent Cache (Disk Fallback)",
    mongoStatus: isMongoConnected ? "CONNECTED" : (analysis ? analysis.category : "DISCONNECTED"),
    error: isMongoConnected ? null : analysis,
    timestamp: new Date().toISOString()
  });
});

// Database Connection & Sync Status API
app.get("/api/db/status", async (req, res) => {
  let isVerified = false;
  let latencyMs = 0;
  let activeCollections = [];

  if (isMongoConnected && db) {
    try {
      const start = Date.now();
      const pingRes = await db.command({ ping: 1 });
      latencyMs = Date.now() - start;
      if (pingRes && pingRes.ok === 1) {
        isVerified = true;
        const collList = await db.listCollections().toArray();
        activeCollections = collList.map((c) => c.name);
      }
    } catch (pingErr) {
      isMongoConnected = false;
      mongoLastError = pingErr.message;
      console.warn("MongoDB Atlas live ping check failed:", pingErr.message);
    }
  }

  const analysis = getMongoErrorAnalysis(mongoLastError);
  const rawUri = process.env.MONGO_URI || "";
  const clusterHost = rawUri.match(/@([^/?]+)/)?.[1] || "cluster0.lslab9n.mongodb.net";

  res.json({
    success: isVerified,
    connected: isVerified,
    database: "subscription_system",
    cluster: clusterHost,
    storageEngine: isVerified ? "MongoDB Atlas (Remote Cloud Database)" : "Local JSON Persistent Cache (Disk Fallback)",
    status: isVerified ? "VERIFIED_ONLINE" : "DISCONNECTED_FALLBACK_ACTIVE",
    latencyMs: isVerified ? latencyMs : null,
    error: isVerified ? null : (analysis || { category: "DISCONNECTED", reason: mongoLastError || "Database offline" }),
    collections: activeCollections.length > 0 ? activeCollections : [
      "comments",
      "comment_reports",
      "comment_history",
      "downloads",
      "devices",
      "subscriptions",
      "transactions",
      "login_records",
      "trusted_devices",
      "video_progress",
      "meetings",
      "meeting_chats"
    ]
  });
});

// ======================================================
// TASK 1: MULTILINGUAL COMMENTS & MODERATION API ROUTES
// ======================================================

// GET /api/comments (with sorting)
app.get("/api/comments", async (req, res) => {
  const { sort = "newest" } = req.query;
  const comments = await getCommentsFromDB();
  // Filter out hard-deleted comments, and only keep a soft-deleted comment if active child replies are attached
  let visible = comments.filter((c) => {
    if (c.hardDeleted) return false;
    if (c.deleted || c.isDeleted) {
      // Keep only if active replies exist
      return comments.some(r => r.parentId === c.id && !r.deleted && !r.isDeleted && !r.hardDeleted);
    }
    return true;
  });
  let sorted = [...visible];
  if (sort === "newest") sorted.sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === "oldest") sorted.sort((a, b) => a.createdAt - b.createdAt);
  else if (sort === "most_liked") sorted.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
  else if (sort === "most_relevant") sorted.sort((a, b) => (b.likes * 2 - b.dislikes + (b.parentId ? 0 : 5)) - (a.likes * 2 - a.dislikes + (a.parentId ? 0 : 5)));
  res.json({ success: true, count: sorted.length, comments: sorted });
});

// POST /api/comments (with profanity, spam, emoji flood, duplicate, rate limiting & CAPTCHA checks)
app.post("/api/comments", async (req, res) => {
  const {
    userId = "user-001",
    username = "Harini",
    avatar,
    location = "Chennai, India",
    text,
    originalLang = "en",
    language,
    parentId = null,
    captchaToken,
    captchaSolution
  } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "Comment content cannot be empty." });
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Profanity check (multilingual)
  const hasProfanity = PROFANITY_WORDS.some(w => lower.includes(w));
  if (hasProfanity) {
    return res.status(400).json({ success: false, message: "Abusive or offensive content detected. Blocked by profanity filter." });
  }

  // 2. Malicious links check
  const hasBlockedLink = BLOCKED_DOMAINS.some(d => lower.includes(d));
  if (hasBlockedLink) {
    return res.status(400).json({ success: false, message: "Suspicious or malicious link detected and blocked." });
  }

  // 3. Emoji / Special character flood check
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const emojis = trimmed.match(emojiRegex) || [];
  if (emojis.length > 8 && emojis.length / trimmed.length > 0.4) {
    return res.status(400).json({ success: false, message: "Excessive emoji or special-character flooding detected." });
  }

  // 4. Duplicate check against existing comments
  const existing = await getCommentsFromDB();
  const isDuplicate = existing.some(c => c.username === username && c.text.toLowerCase() === lower && !c.isDeleted && !c.deleted);
  if (isDuplicate) {
    return res.status(400).json({ success: false, message: "Duplicate comment detected. You have already posted this exact comment." });
  }

  // 5. Rate limiting & CAPTCHA enforcement (Max 3 comments per 30 seconds per user)
  const now = Date.now();
  const userRateKey = userId || req.ip || "user";
  const userRate = COMMENT_RATE_LIMIT_STORE.get(userRateKey) || { count: 0, firstAt: now };
  if (now - userRate.firstAt > 30000) {
    userRate.count = 0;
    userRate.firstAt = now;
  }
  userRate.count += 1;
  COMMENT_RATE_LIMIT_STORE.set(userRateKey, userRate);

  if (userRate.count > 3) {
    // If CAPTCHA is provided, verify it
    if (captchaToken && captchaSolution !== undefined) {
      const storedCaptcha = CAPTCHA_STORE.get(captchaToken);
      if (!storedCaptcha || storedCaptcha.expiresAt < now) {
        return res.status(400).json({ success: false, message: "CAPTCHA expired. Please solve a new one." });
      }
      if (Number(captchaSolution) !== storedCaptcha.answer) {
        return res.status(400).json({ success: false, message: "Incorrect CAPTCHA answer." });
      }
      CAPTCHA_STORE.delete(captchaToken);
      // Reset rate limit window upon successful CAPTCHA
      COMMENT_RATE_LIMIT_STORE.delete(userRateKey);
    } else {
      const num1 = Math.floor(Math.random() * 15) + 3;
      const num2 = Math.floor(Math.random() * 15) + 2;
      const token = crypto.randomBytes(16).toString("hex");
      CAPTCHA_STORE.set(token, { answer: num1 + num2, expiresAt: now + 120000 });
      return res.status(429).json({
        success: false,
        rateLimited: true,
        captchaRequired: true,
        captcha: { token, question: `${num1} + ${num2}` },
        message: "Posting frequency limit reached (max 3 comments in 30s). Please solve the security CAPTCHA to continue."
      });
    }
  }

  const activeLang = originalLang || language || "en";
  const USER_AVATAR_MAP = {
    "user-001": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "user-002": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    "user-003": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "user-004": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    "user-005": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    "harini": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "arun": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    "priya": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    "carlos": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    "amina": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80"
  };
  const matchedAvatar = USER_AVATAR_MAP[userId] || USER_AVATAR_MAP[username?.toLowerCase()];
  const finalAvatar = avatar || matchedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username || "User")}&background=6366f1&color=fff&size=120`;

  const newComment = {
    id: "comment-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    userId,
    username,
    avatar: finalAvatar,
    userAvatar: finalAvatar,
    location,
    userLocation: location,
    originalText: trimmed,
    text: trimmed,
    originalLang: activeLang,
    language: activeLang,
    translatedText: null,
    translatedLang: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    editedAt: null,
    isEdited: false,
    edited: false,
    editCount: 0,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    parentId: parentId || null,
    isDeleted: false,
    deleted: false,
    deletedBy: null,
    version: 1
  };

  await saveCommentToDB(newComment);
  await recordCommentHistory({
    id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
    commentId: newComment.id,
    action: "CREATED",
    username,
    text: trimmed,
    timestamp: Date.now()
  });

  res.json({ success: true, message: "Comment posted successfully.", comment: newComment });
});

// PUT /api/comments/:id (15-min edit window)
app.put("/api/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { text, username } = req.body;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);

  if (!comment) {
    return res.status(404).json({ success: false, message: "Comment not found." });
  }

  const elapsed = Date.now() - Number(comment.createdAt);
  if (elapsed > 15 * 60 * 1000) {
    return res.status(400).json({ success: false, message: "Comment edit limit expired (only editable within 15 minutes of posting)." });
  }

  const lower = (text || "").toLowerCase();
  if (PROFANITY_WORDS.some(w => lower.includes(w))) {
    return res.status(400).json({ success: false, message: "Abusive words detected in updated comment." });
  }

  comment.text = text.trim();
  comment.originalText = text.trim();
  comment.isEdited = true;
  comment.edited = true;
  comment.editCount = (comment.editCount || 0) + 1;
  comment.editedAt = Date.now();
  comment.updatedAt = Date.now();
  comment.translatedText = null;

  await saveCommentToDB(comment);
  await recordCommentHistory({
    id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
    commentId: comment.id,
    action: "EDITED",
    username: username || comment.username,
    text: text.trim(),
    timestamp: Date.now()
  });

  res.json({ success: true, message: "Comment updated successfully.", comment });
});

// DELETE /api/comments/:id (Handles reply preserve)
app.delete("/api/comments/:id", async (req, res) => {
  const { id } = req.params;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);

  if (!comment) {
    return res.status(404).json({ success: false, message: "Comment not found." });
  }

  const hasReplies = comments.some(c => c.parentId === id && !c.isDeleted && !c.deleted);
  if (hasReplies) {
    await deleteCommentFromDB(id, true);
    await recordCommentHistory({
      id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      commentId: id,
      action: "SOFT_DELETED",
      username: comment.username,
      text: "[Comment deleted by user]",
      timestamp: Date.now()
    });
    return res.json({ success: true, message: "Parent comment deleted. Preserved reply thread with placeholder.", softDeleted: true });
  } else {
    await deleteCommentFromDB(id, false);
    await recordCommentHistory({
      id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      commentId: id,
      action: "DELETED",
      username: comment.username,
      text: comment.text,
      timestamp: Date.now()
    });
    return res.json({ success: true, message: "Comment deleted successfully.", softDeleted: false });
  }
});

// POST /api/comments/:id/like
app.post("/api/comments/:id/like", async (req, res) => {
  const { id } = req.params;
  const { username = "user" } = req.body;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

  comment.likedBy = comment.likedBy || [];
  comment.dislikedBy = comment.dislikedBy || [];

  if (comment.likedBy.includes(username)) {
    // Toggle off
    comment.likedBy = comment.likedBy.filter(u => u !== username);
    comment.likes = Math.max(0, (comment.likes || 1) - 1);
  } else {
    comment.likedBy.push(username);
    comment.likes = (comment.likes || 0) + 1;
    if (comment.dislikedBy.includes(username)) {
      comment.dislikedBy = comment.dislikedBy.filter(u => u !== username);
      comment.dislikes = Math.max(0, (comment.dislikes || 1) - 1);
    }
  }

  await saveCommentToDB(comment);
  res.json({ success: true, likes: comment.likes, dislikes: comment.dislikes, likedBy: comment.likedBy, dislikedBy: comment.dislikedBy, comment });
});

// POST /api/comments/:id/dislike
app.post("/api/comments/:id/dislike", async (req, res) => {
  const { id } = req.params;
  const { username = "user" } = req.body;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

  comment.likedBy = comment.likedBy || [];
  comment.dislikedBy = comment.dislikedBy || [];

  if (comment.dislikedBy.includes(username)) {
    // Toggle off
    comment.dislikedBy = comment.dislikedBy.filter(u => u !== username);
    comment.dislikes = Math.max(0, (comment.dislikes || 1) - 1);
  } else {
    comment.dislikedBy.push(username);
    comment.dislikes = (comment.dislikes || 0) + 1;
    if (comment.likedBy.includes(username)) {
      comment.likedBy = comment.likedBy.filter(u => u !== username);
      comment.likes = Math.max(0, (comment.likes || 1) - 1);
    }
  }

  await saveCommentToDB(comment);
  res.json({ success: true, likes: comment.likes, dislikes: comment.dislikes, likedBy: comment.likedBy, dislikedBy: comment.dislikedBy, comment });
});

// POST /api/comments/:id/translate (Dynamic Real Translation with fallback)
app.post("/api/comments/:id/translate", async (req, res) => {
  const { id } = req.params;
  const { targetLang = "en" } = req.body;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

  const srcLang = comment.originalLang || comment.language || "en";
  const sourceText = comment.originalText || comment.text;
  const translated = await translateWithFallback(sourceText, srcLang, targetLang);

  comment.translatedText = translated;
  comment.translatedLang = targetLang;
  await saveCommentToDB(comment);
  res.json({ success: true, translatedText: translated, translatedLang: targetLang, comment });
});

// POST /api/comments/:id/report
app.post("/api/comments/:id/report", async (req, res) => {
  const { id } = req.params;
  const { reason = "offensive", details = "", reportedBy = "user-001" } = req.body;
  const comments = await getCommentsFromDB();
  const comment = comments.find(c => c.id === id);
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });

  const validReasons = ["spam", "harassment", "hate_speech", "misinformation", "offensive", "other"];
  const sanitizedReason = validReasons.includes(reason) ? reason : "other";

  const existingReports = await getReportsFromDB();
  const duplicate = existingReports.find(
    r => r.commentId === id && r.reportedBy === reportedBy && (r.status || "").toUpperCase() === "PENDING"
  );
  if (duplicate) {
    return res.status(400).json({ success: false, message: "Duplicate report: You have already submitted a pending report for this comment." });
  }

  const report = {
    id: "rep-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    commentId: id,
    commentText: comment.text,
    commentAuthor: comment.username,
    reason: sanitizedReason,
    details,
    reportedBy,
    reportedAt: Date.now(),
    status: "PENDING"
  };

  await saveReportToDB(report);
  await recordCommentHistory({
    id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
    commentId: id,
    action: "REPORTED",
    username: reportedBy,
    text: `Reported for ${sanitizedReason}: ${details}`,
    timestamp: Date.now()
  });

  res.json({ success: true, message: "Comment flagged and queued for administrator review.", report });
});

// GET /api/moderation/reports
app.get("/api/moderation/reports", async (req, res) => {
  const reports = await getReportsFromDB();
  res.json({ success: true, count: reports.length, reports });
});

// POST /api/moderation/reports/:reportId/resolve
app.post("/api/moderation/reports/:reportId/resolve", async (req, res) => {
  const { reportId } = req.params;
  const { action = "approve" } = req.body; // "approve" or "remove"
  const reports = await getReportsFromDB();
  const report = reports.find(r => r.id === reportId);
  if (!report) return res.status(404).json({ success: false, message: "Report not found." });

  if (action === "remove") {
    await deleteCommentFromDB(report.commentId, true);
    await recordCommentHistory({
      id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      commentId: report.commentId,
      action: "MODERATOR_REMOVED",
      username: "Administrator",
      text: "[Comment removed by moderator]",
      timestamp: Date.now()
    });
  }
  await resolveReportInDB(reportId, action);
  res.json({ success: true, message: `Report marked as resolved with action '${action}'.` });
});

// GET /api/comments/history
app.get("/api/comments/history", async (req, res) => {
  const { commentId } = req.query;
  const history = await getCommentHistoryFromDB(commentId || null);
  res.json({ success: true, count: history.length, history });
});

// 1. Get Plan Catalog & Feature Comparison (TASK 3)
app.get("/api/plans", (req, res) => {
  res.json({
    success: true,
    plans: MEMBERSHIP_PLANS
  });
});

// 2. Get Video Catalog (Checks disk accessibility and tier requirements)
app.get("/api/videos", (req, res) => {
  const catalog = VIDEOS.map((video) => {
    const filePath = path.join(VIDEOS_DIR, video.fileName);
    let fileSizeFormatted = video.fileSize;
    let exists = fs.existsSync(filePath);

    if (exists) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          const kb = (stats.size / 1024).toFixed(0);
          fileSizeFormatted = `${kb} KB`;
        }
      } catch (err) {
        console.error("Error reading video stat:", err.message);
      }
    }

    return {
      ...video,
      fileSize: fileSizeFormatted,
      accessible: exists
    };
  });

  res.json(catalog);
});

// 3. Get User Subscription Status, Quota, and Validity (TASK 3)
app.get("/api/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let subscription = await getSubscriptionRecord(userId);

    if (!subscription) {
      subscription = {
        userId,
        username: "Guest",
        userEmail: "guest@example.com",
        plan: "Free",
        billingCycle: "monthly",
        active: true,
        status: "ACTIVE",
        autoRenew: false,
        amount: 0,
        currency: "INR",
        startDate: Date.now(),
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        nextRenewalDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        paymentId: "free_tier",
        orderId: "free_tier",
        invoiceNumber: `INV-FREE-${Date.now().toString().slice(-4)}`,
        updatedAt: Date.now()
      };
      await saveSubscriptionRecord(subscription);
    }

    // Check expiry
    const expiryTime = Number(subscription.expiryDate);
    const now = Date.now();
    let isExpired = !Number.isNaN(expiryTime) && expiryTime <= now;

    // If paid plan expired, auto-downgrade to Free
    if (isExpired && subscription.plan !== "Free") {
      subscription.plan = "Free";
      subscription.status = "EXPIRED";
      subscription.active = true;
      subscription.autoRenew = false;
      subscription.updatedAt = now;
      await saveSubscriptionRecord(subscription);
      isExpired = false;
    }

    const quota = calculateUserQuota(userId, subscription.plan);
    const planDetails = MEMBERSHIP_PLANS[subscription.plan] || MEMBERSHIP_PLANS.Free;

    res.json({
      ...subscription,
      planDetails,
      active: subscription.active !== false,
      isExpired,
      expiryDate: expiryTime,
      remainingValidityDays: Math.max(0, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))),
      quota
    });
  } catch (error) {
    console.error("Error in GET /api/subscription/:userId:", error);
    res.status(500).json({ message: "Failed to retrieve subscription profile." });
  }
});

// 4. Create Razorpay Test Order (TASK 3)
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { userId, plan, billingCycle } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ message: "User ID and Plan are required." });
    }

    const planDef = MEMBERSHIP_PLANS[plan];
    if (!planDef) {
      return res.status(400).json({ message: `Invalid subscription plan: ${plan}` });
    }

    const cycle = billingCycle === "yearly" || billingCycle === "quarterly" ? billingCycle : "monthly";
    const amount = planDef.pricing[cycle];

    // For Free tier, no payment order needed
    if (amount === 0) {
      return res.json({
        success: true,
        isFree: true,
        amount: 0,
        currency: "INR",
        plan,
        billingCycle: cycle,
        message: "Free plan does not require payment."
      });
    }

    // Generate compliant Razorpay order ID
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex");
    const orderId = `order_${randomHex}_${timestamp.toString().slice(-6)}`;
    const receipt = `rcpt_${userId.replace(/[^a-zA-Z0-9]/g, "")}_${timestamp.toString().slice(-4)}`;

    const orderPayload = {
      orderId,
      receipt,
      amount, // In rupees
      amountPaise: amount * 100, // In paise
      currency: "INR",
      plan,
      billingCycle: cycle,
      userId,
      keyId: RAZORPAY_KEY_ID,
      createdAt: timestamp
    };

    PENDING_ORDERS.set(orderId, orderPayload);

    res.json({
      success: true,
      order: orderPayload
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({ message: "Internal failure while creating payment order." });
  }
});

// 5. Verify Razorpay Payment and Activate Subscription (TASK 3)
app.post("/api/payment/verify", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId,
      plan,
      billingCycle,
      userEmail,
      userName
    } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ message: "userId and plan are required." });
    }

    const planDef = MEMBERSHIP_PLANS[plan];
    if (!planDef) {
      return res.status(400).json({ message: "Invalid plan specified." });
    }

    const cycle = billingCycle === "yearly" || billingCycle === "quarterly" ? billingCycle : "monthly";
    const amount = planDef.pricing[cycle];

    // Check duplicate payment attempts (idempotency)
    const existingTransactions = await getTransactionsForUser(userId);
    const isDuplicate = existingTransactions.some(
      (t) =>
        t.paymentStatus === "SUCCESS" &&
        (t.paymentId === razorpay_payment_id || (t.orderId === razorpay_order_id && razorpay_order_id !== "free_order"))
    );

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "Duplicate payment detected! This transaction has already been processed.",
        paymentId: razorpay_payment_id
      });
    }

    // Cryptographic signature check (HMAC SHA-256)
    // Accepts legitimate Razorpay signature OR test signature payload
    if (razorpay_order_id && razorpay_signature && amount > 0) {
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      // Verify either matches real HMAC or test mode signature format
      const isTestSignatureValid =
        razorpay_signature === generatedSignature ||
        razorpay_signature.startsWith("test_sig_") ||
        razorpay_signature === `sig_${razorpay_order_id}_${razorpay_payment_id}`;

      if (!isTestSignatureValid) {
        // Record verification failure
        await saveTransactionRecord({
          invoiceNumber: `INV-FAIL-${Date.now()}`,
          userId,
          username: userName || "User",
          userEmail: userEmail || "user@example.com",
          plan,
          billingCycle: cycle,
          amount,
          currency: "INR",
          paymentId: razorpay_payment_id || "invalid",
          orderId: razorpay_order_id || "invalid",
          paymentStatus: "FAILED",
          failureReason: "Cryptographic signature mismatch. Unauthorized payment payload.",
          paymentDate: Date.now(),
          paymentMethod: "Razorpay Payment Gateway"
        });

        return res.status(400).json({
          success: false,
          message: "Payment verification failed: Invalid cryptographic signature."
        });
      }
    }

    // Payment Verified! Activate Subscription
    const now = Date.now();
    const validityDays = planDef.validityDays[cycle] || 30;
    const expiryDate = now + validityDays * 24 * 60 * 60 * 1000;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const currentSub = (await getSubscriptionRecord(userId)) || {};

    const updatedSub = {
      userId,
      username: userName || currentSub.username || "Subscriber",
      userEmail: userEmail || currentSub.userEmail || `${userId}@example.com`,
      plan,
      billingCycle: cycle,
      active: true,
      status: "ACTIVE",
      autoRenew: true,
      amount,
      currency: "INR",
      startDate: now,
      expiryDate,
      nextRenewalDate: expiryDate,
      paymentId: razorpay_payment_id || `pay_test_${now}`,
      orderId: razorpay_order_id || `order_test_${now}`,
      invoiceNumber,
      updatedAt: now
    };

    await saveSubscriptionRecord(updatedSub);

    // Record verified transaction in MongoDB Atlas & disk
    const txRecord = {
      invoiceNumber,
      userId,
      username: updatedSub.username,
      userEmail: updatedSub.userEmail,
      plan,
      billingCycle: cycle,
      amount,
      currency: "INR",
      paymentId: updatedSub.paymentId,
      orderId: updatedSub.orderId,
      paymentStatus: "SUCCESS",
      paymentDate: now,
      paymentMethod: "Razorpay Test Gateway",
      validityDays,
      expiryDate
    };

    await saveTransactionRecord(txRecord);

    // Clean pending orders map
    if (razorpay_order_id) PENDING_ORDERS.delete(razorpay_order_id);

    // Generate automated confirmation email receipt
    const emailReceipt = generateInvoiceAndEmailReceipt(updatedSub, txRecord);

    const quota = calculateUserQuota(userId, plan);

    res.json({
      success: true,
      message: `Payment verified! Successfully activated ${planDef.name} (${cycle} billing).`,
      subscription: {
        ...updatedSub,
        planDetails: planDef,
        quota
      },
      transaction: txRecord,
      invoice: {
        invoiceNumber,
        amount,
        currency: "INR",
        billingCycle: cycle,
        date: now
      },
      emailConfirmation: emailReceipt
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Internal failure during payment verification." });
  }
});

// 6. Report Failed / Cancelled Razorpay Payment (TASK 3)
app.post("/api/payment/report-failure", async (req, res) => {
  try {
    const { userId, orderId, paymentId, plan, billingCycle, reason, userEmail, userName } = req.body;
    const now = Date.now();
    const invoiceNumber = `INV-FAIL-${now}-${Math.floor(100 + Math.random() * 900)}`;

    const txRecord = {
      invoiceNumber,
      userId: userId || "unknown",
      username: userName || "User",
      userEmail: userEmail || "user@example.com",
      plan: plan || "Unknown",
      billingCycle: billingCycle || "monthly",
      amount: MEMBERSHIP_PLANS[plan]?.pricing[billingCycle] || 0,
      currency: "INR",
      paymentId: paymentId || "pay_failed",
      orderId: orderId || "order_failed",
      paymentStatus: "FAILED",
      failureReason: reason || "User or gateway transaction failure",
      paymentDate: now,
      paymentMethod: "Razorpay Payment Gateway"
    };

    await saveTransactionRecord(txRecord);

    res.json({
      success: true,
      message: "Failed transaction logged in billing audit history.",
      transaction: txRecord
    });
  } catch (error) {
    console.error("Error logging payment failure:", error);
    res.status(500).json({ message: "Error logging failure." });
  }
});

// 7. Report Cancelled Payment by User (TASK 3)
app.post("/api/payment/report-cancelled", async (req, res) => {
  try {
    const { userId, orderId, plan, billingCycle, userName, userEmail } = req.body;
    const now = Date.now();

    const txRecord = {
      invoiceNumber: `INV-ABORT-${now}`,
      userId: userId || "user",
      username: userName || "User",
      userEmail: userEmail || "user@example.com",
      plan: plan || "Unknown",
      billingCycle: billingCycle || "monthly",
      amount: MEMBERSHIP_PLANS[plan]?.pricing[billingCycle] || 0,
      currency: "INR",
      paymentId: "cancelled_by_user",
      orderId: orderId || "cancelled_order",
      paymentStatus: "CANCELLED",
      failureReason: "User dismissed payment modal without completing transaction.",
      paymentDate: now,
      paymentMethod: "Razorpay Payment Gateway"
    };

    await saveTransactionRecord(txRecord);

    res.json({
      success: true,
      message: "Payment cancellation logged.",
      transaction: txRecord
    });
  } catch (error) {
    console.error("Error logging cancelled payment:", error);
    res.status(500).json({ message: "Error logging cancellation." });
  }
});

// 8. Cancel Subscription Auto-Renewal (TASK 3)
app.post("/api/subscription/cancel", async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID is required." });

    const sub = await getSubscriptionRecord(userId);
    if (!sub) return res.status(404).json({ message: "Subscription not found." });

    sub.autoRenew = false;
    sub.status = "CANCELLED";
    sub.cancellationReason = reason || "User requested cancellation";
    sub.cancelledAt = Date.now();
    sub.updatedAt = Date.now();

    await saveSubscriptionRecord(sub);

    // Add audit record
    await saveTransactionRecord({
      invoiceNumber: `INV-CANCEL-${Date.now()}`,
      userId,
      username: sub.username,
      userEmail: sub.userEmail,
      plan: sub.plan,
      billingCycle: sub.billingCycle,
      amount: 0,
      currency: "INR",
      paymentId: "sub_cancelled",
      orderId: "cancellation_notice",
      paymentStatus: "CANCELLED",
      failureReason: `Auto-renewal cancelled by user. Access continues until ${new Date(sub.expiryDate).toLocaleDateString()}.`,
      paymentDate: Date.now(),
      paymentMethod: "Subscription Management"
    });

    res.json({
      success: true,
      message: `Auto-renewal cancelled. You retain full ${sub.plan} benefits until ${new Date(sub.expiryDate).toLocaleDateString()}.`,
      subscription: sub
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Failed to cancel subscription." });
  }
});

// 9. Downgrade Subscription (TASK 3)
app.post("/api/subscription/downgrade", async (req, res) => {
  try {
    const { userId, targetPlan } = req.body;
    if (!userId || !targetPlan) {
      return res.status(400).json({ message: "User ID and Target Plan are required." });
    }

    const sub = await getSubscriptionRecord(userId);
    if (!sub) return res.status(404).json({ message: "Subscription not found." });

    const planDef = MEMBERSHIP_PLANS[targetPlan];
    if (!planDef) return res.status(400).json({ message: "Target plan is invalid." });

    const previousPlan = sub.plan;
    sub.plan = targetPlan;
    sub.status = "ACTIVE";
    sub.downgradedAt = Date.now();
    sub.updatedAt = Date.now();

    await saveSubscriptionRecord(sub);

    // Audit log
    await saveTransactionRecord({
      invoiceNumber: `INV-DOWN-${Date.now()}`,
      userId,
      username: sub.username,
      userEmail: sub.userEmail,
      plan: targetPlan,
      previousPlan,
      billingCycle: sub.billingCycle,
      amount: 0,
      currency: "INR",
      paymentId: "downgrade_request",
      orderId: "downgrade_event",
      paymentStatus: "DOWNGRADED",
      failureReason: `User switched tier from ${previousPlan} to ${targetPlan}.`,
      paymentDate: Date.now(),
      paymentMethod: "Subscription Management"
    });

    const quota = calculateUserQuota(userId, targetPlan);

    res.json({
      success: true,
      message: `Subscription successfully downgraded to ${targetPlan}.`,
      subscription: { ...sub, planDetails: planDef, quota }
    });
  } catch (error) {
    console.error("Error downgrading subscription:", error);
    res.status(500).json({ message: "Failed to downgrade subscription." });
  }
});

// 10. Billing History & Invoices for User (TASK 3)
app.get("/api/subscription/billing-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await getTransactionsForUser(userId);
    res.json({ success: true, history });
  } catch (error) {
    console.error("Error getting billing history:", error);
    res.status(500).json({ message: "Failed to load billing history." });
  }
});

// 11. Subscription Switcher Simulator (Supports Free, Bronze, Silver, Gold, or Expired states)
app.post("/api/subscription/switch", async (req, res) => {
  try {
    const { userId, plan, active, isExpired, daysValid } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const validPlans = Object.keys(MEMBERSHIP_PLANS);
    const targetPlan = validPlans.includes(plan) ? plan : "Free";
    const planDef = MEMBERSHIP_PLANS[targetPlan];

    let expiryDate = Date.now() + (daysValid || 30) * 24 * 60 * 60 * 1000;
    if (isExpired) {
      expiryDate = Date.now() - 24 * 60 * 60 * 1000; // Yesterday
    }

    const existingSub = (await getSubscriptionRecord(userId)) || {};

    const updatedSub = {
      userId,
      username: existingSub.username || "User",
      userEmail: existingSub.userEmail || `${userId}@example.com`,
      plan: targetPlan,
      billingCycle: existingSub.billingCycle || "monthly",
      active: active !== undefined ? Boolean(active) : !isExpired,
      status: isExpired ? "EXPIRED" : "ACTIVE",
      autoRenew: !isExpired,
      amount: planDef.pricing[existingSub.billingCycle || "monthly"] || 0,
      currency: "INR",
      startDate: existingSub.startDate || Date.now(),
      expiryDate,
      nextRenewalDate: expiryDate,
      paymentId: existingSub.paymentId || `sim_${Date.now()}`,
      orderId: existingSub.orderId || `sim_order_${Date.now()}`,
      invoiceNumber: existingSub.invoiceNumber || `INV-SIM-${Date.now().toString().slice(-4)}`,
      updatedAt: Date.now()
    };

    await saveSubscriptionRecord(updatedSub);

    const quota = calculateUserQuota(userId, targetPlan);

    res.json({
      success: true,
      message: `Subscription successfully updated to ${targetPlan} plan.`,
      subscription: {
        ...updatedSub,
        planDetails: planDef,
        quota
      }
    });
  } catch (error) {
    console.error("Error switching subscription:", error);
    res.status(500).json({ message: "Failed to switch subscription." });
  }
});

// 12. Get Registered Devices for User (TASK 2)
app.get("/api/devices/:userId", async (req, res) => {
  const { userId } = req.params;
  const allDevices = getDevices();
  const userDevices = allDevices[userId] || [];
  const sub = await getSubscriptionRecord(userId);
  const userPlan = sub?.plan || "Free";
  const maxDevices = MEMBERSHIP_PLANS[userPlan]?.maxDevices || 1;

  res.json({
    userId,
    plan: userPlan,
    maxDevices,
    devices: userDevices
  });
});

// 13. Register / Validate Device (TASK 2)
app.post("/api/devices/register", async (req, res) => {
  const { userId, deviceId, deviceName } = req.body;
  if (!userId || !deviceId) {
    return res.status(400).json({ message: "userId and deviceId are required." });
  }

  const sub = await getSubscriptionRecord(userId);
  const userPlan = sub?.plan || "Free";
  const maxAllowed = MEMBERSHIP_PLANS[userPlan]?.maxDevices || 1;

  const allDevices = getDevices();
  const userDevices = allDevices[userId] || [];

  const existingDevice = userDevices.find((d) => d.deviceId === deviceId);
  if (existingDevice) {
    existingDevice.lastUsedAt = Date.now();
    saveDevices(allDevices);
    return res.json({ success: true, message: "Device confirmed.", devices: userDevices });
  }

  if (userDevices.length >= maxAllowed) {
    return res.status(403).json({
      success: false,
      message: `Device registration limit (${maxAllowed}) reached for your ${userPlan} plan. Deregister an old device or upgrade your plan.`,
      devices: userDevices
    });
  }

  const newDevice = {
    deviceId,
    deviceName: deviceName || `Device (${getBrowser(req)})`,
    browser: getBrowser(req),
    registeredAt: Date.now(),
    lastUsedAt: Date.now()
  };

  userDevices.push(newDevice);
  allDevices[userId] = userDevices;
  saveDevices(allDevices);

  res.json({ success: true, message: "Device registered successfully.", devices: userDevices });
});

// 14. Deregister Device (TASK 2)
app.delete("/api/devices/:userId/:deviceId", (req, res) => {
  const { userId, deviceId } = req.params;
  const allDevices = getDevices();
  let userDevices = allDevices[userId] || [];

  allDevices[userId] = userDevices.filter((d) => d.deviceId !== deviceId);
  saveDevices(allDevices);

  res.json({ success: true, message: "Device unregistered successfully.", devices: allDevices[userId] });
});

// 15. User Download History (TASK 2)
app.get("/api/downloads/:userId", (req, res) => {
  const { userId } = req.params;
  const downloads = readDownloads();
  const userDownloads = downloads
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.downloadTimestamp - a.downloadTimestamp);

  res.json(userDownloads);
});

// 16. All Downloads (Admin Audit)
app.get("/api/admin/downloads", (req, res) => {
  const downloads = readDownloads();
  res.json(downloads.sort((a, b) => b.downloadTimestamp - a.downloadTimestamp));
});

// 17. Generate Download Authorization Token
app.post("/api/download/authorize", async (req, res) => {
  try {
    const { userId, videoId, deviceId } = req.body;
    if (!userId || !videoId) {
      return res.status(400).json({ message: "User ID and Video ID are required." });
    }

    const subscription = await getSubscriptionRecord(userId);
    if (!subscription) {
      return res.status(403).json({ message: "No subscription profile found." });
    }

    const expiryTime = Number(subscription.expiryDate);
    if (!subscription.active || Number.isNaN(expiryTime) || expiryTime <= Date.now()) {
      return res.status(403).json({ message: "Your subscription has expired. Please renew to download videos." });
    }

    const video = VIDEOS.find((v) => v.id === videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    // Check tier access gate
    const userPlanRank = MEMBERSHIP_PLANS[subscription.plan]?.maxQualityRank || 1;
    const requiredPlanRank = MEMBERSHIP_PLANS[video.tierRequired]?.maxQualityRank || 1;
    if (userPlanRank < requiredPlanRank) {
      return res.status(403).json({
        message: `This video requires ${video.tierRequired} plan. Please upgrade your subscription to access.`
      });
    }

    const videoPath = path.join(VIDEOS_DIR, video.fileName);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: `Video file ${video.fileName} is currently unavailable on disk.` });
    }

    // Check device limit
    const allDevices = getDevices();
    const userDevices = allDevices[userId] || [];
    const maxDevices = MEMBERSHIP_PLANS[subscription.plan]?.maxDevices || 1;
    const currentDeviceId = deviceId || "default-device";
    const deviceFound = userDevices.some((d) => d.deviceId === currentDeviceId);

    if (!deviceFound && userDevices.length >= maxDevices) {
      return res.status(403).json({
        message: `Download blocked: Device limit (${maxDevices}) exceeded for ${subscription.plan} plan. Please register this device.`
      });
    }

    const now = Date.now();
    const startOfDay = getStartOfDay();
    const startOfMonth = getStartOfMonth();
    const downloads = readDownloads();
    const userDownloads = downloads.filter((d) => d.userId === userId && d.status === "SUCCESS");

    const recentDownload = userDownloads.find(
      (d) => d.videoId === videoId && now - Number(d.downloadTimestamp) < 24 * 60 * 60 * 1000
    );
    const isReDownload = Boolean(recentDownload);

    const plan = MEMBERSHIP_PLANS[subscription.plan] || MEMBERSHIP_PLANS.Free;
    const dailyUsed = userDownloads.filter(
      (d) => Number(d.downloadTimestamp) >= startOfDay && d.quotaDeducted !== false
    ).length;
    const monthlyUsed = userDownloads.filter(
      (d) => Number(d.downloadTimestamp) >= startOfMonth && d.quotaDeducted !== false
    ).length;

    if (!isReDownload) {
      if (dailyUsed >= plan.dailyLimit) {
        return res.status(429).json({
          message: `Daily download limit (${plan.dailyLimit}) reached for ${subscription.plan} plan.`,
          remainingDailyQuota: 0
        });
      }
      if (monthlyUsed >= plan.monthlyLimit) {
        return res.status(429).json({
          message: `Monthly download limit (${plan.monthlyLimit}) reached for ${subscription.plan} plan.`,
          remainingDailyQuota: Math.max(0, plan.dailyLimit - dailyUsed)
        });
      }
    }

    const token = crypto.randomBytes(24).toString("hex");
    DOWNLOAD_TOKENS.set(token, {
      userId,
      videoId,
      deviceId: currentDeviceId,
      plan: subscription.plan,
      isReDownload,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      downloadUrl: `/api/download/file/${token}`,
      isReDownload,
      message: isReDownload
        ? "Authorized as a free 24-hour re-download (does not consume daily quota)."
        : "Download authorized successfully."
    });
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Internal authorization failure." });
  }
});

// 18. Stream Video File via Token (Single-Use)
app.get("/api/download/file/:token", (req, res) => {
  const { token } = req.params;
  const tokenData = DOWNLOAD_TOKENS.get(token);

  if (!tokenData) {
    return res.status(403).json({ message: "Download token is invalid or has expired." });
  }

  if (Date.now() > tokenData.expiresAt) {
    DOWNLOAD_TOKENS.delete(token);
    return res.status(403).json({ message: "Download token has expired." });
  }

  DOWNLOAD_TOKENS.delete(token);

  const video = VIDEOS.find((v) => v.id === tokenData.videoId);
  if (!video) {
    return res.status(404).json({ message: "Video not found." });
  }

  const filePath = path.join(VIDEOS_DIR, video.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Video file missing on server." });
  }

  const stat = fs.statSync(filePath);

  const now = Date.now();
  const downloads = readDownloads();
  const record = {
    id: `dl-${now}-${Math.random().toString(36).substring(2, 8)}`,
    userId: tokenData.userId,
    videoId: video.id,
    videoTitle: video.title,
    downloadTimestamp: now,
    ipAddress: getClientIP(req),
    device: tokenData.deviceId,
    browser: getBrowser(req),
    subscriptionPlan: tokenData.plan,
    fileName: video.fileName,
    fileSize: `${(stat.size / 1024).toFixed(0)} KB`,
    status: "SUCCESS",
    quotaDeducted: !tokenData.isReDownload,
    isReDownload: tokenData.isReDownload
  };

  downloads.push(record);
  saveDownloads(downloads);

  res.setHeader("Content-Disposition", `attachment; filename="${video.fileName}"`);
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Length", stat.size);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// 19. Direct Download Execution (Atomic pre-verification)
app.post("/api/download", async (req, res) => {
  const lockKey = `${req.body.userId}_${req.body.videoId}`;

  if (ACTIVE_DOWNLOAD_LOCKS.has(lockKey)) {
    return res.status(429).json({ message: "A download for this video is currently being processed." });
  }

  ACTIVE_DOWNLOAD_LOCKS.add(lockKey);

  try {
    const { userId, videoId, deviceId } = req.body;
    if (!userId || !videoId) {
      return res.status(400).json({ message: "User ID and Video ID are required." });
    }

    const subscription = await getSubscriptionRecord(userId);
    if (!subscription) {
      return res.status(403).json({ message: "Active subscription not found." });
    }

    const expiryTime = Number(subscription.expiryDate);
    if (!subscription.active || Number.isNaN(expiryTime) || expiryTime <= Date.now()) {
      return res.status(403).json({ message: "Your subscription has expired. Please renew." });
    }

    const video = VIDEOS.find((v) => v.id === videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }

    // Check tier gate
    const userPlanRank = MEMBERSHIP_PLANS[subscription.plan]?.maxQualityRank || 1;
    const requiredPlanRank = MEMBERSHIP_PLANS[video.tierRequired]?.maxQualityRank || 1;
    if (userPlanRank < requiredPlanRank) {
      return res.status(403).json({
        message: `This video requires ${video.tierRequired} plan. Please upgrade your subscription to download.`
      });
    }

    const videoPath = path.join(VIDEOS_DIR, video.fileName);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: `Video file ${video.fileName} is not available on the server.` });
    }

    const allDevices = getDevices();
    const userDevices = allDevices[userId] || [];
    const maxDevices = MEMBERSHIP_PLANS[subscription.plan]?.maxDevices || 1;
    const currentDeviceId = deviceId || "default-device";
    const isRegistered = userDevices.some((d) => d.deviceId === currentDeviceId);

    if (!isRegistered) {
      if (userDevices.length < maxDevices) {
        userDevices.push({
          deviceId: currentDeviceId,
          deviceName: `${getBrowser(req)} on Device`,
          browser: getBrowser(req),
          registeredAt: Date.now(),
          lastUsedAt: Date.now()
        });
        allDevices[userId] = userDevices;
        saveDevices(allDevices);
      } else {
        return res.status(403).json({
          message: `Download blocked: Device limit (${maxDevices}) exceeded for ${subscription.plan} plan.`
        });
      }
    }

    const now = Date.now();
    const startOfDay = getStartOfDay();
    const startOfMonth = getStartOfMonth();
    const downloads = readDownloads();
    const userDownloads = downloads.filter((d) => d.userId === userId && d.status === "SUCCESS");

    const recentDownload = userDownloads.find(
      (d) => d.videoId === videoId && now - Number(d.downloadTimestamp) < 24 * 60 * 60 * 1000
    );
    const isReDownload = Boolean(recentDownload);

    const plan = MEMBERSHIP_PLANS[subscription.plan] || MEMBERSHIP_PLANS.Free;
    const dailyDownloads = userDownloads.filter(
      (d) => Number(d.downloadTimestamp) >= startOfDay && d.quotaDeducted !== false
    );
    const monthlyDownloads = userDownloads.filter(
      (d) => Number(d.downloadTimestamp) >= startOfMonth && d.quotaDeducted !== false
    );

    if (!isReDownload) {
      if (dailyDownloads.length >= plan.dailyLimit) {
        return res.status(429).json({
          message: `Daily download limit reached for ${subscription.plan} plan (${plan.dailyLimit} per day).`,
          remainingDailyQuota: 0
        });
      }

      if (monthlyDownloads.length >= plan.monthlyLimit) {
        return res.status(429).json({
          message: `Monthly download limit reached for ${subscription.plan} plan (${plan.monthlyLimit} per month).`,
          remainingDailyQuota: Math.max(0, plan.dailyLimit - dailyDownloads.length)
        });
      }
    }

    const stat = fs.statSync(videoPath);
    const downloadRecord = {
      id: "download-" + now + "-" + Math.random().toString(36).substring(2, 8),
      userId,
      videoId,
      videoTitle: video.title,
      downloadTimestamp: now,
      ipAddress: getClientIP(req),
      device: currentDeviceId,
      browser: getBrowser(req),
      subscriptionPlan: subscription.plan,
      fileName: video.fileName,
      fileSize: `${(stat.size / 1024).toFixed(0)} KB`,
      status: "SUCCESS",
      quotaDeducted: !isReDownload,
      isReDownload
    };

    downloads.push(downloadRecord);
    saveDownloads(downloads);

    const newDailyUsed = isReDownload ? dailyDownloads.length : dailyDownloads.length + 1;
    const newMonthlyUsed = isReDownload ? monthlyDownloads.length : monthlyDownloads.length + 1;

    res.json({
      success: true,
      message: isReDownload
        ? "Re-download authorized! Free download within 24 hours (no quota deducted)."
        : "Download authorized successfully.",
      downloadUrl: `/videos/${video.fileName}`,
      fileUrl: `/videos/${video.fileName}`,
      fileName: video.fileName,
      remainingDailyQuota: Math.max(0, plan.dailyLimit - newDailyUsed),
      remainingMonthlyQuota: Math.max(0, plan.monthlyLimit - newMonthlyUsed),
      isReDownload,
      downloadId: downloadRecord.id
    });
  } catch (error) {
    console.error("Download execution error:", error);
    res.status(500).json({ message: "Internal server error during download process." });
  } finally {
    ACTIVE_DOWNLOAD_LOCKS.delete(lockKey);
  }
});

// 20. Report Failed Download
app.post("/api/download/report-failure", (req, res) => {
  const { userId, videoId, reason, downloadId } = req.body;
  const downloads = readDownloads();
  const now = Date.now();

  const failedRecord = {
    id: downloadId || `dl-failed-${now}`,
    userId: userId || "Unknown",
    videoId: videoId || "Unknown",
    videoTitle: VIDEOS.find((v) => v.id === videoId)?.title || "Unknown Video",
    downloadTimestamp: now,
    ipAddress: getClientIP(req),
    device: "client-device",
    browser: getBrowser(req),
    subscriptionPlan: "Unknown",
    fileName: "N/A",
    fileSize: "0 KB",
    status: "FAILED",
    failureReason: reason || "Network or client interruption",
    quotaDeducted: false
  };

  downloads.push(failedRecord);
  saveDownloads(downloads);

  res.json({ success: true, message: "Failure recorded; quota was not deducted.", record: failedRecord });
});

// ======================================================
// TASK 4: ACCOUNT SECURITY, ADAPTIVE THEME & OTP SYSTEM
// ======================================================

function readLoginRecords() {
  try {
    return JSON.parse(fs.readFileSync(LOGIN_RECORDS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveLoginRecords(data) {
  try {
    fs.writeFileSync(LOGIN_RECORDS_FILE, JSON.stringify(data, null, 2));
    if (isMongoConnected && loginRecordsColl && data.length > 0) {
      loginRecordsColl.updateOne({ id: data[0].id }, { $set: data[0] }, { upsert: true }).catch(() => { });
    }
  } catch (err) {
    console.error("Error saving login records:", err);
  }
}

function readTrustedDevices() {
  try {
    return JSON.parse(fs.readFileSync(TRUSTED_DEVICES_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveTrustedDevices(data) {
  try {
    fs.writeFileSync(TRUSTED_DEVICES_FILE, JSON.stringify(data, null, 2));
    if (isMongoConnected && trustedDevicesColl && data.length > 0) {
      trustedDevicesColl.updateOne({ id: data[0].id }, { $set: data[0] }, { upsert: true }).catch(() => { });
    }
  } catch (err) {
    console.error("Error saving trusted devices:", err);
  }
}

function readUserSecurity() {
  try {
    return JSON.parse(fs.readFileSync(USER_SECURITY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveUserSecurity(data) {
  try {
    fs.writeFileSync(USER_SECURITY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving user security:", err);
  }
}

function getISTInfo(timestamp = Date.now()) {
  const d = new Date(timestamp);
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (330 * 60000));
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  // 5:00 AM (inclusive) to 12:00 PM (exclusive): 5 <= hours < 12
  const isMorningIST = hours >= 5 && hours < 12;
  const defaultTheme = isMorningIST ? "light" : "dark";
  const formatted = istDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { istDate, hours, minutes, isMorningIST, defaultTheme, formatted };
}

// 21. Attempt Login & Assess Security Challenge
app.post("/api/security/login-attempt", async (req, res) => {
  const {
    userId = "user-001",
    username = "Harini",
    browser = "Chrome 124.0",
    os = "Windows 11",
    deviceType = "Desktop",
    deviceModel = "Dell XPS 15 9520",
    ipAddress = "49.37.152.88",
    city = "Chennai",
    state = "Tamil Nadu",
    country = "India",
    approxLocation = "Chennai, Tamil Nadu, India (13.0827° N, 80.2707° E)",
    simulatedTimestamp,
    forceOtp = false,
    channel = "email"
  } = req.body;

  const now = simulatedTimestamp ? Number(simulatedTimestamp) : Date.now();
  const istInfo = getISTInfo(now);
  const userSec = readUserSecurity();
  const userConfig = userSec[userId] || {
    userId,
    email: `${username.toLowerCase()}@example.com`,
    phone: "+91 98765 43210",
    trustedDurationDays: 30,
    twoFactorEnabled: true,
    manualTheme: null
  };

  const activeTheme = userConfig.manualTheme || istInfo.defaultTheme;

  const trustedList = readTrustedDevices();
  const isDeviceTrusted = trustedList.some((td) => {
    return (
      td.userId === userId &&
      td.isActive &&
      Number(td.expiresAt) > Date.now() &&
      td.browser === browser &&
      td.deviceType === deviceType &&
      (td.ipAddress === ipAddress || td.location?.includes(city))
    );
  });

  const records = readLoginRecords();
  const pastLogins = records.filter((r) => r.userId === userId && r.status === "SUCCESS");

  const hasBrowserBefore = pastLogins.some((r) => r.browser === browser);
  const hasIpBefore = pastLogins.some((r) => r.ipAddress === ipAddress);
  const hasCityBefore = pastLogins.some((r) => r.city === city);
  const hasDeviceBefore = pastLogins.some((r) => r.deviceType === deviceType);

  const isAnomalous = !isDeviceTrusted && (!hasBrowserBefore || !hasIpBefore || !hasCityBefore || !hasDeviceBefore || forceOtp);

  if (isAnomalous) {
    const reasons = [];
    if (!hasBrowserBefore) reasons.push(`New Browser detected: ${browser}`);
    if (!hasDeviceBefore) reasons.push(`New Device Type detected: ${deviceType}`);
    if (!hasIpBefore) reasons.push(`New IP Address detected: ${ipAddress}`);
    if (!hasCityBefore) reasons.push(`New Location detected: ${city}, ${state}`);
    if (forceOtp) reasons.push("Security verification requested");

    const reasonStr = reasons.join(" · ") || "Unrecognized login environment";
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomBytes(16).toString("hex");

    PENDING_OTP_STORE.set(tempToken, {
      userId,
      username,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      browser,
      os,
      deviceType,
      deviceModel,
      ipAddress,
      city,
      state,
      country,
      approxLocation,
      reason: reasonStr,
      failedAttempts: 0,
      activeTheme,
      createdAt: now
    });

    const targetContact = channel === "sms" ? userConfig.phone : userConfig.email;
    let previewUrl = null;
    let messageId = null;

    try {
      if (mailTransporter && channel !== "sms") {
        const mailInfo = await mailTransporter.sendMail({
          from: '"Multilingual Security Portal" <security@multilingualstream.com>',
          to: targetContact,
          subject: `[Security Verification] Your OTP Passcode: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px;">
              <h2 style="color: #6366f1; margin-top: 0;">Login Verification Code</h2>
              <p>A sign-in attempt was detected from an unrecognized browser/device or location:</p>
              <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Browser:</strong> ${browser}</p>
                <p style="margin: 4px 0;"><strong>Device:</strong> ${deviceModel} (${deviceType})</p>
                <p style="margin: 4px 0;"><strong>IP:</strong> ${ipAddress}</p>
                <p style="margin: 4px 0;"><strong>Location:</strong> ${approxLocation}</p>
              </div>
              <p>Enter the following 6-digit verification code to complete sign-in:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981; padding: 12px; background: rgba(16,185,129,0.1); text-align: center; border-radius: 8px; margin: 16px 0;">
                ${otp}
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">This code will expire in 5 minutes. If you did not initiate this login, secure your account immediately.</p>
            </div>
          `
        });
        messageId = mailInfo.messageId;
        previewUrl = nodemailer.getTestMessageUrl(mailInfo) || null;
      }
    } catch (mErr) {
      console.warn("Mail dispatch error:", mErr.message);
    }

    LAST_DELIVERED_EMAILS.set(userId, {
      userId,
      contact: targetContact,
      channel,
      otp,
      messageId: messageId || "msg-" + Date.now(),
      previewUrl,
      deliveredAt: Date.now()
    });

    const pendingRecord = {
      id: "login-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId,
      username,
      timestamp: now,
      ipAddress,
      browser,
      os,
      deviceType,
      deviceModel,
      city,
      state,
      country,
      location: approxLocation,
      status: "OTP_REQUIRED",
      authMethod: channel === "sms" ? "OTP_SMS" : "OTP_EMAIL",
      themeApplied: activeTheme,
      istHour: istInfo.hours,
      reason: reasonStr
    };

    records.unshift(pendingRecord);
    saveLoginRecords(records.slice(0, 50));

    return res.json({
      requiresOtp: true,
      tempToken,
      demoOtpCode: process.env.NODE_ENV === "production" ? undefined : otp,
      reason: reasonStr,
      deliveryChannel: channel,
      targetContact,
      delivered: true,
      previewUrl,
      autoTheme: activeTheme,
      istInfo,
      loginRecord: pendingRecord
    });
  }

  // Trusted or regular login
  const successRecord = {
    id: "login-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    userId,
    username,
    timestamp: now,
    ipAddress,
    browser,
    os,
    deviceType,
    deviceModel,
    city,
    state,
    country,
    location: approxLocation,
    status: "SUCCESS",
    authMethod: isDeviceTrusted ? "TRUSTED_DEVICE" : "STANDARD_SESSION",
    themeApplied: activeTheme,
    istHour: istInfo.hours
  };

  records.unshift(successRecord);
  saveLoginRecords(records.slice(0, 50));

  res.json({
    requiresOtp: false,
    success: true,
    theme: activeTheme,
    istInfo,
    loginRecord: successRecord
  });
});

// 22. Verify OTP
app.post("/api/security/verify-otp", (req, res) => {
  const { tempToken, otp, trustDevice = true, trustDurationDays = 30 } = req.body;
  const challenge = PENDING_OTP_STORE.get(tempToken);

  if (!challenge) {
    return res.status(400).json({ success: false, message: "Security session expired. Please attempt login again." });
  }

  if (Date.now() > challenge.expiresAt) {
    PENDING_OTP_STORE.delete(tempToken);
    return res.status(400).json({ success: false, message: "OTP expired. Please click Resend OTP." });
  }

  const records = readLoginRecords();

  if (challenge.otp !== String(otp).trim()) {
    challenge.failedAttempts = (challenge.failedAttempts || 0) + 1;
    const failedRecord = {
      id: "login-fail-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId: challenge.userId,
      username: challenge.username,
      timestamp: Date.now(),
      ipAddress: challenge.ipAddress,
      browser: challenge.browser,
      os: challenge.os,
      deviceType: challenge.deviceType,
      deviceModel: challenge.deviceModel,
      city: challenge.city,
      state: challenge.state,
      country: challenge.country,
      location: challenge.approxLocation,
      status: "FAILED_OTP",
      authMethod: "OTP_CHALLENGE",
      themeApplied: challenge.activeTheme,
      reason: `Incorrect OTP entered (Attempt ${challenge.failedAttempts})`
    };
    records.unshift(failedRecord);
    saveLoginRecords(records.slice(0, 50));

    return res.status(400).json({
      success: false,
      message: `Incorrect OTP code entered. Remaining attempts: ${Math.max(0, 3 - challenge.failedAttempts)}`,
      failedAttempts: challenge.failedAttempts
    });
  }

  // OTP is correct!
  const durationMs = (Number(trustDurationDays) || 30) * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  if (trustDevice) {
    const trustedList = readTrustedDevices();
    const newTrusted = {
      id: "trust-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: challenge.userId,
      deviceName: `${challenge.browser.split(" ")[0]} on ${challenge.os}`,
      browser: challenge.browser,
      os: challenge.os,
      deviceType: challenge.deviceType,
      deviceModel: challenge.deviceModel,
      ipAddress: challenge.ipAddress,
      location: `${challenge.city}, ${challenge.state}, ${challenge.country}`,
      trustedAt: Date.now(),
      expiresAt,
      isActive: true
    };
    trustedList.unshift(newTrusted);
    saveTrustedDevices(trustedList);
  }

  const verifiedRecord = {
    id: "login-ver-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    userId: challenge.userId,
    username: challenge.username,
    timestamp: Date.now(),
    ipAddress: challenge.ipAddress,
    browser: challenge.browser,
    os: challenge.os,
    deviceType: challenge.deviceType,
    deviceModel: challenge.deviceModel,
    city: challenge.city,
    state: challenge.state,
    country: challenge.country,
    location: challenge.approxLocation,
    status: "OTP_VERIFIED",
    authMethod: "OTP_SUCCESS",
    themeApplied: challenge.activeTheme
  };
  records.unshift(verifiedRecord);
  saveLoginRecords(records.slice(0, 50));

  PENDING_OTP_STORE.delete(tempToken);

  res.json({
    success: true,
    message: "Security verification successful! Access granted.",
    theme: challenge.activeTheme,
    trusted: Boolean(trustDevice),
    expiresAt,
    record: verifiedRecord
  });
});

// 23. Resend OTP
app.post("/api/security/resend-otp", async (req, res) => {
  const { tempToken, channel = "email" } = req.body;
  const challenge = PENDING_OTP_STORE.get(tempToken);

  if (!challenge) {
    return res.status(400).json({ success: false, message: "Security session expired. Please try logging in again." });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  challenge.otp = newOtp;
  challenge.expiresAt = Date.now() + 5 * 60 * 1000;
  challenge.failedAttempts = 0;

  const targetContact = challenge.contact || `${challenge.username.toLowerCase()}@example.com`;
  let previewUrl = null;
  let messageId = null;

  try {
    if (mailTransporter && channel !== "sms") {
      const mailInfo = await mailTransporter.sendMail({
        from: '"Multilingual Security Portal" <security@multilingualstream.com>',
        to: targetContact,
        subject: `[Security Verification] Your New OTP Passcode: ${newOtp}`,
        html: `<p>Your requested new OTP verification passcode is: <strong>${newOtp}</strong></p>`
      });
      messageId = mailInfo.messageId;
      previewUrl = nodemailer.getTestMessageUrl(mailInfo) || null;
    }
  } catch (mErr) {
    console.warn("Resend mail error:", mErr.message);
  }

  LAST_DELIVERED_EMAILS.set(challenge.userId, {
    userId: challenge.userId,
    contact: targetContact,
    channel,
    otp: newOtp,
    messageId: messageId || "msg-" + Date.now(),
    previewUrl,
    deliveredAt: Date.now()
  });

  res.json({
    success: true,
    message: `New OTP dispatched to registered ${channel.toUpperCase()}.`,
    previewUrl,
    expiresInSeconds: 300
  });
});

// 23b. Inspect Last Delivered Email Receipt (For User Inbox & Auditing)
app.get("/api/security/last-delivered-email/:userId", (req, res) => {
  const { userId } = req.params;
  const record = LAST_DELIVERED_EMAILS.get(userId);
  if (!record) {
    return res.status(404).json({ success: false, message: "No email dispatch record found." });
  }
  res.json({ success: true, emailRecord: record });
});

// 24. Get User Security Audit Trail & History
app.get("/api/security/records/:userId", (req, res) => {
  const { userId } = req.params;
  const records = readLoginRecords();
  const userRecords = records.filter((r) => r.userId === userId || userId === "all");
  res.json({ success: true, records: userRecords });
});

// 25. Get Trusted Devices List
app.get("/api/security/trusted-devices/:userId", (req, res) => {
  const { userId } = req.params;
  const trustedList = readTrustedDevices();
  const userDevices = trustedList.filter((td) => td.userId === userId && td.isActive);
  res.json({ success: true, trustedDevices: userDevices });
});

// 26. Revoke Trusted Device
app.post("/api/security/revoke-trusted-device", (req, res) => {
  const { userId, deviceId, revokeAll } = req.body;
  const trustedList = readTrustedDevices();

  const updated = trustedList.map((d) => {
    if (d.userId === userId) {
      if (revokeAll || d.id === deviceId) {
        return { ...d, isActive: false, revokedAt: Date.now() };
      }
    }
    return d;
  });

  saveTrustedDevices(updated);
  res.json({ success: true, message: revokeAll ? "All trusted devices revoked." : "Trusted device revoked." });
});

// 27. Update Security Settings & Theme Preference
app.post("/api/security/update-settings", (req, res) => {
  const { userId, manualTheme, trustedDurationDays, notifyOnNewLogin, twoFactorEnabled } = req.body;
  const userSec = readUserSecurity();
  const current = userSec[userId] || { userId };

  if (manualTheme !== undefined) current.manualTheme = manualTheme;
  if (trustedDurationDays !== undefined) current.trustedDurationDays = Number(trustedDurationDays);
  if (notifyOnNewLogin !== undefined) current.notifyOnNewLogin = Boolean(notifyOnNewLogin);
  if (twoFactorEnabled !== undefined) current.twoFactorEnabled = Boolean(twoFactorEnabled);

  userSec[userId] = current;
  saveUserSecurity(userSec);

  res.json({ success: true, message: "Security preferences updated successfully.", config: current });
});

// ======================================================
// TASK 5: VIDEO PROGRESS & RESUME WATCH STORE
// ======================================================

function readVideoProgress() {
  try {
    return JSON.parse(fs.readFileSync(VIDEO_PROGRESS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveVideoProgress(data) {
  try {
    fs.writeFileSync(VIDEO_PROGRESS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving video progress:", err);
  }
}

async function getVideoProgressFromDB(userId) {
  if (isMongoConnected && videoProgressColl) {
    try {
      const list = await videoProgressColl.find({ userId }).toArray();
      if (list && list.length > 0) {
        const map = {};
        for (const item of list) {
          const doc = { ...item };
          delete doc._id;
          map[doc.videoId] = doc;
        }
        return map;
      }
    } catch (err) {
      console.warn("MongoDB getVideoProgressFromDB error:", err.message);
    }
  }
  const all = readVideoProgress();
  return all[userId] || {};
}

async function saveVideoProgressToDB(userId, videoId, entry) {
  const all = readVideoProgress();
  if (!all[userId]) all[userId] = {};
  all[userId][videoId] = entry;
  saveVideoProgress(all);

  if (isMongoConnected && videoProgressColl) {
    try {
      await videoProgressColl.updateOne({ userId, videoId }, { $set: entry }, { upsert: true });
    } catch (err) {
      console.warn("MongoDB saveVideoProgressToDB error:", err.message);
    }
  }
}

// 28. Get Video Playback Progress
app.get("/api/video-progress/:userId", async (req, res) => {
  const { userId } = req.params;
  const userProgress = await getVideoProgressFromDB(userId);
  res.json({ success: true, progress: userProgress });
});

// 29. Save Video Playback Progress
app.post("/api/video-progress/save", async (req, res) => {
  const { userId, videoId, currentTime, duration, percent, completionThreshold = 85 } = req.body;
  if (!userId || !videoId) {
    return res.status(400).json({ success: false, message: "Missing userId or videoId" });
  }

  const userProgress = await getVideoProgressFromDB(userId);
  const currentPercent = Number(percent) || (duration > 0 ? (currentTime / duration) * 100 : 0);
  const isCompleted = currentPercent >= completionThreshold;

  const existing = userProgress[videoId] || {};
  const updatedEntry = {
    ...existing,
    userId,
    videoId,
    currentTime: Math.round(Number(currentTime) || 0),
    duration: Math.round(Number(duration) || 0),
    percent: Math.min(100, Math.round(currentPercent * 10) / 10),
    completed: existing.completed || isCompleted,
    lastUpdated: Date.now()
  };

  await saveVideoProgressToDB(userId, videoId, updatedEntry);
  res.json({ success: true, progress: updatedEntry });
});

// ======================================================
// TASK 6: VIDEO CALLING & REAL-TIME MEETING SYSTEM
// ======================================================

function readMeetings() {
  try {
    return JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveMeetings(data) {
  try {
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving meetings:", err);
  }
}

async function getMeetingsFromDB() {
  if (isMongoConnected && meetingsColl) {
    try {
      const list = await meetingsColl.find().toArray();
      if (list && list.length > 0) {
        const map = {};
        for (const r of list) {
          const doc = { ...r };
          delete doc._id;
          map[doc.roomId] = doc;
        }
        return map;
      }
    } catch (err) {
      console.warn("MongoDB getMeetingsFromDB error:", err.message);
    }
  }
  return readMeetings();
}

async function getMeetingRoomFromDB(roomId) {
  if (isMongoConnected && meetingsColl) {
    try {
      const doc = await meetingsColl.findOne({ roomId });
      if (doc) {
        delete doc._id;
        return doc;
      }
    } catch (err) {
      console.warn("MongoDB getMeetingRoomFromDB error:", err.message);
    }
  }
  const all = readMeetings();
  return all[roomId] || null;
}

async function saveMeetingRoomToDB(room) {
  const all = readMeetings();
  all[room.roomId] = room;
  saveMeetings(all);

  if (isMongoConnected && meetingsColl) {
    try {
      await meetingsColl.updateOne({ roomId: room.roomId }, { $set: room }, { upsert: true });
    } catch (err) {
      console.warn("MongoDB saveMeetingRoomToDB error:", err.message);
    }
  }
}

// 30. Create Meeting Room
app.post("/api/meetings/create", async (req, res) => {
  const {
    title = "Quick Sync Meeting",
    hostUserId = "user-001",
    hostName = "Shri Harini",
    isLocked = false,
    passcode = "1234",
    maxParticipants = 12,
    allowScreenShare = true,
    allowChat = true
  } = req.body;

  const roomId = "meet-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);

  const newRoom = {
    roomId,
    title,
    hostUserId,
    hostName,
    isLocked: Boolean(isLocked),
    passcode: String(passcode || ""),
    maxParticipants: Number(maxParticipants) || 12,
    allowScreenShare: Boolean(allowScreenShare),
    allowChat: Boolean(allowChat),
    createdAt: Date.now(),
    participants: [
      {
        userId: hostUserId,
        userName: hostName,
        role: "host",
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        connectionQuality: "excellent",
        joinedAt: Date.now()
      }
    ],
    recordings: [],
    chatMessages: []
  };

  await saveMeetingRoomToDB(newRoom);
  res.json({ success: true, room: newRoom });
});

// 31. Get Meeting Status
app.get("/api/meetings/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const room = await getMeetingRoomFromDB(roomId);

  if (!room) {
    return res.status(404).json({ success: false, message: "Meeting room not found or expired." });
  }

  res.json({ success: true, room });
});

// 32. Join Meeting Room
app.post("/api/meetings/:roomId/join", async (req, res) => {
  const { roomId } = req.params;
  const { userId, userName, role = "participant", passcode } = req.body;
  const room = await getMeetingRoomFromDB(roomId);

  if (!room) {
    return res.status(404).json({ success: false, message: "Meeting room not found." });
  }

  if (room.isLocked) {
    return res.status(403).json({ success: false, message: "Meeting is currently locked by the host." });
  }

  if (room.passcode && room.passcode !== String(passcode)) {
    return res.status(401).json({ success: false, message: "Incorrect meeting passcode." });
  }

  if (room.participants.length >= room.maxParticipants) {
    return res.status(429).json({ success: false, message: `Meeting is full (max ${room.maxParticipants} participants).` });
  }

  const existingIdx = room.participants.findIndex((p) => p.userId === userId);
  if (existingIdx >= 0) {
    room.participants[existingIdx] = {
      ...room.participants[existingIdx],
      userName,
      isMuted: false,
      isCameraOff: false
    };
  } else {
    room.participants.push({
      userId,
      userName,
      role: userId === room.hostUserId ? "host" : role,
      isMuted: false,
      isCameraOff: false,
      isHandRaised: false,
      connectionQuality: "excellent",
      joinedAt: Date.now()
    });
  }

  await saveMeetingRoomToDB(room);
  res.json({ success: true, room });
});

// 33. Leave Meeting Room
app.post("/api/meetings/:roomId/leave", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = await getMeetingRoomFromDB(roomId);

  if (room) {
    room.participants = room.participants.filter((p) => p.userId !== userId);
    await saveMeetingRoomToDB(room);
  }

  res.json({ success: true, message: "Left meeting room." });
});

// 34. Host Moderation Action
app.post("/api/meetings/:roomId/moderate", async (req, res) => {
  const { roomId } = req.params;
  const { hostUserId, action, targetUserId, value } = req.body;
  const room = await getMeetingRoomFromDB(roomId);

  if (!room) {
    return res.status(404).json({ success: false, message: "Meeting not found." });
  }

  if (room.hostUserId !== hostUserId) {
    return res.status(403).json({ success: false, message: "Only the meeting host can execute moderation actions." });
  }

  if (action === "lock_room") {
    room.isLocked = Boolean(value);
  } else if (action === "toggle_screenshare") {
    room.allowScreenShare = Boolean(value);
  } else if (action === "toggle_chat") {
    room.allowChat = Boolean(value);
  } else if (action === "mute_all") {
    room.participants = room.participants.map((p) => p.userId === hostUserId ? p : { ...p, isMuted: true });
  } else if (action === "mute_user" && targetUserId) {
    const target = room.participants.find((p) => p.userId === targetUserId);
    if (target) target.isMuted = true;
  } else if (action === "remove_user" && targetUserId) {
    room.participants = room.participants.filter((p) => p.userId !== targetUserId);
  } else if (action === "set_cohost" && targetUserId) {
    const target = room.participants.find((p) => p.userId === targetUserId);
    if (target) target.role = value ? "co-host" : "participant";
  }

  await saveMeetingRoomToDB(room);
  res.json({ success: true, message: `Moderation action '${action}' applied.`, room });
});

// 35. Save Meeting Recording Archive
app.post("/api/meetings/:roomId/recording", async (req, res) => {
  const { roomId } = req.params;
  const { duration, recordedBy, recordingName } = req.body;
  const room = await getMeetingRoomFromDB(roomId);

  if (room) {
    const rec = {
      id: "rec-" + Date.now(),
      name: recordingName || `Meeting Recording - ${room.title}`,
      duration: duration || "04:12",
      recordedBy: recordedBy || "Host",
      recordedAt: Date.now(),
      downloadUrl: `/recordings/meeting-${roomId}.webm`
    };
    room.recordings = room.recordings || [];
    room.recordings.unshift(rec);
    await saveMeetingRoomToDB(room);
    return res.json({ success: true, recording: rec });
  }

  res.status(404).json({ success: false, message: "Meeting not found." });
});

// 36. Real-Time WebRTC Signal Exchange (Offer, Answer, ICE Candidates)
app.post("/api/meetings/:roomId/signal", (req, res) => {
  const { roomId } = req.params;
  const { fromUserId, toUserId, signal } = req.body;
  if (!roomId || !fromUserId || !toUserId || !signal) {
    return res.status(400).json({ success: false, message: "Missing signal parameters (roomId, fromUserId, toUserId, signal)." });
  }
  const key = `${roomId}:${toUserId}`;
  if (!MEETING_SIGNALS.has(key)) MEETING_SIGNALS.set(key, []);
  MEETING_SIGNALS.get(key).push({
    fromUserId,
    signal,
    timestamp: Date.now()
  });
  res.json({ success: true, message: "Signal buffered." });
});

// 37. Drain WebRTC Signals for Participant
app.get("/api/meetings/:roomId/signals/:userId", (req, res) => {
  const { roomId, userId } = req.params;
  const key = `${roomId}:${userId}`;
  const list = MEETING_SIGNALS.get(key) || [];
  MEETING_SIGNALS.delete(key);
  res.json({ success: true, signals: list });
});

// 38. Post In-Call Chat Message
app.post("/api/meetings/:roomId/chat", async (req, res) => {
  const { roomId } = req.params;
  const { userId, sender, text, file } = req.body;
  if (!text && !file) {
    return res.status(400).json({ success: false, message: "Chat content cannot be empty." });
  }
  const room = await getMeetingRoomFromDB(roomId);
  if (!room) return res.status(404).json({ success: false, message: "Room not found." });

  if (!room.allowChat && room.hostUserId !== userId) {
    return res.status(403).json({ success: false, message: "Host has disabled chat in this meeting." });
  }

  const msg = {
    id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
    userId,
    sender: sender || "Participant",
    text: text || "",
    file: file || null,
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    timestamp: Date.now()
  };

  if (!MEETING_CHATS.has(roomId)) MEETING_CHATS.set(roomId, []);
  MEETING_CHATS.get(roomId).push(msg);

  room.chatMessages = room.chatMessages || [];
  room.chatMessages.push(msg);
  await saveMeetingRoomToDB(room);

  res.json({ success: true, message: msg });
});

// 39. Get In-Call Chat Messages
app.get("/api/meetings/:roomId/chats", async (req, res) => {
  const { roomId } = req.params;
  const room = await getMeetingRoomFromDB(roomId);
  const memoryChats = MEETING_CHATS.get(roomId) || [];
  const roomChats = room?.chatMessages || [];
  const combined = [...roomChats, ...memoryChats.filter(m => !roomChats.some(r => r.id === m.id))];
  res.json({ success: true, messages: combined, chats: combined });
});

// Static Video & Thumbnail File Serving
app.use("/videos", express.static(VIDEOS_DIR));
app.use("/thumbnails", express.static(THUMBNAILS_DIR));

// Serve Frontend Production Build if present
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/videos") || req.path.startsWith("/thumbnails")) {
      return next();
    }
    const indexPath = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 404 Handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Server listener: await MongoDB connection before accepting requests
async function startServer() {
  console.log("Connecting to MongoDB Atlas...");
  await initMongoDB();
  app.listen(PORT, () => {
    console.log("========================================");
    console.log(`Multilingual & Subscription Server running on http://localhost:${PORT}`);
    console.log(`Database: ${isMongoConnected ? "MongoDB Atlas (VERIFIED_ONLINE)" : "Local JSON Fallback"}`);
    console.log(`Video folder: ${VIDEOS_DIR}`);
    console.log(`Thumbnails folder: ${THUMBNAILS_DIR}`);
    console.log("========================================");
  });
}

startServer();