'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSupabase from '../../lib/useSupabase';
import { defaultGameOptions, fetchGames, fetchPlaysForGame, summarizePlays, type GameOption } from '../../lib/coach-data';

export default function UploadPage() {
  const router = useRouter();
  const { supabase, isReady } = useSupabase();
  const [gameOptions, setGameOptions] = useState<GameOption[]>(defaultGameOptions);
  const [selectedGameId, setSelectedGameId] = useState(defaultGameOptions[0].id);
  const [playSummary, setPlaySummary] = useState({ offense: 0, defense: 0, kick: 0, total: 0 });
  const [status, setStatus] = useState('Loading Supabase...');
  const [fileName, setFileName] = useState('No file selected');
  const [season, setSeason] = useState('2026');

  useEffect(() => {
    if (!supabase || !isReady) {
      return;
    }

    const load = async () => {
      try {
        const games = await fetchGames(supabase);
        const nextGames = games.length > 0 ? games : defaultGameOptions;
        setGameOptions(nextGames);

        const gameId = nextGames.some((game) => game.id === selectedGameId) ? selectedGameId : nextGames[0].id;
        setSelectedGameId(gameId);

        const plays = await fetchPlaysForGame(supabase, gameId);
        setPlaySummary(summarizePlays(plays));
        setStatus('Connected to Supabase');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Supabase connection failed');
      }
    };

    void load();
  }, [supabase, isReady]);

  useEffect(() => {
    if (!supabase || !isReady) {
      return;
    }

    const loadPlays = async () => {
      try {
        const plays = await fetchPlaysForGame(supabase, selectedGameId);
        setPlaySummary(summarizePlays(plays));
      } catch {
        setPlaySummary({ offense: 0, defense: 0, kick: 0, total: 0 });
      }
    };

    void loadPlays();
  }, [supabase, isReady, selectedGameId]);

  const selectedGame = useMemo(() => gameOptions.find((game) => game.id === selectedGameId) ?? gameOptions[0], [gameOptions, selectedGameId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Upload Scout Data</h1>
            <p className="text-zinc-400">Import film clips or CSV exports to build opponent tendency profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-zinc-500">{status}</span>
            <button onClick={() => router.push('/')} className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
              Back Home
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
            <span className="text-sm text-zinc-400 whitespace-nowrap">Choose Game</span>
            <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)} className="bg-transparent text-sm outline-none">
              {gameOptions.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label} - {game.opponent} ({game.date})
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm text-zinc-400">
            Current target: <span className="text-white">{selectedGame.label}</span> • Plays in game: <span className="text-white">{playSummary.total}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Import File</h2>
            <label className="block rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-10 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt,.json"
                className="hidden"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'No file selected')}
              />
              <div className="text-2xl font-semibold mb-2">Drop a file here</div>
              <p className="text-zinc-400 mb-4">CSV, JSON, or exported chart data</p>
              <span className="inline-flex rounded-full bg-purple-700 px-4 py-2 text-sm font-medium">Choose file</span>
            </label>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <label className="space-y-2">
                <span className="text-sm text-zinc-400">Season</span>
                <input value={season} onChange={(event) => setSeason(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
              </label>
              <div className="space-y-2">
                <span className="text-sm text-zinc-400">Selected file</span>
                <div className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">{fileName}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-semibold mb-4">Import Checklist</h2>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">File type</span><span>CSV / JSON</span></div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Season</span><span>{season}</span></div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Game target</span><span>{selectedGame.label}</span></div>
                <div className="flex items-center justify-between"><span className="text-zinc-400">Plays loaded</span><span>{playSummary.total}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
              <h2 className="text-lg font-semibold mb-2">Next step</h2>
              <p className="text-zinc-300 text-sm">This is wired to the same games table that live entry and analysis use. The file import can be attached to the selected game next.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
