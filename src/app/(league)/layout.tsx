import type { ReactNode } from "react";
import { LeagueApp } from "@/components/league-app";

export default function LeagueLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LeagueApp />
      {children}
    </>
  );
}
