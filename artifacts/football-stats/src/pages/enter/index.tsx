import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Download, Save, Loader2, CheckCircle } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

type NumericField = number | '';

type PlayEntry = {
  playNumber: number;
  odk: string;
  down: NumericField;
  dist: NumericField;
  hash: string;
  gnls: NumericField;
  yardLine: NumericField;
  playType: string;
  result: string;
  offFormation: string;
  offPlay: string;
  motion: string;
  playDir: string;
  ballCarrier: string;
  defFront: string;
  stunt: string;
  blitz: string;
  coverage: string;
};

function EditableCell({
  value,
  rowIndex,
  columnId,
  colIndex,
  isSelected,
  onSelect,
  onUpdate,
  onMove,
}: {
  value: any;
  rowIndex: number;
  columnId: string;
  colIndex: number;
  isSelected: boolean;
  onSelect: (row: number, col: number) => void;
  onUpdate: (rowIndex: number, columnId: string, value: any) => void;
  onMove: (row: number, col: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  return (
    <input
      ref={inputRef}
      value={value ?? ''}
      onChange={(e) => onUpdate(rowIndex, columnId, e.target.value)}
      onClick={() => onSelect(rowIndex, colIndex)}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            onMove(rowIndex + 1, colIndex);
            break;
          case 'Tab':
            e.preventDefault();
            onMove(rowIndex, colIndex + (e.shiftKey ? -1 : 1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            onMove(rowIndex + 1, colIndex);
            break;
          case 'ArrowUp':
            e.preventDefault();
            onMove(rowIndex - 1, colIndex);
            break;
          case 'ArrowRight':
            if (inputRef.current?.selectionStart === inputRef.current?.value.length) {
              e.preventDefault();
              onMove(rowIndex, colIndex + 1);
            }
            break;
          case 'ArrowLeft':
            if (inputRef.current?.selectionStart === 0) {
              e.preventDefault();
              onMove(rowIndex, colIndex - 1);
            }
            break;
        }
      }}
      className={`w-full min-h-[38px] px-3 py-1 bg-transparent outline-none border text-center transition-colors ${
        isSelected ? 'border-blue-500 bg-zinc-800' : 'border-transparent hover:border-zinc-700'
      }`}
    />
  );
}

type Game = {
  id: string;
  opponent: string;
  game_date: string;
};

export default function LiveEntry() {
  const [, navigate] = useLocation();
  const [games, setGames] = useState<Game[]>([]);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playIdsRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const loadGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent, game_date')
        .order('game_date', { ascending: false });
      if (!error) setGames(data || []);
    };
    loadGames();
  }, []);

  const [data, setData] = useState<PlayEntry[]>(() => {
    const rows: PlayEntry[] = [];
    for (let i = 1; i <= 200; i++) {
      rows.push({
        playNumber: i,
        odk: i % 2 === 0 ? 'D' : 'O',
        down: i === 1 ? 1 : '',
        dist: i === 1 ? 10 : '',
        hash: '',
        gnls: '',
        yardLine: i === 1 ? -25 : '',
        playType: '',
        result: '',
        offFormation: '',
        offPlay: '',
        motion: '',
        playDir: '',
        ballCarrier: '',
        defFront: '',
        stunt: '',
        blitz: '',
        coverage: '',
      });
    }
    return rows;
  });

  const columnHelper = createColumnHelper<PlayEntry>();

  const columns = [
    columnHelper.accessor('playNumber', { header: 'PLAY #' }),
    columnHelper.accessor('odk', { header: 'ODK' }),
    columnHelper.accessor('down', { header: 'DN' }),
    columnHelper.accessor('dist', { header: 'DIST' }),
    columnHelper.accessor('hash', { header: 'HASH' }),
    columnHelper.accessor('gnls', { header: 'GN/LS' }),
    columnHelper.accessor('yardLine', { header: 'YARD LN' }),
    columnHelper.accessor('playType', { header: 'PLAY TYPE' }),
    columnHelper.accessor('result', { header: 'RESULT' }),
    columnHelper.accessor('offFormation', { header: 'OFF FORM' }),
    columnHelper.accessor('offPlay', { header: 'OFF PLAY' }),
    columnHelper.accessor('motion', { header: 'MOTION' }),
    columnHelper.accessor('playDir', { header: 'PLAY DIR' }),
    columnHelper.accessor('ballCarrier', { header: 'BALL CAR' }),
    columnHelper.accessor('defFront', { header: 'DEF FRON' }),
    columnHelper.accessor('stunt', { header: 'STUNT' }),
    columnHelper.accessor('blitz', { header: 'BLITZ' }),
    columnHelper.accessor('coverage', { header: 'COVERAGE' }),
  ];

  const loadPlays = useCallback(async (gameId: string) => {
    setIsLoading(true);
    try {
      const { data: plays, error } = await supabase
        .from('plays')
        .select('*')
        .eq('game_id', gameId)
        .order('play_number');
      if (error) throw error;
      playIdsRef.current = new Map();
      plays.forEach((p) => playIdsRef.current.set(p.play_number, p.id));
      setData((prev) => {
        const next = [...prev];
        plays.forEach((p) => {
          const idx = p.play_number - 1;
          if (idx >= 0 && idx < next.length) {
            next[idx] = {
              playNumber: p.play_number,
              odk: p.odk ?? next[idx].odk,
              down: p.down ?? '',
              dist: p.dist ?? '',
              hash: p.hash ?? '',
              gnls: p.gnls ?? '',
              yardLine: p.yard_line ?? '',
              playType: p.play_type ?? '',
              result: p.result ?? '',
              offFormation: p.off_formation ?? '',
              offPlay: p.off_play ?? '',
              motion: p.motion ?? '',
              playDir: p.play_dir ?? '',
              ballCarrier: p.ball_carrier ?? '',
              defFront: p.front ?? '',
              stunt: p.defense ?? '',
              blitz: p.blitz ?? '',
              coverage: p.coverage ?? '',
            };
          }
        });
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentGameId) loadPlays(currentGameId);
  }, [currentGameId, loadPlays]);

  const buildPayload = useCallback((play: PlayEntry) => ({
    ...(playIdsRef.current.has(play.playNumber) ? { id: playIdsRef.current.get(play.playNumber) } : {}),
    game_id: currentGameId,
    play_number: play.playNumber,
    odk: play.odk,
    down: play.down || null,
    dist: play.dist || null,
    hash: play.hash || null,
    gnls: play.gnls || null,
    yard_line: play.yardLine || null,
    play_type: play.playType || null,
    result: play.result || null,
    off_formation: play.offFormation || null,
    off_play: play.offPlay || null,
    motion: play.motion || null,
    play_dir: play.playDir || null,
    ball_carrier: play.ballCarrier || null,
    front: play.defFront || null,
    defense: play.stunt || null,
    blitz: play.blitz || null,
    coverage: play.coverage || null,
  }), [currentGameId]);

  const hasData = (play: PlayEntry) =>
    playIdsRef.current.has(play.playNumber) ||
    play.down !== '' || play.dist !== '' || play.hash !== '' ||
    play.gnls !== '' || play.yardLine !== '' || play.playType !== '' ||
    play.result !== '' || play.offFormation !== '' || play.offPlay !== '' ||
    play.motion !== '' || play.playDir !== '' || play.ballCarrier !== '' ||
    play.defFront !== '' || play.stunt !== '' || play.blitz !== '' || play.coverage !== '';

  const autoSave = useCallback(async () => {
    if (!currentGameId) return;
    const playsToSave = data.filter(hasData).map(buildPayload);
    if (playsToSave.length === 0) return;
    setIsSaving(true);
    try {
      const { data: saved, error } = await supabase
        .from('plays')
        .upsert(playsToSave)
        .select('id, play_number');
      if (error) throw error;
      saved?.forEach((row) => playIdsRef.current.set(row.play_number, row.id));
      setLastSaved(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [currentGameId, data, buildPayload]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(autoSave, 2000);
  }, [autoSave]);

  useEffect(() => {
    if (currentGameId) triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, currentGameId, triggerAutoSave]);

  const toPosition = (val: NumericField): number => {
    if (val === '' || val === null) return 50;
    const n = Number(val);
    if (isNaN(n)) return 50;
    if (n < 0) return -n;
    return n >= 50 ? 50 : 50 + (50 - n);
  };

  const calculateGainLoss = (prev: NumericField, current: NumericField): NumericField => {
    if (prev === '' || current === '') return '';
    return toPosition(current) - toPosition(prev);
  };

  const updateNextDownDistance = (plays: PlayEntry[], index: number) => {
    const current = plays[index];
    const next = plays[index + 1];
    if (!next) return;
    if (current.gnls === '' || current.dist === '' || current.down === '') return;

    const gain = Number(current.gnls);
    const dist = Number(current.dist);
    const down = Number(current.down);

    if (isNaN(gain) || isNaN(dist) || isNaN(down)) return;

    if (gain >= dist) {
      next.down = 1;
      next.dist = 10;
    } else if (down < 4) {
      next.down = down + 1;
      next.dist = Math.max(1, dist - gain);
    } else {
      next.down = '';
      next.dist = '';
    }
  };

  const updateRow = (rowIndex: number, columnId: string, rawValue: any) => {
    const newData = [...data];
    let formatted: any = rawValue;

    if (['down', 'dist', 'gnls', 'yardLine'].includes(columnId)) {
      if (rawValue === '' || rawValue === '-') {
        formatted = rawValue;
      } else {
        const num = Number(rawValue);
        formatted = isNaN(num) ? '' : num;
      }
    }

    (newData[rowIndex] as any)[columnId] = formatted;

    if (columnId === 'yardLine' && rowIndex > 0) {
      newData[rowIndex - 1].gnls = calculateGainLoss(newData[rowIndex - 1].yardLine, formatted);
      updateNextDownDistance(newData, rowIndex - 1);
    }

    if (['gnls', 'down', 'dist'].includes(columnId) && rowIndex < newData.length - 1) {
      updateNextDownDistance(newData, rowIndex);
    }

    setData(newData);
  };

  const moveToCell = (row: number, col: number) => {
    setSelectedCell({
      row: Math.max(0, Math.min(row, data.length - 1)),
      col: Math.max(0, Math.min(col, columns.length - 1)),
    });
  };

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const startNewGame = async () => {
    if (!opponent.trim()) return alert('Please enter an opponent name first.');
    if (!confirm('Start a new game? Current data will be lost.')) return;

    setIsStartingNewGame(true);
    try {
      const { data: game, error } = await supabase
        .from('games')
        .insert({ opponent: opponent.trim(), game_date: gameDate, status: 'live' })
        .select()
        .single();

      if (error) throw error;

      setCurrentGameId(game.id);
      alert('New game started successfully!');

      playIdsRef.current = new Map();
      setData((prev) =>
        prev.map((row, i) => ({
          ...row,
          down: i === 0 ? 1 : '',
          dist: i === 0 ? 10 : '',
          gnls: '',
          yardLine: i === 0 ? -25 : '',
          playType: '',
          result: '',
          offFormation: '',
          offPlay: '',
          motion: '',
          playDir: '',
          ballCarrier: '',
          defFront: '',
          stunt: '',
          blitz: '',
          coverage: '',
        }))
      );
    } catch (error: any) {
      alert(error.message || 'Failed to create new game');
    } finally {
      setIsStartingNewGame(false);
    }
  };

  const saveGame = async () => {
    if (!currentGameId) return alert('Please start a new game first');
    await autoSave();
  };

  const downloadCSV = () => {
    const headers = columns.map((col) => col.header as string);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        columns
          .map((col) => {
            const val = (row as any)[col.id as keyof PlayEntry];
            return val !== null && val !== undefined ? `"${val}"` : '';
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${opponent || 'Game'}_${gameDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-[95%] mx-auto">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white"
              >
                <ArrowLeft size={22} /> Back
              </button>
              <h1 className="text-4xl font-bold">Kangaroos Live Entry</h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={currentGameId || ''}
                onChange={(e) => setCurrentGameId(e.target.value || null)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Game...</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.opponent} — {new Date(game.game_date).toLocaleDateString()}
                  </option>
                ))}
              </select>

              <button
                onClick={() => navigate('/enter')}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium"
              >
                ODK
              </button>
              <button
                onClick={() => navigate('/enter/offense')}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium"
              >
                OFFENSE
              </button>
              <button
                onClick={() => navigate('/enter/defense')}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium"
              >
                DEFENSE
              </button>

              <button
                onClick={startNewGame}
                disabled={isStartingNewGame}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-70 px-5 py-2.5 rounded-xl font-medium transition"
              >
                {isStartingNewGame ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                {isStartingNewGame ? 'Creating...' : 'New Game'}
              </button>

              <input
                type="text"
                placeholder="Opponent Name"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 w-64 focus:outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-5 py-2.5 rounded-xl"
              >
                <Download size={18} /> CSV
              </button>

              <div className="text-sm flex items-center gap-2 text-zinc-400 min-w-[110px]">
                {isSaving ? (
                  <span className="flex items-center gap-1"><Loader2 size={16} className="animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={16} /> Auto-saved</span>
                ) : currentGameId ? (
                  <span className="text-zinc-500 text-xs">Edits auto-save</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-700 rounded-3xl bg-zinc-900 shadow-xl">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-zinc-950 border-b-2 border-zinc-600 sticky top-0 z-10">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-4 text-left text-xs font-semibold text-zinc-300 whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${
                    selectedCell.row === rowIndex ? 'bg-zinc-800/70' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell, colIndex) => (
                    <td key={cell.id} className="px-2 py-1 border-r border-zinc-800 last:border-r-0">
                      <EditableCell
                        value={cell.getValue()}
                        rowIndex={rowIndex}
                        columnId={cell.column.id}
                        colIndex={colIndex}
                        isSelected={selectedCell.row === rowIndex && selectedCell.col === colIndex}
                        onSelect={(r, c) => setSelectedCell({ row: r, col: c })}
                        onUpdate={updateRow}
                        onMove={moveToCell}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
