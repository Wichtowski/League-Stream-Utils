import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";

const ALGORITHM = "HS256";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  sessionId: string;
  type: "access" | "refresh";
  impersonatedBy?: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function generateTokens(payload: Omit<TokenPayload, "type">) {
  const secret = getSecret();

  const accessToken = await new SignJWT({ ...payload, type: "access" as const })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);

  const refreshToken = await new SignJWT({ ...payload, type: "refresh" as const })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);

  return { accessToken, refreshToken };
}

export async function verifyToken(
  token: string,
  expectedType: "access" | "refresh",
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const data = payload as JoseJWTPayload & TokenPayload;
    if (data.type !== expectedType) return null;

    return {
      userId: data.userId,
      username: data.username,
      isAdmin: data.isAdmin,
      sessionId: data.sessionId,
      type: data.type,
      impersonatedBy: data.impersonatedBy,
    };
  } catch {
    return null;
  }
}

export async function generateAccessToken(payload: Omit<TokenPayload, "type">) {
  const secret = getSecret();

  return new SignJWT({ ...payload, type: "access" as const })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}
