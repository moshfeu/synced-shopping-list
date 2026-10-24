import { SignJWT, jwtVerify } from 'jose';
import { config } from './config';

type TokenType = 'client' | 'authz' | 'code' | 'access' | 'refresh';

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export async function sign(
  type: TokenType,
  payload: Record<string, unknown>,
  expiresIn?: string
) {
  const jwt = new SignJWT({ ...payload, typ: type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();
  if (expiresIn) {
    jwt.setExpirationTime(expiresIn);
  }
  return jwt.sign(config.jwtSecret);
}

/** Resolves to the payload, or null if the token is invalid, expired or of another type. */
export async function verify<T extends Record<string, unknown>>(
  type: TokenType,
  token: string | undefined | null
): Promise<(T & { typ: TokenType }) | null> {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    });
    return payload.typ === type ? (payload as unknown as T & { typ: TokenType }) : null;
  } catch {
    return null;
  }
}
