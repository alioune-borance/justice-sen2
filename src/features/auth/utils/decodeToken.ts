export interface DecodedToken {
  preferred_username: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  exp: number;
}

// Renvoie null si le token n'est pas un JWT (ex: token opaque type DRF utilisé en local sans Keycloak).
export const decodeToken = (token: string): DecodedToken | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const decoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};
