import { useState, useEffect, useRef, createContext, useContext } from "react";

const MobileCtx = createContext(false);
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ── 색상 ───────────────────────────────────────────────
const LIME   = "#C8FF00";
const DARK   = "#0A0A0A";
const CARD   = "#141414";
const CARD2  = "#1A1A1A";
const BORDER = "#2A2A2A";
const TEXT   = "#E0E0E0";
const TEXT2  = "#888888";
const RED    = "#FF4D4D";
const BLUE   = "#4DA6FF";
const PURPLE = "#A855F7";
const ORANGE = "#FF9F43";

// ── 클라우드 파일 저장 (JSONBin per-file bin) ──────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function base64ToBlob(b64, mime = "application/pdf") {
  const bytes = atob(b64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
async function cloudUploadFile(file) {
  const b64 = await fileToBase64(file);
  const res = await fetch("/api/file-save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _data: b64 }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `업로드 실패 (${res.status})`); }
  const json = await res.json();
  return json.binId;
}
async function cloudDownloadFile(binId) {
  const res = await fetch(`/api/file-load?binId=${binId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}
async function cloudDeleteFile(binId) {
  if (!binId) return;
  await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: "DELETE",
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY },
  });
}

// ── 테스트 종목 기본값 ─────────────────────────────────
const DEFAULT_TEST_TYPES = [
  { id: "sprint_20m", name: "20M 스프린트",  unit: "초",   lower_better: true  },
  { id: "jump",       name: "서전트 점프",    unit: "cm",   lower_better: false },
  { id: "yoyo",       name: "YOYO TEST",      unit: "회",   lower_better: false },
  { id: "pass",       name: "다각 패스",      unit: "회",   lower_better: false },
  { id: "dribble",    name: "드리블 슬라럼",  unit: "초",   lower_better: true  },
  { id: "shooting",   name: "슈팅 스피드",    unit: "km/h", lower_better: false },
  { id: "agility",    name: "민첩성",         unit: "초",   lower_better: true  },
];

// ── localStorage 메타데이터 ────────────────────────────
const INITIAL_STATE = {
  academies: [
    { id: 1, name: "test팀", created_at: "2026-01-01" },
  ],
  users: [
    { id: 1, email: "admin@footballdatalab.com", password: "admin123", role: "admin", academy_id: null, name: "관리자" },
    { id: 2, email: "test@test.com", password: "test123", role: "academy", academy_id: 1, name: "test팀" },
  ],
  resultFiles: [],
  players: [],
  dashboards: {},
  testTypes: DEFAULT_TEST_TYPES,
};

// ── 클라우드 저장 (JSONBin.io 직접 호출) ──────────────
const JSONBIN_BIN_ID     = "69b4f57baa77b81da9e2c4ad";
const JSONBIN_MASTER_KEY = "$2a$10$XXKBE3KoEEZGb2KQoLME4uPbKKJoq1tSdfcsSckzH5RiITZqPCgyq";

function validateMeta(parsed) {
  if (!parsed.users)       parsed.users       = INITIAL_STATE.users;
  if (!parsed.players)     parsed.players     = [];
  if (!parsed.resultFiles) parsed.resultFiles = [];
  if (!parsed.dashboards)  parsed.dashboards  = {};
  if (!parsed.testTypes)   parsed.testTypes   = DEFAULT_TEST_TYPES;
}

async function loadFromCloud() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY },
  });
  if (!res.ok) throw new Error(`load ${res.status}`);
  const json = await res.json();
  const data = json?.record ?? null;
  return data && data.init === true ? null : data;
}

async function saveToCloud(data) {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_MASTER_KEY },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`save ${res.status}`);
}

async function loadMeta() {
  let local = null;
  try {
    const s = localStorage.getItem("fdl-meta");
    if (s) { local = JSON.parse(s); validateMeta(local); }
  } catch {}
  try {
    const cloud = await loadFromCloud();
    if (cloud && typeof cloud === "object") {
      validateMeta(cloud);
      localStorage.setItem("fdl-meta", JSON.stringify(cloud));
      return cloud;
    }
  } catch (e) { console.warn("클라우드 로드 실패:", e.message); }
  return local ?? INITIAL_STATE;
}

async function saveMeta(data) {
  localStorage.setItem("fdl-meta", JSON.stringify(data));
  try { await saveToCloud(data); } catch (e) { console.warn("클라우드 저장 실패:", e.message); }
}

// ── 스타일 ─────────────────────────────────────────────
const S = {
  app:       { fontFamily: "'Pretendard','Noto Sans KR',-apple-system,sans-serif", background: DARK, color: TEXT, minHeight: "100vh", display: "flex" },
  sidebar:   { width: 260, background: "#0D0D0D", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarC:  { width: 64 },
  main:      { flex: 1, marginLeft: 260, minHeight: "100vh" },
  mainC:     { marginLeft: 64 },
  topBar:    { height: 64, background: "#0D0D0D", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 },
  content:   { padding: "28px 32px" },
  card:      { background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, marginBottom: 20 },
  statCard:  { background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px 24px", flex: 1, minWidth: 180 },
  btn:       { background: LIME, color: DARK, border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnSm:     { background: LIME, color: DARK, border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  btnOut:    { background: "transparent", color: LIME, border: `1px solid ${LIME}`, borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnGhost:  { background: "transparent", color: TEXT2, border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, fontSize: 14 },
  btnDanger: { background: "transparent", color: RED, border: `1px solid ${RED}40`, borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  input:     { background: CARD2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" },
  select:    { background: CARD2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", cursor: "pointer" },
  badge:     { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  table:     { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th:        { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${BORDER}` },
  td:        { padding: "14px 16px", borderBottom: `1px solid ${BORDER}15`, fontSize: 14 },
  loginBg:   { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${DARK} 0%,#111 50%,#0D0D0D 100%)` },
};

function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ── 공통 ───────────────────────────────────────────────
function Logo({ collapsed }) {
  return (
    <div style={{ padding: collapsed ? "20px 12px" : "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: LIME, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: DARK, fontSize: 16, flexShrink: 0 }}>FDL</div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: -0.5 }}>FOOTBALL</div>
            <div style={{ fontWeight: 800, fontSize: 10, color: LIME, letterSpacing: 3 }}>DATALAB</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "12px 20px" : "12px 24px", cursor: "pointer", background: active ? `${LIME}12` : "transparent", borderLeft: active ? `3px solid ${LIME}` : "3px solid transparent", color: active ? "#fff" : TEXT2, fontSize: 14, fontWeight: active ? 600 : 400, transition: "all 0.15s ease" }}>
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}


function StatCard({ icon, label, value, sub, color = LIME }) {
  return (
    <div style={S.statCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, color: TEXT2, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ── 로그인 ─────────────────────────────────────────────
function LoginScreen({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      const u = users.find(u => u.email === email && u.password === pw);
      u ? onLogin(u) : setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }, 400);
  };

  return (
    <div style={S.loginBg}>
      <div style={{ background: CARD, borderRadius: 24, border: `1px solid ${BORDER}`, padding: 48, width: 420, maxWidth: "90vw", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: LIME, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: DARK, fontSize: 22, marginBottom: 16 }}>FDL</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>FOOTBALL DATALAB</h1>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 8 }}>데이터로 구축하는 축구 아카데미의 미래</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: TEXT2, fontWeight: 500, display: "block", marginBottom: 8 }}>이메일</label>
          <input style={S.input} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: TEXT2, fontWeight: 500, display: "block", marginBottom: 8 }}>비밀번호</label>
          <input style={S.input} type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        {error && <div style={{ background: `${RED}15`, border: `1px solid ${RED}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: RED, fontSize: 13 }}>{error}</div>}
        <button style={{ ...S.btn, width: "100%", padding: 14, fontSize: 15, opacity: loading ? 0.7 : 1 }} onClick={handle} disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
      </div>
    </div>
  );
}

// ── 대시보드 기본값 ────────────────────────────────────
const RADAR_CATS = ["순발력", "근력", "지구력", "패스", "드리블", "슈팅", "민첩성"];

function defaultDashboard(testTypes = DEFAULT_TEST_TYPES) {
  const radarData = {};
  RADAR_CATS.forEach(c => { radarData[c] = 0; });
  const topPerformers = {};
  testTypes.forEach(tt => { topPerformers[tt.id] = { name: "", value: "" }; });
  const rankings = {};
  testTypes.forEach(tt => { rankings[tt.id] = []; });
  return {
    updatedAt: "",
    stats: { playerCount: "", testCount: "", latestRound: "", year: new Date().getFullYear() },
    notice: "",
    topPerformers,
    radarData,
    rankings,
  };
}

// ── 대시보드 (관리자: 전체 요약 / 팀: 설정된 내용) ─────
function DashboardPage({ user, academies, resultFiles, dashboards, testTypes }) {
  const isMobile  = useContext(MobileCtx);
  const isAdmin   = user.role === "admin";
  const myAcademy = academies.find(a => a.id === user.academy_id);
  const db        = isAdmin ? null : (dashboards[user.academy_id] ?? null);
  const myFiles   = isAdmin ? resultFiles : resultFiles.filter(f => f.academy_id === user.academy_id);

  // Hooks must always be called before any early returns
  const [selectedRankTest, setSelectedRankTest] = useState(testTypes[0]?.id ?? "");
  const MEDALS = ["🥇", "🥈", "🥉"];

  // ── 관리자 뷰 ──
  if (isAdmin) {
    // 전체 평균 레이더 데이터 계산
    const configuredDbs = Object.values(dashboards).filter(d => d && d.updatedAt);
    const avgRadarData = RADAR_CATS.map(cat => {
      const vals = configuredDbs.map(d => Number(d.radarData?.[cat]) || 0).filter(v => v > 0);
      return { category: cat, value: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, fullMark: 100 };
    });

    // 팀별 최고 기록 목록
    const teamTopRecords = academies.map(a => {
      const d = dashboards[a.id];
      if (!d || !d.updatedAt) return null;
      return { academy: a, topPerformers: d.topPerformers };
    }).filter(Boolean);

    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>전체 현황</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>등록된 팀과 파일 현황을 확인하세요</p>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard icon="🏫" label="등록 팀" value={academies.length} sub="활성 팀" />
          <StatCard icon="📁" label="전체 파일" value={`${resultFiles.length}개`} sub="업로드 완료" color={BLUE} />
          <StatCard icon="✏️" label="대시보드 설정" value={`${Object.keys(dashboards).length}개`} sub="팀 설정 완료" color={PURPLE} />
        </div>

        {/* 전체 평균 능력치 */}
        {configuredDbs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🕸️ 전체 팀 평균 능력치</h3>
              <p style={{ fontSize: 12, color: TEXT2, margin: "0 0 16px" }}>{configuredDbs.length}개 팀 평균</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={avgRadarData}>
                  <PolarGrid stroke={BORDER} />
                  <PolarAngleAxis dataKey="category" tick={{ fill: TEXT2, fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: TEXT2, fontSize: 10 }} />
                  <Radar name="전체 평균" dataKey="value" stroke={LIME} fill={LIME} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📊 능력치 평균값</h3>
              <p style={{ fontSize: 12, color: TEXT2, margin: "0 0 16px" }}>카테고리별 전체 평균</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {avgRadarData.map(d => (
                  <div key={d.category} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: TEXT, width: 60 }}>{d.category}</span>
                    <div style={{ flex: 1, background: CARD2, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${d.value}%`, height: "100%", background: LIME, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: LIME, width: 36, textAlign: "right" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 팀별 최고 기록 */}
        {teamTopRecords.length > 0 && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🏆 팀별 최고 기록</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>팀</th>
                    {testTypes.map(tt => <th key={tt.id} style={S.th}>{tt.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {teamTopRecords.map(({ academy, topPerformers }) => (
                    <tr key={academy.id}>
                      <td style={S.td}><span style={{ color: LIME, fontWeight: 600 }}>{academy.name}</span></td>
                      {testTypes.map(tt => {
                        const tp = topPerformers?.[tt.id];
                        return (
                          <td key={tt.id} style={S.td}>
                            {tp?.value ? (
                              <div>
                                <div style={{ fontWeight: 700, color: "#fff" }}>{tp.value}{tt.unit}</div>
                                {tp.name && <div style={{ fontSize: 11, color: TEXT2 }}>{tp.name}</div>}
                              </div>
                            ) : <span style={{ color: TEXT2 }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 최근 업로드 파일 */}
        {myFiles.length > 0 && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📁 최근 업로드 파일</h3>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>파일명</th><th style={S.th}>팀</th><th style={S.th}>차시</th><th style={S.th}>업로드 일시</th>
              </tr></thead>
              <tbody>
                {[...myFiles].reverse().slice(0, 8).map(f => (
                  <tr key={f.id}>
                    <td style={S.td}><span style={{ marginRight: 8 }}>📕</span><span style={{ fontWeight: 500, color: "#fff" }}>{f.file_name}</span></td>
                    <td style={S.td}><span style={{ color: LIME }}>{academies.find(a => a.id === f.academy_id)?.name}</span></td>
                    <td style={S.td}>{f.year}년 {f.round}차시</td>
                    <td style={S.td}>{f.uploaded_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── 팀 뷰: 대시보드 미설정 ──
  if (!db || !db.updatedAt) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>{myAcademy?.name} 대시보드</h2>
        </div>
        <div style={{ ...S.card, textAlign: "center", padding: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>대시보드가 아직 준비되지 않았습니다</div>
          <div style={{ fontSize: 14, color: TEXT2 }}>관리자가 데이터를 입력하면 여기에 표시됩니다</div>
        </div>
      </div>
    );
  }

  // ── 팀 뷰: 설정된 대시보드 표시 ──
  const { stats, notice, topPerformers, radarData, rankings } = db;
  const radarChartData = RADAR_CATS.map(c => ({ category: c, value: Number(radarData[c]) || 0, fullMark: 100 }));
  const rankList = (rankings[selectedRankTest] ?? []).slice(0, 3);
  const currentTT = testTypes.find(t => t.id === selectedRankTest);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 28 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, color: "#fff", margin: 0 }}>{myAcademy?.name} 대시보드</h2>
          <p style={{ color: TEXT2, fontSize: 11, marginTop: 2 }}>업데이트: {db.updatedAt}</p>
        </div>
      </div>

      {/* 공지 */}
      {notice && (
        <div style={{ background: `${LIME}08`, border: `1px solid ${LIME}30`, borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 14, color: TEXT, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          📢 {notice}
        </div>
      )}

      {/* 요약 수치 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard icon="👥" label="등록 선수" value={stats.playerCount || "-"} sub={`${stats.year || ""}년 기준`} />
        <StatCard icon="📋" label="완료 테스트" value={stats.testCount || "-"} sub="누적 테스트" color={BLUE} />
        <StatCard icon="📊" label="최근 차시" value={stats.latestRound ? `${stats.latestRound}차시` : "-"} sub="최신 기록" color={PURPLE} />
        <StatCard icon="📁" label="결과 파일" value={`${myFiles.length}개`} sub="다운로드 가능" color={ORANGE} />
      </div>

      {/* 능력치 + 최고기록 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={S.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🕸️ 팀 능력치 분석</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarChartData}>
              <PolarGrid stroke={BORDER} />
              <PolarAngleAxis dataKey="category" tick={{ fill: TEXT2, fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: TEXT2, fontSize: 10 }} />
              <Radar name="팀 평균" dataKey="value" stroke={LIME} fill={LIME} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🏆 테스트별 최고 기록</h3>
          {/* 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "6px 14px", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>종목</span>
            <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>선수</span>
            <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>기록</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {testTypes.map(tt => {
              const tp = topPerformers[tt.id];
              const hasData = tp?.name || tp?.value;
              return (
                <div key={tt.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 12px", background: CARD2, borderRadius: 8 }}>
                  {isMobile ? (
                    <>
                      <div>
                        <div style={{ fontSize: 11, color: TEXT2, marginBottom: 2 }}>{tt.name}</div>
                        <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{tp?.name || <span style={{ color: TEXT2 }}>-</span>}</div>
                      </div>
                      <span style={{ fontSize: 14, color: hasData ? LIME : TEXT2, fontWeight: 700, textAlign: "right" }}>
                        {tp?.value ? `${tp.value}${tt.unit}` : "-"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: hasData ? TEXT : TEXT2 }}>{tt.name}</span>
                      <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{tp?.name || <span style={{ color: TEXT2 }}>-</span>}</span>
                      <span style={{ fontSize: 13, color: hasData ? LIME : TEXT2, fontWeight: 700, textAlign: "right" }}>
                        {tp?.value ? `${tp.value}${tt.unit}` : "-"}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 선수 랭킹 - TOP 3 */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>🏅 선수 랭킹 TOP 3</h3>
          <select style={{ ...S.select, fontSize: isMobile ? 12 : 14, maxWidth: isMobile ? 140 : "none" }} value={selectedRankTest} onChange={e => setSelectedRankTest(e.target.value)}>
            {testTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </select>
        </div>
        {rankList.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: TEXT2, fontSize: 13 }}>데이터가 없습니다</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? 8 : 16 }}>
            {rankList.map((r, i) => {
              const prevVal = i > 0 ? parseFloat(rankList[i - 1].value) : null;
              const curVal  = parseFloat(r.value);
              let gap = null;
              if (i > 0 && !isNaN(prevVal) && !isNaN(curVal)) {
                const diff = currentTT?.lower_better ? (curVal - prevVal) : (prevVal - curVal);
                gap = `+${Math.abs(diff).toFixed(2)}`;
              }
              const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
              return (
                <div key={i} style={{ background: CARD2, borderRadius: isMobile ? 10 : 14, padding: isMobile ? "12px 10px" : "20px 24px", border: `1px solid ${i === 0 ? "#FFD70040" : BORDER}`, textAlign: isMobile ? "center" : "left" }}>
                  <div style={{ fontSize: isMobile ? 24 : 36, marginBottom: isMobile ? 4 : 8 }}>{MEDALS[i]}</div>
                  <div style={{ fontSize: isMobile ? 13 : 20, fontWeight: 800, color: "#fff", marginBottom: 2, wordBreak: "break-all" }}>{r.name || "-"}</div>
                  {r.age && !isMobile && <div style={{ fontSize: 12, color: TEXT2, marginBottom: 8 }}>{r.age}세</div>}
                  <div style={{ fontSize: isMobile ? 16 : 24, fontWeight: 900, color: medalColors[i], marginBottom: 2 }}>
                    {r.value}{currentTT?.unit}
                  </div>
                  {gap && !isMobile && <div style={{ fontSize: 12, color: TEXT2 }}>▲ {gap} 차이</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 팀 관리 (관리자) ───────────────────────────────────
function TeamsPage({ meta, onMetaChange }) {
  const isMobile  = useContext(MobileCtx);
  const [showForm,   setShowForm]   = useState(false);
  const [teamName,   setTeamName]   = useState("");
  const [teamEmail,  setTeamEmail]  = useState("");
  const [teamPw,     setTeamPw]     = useState("fdl1234");
  const [copied,     setCopied]     = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [editFields, setEditFields] = useState({ name: "", email: "", password: "" });

  const handleAdd = () => {
    if (!teamName.trim() || !teamEmail.trim()) return;
    const newId = Date.now();
    const newAcademy = { id: newId, name: teamName.trim(), created_at: new Date().toISOString().split("T")[0] };
    const newUser    = { id: newId + 1, email: teamEmail.trim(), password: teamPw, role: "academy", academy_id: newId, name: teamName.trim() };
    onMetaChange(prev => ({
      ...prev,
      academies: [...prev.academies, newAcademy],
      users:     [...prev.users, newUser],
    }));
    setTeamName(""); setTeamEmail(""); setTeamPw("fdl1234"); setShowForm(false);
  };

  const handleDelete = (academyId) => {
    if (!confirm("이 팀과 관련 파일 정보를 삭제하시겠습니까?")) return;
    onMetaChange(prev => ({
      ...prev,
      academies:   prev.academies.filter(a => a.id !== academyId),
      users:       prev.users.filter(u => u.academy_id !== academyId),
      resultFiles: prev.resultFiles.filter(f => f.academy_id !== academyId),
    }));
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const startEdit = (a) => {
    const user = meta.users.find(u => u.academy_id === a.id);
    setEditingId(a.id);
    setEditFields({ name: a.name, email: user?.email ?? "", password: user?.password ?? "" });
  };

  const handleSaveEdit = (academyId) => {
    if (!editFields.name.trim() || !editFields.email.trim()) return;
    onMetaChange(prev => ({
      ...prev,
      academies: prev.academies.map(a => a.id === academyId ? { ...a, name: editFields.name.trim() } : a),
      users: prev.users.map(u => u.academy_id === academyId ? { ...u, name: editFields.name.trim(), email: editFields.email.trim(), password: editFields.password } : u),
    }));
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🏫 팀 관리</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>팀을 추가하고 로그인 계정을 관리하세요</p>
        </div>
        <button style={S.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ 닫기" : "＋ 팀 추가"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...S.card, border: `1px solid ${LIME}30`, background: `${LIME}04`, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>새 팀 등록</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>팀 이름 *</label>
              <input style={S.input} placeholder="예: KSA 축구 아카데미" value={teamName} onChange={e => setTeamName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>로그인 이메일 *</label>
              <input style={S.input} type="email" placeholder="예: ksa@academy.com" value={teamEmail} onChange={e => setTeamEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>비밀번호</label>
              <input style={S.input} placeholder="기본: fdl1234" value={teamPw} onChange={e => setTeamPw(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={S.btn} onClick={handleAdd} disabled={!teamName.trim() || !teamEmail.trim()}>등록하기</button>
            <button style={S.btnGhost} onClick={() => setShowForm(false)}>취소</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        {meta.academies.map(a => {
          const user    = meta.users.find(u => u.academy_id === a.id);
          const fCount  = meta.resultFiles.filter(f => f.academy_id === a.id).length;
          const isEditing = editingId === a.id;
          return (
            <div key={a.id} style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>생성일: {a.created_at}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ ...S.badge, background: `${LIME}20`, color: LIME }}>활성</span>
                  <button style={S.btnGhost} onClick={() => isEditing ? setEditingId(null) : startEdit(a)}>
                    {isEditing ? "취소" : "수정"}
                  </button>
                  {a.id !== 1 && (
                    <button style={S.btnDanger} onClick={() => handleDelete(a.id)}>삭제</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div style={{ background: CARD2, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 12 }}>정보 수정</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 4 }}>팀 이름</label>
                      <input style={{ ...S.input, fontSize: 13 }} value={editFields.name} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 4 }}>이메일</label>
                      <input style={{ ...S.input, fontSize: 13 }} type="email" value={editFields.email} onChange={e => setEditFields(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 4 }}>비밀번호</label>
                      <input style={{ ...S.input, fontSize: 13 }} value={editFields.password} onChange={e => setEditFields(p => ({ ...p, password: e.target.value }))} />
                    </div>
                    <button style={{ ...S.btn, marginTop: 4 }} onClick={() => handleSaveEdit(a.id)} disabled={!editFields.name.trim() || !editFields.email.trim()}>저장하기</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: CARD2, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 10 }}>로그인 정보</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: TEXT }}>{user?.email ?? "-"}</span>
                    <button style={{ ...S.btnGhost, fontSize: 12, padding: "4px 10px", color: copied === `e${a.id}` ? LIME : TEXT2 }} onClick={() => copyText(user?.email ?? "", `e${a.id}`)}>
                      {copied === `e${a.id}` ? "✓ 복사됨" : "복사"}
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: TEXT }}>{"•".repeat(user?.password?.length ?? 0)}</span>
                    <button style={{ ...S.btnGhost, fontSize: 12, padding: "4px 10px", color: copied === `p${a.id}` ? LIME : TEXT2 }} onClick={() => copyText(user?.password ?? "", `p${a.id}`)}>
                      {copied === `p${a.id}` ? "✓ 복사됨" : "PW 복사"}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 24, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{fCount}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>업로드된 파일</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 파일 업로드 (관리자) ──────────────────────────────
function UploadPage({ meta, onUpload, onDeleteFile }) {
  const isMobile  = useContext(MobileCtx);
  const [academyId,  setAcademyId]  = useState(meta.academies[0]?.id ?? 1);
  const [round,      setRound]      = useState(1);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");
  const fileRef = useRef();

  const handleDelete = async (f) => {
    if (!confirm(`"${f.file_name}" 파일을 삭제하시겠습니까?`)) return;
    setDeleting(f.id);
    await cloudDeleteFile(f.binId);
    onDeleteFile(f.id);
    setDeleting(null);
  };

  const handleFiles = async (files) => {
    const pdfs = [...files].filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) { setError("PDF 파일만 업로드 가능합니다."); return; }
    const oversized = [...pdfs].filter(f => f.size > 2 * 1024 * 1024);
    if (oversized.length) { setError(`파일 크기는 2MB 이하만 지원합니다: ${oversized.map(f => f.name).join(", ")}`); return; }
    setUploading(true); setError(""); setSuccess("");
    try {
      for (const file of pdfs) {
        const id    = `file_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const binId = await cloudUploadFile(file);
        const fileMeta = {
          id,
          binId,
          academy_id:  academyId,
          file_name:   file.name,
          file_size:   file.size,
          round,
          year,
          date,
          uploaded_at: new Date().toLocaleString("ko-KR"),
        };
        onUpload(fileMeta);
      }
      setSuccess(`${pdfs.length}개 파일이 업로드되었습니다.`);
    } catch (e) {
      setError(`업로드 오류: ${e.message}`);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>📤 파일 업로드</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>팀별 결과 PDF를 업로드하면 해당 팀이 다운로드할 수 있습니다</p>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>업로드 설정</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>팀 선택</label>
            <select style={{ ...S.select, width: "100%" }} value={academyId} onChange={e => setAcademyId(Number(e.target.value))}>
              {meta.academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>연도</label>
            <select style={{ ...S.select, width: "100%" }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>차시</label>
            <select style={{ ...S.select, width: "100%" }} value={round} onChange={e => setRound(Number(e.target.value))}>
              {[1,2,3,4,5,6].map(r => <option key={r} value={r}>{r}차시</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>테스트 날짜</label>
            <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? LIME : BORDER}`, borderRadius: 16, padding: 64, textAlign: "center", background: dragging ? `${LIME}05` : "transparent", transition: "all 0.2s ease", cursor: uploading ? "default" : "pointer" }}
        >
          {uploading ? (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>업로드 중...</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>PDF를 드래그하거나 클릭하여 업로드</div>
              <div style={{ fontSize: 13, color: TEXT2 }}>여러 파일 동시 업로드 가능 · 최대 50MB</div>
            </div>
          )}
        </div>

        {success && <div style={{ background: `${LIME}10`, border: `1px solid ${LIME}30`, borderRadius: 10, padding: "12px 16px", marginTop: 16, color: LIME, fontSize: 13 }}>✅ {success}</div>}
        {error   && <div style={{ background: `${RED}10`,  border: `1px solid ${RED}30`,  borderRadius: 10, padding: "12px 16px", marginTop: 16, color: RED,  fontSize: 13 }}>⚠️ {error}</div>}
      </div>

      {/* 업로드 이력 */}
      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📋 업로드 이력 ({meta.resultFiles.length}개)</h3>
        {meta.resultFiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: TEXT2 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>업로드된 파일이 없습니다</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>파일명</th>
              <th style={S.th}>팀</th>
              <th style={S.th}>차시</th>
              <th style={{ ...S.th, display: isMobile ? "none" : "" }}>크기</th>
              <th style={{ ...S.th, display: isMobile ? "none" : "" }}>업로드 일시</th>
              <th style={{ ...S.th, textAlign: "right" }}></th>
            </tr></thead>
            <tbody>
              {[...meta.resultFiles].reverse().map(f => (
                <tr key={f.id}>
                  <td style={S.td}><span style={{ marginRight: 8 }}>📕</span><span style={{ fontWeight: 500, color: "#fff", fontSize: isMobile ? 12 : 14 }}>{f.file_name}</span></td>
                  <td style={S.td}><span style={{ color: LIME }}>{meta.academies.find(a => a.id === f.academy_id)?.name}</span></td>
                  <td style={S.td}>{f.year}년 {f.round}차시</td>
                  <td style={{ ...S.td, display: isMobile ? "none" : "" }}>{fmt(f.file_size)}</td>
                  <td style={{ ...S.td, display: isMobile ? "none" : "" }}>{f.uploaded_at}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    <button
                      style={{ ...S.btnDanger, padding: "4px 10px", fontSize: 12, opacity: deleting === f.id ? 0.5 : 1 }}
                      onClick={() => handleDelete(f)}
                      disabled={deleting === f.id}
                    >{deleting === f.id ? "삭제중..." : "삭제"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 대시보드 수기 입력 (관리자 CMS) ──────────────────
const TABS = [
  { id: "info",    label: "📋 기본 정보" },
  { id: "top",     label: "🏆 최고 기록" },
  { id: "radar",   label: "🕸️ 팀 능력치" },
  { id: "ranking", label: "🏅 선수 랭킹" },
];

function DataEntryPage({ meta, onMetaChange }) {
  const isMobile  = useContext(MobileCtx);
  const testTypes = meta.testTypes ?? DEFAULT_TEST_TYPES;
  const [academyId, setAcademyId] = useState(meta.academies[0]?.id ?? 1);
  const [tab,       setTab]       = useState("info");
  const [draft,     setDraft]     = useState(null); // 편집 중인 임시 복사본
  const [saved,     setSaved]     = useState(false);
  const [rankTest,  setRankTest]  = useState(testTypes[0]?.id ?? "");

  // academyId 바뀌면 draft 초기화
  const db = (() => {
    const saved = meta.dashboards?.[academyId]
      ? JSON.parse(JSON.stringify(meta.dashboards[academyId]))
      : defaultDashboard(testTypes);
    // 새로 추가된 종목이 기존 대시보드에 없을 수 있으므로 보완
    testTypes.forEach(tt => {
      if (!saved.topPerformers[tt.id]) saved.topPerformers[tt.id] = { name: "", value: "" };
      if (!saved.rankings[tt.id])      saved.rankings[tt.id]      = [];
    });
    return saved;
  })();
  const cur = draft ?? db;

  const setAcademy = (id) => { setAcademyId(id); setDraft(null); };

  const update = (path, value) => {
    setDraft(prev => {
      const base = prev ?? db;
      // path: ["stats","playerCount"] or ["topPerformers","sprint_20m","name"] etc.
      const next = JSON.parse(JSON.stringify(base));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = () => {
    if (!draft) return;
    onMetaChange(prev => ({
      ...prev,
      dashboards: {
        ...prev.dashboards,
        [academyId]: { ...draft, updatedAt: new Date().toLocaleString("ko-KR") },
      },
    }));
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isDirty = draft !== null;

  // 랭킹 행 추가
  const addRankRow = () => {
    const rows = [...(cur.rankings[rankTest] ?? []), { name: "", value: "", age: "" }];
    update(["rankings", rankTest], rows);
  };
  const removeRankRow = (i) => {
    const rows = (cur.rankings[rankTest] ?? []).filter((_, idx) => idx !== i);
    update(["rankings", rankTest], rows);
  };
  const setRankCell = (i, field, val) => {
    const rows = JSON.parse(JSON.stringify(cur.rankings[rankTest] ?? []));
    rows[i] = { ...rows[i], [field]: val };
    update(["rankings", rankTest], rows);
  };

  const inStyle = {
    ...S.input,
    padding: "8px 12px",
    fontSize: 13,
  };
  const smIn = (extra = {}) => ({ ...inStyle, ...extra });

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#fff", margin: 0 }}>✏️ 대시보드 수기 입력</h2>
          {!isMobile && <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>팀 대시보드에 표시될 내용을 직접 입력하세요</p>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isDirty && !isMobile && <span style={{ fontSize: 12, color: ORANGE }}>● 저장되지 않은 변경사항</span>}
          <button style={{ ...S.btn, opacity: isDirty ? 1 : 0.4, minWidth: 100 }} onClick={handleSave} disabled={!isDirty}>
            {saved ? "✅ 저장됨" : isDirty && isMobile ? "● 💾 저장" : "💾 저장"}
          </button>
        </div>
      </div>

      {/* 팀 선택 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select style={S.select} value={academyId} onChange={e => setAcademy(Number(e.target.value))}>
          {meta.academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {db.updatedAt && <span style={{ fontSize: 12, color: TEXT2, alignSelf: "center" }}>마지막 저장: {db.updatedAt}</span>}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: isMobile ? 0 : 6, marginBottom: 24, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: isMobile ? 20 : 14, fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#fff" : TEXT2,
            padding: isMobile ? "10px 16px" : "10px 18px",
            borderBottom: tab === t.id ? `2px solid ${LIME}` : "2px solid transparent",
            marginBottom: -1, whiteSpace: "nowrap", flex: isMobile ? 1 : "none",
          }}>{isMobile ? t.label.split(" ")[0] : t.label}</button>
        ))}
      </div>

      {/* ── 탭: 기본 정보 ── */}
      {tab === "info" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#fff" }}>요약 수치 & 공지</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>등록 선수 수</label>
              <input style={inStyle} placeholder="예: 32명" value={cur.stats.playerCount} onChange={e => update(["stats","playerCount"], e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>완료 테스트 수</label>
              <input style={inStyle} placeholder="예: 3회" value={cur.stats.testCount} onChange={e => update(["stats","testCount"], e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>최근 차시</label>
              <input style={inStyle} placeholder="예: 2" value={cur.stats.latestRound} onChange={e => update(["stats","latestRound"], e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>연도</label>
              <input style={inStyle} placeholder="예: 2026" value={cur.stats.year} onChange={e => update(["stats","year"], e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>공지사항 (팀 대시보드 상단에 표시)</label>
            <textarea
              style={{ ...S.input, height: 100, resize: "vertical", lineHeight: 1.6 }}
              placeholder="예: 3차시 테스트가 완료되었습니다. 결과 파일을 다운로드하세요."
              value={cur.notice}
              onChange={e => update(["notice"], e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── 탭: 최고 기록 ── */}
      {tab === "top" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#fff" }}>테스트별 최고 기록 선수</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {testTypes.map(tt => (
              <div key={tt.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 1fr 1fr", gap: 12, alignItems: "center", padding: "16px 20px", background: CARD2, borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {tt.name}
                  <span style={{ fontSize: 11, color: TEXT2, marginLeft: 6 }}>({tt.unit})</span>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>선수 이름</label>
                  <input style={smIn()} placeholder="이름 입력" value={cur.topPerformers[tt.id]?.name ?? ""} onChange={e => update(["topPerformers", tt.id, "name"], e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>기록 값 ({tt.unit})</label>
                  <input style={smIn()} placeholder={`예: ${tt.id === "sprint_20m" ? "3.82" : tt.id === "jump" ? "55" : "24"}`} value={cur.topPerformers[tt.id]?.value ?? ""} onChange={e => update(["topPerformers", tt.id, "value"], e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 탭: 팀 능력치 ── */}
      {tab === "radar" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#fff" }}>팀 능력치 레이더 차트</h3>
          <p style={{ color: TEXT2, fontSize: 13, marginBottom: 24 }}>각 항목을 0~100 사이 값으로 입력하세요</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {RADAR_CATS.map(cat => {
              const val = Number(cur.radarData[cat]) || 0;
              return (
                <div key={cat} style={{ padding: "16px 20px", background: CARD2, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{cat}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: LIME }}>{val}</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={val}
                    onChange={e => update(["radarData", cat], Number(e.target.value))}
                    style={{ width: "100%", accentColor: LIME, cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT2, marginTop: 4 }}>
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                  <input
                    type="number" min="0" max="100" value={val}
                    onChange={e => update(["radarData", cat], Math.min(100, Math.max(0, Number(e.target.value))))}
                    style={{ ...smIn(), width: 80, marginTop: 8, textAlign: "center" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 탭: 선수 랭킹 ── */}
      {tab === "ranking" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>선수 랭킹 입력</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <select style={S.select} value={rankTest} onChange={e => setRankTest(e.target.value)}>
                {testTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name} ({tt.unit})</option>)}
              </select>
              <button style={S.btnSm} onClick={addRankRow}>＋ 행 추가</button>
            </div>
          </div>

          {(cur.rankings[rankTest] ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: TEXT2 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div>행 추가 버튼으로 선수를 입력하세요</div>
            </div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(cur.rankings[rankTest] ?? []).map((row, i) => (
                <div key={i} style={{ background: CARD2, borderRadius: 10, padding: "12px 14px", display: "grid", gridTemplateColumns: "24px 1fr auto", gap: 10, alignItems: "center" }}>
                  <span style={{ color: TEXT2, fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input style={smIn({ width: "100%" })} placeholder="이름" value={row.name} onChange={e => setRankCell(i, "name", e.target.value)} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input style={smIn({ flex: 1 })} placeholder="나이" value={row.age} onChange={e => setRankCell(i, "age", e.target.value)} />
                      <input style={smIn({ flex: 1 })} placeholder={`기록(${testTypes.find(t=>t.id===rankTest)?.unit})`} value={row.value} onChange={e => setRankCell(i, "value", e.target.value)} />
                    </div>
                  </div>
                  <button style={{ ...S.btnDanger, padding: "4px 8px", border: "none", fontSize: 16 }} onClick={() => removeRankRow(i)}>🗑</button>
                </div>
              ))}
            </div>
          ) : (
            <table style={S.table}>
              <thead><tr>
                <th style={{ ...S.th, width: 40 }}>#</th>
                <th style={S.th}>선수명 *</th>
                <th style={{ ...S.th, width: 90 }}>나이</th>
                <th style={{ ...S.th, width: 120 }}>기록 ({testTypes.find(t=>t.id===rankTest)?.unit})</th>
                <th style={{ ...S.th, width: 50 }}></th>
              </tr></thead>
              <tbody>
                {(cur.rankings[rankTest] ?? []).map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, color: TEXT2, fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...S.td, padding: "8px 12px" }}>
                      <input style={smIn({ width: "100%" })} placeholder="이름" value={row.name} onChange={e => setRankCell(i, "name", e.target.value)} />
                    </td>
                    <td style={{ ...S.td, padding: "8px 8px" }}>
                      <input style={smIn({ width: 70 })} placeholder="나이" value={row.age} onChange={e => setRankCell(i, "age", e.target.value)} />
                    </td>
                    <td style={{ ...S.td, padding: "8px 8px" }}>
                      <input style={smIn({ width: 100 })} placeholder="기록" value={row.value} onChange={e => setRankCell(i, "value", e.target.value)} />
                    </td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <button style={{ ...S.btnDanger, padding: "4px 8px", border: "none", fontSize: 16 }} onClick={() => removeRankRow(i)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ fontSize: 12, color: TEXT2, marginTop: 12 }}>입력 순서가 랭킹 순서가 됩니다. 행을 드래그로 재정렬하려면 순서에 맞게 입력하세요.</p>
        </div>
      )}

      {/* 하단 저장 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button style={{ ...S.btn, opacity: isDirty ? 1 : 0.4, minWidth: 120 }} onClick={handleSave} disabled={!isDirty}>
          {saved ? "✅ 저장됨" : "💾 저장"}
        </button>
      </div>
    </div>
  );
}

// ── 종목 관리 (관리자) ────────────────────────────────
function TestTypesPage({ meta, onMetaChange }) {
  const isMobile  = useContext(MobileCtx);
  const testTypes = meta.testTypes ?? DEFAULT_TEST_TYPES;
  const [editingId,  setEditingId]  = useState(null);
  const [editFields, setEditFields] = useState({ name: "", unit: "", lower_better: false });
  const [showAdd,    setShowAdd]    = useState(false);
  const [newFields,  setNewFields]  = useState({ id: "", name: "", unit: "", lower_better: false });

  const startEdit = (tt) => { setEditingId(tt.id); setEditFields({ name: tt.name, unit: tt.unit, lower_better: tt.lower_better }); };

  const handleSaveEdit = (id) => {
    if (!editFields.name.trim()) return;
    onMetaChange(prev => ({ ...prev, testTypes: prev.testTypes.map(t => t.id === id ? { ...t, ...editFields, name: editFields.name.trim(), unit: editFields.unit.trim() } : t) }));
    setEditingId(null);
  };

  const handleAdd = () => {
    const id = newFields.id.trim() || newFields.name.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id || !newFields.name.trim()) return;
    if (testTypes.find(t => t.id === id)) { alert("이미 존재하는 ID입니다."); return; }
    onMetaChange(prev => ({ ...prev, testTypes: [...prev.testTypes, { id, name: newFields.name.trim(), unit: newFields.unit.trim(), lower_better: newFields.lower_better }] }));
    setNewFields({ id: "", name: "", unit: "", lower_better: false });
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    if (!confirm("이 종목을 삭제하시겠습니까?")) return;
    onMetaChange(prev => ({ ...prev, testTypes: prev.testTypes.filter(t => t.id !== id) }));
  };

  const inStyle = { ...S.input, padding: "7px 12px", fontSize: 13 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>⚙️ 종목 관리</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>테스트 종목을 추가·수정·삭제할 수 있습니다</p>
        </div>
        <button style={S.btn} onClick={() => setShowAdd(!showAdd)}>{showAdd ? "✕ 닫기" : "＋ 종목 추가"}</button>
      </div>

      {showAdd && (
        <div style={{ ...S.card, border: `1px solid ${LIME}30`, background: `${LIME}04`, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff" }}>새 종목 등록</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>종목명 *</label>
              <input style={inStyle} placeholder="예: 10M 스프린트" value={newFields.name} onChange={e => setNewFields(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>단위</label>
              <input style={inStyle} placeholder="예: 초, cm, 회" value={newFields.unit} onChange={e => setNewFields(p => ({ ...p, unit: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 6 }}>ID (영문, 선택)</label>
              <input style={inStyle} placeholder="예: sprint_10m" value={newFields.id} onChange={e => setNewFields(p => ({ ...p, id: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT, cursor: "pointer" }}>
                <input type="checkbox" checked={newFields.lower_better} onChange={e => setNewFields(p => ({ ...p, lower_better: e.target.checked }))} style={{ accentColor: LIME }} />
                낮을수록 좋음
              </label>
              <button style={S.btnSm} onClick={handleAdd} disabled={!newFields.name.trim()}>추가</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>종목명</th>
            <th style={{ ...S.th, display: isMobile ? "none" : "" }}>ID</th>
            <th style={S.th}>단위</th>
            <th style={S.th}>기준</th>
            <th style={{ ...S.th, textAlign: "right" }}></th>
          </tr></thead>
          <tbody>
            {testTypes.map(tt => (
              <tr key={tt.id}>
                {editingId === tt.id ? (
                  <>
                    <td style={{ ...S.td, padding: "8px 12px" }}>
                      <input style={{ ...inStyle, width: "100%" }} value={editFields.name} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))} />
                    </td>
                    <td style={{ ...S.td, display: isMobile ? "none" : "" }}><span style={{ color: TEXT2, fontSize: 12 }}>{tt.id}</span></td>
                    <td style={{ ...S.td, padding: "8px 8px" }}>
                      <input style={{ ...inStyle, width: 70 }} value={editFields.unit} onChange={e => setEditFields(p => ({ ...p, unit: e.target.value }))} />
                    </td>
                    <td style={S.td}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT, cursor: "pointer" }}>
                        <input type="checkbox" checked={editFields.lower_better} onChange={e => setEditFields(p => ({ ...p, lower_better: e.target.checked }))} style={{ accentColor: LIME }} />
                        낮을수록 좋음
                      </label>
                    </td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button style={S.btnSm} onClick={() => handleSaveEdit(tt.id)}>저장</button>
                        <button style={S.btnGhost} onClick={() => setEditingId(null)}>취소</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={S.td}><span style={{ fontWeight: 600, color: "#fff" }}>{tt.name}</span></td>
                    <td style={{ ...S.td, display: isMobile ? "none" : "" }}><span style={{ fontSize: 12, color: TEXT2, fontFamily: "monospace" }}>{tt.id}</span></td>
                    <td style={S.td}>{tt.unit}</td>
                    <td style={S.td}><span style={{ fontSize: isMobile ? 18 : 12, color: tt.lower_better ? BLUE : LIME }}>{isMobile ? (tt.lower_better ? "↓" : "↑") : (tt.lower_better ? "낮을수록 좋음" : "높을수록 좋음")}</span></td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button style={S.btnGhost} onClick={() => startEdit(tt)}>수정</button>
                        <button style={S.btnDanger} onClick={() => handleDelete(tt.id)}>삭제</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 파일 다운로드 (팀) ────────────────────────────────
function DownloadPage({ user, meta }) {
  const [downloading, setDownloading] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);

  const myFiles = meta.resultFiles.filter(f => f.academy_id === user.academy_id);
  const rounds  = [...new Set(myFiles.map(f => f.round))].sort();

  const filtered = selectedRound ? myFiles.filter(f => f.round === selectedRound) : myFiles;

  const handleDownload = async (file) => {
    setDownloading(file.id);
    try {
      if (!file.binId) { alert("이 파일은 구버전으로 업로드되었습니다. 관리자가 다시 업로드해야 합니다."); setDownloading(null); return; }
      const b64 = await cloudDownloadFile(file.binId);
      if (!b64) { alert("파일을 찾을 수 없습니다. 관리자에게 문의하세요."); setDownloading(null); return; }
      const blob = base64ToBlob(b64);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`다운로드 실패: ${e.message}`);
    }
    setDownloading(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>📁 결과 파일 다운로드</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>업로드된 결과 PDF를 다운로드하세요</p>
      </div>

      {/* 차시 필터 */}
      {rounds.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button
            style={selectedRound === null ? S.btn : S.btnOut}
            onClick={() => setSelectedRound(null)}
          >전체</button>
          {rounds.map(r => (
            <button key={r} style={selectedRound === r ? S.btn : S.btnOut} onClick={() => setSelectedRound(r)}>
              {r}차시
            </button>
          ))}
        </div>
      )}

      {/* 차시 카드 */}
      {selectedRound === null && rounds.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {rounds.map(r => {
            const cnt = myFiles.filter(f => f.round === r).length;
            return (
              <div key={r} onClick={() => setSelectedRound(r)} style={{ ...S.card, cursor: "pointer", marginBottom: 0, border: `1px solid ${BORDER}`, transition: "all 0.15s" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>{r}차시</div>
                <div style={{ fontSize: 13, color: LIME, marginTop: 4 }}>📄 {cnt}개 파일</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 파일 목록 */}
      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {selectedRound ? `${selectedRound}차시 파일` : "전체 파일"} ({filtered.length}개)
        </h3>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: TEXT2 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>업로드된 파일이 없습니다</div>
            <div style={{ fontSize: 13 }}>관리자가 파일을 업로드하면 여기에 표시됩니다</div>
          </div>
        ) : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>파일명</th>
              <th style={S.th}>차시</th>
              <th style={S.th}>크기</th>
              <th style={S.th}>업로드 일시</th>
              <th style={{ ...S.th, textAlign: "right" }}>다운로드</th>
            </tr></thead>
            <tbody>
              {[...filtered].reverse().map(f => (
                <tr key={f.id}>
                  <td style={S.td}>
                    <span style={{ marginRight: 8, fontSize: 18 }}>📕</span>
                    <span style={{ fontWeight: 500, color: "#fff" }}>{f.file_name}</span>
                  </td>
                  <td style={S.td}>{f.year}년 {f.round}차시</td>
                  <td style={S.td}>{fmt(f.file_size)}</td>
                  <td style={S.td}>{f.uploaded_at}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    <button
                      style={{ ...S.btnSm, opacity: downloading === f.id ? 0.6 : 1 }}
                      onClick={() => handleDownload(f)}
                      disabled={downloading === f.id}
                    >
                      {downloading === f.id ? "⏳ 준비중..." : "⬇️ 다운로드"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── 메인 앱 ────────────────────────────────────────────
export default function App() {
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [meta,     setMeta]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 초기 데이터 로드 (클라우드)
  const isFirstLoad = useRef(true);
  useEffect(() => {
    loadMeta().then(data => { setMeta(data); setLoading(false); });
  }, []);

  // meta 변경 시 클라우드 저장 (첫 로드는 저장 제외 - 빈 데이터 덮어쓰기 방지)
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!meta) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; } // 초기 로드 시 저장 안 함
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveMeta(meta), 800);
    return () => clearTimeout(saveTimer.current);
  }, [meta]);

  const handleUpload = (fileMeta) => {
    setMeta(prev => ({ ...prev, resultFiles: [...prev.resultFiles, fileMeta] }));
  };

  const [syncMsg, setSyncMsg] = useState(""); // "", "saving", "saved", "loading", "loaded", "error:..."

  const showSync = (msg, delay = 4000) => {
    setSyncMsg(msg);
    if (delay) setTimeout(() => setSyncMsg(""), delay);
  };

  // 강제 저장 (웹→클라우드)
  const handleForceSync = async () => {
    showSync("saving", 0);
    try {
      await saveToCloud(meta);
      localStorage.setItem("fdl-meta", JSON.stringify(meta));
      showSync("saved");
    } catch (e) { showSync(`error:${e.message}`); }
  };

  // 강제 재로드 (클라우드→현재 기기)
  const handleForceLoad = async () => {
    showSync("loading", 0);
    try {
      const cloud = await loadFromCloud();
      if (cloud) {
        validateMeta(cloud);
        localStorage.setItem("fdl-meta", JSON.stringify(cloud));
        isFirstLoad.current = true;
        setMeta(cloud);
        showSync("loaded");
      } else {
        showSync("error:클라우드에 저장된 데이터가 없습니다");
      }
    } catch (e) { showSync(`error:${e.message}`); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: DARK, flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, background: LIME, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: DARK, fontSize: 16 }}>FDL</div>
      <div style={{ color: TEXT2, fontSize: 14 }}>데이터 불러오는 중...</div>
    </div>
  );

  const isAdmin = user?.role === "admin";

  if (!user) return <LoginScreen users={meta.users} onLogin={setUser} />;

  const adminNav = [
    { id: "dashboard",  icon: "📊", label: "대시보드" },
    { id: "teams",      icon: "🏫", label: "팀 관리" },
    { id: "dataentry",  icon: "✏️",  label: "수기 입력" },
    { id: "upload",     icon: "📤", label: "파일 업로드" },
    { id: "testtypes",  icon: "⚙️",  label: "종목 관리" },
  ];
  const teamNav = [
    { id: "dashboard", icon: "📊", label: "대시보드" },
    { id: "download",  icon: "📁", label: "결과 다운로드" },
  ];
  const navItems = isAdmin ? adminNav : teamNav;

  return (
    <MobileCtx.Provider value={isMobile}>
    {/* 오류 토스트 */}
    {syncMsg.startsWith("error") && (
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: RED, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, maxWidth: "90vw", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        ❌ {syncMsg.replace("error:", "")}
      </div>
    )}
    <div style={S.app}>
      {/* 사이드바 (데스크탑만) */}
      {!isMobile && (
        <div style={{ ...S.sidebar, ...(collapsed ? S.sidebarC : {}) }}>
          <Logo collapsed={collapsed} />
          <nav style={{ flex: 1, paddingTop: 12 }}>
            {navItems.map(item => (
              <NavItem key={item.id} icon={item.icon} label={item.label} active={page === item.id} onClick={() => setPage(item.id)} collapsed={collapsed} />
            ))}
          </nav>
          <div style={{ padding: collapsed ? "16px 12px" : "16px 24px", borderTop: `1px solid ${BORDER}` }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${LIME}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {isAdmin ? "👑" : "👤"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{isAdmin ? "관리자" : "팀 계정"}</div>
                </div>
              </div>
            )}
            <button style={{ ...S.btnGhost, width: "100%", textAlign: collapsed ? "center" : "left", color: RED, fontSize: 13 }} onClick={() => { setUser(null); setPage("dashboard"); }}>
              {collapsed ? "🚪" : "🚪 로그아웃"}
            </button>
          </div>
        </div>
      )}

      {/* 메인 */}
      <div style={{ ...S.main, ...(isMobile ? { marginLeft: 0, paddingBottom: 64 } : collapsed ? S.mainC : {}) }}>
        {/* 탑바 */}
        <div style={{ ...S.topBar, padding: isMobile ? "0 16px" : "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {!isMobile && (
              <button style={{ ...S.btnGhost, fontSize: 18, padding: "4px 8px" }} onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? "☰" : "✕"}
              </button>
            )}
            <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#fff" }}>
              {navItems.find(n => n.id === page)?.icon} {navItems.find(n => n.id === page)?.label}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isAdmin && (
              <span style={{ ...S.badge, background: `${BLUE}15`, color: BLUE, fontSize: isMobile ? 11 : 12 }}>
                {meta.academies.find(a => a.id === user.academy_id)?.name}
              </span>
            )}
            <button
              style={{ ...S.btnGhost, fontSize: 12, padding: "6px 10px", color: syncMsg.startsWith("error") ? RED : syncMsg === "saved" || syncMsg === "loaded" ? LIME : TEXT2, border: `1px solid ${BORDER}`, borderRadius: 8, maxWidth: isMobile ? 120 : 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onClick={isAdmin ? handleForceSync : handleForceLoad}
              disabled={syncMsg === "saving" || syncMsg === "loading"}
              title={syncMsg.startsWith("error") ? syncMsg.replace("error:", "") : ""}
            >
              {syncMsg === "saving" ? "⏳ 저장중..." : syncMsg === "loading" ? "⏳ 로딩중..." : syncMsg === "saved" ? "✅ 저장됨" : syncMsg === "loaded" ? "✅ 불러옴" : syncMsg.startsWith("error") ? "❌ 오류" : isAdmin ? "☁️ 저장" : "🔄 새로고침"}
            </button>
            {!isMobile && <span style={{ fontSize: 13, color: TEXT2 }}>{new Date().getFullYear()}년</span>}
            {isMobile && (
              <button style={{ ...S.btnGhost, color: RED, fontSize: 13, padding: "6px 10px" }} onClick={() => { setUser(null); setPage("dashboard"); }}>
                🚪
              </button>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{ ...S.content, padding: isMobile ? "16px" : "28px 32px" }}>
          {page === "dashboard"  && <DashboardPage user={user} academies={meta.academies} resultFiles={meta.resultFiles} dashboards={meta.dashboards} testTypes={meta.testTypes ?? DEFAULT_TEST_TYPES} />}
          {page === "teams"      && isAdmin && <TeamsPage meta={meta} onMetaChange={setMeta} />}
          {page === "dataentry"  && isAdmin && <DataEntryPage meta={meta} onMetaChange={setMeta} />}
          {page === "upload"     && isAdmin && <UploadPage meta={meta} onUpload={handleUpload} onDeleteFile={(id) => setMeta(prev => ({ ...prev, resultFiles: prev.resultFiles.filter(f => f.id !== id) }))} />}
          {page === "testtypes"  && isAdmin && <TestTypesPage meta={meta} onMetaChange={setMeta} />}
          {page === "download"   && !isAdmin && <DownloadPage user={user} meta={meta} />}
        </div>
      </div>

      {/* 하단 탭바 (모바일만) */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "#0D0D0D", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 100 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", color: page === item.id ? LIME : TEXT2, flex: 1 }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: page === item.id ? 700 : 400, whiteSpace: "nowrap" }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
    </MobileCtx.Provider>
  );
}
