'use client';

import { useEffect, useMemo, useState } from 'react';
import { Play, Upload, BarChart3, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import useSupabase from '../lib/useSupabase';
import { defaultGameOptions, fetchGames, fetchPlaysForGame, summarizePlays, type GameOption } from '../lib/coach-data';

export default function KangaroosLanding() {
  const router = useRouter();
  const { supabase, isReady } = useSupabase();
  const [games, setGames] = useState<GameOption[]>(defaultGameOptions);
  const [summary, setSummary] = useState({ offense: 0, defense: 0, kick: 0, total: 0 });
  const [status, setStatus] = useState('Loading Supabase...');

  useEffect(() => {
    if (!supabase || !isReady) {
      return;
    }

    const load = async () => {
      try {
        const loadedGames = await fetchGames(supabase);
        const nextGames = loadedGames.length > 0 ? loadedGames : defaultGameOptions;
        setGames(nextGames);

        const latestGame = nextGames[0];
        const plays = latestGame ? await fetchPlaysForGame(supabase, latestGame.id) : [];
        setSummary(summarizePlays(plays));
        setStatus('Connected to Supabase');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Supabase connection failed');
      }
    };

    void load();
  }, [supabase, isReady]);

  const latestGame = useMemo(() => games[0], [games]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md fixed w-full z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">K</div>
            <div>
              <div className="font-bold text-2xl tracking-tight">Kangaroos Football</div>
              <div className="text-xs text-zinc-500 -mt-1">Stats & Scouting</div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm">
            <button onClick={() => router.push('/')} className="text-blue-400">Home</button>
            <button onClick={() => router.push('/enter')} className="hover:text-blue-400 transition-colors">Live Entry</button>
            <button onClick={() => router.push('/upload')} className="hover:text-blue-400 transition-colors">Upload</button>
            <button onClick={() => router.push('/analyze')} className="hover:text-blue-400 transition-colors">Analysis</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="container text-center">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            <span className="text-emerald-400">{status}</span>
            <span>Games: {games.length}</span>
            <span>Plays in latest game: {summary.total}</span>
          </div>

          <div className="mb-16 mt-8">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-sm mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {latestGame ? `${latestGame.label} • ${latestGame.opponent}` : 'Ready for Friday Night'}
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
              Kangaroos Football<br />
              <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">Stats & Scouting</span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Live play-by-play entry • Smart auto calculations • Opponent scouting</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-blue-500 transition-all group">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Live Data Entry</h3>
              <p className="text-zinc-400 mb-8">Real-time play tracking with automatic down & distance calculations.</p>
              <button onClick={() => router.push('/enter')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors">
                START LIVE ENTRY <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-purple-500 transition-all group">
              <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Upload Scout Data</h3>
              <p className="text-zinc-400 mb-8">Import CSV play data from film sessions to build opponent tendency profiles.</p>
              <button onClick={() => router.push('/upload')} className="w-full bg-purple-700 hover:bg-purple-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors">
                UPLOAD FILM DATA <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-emerald-500 transition-all group">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Analyze & Scout</h3>
              <p className="text-zinc-400 mb-8">View tendencies by situation, compare scouted film to the current game, and spot if trends are holding.</p>
              <button onClick={() => router.push('/analyze')} className="w-full bg-emerald-700 hover:bg-emerald-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors">
                VIEW TENDENCIES <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400 mb-2">Latest game</div>
              <div className="text-lg font-semibold">{latestGame?.label ?? 'No games found'}</div>
              <div className="text-sm text-zinc-400">{latestGame ? `${latestGame.opponent} • ${latestGame.date}` : 'Connect Supabase to load games'}</div>
            </div>
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400 mb-2">Game count</div>
              <div className="text-3xl font-bold">{games.length}</div>
              <div className="text-sm text-zinc-400">Loaded from the games table</div>
            </div>
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400 mb-2">Latest play mix</div>
              <div className="text-3xl font-bold">O {summary.offense} / D {summary.defense} / K {summary.kick}</div>
              <div className="text-sm text-zinc-400">Loaded from the plays table</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border-t border-zinc-800 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-2">Weekly Workflow</h2>
          <p className="text-zinc-400 mb-10">From film room to Friday night</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
              <div className="text-sm text-blue-400 font-semibold mb-2">1. Prepare</div>
              <div className="text-lg font-medium">Upload film data and review opponent tendencies.</div>
            </div>
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
              <div className="text-sm text-purple-400 font-semibold mb-2">2. Track</div>
              <div className="text-lg font-medium">Log live plays during the game with quick entry tools.</div>
            </div>
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
              <div className="text-sm text-emerald-400 font-semibold mb-2">3. Adjust</div>
              <div className="text-lg font-medium">Compare scout film to the live game and spot trend changes.</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">Kangaroos Football • Built for the sideline</footer>
    </div>
  );
}
