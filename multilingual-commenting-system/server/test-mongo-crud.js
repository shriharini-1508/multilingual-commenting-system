import { MongoClient } from "mongodb";
import "dotenv/config";
import dns from "dns";

// Fix Windows c-ares loopback DNS issue
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) { }

async function runMongoCrudTest() {
  console.log("==========================================================");
  console.log("🔍 MONGODB ATLAS LIVE CONNECTION & CRUD VERIFICATION");
  console.log("==========================================================");

  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    console.error("❌ No MONGO_URI found in .env");
    process.exit(1);
  }

  let sanitizedUri = rawUri.trim().replace(/^["']|["']$/g, "").replace(/<([^>]+)>/g, "$1");
  const srvMatch = sanitizedUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^/?#]+)(.*)$/);
  if (srvMatch) {
    const protocol = srvMatch[1];
    const username = srvMatch[2];
    let password = srvMatch[3];
    const host = srvMatch[4];
    const rest = srvMatch[5];
    try {
      password = encodeURIComponent(decodeURIComponent(password));
    } catch {
      password = encodeURIComponent(password);
    }
    sanitizedUri = `${protocol}${username}:${password}@${host}${rest}`;
  }
  const maskedUri = sanitizedUri.replace(/:[^:]*@/, ":****@");
  console.log(`Connecting to: ${maskedUri}`);

  let client;
  try {
    client = new MongoClient(sanitizedUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      tls: true
    });
    await client.connect();
    console.log("✓ Live connection established to MongoDB Atlas!");

    const db = client.db("subscription_system");
    const testColl = db.collection("_crud_probe_test");

    // 1. Create (Insert)
    const probeId = "probe-" + Date.now();
    console.log(`\n1. Testing CREATE (Insert probe document: ${probeId})...`);
    const insertRes = await testColl.insertOne({
      id: probeId,
      purpose: "Antigravity live database CRUD test",
      timestamp: Date.now()
    });
    console.log(`✓ Inserted with _id: ${insertRes.insertedId}`);

    // 2. Read (Find)
    console.log(`\n2. Testing READ (Query probe document)...`);
    const foundDoc = await testColl.findOne({ id: probeId });
    if (!foundDoc || foundDoc.id !== probeId) {
      throw new Error("Probe document not found after insert!");
    }
    console.log(`✓ Retrieved document successfully: id=${foundDoc.id}`);

    // 3. Update
    console.log(`\n3. Testing UPDATE (Modify probe document)...`);
    const updateRes = await testColl.updateOne(
      { id: probeId },
      { $set: { status: "VERIFIED", verifiedAt: Date.now() } }
    );
    console.log(`✓ Modified count: ${updateRes.modifiedCount}`);

    // Verify update
    const updatedDoc = await testColl.findOne({ id: probeId });
    if (!updatedDoc || updatedDoc.status !== "VERIFIED") {
      throw new Error("Update verification failed!");
    }
    console.log(`✓ Document status verified: ${updatedDoc.status}`);

    // 4. Delete (Cleanup)
    console.log(`\n4. Testing DELETE (Cleanup probe document)...`);
    const delRes = await testColl.deleteOne({ id: probeId });
    console.log(`✓ Deleted probe count: ${delRes.deletedCount}`);

    // 5. Inspect Application Collections
    console.log("\n5. Inspecting Application Collections in subscription_system...");
    const collections = await db.listCollections().toArray();
    const collNames = collections.map((c) => c.name);
    console.log(`✓ Existing Collections (${collNames.length}):`, collNames.join(", "));

    await client.close();
    console.log("\n==========================================================");
    console.log("🎉 ALL MONGODB ATLAS CRUD OPERATIONS SUCCEEDED (4/4)!");
    console.log("==========================================================");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Atlas verification error:", err.message);
    if (client) await client.close().catch(() => { });
    return false;
  }
}

runMongoCrudTest();
