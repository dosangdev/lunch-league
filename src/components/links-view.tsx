"use client";

import { ArrowRight, Info, RotateCcw } from "lucide-react";
import { MatchCard } from "./match-card";
import type { CategoryData, MatchRecord } from "@/lib/types";

export function LinksView({
  category,
  selectedGroup,
  isAdmin,
  onSelectGroup,
  onUpdateMatch,
  onResetMatch,
}: {
  category: CategoryData;
  selectedGroup: string;
  isAdmin: boolean;
  onSelectGroup: (id: string) => void;
  onUpdateMatch: (matchId: string, fields: Partial<MatchRecord>) => void;
  onResetMatch: (matchId: string) => void;
}) {
  const activeGroups =
    selectedGroup === "ALL" ? category.groups : category.groups.filter((group) => group.id === selectedGroup);
  const matches =
    selectedGroup === "ALL"
      ? category.linkMatches
      : category.linkMatches.filter((match) => match.groupId === selectedGroup);

  return (
    <section className="space-y-6">
      <div className="space-y-3 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-950 p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-700/50 pb-2">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-indigo-500 px-2.5 py-0.5 text-xs font-extrabold text-white">순환 대진</span>
            <h3 className="text-sm font-bold sm:text-base">조별 링크제 대진 시각화 (Chain Flow)</h3>
          </div>
          <span className="text-xs text-indigo-200">지정된 팀 순서에 따라 순환 매칭됩니다.</span>
        </div>
        <div className="space-y-3 pt-1">
          {activeGroups.map((group) => {
            const teams = group.teams.filter((team) => team.trim());
            return (
              <div key={group.id} className="space-y-1.5 rounded-xl border border-indigo-800/60 bg-indigo-950/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span>{group.name} 순환 체인 (a ➔ b ➔ c ➔ d ... ➔ a)</span>
                </div>
                <div className="custom-scrollbar flex flex-wrap items-center gap-2 overflow-x-auto py-1">
                  {teams.length === 0 ? (
                    <span className="text-xs text-indigo-300/60">팀이 설정되지 않았습니다.</span>
                  ) : (
                    teams.map((team, index) => (
                      <div key={`${group.id}-${team}-${index}`} className="contents">
                        <div className="link-node flex items-center rounded-xl border border-indigo-500/40 bg-indigo-800/80 px-3 py-1.5 text-xs font-extrabold text-indigo-100">
                          <span className="mr-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white">
                            {index + 1}
                          </span>
                          <span>{team}</span>
                        </div>
                        {index < teams.length - 1 ? (
                          <div className="text-xs font-bold text-indigo-400">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                  {teams.length >= 3 ? (
                    <>
                      <div className="text-xs font-bold text-indigo-400">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center rounded-xl border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                        <RotateCcw className="mr-1 h-3 w-3" /> (1번 {teams[0]} 순환)
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="custom-scrollbar flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => onSelectGroup("ALL")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap ${
              selectedGroup === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            전체 조
          </button>
          {category.groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                selectedGroup === group.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
        <div className="whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
          <Info className="mr-1 inline h-3.5 w-3.5" /> 관리자 로그인 시 경기일자 설정, 점수 수정 및 경기 추가 가능
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {matches.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-sm text-slate-400">
            생성된 예선 경기가 없습니다. 대회 관리 페이지에서 링크제 대진을 생성해 주세요.
          </div>
        ) : (
          matches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              index={index}
              isAdmin={isAdmin}
              onDateChange={(date) => onUpdateMatch(match.id, { date })}
              onScoreChange={(field, value) => onUpdateMatch(match.id, { [field]: value })}
              onToggleStatus={() =>
                onUpdateMatch(match.id, { status: match.status === "completed" ? "pending" : "completed" })
              }
              onReset={() => onResetMatch(match.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
