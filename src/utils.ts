export type AuthInfo = {
  i_like_gitea: string;
};

export function cookieToString(cookie: Record<string, string>) {
  return Object.entries(cookie).map(([k, v]) => `${k}=${v}`).join("; ");
}

export function parseSetCookie(cookie: string[]): Record<string, string> {
  return Object.fromEntries(cookie.map((c) => c.split(";")[0].split("=")));
}
