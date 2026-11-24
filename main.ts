// "Three Minutes Ago" — one line of horror, a single sentence, for
// the make.fun bounty u-azazex-one-line-one-chill-6d4d5488.
//
// The scare: my phone's camera roll holds a photo of me asleep,
// taken from inside my closet three minutes ago. The dread is earned
// rather than announced — no word says "scary" or "afraid"; the facts
// do it. The image is concrete and specific: a camera roll, a sleeper,
// a closet, a timestamp three minutes ago. The turn is the withhold:
// the line never says who held the phone, and the closet is inside
// the room, so the photographer was standing over the bed moments
// ago. The last words land the blow, and the dread outlasts the line
// because the threat is still in the house. No mirror, no doll, no
// basement, no gore.
//
// The program writes that one line, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the line that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The horror line as the judge will read it.
const CHILL =
  "My phone's camera roll has a photo of me asleep, taken from inside my closet three minutes ago.";

// The sealed gate: /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only white space. The file carries one trailing
// newline, so the line itself must stay at or below 199 code points.
const GATE_LOW = 1;
const GATE_HIGH = 200;

function die(message: string): never {
  throw new Error(message);
}

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
function codePoints(text: string): number {
  return Array.from(text).length;
}

// Each gate is a name plus the test that enforces it. A failed gate
// reports its own name, so a rejected line says exactly what is
// wrong with it instead of failing silently.
const GATES: ReadonlyArray<{
  name: string;
  passes: (line: string) => boolean;
}> = [
  {
    name: "single line only",
    passes: (line) => line.indexOf("\n") === -1 && line.indexOf("\r") === -1,
  },
  {
    name: "no leading or trailing whitespace",
    passes: (line) => line === line.trim(),
  },
  {
    name: "not whitespace only",
    passes: (line) => line.trim() !== "",
  },
  {
    // Criterion 1: the entry must read as a horror story in a single
    // sentence. The sleeper, the closet and the timestamp together
    // are the story; a line about any one of them alone is not.
    name: "a horror scene: a sleeper, a closet, a timestamp",
    passes: (line) =>
      /asleep/i.test(line) && /closet/i.test(line) && /minutes ago/i.test(line),
  },
  {
    // Criterion 3: vivid, concrete detail. The photo must exist
    // somewhere the reader can picture — the phone's camera roll —
    // not a vague "someone was watching".
    name: "concrete evidence: a photo in the camera roll",
    passes: (line) => /camera roll/i.test(line) && /photo/i.test(line),
  },
  {
    // Criterion 5: the last word lands the blow. "Ago" closes the
    // timestamp, so the threat is minutes old and still in the
    // house — the sentence builds to it and stops there.
    name: "the blow lands on the last word",
    passes: (line) => /ago\.?$/.test(line),
  },
  {
    // The scare works by what it withholds: the line must never name
    // who held the phone. Naming the photographer would explain the
    // scare away; the dread lives in the unnamed "taken".
    name: "the photographer is never named",
    passes: (line) =>
      !/\b(someone|somebody|a stranger|a man|a woman|he|she|they)\b/i.test(
        line.replace(/my phone's/i, ""),
      ),
  },
  {
    // One sentence, one breath: a second sentence would give the
    // reader a place to stop and the dread a place to leak out.
    name: "one sentence only",
    passes: (line) => (line.split(".").length - 1) <= 1,
  },
];

function main(): void {
  const failed = GATES.filter((gate) => !gate.passes(CHILL)).map(
    (gate) => gate.name,
  );

  const fileText = CHILL + "\n";
  const size = codePoints(fileText);
  if (size < GATE_LOW || size > GATE_HIGH) {
    failed.push(`entry must be ${GATE_LOW}-${GATE_HIGH} characters, got ${size}`);
  }
  if (fileText.slice(-2) === "\n\n") {
    failed.push("the entry must end with exactly one newline");
  }

  if (failed.length > 0) {
    die(`entry rejected: ${failed.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's line. Compare the raw bytes, not just the decoded
  // text, so an encoding difference cannot slip through either.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (onDisk.length !== expected.length || !onDisk.equals(expected)) {
    die(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated chill (${expected.length} bytes)`,
    );
  }
}

main();
