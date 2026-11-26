import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHARS = 200;

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, "entry.txt"), "utf8");
const line = raw.endsWith("\n") ? raw.slice(0, -1) : raw;

if (line.length === 0 || line.trim().length === 0) {
  throw new Error("entry must be non-empty and not only whitespace");
}
if (line.includes("\n") || line.includes("\r")) {
  throw new Error("entry must be a single line");
}
if ([...line].length > MAX_CHARS) {
  throw new Error(`entry exceeds ${MAX_CHARS} characters`);
}

if (raw !== line + "\n") {
  throw new Error("entry.txt must be exactly one line plus a single trailing newline");
}
if (Buffer.byteLength(line, "utf8") !== [...line].length && /[^\x00-\x7F]/.test(line)) {
  // Non-ASCII is allowed, but the character count above is the gate's measure.
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outPath = join(outDir, "entry.txt");
mkdirSync(outDir, { recursive: true });
const expected = Buffer.from(line + "\n", "utf8");
writeFileSync(outPath, expected);

// Byte-exact round-trip verification: re-read what was written and compare.
const written = readFileSync(outPath);
if (!written.equals(expected)) {
  throw new Error("round-trip failed: output is not byte-exact with entry.txt");
}
const roundTripped = written.toString("utf8");
if (roundTripped !== line + "\n" || [...roundTripped.slice(0, -1)].length > MAX_CHARS) {
  throw new Error("round-trip failed: output failed validation on re-read");
}
console.log(`wrote ${outPath} (${[...line].length} chars, ${expected.length} bytes, round-trip byte-exact)`);
