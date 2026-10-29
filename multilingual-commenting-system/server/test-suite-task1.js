import crypto from "crypto";

async function runTask1TestSuite() {
  console.log("==========================================================");
  console.log("🚀 STARTING AUTOMATED TEST SUITE: TASK 1 COMMENTING SYSTEM");
  console.log("==========================================================");

  const baseUrl = "http://localhost:5000/api";

  // 1. Test GET /api/comments
  console.log("\n[TEST 1] Testing GET /api/comments...");
  const getRes = await fetch(`${baseUrl}/comments?sort=newest`);
  const getData = await getRes.json();
  console.log(`✓ Status: ${getRes.status} | Total comments loaded: ${getData.count}`);
  if (!getData.success || !Array.isArray(getData.comments)) {
    throw new Error("Failed to load comments");
  }

  // 2. Test POST /api/comments (Valid comment creation)
  console.log("\n[TEST 2] Testing POST /api/comments (Standard comment creation)...");
  const testCommentText = `Testing the multilingual distributed architecture discussion! Great insights. (${Date.now()})`;
  const postRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      username: "Harini",
      location: "Chennai, India",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      text: testCommentText,
      originalLang: "en"
    })
  });
  const postData = await postRes.json();
  console.log(`✓ Status: ${postRes.status} | Message: ${postData.message} | ID: ${postData.comment?.id}`);
  if (!postData.success || !postData.comment?.id) {
    throw new Error("Failed to create comment");
  }
  const createdId = postData.comment.id;

  // 3. Test Profanity Filter
  console.log("\n[TEST 3] Testing Profanity Filter Block...");
  const profRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      username: "Tester",
      text: "This is a stupid crap video with bad words."
    })
  });
  const profData = await profRes.json();
  console.log(`✓ Status: ${profRes.status} | Block message: ${profData.message}`);
  if (profRes.status !== 400 || profData.success) {
    throw new Error("Profanity filter should have rejected the comment!");
  }

  // 4. Test Malicious Link Detection
  console.log("\n[TEST 4] Testing Malicious Link Detection...");
  const linkRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      username: "Spammer",
      text: "Claim your rewards now at bit.ly/free-crypto"
    })
  });
  const linkData = await linkRes.json();
  console.log(`✓ Status: ${linkRes.status} | Block message: ${linkData.message}`);
  if (linkRes.status !== 400 || linkData.success) {
    throw new Error("Malicious link detection should have rejected the comment!");
  }

  // 5. Test Emoji / Special Character Flooding
  console.log("\n[TEST 5] Testing Emoji Flood Detection...");
  const emojiRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      username: "EmojiSpammer",
      text: "😀😃😄😁😆😅🤣😂🙂🙃"
    })
  });
  const emojiData = await emojiRes.json();
  console.log(`✓ Status: ${emojiRes.status} | Block message: ${emojiData.message}`);
  if (emojiRes.status !== 400 || emojiData.success) {
    throw new Error("Emoji flood should have rejected the comment!");
  }

  // 6. Test Duplicate Comment Detection
  console.log("\n[TEST 6] Testing Duplicate Comment Detection...");
  const dupRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      username: "Harini",
      text: testCommentText
    })
  });
  const dupData = await dupRes.json();
  console.log(`✓ Status: ${dupRes.status} | Duplicate notice: ${dupData.message}`);
  if (dupRes.status !== 400 || dupData.success) {
    throw new Error("Duplicate comment should have been rejected!");
  }

  // 7. Test PUT /api/comments/:id (15-Minute Edit Window)
  console.log("\n[TEST 7] Testing Comment Edit (Within 15-Minute Window)...");
  const editRes = await fetch(`${baseUrl}/comments/${createdId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Testing the multilingual distributed architecture discussion! Updated with new reflections.",
      username: "Harini"
    })
  });
  const editData = await editRes.json();
  console.log(`✓ Status: ${editRes.status} | Edited text: "${editData.comment?.text}" | isEdited: ${editData.comment?.isEdited}`);
  if (!editData.success || !editData.comment?.isEdited) {
    throw new Error("Comment editing failed!");
  }

  // 8. Test Likes & Dislikes
  console.log("\n[TEST 8] Testing Like & Dislike Interactions...");
  const likeRes = await fetch(`${baseUrl}/comments/${createdId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Arun" })
  });
  const likeData = await likeRes.json();
  console.log(`✓ Like response: Likes=${likeData.likes}, Dislikes=${likeData.dislikes}`);
  if (!likeData.success || likeData.likes !== 1) {
    throw new Error("Like interaction failed!");
  }

  // 9. Test Real Dynamic Translation
  console.log("\n[TEST 9] Testing Dynamic Multilingual Translation (en -> es)...");
  const transRes = await fetch(`${baseUrl}/comments/${createdId}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetLang: "es" })
  });
  const transData = await transRes.json();
  console.log(`✓ Translation result (${transData.translatedLang}): "${transData.translatedText}"`);
  if (!transData.success || !transData.translatedText) {
    throw new Error("Translation failed!");
  }

  // 10. Test Comment Reporting with Predefined Reason
  console.log("\n[TEST 10] Testing Comment Report Submission...");
  const repRes = await fetch(`${baseUrl}/comments/${createdId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: "offensive",
      details: "Reported for community guidelines review.",
      reportedBy: "user-002"
    })
  });
  const repData = await repRes.json();
  console.log(`✓ Status: ${repRes.status} | Report ID: ${repData.report?.id} | Status: ${repData.report?.status}`);
  if (!repData.success || !repData.report?.id) {
    throw new Error("Comment reporting failed!");
  }
  const reportId = repData.report.id;

  // 11. Test Moderation Queue & Resolution
  console.log("\n[TEST 11] Testing Admin Moderation Queue & Report Resolution...");
  const modQueueRes = await fetch(`${baseUrl}/moderation/reports`);
  const modQueueData = await modQueueRes.json();
  console.log(`✓ Reports in moderation queue: ${modQueueData.count}`);
  if (!modQueueData.success || modQueueData.count === 0) {
    throw new Error("Moderation queue empty after report submission!");
  }

  const resolveRes = await fetch(`${baseUrl}/moderation/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve" })
  });
  const resolveData = await resolveRes.json();
  console.log(`✓ Report resolution: ${resolveData.message}`);
  if (!resolveData.success) {
    throw new Error("Report resolution failed!");
  }

  // 12. Test Reply Threading & Soft Deletion
  console.log("\n[TEST 12] Testing Reply Threading & Soft Deletion...");
  const replyText = `@Harini I totally agree with this point! (Run ${Date.now()})`;
  let replyRes = await fetch(`${baseUrl}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      username: "Arun",
      parentId: createdId,
      text: replyText
    })
  });
  let replyData = await replyRes.json();
  if (replyRes.status === 429 && replyData.captcha) {
    console.log(`  (Rate limit challenge triggered: ${replyData.captcha.question}. Solving CAPTCHA...)`);
    const [n1, n2] = replyData.captcha.question.split(" + ").map(Number);
    const ans = n1 + n2;
    replyRes = await fetch(`${baseUrl}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-002",
        username: "Arun",
        parentId: createdId,
        text: replyText,
        captchaToken: replyData.captcha.token,
        captchaSolution: ans
      })
    });
    replyData = await replyRes.json();
  }
  console.log(`✓ Reply posted: ID=${replyData.comment?.id}, Parent=${replyData.comment?.parentId}`);

  // Delete parent comment -> Must soft-delete because it has a reply
  const delParentRes = await fetch(`${baseUrl}/comments/${createdId}`, {
    method: "DELETE"
  });
  const delParentData = await delParentRes.json();
  console.log(`✓ Parent deletion: softDeleted=${delParentData.softDeleted} | Message: ${delParentData.message}`);
  if (!delParentData.success || !delParentData.softDeleted) {
    throw new Error("Parent comment with replies must be soft-deleted!");
  }

  // Clean up test comment and test reply so automated tests don't leave soft-deleted records in the feed
  if (replyData.comment?.id) {
    await fetch(`${baseUrl}/comments/${replyData.comment.id}`, { method: "DELETE" });
  }
  await fetch(`${baseUrl}/comments/${createdId}`, { method: "DELETE" });
  console.log("✓ Cleaned up test records so live comment feed remains clean.");

  // 13. Test Sorting Modes
  console.log("\n[TEST 13] Testing Comment Sorting (newest, oldest, most_liked, most_relevant)...");
  for (const sortMode of ["newest", "oldest", "most_liked", "most_relevant"]) {
    const sortRes = await fetch(`${baseUrl}/comments?sort=${sortMode}`);
    const sortData = await sortRes.json();
    console.log(`  - Mode '${sortMode}': retrieved ${sortData.count} comments.`);
    if (!sortData.success) throw new Error(`Sorting mode ${sortMode} failed`);
  }

  console.log("\n==========================================================");
  console.log("🎉 ALL 13 TEST SUITE CHECKS FOR TASK 1 (COMMENTING) PASSED!");
  console.log("==========================================================");
}

runTask1TestSuite().catch((err) => {
  console.error("❌ Task 1 Test Suite failed:", err);
  process.exit(1);
});
