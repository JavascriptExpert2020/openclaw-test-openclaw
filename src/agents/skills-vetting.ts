import path from "node:path";
import { scanDirectoryWithSummary } from "../security/skill-scanner.js";
import type { SkillEntry } from "./skills/types.js";

export type SkillVettingResult = {
  ok: boolean;
  warnings: string[];
  blockReason?: string;
};

function formatScanFindingDetail(
  rootDir: string,
  finding: { message: string; file: string; line: number },
): string {
  const relativePath = path.relative(rootDir, finding.file);
  const filePath =
    relativePath && relativePath !== "." && !relativePath.startsWith("..")
      ? relativePath
      : path.basename(finding.file);
  return `${finding.message} (${filePath}:${finding.line})`;
}

export async function vetSkillEntry(entry: SkillEntry): Promise<SkillVettingResult> {
  const warnings: string[] = [];
  const skillName = entry.skill.name;
  const skillDir = path.resolve(entry.skill.baseDir);

  try {
    const summary = await scanDirectoryWithSummary(skillDir);
    if (summary.warn > 0) {
      warnings.push(
        `Skill "${skillName}" has ${summary.warn} suspicious code pattern(s). Run "openclaw security audit --deep" for details.`,
      );
    }

    if (summary.critical > 0) {
      const criticalDetails = summary.findings
        .filter((finding) => finding.severity === "critical")
        .map((finding) => formatScanFindingDetail(skillDir, finding))
        .join("; ");
      return {
        ok: false,
        warnings,
        blockReason: `Blocked skill "${skillName}" — dangerous code patterns detected: ${criticalDetails}`,
      };
    }

    return { ok: true, warnings };
  } catch (err) {
    return {
      ok: false,
      warnings,
      blockReason: `Blocked skill "${skillName}" — code safety scan failed (${String(err)}).`,
    };
  }
}
