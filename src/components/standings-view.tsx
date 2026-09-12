"use client";

import type { ReactNode } from "react";
import { ListOrdered } from "lucide-react";
import { calculateGroupStandings, sortStandings } from "@/lib/league";
import type { CategoryData } from "@/lib/types";

const podium = [
  {
    bg: "from-amber-500 to-yellow-600",
    text: "text-amber-100",
    border: "border-yellow-400",
    badge: "🥇 1위",
  },
  {
    bg: "from-slate-400 to-slate-600",
    text: "text-slate-100",
    border: "border-slate-300",
    badge: "🥈 2위",
  },
  {
    bg: "from-amber-700 to-amber-900",
    text: "text-amber-200",
    border: "border-amber-600",
    badge: "🥉 3위",
  },
];

export function StandingsView({
  category,
  selectedGroup,
  onSelectGroup,
}: {
  category: CategoryData;
  selectedGroup: string;
  onSelectGroup: (id: string) => void;
}) {
  const activeGroups =
    selectedGroup === "ALL"
      ? category.groups
      : category.groups.filter((group) => group.id === selectedGroup);

  const combined = sortStandings(
    activeGroups.flatMap((group) =>
      calculateGroupStandings(group, category.linkMatches),
    ),
  );
  const top3 = combined.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="custom-scrollbar flex items-center space-x-2 overflow-x-auto border-b border-slate-200 pb-2">
        <FilterPill
          active={selectedGroup === "ALL"}
          onClick={() => onSelectGroup("ALL")}
        >
          전체 조
        </FilterPill>
        {category.groups.map((group) => (
          <FilterPill
            key={group.id}
            active={selectedGroup === group.id}
            onClick={() => onSelectGroup(group.id)}
          >
            {group.name}
          </FilterPill>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {top3.length === 0 ? (
          <div className="col-span-3 py-4 text-center text-xs text-slate-400">
            등록된 팀이 없거나 매치 데이터가 부족합니다.
          </div>
        ) : (
          top3.map((team, index) => {
            const style = podium[index];
            return (
              <div
                key={`${team.groupId}-${team.team}`}
                className={`flex items-center justify-between rounded-2xl border bg-gradient-to-br p-4 text-white shadow-md ${style.bg} ${style.border}`}
              >
                <div>
                  <span
                    className={`rounded-full bg-black/20 px-2 py-0.5 text-xs font-bold ${style.text}`}
                  >
                    {team.groupName ? `${team.groupName} ` : ""}
                    {style.badge}
                  </span>
                  <h4 className="mt-1 text-xl font-black">{team.team}</h4>
                  <p className="mt-1 text-xs text-white/80">
                    {team.played}전 {team.wins}승 {team.losses}패 (세트득실{" "}
                    {team.setDiff > 0 ? `+${team.setDiff}` : team.setDiff})
                  </p>
                </div>
                <div className="text-2xl font-black opacity-80">
                  #{index + 1}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-6">
        {activeGroups.map((group) => {
          const standings = calculateGroupStandings(
            group,
            category.linkMatches,
          );
          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <ListOrdered className="h-4 w-4 text-indigo-600" />{" "}
                    {group.name} 예선 순위표
                  </h3>
                  <p className="text-xs text-slate-500">
                    순위 기준: 승(승점) &gt; 세트득실차 &gt; 점수득실차 &gt; 총
                    득점
                  </p>
                </div>
                <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {group.name} 팀 수: {group.teams.length}개
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[11px] sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-extrabold tracking-normal text-slate-600 sm:text-xs sm:tracking-wider">
                      <th className="w-10 px-1.5 py-2 text-center sm:w-16 sm:px-4 sm:py-3.5">순위</th>
                      <th className="px-1.5 py-2 sm:px-4 sm:py-3.5">학급</th>
                      <th className="px-1 py-2 text-center sm:px-3 sm:py-3.5">경기수</th>
                      <th className="px-1 py-2 text-center text-emerald-700 sm:px-3 sm:py-3.5">
                        승
                      </th>
                      <th className="px-1 py-2 text-center text-rose-600 sm:px-3 sm:py-3.5">
                        패
                      </th>
                      <th className="px-1 py-2 text-center whitespace-nowrap sm:px-3 sm:py-3.5">세트득실</th>
                      <th className="px-1 py-2 text-center font-bold whitespace-nowrap sm:px-3 sm:py-3.5">
                        득실차
                      </th>
                      <th className="hidden px-3 py-3.5 text-center sm:table-cell">
                        점수 득/실
                      </th>
                      <th className="hidden px-3 py-3.5 text-center font-bold sm:table-cell">
                        점수득실차
                      </th>
                      <th className="px-1.5 py-2 text-center sm:px-4 sm:py-3.5">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-4 text-center text-xs text-slate-400"
                        >
                          팀이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      standings.map((row, index) => {
                        const rank = index + 1;
                        const top2 = rank <= 2;
                        return (
                          <tr
                            key={row.team}
                            className={
                              top2
                                ? "bg-indigo-50/30 hover:bg-indigo-50/60"
                                : "hover:bg-slate-50"
                            }
                          >
                            <td className="px-1.5 py-2 text-center sm:px-4 sm:py-3.5">
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black sm:h-6 sm:w-6 sm:text-xs ${
                                  rank === 1
                                    ? "bg-amber-100 text-amber-700"
                                    : rank <= 2
                                      ? "bg-indigo-100 text-indigo-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {rank}
                              </span>
                            </td>
                            <td className="px-1.5 py-2 font-extrabold whitespace-nowrap text-slate-800 sm:px-4 sm:py-3.5">
                              {row.team}
                            </td>
                            <td className="px-1 py-2 text-center font-medium sm:px-3 sm:py-3.5">
                              {row.played}
                            </td>
                            <td className="px-1 py-2 text-center font-bold text-emerald-600 sm:px-3 sm:py-3.5">
                              {row.wins}
                            </td>
                            <td className="px-1 py-2 text-center font-bold text-rose-500 sm:px-3 sm:py-3.5">
                              {row.losses}
                            </td>
                            <td className="px-1 py-2 text-center font-medium whitespace-nowrap text-slate-600 sm:px-3 sm:py-3.5">
                              {row.setsWon}/{row.setsLost}
                            </td>
                            <td
                              className={`px-1 py-2 text-center font-bold whitespace-nowrap sm:px-3 sm:py-3.5 ${
                                row.setDiff > 0
                                  ? "text-emerald-600"
                                  : row.setDiff < 0
                                    ? "text-rose-500"
                                    : "text-slate-600"
                              }`}
                            >
                              {row.setDiff > 0
                                ? `+${row.setDiff}`
                                : row.setDiff}
                            </td>
                            <td className="hidden px-3 py-3.5 text-center whitespace-nowrap text-slate-500 sm:table-cell">
                              {row.ptsWon}/{row.ptsLost}
                            </td>
                            <td
                              className={`hidden px-3 py-3.5 text-center font-bold whitespace-nowrap sm:table-cell ${
                                row.ptDiff > 0
                                  ? "text-emerald-600"
                                  : row.ptDiff < 0
                                    ? "text-rose-500"
                                    : "text-slate-600"
                              }`}
                            >
                              {row.ptDiff > 0 ? `+${row.ptDiff}` : row.ptDiff}
                            </td>
                            <td className="px-1.5 py-2 text-center sm:px-4 sm:py-3.5">
                              {top2 ? (
                                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 sm:px-2 sm:text-[11px]">
                                  본선권
                                </span>
                              ) : (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:px-2 sm:text-[11px]">
                                  예선
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
