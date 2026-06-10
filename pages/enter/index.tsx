'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import useSupabase from '../../lib/useSupabase';
import {
  createGame as createGameRecord,
  createEmptyLiveEntryRow,
  defaultGameOptions,
  fetchGames,
  fetchPlaysForGame,
  initialLiveEntryRows,
  liveEntryFields,
  replacePlaysForGame,
  rowsToCsv as buildCsv,
  summarizePlays,
  type GameOption,
  type LiveEntryFieldKey,
  type LiveEntryRow,
} from '../../lib/coach-data';

const fields = liveEntryFields;
type FieldKey = LiveEntryFieldKey;
type EntryRow = LiveEntryRow;

const storageGameKey = 'coach-dashboard-live-entry-game';
const storageGameOptionsKey = 'coach-dashboard-live-entry-games';
const storageRowsKey = 'coach-dashboard-live-entry-rows';

export default function LiveEntry() {
  const router = useRouter();
  const { supabase, isReady } = useSupabase();
  const [gameOptions, setGameOptions] = useState<GameOption[]>(defaultGameOptions);
  const [selectedGameId, setSelectedGameId] = useState(defaultGameOptions[0].id);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameLabel, setNewGameLabel] = useState('');
  const [newGameOpponent, setNewGameOpponent] = useState('');
  const [newGameDate, setNewGameDate] = useState('');
  const [entries, setEntries] = useState<EntryRow[]>(initialLiveEntryRows);
  const [syncStatus, setSyncStatus] = useState('Local only');
  const cellRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);
  const hasSupabase = Boolean(supabase && isReady);

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      return;
    }

    const loadData = async () => {
      try {
        setSyncStatus('Loading Supabase data...');
        const games = await fetchGames(supabase);
        const mergedGames = games.length > 0 ? games : defaultGameOptions;
        setGameOptions(mergedGames);

        const gameIdToUse = mergedGames.some((game) => game.id === selectedGameId) ? selectedGameId : mergedGames[0].id;
        setSelectedGameId(gameIdToUse);

        const plays = await fetchPlaysForGame(supabase, gameIdToUse);
        if (plays.length > 0) {
          setEntries(plays);
        }

        setSyncStatus('Synced with Supabase');
      } catch (error) {
        setSyncStatus(error instanceof Error ? error.message : 'Supabase sync failed');
      }
    };

    void loadData();
  }, [hasSupabase, supabase]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedGameId = window.localStorage.getItem(storageGameKey);
    const savedGames = window.localStorage.getItem(storageGameOptionsKey);
    const savedRows = window.localStorage.getItem(storageRowsKey);

    if (savedGames) {
      try {
        const parsedGames = JSON.parse(savedGames) as GameOption[];
        if (Array.isArray(parsedGames) && parsedGames.length > 0) {
          setGameOptions(parsedGames);
        }
      } catch {
        window.localStorage.removeItem(storageGameOptionsKey);
      }
    }

    if (savedGameId && [...defaultGameOptions, ...gameOptions].some((game) => game.id === savedGameId)) {
      setSelectedGameId(savedGameId);
    }

    if (savedRows) {
      try {
        const parsedRows = JSON.parse(savedRows) as EntryRow[];
        if (Array.isArray(parsedRows) && parsedRows.length > 0) {
          setEntries(parsedRows);
        }
      } catch {
        window.localStorage.removeItem(storageRowsKey);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageGameKey, selectedGameId);
  }, [selectedGameId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageGameOptionsKey, JSON.stringify(gameOptions));
  }, [gameOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageRowsKey, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      return;
    }

    const syncPlays = window.setTimeout(() => {
      void replacePlaysForGame(supabase, selectedGameId, entries)
        .then(() => setSyncStatus('Saved to Supabase'))
        .catch((error) => setSyncStatus(error instanceof Error ? error.message : 'Failed to save to Supabase'));
    }, 800);

    return () => window.clearTimeout(syncPlays);
  }, [entries, hasSupabase, selectedGameId, supabase]);

  const updateEntry = (id: number, field: FieldKey, value: string) => {
    const nextValue = value.toUpperCase();
    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === id ? { ...entry, [field]: nextValue } : entry))
    );
  };

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const cell = cellRefs.current[rowIndex]?.[columnIndex];
    if (!cell) return;

    window.requestAnimationFrame(() => {
      cell.focus();
      cell.select();
    });
  };

  const addRow = (focusColumn = 0) => {
    setEntries((currentEntries) => [...currentEntries, createEmptyRow(String(currentEntries.length + 1))]);
    window.setTimeout(() => focusCell(entries.length, focusColumn), 0);
  };

  const saveSheet = () => {
    window.localStorage.setItem(storageGameKey, selectedGameId);
    window.localStorage.setItem(storageGameOptionsKey, JSON.stringify(gameOptions));
    window.localStorage.setItem(storageRowsKey, JSON.stringify(entries));

    if (hasSupabase && supabase) {
      void replacePlaysForGame(supabase, selectedGameId, entries)
        .then(() => setSyncStatus('Saved to Supabase'))
        .catch((error) => setSyncStatus(error instanceof Error ? error.message : 'Failed to save to Supabase'));
    }
  };

  const createGame = () => {
    if (!newGameLabel.trim() || !newGameOpponent.trim() || !newGameDate.trim()) {
      return;
    }

    const gameId = `${newGameDate}-${newGameLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const nextGame: GameOption = {
      id: gameId,
      label: newGameLabel.trim(),
      opponent: newGameOpponent.trim(),
      date: newGameDate,
    };

    const persistGame = async () => {
      try {
        let createdGame = nextGame;

        if (hasSupabase && supabase) {
          createdGame = await createGameRecord(supabase, nextGame);
        }

        setGameOptions((currentGames) => {
          const nextGames = currentGames.some((game) => game.id === createdGame.id) ? currentGames : [...currentGames, createdGame];
          return nextGames;
        });
        setSelectedGameId(createdGame.id);
        setIsCreatingGame(false);
        setNewGameLabel('');
        setNewGameOpponent('');
        setNewGameDate('');
        setSyncStatus(hasSupabase ? 'Game saved to Supabase' : 'Game saved locally');
      } catch (error) {
        setSyncStatus(error instanceof Error ? error.message : 'Failed to create game');
      }
    };

    void persistGame();
  };

  const downloadCsv = () => {
    const csv = buildCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `live-entry-${selectedGameId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedGame = useMemo(() => gameOptions.find((game) => game.id === selectedGameId) ?? gameOptions[0], [gameOptions, selectedGameId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) => {
    let nextRow = rowIndex;
    let nextColumn = columnIndex;

    if (event.key === 'Tab') {
      event.preventDefault();
      nextColumn += event.shiftKey ? -1 : 1;
    } else if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextRow += 1;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextRow -= 1;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextColumn -= 1;
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextColumn += 1;
    } else {
      return;
    }

    if (nextColumn < 0) {
      nextColumn = fields.length - 1;
      nextRow -= 1;
    }

    if (nextColumn >= fields.length) {
      nextColumn = 0;
      nextRow += 1;
    }

    if (nextRow < 0) return;

    if (nextRow >= entries.length) {
      addRow(nextColumn);
      return;
    }

    focusCell(nextRow, nextColumn);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Live Entry</h1>
            <p className="text-zinc-400">Combined live input for offense, defense, and kick in one spreadsheet.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveSheet} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
              Save Sheet
            </button>
            <button onClick={downloadCsv} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold">
              Download CSV
            </button>
            <button onClick={() => router.push('/')} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
              Back Home
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl font-semibold">Live Input Sheet</h2>
              <p className="text-sm text-zinc-400">Tab, arrows, and Enter move like a spreadsheet. Entry is forced to uppercase.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                <span className="text-sm text-zinc-400 whitespace-nowrap">Choose Game</span>
                <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)} className="bg-transparent text-sm outline-none">
                  {gameOptions.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.label} - {game.opponent} ({game.date})
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => setIsCreatingGame((current) => !current)} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
                New Game
              </button>
              <button onClick={() => addRow(0)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-semibold">
                Add Row
              </button>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950 text-sm text-zinc-400 flex items-center justify-between gap-4">
            <div>
              Game: <span className="text-white">{selectedGame.label}</span> | Opponent: <span className="text-white">{selectedGame.opponent}</span> | Date: <span className="text-white">{selectedGame.date}</span>
            </div>
            <div className="text-xs uppercase tracking-wide">{syncStatus}</div>
          </div>

          {isCreatingGame && (
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/80">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <label className="space-y-2">
                  <span className="text-sm text-zinc-400">Game Name</span>
                  <input value={newGameLabel} onChange={(event) => setNewGameLabel(event.target.value)} placeholder="Varsity Home Game" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-zinc-400">Opponent</span>
                  <input value={newGameOpponent} onChange={(event) => setNewGameOpponent(event.target.value)} placeholder="Eagles" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-zinc-400">Date</span>
                  <input value={newGameDate} onChange={(event) => setNewGameDate(event.target.value)} type="date" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2" />
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={createGame} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold">
                    Create Game
                  </button>
                  <button onClick={() => setIsCreatingGame(false)} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2200px] text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wide text-xs">
                <tr>
                  {fields.map((field) => (
                    <th key={field.key} className={`px-4 py-3 border-b border-zinc-800 ${field.width}`}>
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, rowIndex) => (
                  <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-950/60">
                    {fields.map((field, columnIndex) => (
                      <td key={field.key} className={`px-2 py-2 ${field.width}`}>
                        <input
                          ref={(node) => {
                            if (!cellRefs.current[rowIndex]) {
                              cellRefs.current[rowIndex] = [];
                            }
                            cellRefs.current[rowIndex][columnIndex] = node;
                          }}
                          value={entry[field.key]}
                          onChange={(event) => updateEntry(entry.id, field.key, event.target.value)}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                          inputMode={field.inputMode}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 uppercase tracking-wide text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
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
    </div>
  );
}
