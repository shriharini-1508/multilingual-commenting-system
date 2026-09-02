import React, { useEffect, useMemo, useState } from "react";

const COMMENTS_KEY = "multilingual_comments";
const REPORTS_KEY = "comment_reports";
const MODERATION_KEY = "moderation_records";
const RATE_KEY = "comment_rate";

const EDIT_DELETE_LIMIT = 5 * 60 * 1000;
const RATE_LIMIT = 3;
const RATE_WINDOW = 30 * 1000;

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ta", name: "Tamil" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }
];

const CURRENT_USER = {
  username: "Harini",
  location: "Chennai, India",
  avatar: "https://i.pravatar.cc/100?img=32"
};

const PROFANITY_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "idiot",
  "stupid",
  "bastard"
];

const BLOCKED_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "grabify",
  "iplogger",
  "discord.gg"
];

const DEMO_COMMENTS = [
  {
    id: "comment-1",
    username: "Arun",
    location: "Chennai, India",
    avatar: "https://i.pravatar.cc/100?img=12",
    text: "This platform is very useful and easy to understand.",
    language: "en",
    createdAt: Date.now() - 60 * 60 * 1000,
    updatedAt: Date.now() - 60 * 60 * 1000,
    edited: false,
    likes: 12,
    dislikes: 1,
    likedBy: [],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    version: 1
  },
  {
    id: "comment-2",
    username: "Priya",
    location: "Coimbatore, India",
    avatar: "https://i.pravatar.cc/100?img=47",
    text: "இந்த பதிவு மிகவும் நன்றாக உள்ளது.",
    language: "ta",
    createdAt: Date.now() - 40 * 60 * 1000,
    updatedAt: Date.now() - 40 * 60 * 1000,
    edited: false,
    likes: 9,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    parentId: null,
    deleted: false,
    version: 1
  },
  {
    id: "comment-3",
    username: "Rahul",
    location: "Bengaluru, India",
    avatar: "https://i.pravatar.cc/100?img=33",
    text: "Please reply if you have more information.",
    language: "en",
    createdAt: Date.now() - 20 * 60 * 1000,
    updatedAt: Date.now() - 20 * 60 * 1000,
    edited: false,
    likes: 5,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    parentId: "comment-1",
    deleted: false,
    version: 1
  }
];

function readStorage(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return defaultValue;
    }

    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}

function getLanguageName(code) {
  const language = LANGUAGES.find((item) => item.code === code);

  return language ? language.name : code;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsProfanity(text) {
  const lowerText = text.toLowerCase();

  return PROFANITY_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(lowerText);
  });
}

function containsMaliciousLink(text) {
  const lowerText = text.toLowerCase();

  return BLOCKED_DOMAINS.some((domain) =>
    lowerText.includes(domain)
  );
}

function containsAnyLink(text) {
  return /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|in|io|xyz|co)(\/|$))/i.test(
    text
  );
}

function hasExcessiveSpecialCharacters(text) {
  const withoutSpaces = text.replace(/\s/g, "");

  if (!withoutSpaces) {
    return false;
  }

  const specialCharacters =
    withoutSpaces.match(/[^\p{L}\p{N}]/gu) || [];

  const emojis =
    withoutSpaces.match(/[\p{Extended_Pictographic}]/gu) || [];

  return (
    specialCharacters.length / withoutSpaces.length > 0.65 ||
    emojis.length >= 8
  );
}

function isSpam(text) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  if (words.length >= 5) {
    const uniqueWords = new Set(words);

    if (uniqueWords.size <= 2) {
      return true;
    }
  }

  if (/(.)\1{7,}/u.test(text)) {
    return true;
  }

  return false;
}

function isDuplicateComment(text, comments, username, ignoreId = null) {
  const normalized = normalizeText(text);

  return comments.some(
    (comment) =>
      comment.id !== ignoreId &&
      !comment.deleted &&
      comment.username === username &&
      normalizeText(comment.text) === normalized
  );
}

function getRateData() {
  const now = Date.now();

  const data = readStorage(RATE_KEY, {
    attempts: []
  });

  const validAttempts = data.attempts.filter(
    (time) => now - time < RATE_WINDOW
  );

  return {
    attempts: validAttempts
  };
}

function addRateAttempt() {
  const data = getRateData();

  data.attempts.push(Date.now());

  saveStorage(RATE_KEY, data);

  return data;
}

/* Common built-in translations */
const LOCAL_TRANSLATIONS = {
  "en-ta": {
    "This platform is very useful and easy to understand.":
      "இந்த தளம் மிகவும் பயனுள்ளதாகவும் புரிந்துகொள்ள எளிதாகவும் உள்ளது.",

    "Please reply if you have more information.":
      "உங்களிடம் கூடுதல் தகவல் இருந்தால் பதிலளிக்கவும்."
  },

  "ta-en": {
    "இந்த பதிவு மிகவும் நன்றாக உள்ளது.":
      "This post is very good."
  },

  "en-hi": {
    "This platform is very useful and easy to understand.":
      "यह प्लेटफ़ॉर्म बहुत उपयोगी और समझने में आसान है।"
  },

  "en-es": {
    "This platform is very useful and easy to understand.":
      "Esta plataforma es muy útil y fácil de entender."
  },

  "en-fr": {
    "This platform is very useful and easy to understand.":
      "Cette plateforme est très utile et facile à comprendre."
  }
};

async function translateComment(text, from, to) {
  if (from === to) {
    return text;
  }

  const localTranslation =
    LOCAL_TRANSLATIONS[`${from}-${to}`]?.[text];

  if (localTranslation) {
    return localTranslation;
  }

  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${encodeURIComponent(from)}%7C${encodeURIComponent(to)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Translation failed");
  }

  const data = await response.json();

  const translated =
    data?.responseData?.translatedText;

  if (!translated) {
    throw new Error("Translation unavailable");
  }

  return translated;
}

/* ------------------------------------------------------ */
/* COMMENT COMPONENT */
/* ------------------------------------------------------ */

function CommentItem({
  comment,
  comments,
  preferredLanguage,
  currentUser,
  onLike,
  onDislike,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onTranslate
}) {
  const [showReplies, setShowReplies] = useState(true);

  const [translatedText, setTranslatedText] =
    useState(null);

  const [translating, setTranslating] =
    useState(false);

  const [translationError, setTranslationError] =
    useState("");

  const replies = comments.filter(
    (item) =>
      item.parentId === comment.id &&
      !item.deleted
  );

  const canEditDelete =
    comment.username === currentUser.username &&
    Date.now() - comment.createdAt <=
      EDIT_DELETE_LIMIT;

  async function handleTranslate() {
    if (translatedText) {
      setTranslatedText(null);
      return;
    }

    setTranslating(true);
    setTranslationError("");

    try {
      const result = await onTranslate(
        comment.text,
        comment.language,
        preferredLanguage
      );

      setTranslatedText(result);
    } catch {
      setTranslationError(
        "Translation failed. Original comment is displayed."
      );
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div
      className={`comment ${
        comment.parentId ? "reply" : ""
      }`}
    >
      <img
        className="avatar"
        src={comment.avatar}
        alt={comment.username}
      />

      <div className="comment-content">
        <div className="comment-header">
          <div>
            <strong>
              @{comment.username}
            </strong>

            <span className="location">
              📍 {comment.location}
            </span>
          </div>

          <span className="date">
            {formatDate(comment.updatedAt)}
          </span>
        </div>

        <div className="comment-text">
          {translatedText || comment.text}

          {comment.edited && (
            <span className="edited">
              {" "}
              · Edited
            </span>
          )}
        </div>

        {translationError && (
          <div className="translation-error">
            {translationError}
          </div>
        )}

        <div className="comment-actions">
          <button
            onClick={() => onLike(comment.id)}
          >
            👍 {comment.likes}
          </button>

          <button
            onClick={() => onDislike(comment.id)}
          >
            👎 {comment.dislikes}
          </button>

          <button
            onClick={() => onReply(comment)}
          >
            ↩ Reply
          </button>

          <button
            onClick={handleTranslate}
            disabled={translating}
          >
            {translating
              ? "Translating..."
              : translatedText
              ? "Show Original"
              : `Translate to ${getLanguageName(
                  preferredLanguage
                )}`}
          </button>

          {canEditDelete && (
            <button
              onClick={() => onEdit(comment)}
            >
              ✏ Edit
            </button>
          )}

          {canEditDelete && (
            <button
              className="delete-button"
              onClick={() =>
                onDelete(comment.id)
              }
            >
              🗑 Delete
            </button>
          )}

          <button
            onClick={() => onReport(comment.id)}
          >
            🚩 Report
          </button>
        </div>

        {replies.length > 0 && (
          <button
            className="reply-toggle"
            onClick={() =>
              setShowReplies((value) => !value)
            }
          >
            {showReplies ? "Hide" : "Show"}{" "}
            {replies.length}{" "}
            {replies.length === 1
              ? "reply"
              : "replies"}
          </button>
        )}

        {showReplies &&
          replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              comments={comments}
              preferredLanguage={
                preferredLanguage
              }
              currentUser={currentUser}
              onLike={onLike}
              onDislike={onDislike}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              onTranslate={onTranslate}
            />
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ */
/* MAIN APP */
/* ------------------------------------------------------ */

export default function App() {
  const [comments, setComments] = useState(
    () =>
      readStorage(
        COMMENTS_KEY,
        DEMO_COMMENTS
      )
  );

  const [reports, setReports] = useState(
    () =>
      readStorage(
        REPORTS_KEY,
        []
      )
  );

  const [moderationRecords, setModerationRecords] =
    useState(() =>
      readStorage(
        MODERATION_KEY,
        []
      )
    );

  const [commentHistory, setCommentHistory] =
    useState(() =>
      readStorage(
        "comment_history",
        []
      )
    );

  const [commentText, setCommentText] =
    useState("");

  const [commentLanguage, setCommentLanguage] =
    useState("en");

  const [preferredLanguage, setPreferredLanguage] =
    useState("en");

  const [sortType, setSortType] =
    useState("newest");

  const [replyTo, setReplyTo] =
    useState(null);

  const [notice, setNotice] =
    useState("");

  const [reportTarget, setReportTarget] =
    useState(null);

  const [reportReason, setReportReason] =
    useState("spam");

  const [showAdmin, setShowAdmin] =
    useState(false);

  const [captcha, setCaptcha] =
    useState(null);

  const [captchaAnswer, setCaptchaAnswer] =
    useState("");

  const [currentUser] =
    useState(CURRENT_USER);

  useEffect(() => {
    saveStorage(
      COMMENTS_KEY,
      comments
    );
  }, [comments]);

  useEffect(() => {
    saveStorage(
      REPORTS_KEY,
      reports
    );
  }, [reports]);

  useEffect(() => {
    saveStorage(
      MODERATION_KEY,
      moderationRecords
    );
  }, [moderationRecords]);

  useEffect(() => {
    saveStorage(
      "comment_history",
      commentHistory
    );
  }, [commentHistory]);

  function showNotice(message) {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3500);
  }

  function validateComment(text, ignoreId = null) {
    const value = text.trim();

    if (!value) {
      return "Comment cannot be empty.";
    }

    if (value.length > 1000) {
      return "Comment cannot exceed 1000 characters.";
    }

    if (containsProfanity(value)) {
      return "Comment blocked: abusive words are not allowed.";
    }

    if (containsMaliciousLink(value)) {
      return "Comment blocked: malicious link detected.";
    }

    if (containsAnyLink(value)) {
      return "Comment blocked: links are not allowed.";
    }

    if (hasExcessiveSpecialCharacters(value)) {
      return "Comment blocked: excessive special characters or emojis.";
    }

    if (isSpam(value)) {
      return "Comment blocked: spam detected.";
    }

    if (
      isDuplicateComment(
        value,
        comments,
        currentUser.username,
        ignoreId
      )
    ) {
      return "Duplicate comment blocked.";
    }

    return "";
  }

  function createCaptcha() {
    const first =
      Math.floor(Math.random() * 9) + 1;

    const second =
      Math.floor(Math.random() * 9) + 1;

    setCaptcha({
      first,
      second,
      answer: first + second
    });

    setCaptchaAnswer("");
  }

  function submitComment() {
    const rateData = getRateData();

    if (rateData.attempts.length >= RATE_LIMIT) {
      if (!captcha) {
        createCaptcha();

        showNotice(
          "CAPTCHA required after repeated posting attempts."
        );

        return;
      }

      if (
        Number(captchaAnswer) !==
        captcha.answer
      ) {
        showNotice(
          "Please enter the correct CAPTCHA answer."
        );

        return;
      }
    }

    const validationError =
      validateComment(commentText);

    if (validationError) {
      showNotice(validationError);
      return;
    }

    addRateAttempt();

    const now = Date.now();

    const newComment = {
      id: createId("comment"),
      username: currentUser.username,
      location: currentUser.location,
      avatar: currentUser.avatar,
      text: commentText.trim(),
      language: commentLanguage,
      createdAt: now,
      updatedAt: now,
      edited: false,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      parentId: replyTo
        ? replyTo.id
        : null,
      deleted: false,
      version: 1
    };

    setComments((previous) => [
      newComment,
      ...previous
    ]);

    setCommentHistory((previous) => [
      ...previous,
      {
        id: createId("history"),
        commentId: newComment.id,
        action: "CREATED",
        username: currentUser.username,
        text: newComment.text,
        timestamp: now
      }
    ]);

    setCommentText("");
    setReplyTo(null);
    setCaptcha(null);
    setCaptchaAnswer("");

    showNotice(
      "Comment posted successfully."
    );
  }

  function handleLike(commentId) {
    setComments((previous) =>
      previous.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        const alreadyLiked =
          comment.likedBy.includes(
            currentUser.username
          );

        const alreadyDisliked =
          comment.dislikedBy.includes(
            currentUser.username
          );

        if (alreadyLiked) {
          return {
            ...comment,
            likes: Math.max(
              0,
              comment.likes - 1
            ),
            likedBy:
              comment.likedBy.filter(
                (user) =>
                  user !==
                  currentUser.username
              )
          };
        }

        return {
          ...comment,
          likes:
            comment.likes + 1,
          dislikes: alreadyDisliked
            ? Math.max(
                0,
                comment.dislikes - 1
              )
            : comment.dislikes,
          likedBy: [
            ...comment.likedBy,
            currentUser.username
          ],
          dislikedBy:
            comment.dislikedBy.filter(
              (user) =>
                user !==
                currentUser.username
            )
        };
      })
    );
  }

  function handleDislike(commentId) {
    setComments((previous) =>
      previous.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        const alreadyLiked =
          comment.likedBy.includes(
            currentUser.username
          );

        const alreadyDisliked =
          comment.dislikedBy.includes(
            currentUser.username
          );

        if (alreadyDisliked) {
          return {
            ...comment,
            dislikes: Math.max(
              0,
              comment.dislikes - 1
            ),
            dislikedBy:
              comment.dislikedBy.filter(
                (user) =>
                  user !==
                  currentUser.username
              )
          };
        }

        return {
          ...comment,
          dislikes:
            comment.dislikes + 1,
          likes: alreadyLiked
            ? Math.max(
                0,
                comment.likes - 1
              )
            : comment.likes,
          dislikedBy: [
            ...comment.dislikedBy,
            currentUser.username
          ],
          likedBy:
            comment.likedBy.filter(
              (user) =>
                user !==
                currentUser.username
            )
        };
      })
    );
  }

  function handleReply(comment) {
    setReplyTo(comment);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function handleEdit(comment) {
    if (
      Date.now() - comment.createdAt >
      EDIT_DELETE_LIMIT
    ) {
      showNotice(
        "Edit time limit has expired."
      );

      return;
    }

    const updatedText =
      window.prompt(
        "Edit your comment:",
        comment.text
      );

    if (updatedText === null) {
      return;
    }

    const error = validateComment(
      updatedText,
      comment.id
    );

    if (error) {
      showNotice(error);
      return;
    }

    setComments((previous) =>
      previous.map((item) => {
        if (item.id !== comment.id) {
          return item;
        }

        if (
          item.version !==
          comment.version
        ) {
          showNotice(
            "Edit conflict detected. Please try again."
          );

          return item;
        }

        const now = Date.now();

        setCommentHistory((history) => [
          ...history,
          {
            id: createId("history"),
            commentId: item.id,
            action: "EDITED",
            username:
              currentUser.username,
            previousText: item.text,
            text: updatedText.trim(),
            timestamp: now
          }
        ]);

        return {
          ...item,
          text: updatedText.trim(),
          updatedAt: now,
          edited: true,
          version:
            item.version + 1
        };
      })
    );

    showNotice(
      "Comment updated successfully."
    );
  }

  function handleDelete(commentId) {
    const comment = comments.find(
      (item) =>
        item.id === commentId
    );

    if (!comment) {
      return;
    }

    if (
      comment.username !==
      currentUser.username
    ) {
      return;
    }

    if (
      Date.now() - comment.createdAt >
      EDIT_DELETE_LIMIT
    ) {
      showNotice(
        "Delete time limit has expired."
      );

      return;
    }

    const now = Date.now();

    setComments((previous) =>
      previous.map((item) =>
        item.id === commentId
          ? {
              ...item,
              deleted: true,
              updatedAt: now
            }
          : item
      )
    );

    setCommentHistory((previous) => [
      ...previous,
      {
        id: createId("history"),
        commentId,
        action: "DELETED",
        username:
          currentUser.username,
        text: comment.text,
        timestamp: now
      }
    ]);

    showNotice(
      "Comment deleted. Existing replies are preserved."
    );
  }

  function openReport(commentId) {
    const duplicateReport =
      reports.find(
        (report) =>
          report.commentId ===
            commentId &&
          report.reporter ===
            currentUser.username &&
          report.status === "pending"
      );

    if (duplicateReport) {
      showNotice(
        "You have already reported this comment."
      );

      return;
    }

    setReportTarget(commentId);
  }

  function submitReport() {
    if (!reportTarget) {
      return;
    }

    const duplicateReport =
      reports.find(
        (report) =>
          report.commentId ===
            reportTarget &&
          report.reporter ===
            currentUser.username &&
          report.status === "pending"
      );

    if (duplicateReport) {
      showNotice(
        "Duplicate report blocked."
      );

      setReportTarget(null);
      return;
    }

    const now = Date.now();

    const report = {
      id: createId("report"),
      commentId: reportTarget,
      reporter:
        currentUser.username,
      reason: reportReason,
      createdAt: now,
      status: "pending"
    };

    setReports((previous) => [
      ...previous,
      report
    ]);

    setModerationRecords(
      (previous) => [
        ...previous,
        {
          id: createId("moderation"),
          action: "REPORT_FLAGGED",
          commentId:
            reportTarget,
          reportId: report.id,
          reason: reportReason,
          admin: "Administrator",
          timestamp: now
        }
      ]
    );

    setReportTarget(null);

    showNotice(
      "Report submitted for administrator review."
    );
  }

  function resolveReport(
    report,
    action
  ) {
    const now = Date.now();

    setReports((previous) =>
      previous.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: action,
              resolvedAt: now
            }
          : item
      )
    );

    setModerationRecords(
      (previous) => [
        ...previous,
        {
          id: createId("moderation"),
          action,
          commentId:
            report.commentId,
          reportId: report.id,
          reason: report.reason,
          admin: "Administrator",
          timestamp: now
        }
      ]
    );

    if (action === "REMOVED") {
      setComments((previous) =>
        previous.map((comment) =>
          comment.id ===
          report.commentId
            ? {
                ...comment,
                deleted: true,
                updatedAt: now
              }
            : comment
        )
      );
    }

    showNotice(
      action === "REMOVED"
        ? "Comment removed by administrator."
        : "Report reviewed. Comment retained."
    );
  }

  const visibleComments = useMemo(() => {
    return comments.filter(
      (comment) =>
        comment.parentId === null &&
        !comment.deleted
    );
  }, [comments]);

  const sortedComments = useMemo(() => {
    const result = [
      ...visibleComments
    ];

    if (sortType === "newest") {
      result.sort(
        (a, b) =>
          b.createdAt - a.createdAt
      );
    }

    if (sortType === "oldest") {
      result.sort(
        (a, b) =>
          a.createdAt - b.createdAt
      );
    }

    if (sortType === "liked") {
      result.sort(
        (a, b) =>
          b.likes - a.likes
      );
    }

    if (sortType === "relevant") {
      result.sort(
        (a, b) =>
          b.likes -
            b.dislikes -
            (a.likes - a.dislikes)
      );
    }

    return result;
  }, [
    visibleComments,
    sortType
  ]);

  function resetData() {
    localStorage.removeItem(
      COMMENTS_KEY
    );

    localStorage.removeItem(
      REPORTS_KEY
    );

    localStorage.removeItem(
      MODERATION_KEY
    );

    localStorage.removeItem(
      "comment_history"
    );

    localStorage.removeItem(
      RATE_KEY
    );

    window.location.reload();
  }

  return (
    <div className="app">
      {/* HEADER */}

      <header className="header">
        <div>
          <h1>
            Multilingual Comments
          </h1>

          <p>
            Safe, multilingual and
            moderated commenting
          </p>
        </div>

        <button
          className="admin-button"
          onClick={() =>
            setShowAdmin(
              (value) => !value
            )
          }
        >
          {showAdmin
            ? "Close Admin"
            : "Admin Review"}

          {reports.filter(
            (report) =>
              report.status ===
              "pending"
          ).length > 0 && (
            <span className="badge">
              {
                reports.filter(
                  (report) =>
                    report.status ===
                    "pending"
                ).length
              }
            </span>
          )}
        </button>
      </header>

      <main className="container">
        {/* PROFILE */}

        <section className="profile-card">
          <h2>
            Current User
          </h2>

          <div className="profile-details">
            <div>
              <img
                src={currentUser.avatar}
                className="profile-avatar"
                alt="profile"
              />
            </div>

            <div>
              <strong>
                @{currentUser.username}
              </strong>

              <p>
                📍 {currentUser.location}
              </p>
            </div>

            <div>
              <label>
                Preferred Language
              </label>

              <select
                value={
                  preferredLanguage
                }
                onChange={(event) =>
                  setPreferredLanguage(
                    event.target.value
                  )
                }
              >
                {LANGUAGES.map(
                  (language) => (
                    <option
                      key={
                        language.code
                      }
                      value={
                        language.code
                      }
                    >
                      {language.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        {/* COMMENT COMPOSER */}

        <section className="composer">
          <div className="composer-title">
            <h2>
              {replyTo
                ? `Replying to @${replyTo.username}`
                : "Post a Comment"}
            </h2>

            {replyTo && (
              <button
                className="cancel-button"
                onClick={() =>
                  setReplyTo(null)
                }
              >
                Cancel Reply
              </button>
            )}
          </div>

          <textarea
            value={commentText}
            onChange={(event) =>
              setCommentText(
                event.target.value
              )
            }
            placeholder="Write your comment... You can mention @username"
            maxLength={1000}
          />

          <div className="composer-bottom">
            <div className="language-control">
              <label>
                Comment Language
              </label>

              <select
                value={
                  commentLanguage
                }
                onChange={(event) =>
                  setCommentLanguage(
                    event.target.value
                  )
                }
              >
                {LANGUAGES.map(
                  (language) => (
                    <option
                      key={
                        language.code
                      }
                      value={
                        language.code
                      }
                    >
                      {language.name}
                    </option>
                  )
                )}
              </select>

              <span>
                {commentText.length}/1000
              </span>
            </div>

            <button
              className="post-button"
              onClick={submitComment}
            >
              Post Comment
            </button>
          </div>

          {/* CAPTCHA */}

          {captcha && (
            <div className="captcha">
              <strong>
                CAPTCHA
              </strong>

              <span>
                {captcha.first} +{" "}
                {captcha.second} = ?
              </span>

              <input
                value={captchaAnswer}
                onChange={(event) =>
                  setCaptchaAnswer(
                    event.target.value
                  )
                }
                type="number"
                placeholder="Answer"
              />
            </div>
          )}
        </section>

        {/* NOTICE */}

        {notice && (
          <div className="notice">
            {notice}
          </div>
        )}

        {/* COMMENTS */}

        <section className="comments-section">
          <div className="comments-header">
            <div>
              <h2>
                Comments
              </h2>

              <span>
                {visibleComments.length}{" "}
                comments
              </span>
            </div>

            <select
              value={sortType}
              onChange={(event) =>
                setSortType(
                  event.target.value
                )
              }
            >
              <option value="newest">
                Newest
              </option>

              <option value="oldest">
                Oldest
              </option>

              <option value="liked">
                Most liked
              </option>

              <option value="relevant">
                Most relevant
              </option>
            </select>
          </div>

          {sortedComments.length ===
          0 ? (
            <div className="empty">
              No comments yet.
            </div>
          ) : (
            sortedComments.map(
              (comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  comments={comments}
                  preferredLanguage={
                    preferredLanguage
                  }
                  currentUser={
                    currentUser
                  }
                  onLike={
                    handleLike
                  }
                  onDislike={
                    handleDislike
                  }
                  onReply={
                    handleReply
                  }
                  onEdit={
                    handleEdit
                  }
                  onDelete={
                    handleDelete
                  }
                  onReport={
                    openReport
                  }
                  onTranslate={
                    translateComment
                  }
                />
              )
            )
          )}
        </section>

        {/* ADMIN PANEL */}

        {showAdmin && (
          <section className="admin-panel">
            <div className="comments-header">
              <div>
                <h2>
                  Administrator Review
                </h2>

                <span>
                  Reports and moderation
                  records
                </span>
              </div>
            </div>

            <h3>
              Pending Reports
            </h3>

            {reports.filter(
              (report) =>
                report.status ===
                "pending"
            ).length === 0 ? (
              <div className="empty">
                No pending reports.
              </div>
            ) : (
              reports
                .filter(
                  (report) =>
                    report.status ===
                    "pending"
                )
                .map((report) => {
                  const target =
                    comments.find(
                      (comment) =>
                        comment.id ===
                        report.commentId
                    );

                  return (
                    <div
                      className="report-card"
                      key={
                        report.id
                      }
                    >
                      <div>
                        <strong>
                          {report.reason.toUpperCase()}
                        </strong>

                        <p>
                          {target?.deleted
                            ? "[Deleted comment]"
                            : target?.text}
                        </p>

                        <small>
                          Reported by @
                          {
                            report.reporter
                          }{" "}
                          ·{" "}
                          {formatDate(
                            report.createdAt
                          )}
                        </small>
                      </div>

                      <div className="report-buttons">
                        <button
                          onClick={() =>
                            resolveReport(
                              report,
                              "REVIEWED"
                            )
                          }
                        >
                          Keep
                        </button>

                        <button
                          className="remove-button"
                          onClick={() =>
                            resolveReport(
                              report,
                              "REMOVED"
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
            )}

            {/* MODERATION RECORDS */}

            <h3>
              Moderation Records
            </h3>

            <div className="history-list">
              {moderationRecords
                .slice()
                .reverse()
                .map(
                  (record) => (
                    <div
                      className="history-item"
                      key={
                        record.id
                      }
                    >
                      <strong>
                        {
                          record.action
                        }
                      </strong>

                      <span>
                        {record.reason ||
                          "Moderation action"}
                      </span>

                      <small>
                        {formatDate(
                          record.timestamp
                        )}
                      </small>
                    </div>
                  )
                )}

              {moderationRecords.length ===
                0 && (
                <div className="empty">
                  No moderation records.
                </div>
              )}
            </div>

            {/* COMMENT HISTORY */}

            <h3>
              Comment History
            </h3>

            <div className="history-list">
              {commentHistory
                .slice()
                .reverse()
                .map(
                  (item) => (
                    <div
                      className="history-item"
                      key={item.id}
                    >
                      <strong>
                        {item.action}
                      </strong>

                      <span>
                        {item.text}
                      </span>

                      <small>
                        {formatDate(
                          item.timestamp
                        )}
                      </small>
                    </div>
                  )
                )}

              {commentHistory.length ===
                0 && (
                <div className="empty">
                  No comment history.
                </div>
              )}
            </div>

            <button
              className="reset-button"
              onClick={resetData}
            >
              Reset Demo Data
            </button>
          </section>
        )}
      </main>

      {/* REPORT MODAL */}

      {reportTarget && (
        <div
          className="modal-overlay"
          onClick={() =>
            setReportTarget(null)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              Report Comment
            </h2>

            <p>
              Select the reason for
              reporting this comment.
            </p>

            <select
              value={reportReason}
              onChange={(event) =>
                setReportReason(
                  event.target.value
                )
              }
            >
              <option value="spam">
                Spam
              </option>

              <option value="harassment">
                Harassment
              </option>

              <option value="offensive content">
                Offensive Content
              </option>
            </select>

            <div className="modal-actions">
              <button
                onClick={() =>
                  setReportTarget(null)
                }
              >
                Cancel
              </button>

              <button
                className="post-button"
                onClick={submitReport}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}