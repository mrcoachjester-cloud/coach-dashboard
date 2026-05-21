import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Loader2, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

type ParsedPlay = {
  play_number: number; odk: string; down: string; dist: string; hash: string;
  gnls: string; yard_line: string; play_type: string; result: string;
  off_formation: string; defense: string; motion: string; off_play: string;
  rpo: string; play_dir: string; blitz: string; coverage: string;
  ball_carrier: string; front: string;
};

type Game = {
  id: string;
  opponent: string;
  game_date: string;
  play_count?: number;
};

const COL_MAP: Record<string, keyof ParsedPlay> = {
  'play #': 'play_number', 'play#': 'play_number', 'playnumber': 'play_number', 'play_number': 'play_number', '#': 'play_number',
  'odk': 'odk',
  'dn': 'down', 'down': 'down',
  'dist': 'dist', 'distance': 'dist',
  'hash': 'hash',
  'gn/ls': 'gnls', 'gnls': 'gnls', 'gain/loss': 'gnls',
  'yard ln': 'yard_line', 'yardline': 'yard_line', 'yard_line': 'yard_line', 'yard line': 'yard_line',
  'play type': 'play_type', 'play_type': 'play_type', 'type': 'play_type',
  'result': 'result',
  'off form': 'off_formation', 'off formation': 'off_formation', 'off_formation': 'off_formation', 'formation': 'off_formation',
  'off play': 'off_play', 'off_play': 'off_play',
  'motion': 'motion',
  'play dir': 'play_dir', 'play_dir': 'play_dir', 'direction': 'play_dir',
  'ball car': 'ball_carrier', 'ball carrier': 'ball_carrier', 'ball_carrier': 'ball_carrier', 'carrier': 'ball_carrier',
  'def fron': 'front', 'def front': 'front', 'defensive front': 'front', 'front': 'front',
  'stunt': 'defense', 'defense': 'defense',
  'blitz': 'blitz',
  'coverage': 'coverage',
  'rpo': 'rpo',
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    const cols: string[] = [];
    let inQuote = false, cur = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  });
  return { headers, rows };
}

function mapHeaders(headers: string[]): Record<number, keyof ParsedPlay> {
  const map: Record<number, keyof ParsedPlay> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/[^a-z0-9/# ]/g, '').trim();
    if (COL_MAP[key]) map[i] = COL_MAP[key];
  });
  return map;
}

function rowToPlay(row: string[], colMap: Record<number, keyof ParsedPlay>): Partial<ParsedPlay> {
  const play: Partial<ParsedPlay> = {};
  Object.entries(colMap).forEach(([idx, field]) => {
    (play as any)[field] = row[+idx] || '';
  });
  return play;
}

const TEMPLATE_CSV = `PLAY #,ODK,DN,DIST,HASH,GN/LS,YARD LN,PLAY TYPE,RESULT,OFF FORM,OFF PLAY,MOTION,PLAY DIR,BALL CAR,DEF FRON,STUNT,BLITZ,COVERAGE
1,O,1,10,M,,25,Run,6,Gun Spread,Zone Read,,R,Jones,,,, 
2,D,1,10,M,,-25,Pass,,,,,,,,3-4,,Cover 3
3,O,2,4,R,,,Pass,,Shotgun,Slant,,M,,,,, `;

export default function UploadPage() {
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [parsedPlays, setParsedPlays] = useState<Partial<ParsedPlay>[]>([]);
  const [parseError, setParseError] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Manage Games state
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent, game_date, plays(count)')
        .order('game_date', { ascending: false });
      if (error) throw error;
      setGames(
        (data || []).map((g: any) => ({
          id: g.id,
          opponent: g.opponent,
          game_date: g.game_date,
          play_count: g.plays?.[0]?.count ?? 0,
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to load games.');
    } finally {
      setLoadingGames(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    setDeleting(true);
    try {
      // Delete plays first (if no cascade delete configured in Supabase)
      const { error: playsError } = await supabase
        .from('plays')
        .delete()
        .eq('game_id', gameId);
      if (playsError) throw playsError;

      const { error: gameError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);
      if (gameError) throw gameError;

      setGames(prev => prev.filter(g => g.id !== gameId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete game.');
    } finally {
      setDeleting(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSaved(false);
    setParseError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const { headers, rows } = parseCSV(text);
        const colMap = mapHeaders(headers);
        const plays = rows
          .filter(r => r.some(c => c))
          .map(r => rowToPlay(r, colMap));
        if (plays.length === 0) { setParseError('No data rows found in CSV.'); return; }
        setParsedPlays(plays);
      } catch {
        setParseError('Failed to parse CSV. Make sure it is comma-separated with a header row.');
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setParsedPlays([]);
    setFileName('');
    setParseError('');
    setSaved(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scouting_template.csv';
    a.click();
  };

  const handleSave = async () => {
    if (!opponent.trim()) return alert('Enter the opponent name first.');
    if (parsedPlays.length === 0) return alert('Upload a CSV file first.');

    setSaving(true);
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({ opponent: opponent.trim(), game_date: gameDate, status: 'scouted' })
        .select().single();
      if (gameError) throw gameError;

      const playsToInsert = parsedPlays
        .filter(p => p.play_number)
        .map(p => ({
          game_id: game.id,
          play_number: Number(p.play_number) || 0,
          odk: p.odk || null,
          down: p.down ? Number(p.down) || null : null,
          dist: p.dist ? Number(p.dist) || null : null,
          hash: p.hash || null,
          gnls: p.gnls ? Number(p.gnls) || null : null,
          yard_line: p.yard_line ? Number(p.yard_line) || null : null,
          play_type: p.play_type || null,
          result: p.result || null,
          off_formation: p.off_formation || null,
          defense: p.defense || null,
          motion: p.motion || null,
          off_play: p.off_play || null,
          rpo: p.rpo || null,
          play_dir: p.play_dir || null,
          blitz: p.blitz || null,
          coverage: p.coverage || null,
          ball_carrier: p.ball_carrier || null,
          front: p.front || null,
        }));

      const { error: playsError } = await supabase.from('plays').insert(playsToInsert);
      if (playsError) throw playsError;

      setSavedCount(playsToInsert.length);
      setSaved(true);
      setParsedPlays([]);
      setFileName('');
      setOpponent('');
      if (fileRef.current) fileRef.current.value = '';

      // Refresh game list after successful save
      fetchGames();
    } catch (err: any) {
      alert(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const previewCols: (keyof ParsedPlay)[] = ['play_number','odk','down','dist','hash','gnls','yard_line','play_type','result','off_formation','off_play','motion','play_dir','ball_carrier','front','defense','blitz','coverage'];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} /> Home
          </button>
          <div>
            <h1 className="text-3xl font-bold">Upload Scouted Game Data</h1>
            <p className="text-zinc-400 text-sm mt-1">Import play-by-play data from film sessions for opponent analysis</p>
          </div>
        </div>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-300">Successfully imported {savedCount} plays</div>
              <div className="text-sm text-zinc-400">Go to <button onClick={() => navigate('/analyze')} className="text-blue-400 hover:underline">Analyze & Scout</button> to view tendencies.</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Game info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Game Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Opponent Name *</label>
                <input
                  value={opponent} onChange={e => setOpponent(e.target.value)}
                  placeholder="e.g. Central Tigers"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Game Date</label>
                <input
                  type="date" value={gameDate} onChange={e => setGameDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* File upload */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">CSV File</h2>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <Download size={14} /> Download Template
              </button>
            </div>

            {!fileName ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-8 cursor-pointer hover:border-blue-500 transition">
                <Upload size={32} className="text-zinc-500 mb-3" />
                <span className="text-zinc-400 text-sm">Click to upload CSV</span>
                <span className="text-zinc-600 text-xs mt-1">Columns auto-detected from headers</span>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium">{fileName}</div>
                    <div className="text-xs text-zinc-400">{parsedPlays.length} plays parsed</div>
                  </div>
                </div>
                <button onClick={clearFile} className="text-zinc-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {parseError && (
              <div className="mt-3 flex items-start gap-2 text-red-400 text-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {parseError}
              </div>
            )}
          </div>
        </div>

        {/* CSV format guide */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3">Supported Column Names</h2>
          <p className="text-sm text-zinc-400 mb-3">Column headers are matched automatically — use any of these names (case-insensitive):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {[
              ['PLAY #', 'play_number, #'], ['ODK', 'odk'], ['DN', 'down'],
              ['DIST', 'dist, distance'], ['HASH', 'hash'], ['GN/LS', 'gnls, gain/loss'],
              ['YARD LN', 'yard_line, yard line'], ['PLAY TYPE', 'play_type, type'], ['RESULT', 'result'],
              ['OFF FORM', 'off_formation, formation'], ['OFF PLAY', 'off_play'], ['MOTION', 'motion'],
              ['PLAY DIR', 'play_dir, direction'], ['BALL CAR', 'ball carrier, ball_carrier'],
              ['DEF FRON', 'def front, defensive front, front'], ['STUNT', 'stunt, defense'],
              ['BLITZ', 'blitz'], ['COVERAGE', 'coverage'],
            ].map(([label, vals]) => (
              <div key={label} className="bg-zinc-800 rounded-lg px-3 py-2">
                <div className="text-zinc-200 font-medium">{label}</div>
                <div className="text-zinc-500">{vals}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {parsedPlays.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold">Preview <span className="text-zinc-500 text-sm font-normal">(first 10 rows)</span></h2>
              <span className="text-sm text-zinc-400">{parsedPlays.length} total plays</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950">
                  <tr>
                    {previewCols.map(c => (
                      <th key={c} className="text-left px-3 py-2 text-zinc-500 font-medium text-xs whitespace-nowrap">{c.replace(/_/g,' ').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedPlays.slice(0, 10).map((p, i) => (
                    <tr key={i} className={`border-t border-zinc-800 ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                      {previewCols.map(c => (
                        <td key={c} className="px-3 py-2 text-zinc-300 whitespace-nowrap">{(p as any)[c] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manage Games */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">Manage Games</h2>
            <button
              onClick={fetchGames}
              className="text-zinc-500 hover:text-white transition"
              title="Refresh game list"
            >
              <Loader2 size={15} className={loadingGames ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingGames && games.length === 0 && (
            <div className="flex items-center gap-2 px-5 py-4 text-zinc-500 text-sm">
              <Loader2 size={15} className="animate-spin" /> Loading games...
            </div>
          )}

          {!loadingGames && games.length === 0 && (
            <p className="text-zinc-500 text-sm px-5 py-4">No games found.</p>
          )}

          {games.map(game => (
            <div key={game.id}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-sm">{game.opponent}</div>
                  <div className="text-xs text-zinc-500">
                    {game.game_date} · {game.play_count ?? 0} plays
                  </div>
                </div>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">scouted</span>
                <button
                  onClick={() => setConfirmDeleteId(game.id === confirmDeleteId ? null : game.id)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 rounded-lg px-3 py-1.5 transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              {confirmDeleteId === game.id && (
                <div className="mx-5 mb-3 mt-1 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span className="flex-1 text-red-300">
                    Delete <strong>{game.opponent}</strong> and all {game.play_count ?? 0} plays? This can't be undone.
                  </span>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={deleting}
                    className="text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    disabled={deleting}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 font-medium transition"
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/analyze')} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition">
            View Analysis →
          </button>
          <button
            onClick={handleSave}
            disabled={saving || parsedPlays.length === 0 || !opponent.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Upload size={18} /> Import {parsedPlays.length} Plays</>}
          </button>
        </div>
      </div>
    </div>
  );
}