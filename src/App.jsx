import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const LIME = "#C8FF00";
const DARK = "#0A0A0A";
const CARD = "#141414";
const CARD2 = "#1A1A1A";
const BORDER = "#2A2A2A";
const TEXT = "#E0E0E0";
const TEXT2 = "#888888";
const RED = "#FF4D4D";
const BLUE = "#4DA6FF";
const PURPLE = "#A855F7";
const ORANGE = "#FF9F43";

// Mock Data
const ACADEMIES = [
  { id: 1, name: "KSA 축구 아카데미", location: "서울 강남구", players: 42, created_at: "2025-03-15" },
  { id: 2, name: "RC스포츠 아카데미", location: "서울 송파구", players: 38, created_at: "2025-04-01" },
  { id: 3, name: "MK 풋볼클럽", location: "경기 성남시", players: 35, created_at: "2025-05-10" },
  { id: 4, name: "REVE 축구교실", location: "경기 용인시", players: 28, created_at: "2025-06-20" },
  { id: 5, name: "KICKS 아카데미", location: "서울 강동구", players: 31, created_at: "2025-07-01" },
];

const USERS = [
  { id: 1, email: "admin@fdl.com", password: "admin", role: "admin", academy_id: null, name: "관리자" },
  { id: 2, email: "ksa@academy.com", password: "ksa123", role: "academy", academy_id: 1, name: "KSA 관리자" },
  { id: 3, email: "rc@academy.com", password: "rc123", role: "academy", academy_id: 2, name: "RC스포츠 관리자" },
  { id: 4, email: "mk@academy.com", password: "mk123", role: "academy", academy_id: 3, name: "MK 관리자" },
];

const TEST_TYPES = [
  { id: "sprint_20m", name: "20M 스프린트", unit: "초", category: "순발력", icon: "⚡", lower_better: true },
  { id: "jump", name: "서전트 점프", unit: "cm", category: "근력", icon: "🦵", lower_better: false },
  { id: "yoyo", name: "YOYO TEST", unit: "회", category: "지구력", icon: "❤️", lower_better: false },
  { id: "pass", name: "다각 패스 TEST", unit: "회", category: "패스", icon: "🎯", lower_better: false },
  { id: "dribble", name: "드리블 슬라럼", unit: "초", category: "드리블", icon: "⚽", lower_better: true },
  { id: "shooting", name: "슈팅 스피드", unit: "km/h", category: "슈팅", icon: "🥅", lower_better: false },
  { id: "agility", name: "민첩성 테스트", unit: "초", category: "민첩성", icon: "🔄", lower_better: true },
];

const PLAYERS_DATA = {};
const PLAYER_NAMES = [
  "김민준","박서준","이도윤","최준호","정예준","강지호","윤시우","한승민","오태양","임현우",
  "송재원","조건우","배유찬","허민석","문주원","남하준","신동현","권서진","류우진","장태민",
  "양지안","곽승우","홍세현","전준혁","황인우","구동윤","차시훈","표예성","봉지율","원하람",
  "설윤호","진서윤","편도현","방지환","감우빈","팽석현","노은찬","추다온","하루한","사윤서",
  "옥민성","도재하"
];

function generatePlayerData() {
  ACADEMIES.forEach(academy => {
    PLAYERS_DATA[academy.id] = [];
    const count = academy.players;
    for (let i = 0; i < count; i++) {
      const playerName = PLAYER_NAMES[i % PLAYER_NAMES.length] + (i >= PLAYER_NAMES.length ? `(${Math.floor(i/PLAYER_NAMES.length)+1})` : "");
      const records = {};
      TEST_TYPES.forEach(tt => {
        records[tt.id] = {};
        for (let round = 1; round <= 3; round++) {
          let base;
          switch(tt.id) {
            case "sprint_20m": base = 3.5 + Math.random() * 1.2; break;
            case "jump": base = 35 + Math.random() * 30; break;
            case "yoyo": base = 20 + Math.floor(Math.random() * 20); break;
            case "pass": base = 10 + Math.floor(Math.random() * 15); break;
            case "dribble": base = 10.5 + Math.random() * 3; break;
            case "shooting": base = 50 + Math.random() * 50; break;
            case "agility": base = 8 + Math.random() * 4; break;
            default: base = 10;
          }
          const improvement = tt.lower_better ? -(round-1)*0.1*Math.random() : (round-1)*2*Math.random();
          records[tt.id][round] = Math.round((base + improvement) * 100) / 100;
        }
      });
      PLAYERS_DATA[academy.id].push({ name: playerName, age: 8 + Math.floor(Math.random()*7), position: ["FW","MF","DF","GK"][Math.floor(Math.random()*4)], records });
    }
  });
}
generatePlayerData();

const TESTS = [
  { id: 1, year: 2025, round: 1, academy_id: 1, date: "2025-04-15" },
  { id: 2, year: 2025, round: 2, academy_id: 1, date: "2025-07-20" },
  { id: 3, year: 2025, round: 3, academy_id: 1, date: "2025-10-10" },
  { id: 4, year: 2025, round: 1, academy_id: 2, date: "2025-04-18" },
  { id: 5, year: 2025, round: 2, academy_id: 2, date: "2025-07-22" },
  { id: 6, year: 2025, round: 3, academy_id: 2, date: "2025-10-12" },
  { id: 7, year: 2025, round: 1, academy_id: 3, date: "2025-04-20" },
  { id: 8, year: 2025, round: 2, academy_id: 3, date: "2025-07-25" },
  { id: 9, year: 2025, round: 1, academy_id: 4, date: "2025-05-01" },
  { id: 10, year: 2025, round: 2, academy_id: 4, date: "2025-08-01" },
  { id: 11, year: 2025, round: 1, academy_id: 5, date: "2025-05-05" },
  { id: 12, year: 2025, round: 2, academy_id: 5, date: "2025-08-05" },
  { id: 13, year: 2025, round: 3, academy_id: 5, date: "2025-11-01" },
];

const RESULT_FILES = [
  { id: 1, academy_id: 1, test_id: 1, file_name: "KSA_2025_1차시_개인리포트.pdf", file_type: "pdf" },
  { id: 2, academy_id: 1, test_id: 1, file_name: "KSA_2025_1차시_팀리포트.pdf", file_type: "pdf" },
  { id: 3, academy_id: 1, test_id: 2, file_name: "KSA_2025_2차시_개인리포트.pdf", file_type: "pdf" },
  { id: 4, academy_id: 1, test_id: 2, file_name: "KSA_2025_2차시_팀리포트.pdf", file_type: "pdf" },
  { id: 5, academy_id: 1, test_id: 3, file_name: "KSA_2025_3차시_개인리포트.pdf", file_type: "pdf" },
  { id: 6, academy_id: 1, test_id: 3, file_name: "KSA_2025_3차시_팀리포트.xlsx", file_type: "excel" },
  { id: 7, academy_id: 2, test_id: 4, file_name: "RC스포츠_2025_1차시_리포트.pdf", file_type: "pdf" },
  { id: 8, academy_id: 2, test_id: 5, file_name: "RC스포츠_2025_2차시_리포트.pdf", file_type: "pdf" },
  { id: 9, academy_id: 3, test_id: 7, file_name: "MK_2025_1차시_리포트.pdf", file_type: "pdf" },
  { id: 10, academy_id: 4, test_id: 9, file_name: "REVE_2025_1차시_리포트.pdf", file_type: "pdf" },
  { id: 11, academy_id: 5, test_id: 11, file_name: "KICKS_2025_1차시_리포트.pdf", file_type: "pdf" },
  { id: 12, academy_id: 5, test_id: 12, file_name: "KICKS_2025_2차시_리포트.pdf", file_type: "pdf" },
];

// Styles
const styles = {
  app: { fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif", background: DARK, color: TEXT, minHeight: "100vh", display: "flex" },
  sidebar: { width: 260, background: "#0D0D0D", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarCollapsed: { width: 64 },
  main: { flex: 1, marginLeft: 260, minHeight: "100vh" },
  mainCollapsed: { marginLeft: 64 },
  topBar: { height: 64, background: "#0D0D0D", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 },
  content: { padding: "28px 32px" },
  card: { background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, marginBottom: 20 },
  cardHover: { transition: "all 0.2s ease", cursor: "pointer" },
  statCard: { background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px 24px", flex: 1, minWidth: 200 },
  btn: { background: LIME, color: DARK, border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.15s ease" },
  btnOutline: { background: "transparent", color: LIME, border: `1px solid ${LIME}`, borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnGhost: { background: "transparent", color: TEXT2, border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: 8, fontSize: 14 },
  input: { background: CARD2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" },
  select: { background: CARD2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", cursor: "pointer" },
  badge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${BORDER}` },
  td: { padding: "14px 16px", borderBottom: `1px solid ${BORDER}15`, fontSize: 14 },
  loginBg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${DARK} 0%, #111 50%, #0D0D0D 100%)`, position: "relative", overflow: "hidden" },
};

// Components
function Logo({ collapsed }) {
  return (
    <div style={{ padding: collapsed ? "20px 12px" : "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: LIME, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: DARK, fontSize: 16, flexShrink: 0 }}>
          FDL
        </div>
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

function NavItem({ icon, label, active, onClick, collapsed, badge: badgeCount }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: collapsed ? "12px 20px" : "12px 24px",
        cursor: "pointer", borderRadius: 0,
        background: active ? `${LIME}12` : "transparent",
        borderLeft: active ? `3px solid ${LIME}` : "3px solid transparent",
        color: active ? "#fff" : TEXT2,
        transition: "all 0.15s ease",
        fontSize: 14, fontWeight: active ? 600 : 400,
        position: "relative",
      }}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
      {badgeCount && !collapsed && (
        <span style={{ marginLeft: "auto", background: LIME, color: DARK, borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{badgeCount}</span>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = LIME }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, color: TEXT2, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function RankBadge({ rank }) {
  const colors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const bg = colors[rank] || TEXT2;
  return (
    <span style={{ width: 28, height: 28, borderRadius: "50%", background: rank <= 3 ? bg : CARD2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: rank <= 3 ? DARK : TEXT2 }}>
      {rank}
    </span>
  );
}

function ChangeIndicator({ value, unit, lowerBetter }) {
  if (value === 0 || value === undefined) return <span style={{ color: TEXT2 }}>-</span>;
  const isPositive = lowerBetter ? value < 0 : value > 0;
  const arrow = isPositive ? "▲" : "▼";
  const color = isPositive ? LIME : RED;
  return (
    <span style={{ color, fontWeight: 600, fontSize: 13 }}>
      {arrow} {Math.abs(value).toFixed(2)}{unit}
    </span>
  );
}

// Login Screen
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={styles.loginBg}>
      <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, background: `radial-gradient(circle, ${LIME}08 0%, transparent 70%)`, borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, background: `radial-gradient(circle, ${LIME}05 0%, transparent 70%)`, borderRadius: "50%" }} />
      
      <div style={{ background: CARD, borderRadius: 24, border: `1px solid ${BORDER}`, padding: 48, width: 420, maxWidth: "90vw", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: LIME, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: DARK, fontSize: 22, marginBottom: 16 }}>FDL</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>FOOTBALL DATALAB</h1>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 8 }}>데이터로 구축하는 축구 아카데미의 미래</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: TEXT2, fontWeight: 500, display: "block", marginBottom: 8 }}>이메일</label>
          <input
            style={styles.input}
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, color: TEXT2, fontWeight: 500, display: "block", marginBottom: 8 }}>비밀번호</label>
          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && (
          <div style={{ background: `${RED}15`, border: `1px solid ${RED}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: RED, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          style={{ ...styles.btn, width: "100%", padding: "14px", fontSize: 15, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div style={{ marginTop: 32, padding: 16, background: CARD2, borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 12, color: TEXT2, marginBottom: 8, fontWeight: 600 }}>테스트 계정</div>
          <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.8 }}>
            <span style={{ color: LIME }}>관리자</span> admin@fdl.com / admin<br/>
            <span style={{ color: LIME }}>아카데미</span> ksa@academy.com / ksa123
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage({ user, academyId }) {
  const [selectedGrowthPlayer, setSelectedGrowthPlayer] = useState(0);

  const academy = ACADEMIES.find(a => a.id === academyId);
  const players = PLAYERS_DATA[academyId] || [];
  const tests = TESTS.filter(t => t.academy_id === academyId);
  const latestRound = Math.max(...tests.map(t => t.round));

  // Top performers
  const getTopPerformer = (testTypeId) => {
    const tt = TEST_TYPES.find(t => t.id === testTypeId);
    let best = null;
    let bestVal = tt.lower_better ? Infinity : -Infinity;
    players.forEach(p => {
      const val = p.records[testTypeId]?.[latestRound];
      if (val !== undefined) {
        if (tt.lower_better ? val < bestVal : val > bestVal) {
          bestVal = val;
          best = p;
        }
      }
    });
    return best ? { name: best.name, value: bestVal, unit: tt.unit } : null;
  };

  // Team averages by round
  const teamAvgData = [];
  for (let r = 1; r <= 3; r++) {
    const entry = { round: `${r}차시` };
    TEST_TYPES.forEach(tt => {
      const vals = players.map(p => p.records[tt.id]?.[r]).filter(v => v !== undefined);
      entry[tt.name] = vals.length ? Math.round((vals.reduce((a,b) => a+b, 0) / vals.length) * 100) / 100 : 0;
    });
    teamAvgData.push(entry);
  }

  // Radar data for latest round
  const radarData = TEST_TYPES.map(tt => {
    const vals = players.map(p => p.records[tt.id]?.[latestRound]).filter(v => v !== undefined);
    const avg = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
    let normalized;
    switch(tt.id) {
      case "sprint_20m": normalized = Math.max(0, 100 - (avg - 3.0) * 40); break;
      case "jump": normalized = Math.min(100, (avg / 65) * 100); break;
      case "yoyo": normalized = Math.min(100, (avg / 40) * 100); break;
      case "pass": normalized = Math.min(100, (avg / 25) * 100); break;
      case "dribble": normalized = Math.max(0, 100 - (avg - 10) * 20); break;
      case "shooting": normalized = Math.min(100, (avg / 100) * 100); break;
      case "agility": normalized = Math.max(0, 100 - (avg - 8) * 20); break;
      default: normalized = 50;
    }
    return { category: tt.category, value: Math.round(normalized), fullMark: 100 };
  });

  // Distribution data for sprint
  const sprintDist = [];
  const ranges = [
    { label: "~3.0", min: 0, max: 3.0 },
    { label: "3.0~3.5", min: 3.0, max: 3.5 },
    { label: "3.5~4.0", min: 3.5, max: 4.0 },
    { label: "4.0~4.5", min: 4.0, max: 4.5 },
    { label: "4.5~", min: 4.5, max: 99 },
  ];
  ranges.forEach(r => {
    const count = players.filter(p => {
      const v = p.records.sprint_20m?.[latestRound];
      return v !== undefined && v >= r.min && v < r.max;
    }).length;
    sprintDist.push({ range: r.label, count });
  });

  const isAdmin = user.role === "admin";
  const totalPlayers = isAdmin ? ACADEMIES.reduce((s,a) => s + a.players, 0) : players.length;
  const totalTests = isAdmin ? TESTS.length : tests.length;
  const totalAcademies = isAdmin ? ACADEMIES.length : 1;

  const CHART_COLORS = [LIME, BLUE, PURPLE, ORANGE, "#FF6B6B", "#4ECDC4", "#FFE66D"];

  // 정규화 함수 (0~100, 높을수록 좋음)
  const normalizeVal = (testId, val) => {
    switch(testId) {
      case "sprint_20m": return Math.max(0, Math.min(100, Math.round((1 - (val - 3.0) / 1.5) * 100)));
      case "jump":       return Math.min(100, Math.round((val / 65) * 100));
      case "yoyo":       return Math.min(100, Math.round((val / 40) * 100));
      case "pass":       return Math.min(100, Math.round((val / 25) * 100));
      case "dribble":    return Math.max(0, Math.min(100, Math.round((1 - (val - 10) / 3.5) * 100)));
      case "shooting":   return Math.min(100, Math.round((val / 100) * 100));
      case "agility":    return Math.max(0, Math.min(100, Math.round((1 - (val - 8) / 4) * 100)));
      default: return 50;
    }
  };

  const heatColor = (score) => {
    if (score >= 80) return "#C8FF00";
    if (score >= 60) return "#7FD400";
    if (score >= 40) return "#FFD700";
    if (score >= 20) return "#FF9F43";
    return "#FF4D4D";
  };

  // 히트맵: 평균 점수 상위 12명
  const heatmapData = players
    .map(p => {
      const scores = TEST_TYPES.map(tt => {
        const val = p.records[tt.id]?.[latestRound];
        return val !== undefined ? normalizeVal(tt.id, val) : 0;
      });
      return { ...p, scores, avg: scores.reduce((a, b) => a + b, 0) / scores.length };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 12);

  // 차시별 평균 비교 (정규화)
  const roundCompareData = TEST_TYPES.map(tt => {
    const entry = { name: tt.category, icon: tt.icon };
    for (let r = 1; r <= 3; r++) {
      const vals = players.map(p => p.records[tt.id]?.[r]).filter(v => v !== undefined);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      entry[`r${r}`] = Math.round(normalizeVal(tt.id, avg));
    }
    return entry;
  });

  // 선수별 성장 추이
  const growthPlayer = players[selectedGrowthPlayer];
  const playerGrowthData = growthPlayer ? [1, 2, 3].map(r => {
    const entry = { round: `${r}차시` };
    TEST_TYPES.forEach(tt => {
      const val = growthPlayer.records[tt.id]?.[r];
      entry[tt.name] = val !== undefined ? normalizeVal(tt.id, val) : null;
    });
    return entry;
  }) : [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
          {isAdmin ? "전체 대시보드" : `${academy?.name} 대시보드`}
        </h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>
          {isAdmin ? "풋볼데이터랩 전체 현황을 확인하세요" : "아카데미 데이터 현황을 확인하세요"}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon="🏟️" label="등록 아카데미" value={totalAcademies} sub={isAdmin ? "활성 계약" : academy?.location} />
        <StatCard icon="👥" label="등록 선수" value={`${totalPlayers}명`} sub={isAdmin ? "전체 선수" : "소속 선수"} />
        <StatCard icon="📋" label="테스트 수" value={`${totalTests}회`} sub="완료된 테스트" color={BLUE} />
        <StatCard icon="📊" label="최근 차시" value={`${latestRound}차시`} sub="2025년 기준" color={PURPLE} />
      </div>

      {/* Top Performers */}
      <div style={{ ...styles.card, padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BORDER}`, background: "linear-gradient(90deg, #1a1a00 0%, #141414 100%)" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            🏆 테스트별 최고 기록 선수
            <span style={{ fontSize: 12, color: TEXT2, fontWeight: 400 }}>({latestRound}차시 기준)</span>
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 0 }}>
          {TEST_TYPES.map((tt, i) => {
            const top = getTopPerformer(tt.id);
            return (
              <div key={tt.id} style={{
                padding: "22px 20px",
                borderRight: i % 4 !== 3 ? `1px solid ${BORDER}` : "none",
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 6,
                background: CARD,
                transition: "background 0.2s",
              }}>
                {/* Icon Circle */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: `${LIME}18`,
                  border: `2px solid ${LIME}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  marginBottom: 4,
                }}>
                  {tt.icon}
                </div>
                {/* Category */}
                <div style={{ fontSize: 11, color: LIME, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{tt.category}</div>
                {/* Test Name */}
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 4 }}>{tt.name}</div>
                {top ? (
                  <>
                    {/* Record Value */}
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      {top.value}
                      <span style={{ fontSize: 13, fontWeight: 500, color: TEXT2, marginLeft: 3 }}>{top.unit}</span>
                    </div>
                    {/* Medal + Name */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                      background: "#2a2200",
                      border: "1px solid #FFD70040",
                      borderRadius: 20,
                      padding: "4px 12px",
                    }}>
                      <span style={{ fontSize: 16 }}>🥇</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#FFD700" }}>{top.name}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: TEXT2, marginTop: 8 }}>데이터 없음</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Radar Chart */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🕸️ 팀 능력치 분석</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={BORDER} />
              <PolarAngleAxis dataKey="category" tick={{ fill: TEXT2, fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: TEXT2, fontSize: 10 }} />
              <Radar name="팀 평균" dataKey="value" stroke={LIME} fill={LIME} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Sprint Distribution */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📊 20M 스프린트 기록 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sprintDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="range" tick={{ fill: TEXT2, fontSize: 12 }} axisLine={{ stroke: BORDER }} />
              <YAxis tick={{ fill: TEXT2, fontSize: 12 }} axisLine={{ stroke: BORDER }} />
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT }} />
              <Bar dataKey="count" name="선수 수" radius={[6, 6, 0, 0]}>
                {sprintDist.map((_, i) => (
                  <Cell key={i} fill={i === 1 ? LIME : `${LIME}60`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Average Trend */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📈 차시별 팀 평균 추이</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={teamAvgData}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="round" tick={{ fill: TEXT2, fontSize: 12 }} axisLine={{ stroke: BORDER }} />
            <YAxis tick={{ fill: TEXT2, fontSize: 12 }} axisLine={{ stroke: BORDER }} />
            <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT }} />
            <Legend wrapperStyle={{ fontSize: 12, color: TEXT2 }} />
            {TEST_TYPES.slice(0, 5).map((tt, i) => (
              <Line key={tt.id} type="monotone" dataKey={tt.name} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ fill: CHART_COLORS[i], r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차시별 평균 비교 */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📊 차시별 팀 평균 비교</h3>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: TEXT2 }}>각 종목별 1→3차시 팀 평균 점수 변화 (100점 기준 정규화)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={roundCompareData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis
              dataKey="icon"
              tick={{ fill: TEXT2, fontSize: 18 }}
              axisLine={{ stroke: BORDER }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} tick={{ fill: TEXT2, fontSize: 11 }} axisLine={{ stroke: BORDER }} unit="점" />
            <Tooltip
              contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT }}
              formatter={(val, name) => [`${val}점`, name]}
              labelFormatter={(label) => {
                const item = roundCompareData.find(d => d.icon === label);
                return `${label} ${item?.name ?? ""}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: TEXT2, paddingTop: 8 }} />
            <Bar dataKey="r1" name="1차시" fill={BLUE} radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="r2" name="2차시" fill={PURPLE} radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="r3" name="3차시" fill={LIME} radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 선수별 성장 추이 */}
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>📈 선수별 성장 추이</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: TEXT2 }}>차시별 종합 능력치 변화 (100점 기준 정규화)</p>
          </div>
          <select
            style={styles.select}
            value={selectedGrowthPlayer}
            onChange={e => setSelectedGrowthPlayer(Number(e.target.value))}
          >
            {players.map((p, i) => (
              <option key={i} value={i}>{p.name} ({p.position})</option>
            ))}
          </select>
        </div>
        {growthPlayer && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ ...styles.badge, background: `${BLUE}20`, color: BLUE }}>{growthPlayer.age}세</span>
            <span style={{ ...styles.badge, background: `${LIME}20`, color: LIME }}>{growthPlayer.position}</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={playerGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="round" tick={{ fill: TEXT2, fontSize: 12 }} axisLine={{ stroke: BORDER }} />
            <YAxis domain={[0, 100]} tick={{ fill: TEXT2, fontSize: 11 }} axisLine={{ stroke: BORDER }} unit="점" />
            <Tooltip
              contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT }}
              formatter={(val) => val !== null ? [`${val}점`] : ["-"]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: TEXT2 }} />
            {TEST_TYPES.map((tt, i) => (
              <Line
                key={tt.id}
                type="monotone"
                dataKey={tt.name}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[i], r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 히트맵 */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>🌡️ 선수 퍼포먼스 히트맵</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: TEXT2 }}>종합 점수 상위 12명 · {latestRound}차시 기준 · 색상이 밝을수록 높은 성과</p>
        {/* 범례 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 11, color: TEXT2 }}>
          <span>낮음</span>
          {["#FF4D4D", "#FF9F43", "#FFD700", "#7FD400", "#C8FF00"].map((c, i) => (
            <div key={i} style={{ width: 24, height: 14, borderRadius: 3, background: c }} />
          ))}
          <span>높음</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 580 }}>
            {/* 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "130px repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
              <div />
              {TEST_TYPES.map(tt => (
                <div key={tt.id} style={{ textAlign: "center", fontSize: 11, color: TEXT2, padding: "4px 0" }}>
                  <div style={{ fontSize: 18 }}>{tt.icon}</div>
                  <div style={{ marginTop: 2 }}>{tt.category}</div>
                </div>
              ))}
            </div>
            {/* 데이터 행 */}
            {heatmapData.map((p, rowIdx) => (
              <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: "130px repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 8 }}>
                  <span style={{ color: rowIdx < 3 ? "#FFD700" : TEXT2, fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: "right" }}>
                    {rowIdx === 0 ? "🥇" : rowIdx === 1 ? "🥈" : rowIdx === 2 ? "🥉" : `${rowIdx + 1}`}
                  </span>
                  <span style={{ fontSize: 12, color: TEXT, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                </div>
                {p.scores.map((score, colIdx) => {
                  const tt = TEST_TYPES[colIdx];
                  const rawVal = p.records[tt.id]?.[latestRound];
                  return (
                    <div
                      key={colIdx}
                      title={`${p.name} · ${tt.name}: ${rawVal ?? "-"}${tt.unit} (${score}점)`}
                      style={{
                        height: 36,
                        borderRadius: 6,
                        background: heatColor(score),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: score >= 40 ? "#0A0A0A" : "#fff",
                        cursor: "default",
                      }}
                    >
                      {score}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      {isAdmin && (
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>📋 최근 테스트 현황</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>아카데미</th>
                <th style={styles.th}>연도</th>
                <th style={styles.th}>차시</th>
                <th style={styles.th}>날짜</th>
                <th style={styles.th}>상태</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.slice(-8).reverse().map(t => {
                const ac = ACADEMIES.find(a => a.id === t.academy_id);
                return (
                  <tr key={t.id}>
                    <td style={styles.td}><span style={{ fontWeight: 600, color: "#fff" }}>{ac?.name}</span></td>
                    <td style={styles.td}>{t.year}</td>
                    <td style={styles.td}>{t.round}차시</td>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: `${LIME}20`, color: LIME }}>완료</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Rankings Page
function RankingsPage({ academyId }) {
  const [selectedTest, setSelectedTest] = useState("sprint_20m");
  const [selectedRound, setSelectedRound] = useState(3);
  const tt = TEST_TYPES.find(t => t.id === selectedTest);
  const players = PLAYERS_DATA[academyId] || [];

  const ranked = players
    .map(p => ({ ...p, value: p.records[selectedTest]?.[selectedRound] }))
    .filter(p => p.value !== undefined)
    .sort((a, b) => tt.lower_better ? a.value - b.value : b.value - a.value);

  // Growth data for top player
  const topPlayer = ranked[0];
  const growthData = topPlayer ? [1,2,3].map(r => ({
    round: `${r}차시`,
    value: topPlayer.records[selectedTest]?.[r] || 0
  })) : [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🏅 선수 랭킹</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>테스트별 선수 순위를 확인하세요</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select style={styles.select} value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
          {TEST_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
        <select style={styles.select} value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))}>
          {[1,2,3].map(r => <option key={r} value={r}>{r}차시</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Ranking Table */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>
            {tt.icon} {tt.name} 랭킹 ({selectedRound}차시)
          </h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{...styles.th, width: 50}}>순위</th>
                <th style={styles.th}>선수</th>
                <th style={styles.th}>나이</th>
                <th style={styles.th}>포지션</th>
                <th style={{...styles.th, textAlign: "right"}}>기록</th>
                <th style={{...styles.th, textAlign: "right"}}>변화</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 20).map((p, i) => {
                const prevVal = p.records[selectedTest]?.[selectedRound - 1];
                const change = prevVal ? Math.round((p.value - prevVal) * 100) / 100 : 0;
                return (
                  <tr key={i} style={{ background: i < 3 ? `${LIME}05` : "transparent" }}>
                    <td style={styles.td}><RankBadge rank={i + 1} /></td>
                    <td style={styles.td}><span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span></td>
                    <td style={styles.td}>{p.age}세</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: p.position === "FW" ? `${RED}20` : p.position === "MF" ? `${BLUE}20` : p.position === "DF" ? `${LIME}20` : `${PURPLE}20`, color: p.position === "FW" ? RED : p.position === "MF" ? BLUE : p.position === "DF" ? LIME : PURPLE }}>
                        {p.position}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: 700, color: i === 0 ? LIME : "#fff", fontSize: i === 0 ? 16 : 14 }}>
                      {p.value}{tt.unit}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <ChangeIndicator value={change} unit={tt.unit} lowerBetter={tt.lower_better} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side Panel */}
        <div>
          {/* Top Player Card */}
          {topPlayer && (
            <div style={{ ...styles.card, background: `linear-gradient(135deg, ${CARD} 0%, ${LIME}08 100%)`, border: `1px solid ${LIME}30` }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${LIME}20`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 12 }}>🥇</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{topPlayer.name}</div>
                <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>{topPlayer.age}세 · {topPlayer.position}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: LIME, marginTop: 16 }}>{topPlayer.value}<span style={{ fontSize: 16, fontWeight: 500 }}>{tt.unit}</span></div>
                <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>{tt.name} 1위</div>
              </div>
            </div>
          )}

          {/* Growth Chart */}
          {topPlayer && (
            <div style={styles.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#fff" }}>📈 {topPlayer.name} 성장 추이</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="round" tick={{ fill: TEXT2, fontSize: 11 }} axisLine={{ stroke: BORDER }} />
                  <YAxis tick={{ fill: TEXT2, fontSize: 11 }} axisLine={{ stroke: BORDER }} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT }} />
                  <Line type="monotone" dataKey="value" stroke={LIME} strokeWidth={3} dot={{ fill: LIME, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Results Download Page
function ResultsPage({ user, academyId }) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedRound, setSelectedRound] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const tests = TESTS.filter(t => t.academy_id === academyId && t.year === selectedYear);
  const rounds = [...new Set(tests.map(t => t.round))].sort();

  const filteredFiles = RESULT_FILES.filter(f => {
    if (f.academy_id !== academyId) return false;
    if (selectedRound) {
      const test = TESTS.find(t => t.id === f.test_id);
      return test && test.round === selectedRound && test.year === selectedYear;
    }
    return true;
  });

  const handleDownload = (file) => {
    setDownloadingId(file.id);
    setTimeout(() => {
      setDownloadingId(null);
      alert(`"${file.file_name}" 다운로드가 시작되었습니다.\n(데모에서는 실제 파일이 다운로드되지 않습니다)`);
    }, 800);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>📁 결과지 다운로드</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>테스트 결과 리포트를 다운로드하세요</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select style={styles.select} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          <option value={2025}>2025년</option>
        </select>
        <select style={styles.select} value={selectedRound || ""} onChange={e => setSelectedRound(e.target.value ? Number(e.target.value) : null)}>
          <option value="">전체 차시</option>
          {rounds.map(r => <option key={r} value={r}>{r}차시</option>)}
        </select>
      </div>

      {/* Round cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        {rounds.map(r => {
          const test = tests.find(t => t.round === r);
          const fileCount = RESULT_FILES.filter(f => f.test_id === test?.id).length;
          const isSelected = selectedRound === r;
          return (
            <div
              key={r}
              onClick={() => setSelectedRound(isSelected ? null : r)}
              style={{
                ...styles.card,
                cursor: "pointer",
                marginBottom: 0,
                border: `1px solid ${isSelected ? LIME : BORDER}`,
                background: isSelected ? `${LIME}08` : CARD,
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 900, color: isSelected ? LIME : "#fff" }}>{r}차시</div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 8 }}>{test?.date}</div>
              <div style={{ fontSize: 13, color: isSelected ? LIME : TEXT2, marginTop: 4 }}>📄 {fileCount}개 파일</div>
            </div>
          );
        })}
      </div>

      {/* Files List */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {selectedRound ? `${selectedRound}차시 결과 파일` : "전체 결과 파일"} ({filteredFiles.length}개)
        </h3>
        {filteredFiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: TEXT2 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div>등록된 결과 파일이 없습니다.</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>파일명</th>
                <th style={styles.th}>차시</th>
                <th style={styles.th}>형식</th>
                <th style={{ ...styles.th, textAlign: "right" }}>다운로드</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(f => {
                const test = TESTS.find(t => t.id === f.test_id);
                return (
                  <tr key={f.id}>
                    <td style={styles.td}>
                      <span style={{ marginRight: 8, fontSize: 18 }}>{f.file_type === "pdf" ? "📕" : "📗"}</span>
                      <span style={{ fontWeight: 500, color: "#fff" }}>{f.file_name}</span>
                    </td>
                    <td style={styles.td}>{test?.round}차시</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: f.file_type === "pdf" ? `${RED}20` : `${LIME}20`, color: f.file_type === "pdf" ? RED : LIME }}>
                        {f.file_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        style={{ ...styles.btn, padding: "8px 16px", fontSize: 13, opacity: downloadingId === f.id ? 0.6 : 1 }}
                        onClick={() => handleDownload(f)}
                        disabled={downloadingId === f.id}
                      >
                        {downloadingId === f.id ? "⏳" : "⬇️"} 다운로드
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Academy Management Page (Admin only)
function AcademyManagePage() {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🏫 아카데미 관리</h2>
          <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>등록된 아카데미를 관리하세요</p>
        </div>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ 닫기" : "＋ 아카데미 추가"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, border: `1px solid ${LIME}30`, background: `${LIME}05` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#fff" }}>새 아카데미 등록</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>아카데미 이름</label>
              <input style={styles.input} placeholder="예: 서울 FC 아카데미" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>소재지</label>
              <input style={styles.input} placeholder="예: 서울 마포구" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
            </div>
          </div>
          <button style={styles.btn} onClick={() => { setShowForm(false); alert("아카데미가 등록되었습니다. (데모)"); }}>등록하기</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {ACADEMIES.map(a => (
          <div key={a.id} style={{ ...styles.card, marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 13, color: TEXT2 }}>📍 {a.location}</div>
              </div>
              <span style={{ ...styles.badge, background: `${LIME}20`, color: LIME }}>활성</span>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{a.players}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>등록 선수</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{TESTS.filter(t => t.academy_id === a.id).length}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>테스트 수</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{RESULT_FILES.filter(f => f.academy_id === a.id).length}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>결과 파일</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Data Upload Page (Admin only)
function UploadPage() {
  const [uploadType, setUploadType] = useState("result");
  const [selectedAcademy, setSelectedAcademy] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedRound, setSelectedRound] = useState(1);
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>📤 데이터 업로드</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>테스트 데이터 및 결과 파일을 업로드하세요</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          style={uploadType === "result" ? styles.btn : styles.btnOutline}
          onClick={() => setUploadType("result")}
        >
          📄 결과지 업로드
        </button>
        <button
          style={uploadType === "data" ? styles.btn : styles.btnOutline}
          onClick={() => setUploadType("data")}
        >
          📊 테스트 데이터 업로드
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {uploadType === "result" ? "결과지 파일 업로드" : "테스트 데이터 업로드"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>아카데미</label>
            <select style={{ ...styles.select, width: "100%" }} value={selectedAcademy} onChange={e => setSelectedAcademy(Number(e.target.value))}>
              {ACADEMIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>연도</label>
            <select style={{ ...styles.select, width: "100%" }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              <option value={2025}>2025</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: TEXT2, display: "block", marginBottom: 8 }}>차시</label>
            <select style={{ ...styles.select, width: "100%" }} value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))}>
              {[1,2,3,4].map(r => <option key={r} value={r}>{r}차시</option>)}
            </select>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); alert("파일 업로드 완료! (데모)"); }}
          style={{
            border: `2px dashed ${dragging ? LIME : BORDER}`,
            borderRadius: 16,
            padding: 60,
            textAlign: "center",
            background: dragging ? `${LIME}05` : "transparent",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => alert("파일 선택 대화상자가 열립니다. (데모)")}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{uploadType === "result" ? "📁" : "📊"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
            파일을 드래그하거나 클릭하여 업로드
          </div>
          <div style={{ fontSize: 13, color: TEXT2 }}>
            {uploadType === "result" ? "PDF, Excel 파일 지원" : "Excel, CSV 파일 지원"}
          </div>
          <div style={{ fontSize: 12, color: TEXT2, marginTop: 8 }}>최대 50MB</div>
        </div>
      </div>
    </div>
  );
}

// Player Analysis Page
function PlayerAnalysisPage({ academyId }) {
  const players = PLAYERS_DATA[academyId] || [];
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = players.filter(p => p.name.includes(searchTerm));
  const player = selectedPlayer !== null ? players[selectedPlayer] : null;

  const playerRadar = player ? TEST_TYPES.map(tt => {
    const val = player.records[tt.id]?.[3] || 0;
    let normalized;
    switch(tt.id) {
      case "sprint_20m": normalized = Math.max(0, 100 - (val - 2.5) * 30); break;
      case "jump": normalized = Math.min(100, (val / 70) * 100); break;
      case "yoyo": normalized = Math.min(100, (val / 45) * 100); break;
      case "pass": normalized = Math.min(100, (val / 25) * 100); break;
      case "dribble": normalized = Math.max(0, 100 - (val - 9) * 15); break;
      case "shooting": normalized = Math.min(100, (val / 100) * 100); break;
      case "agility": normalized = Math.max(0, 100 - (val - 7) * 15); break;
      default: normalized = 50;
    }
    return { category: tt.category, value: Math.round(normalized), fullMark: 100 };
  }) : [];

  const playerGrowth = player ? TEST_TYPES.slice(0, 4).map(tt => ({
    name: tt.name,
    data: [1,2,3].map(r => ({ round: `${r}차시`, value: player.records[tt.id]?.[r] || 0 }))
  })) : [];

  // Percentile calculation
  const getPercentile = (playerId, testId, round) => {
    const allVals = players.map(p => p.records[testId]?.[round]).filter(v => v !== undefined);
    const tt = TEST_TYPES.find(t => t.id === testId);
    const playerVal = players[playerId]?.records[testId]?.[round];
    if (!playerVal || allVals.length === 0) return 0;
    const rank = tt.lower_better
      ? allVals.filter(v => v < playerVal).length
      : allVals.filter(v => v > playerVal).length;
    return Math.round(((allVals.length - rank) / allVals.length) * 100);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>🔍 선수 분석</h2>
        <p style={{ color: TEXT2, fontSize: 14, marginTop: 4 }}>선수별 상세 퍼포먼스를 분석하세요</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Player List */}
        <div style={{ ...styles.card, padding: 0, maxHeight: "calc(100vh - 180px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}` }}>
            <input style={styles.input} placeholder="🔍 선수 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div style={{ overflow: "auto", flex: 1 }}>
            {filtered.map((p, idx) => {
              const origIdx = players.indexOf(p);
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPlayer(origIdx)}
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    background: selectedPlayer === origIdx ? `${LIME}10` : "transparent",
                    borderLeft: selectedPlayer === origIdx ? `3px solid ${LIME}` : "3px solid transparent",
                    borderBottom: `1px solid ${BORDER}10`,
                    transition: "all 0.1s ease",
                  }}
                >
                  <div style={{ fontWeight: 600, color: selectedPlayer === origIdx ? "#fff" : TEXT, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{p.age}세 · {p.position}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Detail */}
        {player ? (
          <div>
            {/* Profile Header */}
            <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${LIME}30, ${BLUE}30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>⚽</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{player.name}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <span style={{ ...styles.badge, background: `${BLUE}20`, color: BLUE }}>{player.age}세</span>
                  <span style={{ ...styles.badge, background: `${LIME}20`, color: LIME }}>{player.position}</span>
                  <span style={{ ...styles.badge, background: `${PURPLE}20`, color: PURPLE }}>
                    {ACADEMIES.find(a => a.id === academyId)?.name}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Radar */}
              <div style={styles.card}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff" }}>🕸️ 능력치 분석 (3차시)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={playerRadar}>
                    <PolarGrid stroke={BORDER} />
                    <PolarAngleAxis dataKey="category" tick={{ fill: TEXT2, fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="능력치" dataKey="value" stroke={LIME} fill={LIME} fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Percentile */}
              <div style={styles.card}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff" }}>📊 팀 내 백분위 (3차시)</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {TEST_TYPES.map(tt => {
                    const pct = getPercentile(selectedPlayer, tt.id, 3);
                    return (
                      <div key={tt.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: TEXT2 }}>{tt.icon} {tt.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? LIME : pct >= 50 ? BLUE : RED }}>상위 {100 - pct}%</span>
                        </div>
                        <div style={{ height: 8, background: CARD2, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? LIME : pct >= 50 ? BLUE : RED, borderRadius: 4, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Test Records Table */}
            <div style={styles.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#fff" }}>📋 차시별 기록</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>테스트</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>1차시</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>2차시</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>3차시</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>변화</th>
                  </tr>
                </thead>
                <tbody>
                  {TEST_TYPES.map(tt => {
                    const r1 = player.records[tt.id]?.[1];
                    const r3 = player.records[tt.id]?.[3];
                    const change = (r1 && r3) ? Math.round((r3 - r1) * 100) / 100 : 0;
                    return (
                      <tr key={tt.id}>
                        <td style={styles.td}><span style={{ fontWeight: 500, color: "#fff" }}>{tt.icon} {tt.name}</span></td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{player.records[tt.id]?.[1] || "-"}{player.records[tt.id]?.[1] ? tt.unit : ""}</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>{player.records[tt.id]?.[2] || "-"}{player.records[tt.id]?.[2] ? tt.unit : ""}</td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: 600 }}>{player.records[tt.id]?.[3] || "-"}{player.records[tt.id]?.[3] ? tt.unit : ""}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}><ChangeIndicator value={change} unit={tt.unit} lowerBetter={tt.lower_better} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.card, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
            <div style={{ textAlign: "center", color: TEXT2 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👈</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>왼쪽에서 선수를 선택하세요</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>선수별 상세 데이터를 확인할 수 있습니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAcademyView, setSelectedAcademyView] = useState(null);

  const isAdmin = user?.role === "admin";
  const academyId = isAdmin ? (selectedAcademyView || 1) : user?.academy_id;

  if (!user) return <LoginScreen onLogin={setUser} />;

  const navItems = [
    { id: "dashboard", icon: "📊", label: "대시보드" },
    { id: "rankings", icon: "🏅", label: "선수 랭킹" },
    { id: "players", icon: "🔍", label: "선수 분석" },
    { id: "results", icon: "📁", label: "결과지 다운로드" },
    ...(isAdmin ? [
      { id: "academies", icon: "🏫", label: "아카데미 관리" },
      { id: "upload", icon: "📤", label: "데이터 업로드" },
    ] : []),
  ];

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, ...(sidebarCollapsed ? styles.sidebarCollapsed : {}) }}>
        <Logo collapsed={sidebarCollapsed} />

        {isAdmin && !sidebarCollapsed && (
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <select
              style={{ ...styles.select, width: "100%", fontSize: 12 }}
              value={selectedAcademyView || 1}
              onChange={e => setSelectedAcademyView(Number(e.target.value))}
            >
              {ACADEMIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <nav style={{ flex: 1, paddingTop: 12 }}>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={page === item.id}
              onClick={() => setPage(item.id)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        <div style={{ padding: sidebarCollapsed ? "16px 12px" : "16px 24px", borderTop: `1px solid ${BORDER}` }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${LIME}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {isAdmin ? "👑" : "👤"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>{isAdmin ? "관리자" : "아카데미"}</div>
              </div>
            </div>
          )}
          <button
            style={{ ...styles.btnGhost, width: "100%", textAlign: sidebarCollapsed ? "center" : "left", color: RED, fontSize: 13 }}
            onClick={() => { setUser(null); setPage("dashboard"); }}
          >
            {sidebarCollapsed ? "🚪" : "🚪 로그아웃"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ ...styles.main, ...(sidebarCollapsed ? styles.mainCollapsed : {}) }}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              style={{ ...styles.btnGhost, fontSize: 18, padding: "4px 8px" }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? "☰" : "✕"}
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {navItems.find(n => n.id === page)?.icon} {navItems.find(n => n.id === page)?.label}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isAdmin && (
              <span style={{ ...styles.badge, background: `${LIME}15`, color: LIME }}>
                현재: {ACADEMIES.find(a => a.id === academyId)?.name}
              </span>
            )}
            <span style={{ fontSize: 13, color: TEXT2 }}>2025년</span>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {page === "dashboard" && <DashboardPage user={user} academyId={academyId} />}
          {page === "rankings" && <RankingsPage academyId={academyId} />}
          {page === "players" && <PlayerAnalysisPage academyId={academyId} />}
          {page === "results" && <ResultsPage user={user} academyId={academyId} />}
          {page === "academies" && isAdmin && <AcademyManagePage />}
          {page === "upload" && isAdmin && <UploadPage />}
        </div>
      </div>
    </div>
  );
}
