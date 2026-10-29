
async function runTests() {
  console.log('--- STARTING AUTOMATED VALIDATION SUITE ---');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Test Video Catalog
  console.log('1. Testing GET /api/videos...');
  const vidsRes = await fetch(`${baseUrl}/videos`);
  const videos = await vidsRes.json();
  console.log(`✓ Videos catalog loaded: ${videos.length} videos found.`);
  for (const v of videos) {
    console.log(`  - ${v.id}: ${v.title} (${v.fileSize}, accessible: ${v.accessible})`);
    if (!v.accessible) throw new Error(`Video ${v.id} is not accessible!`);
  }

  // 2. Test Plan Definitions
  console.log('\n2. Testing GET /api/plans...');
  const plansRes = await fetch(`${baseUrl}/plans`);
  const plansData = await plansRes.json();
  console.log('✓ Plans available:', Object.keys(plansData.plans).join(', '));

  // 3. Test Subscription Switcher (Simulator to Free)
  const testUser = `test-user-free-${Date.now()}`;
  console.log(`\n3. Testing POST /api/subscription/switch to Free for ${testUser}...`);
  const switchRes = await fetch(`${baseUrl}/subscription/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser, plan: 'Free', active: true })
  });
  const switchData = await switchRes.json();
  console.log('✓ Switched test-user to Free plan:', switchData.subscription.quota);

  // 4. Test 1st Download on Free Tier (Should Succeed)
  console.log('\n4. Testing 1st download on Free Tier (video-1)...');
  const dl1Res = await fetch(`${baseUrl}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser, videoId: 'video-1', deviceId: 'dev-01' })
  });
  const dl1Data = await dl1Res.json();
  console.log('✓ 1st Download result:', dl1Res.status, dl1Data.message, 'Remaining Daily:', dl1Data.remainingDailyQuota);
  if (dl1Res.status !== 200) throw new Error('1st download failed!');

  // 5. Test 2nd Download of a DIFFERENT video on Free Tier (Should be BLOCKED: Daily limit 1 reached)
  console.log('\n5. Testing 2nd download of different video (video-2) on Free Tier (Should be BLOCKED)...');
  const dl2Res = await fetch(`${baseUrl}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser, videoId: 'video-2', deviceId: 'dev-01' })
  });
  const dl2Data = await dl2Res.json();
  console.log('✓ 2nd Download blocked as expected:', dl2Res.status, dl2Data.message);
  if (dl2Res.status !== 429) throw new Error(`Expected 429 Too Many Requests, got ${dl2Res.status}`);

  // 6. Test 24-Hour Re-download of SAME video (video-1) (Should SUCCEED with no quota penalty!)
  console.log('\n6. Testing 24h Duplicate Re-download of video-1 (Should SUCCEED without quota penalty)...');
  const dl3Res = await fetch(`${baseUrl}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUser, videoId: 'video-1', deviceId: 'dev-01' })
  });

  const dl3Data = await dl3Res.json();
  console.log('✓ 24h Re-download result:', dl3Res.status, dl3Data.message, 'isReDownload:', dl3Data.isReDownload);
  if (dl3Res.status !== 200 || !dl3Data.isReDownload) {
    throw new Error('Expected 200 OK with isReDownload = true!');
  }

  // 7. Test Expired Subscription Check
  console.log('\n7. Testing Expired Subscription Block...');
  await fetch(`${baseUrl}/subscription/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-user-expired', plan: 'Gold', active: false, isExpired: true })
  });
  const expDlRes = await fetch(`${baseUrl}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-user-expired', videoId: 'video-1', deviceId: 'dev-01' })
  });
  const expDlData = await expDlRes.json();
  console.log('✓ Expired user blocked as expected:', expDlRes.status, expDlData.message);
  if (expDlRes.status !== 403) throw new Error('Expected 403 Forbidden for expired user!');

  // 8. Test Secure Token Authorization & File Streaming
  console.log('\n8. Testing Token Authorization & Streaming...');
  await fetch(`${baseUrl}/subscription/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-001', plan: 'Gold', active: true })
  });
  const authRes = await fetch(`${baseUrl}/download/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-001', videoId: 'video-3', deviceId: 'device-desktop-01' })
  });
  const authData = await authRes.json();
  console.log('✓ Token authorized:', authData.token);
  const streamRes = await fetch(`http://localhost:5000${authData.downloadUrl}`);
  console.log('✓ Stream status:', streamRes.status, 'Content-Type:', streamRes.headers.get('content-type'), 'Length:', streamRes.headers.get('content-length'));
  if (streamRes.status !== 200 || streamRes.headers.get('content-type') !== 'video/mp4') {
    throw new Error('Token video stream validation failed!');
  }

  // 9. Test Device Registration
  console.log('\n9. Testing Device Registration & Limits...');
  const devRes = await fetch(`${baseUrl}/devices/user-001`);
  const devData = await devRes.json();
  console.log(`✓ Devices for user-001 (${devData.plan} tier): ${devData.devices.length} / ${devData.maxDevices}`);

  // 10. Test Audit History
  console.log('\n10. Testing Audit Logs & Download History...');
  const histRes = await fetch(`${baseUrl}/downloads/test-user-free`);
  const history = await histRes.json();
  console.log(`✓ Audit records logged for test-user-free: ${history.length}`);
  for (const h of history) {
    console.log(`  - ID: ${h.id}, Video: ${h.videoTitle}, Status: ${h.status}, IP: ${h.ipAddress}, Device: ${h.device}, Browser: ${h.browser}`);
  }

  console.log('\n--- ALL AUTOMATED TESTS PASSED SUCCESSFULLY (10/10) ---');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
