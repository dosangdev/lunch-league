import { cookies } from "next/headers";

const COOKIE_NAME = "league_admin";

function sessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || "lunch-league-admin";
}

export function getAdminPin() {
  return process.env.ADMIN_PIN || "899196";
}

export async function isAdmin() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === sessionToken();
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
