export interface DecodedToken {
  preferred_username: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  exp: number;
}

export const decodeToken = (token: string): DecodedToken => {
  const payload = token.split(".")[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
};
