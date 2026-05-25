'use client';

import { Play, Upload, BarChart3, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';

export default function KangaroosLanding() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md fixed w-full z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">K</div>
            <div>
              <div className="font-bold text-2xl tracking-tight">Kangaroos Stats</div>
              <div className="text-xs text-zinc-500 -mt-1">HS Football</div>
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
          <div className="mb-16 mt-8">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-sm mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Ready for Friday Night
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
        </div>
      </div>

      <div className="bg-zinc-900 border-t border-zinc-800 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-2">Weekly Workflow</h2>
          <p className="text-zinc-400 mb-10">From film room to Friday night</p>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">Kangaroos Football • Built for the sideline</footer>
    </div>
  );
}
