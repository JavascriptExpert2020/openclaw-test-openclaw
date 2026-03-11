import type { SecretRef } from "../config/types.secrets.js";
import { normalizeSecretInput } from "../utils/normalize-secret-input.js";
import type { AuthProfileCredential, AuthProfileStore } from "./auth-profiles.js";
import { normalizeProviderId } from "./model-selection.js";

export type PiApiKeyCredential = { type: "api_key"; key: string };
export type PiOAuthCredential = {
  type: "oauth";
  access: string;
  refresh: string;
  expires: number;
};

export type PiCredential = PiApiKeyCredential | PiOAuthCredential;
export type PiCredentialMap = Record<string, PiCredential>;

function resolveEnvSecretRef(ref?: SecretRef): string | undefined {
  if (!ref || ref.source !== "env") {
    return undefined;
  }
  const value = normalizeSecretInput(process.env[ref.id]);
  return value ? value : undefined;
}

export function convertAuthProfileCredentialToPi(cred: AuthProfileCredential): PiCredential | null {
  if (cred.type === "api_key") {
    const key = normalizeSecretInput(cred.key);
    const resolved = key || resolveEnvSecretRef(cred.keyRef);
    if (!resolved) {
      return null;
    }
    return { type: "api_key", key: resolved };
  }

  if (cred.type === "token") {
    const token = normalizeSecretInput(cred.token);
    const resolved = token || resolveEnvSecretRef(cred.tokenRef);
    if (!resolved) {
      return null;
    }
    if (
      typeof cred.expires === "number" &&
      Number.isFinite(cred.expires) &&
      Date.now() >= cred.expires
    ) {
      return null;
    }
    return { type: "api_key", key: resolved };
  }

  if (cred.type === "oauth") {
    const access = typeof cred.access === "string" ? cred.access.trim() : "";
    const refresh = typeof cred.refresh === "string" ? cred.refresh.trim() : "";
    if (!access || !refresh || !Number.isFinite(cred.expires) || cred.expires <= 0) {
      return null;
    }
    return {
      type: "oauth",
      access,
      refresh,
      expires: cred.expires,
    };
  }

  return null;
}

export function resolvePiCredentialMapFromStore(store: AuthProfileStore): PiCredentialMap {
  const credentials: PiCredentialMap = {};
  for (const credential of Object.values(store.profiles)) {
    const provider = normalizeProviderId(String(credential.provider ?? "")).trim();
    if (!provider || credentials[provider]) {
      continue;
    }
    const converted = convertAuthProfileCredentialToPi(credential);
    if (converted) {
      credentials[provider] = converted;
    }
  }
  return credentials;
}

export function piCredentialsEqual(a: PiCredential | undefined, b: PiCredential): boolean {
  if (!a || typeof a !== "object") {
    return false;
  }
  if (a.type !== b.type) {
    return false;
  }

  if (a.type === "api_key" && b.type === "api_key") {
    return a.key === b.key;
  }

  if (a.type === "oauth" && b.type === "oauth") {
    return a.access === b.access && a.refresh === b.refresh && a.expires === b.expires;
  }

  return false;
}
