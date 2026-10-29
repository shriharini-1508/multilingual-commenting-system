import crypto from "crypto";

async function runTask3TestSuite() {
  console.log("==========================================================");
  console.log("🚀 STARTING AUTOMATED VALIDATION SUITE: TASK 3 SUBSCRIPTION SYSTEM");
  console.log("==========================================================");

  const baseUrl = "http://localhost:5000/api";

  // 1. Test Root Service & Database Connection
  console.log("\n[TEST 1] Testing Server Root & Database Connectivity...");
  const rootRes = await fetch("http://localhost:5000/");
  const rootData = await rootRes.json();
  console.log(`✓ Status: ${rootRes.status} | Service: ${rootData.service} | DB: ${rootData.database}`);
  if (!rootData.success) throw new Error("Root service check failed!");

  // 2. Test Plan Definitions (Free, Bronze, Silver, Gold with Pricing & Validity)
  console.log("\n[TEST 2] Testing GET /api/plans (Membership Tiers & Pricing)...");
  const plansRes = await fetch(`${baseUrl}/plans`);
  const plansData = await plansRes.json();
  const planKeys = Object.keys(plansData.plans);
  console.log(`✓ Available Plans: ${planKeys.join(", ")}`);
  for (const k of ["Free", "Bronze", "Silver", "Gold"]) {
    if (!plansData.plans[k]) throw new Error(`Missing plan: ${k}`);
    const p = plansData.plans[k];
    console.log(`  - ${p.name} (${p.badge}): Monthly=₹${p.pricing.monthly}, Quarterly=₹${p.pricing.quarterly}, Yearly=₹${p.pricing.yearly} | Quality=${p.streamingQuality} | Limit=${p.dailyLimit}/day`);
  }

  // 3. Test Video Catalog & Tiered Access Requirements
  console.log("\n[TEST 3] Testing GET /api/videos (Video Catalog with Tier Gates)...");
  const vidsRes = await fetch(`${baseUrl}/videos`);
  const videos = await vidsRes.json();
  console.log(`✓ Total Videos in Catalog: ${videos.length}`);
  for (const v of videos) {
    console.log(`  - [${v.tierRequired} Tier] ${v.title} (${v.fileSize}, Accessible on disk: ${v.accessible})`);
    if (!v.accessible) throw new Error(`Video file ${v.fileName} not accessible!`);
  }

  // 4. Test User Subscription & Quota Retrieval
  console.log("\n[TEST 4] Testing GET /api/subscription/test-user-gold...");
  const subRes = await fetch(`${baseUrl}/subscription/test-user-gold`);
  const subData = await subRes.json();
  console.log(`✓ User: ${subData.username} | Plan: ${subData.plan} | Active: ${subData.active} | Daily Quota: ${subData.quota.remainingDaily}/${subData.quota.dailyLimit}`);

  // 5. Test Razorpay Order Creation
  console.log("\n[TEST 5] Testing POST /api/payment/create-order (Razorpay Order Generation)...");
  const orderRes = await fetch(`${baseUrl}/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-gold",
      plan: "Gold",
      billingCycle: "yearly"
    })
  });
  const orderData = await orderRes.json();
  console.log(`✓ Order Created: ID=${orderData.order.orderId}, Amount=₹${orderData.order.amount} (${orderData.order.amountPaise} paise), Currency=${orderData.order.currency}`);
  if (!orderData.success || !orderData.order.orderId) throw new Error("Order creation failed!");

  // 6. Test Cryptographic Signature Verification & Plan Activation
  console.log("\n[TEST 6] Testing POST /api/payment/verify (HMAC-SHA256 Verification & Activation)...");
  const testPaymentId = `pay_test_${Date.now()}`;
  const testOrderId = orderData.order.orderId;
  const testSecret = "antigravity_secret_key_2026";
  const signature = crypto.createHmac("sha256", testSecret).update(`${testOrderId}|${testPaymentId}`).digest("hex");

  const verifyRes = await fetch(`${baseUrl}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_payment_id: testPaymentId,
      razorpay_order_id: testOrderId,
      razorpay_signature: signature,
      userId: "test-user-gold",
      plan: "Gold",
      billingCycle: "yearly",
      userEmail: "golduser@example.com",
      userName: "Gold Subscriber"
    })
  });
  const verifyData = await verifyRes.json();
  console.log(`✓ Payment Verified: ${verifyData.message}`);
  console.log(`  - New Plan: ${verifyData.subscription.plan} | Invoice: ${verifyData.invoice.invoiceNumber} | Email Subject: "${verifyData.emailConfirmation.subject}"`);
  if (!verifyData.success || verifyData.subscription.plan !== "Gold") {
    throw new Error("Payment verification or Gold plan activation failed!");
  }

  // 7. Test Duplicate Payment Prevention (Idempotency)
  console.log("\n[TEST 7] Testing Duplicate Payment Attempt (Idempotency Protection)...");
  const dupRes = await fetch(`${baseUrl}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_payment_id: testPaymentId,
      razorpay_order_id: testOrderId,
      razorpay_signature: signature,
      userId: "test-user-gold",
      plan: "Gold",
      billingCycle: "yearly"
    })
  });
  const dupData = await dupRes.json();
  console.log(`✓ Duplicate payment rejected: HTTP ${dupRes.status} | Message: ${dupData.message}`);
  if (dupRes.status !== 409) throw new Error(`Expected 409 Conflict, received ${dupRes.status}`);

  // 8. Test Payment Failure Logging
  console.log("\n[TEST 8] Testing POST /api/payment/report-failure (Failed Transaction Logging)...");
  const failRes = await fetch(`${baseUrl}/payment/report-failure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-gold",
      orderId: "order_test_declined_123",
      paymentId: "pay_declined_999",
      plan: "Silver",
      billingCycle: "monthly",
      reason: "Card expired or insufficient balance"
    })
  });
  const failData = await failRes.json();
  console.log(`✓ Failure Logged: ${failData.message} | Status: ${failData.transaction.paymentStatus} | Reason: ${failData.transaction.failureReason}`);

  // 9. Test Payment Cancellation Logging
  console.log("\n[TEST 9] Testing POST /api/payment/report-cancelled (User Cancellation)...");
  const cancelRes = await fetch(`${baseUrl}/payment/report-cancelled`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-gold",
      orderId: "order_cancelled_001",
      plan: "Bronze",
      billingCycle: "monthly"
    })
  });
  const cancelData = await cancelRes.json();
  console.log(`✓ Cancellation Logged: Status=${cancelData.transaction.paymentStatus} | Reason: ${cancelData.transaction.failureReason}`);

  // 10. Test Cancel Auto-Renewal
  console.log("\n[TEST 10] Testing POST /api/subscription/cancel (Auto-Renewal Cancellation)...");
  const autoCancelRes = await fetch(`${baseUrl}/subscription/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-gold",
      reason: "User turned off auto-renew"
    })
  });
  const autoCancelData = await autoCancelRes.json();
  console.log(`✓ Auto-Renewal Cancelled: ${autoCancelData.message} | AutoRenew: ${autoCancelData.subscription.autoRenew} | Status: ${autoCancelData.subscription.status}`);
  if (autoCancelData.subscription.autoRenew !== false || autoCancelData.subscription.status !== "CANCELLED") {
    throw new Error("Auto-renewal cancellation failed!");
  }

  // 11. Test Subscription Downgrade
  console.log("\n[TEST 11] Testing POST /api/subscription/downgrade to Bronze...");
  const downRes = await fetch(`${baseUrl}/subscription/downgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-gold",
      targetPlan: "Bronze"
    })
  });
  const downData = await downRes.json();
  console.log(`✓ Downgraded: Plan=${downData.subscription.plan} | Daily Limit=${downData.subscription.quota.dailyLimit} | Quality=${downData.subscription.planDetails.streamingQuality}`);
  if (downData.subscription.plan !== "Bronze") throw new Error("Downgrade failed!");

  // 12. Test Tier-Gated Access: Free user blocked from Gold video
  console.log("\n[TEST 12] Testing Tier Gate Enforcement (Free user blocked from Gold video)...");
  // Set user to Free
  await fetch(`${baseUrl}/subscription/switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "test-user-tiergate", plan: "Free", active: true })
  });

  const gateRes = await fetch(`${baseUrl}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-tiergate",
      videoId: "video-5", // Gold video
      deviceId: "dev-gate-01"
    })
  });
  const gateData = await gateRes.json();
  console.log(`✓ Tier Gate Result: Status=${gateRes.status} | Message: "${gateData.message}"`);
  if (gateRes.status !== 403) throw new Error(`Expected 403 Forbidden for tier gate, got ${gateRes.status}`);

  // 13. Test Expiry & Auto-Downgrade Engine
  console.log("\n[TEST 13] Testing Subscription Expiry & Auto-Downgrade to Free...");
  // Simulate expired Silver plan
  await fetch(`${baseUrl}/subscription/switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-expiry",
      plan: "Silver",
      active: true,
      isExpired: true
    })
  });

  // Fetch subscription (triggers auto-downgrade evaluation)
  const expCheckRes = await fetch(`${baseUrl}/subscription/test-user-expiry`);
  const expCheckData = await expCheckRes.json();
  console.log(`✓ Expiry Auto-Downgrade Check: Plan=${expCheckData.plan} | Status=${expCheckData.status} | Active=${expCheckData.active}`);
  if (expCheckData.plan !== "Free") {
    throw new Error(`Expected auto-downgrade to Free, found ${expCheckData.plan}`);
  }

  // 14. Test Billing History Audit Records (MongoDB Atlas / Local Cache)
  console.log("\n[TEST 14] Testing GET /api/subscription/billing-history/test-user-gold...");
  const histRes = await fetch(`${baseUrl}/subscription/billing-history/test-user-gold`);
  const histData = await histRes.json();
  console.log(`✓ Billing Records retrieved: ${histData.history.length} transactions found.`);
  for (const h of histData.history.slice(0, 4)) {
    console.log(`  - [${h.paymentStatus}] ${h.invoiceNumber}: ${h.plan} (₹${h.amount}) | ID: ${h.paymentId}`);
  }

  console.log("\n==========================================================");
  console.log("🎉 ALL 14 AUTOMATED VALIDATION SUITE TESTS PASSED (14/14)!");
  console.log("==========================================================");
}

runTask3TestSuite().catch((err) => {
  console.error("❌ Test Suite Failure:", err);
  process.exit(1);
});
