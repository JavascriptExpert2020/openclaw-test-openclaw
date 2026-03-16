import type { OpenClawConfig } from "../../config/config.js";
import {
  loadWorkspaceSkillEntries,
  resolveSkillConfig,
  type SkillEntry,
  type SkillSnapshot,
} from "../skills.js";

function snapshotHasDisabledSkills(
  snapshot?: SkillSnapshot,
  config?: OpenClawConfig,
): boolean {
  if (!snapshot?.skills?.length || !config?.skills?.entries) {
    return false;
  }
  return snapshot.skills.some(
    (skill) => resolveSkillConfig(config, skill.name)?.enabled === false,
  );
}

export function resolveEmbeddedRunSkillEntries(params: {
  workspaceDir: string;
  config?: OpenClawConfig;
  skillsSnapshot?: SkillSnapshot;
}): {
  shouldLoadSkillEntries: boolean;
  skillEntries: SkillEntry[];
} {
  const shouldLoadSkillEntries =
    !params.skillsSnapshot ||
    !params.skillsSnapshot.resolvedSkills ||
    snapshotHasDisabledSkills(params.skillsSnapshot, params.config);
  return {
    shouldLoadSkillEntries,
    skillEntries: shouldLoadSkillEntries
      ? loadWorkspaceSkillEntries(params.workspaceDir, { config: params.config })
      : [],
  };
}
