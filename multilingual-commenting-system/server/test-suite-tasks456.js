async function runSuite456() {
  console.log("==========================================================");
  console.log("🚀 STARTING AUTOMATED TEST SUITE: TASKS 4, 5, AND 6");
  console.log("==========================================================");
  const baseUrl = "http://localhost:5000/api";

  // --- TASK 4: ADAPTIVE THEME & ACCOUNT SECURITY TESTS ---
  console.log("\n[TASK 4 - TEST 1] Testing Morning IST Login (Theme must be LIGHT)...");
  // 8:00 AM IST on Oct 8, 2026: 8:00 AM IST is 2:30 AM UTC
  const morningDate = new Date("2026-10-08T02:30:00Z");
  const mornRes = await fetch(`${baseUrl}/security/login-attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      simulatedTimestamp: morningDate.getTime(),
      browser: "Chrome 124.0",
      deviceType: "Desktop",
      ipAddress: "49.37.152.88",
      city: "Chennai"
    })
  });
  const mornData = await mornRes.json();
  console.log(`✓ Morning IST Theme applied: ${mornData.theme} | IST Hour: ${mornData.istInfo.hours}:${mornData.istInfo.minutes} | isMorning: ${mornData.istInfo.isMorningIST}`);
  if (mornData.theme !== "light") throw new Error(`Expected 'light' theme for 8 AM IST, got ${mornData.theme}`);

  console.log("\n[TASK 4 - TEST 2] Testing Night IST Login (Theme must be DARK)...");
  // 8:00 PM IST is 14:30 UTC
  const nightDate = new Date("2026-10-08T14:30:00Z");
  const nightRes = await fetch(`${baseUrl}/security/login-attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      simulatedTimestamp: nightDate.getTime(),
      browser: "Chrome 124.0",
      deviceType: "Desktop",
      ipAddress: "49.37.152.88",
      city: "Chennai"
    })
  });
  const nightData = await nightRes.json();
  console.log(`✓ Night IST Theme applied: ${nightData.theme} | IST Hour: ${nightData.istInfo.hours}:${nightData.istInfo.minutes}`);
  if (nightData.theme !== "dark") throw new Error(`Expected 'dark' theme for 8 PM IST, got ${nightData.theme}`);

  console.log("\n[TASK 4 - TEST 3] Testing New Browser / Location Detection -> Requires OTP...");
  const uniqueBrowser = `Brave Browser ${Date.now()}`;
  const newBrowserRes = await fetch(`${baseUrl}/security/login-attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      browser: uniqueBrowser,
      deviceType: "Desktop",
      ipAddress: "182.72.100.5",
      city: "Mumbai",
      state: "Maharashtra"
    })
  });
  const newBrowserData = await newBrowserRes.json();
  console.log(`✓ OTP Required: ${newBrowserData.requiresOtp} | Reason: ${newBrowserData.reason} | Demo OTP: ${newBrowserData.demoOtpCode}`);
  if (!newBrowserData.requiresOtp || !newBrowserData.demoOtpCode) throw new Error("Expected OTP challenge for new browser/city!");

  console.log("\n[TASK 4 - TEST 4] Testing Invalid OTP entry (Should Fail)...");
  const failOtpRes = await fetch(`${baseUrl}/security/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tempToken: newBrowserData.tempToken,
      otp: "000000"
    })
  });
  console.log(`✓ Invalid OTP rejected: HTTP ${failOtpRes.status}`);
  if (failOtpRes.status !== 400) throw new Error("Expected HTTP 400 on invalid OTP");

  console.log("\n[TASK 4 - TEST 5] Testing Correct OTP Verification & Trusted Device Registration...");
  const verifyRes = await fetch(`${baseUrl}/security/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tempToken: newBrowserData.tempToken,
      otp: newBrowserData.demoOtpCode,
      trustDevice: true,
      trustDurationDays: 30
    })
  });
  const verifyData = await verifyRes.json();
  console.log(`✓ OTP Verified: ${verifyData.success} | Trusted: ${verifyData.trusted}`);
  if (!verifyData.success || !verifyData.trusted) throw new Error("OTP verification failed");

  console.log("\n[TASK 4 - TEST 6] Testing Login History & Trusted Devices Retrieval...");
  const recsRes = await fetch(`${baseUrl}/security/records/user-001`);
  const recsData = await recsRes.json();
  console.log(`✓ Retrieved ${recsData.records.length} security audit records`);

  const trustDevRes = await fetch(`${baseUrl}/security/trusted-devices/user-001`);
  const trustDevData = await trustDevRes.json();
  console.log(`✓ Retrieved ${trustDevData.trustedDevices.length} trusted devices`);

  // --- TASK 5: VIDEO PROGRESS & WATCH COMPLETION TESTS ---
  console.log("\n[TASK 5 - TEST 7] Testing Video Progress Save (Periodic Watch Progress)...");
  const progRes = await fetch(`${baseUrl}/video-progress/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      videoId: "video-1",
      currentTime: 450,
      duration: 900,
      percent: 50.0
    })
  });
  const progData = await progRes.json();
  console.log(`✓ Progress Saved: ${progData.progress.currentTime}s (${progData.progress.percent}%) | Completed: ${progData.progress.completed}`);
  if (progData.progress.currentTime !== 450) throw new Error("Progress save failed");

  console.log("\n[TASK 5 - TEST 8] Testing Video Completion (>85% Watch Threshold)...");
  const compRes = await fetch(`${baseUrl}/video-progress/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-001",
      videoId: "video-1",
      currentTime: 810,
      duration: 900,
      percent: 90.0,
      completionThreshold: 85
    })
  });
  const compData = await compRes.json();
  console.log(`✓ Video Completed Marked: ${compData.progress.completed} at ${compData.progress.percent}%`);
  if (!compData.progress.completed) throw new Error("Video completion not marked at 90%");

  // --- TASK 6: VIDEO MEETINGS & CALLING TESTS ---
  console.log("\n[TASK 6 - TEST 9] Testing Meeting Creation...");
  const meetRes = await fetch(`${baseUrl}/meetings/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Sprint Review & Code Walkthrough",
      hostUserId: "user-001",
      hostName: "Shri Harini",
      passcode: "9988",
      maxParticipants: 10
    })
  });
  const meetData = await meetRes.json();
  const roomId = meetData.room.roomId;
  console.log(`✓ Room Created: ${roomId} | Title: ${meetData.room.title} | Host: ${meetData.room.hostName}`);

  console.log("\n[TASK 6 - TEST 10] Testing Participant Join & Passcode Validation...");
  const joinFailRes = await fetch(`${baseUrl}/meetings/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      userName: "Arun Kumar",
      passcode: "0000" // wrong
    })
  });
  console.log(`✓ Wrong Passcode Rejected: HTTP ${joinFailRes.status}`);
  if (joinFailRes.status !== 401) throw new Error("Expected 401 on wrong passcode");

  const joinSuccessRes = await fetch(`${baseUrl}/meetings/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user-002",
      userName: "Arun Kumar",
      passcode: "9988"
    })
  });
  const joinSuccessData = await joinSuccessRes.json();
  console.log(`✓ Participant Joined: ${joinSuccessData.room.participants.length} participants now in room`);

  console.log("\n[TASK 6 - TEST 11] Testing Host Moderation (Mute All & Lock Room)...");
  const modRes = await fetch(`${baseUrl}/meetings/${roomId}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hostUserId: "user-001",
      action: "lock_room",
      value: true
    })
  });
  const modData = await modRes.json();
  console.log(`✓ Room Locked: ${modData.room.isLocked}`);

  console.log("\n[TASK 6 - TEST 12] Testing Meeting Recording Archive...");
  const recRes = await fetch(`${baseUrl}/meetings/${roomId}/recording`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      duration: "12:45",
      recordedBy: "Shri Harini",
      recordingName: "Sprint Review Recording"
    })
  });
  const recData = await recRes.json();
  console.log(`✓ Recording Archived: ${recData.recording.name} (${recData.recording.duration})`);

  console.log("\n==========================================================");
  console.log("🎉 ALL 12 TEST SUITE CHECKS FOR TASKS 4, 5, AND 6 PASSED!");
  console.log("==========================================================");
}

runSuite456().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
