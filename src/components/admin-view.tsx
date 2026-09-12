"use client";

import {
  ArrowDown,
  ArrowUp,
  Database,
  Download,
  FolderPlus,
  GraduationCap,
  Info,
  Key,
  Layers,
  Lock,
  Network,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  Upload,
  Users,
  X,
} from "lucide-react";
import { sportIcon, sportLabel } from "@/lib/league";
import type { GradeSports, Sport, TeamGroup } from "@/lib/types";

function previewLinkMatches(teams: string[]) {
  const names = teams.map((team) => team.trim()).filter(Boolean);
  if (names.length < 2) return [];
  if (names.length === 2) return [`${names[0]} vs ${names[1]}`];
  return names.map((team, index) => `${team} vs ${names[(index + 1) % names.length]}`);
}

export function AdminView({
  isAdmin,
  currentGrade,
  currentSport,
  gradeSports,
  groups,
  onLogin,
  onSelectGrade,
  onChangeGroups,
  onRegenerate,
  onExport,
  onImport,
  onReset,
}: {
  isAdmin: boolean;
  currentGrade: number;
  currentSport: Sport;
  gradeSports: GradeSports;
  groups: TeamGroup[];
  onLogin: () => void;
  onSelectGrade: (grade: 1 | 2 | 3) => void;
  onChangeGroups: (groups: TeamGroup[]) => void;
  onRegenerate: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}) {
  if (!isAdmin) {
    return (
      <section className="space-y-6">
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-amber-900 sm:text-lg">관리자 권한이 필요합니다</h3>
          <p className="mx-auto max-w-md text-xs text-amber-700 sm:text-sm">
            조 분할, 링크 순서(a, b, c, d) 지정, 경기일자 설정 및 경기점수 수정은 관리자 PIN 번호 인증 후 가능합니다.
          </p>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-700 active:scale-95"
          >
            <Key className="h-4 w-4" /> 관리자 로그인
          </button>
        </div>
      </section>
    );
  }

  const updateGroup = (index: number, next: TeamGroup) => {
    onChangeGroups(groups.map((group, groupIndex) => (groupIndex === index ? next : group)));
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Layers className="h-4 w-4 text-indigo-600" /> 학년별 종목
            </h3>
            <p className="text-xs text-slate-500">1학년은 얼티미트, 2·3학년은 배구로 고정되어 있습니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {([1, 2, 3] as const).map((grade) => {
            const sport = gradeSports[grade];
            return (
              <div
                key={grade}
                className={`space-y-2 rounded-xl border p-4 ${
                  sport === "ultimate"
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    <GraduationCap className="mr-1 inline h-4 w-4 text-indigo-600" /> {grade}학년
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-extrabold text-white ${
                      sport === "ultimate" ? "bg-indigo-600" : "bg-amber-600"
                    }`}
                  >
                    {sportIcon(sport)} {sportLabel(sport)}
                  </span>
                </div>
                <p className="pt-1 text-xs font-bold text-slate-500">종목 변경 불가</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Network className="h-4 w-4 text-indigo-600" /> {currentGrade}학년 조 나누기 · 대진 순서
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              1·2·3학년 조는 각각 따로 저장됩니다. 위에서 학년을 고른 뒤 그 학년만 수정하세요.
              <br />
              <span className="font-semibold text-slate-700">조</span>는 같은 학년 안에서 팀을 묶는 그룹입니다. A조끼리만 예선하고, B조끼리만 예선합니다.
              <br />
              <span className="font-semibold text-slate-700">대진 순서</span>는 그 조 안에서 누가 누구와 도는지를 말합니다. 1번➔2번➔3번➔4번➔다시 1번.
            </p>
          </div>
          <button
            onClick={() => {
              const letter = String.fromCharCode(65 + groups.length);
              onChangeGroups([
                ...groups,
                { id: `group_${Date.now()}`, name: `${letter}조`, teams: ["1반", "2반", "3반"] },
              ]);
            }}
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
          >
            <FolderPlus className="mr-1 inline h-3.5 w-3.5" /> 조 추가
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((grade) => {
            const sport = gradeSports[grade];
            const active = currentGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => onSelectGrade(grade)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  active
                    ? sport === "ultimate"
                      ? "border-indigo-700 bg-indigo-600 text-white shadow-sm"
                      : "border-amber-700 bg-amber-600 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <p className="text-sm font-extrabold">{grade}학년</p>
                <p className={`text-[11px] font-bold ${active ? "text-white/90" : "text-slate-400"}`}>
                  {sportIcon(sport)} {sportLabel(sport)} 조 편집
                </p>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800">
          지금 편집 중: {currentGrade}학년 {sportLabel(currentSport)} · 다른 학년 조는 그대로 유지됩니다.
        </div>

        <div className="space-y-6">
          {groups.map((group, groupIndex) => {
            const matchPreview = previewLinkMatches(group.teams);
            return (
            <div key={group.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <input
                    type="text"
                    value={group.name}
                    onChange={(event) => updateGroup(groupIndex, { ...group, name: event.target.value })}
                    className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-sm font-extrabold text-slate-800"
                  />
                  <span className="text-xs font-medium text-slate-500">(팀 {group.teams.length}개)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateGroup(groupIndex, {
                        ...group,
                        teams: [...group.teams, `${group.teams.length + 1}반`],
                      })
                    }
                    className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 transition-all hover:bg-indigo-200"
                  >
                    <Plus className="mr-1 inline h-3 w-3" /> 팀 추가
                  </button>
                  {groups.length > 1 ? (
                    <button
                      onClick={() => onChangeGroups(groups.filter((_, index) => index !== groupIndex))}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-rose-500 hover:bg-rose-100"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" /> 조 삭제
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/70 p-2.5 text-[11px] text-indigo-900">
                <p>
                  <Info className="mr-1 inline h-3 w-3 text-indigo-600" />
                  위아래 화살표로 순서를 바꾸면 대진이 바뀝니다.
                </p>
                {matchPreview.length ? (
                  <p className="font-semibold">이 순서면 경기: {matchPreview.join(" · ")}</p>
                ) : (
                  <p>팀을 2개 이상 넣으면 대진이 미리 보입니다.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.teams.map((team, teamIndex) => (
                  <div
                    key={`${group.id}-${teamIndex}`}
                    className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-black text-indigo-700">
                      {teamIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={team}
                      onChange={(event) => {
                        const teams = [...group.teams];
                        teams[teamIndex] = event.target.value;
                        updateGroup(groupIndex, { ...group, teams });
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={teamIndex === 0}
                        onClick={() => {
                          const teams = [...group.teams];
                          [teams[teamIndex - 1], teams[teamIndex]] = [teams[teamIndex], teams[teamIndex - 1]];
                          updateGroup(groupIndex, { ...group, teams });
                        }}
                        className={
                          teamIndex === 0
                            ? "cursor-not-allowed p-1 text-slate-400 opacity-30"
                            : "rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        }
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        disabled={teamIndex === group.teams.length - 1}
                        onClick={() => {
                          const teams = [...group.teams];
                          [teams[teamIndex + 1], teams[teamIndex]] = [teams[teamIndex], teams[teamIndex + 1]];
                          updateGroup(groupIndex, { ...group, teams });
                        }}
                        className={
                          teamIndex === group.teams.length - 1
                            ? "cursor-not-allowed p-1 text-slate-400 opacity-30"
                            : "rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        }
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (group.teams.length <= 2) return;
                          updateGroup(groupIndex, {
                            ...group,
                            teams: group.teams.filter((_, index) => index !== teamIndex),
                          });
                        }}
                        className="ml-1 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-500">
            <TriangleAlert className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
            팀 순서 변경 후 [링크제 대진 생성 및 반영]을 눌러야 경기표가 업데이트됩니다.
          </span>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 링크제 대진 자동 생성 및 저장
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-bold text-slate-800">
          <Database className="h-4 w-4 text-slate-600" /> 데이터 백업 및 초기화
        </h3>
        <p className="text-xs text-slate-500">
          엑셀 한 파일에 <span className="font-bold text-slate-700">1학년 / 2학년 / 3학년</span> 시트가 따로 들어갑니다.
          각 시트는 그 학년의 대표 종목 조·예선·본선·순위입니다. 복원은 기존 JSON 파일만 가능합니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" /> 데이터 백업 (엑셀)
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-200">
            <Upload className="h-3.5 w-3.5" /> 데이터 복원 (JSON 가져오기)
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
          </label>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> 현재 학년/종목 데이터 초기화
          </button>
        </div>
      </div>
    </section>
  );
}
