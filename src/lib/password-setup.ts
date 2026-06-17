import crypto from 'crypto';

const PASSWORD_SETUP_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export function createPasswordSetupToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_SETUP_TOKEN_TTL_MS);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

export function hashPasswordSetupToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
