import type { SupabaseClient } from '@supabase/supabase-js';

export const liveEntryFields = [
  { key: 'playNumber', label: 'PLAY #', width: 'w-24', inputMode: 'numeric' as const },
  { key: 'odk', label: 'ODK', width: 'w-20' },
  { key: 'dn', label: 'DN', width: 'w-20', inputMode: 'numeric' as const },
  { key: 'dist', label: 'DIST', width: 'w-24', inputMode: 'numeric' as const },
  { key: 'hash', label: 'HASH', width: 'w-24' },
  { key: 'gnLs', label: 'GN/LS', width: 'w-24' },
  { key: 'yardLn', label: 'YARD LN', width: 'w-28', inputMode: 'numeric' as const },
  { key: 'playType', label: 'PLAY TYPE', width: 'w-44' },
  { key: 'result', label: 'RESULT', width: 'w-36' },
  { key: 'offForm', label: 'OFF FORM', width: 'w-32' },
  { key: 'defense', label: 'DEFENSE', width: 'w-32' },
  { key: 'motion', label: 'MOTION', width: 'w-32' },
  { key: 'offPlay', label: 'OFF PLAY', width: 'w-32' },
  { key: 'rpo', label: 'RPO', width: 'w-20' },
  { key: 'playDir', label: 'PLAY DIR', width: 'w-28' },
  { key: 'stunt', label: 'STUNT', width: 'w-28' },
  { key: 'blitz', label: 'BLITZ', width: 'w-28' },
  { key: 'coverage', label: 'COVERAGE', width: 'w-32' },
] as const;

export type LiveEntryFieldKey = (typeof liveEntryFields)[number]['key'];

export type LiveEntryRow = { id: number } & Record<LiveEntryFieldKey, string>;

export type GameOption = {
  id: string;
  label: string;
  opponent: string;
  date: string;
};

export const defaultGameOptions: GameOption[] = [
  { id: '2026-06-10-varsity-home', label: 'Varsity Home Game', opponent: 'Eagles', date: '2026-06-10' },
  { id: '2026-06-17-varsity-away', label: 'Varsity Away Game', opponent: 'Wildcats', date: '2026-06-17' },
  { id: '2026-06-24-jv-home', label: 'JV Home Game', opponent: 'Lobos', date: '2026-06-24' },
];

export const createEmptyLiveEntryRow = (playNumber = ''): LiveEntryRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  playNumber,
  odk: 'O',
  dn: '',
  dist: '',
  hash: '',
  gnLs: '',
  yardLn: '',
  playType: '',
  result: '',
  offForm: '',
  defense: '',
  motion: '',
  offPlay: '',
  rpo: '',
  playDir: '',
  stunt: '',
  blitz: '',
  coverage: '',
});

export const initialLiveEntryRows: LiveEntryRow[] = [
  {
    id: 1,
    playNumber: '1',
    odk: 'O',
    dn: '1',
    dist: '10',
    hash: 'M',
    gnLs: '+5',
    yardLn: '50',
    playType: 'OUTSIDE ZONE',
    result: '5 YDS',
    offForm: '11P',
    defense: '4-3',
    motion: 'NONE',
    offPlay: 'ZONE',
    rpo: 'N',
    playDir: 'RIGHT',
    stunt: 'NONE',
    blitz: 'NONE',
    coverage: 'C3',
  },
  {
    id: 2,
    playNumber: '2',
    odk: 'D',
    dn: '2',
    dist: '6',
    hash: 'H',
    gnLs: '-2',
    yardLn: '44',
    playType: 'COVER 3',
    result: 'STOP',
    offForm: 'N/A',
    defense: 'BASE',
    motion: 'NONE',
    offPlay: 'PASS',
    rpo: 'N',
    playDir: 'LEFT',
    stunt: 'NONE',
    blitz: 'EDGE',
    coverage: 'C3',
  },
  {
    id: 3,
    playNumber: '3',
    odk: 'K',
    dn: '',
    dist: '',
    hash: 'M',
    gnLs: '',
    yardLn: '35',
    playType: 'KICKOFF',
    result: 'TB',
    offForm: '',
    defense: '',
    motion: '',
    offPlay: '',
    rpo: '',
    playDir: '',
    stunt: '',
    blitz: '',
    coverage: '',
  },
];

export const normalizeGameRow = (row: Record<string, unknown>): GameOption => ({
  id: String(row.id ?? row.game_id ?? row.gameId ?? `${Date.now()}`),
  label: String(row.label ?? row.name ?? row.game_name ?? row.title ?? 'Game'),
  opponent: String(row.opponent ?? row.opponent_name ?? row.opponentTeam ?? ''),
  date: String(row.date ?? row.game_date ?? row.gameDate ?? ''),
});

export const normalizePlayRow = (row: Record<string, unknown>): LiveEntryRow => ({
  id: Number(row.id ?? row.play_id ?? Date.now()),
  playNumber: String(row.play_number ?? row.playNumber ?? ''),
  odk: String(row.odk ?? 'O'),
  dn: String(row.dn ?? row.down ?? ''),
  dist: String(row.dist ?? row.distance ?? ''),
  hash: String(row.hash ?? ''),
  gnLs: String(row.gn_ls ?? row.gnLs ?? ''),
  yardLn: String(row.yard_ln ?? row.yardLn ?? ''),
  playType: String(row.play_type ?? row.playType ?? ''),
  result: String(row.result ?? ''),
  offForm: String(row.off_form ?? row.offForm ?? ''),
  defense: String(row.defense ?? ''),
  motion: String(row.motion ?? ''),
  offPlay: String(row.off_play ?? row.offPlay ?? ''),
  rpo: String(row.rpo ?? ''),
  playDir: String(row.play_dir ?? row.playDir ?? ''),
  stunt: String(row.stunt ?? ''),
  blitz: String(row.blitz ?? ''),
  coverage: String(row.coverage ?? ''),
});

export const playRowToInsert = (row: LiveEntryRow, gameId: string) => ({
  game_id: gameId,
  play_number: row.playNumber,
  odk: row.odk,
  dn: row.dn,
  dist: row.dist,
  hash: row.hash,
  gn_ls: row.gnLs,
  yard_ln: row.yardLn,
  play_type: row.playType,
  result: row.result,
  off_form: row.offForm,
  defense: row.defense,
  motion: row.motion,
  off_play: row.offPlay,
  rpo: row.rpo,
  play_dir: row.playDir,
  stunt: row.stunt,
  blitz: row.blitz,
  coverage: row.coverage,
});

export const rowsToCsv = (rows: LiveEntryRow[]) => {
  const header = liveEntryFields.map((field) => field.label).join(',');
  const lines = rows.map((row) =>
    liveEntryFields
      .map((field) => `"${String(row[field.key]).replace(/"/g, '""')}"`)
      .join(',')
  );

  return [header, ...lines].join('\n');
};

export const fetchGames = async (supabase: SupabaseClient): Promise<GameOption[]> => {
  const { data, error } = await supabase.from('games').select('*');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeGameRow(row as Record<string, unknown>));
};

export const createGame = async (
  supabase: SupabaseClient,
  game: Omit<GameOption, 'id'>
): Promise<GameOption> => {
  const payload = {
    name: game.label,
    opponent: game.opponent,
    game_date: game.date,
  };

  const { data, error } = await supabase.from('games').insert(payload).select('*').single();

  if (error) {
    throw error;
  }

  return normalizeGameRow((data ?? payload) as Record<string, unknown>);
};

export const fetchPlaysForGame = async (
  supabase: SupabaseClient,
  gameId: string
): Promise<LiveEntryRow[]> => {
  const { data, error } = await supabase.from('plays').select('*').eq('game_id', gameId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => normalizePlayRow(row as Record<string, unknown>))
    .sort((left, right) => Number(left.playNumber || left.id) - Number(right.playNumber || right.id));
};

export const replacePlaysForGame = async (
  supabase: SupabaseClient,
  gameId: string,
  rows: LiveEntryRow[]
) => {
  const payload = rows.map((row) => playRowToInsert(row, gameId));

  const { error: deleteError } = await supabase.from('plays').delete().eq('game_id', gameId);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await supabase.from('plays').insert(payload);

  if (insertError) {
    throw insertError;
  }
};

export const summarizePlays = (rows: LiveEntryRow[]) => {
  const offense = rows.filter((row) => row.odk === 'O').length;
  const defense = rows.filter((row) => row.odk === 'D').length;
  const kick = rows.filter((row) => row.odk === 'K').length;

  return {
    offense,
    defense,
    kick,
    total: rows.length,
  };
};