'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSupabase from '../../lib/useSupabase';
import { defaultGameOptions, fetchGames, fetchPlaysForGame, summarizePlays, type GameOption } from '../../lib/coach-data';

export default function AnalyzePage() {
  const router = useRouter();
  const { supabase, isReady } = useSupabase();
  const [gameOptions, setGameOptions] = useState<GameOption[]>(defaultGameOptions);
  const [summary, setSummary] = useState({ offense: 0, defense: 0, kick: 0, total: 0 });
  const [status, setStatus] = useState('Loading Supabase...');

  useEffect(() => {
    if (!supabase || !isReady) {
      return;
    }

    const load = async () => {
      try {
        const games = await fetchGames(supabase);
        const nextGames = games.length > 0 ? games : defaultGameOptions;
        setGameOptions(nextGames);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analyze & Scout</h1>
            <p className="text-zinc-400">Click into dedicated offense and defense data pages.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-zinc-500">{status}</span>
            <button onClick={() => router.push('/')} className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
              Back Home
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 text-sm text-zinc-300 flex flex-wrap items-center justify-between gap-3">
          <div>Games loaded from Supabase: <span className="text-white">{gameOptions.length}</span></div>
          <div>Latest game plays: <span className="text-white">{summary.total}</span></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button onClick={() => router.push('/analyze/offense')} className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 text-left hover:bg-blue-500/15 transition-colors">
            <div className="text-sm font-semibold text-blue-400 mb-2">For our Offense</div>
            <h2 className="text-2xl font-semibold mb-3">Open Offensive Data</h2>
            <p className="text-zinc-300 mb-6">Live defensive data and defensive data from past film.</p>
            <div className="inline-flex rounded-2xl bg-blue-600 px-4 py-2 font-semibold">View offense page</div>
          </button>

          <button onClick={() => router.push('/analyze/defense')} className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-left hover:bg-emerald-500/15 transition-colors">
            <div className="text-sm font-semibold text-emerald-400 mb-2">For our Defense</div>
            <h2 className="text-2xl font-semibold mb-3">Open Defensive Data</h2>
            <p className="text-zinc-300 mb-6">Offensive tendencies from scout film and defensive data from Live Entry.</p>
            <div className="inline-flex rounded-2xl bg-emerald-600 px-4 py-2 font-semibold">View defense page</div>
          </button>
        </div>
      </div>
    </div>
  );
}
