import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, CheckCircle, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

type Game = {
  id: string;
  opponent: string;
  game_date: string;
  status: string;
};

type PlayEntry = {
  dbId: string;
  playNumber: number;
  odk: string;
  down: number | '';
  dist: number | '';
  hash: string;
  yardLine: number | '';
  gnls: number | '';
  offFormation: string;
  front: string;
  blitz: string;
  coverage: string;
};

type DefensivePlay = {
  play_type: string | null;
  off_formation: string | null;
  play_dir: string | null;
  result: string | null;
  blitz: string | null;
  coverage: string | null;
  front: string | null;
};

interface PlayCategory {
  play_type: string;
  formation: string;
  direction: string;
  count: number;
  blitz: string;
  coverage: string;
}

interface TendencyAlert {
  level: 'high' | 'mid';
  text: string;
  formation: string;
}

export default function DefenseEntry() {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingPlays, setIsLoadingPlays] = useState(false);

  const [data, setData] = useState<PlayEntry[]>([]);
  const [defensivePlays, setDefensivePlays] = useState<DefensivePlay[]>([]);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const columnHelper = createColumnHelper<PlayEntry>();
  const columns = [
    columnHelper.accessor('playNumber', { header: 'PLAY #' }),
    columnHelper.accessor('odk', { header: 'ODK' }),
    columnHelper.accessor('down', { header: 'DN' }),
    columnHelper.accessor('dist', { header: 'DIST' }),
    columnHelper.accessor('yardLine', { header: 'YARD LN' }),
    columnHelper.accessor('gnls', { header: 'GN/LS' }),
    columnHelper.accessor('offFormation', { header: 'OFF FORM' }),
    columnHelper.accessor('front', { header: 'FRONT' }),
    columnHelper.accessor('blitz', { header: 'BLITZ' }),
    columnHelper.accessor('coverage', { header: 'COVERAGE' }),
  ];

  const readOnlyCols = new Set(['playNumber', 'odk', 'down', 'dist', 'yardLine', 'gnls', 'offFormation']);

  useEffect(() => {
    const loadGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent, game_date, status')
        .order('game_date', { ascending: false });
      if (error) console.error(error);
      else setGames(data || []);
      setIsLoadingGames(false);
    };
    loadGames();
  }, []);

  const loadPlays = useCallback(async (gameId: string) => {
    setIsLoadingPlays(true);
    setData([]);
    setDefensivePlays([]);
    try {
      const { data: plays, error } = await supabase
        .from('plays')
        .select('*')
        .eq('game_id', gameId)
        .order('play_number');
      if (error) throw error;
      setData(
        (plays || []).map((p) => ({
          dbId: p.id,
          playNumber: p.play_number,
          odk: p.odk ?? '',
          down: p.down ?? '',
          dist: p.dist ?? '',
          hash: p.hash ?? '',
          yardLine: p.yard_line ?? '',
          gnls: p.gnls ?? '',
          offFormation: p.off_formation ?? '',
          front: p.front ?? '',
          blitz: p.blitz ?? '',
          coverage: p.coverage ?? '',
        }))
      );

      // Load opponent defensive plays (marked as 'D' in odk)
      const selectedGame = games.find(g => g.id === gameId);
      if (selectedGame) {
        const { data: defPlays } = await supabase
          .from('plays')
          .select('play_type, off_formation, play_dir, result, blitz, coverage, front')
          .eq('game_id', gameId)
          .eq('odk', 'D');
        setDefensivePlays(defPlays || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPlays(false);
    }
  }, [games]);

  useEffect(() => {
    if (selectedGameId) loadPlays(selectedGameId);
    else setData([]);
  }, [selectedGameId, loadPlays]);

  const autoSave = useCallback(async () => {
    if (!selectedGameId || data.length === 0) return;
    setIsSaving(true);
    try {
      const playsToSave = data.map((play) => ({
        id: play.dbId,
        front: play.front || null,
        blitz: play.blitz || null,
        coverage: play.coverage || null,
      }));
      const { error } = await supabase.from('plays').upsert(playsToSave);
      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedGameId, data]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(autoSave, 2000);
  }, [autoSave]);

  useEffect(() => {
    if (selectedGameId && data.length > 0) triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, selectedGameId, triggerAutoSave]);

  const updateField = (rowIndex: number, columnId: string, newValue: any) => {
    if (readOnlyCols.has(columnId)) return;
    const newData = [...data];
    (newData[rowIndex] as any)[columnId] = newValue;
    setData(newData);
  };

  const moveToCell = (row: number, col: number) => {
    setSelectedCell({
      row: Math.max(0, Math.min(row, data.length - 1)),
      col: Math.max(0, Math.min(col, columns.length - 1)),
    });
  };

  function EditableCell({
    value,
    rowIndex,
    columnId,
    colIndex,
  }: {
    value: any;
    rowIndex: number;
    columnId: string;
    colIndex: number;
  }) {
    const isSelected = selectedCell.row === rowIndex && selectedCell.col === colIndex;
    const isReadOnly = readOnlyCols.has(columnId);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isSelected && !isReadOnly && inputRef.current) inputRef.current.focus();
    }, [isSelected, isReadOnly]);

    return (
      <input
        ref={inputRef}
        value={value ?? ''}
        readOnly={isReadOnly}
        onChange={(e) => updateField(rowIndex, columnId, e.target.value)}
        onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'Enter':
              e.preventDefault();
              moveToCell(rowIndex + 1, colIndex);
              break;
            case 'Tab':
              e.preventDefault();
              moveToCell(rowIndex, colIndex + (e.shiftKey ? -1 : 1));
              break;
            case 'ArrowDown':
              e.preventDefault();
              moveToCell(rowIndex + 1, colIndex);
              break;
            case 'ArrowUp':
              e.preventDefault();
              moveToCell(rowIndex - 1, colIndex);
              break;
            case 'ArrowRight':
              if (inputRef.current?.selectionStart === inputRef.current?.value.length) {
                e.preventDefault();
                moveToCell(rowIndex, colIndex + 1);
              }
              break;
            case 'ArrowLeft':
              if (inputRef.current?.selectionStart === 0) {
                e.preventDefault();
                moveToCell(rowIndex, colIndex - 1);
              }
              break;
          }
        }}
        className={`w-full min-h-[38px] px-3 py-1 bg-transparent outline-none border text-center transition-colors ${
          isReadOnly
            ? 'text-zinc-400 cursor-default border-transparent'
            : isSelected
            ? 'border-blue-500 bg-zinc-800'
            : 'border-transparent hover:border-zinc-700'
        }`}
      />
    );
  }

  // Analyze defensive plays
  const analyzeDefensiveTendencies = () => {
    if (defensivePlays.length === 0) return { positive: [], explosive: [], passPositive: [], passExplosive: [], tendencies: [] };

    const plays = defensivePlays as DefensivePlay[];

    // Parse results for yardage (simplified - looks for "+X" pattern)
    const parseYardage = (result: string | null): number | null => {
      if (!result) return null;
      const match = result.match(/\+(\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    const isPass = (playType: string | null): boolean => {
      if (!playType) return false;
      const pt = playType.toLowerCase();
      return pt.includes('pass') || pt === 'p' || pt.includes('screen') || pt.includes('throw');
    };

    const positiveRuns = plays.filter(p => {
      const yardage = parseYardage(p.result);
      return !isPass(p.play_type) && yardage !== null && yardage >= 4 && yardage < 10;
    });

    const explosiveRuns = plays.filter(p => {
      const yardage = parseYardage(p.result);
      return !isPass(p.play_type) && yardage !== null && yardage >= 10;
    });

    const positivePasses = plays.filter(p => {
      const yardage = parseYardage(p.result);
      return isPass(p.play_type) && yardage !== null && yardage >= 7 && yardage < 15;
    });

    const explosivePasses = plays.filter(p => {
      const yardage = parseYardage(p.result);
      return isPass(p.play_type) && yardage !== null && yardage >= 15;
    });

    const groupByFormation = (plays: DefensivePlay[]) => {
      const grouped: Record<string, DefensivePlay[]> = {};
      plays.forEach(p => {
        const form = p.off_formation || 'Unknown';
        if (!grouped[form]) grouped[form] = [];
        grouped[form].push(p);
      });
      return grouped;
    };

    const formatPlays = (grouped: Record<string, DefensivePlay[]>) => {
      return Object.entries(grouped)
        .map(([form, playList]) => ({
          formation: form,
          plays: playList.map(p => `${p.play_type || 'Unknown'} ${p.play_dir || ''}`).slice(0, 3).join(', '),
          count: playList.length,
          coverage: playList[0]?.coverage || 'Mixed',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };

    // Get key tendencies for suggestions
    const allDefPlays = plays;
    const tendencies: TendencyAlert[] = [];

    const defFormations = groupByFormation(allDefPlays);
    const mostUsedForm = Object.entries(defFormations).sort((a, b) => b[1].length - a[1].length)[0];
    if (mostUsedForm) {
      const coverage = mostUsedForm[1][0]?.coverage;
      if (coverage) {
        tendencies.push({
          level: 'mid',
          text: `Primary Defense: ${coverage} with ${mostUsedForm[1][0]?.front || 'Standard'} front`,
          formation: mostUsedForm[0],
        });
      }
    }

    const blitzRate = plays.filter(p => p.blitz?.trim() && p.blitz.toLowerCase() !== 'n' && p.blitz !== '0').length / plays.length;
    if (blitzRate > 0.5) {
      tendencies.push({
        level: 'high',
        text: `Heavy blitz package (${Math.round(blitzRate * 100)}% of plays)`,
        formation: 'Multiple',
      });
    }

    return {
      positive: formatPlays(groupByFormation(positiveRuns)),
      explosive: formatPlays(groupByFormation(explosiveRuns)),
      passPositive: formatPlays(groupByFormation(positivePasses)),
      passExplosive: formatPlays(groupByFormation(explosivePasses)),
      tendencies,
    };
  };

  const analysis = analyzeDefensiveTendencies();
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/enter')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
                <ArrowLeft size={22} /> Back
              </button>
              <div>
                <h1 className="text-3xl font-bold">Opponent Defense Analysis</h1>
                <p className="text-emerald-500 text-sm">Tendencies & Offensive Play Suggestions</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isLoadingGames ? (
                <Loader2 size={18} className="animate-spin text-zinc-400" />
              ) : (
                <select
                  value={selectedGameId || ''}
                  onChange={(e) => setSelectedGameId(e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Game...</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.opponent} — {new Date(game.game_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}

              <button onClick={() => navigate('/enter')} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium">ODK</button>
              <button onClick={() => navigate('/enter/offense')} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium">OFFENSE</button>

              <div className="text-sm flex items-center gap-2 text-zinc-400 min-w-[110px]">
                {isSaving ? (
                  <span className="flex items-center gap-1"><Loader2 size={16} className="animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={16} /> Auto-saved</span>
                ) : selectedGameId ? (
                  <span className="text-zinc-500 text-xs">Edits auto-save</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {!selectedGameId ? (
          <div className="text-center text-zinc-500 py-20">Select a game above to load defensive tendencies</div>
        ) : isLoadingPlays ? (
          <div className="text-center text-zinc-400 py-20 flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" /> Analyzing defensive data...
          </div>
        ) : defensivePlays.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">
            <p>No defensive plays found for this game.</p>
            <p className="text-sm mt-2">Upload defensive scouting data on the ODK page first.</p>
          </div>
        ) : (
          <>
            {/* Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total D Plays" value={defensivePlays.length} color="text-white" />
              <StatCard label="Positive Runs (+4)" value={analysis.positive.length} color="text-emerald-400" />
              <StatCard label="Explosive Runs (+10)" value={analysis.explosive.length} color="text-red-400" />
              <StatCard label="Pass Plays" value={analysis.passPositive.length + analysis.passExplosive.length} color="text-blue-400" />
            </div>

            {/* Key Tendencies */}
            {analysis.tendencies.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" /> Key Defensive Tendencies
                </h3>
                <div className="space-y-2">
                  {analysis.tendencies.map((t, i) => (
                    <div key={i} className={`flex items-start gap-3 rounded-lg px-4 py-3 ${t.level === 'high' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                      <span className={t.level === 'high' ? 'text-red-300' : 'text-amber-300'}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Play Categories */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Positive Run Plays */}
              <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2 text-emerald-400">
                  <Zap size={16} /> Positive Run Plays (+4 yds)
                </h3>
                {analysis.positive.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.positive.map((play, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border-l-2 border-emerald-500">
                        <div className="font-medium text-sm">{play.formation}</div>
                        <div className="text-xs text-zinc-400 mt-1">{play.plays}</div>
                        <div className="text-xs text-zinc-500 mt-2">Coverage: {play.coverage} • {play.count} plays</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">No positive run plays found</p>
                )}
              </div>

              {/* Explosive Run Plays */}
              <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2 text-red-400">
                  <Zap size={16} /> Explosive Run Plays (+10 yds)
                </h3>
                {analysis.explosive.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.explosive.map((play, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border-l-2 border-red-500">
                        <div className="font-medium text-sm">{play.formation}</div>
                        <div className="text-xs text-zinc-400 mt-1">{play.plays}</div>
                        <div className="text-xs text-zinc-500 mt-2">Coverage: {play.coverage} • {play.count} plays</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">No explosive run plays found</p>
                )}
              </div>

              {/* Positive Pass Plays */}
              <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2 text-blue-400">
                  <TrendingUp size={16} /> Positive Pass Plays (+7 yds)
                </h3>
                {analysis.passPositive.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.passPositive.map((play, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border-l-2 border-blue-500">
                        <div className="font-medium text-sm">{play.formation}</div>
                        <div className="text-xs text-zinc-400 mt-1">{play.plays}</div>
                        <div className="text-xs text-zinc-500 mt-2">Coverage: {play.coverage} • {play.count} plays</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">No positive pass plays found</p>
                )}
              </div>

              {/* Explosive Pass Plays */}
              <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2 text-purple-400">
                  <Zap size={16} /> Explosive Pass Plays (+15 yds)
                </h3>
                {analysis.passExplosive.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.passExplosive.map((play, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border-l-2 border-purple-500">
                        <div className="font-medium text-sm">{play.formation}</div>
                        <div className="text-xs text-zinc-400 mt-1">{play.plays}</div>
                        <div className="text-xs text-zinc-500 mt-2">Coverage: {play.coverage} • {play.count} plays</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">No explosive pass plays found</p>
                )}
              </div>
            </div>

            {/* Data Entry Table */}
            {data.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
                <h3 className="font-semibold mb-4">Edit Defense Data</h3>
                <div className="overflow-x-auto border border-zinc-700 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-zinc-950 border-b-2 border-zinc-600 sticky top-0 z-10">
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 whitespace-nowrap">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row, rowIndex) => (
                        <tr key={row.id} className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${selectedCell.row === rowIndex ? 'bg-zinc-800/70' : ''}`}>
                          {row.getVisibleCells().map((cell, colIndex) => (
                            <td key={cell.id} className="px-2 py-1 border-r border-zinc-800 last:border-r-0">
                              <EditableCell
                                value={cell.getValue()}
                                rowIndex={rowIndex}
                                columnId={cell.column.id}
                                colIndex={colIndex}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}