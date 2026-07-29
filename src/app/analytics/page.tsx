"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { Player, Lineup, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

type PlayerStats = {
  player: Player;
  forward: number;
  defense: number;
  goalie: number;
  bench: number;
  total: number;
};

export default function AnalyticsPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && role === 'admin') {
      const fetchAnalytics = async () => {
        setIsLoading(true);
        
        // 1. Fetch all active players
        const { data: playersData } = await supabase.from('players').select('*').eq('is_active', true).order('name');
        const players = playersData || [];

        // 2. Fetch all lineups joined with games to only get completed games
        // In Supabase, we can use inner join syntax: '*, games!inner(status)'
        const { data: lineupsData, error } = await supabase
          .from('lineups')
          .select('*, games!inner(status)')
          .eq('games.status', 'completed');
          
        if (error) {
          console.error("Error fetching lineups:", error);
        }

        const lineups = lineupsData || [];

        // 3. Aggregate data
        const statsMap = new Map<string, PlayerStats>();
        players.forEach(p => {
          statsMap.set(p.id, {
            player: p,
            forward: 0,
            defense: 0,
            goalie: 0,
            bench: 0,
            total: 0
          });
        });

        lineups.forEach(l => {
          const stat = statsMap.get(l.player_id);
          if (stat) {
            stat.total += 1;
            if (['LF', 'CF', 'RF'].includes(l.position)) stat.forward += 1;
            else if (['LD', 'CD', 'RD'].includes(l.position)) stat.defense += 1;
            else if (l.position === 'Goalie') stat.goalie += 1;
            else if (l.position === 'Bench') stat.bench += 1;
          }
        });

        setStats(Array.from(statsMap.values()));
        setIsLoading(false);
      };
      fetchAnalytics();
    }
  }, [authLoading, user, role]);

  if (authLoading || isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user || role !== 'admin') {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        Please log in as an Admin to view player analytics.
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Player Analytics</h1>
      <p style={{ textAlign: 'center', color: 'var(--foreground-muted)', marginBottom: '3rem' }}>
        Track positional rotation and playtime across all completed games.
      </p>

      <Card glass>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}>
              <th style={{ padding: '1rem' }}>Player</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Total Quarters</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Forward Quarters</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Defense Quarters</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Goalie Quarters</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Bench Quarters</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                  No data available yet. Complete a game to see stats!
                </td>
              </tr>
            ) : stats.map((stat) => (
              <tr key={stat.player.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color var(--transition-fast)' }} className="player-row">
                <td style={{ padding: '1rem', fontWeight: 600 }}>{stat.player.name}</td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{stat.total}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{stat.forward}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{stat.defense}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>{stat.goalie}</td>
                <td style={{ padding: '1rem', textAlign: 'center', color: stat.bench > stat.total * 0.4 ? '#ff3366' : 'inherit' }}>
                  {stat.bench}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <style jsx>{`
        .player-row:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
