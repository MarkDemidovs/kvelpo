/**
 * Current versions of the legal documents users must accept to use kvelpo.
 * Bump a number when the matching document changes materially and every user
 * is asked to accept again (anyone whose stored version is lower is gated).
 *
 * v1 was recorded implicitly by the cookie banner, so v2 is the first version
 * users accept explicitly through the terms gate.
 * v3 (2026-10-28): paid plans and Boost terms, direct messages, project view insights.
 */
export const TERMS_VERSION = 3;
export const PRIVACY_VERSION = 3;

/** Pages that stay readable while the terms gate is up. */
export const LEGAL_PATHS = ["/terms", "/privacy", "/cookies", "/data-retention", "/consent"] as const;
