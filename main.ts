// news-image-20261120 — "THE WORLD TODAY", Friday 20 November 2026.
// Node 22, standard library only. Streams the bundled entry.png to
// $MAKEFUN_OUTPUT_DIR/entry.png (default /output), verifying on the way:
// the source must be non-empty, at most 1 MiB, start with the JPEG
// signature ffd8ff, and end with the end-of-image marker ffd9; after
// copying, the destination is re-read and its size and sha256 must match
// the source exactly, and the source frame dimensions (from its SOF0/SOF2
// segment) must not exceed 1024x1024. Prints size and sha256.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576; // 1 MiB gate ceiling
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const JPEG_EOI = [0xff, 0xd9];

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destPath = join(outputDir, "entry.png");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Pass a file through a counting/hashing tap. When `to` is given the bytes
// are also written there; the first three bytes are checked against the
// JPEG signature as they pass, and the last two bytes seen are tracked so
// the end-of-image marker can be verified once the stream finishes.
async function measure(from, to) {
  const hash = createHash("sha256");
  let total = 0;
  let head = Buffer.alloc(0);
  let tail = Buffer.alloc(0);
  const tap = new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > MAX_BYTES) {
        cb(new Error(`stream exceeds the 1 MiB ceiling (${total} bytes so far)`));
        return;
      }
      if (head.length < JPEG_MAGIC.length) {
        head = Buffer.concat([head, chunk]).subarray(0, JPEG_MAGIC.length);
      }
      tail = Buffer.concat([tail, chunk]);
      if (tail.length > JPEG_EOI.length) {
        tail = tail.subarray(tail.length - JPEG_EOI.length);
      }
      hash.update(chunk);
      cb(null, chunk);
    },
  });
  const streams = to
    ? [createReadStream(from), tap, createWriteStream(to)]
    : [createReadStream(from), tap];
  if (!to) tap.resume(); // drain when measuring only
  await pipeline(...streams);
  if (total === 0) fail(`${from} is empty`);
  const isJpeg =
    head.length === JPEG_MAGIC.length &&
    JPEG_MAGIC.every((b, i) => head[i] === b);
  if (!isJpeg) fail(`${from} does not start with the JPEG signature ffd8ff`);
  const hasEoi =
    tail.length === JPEG_EOI.length &&
    JPEG_EOI.every((b, i) => tail[i] === b);
  if (!hasEoi) fail(`${from} does not end with the JPEG end-of-image marker ffd9`);
  return { size: total, sha256: hash.digest("hex") };
}

// Parse the JPEG frame dimensions from the SOF0 (0xc0) or SOF2 (0xc2)
// segment. Walks the marker segments from the SOI marker until a
// start-of-frame segment is found; returns null if none is present.
function parseJpegDimensions(bytes) {
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    let marker = bytes[offset + 1];
    // Skip any padding 0xff bytes before the actual marker code.
    while (marker === 0xff && offset + 2 < bytes.length) {
      offset += 1;
      marker = bytes[offset + 1];
    }
    offset += 2;
    // Markers with no length field: SOI, EOI, TEM, and RST0-RST7.
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      if (marker === 0xd9) return null;
      continue;
    }
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2) return null;
    if (marker === 0xc0 || marker === 0xc2) {
      // Layout after the length field: precision (1), height (2), width (2).
      if (offset + 6 >= bytes.length) return null;
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      return { width, height };
    }
    // Start of scan: image data follows, no SOF beyond this point.
    if (marker === 0xda) return null;
    offset += segmentLength;
  }
  return null;
}

async function main() {
  const info = await stat(sourcePath).catch(() => null);
  if (!info?.isFile()) fail(`entry.png not found beside main.ts (${sourcePath})`);
  if (info.size === 0) fail("entry.png is empty");
  if (info.size > MAX_BYTES) {
    fail(`entry.png is ${info.size} bytes, over the 1 MiB ceiling (${MAX_BYTES})`);
  }

  await mkdir(outputDir, { recursive: true });

  const source = await measure(sourcePath, destPath);
  const copied = await measure(destPath, null);
  if (copied.size !== source.size) {
    fail(`copy size mismatch: source ${source.size}, copied ${copied.size}`);
  }
  if (copied.sha256 !== source.sha256) {
    fail(`copy sha256 mismatch: source ${source.sha256}, copied ${copied.sha256}`);
  }
  const dimensions = parseJpegDimensions(await readFile(sourcePath));
  if (!dimensions) fail("entry.png has no JPEG SOF0/SOF2 frame segment");
  if (dimensions.width > 1024 || dimensions.height > 1024) {
    fail(
      `entry.png frame is ${dimensions.width}x${dimensions.height}, over the 1024x1024 ceiling`,
    );
  }
  console.log(`entry.png: ${source.size} bytes sha256 ${source.sha256} -> ${destPath}`);
}

main().catch((err) => fail(err?.message ?? String(err)));
