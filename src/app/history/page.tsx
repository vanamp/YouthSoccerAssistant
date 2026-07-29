"use client";

import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Modal } from '@/components/ui';
import { Game, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin edit state
  const [editGameId, setEditGameId] = useState<string | null>(null);
  const [editScoreUs, setEditScoreUs] = useState<number>(0);
  const [editScoreThem, setEditScoreThem] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    if (!authLoading && user) {
      fetchGames();
    }
  }, [authLoading, user]);

  const handleOpenEditModal = (game: Game) => {
    setEditGameId(game.id);
    setEditScoreUs(game.score_us || 0);
    setEditScoreThem(game.score_them || 0);
  };

  const handleSaveScore = async () => {
    if (!editGameId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('games')
        .update({ score_us: editScoreUs, score_them: editScoreThem })
        .eq('id', editGameId);
      
      if (error) throw error;
      
      setEditGameId(null);
      fetchGames(); // refresh list
    } catch (err: any) {
      alert("Failed to update score: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to re-open this game? It will be moved back to your active Game Dashboard.")) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'in_progress' })
        .eq('id', gameId);
        
      if (error) throw error;
      router.push(`/game/${gameId}`);
    } catch (err: any) {
      alert("Failed to re-open game: " + err.message);
    }
  };

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
                  
                  {/* Admin Controls */}
                  {role === 'admin' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(game)} style={{ fontSize: '0.8rem' }}>
                        Edit Score
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReopenGame(game.id)} style={{ fontSize: '0.8rem', color: '#ffcc00' }}>
                        Re-open Game
                      </Button>
                    </div>
                  )}

                  {/* View Details Link */}
                  <Link href={`/game/${game.id}`} style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '20px', 
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: role === 'admin' ? '0' : '0'
                  }}>
                    View Details
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Score Modal */}
      <Modal isOpen={!!editGameId} onClose={() => setEditGameId(null)} title="Edit Final Score">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p>Update the final score for this game.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              type="number" 
              min="0" 
              label="Our Score" 
              value={editScoreUs.toString()} 
              onChange={(e) => setEditScoreUs(parseInt(e.target.value) || 0)} 
            />
            <Input 
              type="number" 
              min="0" 
              label="Opponent Score" 
              value={editScoreThem.toString()} 
              onChange={(e) => setEditScoreThem(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setEditGameId(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveScore} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Score'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
