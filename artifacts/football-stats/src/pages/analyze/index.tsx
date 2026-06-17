import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Loader2, ChevronDown, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/lib/router';

type Game = { id: string; opponent: string; game_date: string; status: string };
type Play = {
  id: string; game_id: string; play_number: number; odk: string | null;
  down: number | null; dist: number | null; hash: string | null; gnls: number | null;
  yard_line: number | null; play_type: string | null; result: string | null;
  off_formation: string | null; defense: string | null; motion: string | null;
  off_play: string | null; rpo: string | null; play_dir: string | null;
  blitz: string | null; coverage: string | null; ball_carrier: string | null; front: string | null;
};
type StatRow = { label: string; count: number; pct: number };
type TrendAlert = { level: 'high' | 'mid'; text: string; scoutedPct?: number; currentPct?: number };

const SITUATIONS = ['1st Down','2nd & Short','2nd & Medium','2nd & Long','3rd & Short','3rd & Medium','3rd & Long','4th Down'];

function getSituation(down: number | null, dist: number | null): string {
  if (!down || dist == null) return 'Other';
  if (down === 1) return '1st Down';
  if (down === 2) { if (dist <= 3) return '2nd & Short'; if (dist <= 7) return '2nd & Medium'; return '2nd & Long'; }
  if (down === 3) { if (dist <= 3) return '3rd & Short'; if (dist <= 6) return '3rd & Medium'; return '3rd & Long'; }
  if (down === 4) return '4th Down';
  return 'Other';
}

function getDownFromSituation(sit: string): number {
  if (sit === '1st Down') return 1;
  if (sit.startsWith('2nd')) return 2;
  if (sit.startsWith('3rd')) return 3;
  if (sit === '4th Down') return 4;
  return 0;
}

function getDownColor(situation: string): string {
  const down = getDownFromSituation(situation);
  switch (down) {
    case 1: return 'bg-blue-500/10 border-blue-500/30';
    case 2: return 'bg-red-500/10 border-red-500/30';
    case 3: return 'bg-emerald-500/10 border-emerald-500/30';
    case 4: return 'bg-pink-500/10 border-pink-500/30';
    default: return 'bg-zinc-800/10 border-zinc-700/30';
  }
}

function getDownTextColor(situation: string): string {
  const down = getDownFromSituation(situation);
  switch (down) {
    case 1: return 'text-blue-400';
    case 2: return 'text-red-400';
    case 3: return 'text-emerald-400';
    case 4: return 'text-pink-400';
    default: return 'text-zinc-400';
  }
}

function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }

function getDistribution(plays: Play[], key: keyof Play): StatRow[] {
  const counts: Record<string, number> = {};
  plays.forEach(p => { const v = (p[key] as string)?.trim() || null; if (v) counts[v] = (counts[v] || 0) + 1; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function getMotionPct(plays: Play[]) {
  const withMotion = plays.filter(p => p.motion?.trim()).length;
  return pct(withMotion, plays.length);
}

function getRpoPct(plays: Play[]) {
  const rpo = plays.filter(p => p.rpo?.trim() && p.rpo.trim().toLowerCase() !== 'n' && p.rpo.trim() !== '0').length;
  return pct(rpo, plays.length);
}

function isPass(p: Play) {
  const pt = p.play_type?.toLowerCase() || '';
  return pt.includes('pass') || pt === 'p' || pt.includes('screen') || pt.includes('throw');
}

function isBlitz(p: Play) {
  return !!(p.blitz?.trim() && p.blitz.trim().toLowerCase() !== 'n' && p.blitz.trim() !== '0' && p.blitz.trim() !== 'no');
}

interface OffSitStat {
  situation: string; count: number;
  topFormation: string; formationPct: number;
  runPct: number; passPct: number;
}
function getOffSituationalStats(plays: Play[]): OffSitStat[] {
  return SITUATIONS.map(sit => {
    const sp = plays.filter(p => getSituation(p.down, p.dist) === sit);
    if (sp.length === 0) return null;
    const formCounts: Record<string, number> = {};
    sp.forEach(p => { if (p.off_formation?.trim()) { const f = p.off_formation.trim(); formCounts[f] = (formCounts[f] || 0) + 1; } });
    const topEntry = Object.entries(formCounts).sort((a, b) => b[1] - a[1])[0];
    const passCount = sp.filter(isPass).length;
    return {
      situation: sit, count: sp.length,
      topFormation: topEntry?.[0] || '—', formationPct: pct(topEntry?.[1] || 0, sp.length),
      passPct: pct(passCount, sp.length),
      runPct: pct(sp.length - passCount, sp.length),
    };
  }).filter(Boolean) as OffSitStat[];
}

interface DefSitStat { situation: string; count: number; blitzPct: number; topCoverage: string; coveragePct: number; topFront: string }
function getDefSituationalStats(plays: Play[]): DefSitStat[] {
  return SITUATIONS.map(sit => {
    const sp = plays.filter(p => getSituation(p.down, p.dist) === sit);
    if (sp.length === 0) return null;
    const covCounts: Record<string, number> = {};
    sp.forEach(p => { if (p.coverage?.trim()) { const c = p.coverage.trim(); covCounts[c] = (covCounts[c] || 0) + 1; } });
    const topCov = Object.entries(covCounts).sort((a, b) => b[1] - a[1])[0];
    const frontCounts: Record<string, number> = {};
    sp.forEach(p => { if (p.front?.trim()) { const f = p.front.trim(); frontCounts[f] = (frontCounts[f] || 0) + 1; } });
    const topFront = Object.entries(frontCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      situation: sit, count: sp.length,
      blitzPct: pct(sp.filter(isBlitz).length, sp.length),
      topCoverage: topCov?.[0] || '—', coveragePct: pct(topCov?.[1] || 0, sp.length),
      topFront: topFront?.[0] || '—',
    };
  }).filter(Boolean) as DefSitStat[];
}

function getOffTrends(plays: Play[], sits: OffSitStat[]): TrendAlert[] {
  const trends: TrendAlert[] = [];
  const thirdLong = sits.find(s => s.situation === '3rd & Long');
  if (thirdLong && thirdLong.count >= 3) {
    if (thirdLong.passPct >= 80) trends.push({ level: 'high', text: `Pass ${thirdLong.passPct}% on 3rd & Long`, scoutedPct: thirdLong.passPct });
    else if (thirdLong.passPct >= 60) trends.push({ level: 'mid', text: `Pass ${thirdLong.passPct}% on 3rd & Long`, scoutedPct: thirdLong.passPct });
  }
  const thirdShort = sits.find(s => s.situation === '3rd & Short');
  if (thirdShort && thirdShort.count >= 3 && thirdShort.passPct <= 30)
    trends.push({ level: 'high', text: `Run ${100 - thirdShort.passPct}% on 3rd & Short`, scoutedPct: 100 - thirdShort.passPct });
  const motionPct = getMotionPct(plays);
  if (motionPct >= 40) trends.push({ level: 'mid', text: `Heavy pre-snap motion — ${motionPct}% of plays`, scoutedPct: motionPct });
  const dist = getDistribution(plays, 'off_formation');
  if (dist[0] && dist[0].pct >= 50) trends.push({ level: 'mid', text: `${dist[0].pct}% of plays from ${dist[0].label}`, scoutedPct: dist[0].pct });
  const secondLong = sits.find(s => s.situation === '2nd & Long');
  if (secondLong && secondLong.count >= 3 && secondLong.passPct >= 75)
    trends.push({ level: 'mid', text: `Pass ${secondLong.passPct}% on 2nd & Long`, scoutedPct: secondLong.passPct });
  return trends;
}

function getDefTrends(plays: Play[], sits: DefSitStat[]): TrendAlert[] {
  const trends: TrendAlert[] = [];
  const thirdShort = sits.find(s => s.situation === '3rd & Short');
  if (thirdShort && thirdShort.count >= 2) {
    if (thirdShort.blitzPct >= 60) trends.push({ level: 'high', text: `Blitz ${thirdShort.blitzPct}% on 3rd & Short`, scoutedPct: thirdShort.blitzPct });
    else if (thirdShort.blitzPct >= 40) trends.push({ level: 'mid', text: `Blitz ${thirdShort.blitzPct}% on 3rd & Short`, scoutedPct: thirdShort.blitzPct });
  }
  const secondShort = sits.find(s => s.situation === '2nd & Short');
  if (secondShort && secondShort.count >= 2 && secondShort.blitzPct >= 50)
    trends.push({ level: 'high', text: `Blitz ${secondShort.blitzPct}% on short yardage (2nd & Short)`, scoutedPct: secondShort.blitzPct });
  const thirdLong = sits.find(s => s.situation === '3rd & Long');
  if (thirdLong && thirdLong.count >= 2 && thirdLong.blitzPct <= 15)
    trends.push({ level: 'mid', text: `Rarely blitzes on 3rd & Long (${thirdLong.blitzPct}%)`, scoutedPct: thirdLong.blitzPct });
  const cov = getDistribution(plays, 'coverage');
  if (cov[0] && cov[0].pct >= 50) trends.push({ level: 'mid', text: `Primary coverage: ${cov[0].label} (${cov[0].pct}%)`, scoutedPct: cov[0].pct });
  return trends;
}

function Bar({ pct: p, color = 'blue', max = 100 }: { pct: number; color?: string; max?: number }) {
  const colorMap: Record<string, string> = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', purple: 'bg-purple-500', zinc: 'bg-zinc-500' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${colorMap[color] || 'bg-blue-500'} transition-all`} style={{ width: `${Math.min((p / max) * 100, 100)}%` }} />
      </div>
      <span className="text-xs text-zinc-300 w-9 text-right shrink-0">{p}%</span>
    </div>
  );
}

function TrendBadge({ alert, currentPct }: { alert: TrendAlert; currentPct?: number }) {
  const base = alert.scoutedPct ?? 0;
  const curr = currentPct ?? alert.currentPct;
  const hasCompare = curr !== undefined;
  const delta = hasCompare ? curr - base : 0;
  const holding = Math.abs(delta) <= 15;
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${alert.level === 'high' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
      {alert.level === 'high' ? <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" /> : <TrendingUp size={16} className="text-amber-400 shrink-0 mt-0.5" />}
      <div className="flex-1">
        <span className={alert.level === 'high' ? 'text-red-300' : 'text-amber-300'}>{alert.text}</span>
        {hasCompare && (
          <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${holding ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {holding ? '✓ Holding' : `Now ${curr}% (${delta > 0 ? '+' : ''}${delta}%)`}
          </span>
        )}
      </div>
    </div>
  );
}

function StatTable({ rows, color = 'blue' }: { rows: StatRow[]; color?: string }) {
  if (rows.length === 0) return <p className="text-zinc-500 text-sm italic">No data</p>;
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map(r => (
        <div key={r.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-200 truncate pr-2">{r.label}</span>
            <span className="text-zinc-400 shrink-0">{r.count} plays</span>
          </div>
          <Bar pct={r.pct} color={color} />
        </div>
      ))}
    </div>
  );
}

export default function AnalyzePage() {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [plays, setPlays] = useState<Play[]>([]);
  const [loadingPlays, setLoadingPlays] = useState(false);
  const [activeTab, setActiveTab] = useState<'offense' | 'defense'>('offense');
  const [viewMode, setViewMode] = useState<'all' | 'scouted' | 'current' | 'compare'>('all');

  // Sidebar filter/sort state
  const [teamSearch, setTeamSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'games'>('name');

  useEffect(() => {
    supabase.from('games').select('id,opponent,game_date,status').order('game_date', { ascending: false })
      .then(({ data }) => { setGames(data || []); setLoadingGames(false); });
  }, []);

  // Group all games by opponent
  const gamesByOpponent = games.reduce<Record<string, Game[]>>((acc, g) => {
    if (!acc[g.opponent]) acc[g.opponent] = [];
    acc[g.opponent].push(g);
    return acc;
  }, {});

  // Filter opponents by search, then sort
  const filteredOpponents = Object.keys(gamesByOpponent)
    .filter(opp => opp.toLowerCase().includes(teamSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.localeCompare(b);
      if (sortBy === 'games') return gamesByOpponent[b].length - gamesByOpponent[a].length;
      if (sortBy === 'date') {
        const latestA = gamesByOpponent[a][0]?.game_date ?? '';
        const latestB = gamesByOpponent[b][0]?.game_date ?? '';
        return latestB.localeCompare(latestA);
      }
      return 0;
    });

  const toggleGame = (id: string) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectOpponentAll = (opp: string) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev);
      (gamesByOpponent[opp] || []).forEach(g => next.add(g.id));
      return next;
    });
  };

  const clearOpponent = (opp: string) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev);
      (gamesByOpponent[opp] || []).forEach(g => next.delete(g.id));
      return next;
    });
  };

  const selectAllGames = () => setSelectedGameIds(new Set(games.map(g => g.id)));
  const clearAll = () => { setSelectedGameIds(new Set()); setPlays([]); setTeamSearch(''); };

  const loadPlays = useCallback(async () => {
    if (selectedGameIds.size === 0) { setPlays([]); return; }
    setLoadingPlays(true);
    const { data } = await supabase.from('plays').select('*').in('game_id', Array.from(selectedGameIds));
    setPlays(data || []);
    setLoadingPlays(false);
  }, [selectedGameIds]);

  useEffect(() => { loadPlays(); }, [loadPlays]);

  const selectedGames = games.filter(g => selectedGameIds.has(g.id));
  const scoutedIds = new Set(selectedGames.filter(g => g.status === 'scouted').map(g => g.id));
  const liveIds = new Set(selectedGames.filter(g => g.status === 'live').map(g => g.id));

  const scoutedPlays = plays.filter(p => scoutedIds.has(p.game_id));
  const currentPlays = plays.filter(p => liveIds.has(p.game_id));

  const displayPlays = viewMode === 'scouted' ? scoutedPlays
    : viewMode === 'current' ? currentPlays
    : plays;

  const oPlays = displayPlays.filter(p => p.odk?.toUpperCase() === 'O');
  const dPlays = displayPlays.filter(p => p.odk?.toUpperCase() === 'D');

  const scoutedO = scoutedPlays.filter(p => p.odk?.toUpperCase() === 'O');
  const currentO = currentPlays.filter(p => p.odk?.toUpperCase() === 'O');
  const scoutedD = scoutedPlays.filter(p => p.odk?.toUpperCase() === 'D');
  const currentD = currentPlays.filter(p => p.odk?.toUpperCase() === 'D');

  const offSits = getOffSituationalStats(viewMode === 'compare' ? scoutedO : oPlays);
  const defSits = getDefSituationalStats(viewMode === 'compare' ? scoutedD : dPlays);
  const offTrends = getOffTrends(viewMode === 'compare' ? scoutedO : oPlays, offSits);
  const defTrends = getDefTrends(viewMode === 'compare' ? scoutedD : dPlays, defSits);

  const currentOffSits = getOffSituationalStats(currentO);
  const currentDefSits = getDefSituationalStats(currentD);

  const hasData = displayPlays.length > 0 || (viewMode === 'compare' && scoutedPlays.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
              <ArrowLeft size={20} /> Home
            </button>
            <h1 className="text-2xl font-bold">Analyze & Scout</h1>
            {selectedGameIds.size > 0 && (
              <span className="text-sm text-zinc-400">{selectedGameIds.size} game{selectedGameIds.size !== 1 ? 's' : ''} selected · {plays.length} plays</span>
            )}
          </div>

          {selectedGameIds.size > 0 && (
            <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
              {(['all','scouted','current','compare'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === m ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  {m === 'compare' ? 'Compare' : m === 'current' ? 'Current Game' : m === 'scouted' ? 'Scouted' : 'All Games'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            {/* Sidebar header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Select Games</h3>
              <div className="flex gap-2">
                <button onClick={selectAllGames} className="text-xs text-blue-400 hover:text-blue-300">All</button>
                <span className="text-zinc-700">·</span>
                <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300">Clear</button>
              </div>
            </div>

            {/* Search box */}
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                placeholder="Search team..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-600"
              />
              {teamSearch && (
                <button
                  onClick={() => setTeamSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >✕</button>
              )}
            </div>

            {/* Sort controls */}
            <div className="flex gap-1 mb-3">
              {(['name', 'date', 'games'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`flex-1 text-xs py-1 rounded-lg transition capitalize ${sortBy === opt ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {opt === 'name' ? 'A–Z' : opt === 'date' ? 'Recent' : 'Most'}
                </button>
              ))}
            </div>

            {loadingGames ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm py-2"><Loader2 size={14} className="animate-spin" /> Loading...</div>
            ) : games.length === 0 ? (
              <p className="text-zinc-500 text-sm">No games found. Upload scouted game data first.</p>
            ) : filteredOpponents.length === 0 ? (
              <p className="text-zinc-500 text-sm">No teams match "{teamSearch}".</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {filteredOpponents.map(opp => {
                  const oppGames = gamesByOpponent[opp];
                  const allSelected = oppGames.every(g => selectedGameIds.has(g.id));
                  const someSelected = oppGames.some(g => selectedGameIds.has(g.id));
                  return (
                    <div key={opp}>
                      {/* Opponent header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider truncate">{opp}</span>
                          <span className="text-zinc-600 text-xs shrink-0">({oppGames.length})</span>
                        </div>
                        <button
                          onClick={() => allSelected ? clearOpponent(opp) : selectOpponentAll(opp)}
                          className={`text-xs shrink-0 ml-2 ${allSelected ? 'text-blue-400' : someSelected ? 'text-blue-500/70' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {allSelected ? 'Clear' : 'All'}
                        </button>
                      </div>
                      {/* Games under opponent */}
                      <div className="space-y-1.5 pl-1">
                        {oppGames.map(g => (
                          <label key={g.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedGameIds.has(g.id)}
                              onChange={() => toggleGame(g.id)}
                              className="accent-blue-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                              <span className="text-sm text-zinc-200 truncate">{new Date(g.game_date).toLocaleDateString()}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${g.status === 'scouted' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {g.status === 'scouted' ? '📹' : '🟢'}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedGameIds.size > 0 && plays.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Total plays</span><span className="text-white font-medium">{displayPlays.length}</span></div>
              <div className="flex justify-between text-zinc-400"><span>O plays</span><span className="text-blue-400 font-medium">{oPlays.length}</span></div>
              <div className="flex justify-between text-zinc-400"><span>D plays</span><span className="text-emerald-400 font-medium">{dPlays.length}</span></div>
              {viewMode === 'compare' && (
                <>
                  <hr className="border-zinc-800" />
                  <div className="flex justify-between text-zinc-400"><span>Scouted plays</span><span className="text-purple-400 font-medium">{scoutedPlays.length}</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Current game</span><span className="text-emerald-400 font-medium">{currentPlays.length}</span></div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {selectedGameIds.size === 0 ? (
            <div className="text-center py-24 text-zinc-500">
              <BarChart3Icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select games from the left panel</p>
              <p className="text-sm mt-2">Search or sort teams, then check games to analyze</p>
            </div>
          ) : loadingPlays ? (
            <div className="text-center py-24 text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" /> Loading play data...
            </div>
          ) : !hasData ? (
            <div className="text-center py-24 text-zinc-500">
              <p>No play data found for selected games.</p>
              <p className="text-sm mt-2">Upload scouted game data using the Upload page.</p>
            </div>
          ) : (
            <>
              {viewMode === 'compare' && (
                <div className="grid grid-cols-[1fr_120px_120px] gap-4 mb-4 px-0">
                  <div />
                  <div className="text-center text-xs font-semibold text-purple-400 uppercase tracking-wider">Scouted</div>
                  <div className="text-center text-xs font-semibold text-emerald-400 uppercase tracking-wider">Current</div>
                </div>
              )}

              <div className="flex gap-2 mb-6">
                {(['offense','defense'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition capitalize ${activeTab === t ? (t === 'offense' ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'offense' && (
                <OffenseContent
                  plays={oPlays} scoutedPlays={scoutedO} currentPlays={currentO}
                  sits={offSits} currentSits={currentOffSits} trends={offTrends}
                  viewMode={viewMode}
                />
              )}
              {activeTab === 'defense' && (
                <DefenseContent
                  plays={dPlays} scoutedPlays={scoutedD} currentPlays={currentD}
                  sits={defSits} currentSits={currentDefSits} trends={defTrends}
                  viewMode={viewMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart3Icon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
}

function OffenseContent({ plays, scoutedPlays, currentPlays, sits, currentSits, trends, viewMode }: {
  plays: Play[]; scoutedPlays: Play[]; currentPlays: Play[];
  sits: OffSitStat[]; currentSits: OffSitStat[]; trends: TrendAlert[];
  viewMode: string;
}) {
  const activePlays = viewMode === 'compare' ? scoutedPlays : plays;
  const formations = getDistribution(activePlays, 'off_formation');
  const directions = getDistribution(activePlays, 'play_dir');
  const playTypes = getDistribution(activePlays, 'play_type');
  const motionPct = getMotionPct(activePlays);
  const rpoPct = getRpoPct(activePlays);

  if (activePlays.length === 0) return <p className="text-zinc-500 text-center py-12">No offense play data in selected games.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'O Plays', value: activePlays.length, color: 'text-white' },
          { label: 'Formations', value: formations.length, color: 'text-blue-400' },
          { label: 'Motion %', value: `${motionPct}%`, color: 'text-amber-400' },
          { label: 'RPO %', value: `${rpoPct}%`, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Formation</h3>
          <StatTable rows={formations} color="blue" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Play Direction</h3>
          <StatTable rows={directions} color="purple" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Play Type</h3>
          <StatTable rows={playTypes} color="amber" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold">Tendencies by Situation</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>1st</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>2nd</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>3rd</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span>4th</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950">
              <tr>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Situation</th>
                <th className="text-center px-3 py-3 text-zinc-400 font-medium">Plays</th>
                <th className="text-left px-3 py-3 text-zinc-400 font-medium">Top Formation</th>
                <th className="text-center px-3 py-3 text-zinc-400 font-medium">Run %</th>
                {viewMode === 'compare' && <th className="text-center px-3 py-3 text-emerald-400 font-medium text-xs">Live Run %</th>}
                <th className="text-center px-3 py-3 text-zinc-400 font-medium">Pass %</th>
                {viewMode === 'compare' && <th className="text-center px-3 py-3 text-emerald-400 font-medium text-xs">Live Pass %</th>}
              </tr>
            </thead>
            <tbody>
              {sits.map((s, i) => {
                const curr = currentSits.find(c => c.situation === s.situation);
                const deltaRun = curr ? curr.runPct - s.runPct : undefined;
                const deltaPass = curr ? curr.passPct - s.passPct : undefined;
                const holdingRun = deltaRun !== undefined ? Math.abs(deltaRun) <= 15 : undefined;
                const holdingPass = deltaPass !== undefined ? Math.abs(deltaPass) <= 15 : undefined;
                return (
                  <tr key={s.situation} className={`border-t border-zinc-800 ${getDownColor(s.situation)}`}>
                    <td className={`px-4 py-3 font-medium ${getDownTextColor(s.situation)}`}>{s.situation}</td>
                    <td className="text-center px-3 py-3 text-zinc-400">{s.count}</td>
                    <td className="px-3 py-3 text-blue-300">{s.topFormation} <span className="text-zinc-500 text-xs">({s.formationPct}%)</span></td>
                    <td className="text-center px-3 py-3">
                      <span className={`font-semibold ${s.runPct >= 70 ? 'text-emerald-400' : s.runPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{s.runPct}%</span>
                    </td>
                    {viewMode === 'compare' && (
                      <td className="text-center px-3 py-3">
                        {curr ? (
                          <span className={`font-semibold ${holdingRun ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {curr.runPct}%{deltaRun !== undefined && <span className="text-xs ml-1">({deltaRun > 0 ? '+' : ''}{deltaRun})</span>}
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                    )}
                    <td className="text-center px-3 py-3">
                      <span className={`font-semibold ${s.passPct >= 70 ? 'text-red-400' : s.passPct >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.passPct}%</span>
                    </td>
                    {viewMode === 'compare' && (
                      <td className="text-center px-3 py-3">
                        {curr ? (
                          <span className={`font-semibold ${holdingPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {curr.passPct}%{deltaPass !== undefined && <span className="text-xs ml-1">({deltaPass > 0 ? '+' : ''}{deltaPass})</span>}
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {trends.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-amber-400" /> Key Tendencies</h3>
          <div className="space-y-2">
            {trends.map((t, i) => {
              const sit = currentSits.find(c => {
                if (t.text.includes('3rd & Long')) return c.situation === '3rd & Long';
                if (t.text.includes('3rd & Short')) return c.situation === '3rd & Short';
                if (t.text.includes('2nd & Long')) return c.situation === '2nd & Long';
                return false;
              });
              const currPct = sit?.passPct;
              return <TrendBadge key={i} alert={t} currentPct={viewMode === 'compare' ? currPct : undefined} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DefenseContent({ plays, scoutedPlays, currentPlays, sits, currentSits, trends, viewMode }: {
  plays: Play[]; scoutedPlays: Play[]; currentPlays: Play[];
  sits: DefSitStat[]; currentSits: DefSitStat[]; trends: TrendAlert[];
  viewMode: string;
}) {
  const activePlays = viewMode === 'compare' ? scoutedPlays : plays;
  const fronts = getDistribution(activePlays, 'front');
  const coverages = getDistribution(activePlays, 'coverage');
  const overallBlitzPct = pct(activePlays.filter(isBlitz).length, activePlays.length);

  if (activePlays.length === 0) return <p className="text-zinc-500 text-center py-12">No defense play data in selected games.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'D Plays', value: activePlays.length, color: 'text-white' },
          { label: 'Blitz %', value: `${overallBlitzPct}%`, color: 'text-red-400' },
          { label: 'Fronts Used', value: fronts.length, color: 'text-emerald-400' },
          { label: 'Coverages', value: coverages.length, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Front Distribution</h3>
          <StatTable rows={fronts} color="emerald" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-400">Coverage Distribution</h3>
          <StatTable rows={coverages} color="blue" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold">Blitz & Coverage by Situation</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>1st</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>2nd</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>3rd</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span>4th</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950">
              <tr>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Situation</th>
                <th className="text-center px-3 py-3 text-zinc-400 font-medium">Plays</th>
                <th className="text-center px-3 py-3 text-zinc-400 font-medium">Blitz %</th>
                {viewMode === 'compare' && <th className="text-center px-3 py-3 text-emerald-400 font-medium text-xs">Live Blitz %</th>}
                <th className="text-left px-3 py-3 text-zinc-400 font-medium">Top Coverage</th>
                {viewMode === 'compare' && <th className="text-left px-3 py-3 text-emerald-400 font-medium text-xs">Live Coverage</th>}
                <th className="text-left px-3 py-3 text-zinc-400 font-medium">Front</th>
              </tr>
            </thead>
            <tbody>
              {sits.map((s, i) => {
                const curr = currentSits.find(c => c.situation === s.situation);
                const deltaBlitz = curr ? curr.blitzPct - s.blitzPct : undefined;
                const holdingBlitz = deltaBlitz !== undefined ? Math.abs(deltaBlitz) <= 15 : undefined;
                return (
                  <tr key={s.situation} className={`border-t border-zinc-800 ${getDownColor(s.situation)}`}>
                    <td className={`px-4 py-3 font-medium ${getDownTextColor(s.situation)}`}>{s.situation}</td>
                    <td className="text-center px-3 py-3 text-zinc-400">{s.count}</td>
                    <td className="text-center px-3 py-3">
                      <span className={`font-semibold ${s.blitzPct >= 60 ? 'text-red-400' : s.blitzPct >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.blitzPct}%</span>
                    </td>
                    {viewMode === 'compare' && (
                      <td className="text-center px-3 py-3">
                        {curr ? (
                          <span className={`font-semibold ${holdingBlitz ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {curr.blitzPct}%{deltaBlitz !== undefined && <span className="text-xs ml-1">({deltaBlitz > 0 ? '+' : ''}{deltaBlitz})</span>}
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-3 text-blue-300">{s.topCoverage} <span className="text-zinc-500 text-xs">({s.coveragePct}%)</span></td>
                    {viewMode === 'compare' && (
                      <td className="px-3 py-3">
                        {curr ? (
                          <span className={curr.topCoverage === s.topCoverage ? 'text-emerald-400' : 'text-amber-400'}>
                            {curr.topCoverage} <span className="text-zinc-500 text-xs">({curr.coveragePct}%)</span>
                          </span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-3 text-zinc-300">{s.topFront}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {trends.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> Key Tendencies</h3>
          <div className="space-y-2">
            {trends.map((t, i) => {
              const sit = currentSits.find(c => {
                if (t.text.includes('3rd & Short')) return c.situation === '3rd & Short';
                if (t.text.includes('2nd & Short')) return c.situation === '2nd & Short';
                if (t.text.includes('3rd & Long')) return c.situation === '3rd & Long';
                return false;
              });
              const currPct = sit?.blitzPct;
              return <TrendBadge key={i} alert={t} currentPct={viewMode === 'compare' ? currPct : undefined} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}