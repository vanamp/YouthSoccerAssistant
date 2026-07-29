import { Player, GameAttendance, Lineup } from './supabase';

type Position = 'LF' | 'RF' | 'CF' | 'LD' | 'CD' | 'RD' | 'Goalie' | 'Bench';
const FIELD_POSITIONS: Position[] = ['LF', 'RF', 'CF', 'LD', 'CD', 'RD', 'Goalie'];

// Helper to get permutations of an array
function getPermutations<T>(array: T[]): T[][] {
  if (array.length <= 1) return [array];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i++) {
    const current = array[i];
    const remaining = [...array.slice(0, i), ...array.slice(i + 1)];
    const perms = getPermutations(remaining);
    for (const perm of perms) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

export function generateLineupForQuarter(
  gameId: string,
  players: Player[],
  attendance: GameAttendance[],
  pastLineups: Lineup[],
  quarter: number,
  previousQuartersLineups: Lineup[]
): Lineup[] {
  // 1. Filter available players
  const availablePlayers = players.filter(p => {
    const att = attendance.find(a => a.player_id === p.id);
    return att && att.is_present && att.arrived_quarter <= quarter;
  });

  if (availablePlayers.length < 7) {
    console.warn("Not enough players to field a full team (need 7).");
    // In a real app, we might still assign the ones we have, but for this constraint we expect >= 7.
  }

  // 2. Calculate historical stats
  const allLineups = [...pastLineups, ...previousQuartersLineups];
  const positionCounts: Record<string, Record<string, number>> = {};
  const totalFieldCounts: Record<string, number> = {};

  players.forEach(p => {
    positionCounts[p.id] = {};
    FIELD_POSITIONS.forEach(pos => positionCounts[p.id][pos] = 0);
    totalFieldCounts[p.id] = 0;
  });

  allLineups.forEach(l => {
    if (l.position !== 'Bench') {
      if (positionCounts[l.player_id]) {
        positionCounts[l.player_id][l.position] = (positionCounts[l.player_id][l.position] || 0) + 1;
        totalFieldCounts[l.player_id] = (totalFieldCounts[l.player_id] || 0) + 1;
      }
    }
  });

  // 3. Determine Field vs Bench
  // Sort by total field quarters played (ascending) to prioritize those who played least
  const sortedForField = [...availablePlayers].sort((a, b) => {
    return (totalFieldCounts[a.id] || 0) - (totalFieldCounts[b.id] || 0);
  });

  const fieldPlayers = sortedForField.slice(0, 7);
  const benchPlayers = sortedForField.slice(7);

  // If we have fewer than 7 players, just use them all as field players
  // (We'll pad with nulls for the permutation logic if needed, but assuming 7 for now)
  const playersToPermute = [...fieldPlayers];
  while (playersToPermute.length < 7) {
    // Dummy players if short-handed to make permutation logic work
    playersToPermute.push({ id: 'dummy', name: 'Empty', skill_offense: 0, skill_defense: 0, skill_goalie: 0, is_active: true });
  }

  // 4. Find the best assignment of fieldPlayers to FIELD_POSITIONS
  const permutations = getPermutations(playersToPermute);
  
  let bestPerm: Player[] = [];
  let bestScore = Infinity;

  permutations.forEach(perm => {
    let score = 0;
    
    let offenseCount = 0;
    let defenseSum = 0;

    perm.forEach((player, index) => {
      const pos = FIELD_POSITIONS[index];
      if (player.id !== 'dummy') {
        // Penalty for playing a position they've played before
        score += (positionCounts[player.id][pos] || 0) * 10;
        
        if (['LF', 'RF', 'CF'].includes(pos)) {
          if (player.skill_offense > 6) offenseCount++;
        }
        
        if (['LD', 'CD', 'RD'].includes(pos)) {
          defenseSum += player.skill_defense;
        } else if (pos === 'Goalie') {
          defenseSum += player.skill_goalie;
        }
      }
    });

    // Check constraints and apply penalties if not met
    if (offenseCount < 2) {
      score += 1000; // Big penalty if we don't have enough offensive presence
    }
    
    if (defenseSum < 20) {
      score += 500; // Penalty for weak defense
    }

    if (score < bestScore) {
      bestScore = score;
      bestPerm = perm;
    }
  });

  // 5. Build the Lineup array
  const generatedLineup: Lineup[] = [];
  
  bestPerm.forEach((player, index) => {
    if (player.id !== 'dummy') {
      generatedLineup.push({
        id: crypto.randomUUID(),
        game_id: gameId,
        quarter,
        position: FIELD_POSITIONS[index],
        player_id: player.id
      });
    }
  });

  benchPlayers.forEach(player => {
    generatedLineup.push({
      id: crypto.randomUUID(),
      game_id: gameId,
      quarter,
      position: 'Bench',
      player_id: player.id
    });
  });

  return generatedLineup;
}

// Recalculate remaining quarters when attendance changes (e.g. late arrival)
export function recalculateRemainingQuarters(
  gameId: string,
  players: Player[],
  attendance: GameAttendance[],
  pastLineups: Lineup[], // historical games
  currentQuarter: number, // the quarter we are about to play (or currently playing)
  allCurrentGameLineups: Lineup[] // lineups generated so far for this game
): Lineup[] {
  const newFutureLineups: Lineup[] = [];
  let currentAccumulated = [...allCurrentGameLineups.filter(l => l.quarter < currentQuarter)];

  for (let q = currentQuarter; q <= 4; q++) {
    const qLineup = generateLineupForQuarter(gameId, players, attendance, pastLineups, q, currentAccumulated);
    newFutureLineups.push(...qLineup);
    currentAccumulated = [...currentAccumulated, ...qLineup];
  }

  return newFutureLineups;
}
