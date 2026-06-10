'use client';

import { useRouter } from 'next/router';

export default function OffenseEntryPage() {
  const router = useRouter();

  return ( 
    <div className="min-h-screen bg-zinc-950 text-white"> 
      <div className="container pt-24 pb-12"> 
        <div className="flex items-center justify-between gap-4 mb-8"> 
          <div> 
            <h1 className="text-3xl font-bold mb-2">Offense Entry</h1> 
            <p className="text-zinc-400">Quick offensive play logging with a live summary.</p> 
          </div> 
          <button onClick={() => router.push('/enter')} className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"> 
            Back to Live Entry 
          </button> 
        </div> 
        <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-6"> 
          <div className="space-y-6"> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Situation</h2> 
              <div className="grid sm:grid-cols-4 gap-3"> 
                {quarterOptions.map((option) => ( 
                  <button 
                    key={option} 
                    onClick={() => setQuarter(option)} 
                    className={`rounded-2xl px-4 py-3 border transition-colors ${quarter === option ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`} 
                  > 
                    Q{option} 
                  </button> 
                ))} 
              </div> 
              <div className="grid sm:grid-cols-3 gap-4 mt-5"> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Down</span> 
                  <select value={down} onChange={(event) => setDown(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3"> 
                    {downOptions.map((option) => ( 
                      <option key={option} value={option}> 
                        {option} 
                      </option> 
                    ))} 
                  </select> 
                </label> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Distance</span> 
                  <input value={distance} onChange={(event) => setDistance(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" /> 
                </label> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Yard Line</span> 
                  <input value={yardLine} onChange={(event) => setYardLine(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" /> 
                </label> 
              </div> 
            </div> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Play Type</h2> 
              <div className="grid sm:grid-cols-5 gap-3"> 
                {playTypes.map((option) => ( 
                  <button 
                    key={option} 
                    onClick={() => setPlayType(option)} 
                    className={`rounded-2xl px-4 py-3 border transition-colors ${playType === option ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`} 
                  > 
                    {option} 
                  </button> 
                ))} 
              </div> 
              <div className="grid sm:grid-cols-2 gap-4 mt-5"> 
                <label className="space-y-2"> 
                  <span className="text-sm text-zinc-400">Yards Gained</span> 
                  <input value={yards} onChange={(event) => setYards(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3" /> 
                </label> 
                <div className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 flex items-center"> 
                  <div> 
                    <div className="text-sm text-zinc-400">Preview</div> 
                    <div className="font-medium">{playType} on {quarter === '4' ? '4th' : `${quarter}st`.replace('1st', '1st').replace('2st', '2nd').replace('3st', '3rd')} &amp; {distance}</div> 
                  </div> 
                </div> 
              </div> 
            </div> 
          </div> 
          <div className="space-y-6"> 
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"> 
              <h2 className="text-lg font-semibold mb-4">Live Summary</h2> 
              <div className="space-y-3 text-sm"> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Quarter</span><span>Q{quarter}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Down</span><span>{down}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Distance</span><span>{distance}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Yard Line</span><span>{yardLine}</span></div> 
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Play Type</span><span>{playType}</span></div> 
                <div className="flex justify-between"><span className="text-zinc-400">Yards Gained</span><span>{yards}</span></div> 
              </div> 
            </div> 
            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6"> 
              <h2 className="text-lg font-semibold mb-2">Next step</h2> 
              <p className="text-zinc-300 text-sm">This screen can be wired to the actual game log once the data model is ready.</p> 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}