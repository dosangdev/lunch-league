"use client";

import { Trophy, WandSparkles } from "lucide-react";
import { MatchCard } from "./match-card";
import type { CategoryData, MatchRecord } from "@/lib/types";

export function FinalsView({
  category,
  isAdmin,
  onUpdateFinal,
  onResetFinal,
  onAutoFill,
}: {
  category: CategoryData;
  isAdmin: boolean;
  onUpdateFinal: (matchId: "sf1" | "sf2" | "final", fields: Partial<MatchRecord>) => void;
  onResetFinal: (matchId: "sf1" | "sf2" | "final") => void;
  onAutoFill: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Trophy className="h-4 w-4 text-amber-500" /> 본선 토너먼트 대진표
          </h3>
          <p className="text-xs text-slate-500">준결승 2경기와 결승전으로 구성되며 경기일자 및 점수를 관리할 수 있습니다.</p>
        </div>
        {isAdmin ? (
          <button
            onClick={onAutoFill}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-all hover:bg-indigo-700 active:scale-95"
          >
            <WandSparkles className="mr-1 inline h-3.5 w-3.5" /> 예선 상위팀 자동 배치
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(["sf1", "sf2"] as const).map((key) => (
          <div key={key} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <MatchCard
              match={category.finals[key]}
              isAdmin={isAdmin}
              isFinal
              onDateChange={(date) => onUpdateFinal(key, { date })}
              onSaveSet={(set, scores) =>
                onUpdateFinal(key, {
                  [`s${set}A`]: scores.a,
                  [`s${set}B`]: scores.b,
                })
              }
              onTeamChange={(side, value) => onUpdateFinal(key, { [side]: value })}
              onToggleStatus={() =>
                onUpdateFinal(key, {
                  status: category.finals[key].status === "completed" ? "pending" : "completed",
                })
              }
              onReset={() => onResetFinal(key)}
            />
          </div>
        ))}
        <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5 shadow-md lg:col-span-2">
          <MatchCard
            match={category.finals.final}
            isAdmin={isAdmin}
            isFinal
            onDateChange={(date) => onUpdateFinal("final", { date })}
            onSaveSet={(set, scores) =>
              onUpdateFinal("final", {
                [`s${set}A`]: scores.a,
                [`s${set}B`]: scores.b,
              })
            }
            onTeamChange={(side, value) => onUpdateFinal("final", { [side]: value })}
            onToggleStatus={() =>
              onUpdateFinal("final", {
                status: category.finals.final.status === "completed" ? "pending" : "completed",
              })
            }
            onReset={() => onResetFinal("final")}
          />
        </div>
      </div>
    </section>
  );
}
