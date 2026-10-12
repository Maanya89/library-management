import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const output = new URL("../public/", import.meta.url);
const glyph = ["01111", "11000", "11110", "00011", "11110", "11000", "01111"];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(name, data) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, checksum]);
}

function png(size) {
  const scale = Math.max(1, Math.floor(size / 12));
  const left = Math.floor((size - 5 * scale) / 2);
  const top = Math.floor((size - 7 * scale) / 2);
  const radius = Math.floor(size / 5);
  const pixels = Buffer.alloc(size * size * 4);
  const raw = Buffer.alloc(size * (size * 4 + 1));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x < radius ? radius - x : x >= size - radius ? x - (size - radius - 1) : 0;
      const dy = y < radius ? radius - y : y >= size - radius ? y - (size - radius - 1) : 0;
      if (dx && dy && dx * dx + dy * dy > radius * radius) continue;
      const row = Math.floor((y - top) / scale);
      const column = Math.floor((x - left) / scale);
      const isGlyph = row >= 0 && row < glyph.length && column >= 0 &&
        column < glyph[0].length && glyph[row][column] === "1";
      const offset = (y * size + x) * 4;
      pixels.set(isGlyph ? [209, 231, 196, 255] : [32, 60, 49, 255], offset);
    }
  }

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    pixels.copy(raw, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ico(image) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 48;
  header[7] = 48;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(image.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, image]);
}

await mkdir(output, { recursive: true });
for (const size of [16, 32, 48, 180]) {
  const image = png(size);
  if (size === 16 || size === 32) {
    await writeFile(new URL(`favicon-${size}x${size}.png`, output), image);
  }
  if (size === 48) {
    await writeFile(new URL("favicon.ico", output), ico(image));
  }
  if (size === 180) {
    await writeFile(new URL("apple-touch-icon.png", output), image);
  }
}
