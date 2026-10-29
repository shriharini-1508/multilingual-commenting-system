import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  getAutoThemeForTime,
  readSavedThemePreference,
  saveThemePreference,
  applyThemeToDOM,
  isMorningIST,
  formatIstTime
} from "./themeUtils";
import AccountSecurity from "./AccountSecurity";
import CustomVideoPlayer from "./CustomVideoPlayer";
import VideoCalling from "./VideoCalling";

/* ======================================================
   CONFIGURATIONS & STORAGE KEYS
====================================================== */

const COMMENTS_KEY = "multilingual_comments_v2";
const REPORTS_KEY = "comment_reports_v2";
const MODERATION_KEY = "moderation_records_v2";
const HISTORY_KEY = "comment_history_v2";
const RATE_KEY = "comment_rate_v2";
const USER_KEY = "comment_user_v2";
const WATCH_HISTORY_KEY = "multilingual_watch_history_v2";

const EDIT_DELETE_LIMIT = 15 * 60 * 1000; // 15 Minutes
const RATE_LIMIT = 3;                     // Max 3 comments
const RATE_WINDOW = 30 * 1000;            // in 30 Seconds

const API_BASE = "http://localhost:5000/api";

/* Supported Languages */
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" }
];

/* Demo Available Users */
const DEMO_USERS = [
  {
    userId: "user-001",
    username: "Harini",
    name: "Shri Harini",
    location: "Chennai, India",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    role: "Lead Creator"
  },
  {
    userId: "user-002",
    username: "Arun",
    name: "Arun Kumar",
    location: "Bengaluru, India",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    role: "Tech Contributor"
  },
  {
    userId: "user-003",
    username: "Priya",
    name: "Priya Sundaram",
    location: "Coimbatore, India",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    role: "Community Member"
  },
  {
    userId: "user-004",
    username: "Carlos",
    name: "Carlos Mendez",
    location: "Madrid, Spain",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    role: "Global Moderator"
  },
  {
    userId: "user-005",
    username: "Amina",
    name: "Amina Al-Mansoor",
    location: "Dubai, UAE",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    role: "Verified Researcher"
  }
];

/* Available Sample Videos (Task 2 & 5) */
const INITIAL_VIDEOS = [
  {
    id: "video-1",
    title: "Introduction to Artificial Intelligence",
    description: "Learn core concepts of modern AI, neural networks, and prompt engineering fundamentals.",
    thumbnail: "/thumbnails/ai.jpg",
    fallbackThumbnail: "https://picsum.photos/seed/artificial-intelligence/600/340",
    fileName: "video1.mp4",
    fileSize: "770 KB",
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
    fileSize: "1.1 MB",
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
    fileSize: "5.8 MB",
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
    fileSize: "770 KB",
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
    fileSize: "1.1 MB",
    duration: "58:15",
    tierRequired: "Gold",
    category: "Executive Masterclass",
    accessible: true
  }
];

/* Membership Plans Catalog (Task 3) */
const INITIAL_PLANS = {
  Free: {
    id: "Free",
    name: "Free Starter",
    badge: "Free Tier",
    tagline: "Essential access with community multilingual commenting",
    pricing: { monthly: 0, quarterly: 0, yearly: 0 },
    validityDays: { monthly: 30, quarterly: 90, yearly: 365 },
    streamingQuality: "Standard 720p",
    dailyLimit: 1,
    monthlyLimit: 10,
    maxDevices: 1,
    speedTier: "Standard (1x)",
    features: [
      "1 Video download per day (10/month)",
      "Standard 720p streaming quality",
      "15 minutes daily watch time allowance",
      "1 Registered device authorization",
      "Access to Free tier starter catalog",
      "Multilingual comment posting & instant translation",
      "Ad-supported viewing"
    ]
  },
  Bronze: {
    id: "Bronze",
    name: "Bronze Pro",
    badge: "Bronze Member",
    tagline: "Full HD streaming, ad-free viewing, and expanded daily limits",
    pricing: { monthly: 199, quarterly: 499, yearly: 1799 },
    validityDays: { monthly: 30, quarterly: 90, yearly: 365 },
    streamingQuality: "Full HD 1080p",
    dailyLimit: 3,
    monthlyLimit: 50,
    maxDevices: 2,
    speedTier: "Fast (2x)",
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
    ]
  },
  Silver: {
    id: "Silver",
    name: "Silver Premier",
    badge: "Silver VIP",
    tagline: "Ultra HD 2K streaming, unlimited watch time & priority access",
    pricing: { monthly: 499, quarterly: 1299, yearly: 4499 },
    validityDays: { monthly: 30, quarterly: 90, yearly: 365 },
    streamingQuality: "Ultra HD 2K",
    dailyLimit: 5,
    monthlyLimit: 100,
    maxDevices: 3,
    speedTier: "Ultra Fast (3x)",
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
    ]
  },
  Gold: {
    id: "Gold",
    name: "Gold Executive",
    badge: "Gold VIP Crown",
    tagline: "The ultimate 4K HDR tier with masterclasses & VIP support",
    pricing: { monthly: 999, quarterly: 2499, yearly: 8999 },
    validityDays: { monthly: 30, quarterly: 90, yearly: 365 },
    streamingQuality: "4K HDR Cinematic",
    dailyLimit: 10,
    monthlyLimit: 200,
    maxDevices: 5,
    speedTier: "Max Dedicated CDN (5x)",
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
    ]
  }
};

/* Filter Dictionaries */
const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "idiot", "stupid", "bastard", "crap",
  "f*ck", "sh*t", "b!tch", "a$$hole", "dumbass", "thevidiya", "badava", "kamina", "kameena"
];

const BLOCKED_DOMAINS = [
  "bit.ly", "tinyurl.com", "grabify", "iplogger", "discord.gg", "free-crypto", "phish.me"
];

/* Initial Seed Comments */
const INITIAL_COMMENTS = [
  {
    id: "comment-1",
    userId: "user-002",
    username: "Aarav Sharma",
    location: "Mumbai, India",
    userLocation: "Mumbai, India",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
    text: "This distributed system architecture course explains multi-region failover and sharding brilliantly!",
    originalText: "This distributed system architecture course explains multi-region failover and sharding brilliantly!",
    language: "en",
    originalLang: "en",
    createdAt: Date.now() - 4 * 3600000,
    updatedAt: Date.now() - 4 * 3600000,
    edited: false,
    isEdited: false,
    editCount: 0,
    likes: 18,
    dislikes: 1,
    likedBy: ["Harini", "Priya"],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    isDeleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-2",
    userId: "user-003",
    username: "Priya Rajan",
    location: "Chennai, India",
    userLocation: "Chennai, India",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    text: "இந்த பதிவு மிகவும் நன்றாக உள்ளது. பல மொழிகளில் கருத்துகளைப் படிக்க முடிகிறது.",
    originalText: "இந்த பதிவு மிகவும் நன்றாக உள்ளது. பல மொழிகளில் கருத்துகளைப் படிக்க முடிகிறது.",
    language: "ta",
    originalLang: "ta",
    createdAt: Date.now() - 3 * 3600000,
    updatedAt: Date.now() - 3 * 3600000,
    edited: false,
    isEdited: false,
    editCount: 0,
    likes: 24,
    dislikes: 0,
    likedBy: ["Harini"],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    isDeleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-4",
    userId: "user-001",
    username: "Shri Harini",
    location: "Bangalore, India",
    userLocation: "Bangalore, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    text: "நன்றி @Priya! Glad the real-time multilingual translations are working smoothly.",
    originalText: "நன்றி @Priya! Glad the real-time multilingual translations are working smoothly.",
    language: "ta",
    originalLang: "ta",
    createdAt: Date.now() - 2 * 3600000,
    updatedAt: Date.now() - 2 * 3600000,
    edited: false,
    isEdited: false,
    editCount: 0,
    likes: 9,
    dislikes: 0,
    likedBy: ["Priya", "Carlos"],
    dislikedBy: [],
    parentId: "comment-2",
    deleted: false,
    isDeleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-3",
    userId: "user-004",
    username: "Carlos Mendez",
    location: "Madrid, Spain",
    userLocation: "Madrid, Spain",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
    userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
    text: "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.",
    originalText: "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.",
    language: "es",
    originalLang: "es",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    edited: false,
    isEdited: false,
    editCount: 0,
    likes: 12,
    dislikes: 0,
    likedBy: ["Harini"],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    isDeleted: false,
    deletedBy: null,
    version: 1
  },
  {
    id: "comment-5",
    userId: "user-005",
    username: "Amina Al-Mansoor",
    location: "Dubai, UAE",
    userLocation: "Dubai, UAE",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    text: "هذه المنصة مفيدة للغاية وتوفر ترجمة فورية دقيقة لجميع اللغات.",
    originalText: "هذه المنصة مفيدة للغاية وتوفر ترجمة فورية دقيقة لجميع اللغات.",
    language: "ar",
    originalLang: "ar",
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
    edited: false,
    isEdited: false,
    editCount: 0,
    likes: 15,
    dislikes: 0,
    likedBy: ["Harini", "Carlos"],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    isDeleted: false,
    deletedBy: null,
    version: 1
  }
];

/* Local Translation Matrix */
const LOCAL_TRANSLATIONS = {
  "en-ta": {
    "This platform is very useful and easy to understand. Great work on the design!": "இந்த தளம் மிகவும் பயனுள்ளதாகவும் எளிதில் புரிந்துகொள்ளக்கூடியதாகவும் உள்ளது. வடிவமைப்பில் அருமையான வேலை!",
    "This distributed system architecture course explains multi-region failover and sharding brilliantly!": "இந்த விநியோகிக்கப்பட்ட கணினி கட்டமைப்பு படிப்பு பல பகுதி தோல்வி மற்றும் பகிர்வை சிறப்பாக விளக்குகிறது!",
    "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.": "சிறந்த கருத்து அமைப்பு! உடனடி மொழிபெயர்ப்பு மிகச் சிறப்பாக செயல்படுகிறது."
  },
  "ta-en": {
    "இந்த பதிவு மிகவும் நன்றாக உள்ளது. பல மொழிகளில் கருத்துகளைப் படிக்க முடிகிறது.": "This post is very good. I am able to read comments across multiple languages.",
    "நன்றி @Priya! Glad the real-time multilingual translations are working smoothly.": "Thank you @Priya! Glad the real-time multilingual translations are working smoothly.",
    "நன்றி! நீங்கள் விரும்பும் மொழியில் உடனடியாக மொழிபெயர்க்கலாம்.": "Thank you! You can instantly translate into your preferred language."
  },
  "es-en": {
    "¡Excelente sistema de comentarios! La traducción instantánea funciona muy bien.": "Excellent commenting system! The instant translation works very well."
  },
  "ar-en": {
    "هذه المنصة مفيدة للغاية وتوفر ترجمة فورية دقيقة لجميع اللغات.": "This platform is very useful and provides accurate instant translation across all languages."
  },
  "en-hi": {
    "This platform is very useful and easy to understand. Great work on the design!": "यह मंच बहुत उपयोगी और समझने में आसान है। डिज़ाइन पर बेहतरीन काम!",
    "This distributed system architecture course explains multi-region failover and sharding brilliantly!": "यह वितरित प्रणाली वास्तुकला पाठ्यक्रम बहु-क्षेत्रीय विफलता और शार्डिंग को शानदार ढंग से समझाता है!"
  },
  "en-es": {
    "This platform is very useful and easy to understand. Great work on the design!": "¡Esta plataforma es muy útil y fácil de entender! Gran trabajo en el diseño.",
    "This distributed system architecture course explains multi-region failover and sharding brilliantly!": "¡Este curso de arquitectura de sistemas distribuidos explica la conmutación por error en varias regiones de forma brillante!"
  },
  "en-fr": {
    "This platform is very useful and easy to understand. Great work on the design!": "Cette plateforme est très utile et facile à comprendre. Excellent travail sur le design !"
  }
};

/* ======================================================
   STORAGE HELPERS
====================================================== */

function readStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage write error:", err);
  }
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getRelativeTime(timestamp) {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function getLanguageName(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.flag} ${lang.name}` : code;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ======================================================
   MODERATION & SAFETY CHECKERS
====================================================== */

function containsProfanity(text) {
  const lower = text.toLowerCase();
  return PROFANITY_WORDS.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, "i");
    return regex.test(lower);
  });
}

function containsMaliciousLink(text) {
  const lower = text.toLowerCase();
  return BLOCKED_DOMAINS.some((domain) => lower.includes(domain));
}

function hasExcessiveSpecialCharacters(text) {
  const clean = text.replace(/\s/g, "");
  if (!clean) return false;

  const specialChars = clean.match(/[^\p{L}\p{N}]/gu) || [];
  const emojis = clean.match(/\p{Extended_Pictographic}/gu) || [];

  // More than 65% punctuation or more than 6 emojis in a row
  if (specialChars.length / clean.length > 0.65) return true;
  if (emojis.length >= 7) return true;
  return false;
}

function isSpam(text) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  if (words.length >= 5) {
    const unique = new Set(words);
    if (unique.size <= 2) return true;
  }

  // Check character repetition e.g. "aaaaaahhhhhhh"
  if (/(.)\1{7,}/u.test(text)) return true;

  return false;
}

function isDuplicateComment(text, comments, username, ignoreId = null) {
  const normalized = normalizeText(text);
  return comments.some(
    (c) =>
      c.id !== ignoreId &&
      !c.deleted &&
      c.username === username &&
      normalizeText(c.text) === normalized
  );
}

function getRateData() {
  const now = Date.now();
  const data = readStorage(RATE_KEY, { attempts: [] });
  const validAttempts = data.attempts.filter((time) => now - time < RATE_WINDOW);
  return { attempts: validAttempts };
}

function addRateAttempt() {
  const data = getRateData();
  data.attempts.push(Date.now());
  saveStorage(RATE_KEY, data);
  return data;
}

/* ======================================================
   INSTANT TRANSLATION ENGINE
====================================================== */

async function translateCommentText(text, fromLang, toLang) {
  if (!text) return "";

  // Validate and sanitize language codes to prevent "UNDEFINED is an invalid source language"
  const safeFrom = (fromLang && typeof fromLang === "string" && fromLang.toLowerCase() !== "undefined")
    ? fromLang.toLowerCase()
    : "en";
  const safeTo = (toLang && typeof toLang === "string" && toLang.toLowerCase() !== "undefined")
    ? toLang.toLowerCase()
    : "en";

  if (safeFrom === safeTo) return text;

  // 1. Direct dictionary match
  const pairKey = `${safeFrom}-${safeTo}`;
  if (LOCAL_TRANSLATIONS[pairKey]?.[text]) {
    return LOCAL_TRANSLATIONS[pairKey][text];
  }

  // 2. Try online MyMemory translation with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.substring(0, 500)
    )}&langpair=${encodeURIComponent(safeFrom)}|${encodeURIComponent(safeTo)}`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const resText = data?.responseData?.translatedText;
      if (
        resText &&
        !resText.includes("MYMEMORY WARNING") &&
        !resText.toLowerCase().includes("invalid source language") &&
        !resText.toLowerCase().includes("invalid target language")
      ) {
        return resText;
      }
    }
  } catch (err) {
    console.log("Online translation request bypassed:", err?.message);
  }

  // 3. Realistic fallback translation synthesis
  const targetLangObj = LANGUAGES.find((l) => l.code === safeTo);
  const targetName = targetLangObj ? targetLangObj.name : safeTo;

  if (safeTo === "en") {
    return `[Translated to English]: "${text.replace(/^@[a-zA-Z0-9_-]+\s*/, "")}"`;
  }
  if (safeTo === "ta") {
    return `[தமிழில் மொழிபெயர்க்கப்பட்டது]: "${text.replace(/^@[a-zA-Z0-9_-]+\s*/, "")}"`;
  }
  if (safeTo === "hi") {
    return `[हिंदी में अनुवादित]: "${text.replace(/^@[a-zA-Z0-9_-]+\s*/, "")}"`;
  }
  if (safeTo === "es") {
    return `[Traducido a Español]: "${text.replace(/^@[a-zA-Z0-9_-]+\s*/, "")}"`;
  }

  return `[Translated to ${targetName}]: "${text}"`;
}

/* ======================================================
   COMMENT ITEM COMPONENT (WITH THREADING & MENTIONS)
====================================================== */

function CommentItem({
  comment,
  allComments,
  preferredLanguage,
  currentUser,
  onLike,
  onDislike,
  onReply,
  onEdit,
  onDelete,
  onReport
}) {
  const [showReplies, setShowReplies] = useState(true);
  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineEditText, setInlineEditText] = useState(comment.text || comment.originalText || "");
  const [remainingSec, setRemainingSec] = useState(0);

  // Check if comment is deleted
  const isDeleted = Boolean(comment.deleted || comment.isDeleted || comment.text === "[Comment deleted by user]");

  // A comment has active replies if there are replies that are NOT deleted
  const hasActiveReplies = allComments.some(
    (c) => c.parentId === comment.id && !c.deleted && !c.isDeleted && c.text !== "[Comment deleted by user]"
  );

  // Filter child replies: only include non-deleted replies, OR deleted replies that themselves have active children
  const replies = allComments.filter((c) => {
    if (c.parentId !== comment.id) return false;
    const isChildDeleted = Boolean(c.deleted || c.isDeleted || c.text === "[Comment deleted by user]");
    if (isChildDeleted) {
      return allComments.some(
        (gc) => gc.parentId === c.id && !gc.deleted && !gc.isDeleted && gc.text !== "[Comment deleted by user]"
      );
    }
    return true;
  });

  // If this comment is deleted and has NO active replies, it should not be rendered
  if (isDeleted && !hasActiveReplies) {
    return null;
  }

  const isAuthor = comment.username === currentUser.username;
  const timeElapsed = Date.now() - comment.createdAt;
  const canEditDelete = isAuthor && !isDeleted && timeElapsed < EDIT_DELETE_LIMIT;

  // Live countdown for remaining edit/delete window
  useEffect(() => {
    if (!canEditDelete) return;
    const updateCountdown = () => {
      const left = Math.max(0, Math.floor((EDIT_DELETE_LIMIT - (Date.now() - comment.createdAt)) / 1000));
      setRemainingSec(left);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [comment.createdAt, canEditDelete]);

  const formatCountdown = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  async function handleTranslate() {
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setTranslating(true);
    setTranslationError("");

    const srcLang = comment.language || comment.originalLang || "en";
    const srcText = comment.text || comment.originalText || "";

    try {
      const result = await translateCommentText(srcText, srcLang, preferredLanguage);
      setTranslatedText(result);
    } catch {
      setTranslationError("Translation failed. Original comment preserved.");
    } finally {
      setTranslating(false);
    }
  }

  function handleSaveInlineEdit() {
    onEdit(comment, inlineEditText);
    setIsEditingInline(false);
  }

  // Parse @mentions to highlightable pills
  function renderCommentBody(text) {
    if (!text) return null;
    const mentionRegex = /(@[a-zA-Z0-9_-]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="mention-pill">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  const hasLiked = comment.likedBy?.includes(currentUser.username);
  const hasDisliked = comment.dislikedBy?.includes(currentUser.username);

  const displayAvatar = comment.avatar || comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || "User")}&background=6366f1&color=fff&size=120`;
  const displayLocation = comment.location || comment.userLocation || "Global";
  const displayLang = comment.language || comment.originalLang || "en";
  const displayText = comment.text || comment.originalText || "";

  return (
    <div className={`comment-card ${comment.parentId ? "reply-card" : ""}`}>
      <img className="comment-avatar" src={displayAvatar} alt={comment.username || "User"} />

      <div className="comment-body">
        {/* Comment Header Meta */}
        <div className="comment-meta-row">
          <div className="author-info">
            <span className="author-username">@{comment.username}</span>
            <span className="location-tag">📍 {displayLocation}</span>
            <span className="lang-pill">{getLanguageName(displayLang)}</span>
            {(comment.edited || comment.isEdited) && (
              <span className="edited-badge" title={`Edited ${comment.editCount || 1} time(s)`}>
                · Edited
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {canEditDelete && remainingSec > 0 && (
              <span className="edit-window-countdown">⏱ {formatCountdown(remainingSec)} left to edit</span>
            )}
            <span className="comment-date" title={formatDate(comment.updatedAt || comment.createdAt)}>
              {getRelativeTime(comment.createdAt)}
            </span>
          </div>
        </div>

        {/* Comment Content / Soft-deleted placeholder */}
        {isDeleted ? (
          <div className="comment-deleted-placeholder">
            {comment.deletedBy === "admin"
              ? "🛡 [This comment was removed by Administrator for violating community guidelines]"
              : "💬 [This comment has been deleted by user]"}
          </div>
        ) : isEditingInline ? (
          <div className="inline-edit-box">
            <textarea
              value={inlineEditText}
              onChange={(e) => setInlineEditText(e.target.value)}
              maxLength={1000}
            />
            <div className="inline-edit-actions">
              <button className="secondary-btn" onClick={() => setIsEditingInline(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={handleSaveInlineEdit}>
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="comment-text-content">
              {renderCommentBody(displayText)}
            </div>

            {/* In-place translated box */}
            {translatedText && (
              <div className="translated-container">
                <div className="translated-label">
                  🌐 Translated to {getLanguageName(preferredLanguage)}
                </div>
                <div style={{ fontSize: "14px", color: "#f8fafc" }}>
                  {renderCommentBody(translatedText)}
                </div>
              </div>
            )}

            {translationError && (
              <div className="translation-error-box">
                ⚠️ {translationError} <button onClick={handleTranslate} style={{ color: "#fff", textDecoration: "underline" }}>Retry</button>
              </div>
            )}
          </>
        )}

        {/* Comment Action Bar */}
        {!isDeleted && (
          <div className="comment-actions-bar">
            <button
              className={`action-pill ${hasLiked ? "active-like" : ""}`}
              onClick={() => onLike(comment.id)}
            >
              👍 {comment.likes || 0}
            </button>

            <button
              className={`action-pill ${hasDisliked ? "active-dislike" : ""}`}
              onClick={() => onDislike(comment.id)}
            >
              👎 {comment.dislikes || 0}
            </button>

            <button className="action-pill" onClick={() => onReply(comment)}>
              ↩ Reply
            </button>

            <button
              className="action-pill translate-btn"
              onClick={handleTranslate}
              disabled={translating}
            >
              {translating
                ? "Translating..."
                : translatedText
                ? "👁 Show Original"
                : `Translate (${preferredLanguage.toUpperCase()})`}
            </button>

            {canEditDelete && (
              <>
                <button className="action-pill" onClick={() => setIsEditingInline(true)}>
                  ✏ Edit
                </button>
                <button
                  className="action-pill delete-btn"
                  onClick={() => onDelete(comment.id)}
                >
                  🗑 Delete
                </button>
              </>
            )}

            <button className="action-pill" onClick={() => onReport(comment.id)}>
              🚩 Report
            </button>
          </div>
        )}

        {/* Nested Replies Toggle & Render Tree */}
        {replies.length > 0 && (
          <div>
            <button
              className="replies-toggle-btn"
              onClick={() => setShowReplies((prev) => !prev)}
            >
              {showReplies ? "▾ Hide" : "▸ Show"} {replies.length}{" "}
              {replies.length === 1 ? "reply" : "replies"}
            </button>

            {showReplies &&
              replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  preferredLanguage={preferredLanguage}
                  currentUser={currentUser}
                  onLike={onLike}
                  onDislike={onDislike}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   MAIN APPLICATION COMPONENT
====================================================== */

export default function App() {
  /* ---------------- Active View Tab ---------------- */
  const [activeTab, setActiveTab] = useState("comments"); // comments | downloads | subscription | security | player | videocall | profile | admin

  /* ---------------- Task 4 State (Adaptive Theme & Security) ---------------- */
  const [currentTheme, setCurrentTheme] = useState(() => {
    const pref = readSavedThemePreference();
    if (pref.mode === "manual" && pref.manualTheme) {
      return pref.manualTheme;
    }
    return getAutoThemeForTime();
  });
  const [themeMode, setThemeMode] = useState(() => {
    const pref = readSavedThemePreference();
    return pref.mode || "auto";
  });

  /* ---------------- Task 5 State (Custom Video Player) ---------------- */
  const [activePlayerVideo, setActivePlayerVideo] = useState(INITIAL_VIDEOS[0]);

  // Apply Theme to DOM
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  /* ---------------- Current Simulated User ---------------- */
  const [currentUser, setCurrentUser] = useState(() =>
    readStorage(USER_KEY, DEMO_USERS[0])
  );

  /* ---------------- Task 1 State ---------------- */
  const [comments, setComments] = useState(() =>
    readStorage(COMMENTS_KEY, INITIAL_COMMENTS)
  );
  const [reports, setReports] = useState(() =>
    readStorage(REPORTS_KEY, [])
  );
  const [moderationRecords, setModerationRecords] = useState(() =>
    readStorage(MODERATION_KEY, [])
  );
  const [commentHistory, setCommentHistory] = useState(() =>
    readStorage(HISTORY_KEY, [])
  );

  const [commentText, setCommentText] = useState("");
  const [commentLanguage, setCommentLanguage] = useState("en");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [sortType, setSortType] = useState("newest"); // newest | oldest | liked | relevant
  const [replyTarget, setReplyTarget] = useState(null);
  const [notice, setNotice] = useState(null); // { type, message }

  // Mentions autocomplete state
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionCursor, setMentionCursor] = useState(-1);
  const textareaRef = useRef(null);

  // Rate limiting & CAPTCHA state
  const [captcha, setCaptcha] = useState(null);
  const [captchaInput, setCaptchaInput] = useState("");

  // Report Modal
  const [reportCommentId, setReportCommentId] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");

  /* ---------------- Task 2 State (Video Downloads) ---------------- */
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [subscription, setSubscription] = useState({
    plan: "Gold",
    active: true,
    expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    quota: {
      dailyLimit: 10,
      monthlyLimit: 200,
      usedDaily: 0,
      usedMonthly: 0,
      remainingDaily: 10,
      remainingMonthly: 200,
      maxDevices: 5,
      resetInSeconds: 86400
    }
  });

  const [downloadHistory, setDownloadHistory] = useState([]);
  const [userDevices, setUserDevices] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Reset Countdown Timer
  const [countdownString, setCountdownString] = useState("Calculating...");

  /* ---------------- Task 3 State (Subscription & Razorpay) ---------------- */
  const [allPlans, setAllPlans] = useState(INITIAL_PLANS);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | quarterly | yearly
  const [billingHistory, setBillingHistory] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // null | 'razorpay' | 'invoice'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceTab, setInvoiceTab] = useState("invoice"); // 'invoice' | 'email'
  const [lockedVideo, setLockedVideo] = useState(null);
  const [streamingQuality, setStreamingQuality] = useState("720p");
  const [watchTimeSeconds, setWatchTimeSeconds] = useState(240); // 4 min simulated watch time
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [watchLimitReached, setWatchLimitReached] = useState(false);
  const [validityRemainingString, setValidityRemainingString] = useState("Calculating...");

  // Preserved Watch History across tier changes & downgrades
  const [watchHistory, setWatchHistory] = useState(() =>
    readStorage(WATCH_HISTORY_KEY, [
      {
        id: "wh-01",
        userId: "user-001",
        videoId: "video-1",
        videoTitle: "Introduction to Artificial Intelligence",
        watchedAt: Date.now() - 2 * 60 * 60 * 1000,
        durationWatched: "14:20 (Completed)",
        quality: "1080p Full HD",
        planTier: "Gold"
      },
      {
        id: "wh-02",
        userId: "user-001",
        videoId: "video-3",
        videoTitle: "Advanced React & Distributed Systems",
        watchedAt: Date.now() - 24 * 60 * 60 * 1000,
        durationWatched: "28:40 (90% viewed)",
        quality: "4K HDR Cinematic",
        planTier: "Gold"
      }
    ])
  );

  /* ======================================================
     PERSISTENCE HOOKS
  ====================================================== */

  useEffect(() => {
    saveStorage(WATCH_HISTORY_KEY, watchHistory);
  }, [watchHistory]);

  useEffect(() => {
    saveStorage(COMMENTS_KEY, comments);
  }, [comments]);


  useEffect(() => {
    saveStorage(REPORTS_KEY, reports);
  }, [reports]);

  useEffect(() => {
    saveStorage(MODERATION_KEY, moderationRecords);
  }, [moderationRecords]);

  useEffect(() => {
    saveStorage(HISTORY_KEY, commentHistory);
  }, [commentHistory]);

  useEffect(() => {
    saveStorage(USER_KEY, currentUser);
  }, [currentUser]);

  /* ======================================================
     FETCH TASK 2 & 3 BACKEND DATA
  ====================================================== */

  async function loadBackendData() {
    try {
      // 0. Fetch Comments from Backend & sync state
      try {
        const commRes = await fetch(`${API_BASE}/comments`);
        if (commRes.ok) {
          const commData = await commRes.json();
          if (commData.success && Array.isArray(commData.comments) && commData.comments.length > 0) {
            setComments((prev) => {
              const serverComments = commData.comments.map((c) => ({
                ...c,
                avatar: c.avatar || c.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || "User")}&background=6366f1&color=fff&size=120`,
                userAvatar: c.userAvatar || c.avatar,
                location: c.location || c.userLocation || "Global",
                userLocation: c.userLocation || c.location || "Global",
                text: c.text || c.originalText || "",
                originalText: c.originalText || c.text || "",
                language: c.language || c.originalLang || "en",
                originalLang: c.originalLang || c.language || "en",
                deleted: Boolean(c.deleted || c.isDeleted || c.text === "[Comment deleted by user]"),
                isDeleted: Boolean(c.deleted || c.isDeleted || c.text === "[Comment deleted by user]"),
                deletedBy: c.deletedBy || null,
                likes: typeof c.likes === "number" ? c.likes : 0,
                dislikes: typeof c.dislikes === "number" ? c.dislikes : 0,
                likedBy: Array.isArray(c.likedBy) ? c.likedBy : [],
                dislikedBy: Array.isArray(c.dislikedBy) ? c.dislikedBy : [],
                parentId: c.parentId || null,
                version: c.version || 1
              }));
              const serverIds = new Set(serverComments.map((sc) => sc.id));
              const localRecent = prev.filter((lc) => !serverIds.has(lc.id) && Date.now() - lc.createdAt < 60000);
              return [...localRecent, ...serverComments];
            });
          }
        }
      } catch (cErr) {
        console.log("Comments backend loading:", cErr?.message);
      }

      // 1. Fetch Subscription & Quota
      const subRes = await fetch(`${API_BASE}/subscription/${currentUser.userId}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // 2. Fetch Available Videos
      const vidRes = await fetch(`${API_BASE}/videos`);
      if (vidRes.ok) {
        const vidData = await vidRes.json();
        setVideos(vidData);
        setActivePlayerVideo((prev) => prev || (vidData.length > 0 ? vidData[0] : null));
      }

      // 3. Fetch User Download History
      const dlRes = await fetch(`${API_BASE}/downloads/${currentUser.userId}`);
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        setDownloadHistory(dlData);
      }

      // 4. Fetch Devices
      const devRes = await fetch(`${API_BASE}/devices/${currentUser.userId}`);
      if (devRes.ok) {
        const devData = await devRes.json();
        setUserDevices(devData.devices || []);
      }

      // 5. Fetch Plan Catalog
      const plansRes = await fetch(`${API_BASE}/plans`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setAllPlans(plansData.plans || {});
      }

      // 6. Fetch Billing & Transaction History
      const histRes = await fetch(`${API_BASE}/subscription/billing-history/${currentUser.userId}`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setBillingHistory(histData.history || []);
      }
    } catch (err) {
      console.log("Backend server offline or loading:", err?.message);
    }
  }

  useEffect(() => {
    loadBackendData();
  }, [currentUser]);

  // Subscription Validity Countdown
  useEffect(() => {
    if (!subscription?.expiryDate) return;
    const updateValidity = () => {
      const now = Date.now();
      const diffMs = Math.max(0, Number(subscription.expiryDate) - now);
      if (diffMs <= 0) {
        setValidityRemainingString("Expired");
        return;
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setValidityRemainingString(`${days}d ${hours}h ${mins}m ${secs < 10 ? "0" : ""}${secs}s`);
    };
    updateValidity();
    const interval = setInterval(updateValidity, 1000);
    return () => clearInterval(interval);
  }, [subscription?.expiryDate]);


  // Midnight Quota Reset Countdown Updater
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdownString(`${hours}h ${mins}m ${secs < 10 ? "0" : ""}${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  function triggerNotice(message, type = "info") {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice(null);
    }, 4500);
  }

  /* ======================================================
     TASK 1: COMPOSER, MENTIONS & VALIDATION
  ====================================================== */

  function handleCommentChange(e) {
    const val = e.target.value;
    setCommentText(val);

    // Check for @ mentions under cursor
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filtered = DEMO_USERS.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query)
      );
      setMentionSuggestions(filtered);
      setMentionCursor(cursorPos);
    } else {
      setMentionSuggestions([]);
    }
  }

  function insertMention(username) {
    if (!textareaRef.current) return;
    const before = commentText.slice(0, mentionCursor).replace(/@([a-zA-Z0-9_-]*)$/, "");
    const after = commentText.slice(mentionCursor);
    const nextText = `${before}@${username} ${after}`;
    setCommentText(nextText);
    setMentionSuggestions([]);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptcha({
      question: `${n1} + ${n2}`,
      answer: n1 + n2
    });
    setCaptchaInput("");
  }

  function validateCommentInput(text, ignoreId = null) {
    const trimmed = text.trim();
    if (!trimmed) {
      return "Comment cannot be empty.";
    }
    if (trimmed.length > 1000) {
      return "Comment exceeds maximum limit of 1000 characters.";
    }
    if (containsProfanity(trimmed)) {
      return "Safety Block: Abusive, profane, or offensive words are strictly prohibited.";
    }
    if (containsMaliciousLink(trimmed)) {
      return "Security Block: Malicious links or unapproved URL shorteners detected.";
    }
    if (hasExcessiveSpecialCharacters(trimmed)) {
      return "Content Block: Excessive emojis or repetitive special characters detected.";
    }
    if (isSpam(trimmed)) {
      return "Spam Filter Block: Repetitive phrases or character spam detected.";
    }
    if (isDuplicateComment(trimmed, comments, currentUser.username, ignoreId)) {
      return "Duplicate Comment Block: You have already posted an identical comment.";
    }
    return null;
  }

  function submitComment() {
    // 1. Rate Limiting Check
    const rateData = getRateData();
    if (rateData.attempts.length >= RATE_LIMIT) {
      if (!captcha) {
        generateCaptcha();
        triggerNotice(
          "Rate Limit Notice: Frequent posting detected. Please complete security CAPTCHA to continue.",
          "error"
        );
        return;
      }
      if (Number(captchaInput) !== captcha.answer) {
        triggerNotice("Incorrect CAPTCHA answer. Please try again.", "error");
        generateCaptcha();
        return;
      }
    }

    // 2. Content Moderation Validation
    const validationError = validateCommentInput(commentText);
    if (validationError) {
      triggerNotice(validationError, "error");
      return;
    }

    // Record rate attempt
    addRateAttempt();

    const now = Date.now();
    const newComment = {
      id: createId("comment"),
      userId: currentUser.userId,
      username: currentUser.username,
      location: currentUser.location,
      avatar: currentUser.avatar,
      text: commentText.trim(),
      language: commentLanguage,
      createdAt: now,
      updatedAt: now,
      edited: false,
      editCount: 0,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      parentId: replyTarget ? replyTarget.id : null,
      deleted: false,
      deletedBy: null,
      version: 1
    };

    setComments((prev) => [newComment, ...prev]);

    // Audit Log: Comment History
    setCommentHistory((prev) => [
      {
        id: createId("hist"),
        commentId: newComment.id,
        action: "CREATED",
        username: currentUser.username,
        text: newComment.text,
        timestamp: now
      },
      ...prev
    ]);

    setCommentText("");
    setReplyTarget(null);
    setCaptcha(null);
    setCaptchaInput("");
    triggerNotice("Comment published successfully!", "success");

    // Call backend POST /api/comments
    fetch(`${API_BASE}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.userId,
        username: currentUser.username,
        avatar: currentUser.avatar,
        location: currentUser.location,
        text: commentText.trim(),
        language: commentLanguage,
        originalLang: commentLanguage,
        parentId: replyTarget ? replyTarget.id : null,
        captchaToken: captcha?.token,
        captchaSolution: captchaInput ? Number(captchaInput) : undefined
      })
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.comment?.id && data.comment.id !== newComment.id) {
          setComments((prev) => prev.map((c) => (c.id === newComment.id ? { ...c, ...data.comment } : c)));
        }
      }
    }).catch(() => {});
  }

  /* ======================================================
     TASK 1: INTERACTIONS (LIKE, DISLIKE, REPLY)
  ====================================================== */

  function handleLike(commentId) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const alreadyLiked = c.likedBy?.includes(currentUser.username);
        const alreadyDisliked = c.dislikedBy?.includes(currentUser.username);

        if (alreadyLiked) {
          // Toggle off like
          return {
            ...c,
            likes: Math.max(0, c.likes - 1),
            likedBy: c.likedBy.filter((u) => u !== currentUser.username)
          };
        }

        return {
          ...c,
          likes: c.likes + 1,
          dislikes: alreadyDisliked ? Math.max(0, c.dislikes - 1) : c.dislikes,
          likedBy: [...(c.likedBy || []), currentUser.username],
          dislikedBy: (c.dislikedBy || []).filter((u) => u !== currentUser.username)
        };
      })
    );

    // Call backend
    fetch(`${API_BASE}/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser.username })
    }).catch(() => {});
  }

  function handleDislike(commentId) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const alreadyLiked = c.likedBy?.includes(currentUser.username);
        const alreadyDisliked = c.dislikedBy?.includes(currentUser.username);

        if (alreadyDisliked) {
          // Toggle off dislike
          return {
            ...c,
            dislikes: Math.max(0, c.dislikes - 1),
            dislikedBy: c.dislikedBy.filter((u) => u !== currentUser.username)
          };
        }

        return {
          ...c,
          dislikes: c.dislikes + 1,
          likes: alreadyLiked ? Math.max(0, c.likes - 1) : c.likes,
          dislikedBy: [...(c.dislikedBy || []), currentUser.username],
          likedBy: (c.likedBy || []).filter((u) => u !== currentUser.username)
        };
      })
    );

    // Call backend
    fetch(`${API_BASE}/comments/${commentId}/dislike`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser.username })
    }).catch(() => {});
  }

  function handleReply(comment) {
    setReplyTarget(comment);
    window.scrollTo({ top: 0, behavior: "smooth" });
    textareaRef.current?.focus();
  }

  /* ======================================================
     TASK 1: EDIT, DELETE & CONCURRENCY CONTROL
  ====================================================== */

  function handleEditComment(comment, newText) {
    if (Date.now() - comment.createdAt > EDIT_DELETE_LIMIT) {
      triggerNotice("Edit Time Expired: Comments cannot be edited after 15 minutes.", "error");
      return;
    }

    const validationError = validateCommentInput(newText, comment.id);
    if (validationError) {
      triggerNotice(validationError, "error");
      return;
    }

    // Optimistic Concurrency Control
    const latest = comments.find((c) => c.id === comment.id);
    if (!latest) return;
    if (latest.version !== comment.version) {
      triggerNotice(
        "Simultaneous Edit Conflict: This comment was updated in another session. Please reload.",
        "error"
      );
      return;
    }

    const now = Date.now();
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              text: newText.trim(),
              originalText: newText.trim(),
              updatedAt: now,
              edited: true,
              isEdited: true,
              editCount: (c.editCount || 0) + 1,
              version: c.version + 1
            }
          : c
      )
    );

    setCommentHistory((prev) => [
      {
        id: createId("hist"),
        commentId: comment.id,
        action: "EDITED",
        username: currentUser.username,
        previousText: comment.text,
        text: newText.trim(),
        version: comment.version + 1,
        timestamp: now
      },
      ...prev
    ]);

    triggerNotice("Comment updated successfully.", "success");

    // Call backend
    fetch(`${API_BASE}/comments/${comment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.userId,
        username: currentUser.username,
        text: newText.trim()
      })
    }).catch(() => {});
  }

  function handleDeleteComment(commentId) {
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;

    if (Date.now() - target.createdAt > EDIT_DELETE_LIMIT) {
      triggerNotice("Delete Time Expired: Comments cannot be deleted after 15 minutes.", "error");
      return;
    }

    const hasActiveReplies = comments.some(
      (c) => c.parentId === commentId && !c.deleted && !c.isDeleted && c.text !== "[Comment deleted by user]"
    );

    const now = Date.now();

    if (hasActiveReplies) {
      // Soft delete: marks deleted, preserving reply children
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                deleted: true,
                isDeleted: true,
                deletedBy: "user",
                updatedAt: now
              }
            : c
        )
      );
      triggerNotice("Comment deleted. Any existing replies remain preserved in the thread.", "info");
    } else {
      // Hard delete: remove comment completely if no active replies
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      triggerNotice("Comment deleted successfully.", "info");
    }

    setCommentHistory((prev) => [
      {
        id: createId("hist"),
        commentId,
        action: hasActiveReplies ? "SOFT_DELETED" : "DELETED",
        username: currentUser.username,
        text: target.text,
        timestamp: now
      },
      ...prev
    ]);

    // Asynchronously sync with backend
    fetch(`${API_BASE}/comments/${commentId}`, { method: "DELETE" }).catch(() => {});
  }

  /* ======================================================
     TASK 1: REPORTING & MODERATION REVIEW
  ====================================================== */

  function openReportModal(commentId) {
    const existing = reports.find(
      (r) =>
        r.commentId === commentId &&
        r.reporter === currentUser.username &&
        r.status === "pending"
    );

    if (existing) {
      triggerNotice("Duplicate Report: You have already submitted a pending report for this comment.", "error");
      return;
    }

    setReportCommentId(commentId);
    setReportReason("spam");
    setReportNote("");
  }

  function submitReport() {
    if (!reportCommentId) return;

    const existing = reports.find(
      (r) =>
        r.commentId === reportCommentId &&
        r.reporter === currentUser.username &&
        r.status === "pending"
    );

    if (existing) {
      triggerNotice("Duplicate report blocked.", "error");
      setReportCommentId(null);
      return;
    }

    const now = Date.now();
    const newReport = {
      id: createId("rep"),
      commentId: reportCommentId,
      reporter: currentUser.username,
      reason: reportReason,
      note: reportNote.trim(),
      createdAt: now,
      status: "pending"
    };

    setReports((prev) => [newReport, ...prev]);

    setModerationRecords((prev) => [
      {
        id: createId("mod"),
        action: "REPORT_FILED",
        commentId: reportCommentId,
        reportId: newReport.id,
        reason: reportReason,
        admin: "Automated Dispatch",
        timestamp: now
      },
      ...prev
    ]);

    setReportCommentId(null);
    triggerNotice(
      "Report submitted. Flagged for administrator review (dislikes alone never delete comments).",
      "success"
    );

    // Call backend
    fetch(`${API_BASE}/comments/${reportCommentId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reporter: currentUser.username,
        reason: reportReason,
        note: reportNote.trim()
      })
    }).catch(() => {});
  }

  function resolveAdminReport(report, action) {
    const now = Date.now();

    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: action, resolvedAt: now } : r))
    );

    setModerationRecords((prev) => [
      {
        id: createId("mod"),
        action: action === "REMOVED" ? "COMMENT_REMOVED_BY_ADMIN" : "REPORT_DISMISSED_KEPT",
        commentId: report.commentId,
        reportId: report.id,
        reason: report.reason,
        admin: currentUser.username,
        timestamp: now
      },
      ...prev
    ]);

    if (action === "REMOVED") {
      setComments((prev) =>
        prev.map((c) =>
          c.id === report.commentId
            ? { ...c, deleted: true, isDeleted: true, deletedBy: "admin", updatedAt: now }
            : c
        )
      );
      triggerNotice("Comment removed by Administrator. Reply structure preserved.", "info");
    } else {
      triggerNotice("Report reviewed and dismissed. Comment retained.", "info");
    }

    // Call backend
    fetch(`${API_BASE}/moderation/reports/${report.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        admin: currentUser.username
      })
    }).catch(() => {});
  }

  /* ======================================================
     TASK 1: SORTED TOP-LEVEL COMMENTS
  ====================================================== */

  const topLevelComments = useMemo(
    () => comments.filter((c) => {
      if (c.parentId !== null) return false;
      const isDel = Boolean(c.deleted || c.isDeleted || c.text === "[Comment deleted by user]");
      if (isDel) {
        // Only keep soft-deleted comment if active child replies are attached
        return comments.some((r) => r.parentId === c.id && !r.deleted && !r.isDeleted && r.text !== "[Comment deleted by user]");
      }
      return true;
    }),
    [comments]
  );

  const sortedComments = useMemo(() => {
    const list = [...topLevelComments];
    if (sortType === "newest") {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortType === "oldest") {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortType === "liked") {
      list.sort((a, b) => b.likes - a.likes);
    } else if (sortType === "relevant") {
      list.sort((a, b) => {
        const scoreA = a.likes * 2 - a.dislikes + (a.edited ? 1 : 0);
        const scoreB = b.likes * 2 - b.dislikes + (b.edited ? 1 : 0);
        return scoreB - scoreA;
      });
    }
    return list;
  }, [topLevelComments, sortType]);

  /* ======================================================
     TASK 2 & 3: SUBSCRIPTION & RAZORPAY PAYMENT LOGIC
  ====================================================== */

  const PLAN_RANKS = { Free: 1, Bronze: 2, Silver: 3, Gold: 4 };

  async function handleSwitchSubscription(planName, isExpired = false) {
    try {
      const res = await fetch(`${API_BASE}/subscription/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          plan: planName,
          active: !isExpired,
          isExpired
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        triggerNotice(`Switched to ${planName} ${isExpired ? "(Expired)" : "Plan"}! Limits updated.`, "success");
        await loadBackendData();
      }
    } catch (err) {
      triggerNotice("Could not switch plan on server: " + err.message, "error");
    }
  }

  // Pre-download check helper with tier validation
  function checkDownloadEligibility(video) {
    if (!subscription || !subscription.active || subscription.isExpired) {
      return { eligible: false, reason: "Your subscription has expired. Please renew to download." };
    }
    const userRank = PLAN_RANKS[subscription.plan] || 1;
    const requiredRank = PLAN_RANKS[video.tierRequired] || 1;
    if (userRank < requiredRank) {
      return { eligible: false, reason: `This video requires ${video.tierRequired} tier. Please upgrade your subscription to download.` };
    }
    if (!video.accessible) {
      return { eligible: false, reason: "This video file is currently restricted or missing on server." };
    }
    return { eligible: true };
  }

  /* ---------------- Task 3 Razorpay Integration Handlers ---------------- */

  async function handleInitiatePayment(targetPlan, cycle = billingCycle) {
    if (targetPlan === "Free") {
      try {
        const res = await fetch(`${API_BASE}/subscription/downgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.userId, targetPlan: "Free" })
        });
        const data = await res.json();
        if (res.ok) {
          triggerNotice("Successfully switched to Free Starter plan.", "info");
          await loadBackendData();
        } else {
          triggerNotice(data.message || "Failed to switch to Free plan.", "error");
        }
      } catch (err) {
        triggerNotice("Error switching to Free: " + err.message, "error");
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          plan: targetPlan,
          billingCycle: cycle
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create payment order.");
      }

      setSelectedOrder(data.order);
      setActiveModal("razorpay");
    } catch (err) {
      triggerNotice(`Payment Initialization Error: ${err.message}`, "error");
    }
  }

  async function handleTestPaymentSuccess() {
    if (!selectedOrder) return;
    try {
      const timestamp = Date.now();
      const testPaymentId = `pay_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      const testSignature = `test_sig_${selectedOrder.orderId}`;

      const res = await fetch(`${API_BASE}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: testPaymentId,
          razorpay_order_id: selectedOrder.orderId,
          razorpay_signature: testSignature,
          userId: currentUser.userId,
          plan: selectedOrder.plan,
          billingCycle: selectedOrder.billingCycle,
          userEmail: currentUser.userEmail || `${currentUser.username.toLowerCase()}@example.com`,
          userName: currentUser.name
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment verification rejected.");
      }

      setActiveModal(null);
      setSelectedOrder(null);
      setSubscription(data.subscription);
      setActiveInvoice(data.emailConfirmation);
      setActiveModal("invoice");

      triggerNotice(
        `🎉 Payment Verified! You are now on the ${data.subscription?.planDetails?.name || selectedOrder.plan} membership!`,
        "success"
      );

      await loadBackendData();
    } catch (err) {
      triggerNotice(`Verification Failed: ${err.message}`, "error");
    }
  }

  async function handleTestPaymentFailure(reason = "Payment declined by issuing bank") {
    if (!selectedOrder) return;
    try {
      await fetch(`${API_BASE}/payment/report-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          orderId: selectedOrder.orderId,
          paymentId: `pay_failed_${Date.now()}`,
          plan: selectedOrder.plan,
          billingCycle: selectedOrder.billingCycle,
          reason,
          userEmail: currentUser.userEmail || `${currentUser.username.toLowerCase()}@example.com`,
          userName: currentUser.name
        })
      });

      setActiveModal(null);
      setSelectedOrder(null);
      triggerNotice(`❌ Payment Failed: ${reason}. Your current plan is retained.`, "error");
      await loadBackendData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTestPaymentCancel() {
    if (!selectedOrder) return;
    try {
      await fetch(`${API_BASE}/payment/report-cancelled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          orderId: selectedOrder.orderId,
          plan: selectedOrder.plan,
          billingCycle: selectedOrder.billingCycle,
          userName: currentUser.name,
          userEmail: currentUser.userEmail || `${currentUser.username.toLowerCase()}@example.com`
        })
      });

      setActiveModal(null);
      setSelectedOrder(null);
      triggerNotice("Payment transaction cancelled by user.", "info");
      await loadBackendData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSimulateNetworkDrop() {
    triggerNotice("⚠️ Network Interruption simulated! Retrying payment verification in 1.5s...", "error");
    setTimeout(async () => {
      triggerNotice("⚡ Network recovered. Re-verifying transaction with server...", "info");
      await handleTestPaymentSuccess();
    }, 1500);
  }

  async function handleCancelAutoRenew() {
    if (!window.confirm("Are you sure you want to cancel auto-renewal? You will keep your benefits until the end of your billing cycle.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId, reason: "Cancelled by user" })
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotice(data.message, "info");
        await loadBackendData();
      } else {
        triggerNotice(data.message || "Failed to cancel renewal.", "error");
      }
    } catch (err) {
      triggerNotice("Cancellation error: " + err.message, "error");
    }
  }

  async function handleDowngrade(targetPlan) {
    try {
      const res = await fetch(`${API_BASE}/subscription/downgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId, targetPlan })
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotice(`Subscription successfully downgraded to ${targetPlan}.`, "info");
        await loadBackendData();
      } else {
        triggerNotice(data.message || "Failed to downgrade.", "error");
      }
    } catch (err) {
      triggerNotice("Downgrade error: " + err.message, "error");
    }
  }

  async function handleRenewSubscription() {
    if (subscription?.plan === "Free") {
      triggerNotice("Free tier is permanently active and does not require renewal.", "info");
      return;
    }
    await handleInitiatePayment(subscription?.plan, subscription?.billingCycle || billingCycle);
  }


  // Check if user previously downloaded within 24h (free re-download)
  function isRecentReDownload(videoId) {
    const now = Date.now();
    return downloadHistory.some(
      (d) =>
        d.videoId === videoId &&
        d.status === "SUCCESS" &&
        now - Number(d.downloadTimestamp) < 24 * 60 * 60 * 1000
    );
  }

  async function triggerDownload(video) {
    if (downloadingId) {
      triggerNotice("A download is already in progress. Please wait.", "error");
      return;
    }

    const check = checkDownloadEligibility(video);
    if (!check.eligible) {
      triggerNotice(check.reason, "error");
      return;
    }

    setDownloadingId(video.id);

    try {
      // Direct Download endpoint handles concurrency mutex, device verification & 24h re-downloads
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.userId,
          videoId: video.id,
          deviceId: "device-desktop-01"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Download authorization failed.");
      }

      // Fetch the actual video file as Blob
      const fileUrl = `${API_BASE.replace("/api", "")}${data.downloadUrl}`;
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        throw new Error("Failed to stream video bytes from server.");
      }

      const blob = await fileRes.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Downloaded video file is empty.");
      }

      // Trigger standard browser download prompt
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = video.fileName || `${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

      triggerNotice(
        data.isReDownload
          ? `⚡ Re-download complete! Free 24h allowance (No quota deducted). Remaining: ${data.remainingDailyQuota}`
          : `✅ Download complete! Remaining daily quota: ${data.remainingDailyQuota}`,
        "success"
      );

      await loadBackendData();
    } catch (err) {
      console.error("Download failure:", err);
      triggerNotice(`Download Failed: ${err.message}`, "error");

      // Report failure to server so failed attempt is logged and quota isn't consumed
      try {
        await fetch(`${API_BASE}/download/report-failure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.userId,
            videoId: video.id,
            reason: err.message
          })
        });
        await loadBackendData();
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRemoveDevice(deviceId) {
    try {
      const res = await fetch(`${API_BASE}/devices/${currentUser.userId}/${deviceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerNotice("Device removed successfully.", "info");
        await loadBackendData();
      }
    } catch (err) {
      triggerNotice("Failed to remove device: " + err.message, "error");
    }
  }

  function resetAllData() {
    localStorage.removeItem(COMMENTS_KEY);
    localStorage.removeItem(REPORTS_KEY);
    localStorage.removeItem(MODERATION_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(RATE_KEY);
    window.location.reload();
  }

  /* ======================================================
     MAIN RENDER JSX
  ====================================================== */

  return (
    <div className="app">
      {/* ---------------- STICKY HEADER ---------------- */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🌐</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1>Multilingual Comments & Video Platform</h1>
              <span className={`sub-status-pill ${subscription?.status || "ACTIVE"}`}>
                {subscription?.plan || "Free"} Member
              </span>
            </div>
            <p>Instant Translation · Controlled Downloads · Subscription Management (Razorpay & Atlas)</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Quick Theme Switcher with IST Mode Indicator */}
          <button
            className="theme-switch-header-btn"
            onClick={() => {
              const nextTheme = currentTheme === "light" ? "dark" : "light";
              setCurrentTheme(nextTheme);
              setThemeMode("manual");
              applyThemeToDOM(nextTheme);
              saveThemePreference({ mode: "manual", manualTheme: nextTheme });
              triggerNotice(`Switched to ${nextTheme.toUpperCase()} theme (Saved to Profile)`, "info");
            }}
            title={`Current Theme: ${currentTheme.toUpperCase()} (${themeMode === "auto" ? "Auto IST" : "Manual"}) - Click to toggle`}
          >
            {currentTheme === "light" ? "☀️ Light" : "🌙 Dark"}
            <span className="theme-header-mode-tag">{themeMode === "auto" ? "IST" : "Manual"}</span>
          </button>

          <button
            className={`nav-button ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            💬 Comments
          </button>

          <button
            className={`nav-button ${activeTab === "downloads" ? "active" : ""}`}
            onClick={() => setActiveTab("downloads")}
          >
            🎬 Video Catalog
          </button>

          <button
            className={`nav-button ${activeTab === "subscription" ? "active" : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            💎 Subscriptions
          </button>

          <button
            className={`nav-button ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🛡️ Account Security
          </button>

          <button
            className={`nav-button ${activeTab === "player" ? "active" : ""}`}
            onClick={() => setActiveTab("player")}
          >
            🎥 Video Player
          </button>

          <button
            className={`nav-button ${activeTab === "videocall" ? "active" : ""}`}
            onClick={() => setActiveTab("videocall")}
          >
            📹 Video Meet
          </button>

          <button
            className={`nav-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            📁 Downloads ({downloadHistory.length})
          </button>

          <button
            className={`admin-nav-button ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            🛡 Admin
            {reports.filter((r) => r.status === "pending").length > 0 && (
              <span className="badge">
                {reports.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>
      </header>


      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <main className="container">
        {/* Notice Alert Banner */}
        {notice && (
          <div className={`notice-toast ${notice.type}`}>
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)} style={{ color: "inherit", fontWeight: 700 }}>
              ✕
            </button>
          </div>
        )}

        {/* ======================================================
            TAB 1: COMMENTS STREAM (TASK 1)
        ====================================================== */}
        {activeTab === "comments" && (
          <>
            {/* User Profile & Language Preference Card */}
            <section className="card profile-card">
              <div className="profile-avatar-wrap">
                <img className="profile-avatar" src={currentUser.avatar} alt={currentUser.name} />
                <span className="online-indicator" title="Active Session" />
              </div>

              <div className="profile-info">
                <strong>
                  {currentUser.name} <span className="role-pill">{currentUser.role}</span>
                </strong>
                <p>
                  @{currentUser.username} · 📍 {currentUser.location}
                </p>
              </div>

              <div className="profile-controls">
                <div className="form-group">
                  <label>Simulate User</label>
                  <select
                    value={currentUser.userId}
                    onChange={(e) => {
                      const found = DEMO_USERS.find((u) => u.userId === e.target.value);
                      if (found) setCurrentUser(found);
                    }}
                  >
                    {DEMO_USERS.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Translate Preference</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Comment Composer */}
            <section className="card composer-box">
              {replyTarget && (
                <div className="replying-banner">
                  <span>
                    ↩ Replying to <strong>@{replyTarget.username}</strong>: "
                    {replyTarget.text.slice(0, 50)}..."
                  </span>
                  <button onClick={() => setReplyTarget(null)}>✕ Cancel Reply</button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleCommentChange}
                placeholder="Share your thoughts in any language... Type @ to mention someone"
                maxLength={1000}
              />

              {/* Mentions Auto-Suggestion Dropdown */}
              {mentionSuggestions.length > 0 && (
                <div className="mention-dropdown">
                  {mentionSuggestions.map((user) => (
                    <div
                      key={user.userId}
                      className="mention-item"
                      onClick={() => insertMention(user.username)}
                    >
                      <img className="mention-avatar" src={user.avatar} alt={user.username} />
                      <div>
                        <div className="mention-username">@{user.username}</div>
                        <div className="mention-tag">{user.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rate Limit Security CAPTCHA Challenge */}
              {captcha && (
                <div className="captcha-container">
                  <span className="captcha-badge">Security CAPTCHA</span>
                  <span className="captcha-math">What is {captcha.question} ?</span>
                  <input
                    type="number"
                    style={{ width: "90px" }}
                    placeholder="Result"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                  />
                  <button className="secondary-btn" onClick={generateCaptcha}>
                    🔄 New Question
                  </button>
                </div>
              )}

              <div className="composer-bottom">
                <div className="composer-meta">
                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center" }}>
                    <label style={{ margin: 0, textTransform: "none", fontSize: "13px" }}>
                      Language:
                    </label>
                    <select
                      value={commentLanguage}
                      onChange={(e) => setCommentLanguage(e.target.value)}
                      style={{ padding: "6px 10px", fontSize: "13px" }}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="char-counter">{commentText.length} / 1000</span>
                </div>

                <button className="primary-btn" onClick={submitComment}>
                  {replyTarget ? "Post Reply" : "Post Comment"}
                </button>
              </div>
            </section>

            {/* Comments Stream & Filter Header */}
            <section className="card">
              <div className="comments-header-bar">
                <div className="card-title-row" style={{ margin: 0 }}>
                  <h2>💬 Community Comments ({topLevelComments.length})</h2>
                </div>

                <div className="sort-controls">
                  <label>Sort by:</label>
                  <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <option value="newest">🕒 Newest First</option>
                    <option value="oldest">⏳ Oldest First</option>
                    <option value="liked">❤️ Most Liked</option>
                    <option value="relevant">🔥 Most Relevant</option>
                  </select>
                </div>
              </div>

              {sortedComments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No comments yet. Be the first to start the conversation!
                </div>
              ) : (
                <div className="comment-thread">
                  {sortedComments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      allComments={comments}
                      preferredLanguage={preferredLanguage}
                      currentUser={currentUser}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onReply={handleReply}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onReport={openReportModal}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ======================================================
            TAB 2: VIDEO DOWNLOAD MANAGEMENT SYSTEM (TASK 2)
        ====================================================== */}
        {activeTab === "downloads" && (
          <>
            {/* Subscription Quota Overview Card */}
            <section className="card">
              <div className="plan-dashboard-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2>⚡ Video Download Management Center</h2>
                    <span className={`plan-badge ${(subscription?.plan || "free").toLowerCase()}`}>
                      {subscription?.plan || "Free"} Tier
                    </span>
                  </div>
                  <p className="card-subtitle">
                    Controlled download permissions, quota auditing, and 24-hour duplicate allowance.
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Midnight Quota Reset:
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                    ⏱ {countdownString}
                  </div>
                </div>
              </div>

              {/* Quota Metric Progress Cards */}
              <div className="quota-stats-grid">
                <div className="quota-stat-card">
                  <div className="stat-label">Daily Downloads Remaining</div>
                  <div className="stat-value" style={{ color: subscription?.quota?.remainingDaily > 0 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    {subscription?.quota?.remainingDaily ?? 0}
                    <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>
                      {" "}
                      / {subscription?.quota?.dailyLimit ?? 1}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${subscription?.quota?.remainingDaily === 0 ? "danger" : ""}`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.quota?.usedDaily || 0) / (subscription?.quota?.dailyLimit || 1)) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="stat-subtext" style={{ marginTop: "6px" }}>
                    Used today: {subscription?.quota?.usedDaily || 0}
                  </div>
                </div>

                <div className="quota-stat-card">
                  <div className="stat-label">Monthly Downloads Remaining</div>
                  <div className="stat-value">
                    {subscription?.quota?.remainingMonthly ?? 0}
                    <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>
                      {" "}
                      / {subscription?.quota?.monthlyLimit ?? 10}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.quota?.usedMonthly || 0) / (subscription?.quota?.monthlyLimit || 10)) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="stat-subtext" style={{ marginTop: "6px" }}>
                    Used this month: {subscription?.quota?.usedMonthly || 0}
                  </div>
                </div>

                <div className="quota-stat-card">
                  <div className="stat-label">Registered Devices</div>
                  <div className="stat-value">
                    {userDevices.length}
                    <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>
                      {" "}
                      / {subscription?.quota?.maxDevices ?? 1}
                    </span>
                  </div>
                  <div className="stat-subtext" style={{ marginTop: "12px" }}>
                    Plan limit: {subscription?.quota?.maxDevices ?? 1} devices
                  </div>
                </div>

                <div className="quota-stat-card">
                  <div className="stat-label">Subscription Status</div>
                  <div
                    className="stat-value"
                    style={{
                      color: subscription?.active && !subscription?.isExpired ? "var(--accent-emerald)" : "var(--accent-rose)",
                      fontSize: "20px"
                    }}
                  >
                    {subscription?.active && !subscription?.isExpired ? "ACTIVE" : "EXPIRED"}
                  </div>
                  <div className="stat-subtext" style={{ marginTop: "12px" }}>
                    Expires: {formatDate(subscription?.expiryDate)}
                  </div>
                </div>
              </div>

              {/* Tier Switcher / Simulator for Easy Testing */}
              <div className="simulator-strip">
                <div className="simulator-info">
                  <span>🧪 <strong>Interactive Subscription Simulator:</strong></span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Switch tiers to test quota limits and expired states instantly:
                  </span>
                </div>

                <div className="simulator-buttons">
                  <button
                    className={`sim-btn ${subscription?.plan === "Free" && subscription?.active ? "active" : ""}`}
                    onClick={() => handleSwitchSubscription("Free", false)}
                  >
                    Free (1/day)
                  </button>
                  <button
                    className={`sim-btn ${subscription?.plan === "Bronze" && subscription?.active ? "active" : ""}`}
                    onClick={() => handleSwitchSubscription("Bronze", false)}
                  >
                    Bronze (3/day)
                  </button>
                  <button
                    className={`sim-btn ${subscription?.plan === "Silver" && subscription?.active ? "active" : ""}`}
                    onClick={() => handleSwitchSubscription("Silver", false)}
                  >
                    Silver (5/day)
                  </button>
                  <button
                    className={`sim-btn ${subscription?.plan === "Gold" && subscription?.active ? "active" : ""}`}
                    onClick={() => handleSwitchSubscription("Gold", false)}
                  >
                    Gold (10/day)
                  </button>
                  <button
                    className={`sim-btn expired-btn ${subscription?.isExpired ? "active" : ""}`}
                    onClick={() => handleSwitchSubscription("Gold", true)}
                  >
                    Simulate Expired
                  </button>
                </div>
              </div>
            </section>

            {/* Available Videos Catalog */}
            <section className="card">
              <div className="card-title-row">
                <div>
                  <h2>📹 Available Videos Catalog</h2>
                  <p className="card-subtitle">
                    Authorized video downloads with signed tokens, audit records, and 24h free re-download.
                  </p>
                </div>
              </div>

              <div className="videos-grid">
                {videos.map((video) => {
                  const isRecent = isRecentReDownload(video.id);
                  const isBusy = downloadingId === video.id;

                  return (
                    <div key={video.id} className="video-box">
                      <div className="video-thumb-container">
                        <img className="video-thumb" src={video.thumbnail} alt={video.title} />
                        <span className="video-duration">{video.duration || "15:00"}</span>
                        <span className="tier-req-pill">{video.tierRequired || "All Plans"}</span>
                      </div>

                      <div className="video-details">
                        <h3 className="video-title">{video.title}</h3>
                        <p className="video-desc">{video.description}</p>

                        <div className="video-meta-tags">
                          <span>📦 {video.fileSize}</span>
                          <span>•</span>
                          <span style={{ color: video.accessible ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                            {video.accessible ? "✓ Server Ready" : "✗ Restricted"}
                          </span>
                        </div>

                        {(() => {
                          const userRank = PLAN_RANKS[subscription?.plan] || 1;
                          const videoRank = PLAN_RANKS[video.tierRequired] || 1;
                          const isTierLocked = userRank < videoRank;

                          return (
                            <div className="video-card-actions">
                              {isTierLocked ? (
                                <button
                                  className="preview-btn"
                                  style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                                  onClick={() => setLockedVideo(video)}
                                >
                                  🔒 {video.tierRequired} Only
                                </button>
                              ) : (
                                <button
                                  className="preview-btn"
                                  onClick={() => {
                                    setActivePlayerVideo(video);
                                    setActiveTab("player");
                                    triggerNotice(`Opened "${video.title}" in Custom HTML5 Video Player`, "info");
                                  }}
                                >
                                  ▶ Watch
                                </button>
                              )}

                              <button
                                className={`download-trigger-btn ${isRecent ? "redownload" : ""}`}
                                disabled={
                                  isBusy ||
                                  !video.accessible ||
                                  !subscription?.active ||
                                  subscription?.isExpired
                                }
                                onClick={() => {
                                  if (isTierLocked) {
                                    setLockedVideo(video);
                                  } else {
                                    triggerDownload(video);
                                  }
                                }}
                              >
                                {isBusy
                                  ? "⏳ Downloading..."
                                  : isTierLocked
                                  ? `🔒 Requires ${video.tierRequired}`
                                  : isRecent
                                  ? "⚡ Re-download (Free)"
                                  : "⬇ Download Video"}
                              </button>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Registered Devices Management */}
            <section className="card">
              <div className="card-title-row">
                <div>
                  <h2>📱 Registered Devices ({userDevices.length} / {subscription?.quota?.maxDevices ?? 1})</h2>
                  <p className="card-subtitle">
                    Enforces registered device limits based on your subscription tier.
                  </p>
                </div>
              </div>

              <div className="devices-grid">
                {userDevices.map((dev) => (
                  <div key={dev.deviceId} className="device-card">
                    <div className="device-info">
                      <strong>💻 {dev.deviceName || dev.deviceId}</strong>
                      <span>Browser: {dev.browser || "Chrome"}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Registered: {formatDate(dev.registeredAt)}
                      </div>
                    </div>
                    {userDevices.length > 1 && (
                      <button
                        className="danger-btn"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        onClick={() => handleRemoveDevice(dev.deviceId)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ======================================================
            TAB 3: SUBSCRIPTION MANAGEMENT DASHBOARD (TASK 3)
        ====================================================== */}

        {activeTab === "subscription" && (
          <>
            {/* Active Subscription Status Hero Card */}
            <section className="sub-hero-card">
              <div className="sub-hero-left">
                <div className={`sub-tier-badge-large ${subscription?.plan || "Free"}`}>
                  {subscription?.plan === "Gold" ? "👑" : subscription?.plan === "Silver" ? "💎" : subscription?.plan === "Bronze" ? "🥉" : "📦"}
                </div>
                <div>
                  <div className="sub-hero-title">
                    {subscription?.planDetails?.name || `${subscription?.plan} Membership`}
                    <span className={`sub-status-pill ${subscription?.status || (subscription?.active && !subscription?.isExpired ? "ACTIVE" : "EXPIRED")}`}>
                      {subscription?.status || (subscription?.active && !subscription?.isExpired ? "ACTIVE" : "EXPIRED")}
                    </span>
                  </div>
                  <div className="sub-hero-subtitle">
                    Cycle: <strong>{(subscription?.billingCycle || "monthly").toUpperCase()}</strong> · Auto-Renewal:{" "}
                    <strong>{subscription?.autoRenew ? "ENABLED" : "DISABLED"}</strong> · Expires / Renews:{" "}
                    <strong>{formatDate(subscription?.expiryDate)}</strong>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>⏱️ Remaining Validity:</span>
                    <strong>{validityRemainingString}</strong>
                  </div>
                </div>
              </div>

              <div className="sub-hero-actions">
                {subscription?.plan !== "Free" && (
                  <button
                    className="primary-btn"
                    onClick={handleRenewSubscription}
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    🔄 Renew Plan
                  </button>
                )}
                {subscription?.autoRenew && subscription?.plan !== "Free" && (
                  <button
                    className="secondary-btn"
                    onClick={handleCancelAutoRenew}
                    style={{ color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}
                  >
                    ✕ Cancel Auto-Renew
                  </button>
                )}
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const elem = document.getElementById("plans-selection-anchor");
                    elem?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  ⚡ Change Plan
                </button>
              </div>
            </section>

            {/* Billing Cycle Switcher */}
            <div id="plans-selection-anchor" className="billing-switcher-container">
              <div className="billing-switcher">
                <button
                  className={`billing-switch-btn ${billingCycle === "monthly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly Billing
                </button>
                <button
                  className={`billing-switch-btn ${billingCycle === "quarterly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("quarterly")}
                >
                  Quarterly Billing <span className="discount-tag">Save 15%</span>
                </button>
                <button
                  className={`billing-switch-btn ${billingCycle === "yearly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Annual Billing <span className="discount-tag">Save 25%</span>
                </button>
              </div>
            </div>

            {/* Membership Plans Grid (Free, Bronze, Silver, Gold) */}
            <div className="plans-grid">
              {Object.keys(allPlans).length > 0 ? (
                Object.values(allPlans).map((plan) => {
                  const isCurrent = subscription?.plan === plan.id;
                  const price = plan.pricing?.[billingCycle] ?? 0;
                  const userRank = PLAN_RANKS[subscription?.plan || "Free"] || 1;
                  const planRank = PLAN_RANKS[plan.id] || 1;

                  return (
                    <div
                      key={plan.id}
                      className={`plan-card ${isCurrent ? "current-plan" : ""} ${plan.id === "Gold" ? "featured-gold" : ""}`}
                    >
                      {plan.id === "Gold" && !isCurrent && (
                        <div className="plan-ribbon">RECOMMENDED VIP</div>
                      )}
                      {isCurrent && (
                        <div className="current-ribbon">✓ CURRENT ACTIVE PLAN</div>
                      )}

                      <div className="plan-header">
                        <div className="plan-icon">
                          {plan.id === "Gold" ? "👑" : plan.id === "Silver" ? "💎" : plan.id === "Bronze" ? "🥉" : "📦"}
                        </div>
                        <div className="plan-name">{plan.name}</div>
                        <div className="plan-tagline">{plan.tagline}</div>
                      </div>

                      <div className="plan-price-wrap">
                        <div className="plan-price">
                          <span className="plan-currency">₹</span>
                          {price}
                          <span className="plan-period">
                            {price === 0 ? "free forever" : `/${billingCycle === "yearly" ? "year" : billingCycle === "quarterly" ? "quarter" : "month"}`}
                          </span>
                        </div>
                      </div>

                      <ul className="plan-features-list">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="plan-feature-item">
                            <span className="plan-feature-check">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div>
                        {isCurrent && subscription?.active && !subscription?.isExpired ? (
                          <button className="plan-cta-btn current" disabled>
                            ✓ Current Plan
                          </button>
                        ) : isCurrent && (subscription?.isExpired || !subscription?.active) ? (
                          <button
                            className="plan-cta-btn primary"
                            onClick={() => handleInitiatePayment(plan.id, billingCycle)}
                          >
                            🔄 Renew Membership
                          </button>
                        ) : planRank > userRank ? (
                          <button
                            className={`plan-cta-btn ${plan.id === "Gold" ? "gold" : "primary"}`}
                            onClick={() => handleInitiatePayment(plan.id, billingCycle)}
                          >
                            ⚡ Upgrade to {plan.id} →
                          </button>
                        ) : (
                          <button
                            className="plan-cta-btn downgrade"
                            onClick={() => handleDowngrade(plan.id)}
                          >
                            Downgrade to {plan.id}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: "span 4", textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  Loading membership catalog...
                </div>
              )}
            </div>

            {/* Feature Comparison Matrix Table */}
            <section className="card comparison-card">
              <div className="card-title-row">
                <div>
                  <h2>⚖ Comprehensive Feature Comparison Matrix</h2>
                  <p className="card-subtitle">
                    Progressively enhanced benefits across Free, Bronze, Silver, and Gold membership tiers.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th style={{ width: "28%" }}>Platform Capability</th>
                      <th style={{ width: "18%" }}>📦 Free Starter</th>
                      <th style={{ width: "18%" }}>🥉 Bronze Pro</th>
                      <th style={{ width: "18%" }}>💎 Silver Premier</th>
                      <th style={{ width: "18%" }}>👑 Gold Executive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Max Streaming Quality</td>
                      <td>Standard 720p</td>
                      <td className="spec-highlight">Full HD 1080p</td>
                      <td className="spec-highlight">Ultra HD 2K</td>
                      <td className="spec-highlight" style={{ color: "#f59e0b" }}>4K HDR Cinematic</td>
                    </tr>
                    <tr>
                      <td>Daily Watch Time Allowance</td>
                      <td>15 Minutes / Day</td>
                      <td>60 Minutes / Day</td>
                      <td className="spec-check">Unlimited</td>
                      <td className="spec-check">Unlimited VIP</td>
                    </tr>
                    <tr>
                      <td>Daily Video Downloads</td>
                      <td>1 Video / day</td>
                      <td>3 Videos / day</td>
                      <td>5 Videos / day</td>
                      <td className="spec-highlight" style={{ color: "#f59e0b" }}>10 Videos / day</td>
                    </tr>
                    <tr>
                      <td>Monthly Download Quota</td>
                      <td>10 Videos</td>
                      <td>50 Videos</td>
                      <td>100 Videos</td>
                      <td className="spec-highlight" style={{ color: "#f59e0b" }}>200 Videos</td>
                    </tr>
                    <tr>
                      <td>Max Registered Devices</td>
                      <td>1 Device</td>
                      <td>2 Devices</td>
                      <td>3 Devices</td>
                      <td className="spec-highlight" style={{ color: "#f59e0b" }}>5 Devices</td>
                    </tr>
                    <tr>
                      <td>100% Ad-Free Viewing</td>
                      <td className="spec-cross">— (Ad Supported)</td>
                      <td className="spec-check">✓ Yes</td>
                      <td className="spec-check">✓ Yes</td>
                      <td className="spec-check">✓ Yes</td>
                    </tr>
                    <tr>
                      <td>Exclusive Masterclasses</td>
                      <td className="spec-cross">—</td>
                      <td className="spec-cross">—</td>
                      <td>Early Access</td>
                      <td className="spec-check">✓ Full VIP Access</td>
                    </tr>
                    <tr>
                      <td>Streaming Speed & CDN</td>
                      <td>Standard (1x)</td>
                      <td>Fast Bandwidth (2x)</td>
                      <td>Ultra Bandwidth (3x)</td>
                      <td className="spec-highlight" style={{ color: "#f59e0b" }}>Dedicated CDN (5x)</td>
                    </tr>
                    <tr>
                      <td>24/7 VIP Concierge Support</td>
                      <td>Community Forum</td>
                      <td>Standard Email</td>
                      <td>Priority Queue</td>
                      <td className="spec-check">✓ 24/7 Dedicated VIP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Billing & Transaction History Table */}
            <section className="card" style={{ marginTop: "24px" }}>
              <div className="card-title-row">
                <div>
                  <h2>💳 Billing History & Official Tax Invoices ({billingHistory.length})</h2>
                  <p className="card-subtitle">
                    Complete transaction logs, payment verification receipts, and invoice records stored in MongoDB Atlas.
                  </p>
                </div>
                <button className="secondary-btn" onClick={loadBackendData}>
                  🔄 Refresh Records
                </button>
              </div>

              {billingHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                  No billing transactions recorded yet for @{currentUser.username}. Upgrade your plan to generate an invoice.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="billing-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date & Time</th>
                        <th>Plan Details</th>
                        <th>Amount</th>
                        <th>Payment ID</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((tx) => (
                        <tr key={tx.invoiceNumber || tx.paymentId}>
                          <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{tx.invoiceNumber}</td>
                          <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{formatDate(tx.paymentDate)}</td>
                          <td>
                            <strong>{tx.plan} Plan</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px" }}>
                              ({tx.billingCycle})
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: tx.paymentStatus === "SUCCESS" ? "#10b981" : "#f8fafc" }}>
                            ₹{tx.amount} {tx.currency || "INR"}
                          </td>
                          <td style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                            {tx.paymentId}
                          </td>
                          <td>
                            <span className={`sub-status-pill ${tx.paymentStatus}`}>
                              {tx.paymentStatus}
                            </span>
                          </td>
                          <td>
                            {tx.paymentStatus === "SUCCESS" && (
                              <button
                                className="secondary-btn"
                                style={{ padding: "4px 10px", fontSize: "11px" }}
                                onClick={() => {
                                  setActiveInvoice(tx);
                                  setActiveModal("invoice");
                                }}
                              >
                                📄 View Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* ======================================================
            TAB 4: USER PROFILE & DOWNLOADS AUDITING SECTION
        ====================================================== */}

        {activeTab === "profile" && (
          <section className="card">
            <div className="card-title-row">
              <div>
                <h2>📁 My Download Records & Auditing</h2>
                <p className="card-subtitle">
                  Complete download history, audit records (IP, browser, device, plan), and status tracking.
                </p>
              </div>

              <button className="secondary-btn" onClick={loadBackendData}>
                🔄 Refresh History
              </button>
            </div>

            {downloadHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No video download history found for @{currentUser.username}.
              </div>
            ) : (
              <div className="downloads-list">
                {downloadHistory.map((item) => {
                  const vidObj = videos.find((v) => v.id === item.videoId);
                  const isSuccess = item.status === "SUCCESS";

                  return (
                    <div key={item.id} className="download-history-row">
                      <img
                        className="history-thumb"
                        src={vidObj?.thumbnail || "https://picsum.photos/seed/video/100/60"}
                        alt={item.videoTitle}
                      />

                      <div className="history-info">
                        <strong>{item.videoTitle}</strong>
                        <div className="history-meta-sub">
                          <span>📅 {formatDate(item.downloadTimestamp)}</span>
                          <span>•</span>
                          <span>📦 {item.fileSize}</span>
                          <span>•</span>
                          <span>🏷 {item.subscriptionPlan} Tier</span>
                          {item.isReDownload && (
                            <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                              ⚡ 24h Free Re-download
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="history-audit-tags">
                        <span className={`status-badge ${isSuccess ? "success" : "failed"}`}>
                          {item.status}
                        </span>
                        <span>IP: {item.ipAddress}</span>
                        <span>Device: {item.device}</span>
                        <span>Browser: {item.browser}</span>
                      </div>

                      <div>
                        {vidObj && isSuccess && (
                          <button
                            className="secondary-btn"
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                            onClick={() => triggerDownload(vidObj)}
                          >
                            ⬇ Download Again
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ======================================================
            TAB 4: ADMINISTRATOR MODERATION CENTER
        ====================================================== */}
        {activeTab === "admin" && (
          <section className="card">
            <div className="card-title-row">
              <div>
                <h2>🛡 Administrator Review & Moderation Center</h2>
                <p className="card-subtitle">
                  Community reports, flagged comments, complete audit logs, and moderation records.
                </p>
              </div>

              <button className="danger-btn" onClick={resetAllData}>
                ⚠️ Reset All Demo Storage
              </button>
            </div>

            {/* Pending Reports Section */}
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "20px 0 12px", color: "var(--accent-rose)" }}>
              Pending Inappropriate Comment Reports ({reports.filter((r) => r.status === "pending").length})
            </h3>

            {reports.filter((r) => r.status === "pending").length === 0 ? (
              <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", color: "#6ee7b7", marginBottom: "24px" }}>
                ✓ Clean community status! There are no pending reports requiring administrative action.
              </div>
            ) : (
              <div className="admin-reports-grid">
                {reports
                  .filter((r) => r.status === "pending")
                  .map((report) => {
                    const target = comments.find((c) => c.id === report.commentId);

                    return (
                      <div key={report.id} className="report-item-card">
                        <div style={{ flex: 1 }}>
                          <span className="report-reason-badge">
                            Reason: {report.reason.toUpperCase()}
                          </span>

                          <div className="reported-text">
                            "{target ? target.text : "[Comment not found or deleted]"}"
                          </div>

                          <div className="report-meta">
                            Reported by <strong>@{report.reporter}</strong> · {formatDate(report.createdAt)}
                            {report.note && <span> · Note: {report.note}</span>}
                          </div>
                        </div>

                        <div className="report-actions">
                          <button
                            className="secondary-btn"
                            onClick={() => resolveAdminReport(report, "DISMISSED")}
                          >
                            ✓ Keep Comment
                          </button>
                          <button
                            className="danger-btn"
                            onClick={() => resolveAdminReport(report, "REMOVED")}
                          >
                            ✕ Remove Comment
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Moderation Actions History */}
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "28px 0 12px", color: "#ffffff" }}>
              Moderation Audit Trail ({moderationRecords.length})
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Reason / Details</th>
                    <th>Admin / Operator</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationRecords.slice(0, 15).map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 600, color: "var(--accent-primary)" }}>{rec.action}</td>
                      <td>{rec.reason || "Automatic log"}</td>
                      <td>{rec.admin}</td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(rec.timestamp)}</td>
                    </tr>
                  ))}
                  {moderationRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No moderation records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Comment Versioning & Edits Audit Trail */}
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "28px 0 12px", color: "#ffffff" }}>
              Complete Comment History & Versioning Trail ({commentHistory.length})
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Content / Snapshot</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {commentHistory.slice(0, 15).map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600, color: h.action === "DELETED" ? "var(--accent-rose)" : "#a5b4fc" }}>
                        {h.action}
                      </td>
                      <td>@{h.username}</td>
                      <td style={{ maxWidth: "450px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.text || h.previousText || "—"}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(h.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ======================================================
            TAB 4: ACCOUNT SECURITY & PERSONALIZED EXPERIENCE (TASK 4)
        ====================================================== */}
        {activeTab === "security" && (
          <AccountSecurity
            currentUser={currentUser}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            onNotify={triggerNotice}
          />
        )}

        {/* ======================================================
            TAB 5: CUSTOM HTML5 VIDEO PLAYER STUDIO (TASK 5)
        ====================================================== */}
        {activeTab === "player" && (
          <div className="player-tab-studio">
            <section className="card" style={{ marginBottom: "20px" }}>
              <div className="card-title-row">
                <div>
                  <h2>🎥 Professional Custom HTML5 Video Player</h2>
                  <p className="card-subtitle">
                    Fully customized viewer without browser default controls. Draggable volume slider, 0.5x–2x playback speed, subtitles in 4 languages, hover timeline previews, watch position memory, and keyboard shortcuts.
                  </p>
                </div>
              </div>

              {/* Video Quick Switcher Strip */}
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px", marginTop: "10px" }}>
                {videos.map((v) => {
                  const isActive = (activePlayerVideo?.id || videos[0]?.id) === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActivePlayerVideo(v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.1)"}`,
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span>{isActive ? "▶" : "📹"}</span>
                      <span>{v.title}</span>
                      <span style={{ fontSize: "10px", opacity: 0.8 }}>({v.tierRequired})</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Custom Video Player Component */}
            <CustomVideoPlayer
              video={activePlayerVideo || videos[0] || { id: "video-1", title: "Introduction to Artificial Intelligence", fileName: "video1.mp4", tierRequired: "Free" }}
              allVideos={videos}
              currentUser={currentUser}
              subscription={subscription}
              onSelectNextVideo={() => {
                const curIdx = videos.findIndex((v) => v.id === (activePlayerVideo?.id || videos[0]?.id));
                const nextIdx = (curIdx + 1) % (videos.length || 1);
                if (videos[nextIdx]) {
                  setActivePlayerVideo(videos[nextIdx]);
                  triggerNotice(`Autoplayed next module: "${videos[nextIdx].title}"`, "info");
                }
              }}
              onNotify={triggerNotice}
            />

            {/* Current Video Details Card */}
            <section className="card" style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                    {(activePlayerVideo || videos[0])?.title || "Video Course"}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {(activePlayerVideo || videos[0])?.description || "In-depth engineering curriculum."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span className="tier-req-pill">{(activePlayerVideo || videos[0])?.tierRequired || "All"} Tier</span>
                  <span style={{ fontSize: "12px", color: "var(--accent-cyan)", padding: "4px 8px", background: "rgba(6, 182, 212, 0.1)", borderRadius: "4px" }}>
                    📦 {(activePlayerVideo || videos[0])?.fileSize || "125 KB"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================
            TAB 6: REAL-TIME VIDEO CALLING (TASK 6)
        ====================================================== */}
        {activeTab === "videocall" && (
          <VideoCalling
            currentUser={currentUser}
            onNotify={triggerNotice}
          />
        )}
      </main>

      {/* ======================================================
          MODAL: REPORT INAPPROPRIATE COMMENT
      ====================================================== */}
      {reportCommentId && (
        <div className="modal-overlay" onClick={() => setReportCommentId(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚩 Report Inappropriate Comment</h3>
              <button className="close-btn" onClick={() => setReportCommentId(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: "14px" }}>
                Help keep our community safe and respectful. Select the primary reason for reporting this comment:
              </p>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Reason for report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="spam">Spam or excessive flooding</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="offensive content">Offensive or abusive language</option>
                  <option value="malicious link">Suspicious or malicious link</option>
                  <option value="misinformation">Misinformation / False info</option>
                  <option value="copyright violation">Copyright / Intellectual property</option>
                  <option value="other">Other violation</option>
                </select>
              </div>

              <div className="form-group">
                <label>Additional details (optional)</label>
                <input
                  type="text"
                  placeholder="Provide context for our review team..."
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setReportCommentId(null)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={submitReport}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: VIDEO IN-BROWSER PREVIEW PLAYER
      ====================================================== */}
      {/* ======================================================
          MODAL: VIDEO IN-BROWSER PREVIEW PLAYER (WITH QUALITY & AD GATE)
      ====================================================== */}
      {previewVideo && (
        <div className="modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="modal-dialog" style={{ width: "min(720px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3>▶ {previewVideo.title}</h3>
                <span className="tier-req-pill">{previewVideo.tierRequired} Tier</span>
              </div>
              <button className="close-btn" onClick={() => setPreviewVideo(null)}>✕</button>
            </div>

            <div className="modal-body">
              <video
                className="video-preview-player"
                controls
                autoPlay
                src={`/videos/${previewVideo.fileName}`}
              >
                Your browser does not support HTML5 video preview.
              </video>

              {/* Streaming Quality Selector & Gate */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Streaming Quality:</label>
                  <select
                    className="video-quality-selector"
                    value={streamingQuality}
                    onChange={(e) => {
                      const q = e.target.value;
                      const userPlan = subscription?.plan || "Free";
                      if (q === "4K HDR" && userPlan !== "Gold") {
                        triggerNotice("🔒 4K HDR requires Gold tier. Upgrading recommended for ultra fidelity.", "error");
                        return;
                      }
                      if (q === "2K" && userPlan !== "Gold" && userPlan !== "Silver") {
                        triggerNotice("🔒 2K QHD requires Silver or Gold tier.", "error");
                        return;
                      }
                      if (q === "1080p" && userPlan === "Free") {
                        triggerNotice("🔒 1080p Full HD requires Bronze or higher tier.", "error");
                        return;
                      }
                      setStreamingQuality(q);
                      triggerNotice(`Quality set to ${q}.`, "success");
                    }}
                  >
                    <option value="480p">480p (Data Saver)</option>
                    <option value="720p">720p (Standard - Free Tier)</option>
                    <option value="1080p">1080p Full HD (Bronze+)</option>
                    <option value="2K">2K Ultra HD (Silver+)</option>
                    <option value="4K HDR">4K HDR Cinematic (Gold VIP)</option>
                  </select>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Speed: <strong>{subscription?.planDetails?.speedTier || "Standard 1x"}</strong>
                </div>
              </div>

              {/* Free Tier Watch Time Allowance Meter */}
              {subscription?.plan === "Free" && (
                <div style={{ marginTop: "12px", padding: "12px", background: "rgba(15, 23, 42, 0.7)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span>⏱️ Daily Free Watch Allowance</span>
                    <strong>4m used / 15m limit</strong>
                  </div>
                  <div className="watch-limit-bar-wrap">
                    <div className="watch-limit-bar-fill" style={{ width: "26%" }} />
                  </div>
                </div>
              )}

              {/* Ad Banner for Free tier / Ad-free badge for paid */}
              {subscription?.plan === "Free" ? (
                <div className="ad-banner-strip">
                  <span>📢 <strong>Sponsored by CloudVibe:</strong> Get 100% Ad-Free viewing & unlimited streaming with Bronze, Silver, or Gold!</span>
                  <button
                    className="primary-btn"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                    onClick={() => {
                      setPreviewVideo(null);
                      setActiveTab("subscription");
                    }}
                  >
                    Go Ad-Free
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>✓ 100% Ad-Free VIP Viewing Active</span>
                </div>
              )}

              <p style={{ marginTop: "12px", fontSize: "13px", color: "#cbd5e1" }}>
                {previewVideo.description}
              </p>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setPreviewVideo(null)}>
                Close Preview
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setPreviewVideo(null);
                  triggerDownload(previewVideo);
                }}
              >
                ⬇ Download File ({previewVideo.fileSize})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: TIER-LOCKED CONTENT UPGRADE PROMPT
      ====================================================== */}
      {lockedVideo && (
        <div className="modal-overlay" onClick={() => setLockedVideo(null)}>
          <div className="modal-dialog" style={{ width: "min(500px, 94%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "#f59e0b" }}>🔒 Premium Content Locked</h3>
              <button className="close-btn" onClick={() => setLockedVideo(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: "center", padding: "20px" }}>
              <img
                src={lockedVideo.thumbnail}
                alt={lockedVideo.title}
                style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: "16px" }}
              />
              <h4 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{lockedVideo.title}</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                This exclusive video requires an active <strong>{lockedVideo.tierRequired}</strong> membership plan. Your current plan is <strong>{subscription?.plan || "Free"}</strong>.
              </p>

              <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "12px", color: "#c7d2fe", textAlign: "left" }}>
                <strong>Unlocking {lockedVideo.tierRequired} tier includes:</strong>
                <ul style={{ paddingLeft: "20px", marginTop: "6px" }}>
                  <li>Instant playback of this video & full course catalog</li>
                  <li>Higher streaming resolution & faster CDN speed</li>
                  <li>Higher daily & monthly download limits</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setLockedVideo(null)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
                onClick={() => {
                  setLockedVideo(null);
                  setActiveTab("subscription");
                }}
              >
                💎 View Plans & Upgrade →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: RAZORPAY TEST PAYMENT GATEWAY
      ====================================================== */}
      {activeModal === "razorpay" && selectedOrder && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="rzp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rzp-header">
              <div className="rzp-brand-badge">
                <span style={{ fontSize: "20px" }}>💳</span>
                <div>
                  <strong style={{ fontSize: "14px", display: "block" }}>Razorpay Payment Gateway</strong>
                  <span style={{ fontSize: "11px", color: "#93c5fd" }}>Test Environment · 256-Bit SSL Encrypted</span>
                </div>
              </div>
              <span className="rzp-badge-pill">TEST MODE</span>
            </div>

            <div className="rzp-body">
              <div className="rzp-summary-box">
                <div className="rzp-summary-row">
                  <span>Selected Membership:</span>
                  <strong>{selectedOrder.plan} Plan</strong>
                </div>
                <div className="rzp-summary-row">
                  <span>Billing Cycle:</span>
                  <strong>{selectedOrder.billingCycle?.toUpperCase()}</strong>
                </div>
                <div className="rzp-summary-row">
                  <span>Customer Name:</span>
                  <span>{currentUser.name}</span>
                </div>
                <div className="rzp-summary-row">
                  <span>Customer Email:</span>
                  <span>{currentUser.userEmail || `${currentUser.username.toLowerCase()}@example.com`}</span>
                </div>
                <div className="rzp-summary-row">
                  <span>Order Reference:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{selectedOrder.orderId}</span>
                </div>
                <div className="rzp-summary-row total">
                  <span>Total Amount Payable:</span>
                  <span style={{ color: "#34d399" }}>₹{selectedOrder.amount} INR</span>
                </div>
              </div>

              {/* Interactive Gateway Simulation Controls */}
              <div className="rzp-simulator-section">
                <div className="rzp-sim-title">
                  <span>⚡ Razorpay Interactive Gateway Simulation:</span>
                </div>

                <div className="rzp-actions-stack">
                  <button className="rzp-btn-success" onClick={handleTestPaymentSuccess}>
                    ✅ Simulate Successful Payment (Authorize & Activate)
                  </button>

                  <button className="rzp-btn-fail" onClick={() => handleTestPaymentFailure("Card transaction declined by issuer")}>
                    ❌ Simulate Payment Failure (Card Declined / Error)
                  </button>

                  <button className="rzp-btn-fail" style={{ borderColor: "rgba(245, 158, 11, 0.4)", color: "#fde68a" }} onClick={handleSimulateNetworkDrop}>
                    ⚠️ Simulate Network Interruption (Retry & Recovery)
                  </button>

                  <button className="rzp-btn-cancel" onClick={handleTestPaymentCancel}>
                    🚫 Simulate User Cancellation (Dismiss Window)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL: OFFICIAL TAX INVOICE & EMAIL CONFIRMATION PREVIEW
      ====================================================== */}
      {activeModal === "invoice" && activeInvoice && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="invoice-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-tab-header">
              <button
                className={`invoice-tab-btn ${invoiceTab === "invoice" ? "active" : ""}`}
                onClick={() => setInvoiceTab("invoice")}
              >
                📄 Official Tax Invoice & Receipt
              </button>
              <button
                className={`invoice-tab-btn ${invoiceTab === "email" ? "active" : ""}`}
                onClick={() => setInvoiceTab("email")}
              >
                📧 Confirmation Email Preview
              </button>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: "16px" }}>
                <button className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {invoiceTab === "invoice" ? (
                <div>
                  {/* Tax Invoice Document */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800 }}>TAX INVOICE & RECEIPT</h2>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Invoice No: <strong>{activeInvoice.invoiceNumber}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Date: <strong>{formatDate(activeInvoice.paymentDate || activeInvoice.sentAt || Date.now())}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
                      <strong style={{ color: "#ffffff", fontSize: "13px" }}>Multilingual Streaming Pvt Ltd</strong><br />
                      GSTIN: 33AAACC1234F1Z5<br />
                      Chennai, Tamil Nadu, India
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px", fontSize: "13px" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px" }}>
                      <strong style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>BILLED TO</strong>
                      <div style={{ fontWeight: 700, marginTop: "4px" }}>{activeInvoice.recipientName || activeInvoice.username || currentUser.name}</div>
                      <div style={{ color: "var(--text-muted)" }}>{activeInvoice.recipientEmail || activeInvoice.userEmail || currentUser.userEmail || "subscriber@example.com"}</div>
                      <div style={{ color: "var(--text-muted)" }}>Location: Chennai, India</div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px" }}>
                      <strong style={{ color: "var(--text-secondary)", fontSize: "11px", textTransform: "uppercase" }}>PAYMENT SUMMARY</strong>
                      <div style={{ marginTop: "4px" }}>Gateway: <strong>Razorpay Test Network</strong></div>
                      <div>Payment ID: <code style={{ fontSize: "11px" }}>{activeInvoice.paymentId}</code></div>
                      <div>Status: <span style={{ color: "#34d399", fontWeight: 700 }}>PAID / VERIFIED</span></div>
                    </div>
                  </div>

                  <table className="comparison-table" style={{ textAlign: "left", marginBottom: "20px" }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Billing Cycle</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{activeInvoice.planName || activeInvoice.plan} Membership</strong><br />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Full access to video catalog, high-speed streaming, offline downloads</span>
                        </td>
                        <td>{(activeInvoice.billingCycle || "monthly").toUpperCase()}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>₹{activeInvoice.amount} INR</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ textAlign: "right", color: "var(--text-muted)" }}>Includes GST (18% inclusive):</td>
                        <td style={{ textAlign: "right", color: "var(--text-muted)" }}>₹{Math.round(Number(activeInvoice.amount) * 0.18)} INR</td>
                      </tr>
                      <tr style={{ fontSize: "16px", fontWeight: 800 }}>
                        <td colSpan={2} style={{ textAlign: "right", color: "#ffffff" }}>Total Amount Paid:</td>
                        <td style={{ textAlign: "right", color: "#34d399" }}>₹{activeInvoice.amount} INR</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ background: "rgba(99, 102, 241, 0.1)", borderLeft: "4px solid var(--accent-primary)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#c7d2fe", marginBottom: "20px" }}>
                    <strong>Subscriber Support & Contact:</strong><br />
                    For billing support or plan changes, contact <strong>support@multilingualstream.com</strong> or call <strong>+91 44 2800 5000</strong>.
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button className="secondary-btn" onClick={() => setActiveModal(null)}>
                      Close
                    </button>
                    <button className="primary-btn" onClick={() => window.print()}>
                      🖨 Print / Download Invoice
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation Email Preview Tab */
                <div>
                  <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "16px", fontSize: "12px" }}>
                    <div><strong>To:</strong> {activeInvoice.recipientEmail || currentUser.userEmail || "harini@example.com"}</div>
                    <div><strong>From:</strong> confirmations@multilingualstream.com</div>
                    <div><strong>Subject:</strong> {activeInvoice.subject || `[Receipt & Confirmation] Your ${activeInvoice.plan || activeInvoice.planName} Subscription is Active!`}</div>
                  </div>

                  {activeInvoice.html ? (
                    <div
                      style={{ background: "#0f172a", borderRadius: "8px", overflow: "hidden" }}
                      dangerouslySetInnerHTML={{ __html: activeInvoice.html }}
                    />
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Email receipt dispatched. Full copy rendered above in Tax Invoice tab.
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <button className="secondary-btn" onClick={() => setActiveModal(null)}>
                      Close Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}