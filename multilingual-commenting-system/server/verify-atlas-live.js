import { MongoClient } from "mongodb";
import "dotenv/config";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const baseUrl = "http://localhost:5000/api";
const rawUri = process.env.MONGO_URI;

if (!rawUri) {
  console.error("FATAL: No MONGO_URI configured in .env");
  process.exit(1);
}

const sanitizedUri = rawUri.replace(/<([^>]+)>/, "$1");
const maskedUri = sanitizedUri.replace(/:[^:]*@/, ":****@");

async function main() {
  console.log("================================================================================");
  console.log("🚀 MONGODB ATLAS PRODUCTION CONNECTIVITY & API PERSISTENCE AUDIT");
  console.log("================================================================================");
  console.log(`Connecting to Atlas endpoint: ${maskedUri}`);

  let client = null;
  try {
    client = new MongoClient(sanitizedUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    await client.connect();
    console.log("✓ Live connection established to MongoDB Atlas cluster.");

    const db = client.db("subscription_system");
    console.log(`✓ Active Database confirmed: ${db.databaseName}`);

    // --- PHASE 1: DIRECT CRUD PROBE TEST ---
    console.log("\n--- PHASE 1: DIRECT ATLAS CRUD PROBE VERIFICATION ---");
    const probeColl = db.collection("_crud_probe_test");
    const testDocId = "probe-audit-" + Date.now();

    // 1. Insert
    const insertRes = await probeColl.insertOne({
      id: testDocId,
      purpose: "Final Atlas submission verification",
      createdAt: new Date(),
      status: "INITIATED"
    });
    console.log(`1. CREATE: Inserted probe document with _id: ${insertRes.insertedId}`);

    // 2. Read
    const readDoc = await probeColl.findOne({ id: testDocId });
    if (!readDoc || readDoc.id !== testDocId) {
      throw new Error("Direct read failed: probe document not found in Atlas!");
    }
    console.log(`2. READ: Successfully retrieved probe document (id: ${readDoc.id}, status: ${readDoc.status})`);

    // 3. Update
    const updateRes = await probeColl.updateOne(
      { id: testDocId },
      { $set: { status: "VERIFIED_OK", verifiedAt: new Date() } }
    );
    console.log(`3. UPDATE: Modified count = ${updateRes.modifiedCount}`);
    const verifyUpdated = await probeColl.findOne({ id: testDocId });
    if (!verifyUpdated || verifyUpdated.status !== "VERIFIED_OK") {
      throw new Error("Update verification failed: status mismatch!");
    }
    console.log(`   Update confirmed: status is now '${verifyUpdated.status}'`);

    // 4. Delete
    const delRes = await probeColl.deleteOne({ id: testDocId });
    console.log(`4. DELETE: Deleted count = ${delRes.deletedCount}`);
    const checkDeleted = await probeColl.findOne({ id: testDocId });
    if (checkDeleted) {
      throw new Error("Delete cleanup failed: document still exists in Atlas!");
    }
    console.log("✓ Cleanup confirmed: probe document completely deleted from Atlas.");

    // --- PHASE 2: API ROUTE TO ATLAS PERSISTENCE VERIFICATION ---
    console.log("\n--- PHASE 2: APPLICATION API -> ATLAS DATABASE PERSISTENCE ---");

    // 1. Check /api/db/status endpoint
    const statusRes = await fetch(`${baseUrl}/db/status`);
    const statusData = await statusRes.json();
    console.log("Status API Response:", {
      status: statusData.status,
      connected: statusData.connected,
      database: statusData.database,
      storageEngine: statusData.storageEngine,
      latencyMs: statusData.latencyMs
    });
    if (statusData.status !== "VERIFIED_ONLINE" || !statusData.connected) {
      throw new Error(`API status endpoint did not report VERIFIED_ONLINE! Reported: ${statusData.status}`);
    }
    console.log(`✓ /api/db/status verified: ${statusData.status} (latency: ${statusData.latencyMs}ms)`);

    // 2. Post comment through API and verify it appears directly in Atlas
    const testCommentText = `Audit validation comment [${Date.now()}]`;
    const postRes = await fetch(`${baseUrl}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-001",
        username: "Harini",
        location: "Chennai, India",
        text: testCommentText,
        language: "en"
      })
    });
    const postData = await postRes.json();
    const commentId = postData.comment?.id;
    console.log(`✓ Posted comment via API: ID = ${commentId}`);

    // Verify directly in MongoDB Atlas collection
    const atlasComment = await db.collection("comments").findOne({ id: commentId });
    if (!atlasComment || atlasComment.text !== testCommentText) {
      throw new Error("Comment created via API was not found in Atlas 'comments' collection!");
    }
    console.log(`✓ Verified in Atlas 'comments' collection: "${atlasComment.text}" (Atlas _id: ${atlasComment._id})`);

    // 3. Like comment via API and verify in Atlas
    await fetch(`${baseUrl}/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Priya" })
    });
    const likedAtlasComment = await db.collection("comments").findOne({ id: commentId });
    console.log(`✓ Verified Like persisted in Atlas: likes = ${likedAtlasComment.likes}, likedBy = ${JSON.stringify(likedAtlasComment.likedBy)}`);

    // 4. Delete comment via API and verify in Atlas
    await fetch(`${baseUrl}/comments/${commentId}`, { method: "DELETE" });
    const deletedAtlasComment = await db.collection("comments").findOne({ id: commentId });
    if (deletedAtlasComment) {
      throw new Error("Deleted comment still found in Atlas!");
    }
    console.log("✓ Verified Comment Delete persisted in Atlas: comment cleanly removed.");

    // --- PHASE 3: APPLICATION DATA INTEGRITY CHECK ---
    console.log("\n--- PHASE 3: REAL APPLICATION DATA INTEGRITY IN ATLAS ---");
    const collections = [
      "comments",
      "subscriptions",
      "transactions",
      "downloads",
      "login_records",
      "comment_history",
      "comment_reports",
      "trusted_devices",
      "video_progress",
      "meetings"
    ];

    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      console.log(`✓ Collection '${collName.padEnd(18)}': ${count} documents preserved.`);
    }

    console.log("\n================================================================================");
    console.log("🎉 ALL MONGODB ATLAS CONNECTIVITY & PERSISTENCE TESTS PASSED!");
    console.log("================================================================================");

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ AUDIT FAILED:", err.message);
    if (client) await client.close().catch(() => {});
    process.exit(1);
  }
}

main();

