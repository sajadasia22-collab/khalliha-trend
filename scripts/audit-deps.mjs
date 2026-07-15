// تدقيق ثغرات الاعتماديات عبر npm bulk advisory endpoint الجديد.
// السبب: npm أوقفت endpoints التدقيق القديمة (410) في 2026-07 وكل نسخ pnpm
// حتى 11.x ما زالت تستخدمها، فكسرت `pnpm audit` محلياً وفي CI.
// يقرأ الحزم من pnpm-lock.yaml مباشرة ويفشل عند أي ثغرة تطابق نسخة مثبتة.
//
// الاستخدام: node scripts/audit-deps.mjs   (أو pnpm audit:deps)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BULK_ENDPOINT = "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk";
const CHUNK_SIZE = 300;

function parseLockfilePackages(lockText) {
  // قسم packages في lockfileVersion 9: أسطر بمسافتين مثل:
  //   '@scope/name@1.2.3': أو 'name@1.2.3(peer@x)':
  const packagesStart = lockText.indexOf("\npackages:");
  if (packagesStart === -1) throw new Error("قسم packages غير موجود في pnpm-lock.yaml");
  const rest = lockText.slice(packagesStart + "\npackages:".length);
  const nextTop = rest.search(/\n[a-zA-Z][^\n]*:\n/);
  const section = nextTop === -1 ? rest : rest.slice(0, nextTop);

  const versionsByName = new Map();
  const keyPattern = /^ {2}'?((?:@[^/']+\/)?[^@'\s]+)@([^('\s:]+)/gm;
  for (const match of section.matchAll(keyPattern)) {
    const [, name, version] = match;
    if (!versionsByName.has(name)) versionsByName.set(name, new Set());
    versionsByName.get(name).add(version);
  }
  return versionsByName;
}

// مقارنة semver مبسطة تكفي صيغ نطاقات advisories في npm
// (">=x <y"، "<x"، "=x"، مع "||"). لا تدعم ^ أو ~ لأنها لا ترد في الـ advisories.
function parseVersion(version) {
  const [core, prerelease] = version.split("-");
  const parts = core.split(".").map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return { parts, prerelease: prerelease ?? null };
}

function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    if (va.parts[i] !== vb.parts[i]) return va.parts[i] - vb.parts[i];
  }
  // النسخة المستقرة أعلى من أي prerelease لنفس الأرقام
  if (va.prerelease && !vb.prerelease) return -1;
  if (!va.prerelease && vb.prerelease) return 1;
  if (va.prerelease && vb.prerelease) {
    return va.prerelease < vb.prerelease ? -1 : va.prerelease > vb.prerelease ? 1 : 0;
  }
  return 0;
}

function satisfiesComparator(version, comparator) {
  const match = comparator.match(/^(>=|<=|>|<|=)?\s*(.+)$/);
  if (!match) return false;
  const [, op = "=", target] = match;
  if (target === "*") return true;
  const cmp = compareVersions(version, target.trim());
  if (op === ">=") return cmp >= 0;
  if (op === "<=") return cmp <= 0;
  if (op === ">") return cmp > 0;
  if (op === "<") return cmp < 0;
  return cmp === 0;
}

function satisfiesRange(version, range) {
  // "||" تعني OR بين مجموعات، والمسافة داخل المجموعة تعني AND
  return range.split("||").some((group) => {
    const comparators = group.trim().split(/\s+/).filter(Boolean);
    if (comparators.length === 0) return false;
    return comparators.every((comparator) => satisfiesComparator(version, comparator));
  });
}

async function queryAdvisories(versionsByName) {
  const names = [...versionsByName.keys()];
  const findings = [];
  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    const chunk = names.slice(i, i + CHUNK_SIZE);
    const body = {};
    for (const name of chunk) body[name] = [...versionsByName.get(name)];
    const response = await fetch(BULK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`bulk advisory endpoint أعاد ${response.status}`);
    }
    const advisories = await response.json();
    for (const [name, list] of Object.entries(advisories)) {
      for (const advisory of list) {
        const affected = [...versionsByName.get(name)].filter((version) =>
          satisfiesRange(version, advisory.vulnerable_versions ?? "*"),
        );
        if (affected.length > 0) {
          findings.push({
            name,
            affected,
            severity: advisory.severity,
            title: advisory.title,
            url: advisory.url,
            range: advisory.vulnerable_versions,
          });
        }
      }
    }
  }
  return findings;
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockText = readFileSync(join(rootDir, "pnpm-lock.yaml"), "utf8");
const versionsByName = parseLockfilePackages(lockText);
if (versionsByName.size < 50) {
  console.error(
    `عدد الحزم المستخرجة (${versionsByName.size}) أقل من المتوقع — تحقق من صيغة اللوك فايل.`,
  );
  process.exit(1);
}

const findings = await queryAdvisories(versionsByName);
if (findings.length === 0) {
  console.log(`✅ لا ثغرات معروفة في ${versionsByName.size} حزمة (npm bulk advisories).`);
  process.exit(0);
}

console.error(`🚨 ${findings.length} ثغرة تطابق نسخاً مثبتة:\n`);
for (const finding of findings) {
  console.error(
    `- ${finding.name}@${finding.affected.join(", ")} [${finding.severity}] ${finding.title}\n  النطاق المصاب: ${finding.range}\n  ${finding.url}`,
  );
}
process.exit(1);
