"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Toggle } from '@/components/ui';
import { Player, GameAttendance, Lineup, supabase } from '@/lib/supabase';
import { generateLineupForQuarter, recalculateRemainingQuarters } from '@/lib/lineupGenerator';
import { useAuth } from '@/components/AuthProvider';

export default function LiveGameDashboard({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const gameId = params.id;
  
  const [activeTab, setActiveTab] = useState<number>(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<GameAttendance[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedForSwap, setSelectedForSwap] = useState<Lineup | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        // Fetch players
        const { data: playersData } = await supabase.from('players').select('*').eq('is_active', true);
        const activePlayers = playersData || [];
        setPlayers(activePlayers);
        
        // Initial attendance
        const initialAtt = activePlayers.map(p => ({ 
          game_id: gameId, 
          player_id: p.id, 
          is_present: true, 
          arrived_quarter: 1 
        }));
        setAttendance(initialAtt);

        // Generate initial lineups
        const initialLineups = recalculateRemainingQuarters(gameId, activePlayers, initialAtt, [], 1, []);
        setLineups(initialLineups);
        setIsLoading(false);
      };
      
      fetchInitialData();
    }
  }, [authLoading, user, gameId]);

  const handleAttendanceChange = (playerId: string, isPresent: boolean) => {
    const newAtt = attendance.map(a => 
      a.player_id === playerId ? { ...a, is_present: isPresent, arrived_quarter: isPresent ? activeTab : a.arrived_quarter } : a
    );
    setAttendance(newAtt);
    
    // Recalculate remaining quarters
    const futureLineups = recalculateRemainingQuarters(gameId, players, newAtt, [], activeTab, lineups);
    
    // Merge
    setLineups([...lineups.filter(l => l.quarter < activeTab), ...futureLineups]);
  };

  const handleArrivedNow = (playerId: string) => {
    handleAttendanceChange(playerId, true);
  };

  const currentQuarterLineup = lineups.filter(l => l.quarter === activeTab);
  
  const handleSwapClick = (lineupItem: Lineup) => {
    if (!selectedForSwap) {
      setSelectedForSwap(lineupItem);
    } else {
      if (selectedForSwap.id === lineupItem.id) {
        setSelectedForSwap(null);
        return;
      }
      
      const newLineups = [...lineups];
      const item1 = newLineups.find(l => l.id === selectedForSwap.id);
      const item2 = newLineups.find(l => l.id === lineupItem.id);
      
      if (item1 && item2) {
        const tempPos = item1.position;
        item1.position = item2.position;
        item2.position = tempPos;
      }
      
      setLineups(newLineups);
      setSelectedForSwap(null);
    }
  };

  const renderPitchPosition = (position: string, top: string, left: string) => {
    const lineupItem = currentQuarterLineup.find(l => l.position === position);
    const player = lineupItem ? players.find(p => p.id === lineupItem.player_id) : null;
    const isSelected = selectedForSwap?.id === lineupItem?.id;

    return (
      <div 
        key={position}
        onClick={() => lineupItem && handleSwapClick(lineupItem)}
        style={{
          position: 'absolute',
          top, left,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: lineupItem ? 'pointer' : 'default',
          transition: 'transform var(--transition-fast)',
          zIndex: 10
        }}
      >
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
          border: `2px solid ${isSelected ? '#ffffff' : 'var(--primary)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '0.8rem',
          boxShadow: isSelected ? '0 0 15px var(--accent)' : '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          {position}
        </div>
        <div style={{
          marginTop: '0.5rem',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          whiteSpace: 'nowrap'
        }}>
          {player ? player.name.split(' ')[0] : 'Empty'}
        </div>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Game Dashboard...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
      
      {/* Sidebar: Roster & Attendance */}
      <Card glass style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Attendance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {players.length === 0 ? (
            <div style={{ color: 'var(--foreground-muted)' }}>No active players found in the roster.</div>
          ) : (
            players.map(player => {
              const att = attendance.find(a => a.player_id === player.id);
              const isPresent = att?.is_present || false;
              return (
                <div key={player.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{player.name}</span>
                    <Toggle checked={isPresent} onChange={(val) => handleAttendanceChange(player.id, val)} />
                  </div>
                  {!isPresent && (
                    <Button size="sm" variant="secondary" onClick={() => handleArrivedNow(player.id)}>
                      Arrived Now
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Main Pitch View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map(q => (
            <Button 
              key={q}
              variant={activeTab === q ? 'primary' : 'ghost'} 
              onClick={() => { setActiveTab(q); setSelectedForSwap(null); }}
              style={{ flex: 1, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
            >
              Quarter {q}
            </Button>
          ))}
        </div>
        
        <Card glass style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          {selectedForSwap && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(0, 255, 128, 0.1)', border: '1px solid var(--primary)', borderRadius: '4px', textAlign: 'center' }}>
              Select another player to swap with <strong>{players.find(p => p.id === selectedForSwap.player_id)?.name}</strong>
            </div>
          )}

          {/* Soccer Pitch Visual */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '500px', 
            backgroundColor: '#1a472a', // deep pitch green
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px)'
          }}>
            {/* Pitch Lines */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.3)', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '80px', border: '2px solid rgba(255,255,255,0.3)', borderBottom: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '80px', border: '2px solid rgba(255,255,255,0.3)', borderTop: 'none' }} />
            
            {/* Players */}
            {renderPitchPosition('LF', '20%', '25%')}
            {renderPitchPosition('CF', '15%', '50%')}
            {renderPitchPosition('RF', '20%', '75%')}
            
            {renderPitchPosition('LD', '60%', '25%')}
            {renderPitchPosition('CD', '65%', '50%')}
            {renderPitchPosition('RD', '60%', '75%')}
            
            {renderPitchPosition('Goalie', '90%', '50%')}
          </div>
          
          {/* Bench */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Bench</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {currentQuarterLineup.filter(l => l.position === 'Bench').map(l => {
                const player = players.find(p => p.id === l.player_id);
                const isSelected = selectedForSwap?.id === l.id;
                return (
                  <div 
                    key={l.id} 
                    onClick={() => handleSwapClick(l)}
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      backgroundColor: isSelected ? 'var(--accent)' : 'var(--background)',
                      border: `1px solid ${isSelected ? '#ffffff' : 'var(--border)'}`,
                      borderRadius: '30px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: isSelected ? '#000' : 'var(--foreground)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      boxShadow: isSelected ? '0 0 10px var(--accent)' : 'none'
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                    {player?.name}
                  </div>
                );
              })}
              {currentQuarterLineup.filter(l => l.position === 'Bench').length === 0 && (
                <div style={{ opacity: 0.5 }}>No players on the bench this quarter.</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
