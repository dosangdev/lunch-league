import * as XLSX from "xlsx";
import {
  calculateGroupStandings,
  calculateMatchResult,
  categoryKey,
  createInitialCategory,
  GRADES,
  sportLabel,
} from "./league";
import type { LeaguePayload, MatchRecord } from "./types";

function matchStatus(status: MatchRecord["status"]) {
  return status === "completed" ? "종료" : "대기";
}

function matchWinner(match: MatchRecord) {
  if (match.status !== "completed") return "";
  const result = calculateMatchResult(match);
  if (result.winner === "A") return match.teamA;
  if (result.winner === "B") return match.teamB;
  return "";
}

function gradeRows(payload: LeaguePayload, grade: 1 | 2 | 3) {
  const sport = payload.gradeSports[grade];
  const category = payload.data[categoryKey(grade, sport)] || createInitialCategory(grade, sport);
  const rows: Array<Array<string | number>> = [
    ["학년", `${grade}학년`],
    ["종목", sportLabel(sport)],
    [],
    ["조", "대진 순서(팀)"],
  ];

  category.groups.forEach((group) => {
    rows.push([group.name, group.teams.filter((team) => team.trim()).join(" → ")]);
  });

  rows.push([]);
  rows.push(["예선 경기", "조", "팀A", "팀B", "날짜", "상태", "1세트A", "1세트B", "2세트A", "2세트B", "3세트A", "3세트B", "승자"]);
  category.linkMatches.forEach((match, index) => {
    rows.push([
      index + 1,
      match.groupName || "",
      match.teamA,
      match.teamB,
      match.date || "",
      matchStatus(match.status),
      match.s1A,
      match.s1B,
      match.s2A,
      match.s2B,
      match.s3A,
      match.s3B,
      matchWinner(match),
    ]);
  });

  rows.push([]);
  rows.push(["본선 경기", "팀A", "팀B", "날짜", "상태", "1세트A", "1세트B", "2세트A", "2세트B", "3세트A", "3세트B", "승자"]);
  (["sf1", "sf2", "final"] as const).forEach((key) => {
    const match = category.finals[key];
    rows.push([
      match.name || key,
      match.teamA,
      match.teamB,
      match.date || "",
      matchStatus(match.status),
      match.s1A,
      match.s1B,
      match.s2A,
      match.s2B,
      match.s3A,
      match.s3B,
      matchWinner(match),
    ]);
  });

  rows.push([]);
  rows.push(["예선 순위", "조", "순위", "팀", "경기", "승", "패", "세트득실", "점수득실"]);
  category.groups.forEach((group) => {
    calculateGroupStandings(group, category.linkMatches).forEach((row, index) => {
      rows.push([
        "",
        row.groupName,
        index + 1,
        row.team,
        row.played,
        row.wins,
        row.losses,
        row.setDiff,
        row.ptDiff,
      ]);
    });
  });

  return rows;
}

export function buildLeagueWorkbook(payload: LeaguePayload) {
  const workbook = XLSX.utils.book_new();

  const overview = [
    ["학교스포츠클럽 점심리그 백업"],
    ["저장일", new Date().toISOString().slice(0, 10)],
    [],
    ["학년", "대표 종목"],
    ...GRADES.map((grade) => [`${grade}학년`, sportLabel(payload.gradeSports[grade])]),
    [],
    ["안내", "1·2·3학년 데이터는 각각 다른 시트에 들어 있습니다."],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(overview), "요약");

  GRADES.forEach((grade) => {
    const sheet = XLSX.utils.aoa_to_sheet(gradeRows(payload, grade));
    sheet["!cols"] = Array.from({ length: 13 }, () => ({ wch: 12 }));
    XLSX.utils.book_append_sheet(workbook, sheet, `${grade}학년`);
  });

  return workbook;
}

export function downloadLeagueExcel(payload: LeaguePayload) {
  XLSX.writeFile(buildLeagueWorkbook(payload), `점심리그_백업_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
