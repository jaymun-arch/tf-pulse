/**
 * Sync OpenAI env from c:\Users\user\Documents\api\.env into the project .env
 * (gitignored). Does not print secret values.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEST = resolve(ROOT, ".env");

const SOURCES = [
  resolve(homedir(), "Documents", "api", ".env"),
  "C:/Users/user/Documents/api/.env",
  resolve(ROOT, ".env.local"),
];

function parseEnv(text) {
  const out = {};
  const cleaned = text.replace(/^\uFEFF/, "");
  for (const line of cleaned.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function main() {
  let source = "";
  let parsed = null;
  for (const file of SOURCES) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    const env = parseEnv(text);
    if (env.OPENAI_API_KEY) {
      source = file;
      parsed = env;
      break;
    }
  }
  if (!parsed?.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY를 찾지 못했습니다. Documents/api/.env 를 확인해 주세요.");
    process.exit(1);
  }

  const lines = [
    "# Auto-synced for TF Pulse local/API server. Do not commit.",
    `# source: ${source}`,
    `OPENAI_API_KEY=${parsed.OPENAI_API_KEY}`,
    "",
  ];
  writeFileSync(DEST, lines.join("\n"), "utf8");
  console.log(`Synced OPENAI_API_KEY → ${DEST}`);
  console.log(`source: ${source}`);
  console.log(`key length: ${parsed.OPENAI_API_KEY.length}`);
}

main();
