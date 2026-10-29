import { MongoClient } from "mongodb";
import "dotenv/config";
import dns from "dns";

// Try different TLS / SSL options and DNS options
console.log("Testing MongoDB connection...");
const rawUri = process.env.MONGO_URI;
console.log("Raw URI status:", rawUri ? "Present in .env" : "Missing");
const sanitizedUri = rawUri ? rawUri.replace(/<([^>]+)>/, "$1") : "";
console.log("Sanitized URI:", sanitizedUri ? sanitizedUri.replace(/:[^:]*@/, ":****@") : "(none)");

async function testConnection(options = {}, desc = "") {
  console.log(`\nAttempting: ${desc}`);
  const client = new MongoClient(sanitizedUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    ...options
  });
  try {
    await client.connect();
    console.log(`✓ SUCCESS: Connected with ${desc}!`);
    const db = client.db("subscription_system");
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    await client.close();
    return true;
  } catch (err) {
    console.log(`✗ FAILED with ${desc}:`, err.message);
    return false;
  }
}

async function run() {
  // Try 1: Standard
  await testConnection({}, "Standard options");

  // Try 2: tlsAllowInvalidCertificates
  await testConnection({ tlsAllowInvalidCertificates: true }, "tlsAllowInvalidCertificates: true");

  // Try 3: With specific DNS
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  await testConnection({}, "Google DNS 8.8.8.8");

  // Try 4: With Cloudflare DNS
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
  await testConnection({}, "Cloudflare DNS 1.1.1.1");
}

run();
