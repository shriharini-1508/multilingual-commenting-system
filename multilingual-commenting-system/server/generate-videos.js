import fs from 'fs';
import path from 'path';

function createBasicMp4Buffer(title, dummySize = 100 * 1024) {
  // Build a minimal ISO base media file format (MP4) structure
  // 1. ftyp box
  const ftypPayload = Buffer.from('isom\x00\x00\x02\x00isomiso2mp41');
  const ftypLength = 8 + ftypPayload.length;
  const ftypBox = Buffer.alloc(ftypLength);
  ftypBox.writeUInt32BE(ftypLength, 0);
  ftypBox.write('ftyp', 4);
  ftypPayload.copy(ftypBox, 8);

  // 2. moov box with mvhd atom
  // mvhd payload: version(1) + flags(3) + creation(4) + mod(4) + timescale(4) + duration(4) + rate(4) + volume(2) + reserved(10) + matrix(36) + pre_defined(24) + next_track_id(4) = 100 bytes
  const mvhdPayload = Buffer.alloc(100);
  mvhdPayload.writeUInt32BE(1000, 12); // timescale 1000
  mvhdPayload.writeUInt32BE(5000, 16); // duration 5000ms
  mvhdPayload.writeUInt32BE(0x00010000, 20); // rate 1.0
  mvhdPayload.writeUInt16BE(0x0100, 24); // volume 1.0
  // matrix unity
  mvhdPayload.writeInt32BE(0x00010000, 36);
  mvhdPayload.writeInt32BE(0x00010000, 52);
  mvhdPayload.writeInt32BE(0x40000000, 80);
  mvhdPayload.writeUInt32BE(2, 96); // next track id

  const mvhdBox = Buffer.alloc(8 + mvhdPayload.length);
  mvhdBox.writeUInt32BE(mvhdBox.length, 0);
  mvhdBox.write('mvhd', 4);
  mvhdPayload.copy(mvhdBox, 8);

  const moovBox = Buffer.alloc(8 + mvhdBox.length);
  moovBox.writeUInt32BE(moovBox.length, 0);
  moovBox.write('moov', 4);
  mvhdBox.copy(moovBox, 8);

  // 3. mdat box with media data
  const mdatPayload = Buffer.alloc(dummySize);
  // Fill with video title and patterned bytes
  const titleBuf = Buffer.from(`Video content: ${title}\nPlatform: Antigravity Multilingual Commenting & Download System\nTimestamp: ${new Date().toISOString()}\n`);
  titleBuf.copy(mdatPayload, 0);
  for (let i = titleBuf.length; i < dummySize; i++) {
    mdatPayload[i] = (i * 37) % 256;
  }

  const mdatBox = Buffer.alloc(8 + mdatPayload.length);
  mdatBox.writeUInt32BE(mdatBox.length, 0);
  mdatBox.write('mdat', 4);
  mdatPayload.copy(mdatBox, 8);

  return Buffer.concat([ftypBox, moovBox, mdatBox]);
}

const videosDir = path.join(process.cwd(), 'public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

fs.writeFileSync(path.join(videosDir, 'video1.mp4'), createBasicMp4Buffer('Introduction to Artificial Intelligence', 125 * 1024));
fs.writeFileSync(path.join(videosDir, 'video2.mp4'), createBasicMp4Buffer('Machine Learning Fundamentals', 180 * 1024));
fs.writeFileSync(path.join(videosDir, 'video3.mp4'), createBasicMp4Buffer('Advanced React Development', 220 * 1024));
fs.writeFileSync(path.join(videosDir, 'video4.mp4'), createBasicMp4Buffer('Cloud Architecture & Microservices Mastery', 260 * 1024));
fs.writeFileSync(path.join(videosDir, 'video5.mp4'), createBasicMp4Buffer('Executive Masterclass: Quantum Computing & AI Ethics', 310 * 1024));

console.log('Generated video files successfully:');
for (const f of ['video1.mp4', 'video2.mp4', 'video3.mp4', 'video4.mp4', 'video5.mp4']) {
  const stat = fs.statSync(path.join(videosDir, f));
  console.log(`- ${f}: ${stat.size} bytes`);
}

