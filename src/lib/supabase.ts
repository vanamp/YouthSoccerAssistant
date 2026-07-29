import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Player = {
  id: string;
  name: string;
  skill_offense: number;
  skill_defense: number;
  skill_goalie: number;
  is_active: boolean;
};

export type Game = {
  id: string;
  date: string;
  opponent: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score_us?: number;
  score_them?: number;
};

export type GameAttendance = {
  game_id: string;
  player_id: string;
  is_present: boolean;
  arrived_quarter: number;
};

export type Lineup = {
  id: string;
  game_id: string;
  quarter: number;
  position: 'LF' | 'RF' | 'CF' | 'LD' | 'CD' | 'RD' | 'Goalie' | 'Bench';
  player_id: string;
};
