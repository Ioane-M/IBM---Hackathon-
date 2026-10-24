/**
 * Fails if a secret looks like it is about to be committed.
 *
 *   npm run check:secrets            scans every tracked file plus staged changes
 *
 * Also runs from the pre-commit hook (.githooks/pre-commit), which `npm install`
 * switches on. It is a safety net, not a replacement for keeping keys in
 * .env.local and in Vercel's environment settings.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sh = (cmd: string) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

const tracked = sh("git ls-files").split("\n").filter(Boolean);
const staged = sh("git diff --cached --name-only --diff-filter=ACM").split("\n").filter(Boolean);
const files = Array.from(new Set([...tracked, ...staged]));

const problems: string[] = [];

// 1. No env files except the example
for (const f of files) {
  const base = f.split("/").pop() ?? "";
  if (/^\.env/.test(base) && base !== ".env.example") problems.push(`${f}: env files must never be committed`);
}

// 2. Patterns that look like real credentials
const PLACEHOLDER = /^(|\.\.\.|your[_-].*|<.*>|xxx+|changeme|example)$/i;
const rules: Array<{ name: string; re: RegExp; isPlaceholder?: (m: RegExpExecArray) => boolean }> = [
  { name: "ICA_API_KEY with a value", re: /ICA_API_KEY\s*[=:]\s*["']?([^\s"'#]*)/g, isPlaceholder: (m) => PLACEHOLDER.test(m[1]) },
  { name: "Bearer token", re: /Bearer\s+([A-Za-z0-9._~+/=-]{24,})/g, isPlaceholder: (m) => /\$\{|process\.env/.test(m[0]) },
  { name: "OpenAI-style key", re: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/g },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

const SKIP = /\.(png|jpe?g|gif|ico|webp|zip|lock)$|package-lock\.json$|^scripts\/check-secrets\.ts$/;

for (const f of files) {
  if (SKIP.test(f)) continue;
  let text: string;
  try {
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      if (rule.isPlaceholder?.(m)) continue;
      const line = text.slice(0, m.index).split("\n").length;
      problems.push(`${f}:${line}: ${rule.name}`);
    }
  }
}

if (problems.length) {
  console.error("Possible secret found. Nothing was committed.\n");
  for (const p of problems) console.error("  " + p);
  console.error("\nMove it to .env.local (local) or Vercel's environment settings, then try again.");
  console.error("If a real key was already pushed anywhere, revoke it in the ICA UI and create a new one.");
  process.exit(1);
}
console.log(`No secrets found in ${files.length} files.`);
