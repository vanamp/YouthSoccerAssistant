"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { Game, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchGames = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'completed')
          .order('date', { ascending: false });

        if (error) {
          console.error("Error fetching games:", error.message);
        } else if (data) {
          setGames(data);
        }
        setIsLoading(false);
      };
      fetchGames();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        Please log in to view game history.
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Game History</h1>
      
      {games.length === 0 ? (
        <Card glass style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--foreground-muted)' }}>No completed games found.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {games.map(game => {
            const isWin = game.score_us !== undefined && game.score_them !== undefined && game.score_us > game.score_them;
            const isLoss = game.score_us !== undefined && game.score_them !== undefined && game.score_us < game.score_them;
            const isTie = game.score_us !== undefined && game.score_them !== undefined && game.score_us === game.score_them;
            
            let resultColor = 'var(--foreground)';
            let resultText = 'Played';
            
            if (isWin) {
              resultColor = 'var(--primary)';
              resultText = 'W';
            } else if (isLoss) {
              resultColor = '#ff3366';
              resultText = 'L';
            } else if (isTie) {
              resultColor = '#ffcc00';
              resultText = 'T';
            }

            return (
              <Card glass key={game.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>
                    {new Date(game.date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    vs {game.opponent}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: resultColor }}>
                      {resultText} {game.score_us} - {game.score_them}
                    </div>
                  </div>
                  
                  {/* Future enhancement: Link to read-only game view */}
                  <Link href={`/game/${game.id}`} style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '20px', 
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    color: 'var(--foreground)',
                    textDecoration: 'none'
                  }}>
                    View Details
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
