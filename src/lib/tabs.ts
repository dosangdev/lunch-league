import type { TabId } from "./types";

export const TAB_HREF: Record<TabId, string> = {
  standings: "/",
  links: "/links",
  finals: "/finals",
  admin: "/admin",
};

export const TAB_BY_PATH: Record<string, TabId> = {
  "/": "standings",
  "/links": "links",
  "/finals": "finals",
  "/admin": "admin",
};

export function tabFromPath(pathname: string): TabId {
  return TAB_BY_PATH[pathname] || "standings";
}
