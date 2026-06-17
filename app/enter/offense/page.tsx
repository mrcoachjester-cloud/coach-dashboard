'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { supabase } from '@/lib/supabase';

type Game = {
  id: string;
  opponent: string;
  game_date: string;
};

type NumericField = number | '';

type PlayEntry = {
  id?: string;
  playNumber: number;
  down: NumericField;
  dist: NumericField;
  hash: string;
  yardLine: NumericField;
  gnls: NumericField;
  offFormation: string;
  motion: string;
  offPlay: string;
  ballCarrier: string;
  front: string;
  blitz: string;
  coverage: string;
};

export default function OffenseEntry() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [data, setData] = useState<PlayEntry[]>(() => {
    const rows: PlayEntry[] = [];
    for (let i = 1; i <= 200; i++) {
      rows.push({
        playNumber: i,
        down: i === 1 ? 1 : '',
        dist: i === 1 ? 10 : '',
        hash: '',
        yardLine: i === 1 ? -25 : '',
        gnls: '',
        offFormation: '',
        motion: '',
        offPlay: '',
        ballCarrier: '',
        front: '',
        blitz: '',
        coverage: '',
      });
    }
    return rows;
  });

  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const columnHelper = createColumnHelper<PlayEntry>();

  const columns = [
    columnHelper.accessor('playNumber', { header: 'PLAY #' }),
    columnHelper.accessor('down', { header: 'DN' }),
    columnHelper.accessor('dist', { header: 'DIST' }),
    columnHelper.accessor('yardLine', { header: 'YARD LN' }),
    columnHelper.accessor('gnls', { header: 'GN/LS' }),
    columnHelper.accessor('offFormation', { header: 'OFF FORM' }),
    columnHelper.accessor('motion', { header: 'MOTION' }),
    columnHelper.accessor('offPlay', { header: 'OFF PLAY' }),
    columnHelper.accessor('ballCarrier', { header: 'BALL CARRIER' }),
    columnHelper.accessor('front', { header: 'FRONT' }),
    columnHelper.accessor('blitz', { header: 'BLITZ' }),
    columnHelper.accessor('coverage', { header: 'COVERAGE' }),
  ];

  // Load Games
  useEffect(() => {
    const loadGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent, game_date')
        .order('game_date', { ascending: false });

      if (error) console.error(error);
      else setGames(data || []);
      setIsLoadingGames(false);
    };
    loadGames();
  }, []);

  // Auto Save - Fixed Type Error
  const autoSave = useCallback(async () => {
    if (!selectedGameId) return;

    setIsSaving(true);
    try {
      const playsToSave = data.map((play) => ({
        game_id: selectedGameId,
        play_number: play.playNumber,
        down: play.down || null,
        dist: play.dist || null,
        hash: play.hash || null,
        yard_line: play.yardLine || null,
        gnls: play.gnls || null,
        off_formation: play.offFormation || null,
        motion: play.motion || null,
        off_play: play.offPlay || null,
        ball_carrier: play.ballCarrier || null,
        front: play.front || null,
        blitz: play.blitz || null,
        coverage: play.coverage || null,
      }));

      const { error } = await supabase
        .from('plays')
        .upsert(playsToSave as any, { onConflict: 'game_id,play_number' });

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
    if (selectedGameId) triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, selectedGameId, triggerAutoSave]);

  const updateField = (rowIndex: number, columnId: string, newValue: any) => {
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
          isSelected ? 'border-blue-500 bg-zinc-800' : 'border-transparent hover:border-zinc-700'
        }`}
      />
    );
  }

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-[95%] mx-auto">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white">
                <ArrowLeft size={22} /> Back
              </button>
              <div>
                <h1 className="text-4xl font-bold">Offense Detailed Entry</h1>
                <p className="text-emerald-500">Formation • Motion • Ball Carrier • Blitz</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedGameId || ''}
                onChange={(e) => setSelectedGameId(e.target.value)}
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
                onClick={() => window.location.href = '/enter'}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium"
              >
                ODK
              </button>

              <button 
                onClick={() => window.location.href = '/enter/defense'}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium"
              >
                DEFENSE
              </button>

              <div className="text-sm flex items-center gap-2 text-zinc-400">
                {isSaving ? (
                  <span className="flex items-center gap-1"><Loader2 size={16} className="animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={16} /> Auto-saved</span>
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
    </div>
  );
}