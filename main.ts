// news-image-20261120 — "THE WORLD TODAY", Friday 20 November 2026.
// Node 22, standard library only. Streams the bundled entry.png to
// $MAKEFUN_OUTPUT_DIR/entry.png (default /output), verifying on the way:
// the source must be non-empty, at most 1 MiB, and start with the JPEG
// signature ffd8ff; after copying, the destination is re-read and its size
// and sha256 must match the source exactly. Prints size and sha256.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576; // 1 MiB gate ceiling
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destPath = join(outputDir, "entry.png");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Pass a file through a counting/hashing tap. When `to` is given the bytes
// are also written there; the first three bytes are checked against the
// JPEG signature as they pass.
async function measure(from, to) {
  const hash = createHash("sha256");
  let total = 0;
  let head = Buffer.alloc(0);
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
  return { size: total, sha256: hash.digest("hex") };
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
  console.log(`entry.png: ${source.size} bytes sha256 ${source.sha256} -> ${destPath}`);
}

main().catch((err) => fail(err?.message ?? String(err)));
