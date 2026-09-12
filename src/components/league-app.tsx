"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  GraduationCap,
  Lock,
  Medal,
  Network,
  Save,
  SlidersHorizontal,
  Trophy,
  Unlock,
} from "lucide-react";
import {
  autoFillFinals,
  exportLeague,
  fetchLeague,
  importLeague,
  loginAdmin,
  logoutAdmin,
  resetCategory,
  saveGroups,
  saveMatch,
} from "@/lib/api";
import { downloadLeagueExcel } from "@/lib/excel";
import { categoryKey, createInitialCategory, DEFAULT_GRADE_SPORTS, sportIcon, sportLabel } from "@/lib/league";
import { TAB_HREF, tabFromPath } from "@/lib/tabs";
import type {
  AppStateResponse,
  LeaguePayload,
  MatchRecord,
  TabId,
  TeamGroup,
} from "@/lib/types";
import { AdminView } from "./admin-view";
import { AuthModal, ConfirmModal, ToastStack, type ToastTone } from "./feedback";
import { FinalsView } from "./finals-view";
import { LinksView } from "./links-view";
import { StandingsView } from "./standings-view";

const TABS: { id: TabId; label: string; icon: typeof Medal }[] = [
  { id: "standings", label: "순위표", icon: Medal },
  { id: "links", label: "예선전 (링크제)", icon: Network },
  { id: "finals", label: "본선 토너먼트", icon: Award },
  { id: "admin", label: "대회 관리 & 대진 설정", icon: SlidersHorizontal },
];

export function LeagueApp() {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = tabFromPath(pathname);
  const pendingSaves = useRef(new Map<string, Partial<MatchRecord>>());
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [payload, setPayload] = useState<AppStateResponse | null>(null);
  const [currentGrade, setCurrentGrade] = useState<1 | 2 | 3>(1);
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [draftGroups, setDraftGroups] = useState<TeamGroup[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; tone: ToastTone }[]>([]);
  const [loading, setLoading] = useState(true);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const applyPayload = useCallback((next: AppStateResponse, grade = currentGrade) => {
    setPayload(next);
    const sport = next.gradeSports[grade] || DEFAULT_GRADE_SPORTS[grade];
    setDraftGroups(next.data[categoryKey(grade, sport)]?.groups || []);
  }, [currentGrade]);

  const load = useCallback(async () => {
    const next = await fetchLeague();
    setPayload(next);
    const sport = next.gradeSports[1] || DEFAULT_GRADE_SPORTS[1];
    setDraftGroups(next.data[categoryKey(1, sport)]?.groups || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((error: unknown) => {
      toast(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.", "warning");
      setLoading(false);
    });
  }, [load, toast]);

  const currentSport = payload?.gradeSports[currentGrade] || DEFAULT_GRADE_SPORTS[currentGrade];
  const category = useMemo(() => {
    if (!payload) return createInitialCategory(currentGrade, currentSport);
    return payload.data[categoryKey(currentGrade, currentSport)] || createInitialCategory(currentGrade, currentSport);
  }, [payload, currentGrade, currentSport]);

  useEffect(() => {
    if (!payload) return;
    setDraftGroups(payload.data[categoryKey(currentGrade, currentSport)]?.groups || []);
  }, [payload, currentGrade, currentSport]);

  const ask = (title: string, description: string, action: () => void) => {
    setConfirm({ title, description, action });
  };

  const handleAuthClick = async () => {
    if (payload?.isAdmin) {
      const next = await logoutAdmin();
      setPayload((current) => (current ? { ...current, isAdmin: next.ok ? false : current.isAdmin } : current));
      if (currentTab === "admin") router.push("/");
      toast("보기 전용 모드로 전환되었습니다.", "info");
      return;
    }
    setPin("");
    setPinError("");
    setAuthOpen(true);
  };

  const verifyPin = async () => {
    try {
      await loginAdmin(pin);
      setAuthOpen(false);
      setPayload((current) => (current ? { ...current, isAdmin: true } : current));
      router.push("/admin");
      toast("관리자 권한이 활성화되었습니다.", "success");
    } catch (error) {
      setPinError(error instanceof Error ? error.message : "비밀번호가 일치하지 않습니다.");
    }
  };

  const switchGrade = (grade: 1 | 2 | 3) => {
    setCurrentGrade(grade);
    setSelectedGroup("ALL");
  };

  const patchLocalMatch = useCallback(
    (type: "link" | "finals", matchId: string, fields: Partial<MatchRecord>) => {
      setPayload((current) => {
        if (!current) return current;
        const key = categoryKey(currentGrade, currentSport);
        const categoryData = current.data[key];
        if (!categoryData) return current;

        if (type === "link") {
          return {
            ...current,
            data: {
              ...current.data,
              [key]: {
                ...categoryData,
                linkMatches: categoryData.linkMatches.map((match) =>
                  match.id === matchId ? { ...match, ...fields } : match,
                ),
              },
            },
          };
        }

        if (matchId !== "sf1" && matchId !== "sf2" && matchId !== "final") return current;
        return {
          ...current,
          data: {
            ...current.data,
            [key]: {
              ...categoryData,
              finals: {
                ...categoryData.finals,
                [matchId]: { ...categoryData.finals[matchId], ...fields },
              },
            },
          },
        };
      });
    },
    [currentGrade, currentSport],
  );

  const persistMatch = useCallback(
    (type: "link" | "finals", matchId: string, fields: Partial<MatchRecord>, immediate = false) => {
      const key = `${currentGrade}:${currentSport}:${type}:${matchId}`;
      pendingSaves.current.set(key, { ...pendingSaves.current.get(key), ...fields });

      const flush = () => {
        const nextFields = pendingSaves.current.get(key);
        pendingSaves.current.delete(key);
        saveTimers.current.delete(key);
        if (!nextFields) return;
        saveMatch({
          grade: currentGrade,
          sport: currentSport,
          type,
          matchId,
          fields: nextFields,
        }).catch((error: unknown) => {
          toast(error instanceof Error ? error.message : "경기 저장에 실패했습니다.", "warning");
        });
      };

      const existing = saveTimers.current.get(key);
      if (existing) clearTimeout(existing);
      if (immediate) {
        flush();
        return;
      }
      saveTimers.current.set(key, setTimeout(flush, 250));
    },
    [currentGrade, currentSport, toast],
  );

  useEffect(() => {
    return () => {
      saveTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const updateCurrentMatch = (
    type: "link" | "finals",
    matchId: string,
    fields: Partial<MatchRecord>,
    immediate = false,
  ) => {
    if (!payload?.isAdmin) return;
    patchLocalMatch(type, matchId, fields);
    persistMatch(type, matchId, fields, immediate);
  };

  if (loading || !payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
        리그 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-800 antialiased">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-600/30 p-2.5 shadow-inner">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight sm:text-xl">
                학교스포츠클럽 점심리그
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/30 px-2 py-0.5 text-xs font-semibold text-indigo-200">
                  2026 Season
                </span>
              </h1>
              <p className="text-xs text-slate-300">중학교 학년별 독립 종목 & 조별 링크제 운영 시스템</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden items-center space-x-1.5 rounded-full border border-slate-600 bg-slate-700/80 px-3 py-1 text-xs font-medium text-slate-300 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${payload.isAdmin ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`}
              />
              <span>{payload.isAdmin ? "관리자 권한 활성" : "보기 전용 모드"}</span>
            </div>
            <button
              onClick={handleAuthClick}
              className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                payload.isAdmin ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {payload.isAdmin ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              <span>{payload.isAdmin ? "로그아웃" : "관리자 로그인"}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="custom-scrollbar flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="mr-1 text-xs font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
              학년 선택:
            </span>
            {([1, 2, 3] as const).map((grade) => {
              const active = currentGrade === grade;
              const sport = payload.gradeSports[grade];
              return (
                <button
                  key={grade}
                  onClick={() => switchGrade(grade)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs transition-all ${
                    active
                      ? "border-indigo-600 bg-indigo-600 font-extrabold text-white shadow-sm"
                      : "border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{grade}학년</span>
                  <span
                    className={`rounded px-1.5 text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {sportIcon(sport)} {sportLabel(sport)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <nav className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-x-1 sm:gap-x-4">
            {TABS.filter((tab) => tab.id !== "admin" || payload.isAdmin).map((tab) => {
              const Icon = tab.icon;
              const active = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={TAB_HREF[tab.id]}
                  className={`flex items-center space-x-2 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap sm:text-sm ${
                    active
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto mb-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-xl font-bold text-indigo-700">
              {sportIcon(currentSport)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                {currentGrade}학년 - {sportLabel(currentSport)} 리그
              </h2>
              <p className="text-xs text-slate-500">
                조별 링크 대진(A➔B➔C➔D➔A), 경기일자 입력 및 3세트 점수 산출을 지원합니다.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            자동 저장
          </span>
        </div>

        {currentTab === "standings" ? (
          <StandingsView category={category} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />
        ) : null}

        {currentTab === "links" ? (
          <LinksView
            category={category}
            selectedGroup={selectedGroup}
            isAdmin={payload.isAdmin}
            onSelectGroup={setSelectedGroup}
            onUpdateMatch={(matchId, fields) => {
              updateCurrentMatch("link", matchId, fields, Boolean(fields.date || fields.status));
              if (fields.date) toast("경기일자가 저장되었습니다.", "success");
              if (fields.status) {
                toast(`경기 상태가 변경되었습니다. (${fields.status === "completed" ? "종료" : "진행중"})`, "success");
              }
            }}
            onResetMatch={(matchId) =>
              ask("점수 초기화", "이 경기의 모든 세트 점수를 초기화하시겠습니까?", () => {
                updateCurrentMatch("link", matchId, {
                  s1A: 0,
                  s1B: 0,
                  s2A: 0,
                  s2B: 0,
                  s3A: 0,
                  s3B: 0,
                  status: "pending",
                }, true);
                toast("경기 점수가 초기화되었습니다.", "info");
              })
            }
          />
        ) : null}

        {currentTab === "finals" ? (
          <FinalsView
            category={category}
            isAdmin={payload.isAdmin}
            onUpdateFinal={(matchId, fields) => {
              updateCurrentMatch("finals", matchId, fields, Boolean(fields.date || fields.status));
              if (fields.date) toast("경기일자가 저장되었습니다.", "success");
              if (fields.status) {
                toast(`경기 상태가 변경되었습니다. (${fields.status === "completed" ? "종료" : "진행중"})`, "success");
              }
            }}
            onResetFinal={(matchId) =>
              ask("점수 초기화", "이 경기의 모든 세트 점수를 초기화하시겠습니까?", () => {
                updateCurrentMatch("finals", matchId, {
                  s1A: 0,
                  s1B: 0,
                  s2A: 0,
                  s2B: 0,
                  s3A: 0,
                  s3B: 0,
                  status: "pending",
                }, true);
                toast("경기 점수가 초기화되었습니다.", "info");
              })
            }
            onAutoFill={() =>
              ask("본선 팀 자동 배치", "예선 성적을 바탕으로 준결승 대진표에 팀을 자동 배치하시겠습니까?", async () => {
                try {
                  const next = await autoFillFinals({ grade: currentGrade, sport: currentSport });
                  applyPayload(next);
                  toast("예선 상위 팀이 본선에 배치되었습니다.", "success");
                } catch (error) {
                  toast(error instanceof Error ? error.message : "자동 배치에 실패했습니다.", "warning");
                }
              })
            }
          />
        ) : null}

        {currentTab === "admin" ? (
          <AdminView
            isAdmin={payload.isAdmin}
            currentGrade={currentGrade}
            currentSport={currentSport}
            gradeSports={payload.gradeSports}
            groups={draftGroups}
            onLogin={handleAuthClick}
            onSelectGrade={(grade) => {
              setCurrentGrade(grade);
              setSelectedGroup("ALL");
            }}
            onChangeGroups={setDraftGroups}
            onRegenerate={() =>
              ask(
                "링크제 대진 재구성",
                "지정한 팀 순서대로 링크 경기 대진표가 새로 생성됩니다. 기존 경기 점수가 초기화됩니다. 계속하시겠습니까?",
                async () => {
                  const next = await saveGroups({
                    grade: currentGrade,
                    sport: currentSport,
                    groups: draftGroups.map((group) => ({
                      ...group,
                      name: group.name.trim() || group.name,
                      teams: group.teams.map((team, index) => team.trim() || `팀${index + 1}`),
                    })),
                    regenerate: true,
                  });
                  applyPayload(next);
                  toast("새 링크제 예선 대진표가 생성 및 저장되었습니다.", "success");
                },
              )
            }
            onExport={async () => {
              const data = await exportLeague();
              downloadLeagueExcel(data);
              toast("1·2·3학년 엑셀 백업이 다운로드되었습니다.", "success");
            }}
            onImport={(file) => {
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const parsed = JSON.parse(String(reader.result)) as LeaguePayload;
                  const next = await importLeague(parsed);
                  applyPayload(next);
                  toast("데이터를 성공적으로 복원하였습니다.", "success");
                } catch {
                  toast("올바르지 않은 JSON 파일입니다.", "warning");
                }
              };
              reader.readAsText(file);
            }}
            onReset={() =>
              ask("데이터 초기화", "현재 학년/종목의 모든 데이터가 초기화됩니다.", async () => {
                const next = await resetCategory({ grade: currentGrade, sport: currentSport });
                applyPayload(next);
                toast("데이터가 성공적으로 초기화되었습니다.", "info");
              })
            }
          />
        ) : null}
      </main>

      <footer className="mt-12 border-t border-slate-800 bg-slate-900 py-6 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl space-y-2 px-4 text-center">
          <p className="font-semibold text-slate-300">중학교 학교스포츠클럽 점심리그 관리 시스템</p>
          <p className="text-slate-500">학생들의 공정한 경기 운영 및 주도적 참여를 지원합니다.</p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        pin={pin}
        error={pinError}
        onPinChange={(value) => {
          setPin(value);
          setPinError("");
        }}
        onClose={() => setAuthOpen(false)}
        onSubmit={verifyPin}
      />
      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title || "확인"}
        description={confirm?.description || ""}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const action = confirm?.action;
          setConfirm(null);
          await action?.();
        }}
      />
      <ToastStack toasts={toasts} />
    </div>
  );
}
