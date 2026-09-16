import { SignJWT, jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not configured");
}

const encodedKey = new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "HR_MANAGER" | "EMPLOYEE";
};

export async function createSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}