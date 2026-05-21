'use client';

import { Play, Upload, BarChart3, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function KangaroosLanding() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              K
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight">Kangaroos Stats</div>
              <div className="text-xs text-zinc-500 -mt-1">HS Football</div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm">
            <button onClick={() => navigate('/')} className="text-blue-400">Home</button>
            <button onClick={() => navigate('/enter')} className="hover:text-blue-400 transition-colors">Live Entry</button>
            <button onClick={() => navigate('/upload')} className="hover:text-blue-400 transition-colors">Upload</button>
            <button onClick={() => navigate('/analyze')} className="hover:text-blue-400 transition-colors">Analysis</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Hero */}
          <div className="mb-16 mt-8">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-sm mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Ready for Friday Night
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
              Kangaroos Football<br />
              <span className="bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
                Stats & Scouting
              </span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Live play-by-play entry • Smart auto calculations • Opponent scouting
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Live Entry */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-blue-500 transition-all group">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Live Data Entry</h3>
              <p className="text-zinc-400 mb-8">
                Real-time play tracking with automatic down & distance calculations.
              </p>
              <button
                onClick={() => navigate('/enter')}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors"
              >
                START LIVE ENTRY <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Upload / Scout */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-purple-500 transition-all group">
              <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Upload Scout Data</h3>
              <p className="text-zinc-400 mb-8">
                Import CSV play data from film sessions to build opponent tendency profiles.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="w-full bg-purple-700 hover:bg-purple-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors"
              >
                UPLOAD FILM DATA <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Analyze */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 hover:border-emerald-500 transition-all group">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Analyze & Scout</h3>
              <p className="text-zinc-400 mb-8">
                View tendencies by situation, compare scouted film to the current game, and spot if trends are holding.
              </p>
              <button
                onClick={() => navigate('/analyze')}
                className="w-full bg-emerald-700 hover:bg-emerald-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors"
              >
                VIEW TENDENCIES <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-zinc-900 border-t border-zinc-800 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2">Weekly Workflow</h2>
          <p className="text-zinc-400 mb-10">From film room to Friday night</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10',
                title: 'Upload Opponent Film',
                desc: 'Import 2–3 games of opponent play-by-play data from film sessions using the CSV uploader.',
              },
              {
                step: '02', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10',
                title: 'Identify Tendencies',
                desc: 'Use Analyze & Scout to see formation usage, blitz patterns, coverage on 3rd & long, and more — broken out by situation.',
              },
              {
                step: '03', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10',
                title: 'Compare During the Game',
                desc: "Switch to Compare mode on game day to see if the opponent's scouted tendencies are still holding up.",
              },
            ].map(s => (
              <div key={s.step} className={`bg-zinc-950 border ${s.border} rounded-3xl p-6`}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} ${s.color} font-bold text-sm mb-4`}>{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">
        Kangaroos Football • Built for the sideline
      </footer>
    </div>
  );
}
