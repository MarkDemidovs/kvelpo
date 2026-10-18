/**
 * Current versions of the legal documents users must accept to use kvelpo.
 * Bump a number when the matching document changes materially and every user
 * is asked to accept again (anyone whose stored version is lower is gated).
 *
 * v1 was recorded implicitly by the cookie banner, so v2 is the first version
 * users accept explicitly through the terms gate.
 */
export const TERMS_VERSION = 2;
export const PRIVACY_VERSION = 2;

/** Pages that stay readable while the terms gate is up. */
export const LEGAL_PATHS = ["/terms", "/privacy", "/cookies", "/data-retention", "/consent"] as const;
