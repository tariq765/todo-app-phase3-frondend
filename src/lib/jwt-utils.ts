/**
 * Utility functions for handling JWT tokens
 */

/**
 * Decode a JWT token to extract its payload
 * @param token The JWT token string
 * @returns The decoded payload or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    // Split the JWT token (header.payload.signature) and decode the payload
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;

    // JWT payloads are base64url encoded, so we need to convert them
    const payload = tokenParts[1];
    // Replace URL-safe base64 characters with standard base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const pad = base64.length % 4;
    const paddedBase64 = pad === 0 ? base64 : base64 + '='.repeat(4 - pad);

    const decodedPayload = atob(paddedBase64);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Extract the user ID from a JWT token
 * @param token The JWT token string
 * @returns The user ID from the token or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  // Return the subject (user ID) from the token payload
  return payload.sub || payload.user_id || null;
}