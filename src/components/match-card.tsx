"use client";

import { Calendar, CalendarDays, Crown, RotateCcw } from "lucide-react";
import { calculateMatchResult } from "@/lib/league";
import type { MatchRecord } from "@/lib/types";

export function MatchCard({
  match,
  index,
  isAdmin,
  isFinal,
  onDateChange,
  onScoreChange,
  onTeamChange,
  onToggleStatus,
  onReset,
}: {
  match: MatchRecord;
  index?: number;
  isAdmin: boolean;
  isFinal?: boolean;
  onDateChange: (date: string) => void;
  onScoreChange: (field: "s1A" | "s1B" | "s2A" | "s2B" | "s3A" | "s3B", value: number) => void;
  onTeamChange?: (side: "teamA" | "teamB", value: string) => void;
  onToggleStatus: () => void;
  onReset: () => void;
}) {
  const result = calculateMatchResult(match);
  const finished = match.status === "completed";

  return (
    <div
      className={
        isFinal
          ? "space-y-4"
          : "space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      }
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
          isFinal ? "border-amber-200/60" : "border-slate-100"
        }`}
      >
        <div className="flex items-center space-x-2">
          {isFinal ? (
            <span
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${
                match.id === "final"
                  ? "bg-amber-500 font-black text-white"
                  : "bg-indigo-100 font-extrabold text-indigo-800"
              }`}
            >
              {match.id === "final" ? <Crown className="h-3.5 w-3.5 text-yellow-200" /> : null}
              {match.name || "본선 경기"}
            </span>
          ) : (
            <>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {match.groupName || "예선"}
              </span>
              <span className="text-xs font-bold text-slate-500">경기 #{(index || 0) + 1}</span>
            </>
          )}

          {isAdmin ? (
            <div className="flex items-center space-x-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
              <input
                type="date"
                value={match.date || ""}
                onChange={(event) => onDateChange(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          ) : match.date ? (
            <span className="flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">
              <CalendarDays className="h-3.5 w-3.5" /> {match.date}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> 일정 미정
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            finished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {finished ? (isFinal ? "경기 완료" : "경기 종료") : isFinal ? "진행 예정" : "대기 중"}
        </span>
      </div>

      {isFinal ? (
        <div className="mt-1 grid grid-cols-2 gap-4 text-center">
          {(["A", "B"] as const).map((side) => {
            const won = finished && result.winner === side;
            const lost = finished && result.winner && result.winner !== side;
            return (
              <div
                key={side}
                className={`relative rounded-xl p-2.5 transition-all ${
                  won
                    ? "border-2 border-indigo-400 bg-indigo-50 shadow-sm ring-2 ring-indigo-200 ring-offset-1"
                    : lost
                      ? "relative border border-slate-100 bg-slate-50 opacity-50"
                      : "border border-slate-100 bg-slate-50"
                }`}
              >
                {won ? (
                  <div className="absolute -top-2 -right-2 rotate-12 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                    승리
                  </div>
                ) : null}
                {lost ? (
                  <div className="absolute -top-2 -right-2 rounded-full bg-slate-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                    패배
                  </div>
                ) : null}
                {isAdmin && onTeamChange ? (
                  <input
                    type="text"
                    value={side === "A" ? match.teamA : match.teamB}
                    onChange={(event) => onTeamChange(side === "A" ? "teamA" : "teamB", event.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-1 py-1 text-center text-sm font-bold"
                  />
                ) : (
                  <h5 className={`text-sm font-extrabold ${won ? "text-indigo-600" : "text-slate-800"}`}>
                    {side === "A" ? match.teamA : match.teamB}
                  </h5>
                )}
                <span className="mt-1 block text-[11px] font-bold text-slate-400">
                  획득 세트: {side === "A" ? result.setsA : result.setsB}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between text-center">
          <div className="w-2/5">
            <h4 className={`text-lg font-black ${result.winner === "A" ? "text-indigo-600" : "text-slate-800"}`}>
              {match.teamA}
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              세트 획득: <span className="font-bold text-slate-700">{result.setsA}</span>
            </p>
          </div>
          <div className="flex w-1/5 flex-col items-center">
            <span className="text-2xl font-black text-slate-800">
              {result.setsA} : {result.setsB}
            </span>
            <span className="mt-0.5 text-[10px] tracking-widest text-slate-400 uppercase">SETS</span>
          </div>
          <div className="w-2/5">
            <h4 className={`text-lg font-black ${result.winner === "B" ? "text-indigo-600" : "text-slate-800"}`}>
              {match.teamB}
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              세트 획득: <span className="font-bold text-slate-700">{result.setsB}</span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
        {([1, 2, 3] as const).map((set) => {
          const aKey = `s${set}A` as const;
          const bKey = `s${set}B` as const;
          const a = match[aKey];
          const b = match[bKey];
          return (
            <div key={set} className="flex items-center justify-between text-xs">
              <span className="w-16 font-bold text-slate-500">{set}세트</span>
              <div className="flex flex-1 items-center justify-center space-x-2">
                {isAdmin ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      value={a}
                      onChange={(event) => onScoreChange(aKey, Number(event.target.value) || 0)}
                      className="w-12 rounded border bg-white py-1 text-center font-bold text-slate-800"
                    />
                    <span className="text-slate-400">:</span>
                    <input
                      type="number"
                      min={0}
                      value={b}
                      onChange={(event) => onScoreChange(bKey, Number(event.target.value) || 0)}
                      className="w-12 rounded border bg-white py-1 text-center font-bold text-slate-800"
                    />
                  </>
                ) : (
                  <>
                    <span className={`text-sm font-extrabold ${a > b ? "text-indigo-600" : "text-slate-700"}`}>{a}</span>
                    <span className="text-slate-300">-</span>
                    <span className={`text-sm font-extrabold ${b > a ? "text-indigo-600" : "text-slate-700"}`}>{b}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin ? (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleStatus}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              finished
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {finished ? "진행 중으로 변경" : "경기 완료 처리"}
          </button>
          <button onClick={onReset} className="flex items-center text-xs font-medium text-slate-400 hover:text-rose-500">
            <RotateCcw className="mr-1 h-3 w-3" /> 점수 초기화
          </button>
        </div>
      ) : null}
    </div>
  );
}
