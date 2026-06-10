'use client';

import { useRouter } from 'next/router';

export default function DefenseEntryPage() {
  const router = useRouter();

  return ( 
    <div className="min-h-screen bg-zinc-950 text-white"> 
      <div className="container pt-24 pb-12"> 
        <div className="flex items-center justify-between gap-4 mb-8"> 
          <div> 
            <h1 className="text-3xl font-bold mb-2">Defense Entry</h1> 
            <p className="text-zinc-400">Quick defensive charting with a live summary.</p> 
          </div> 
          <button onClick={() => router.push('/enter')} className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"> 
            Back to Live Entry 
          </button> 
        </div> 
        <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-6"> 
          <div className="space-y-6"> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Front and Coverage</h2> 
              <div className="grid sm:grid-cols-4 gap-3"> 
                {frontOptions.map((option) => ( 
                  <button 
                    key={option} 
                    onClick={() => setFront(option)} 
                    className={`rounded-2xl px-4 py-3 border transition-colors ${front === option ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`} 
                  > 
                    {option} 
                  </button> 
                ))} 
              </div> 
              <div className="grid sm:grid-cols-4 gap-3 mt-5"> 
                {coverageOptions.map((option) => ( 
                  <button 
                    key={option} 
                    onClick={() => setCoverage(option)} 
                    className={`rounded-2xl px-4 py-3 border transition-colors ${coverage === option ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`} 
                  > 
                    {option} 
                  </button> 
                ))} 
              </div> 
            </div> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Pressure and Result</h2> 
              <div className="grid sm:grid-cols-4 gap-3"> 
                {pressureOptions.map((option) => ( 
                  <button 
                    key={option} 
                    onClick={() => setPressure(option)} 
                    className={`rounded-2xl px-4 py-3 border transition-colors ${pressure === option ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`} 
                  > 
                    {option} 
                  </button> 
                ))} 
              </div> 
              <div className="grid sm:grid-cols-2 gap-4 mt-5"> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Result</span> 
                  <input value={result} onChange={(event) => setResult(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" /> 
                </label> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Yards Allowed</span> 
                  <input value={yardsAllowed} onChange={(event) => setYardsAllowed(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" /> 
                </label> 
              </div> 
            </div> 
          </div> 
          <div className="space-y-6"> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Live Summary</h2> 
              <div className="space-y-3 text-sm"> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Front</span><span>{front}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Coverage</span><span>{coverage}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Pressure</span><span>{pressure}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Result</span><span>{result}</span></div> 
                <div className="flex justify-between"><span className="text-zinc-400">Yards Allowed</span><span>{yardsAllowed}</span></div> 
              </div> 
            </div> 
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6"> 
              <h2 className="text-lg font-semibold mb-2">Next step</h2> 
              <p className="text-zinc-300 text-sm">This screen can connect to the defensive chart once the play log schema is finalized.</p> 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}