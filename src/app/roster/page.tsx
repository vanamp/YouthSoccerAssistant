"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Modal } from '@/components/ui';
import { Player, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function RosterPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuth();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player>>({});

  useEffect(() => {
    if (!authLoading) {
      if (role !== 'admin') {
        router.push('/');
      } else {
        fetchPlayers();
      }
    }
  }, [authLoading, role, router]);

  const fetchPlayers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('players').select('*').order('name');
    if (error) {
      console.error('Error fetching players:', error);
    } else if (data) {
      setPlayers(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingPlayer.name) return;
    
    setIsLoading(true);
    if (editingPlayer.id) {
      // Update
      const { error } = await supabase
        .from('players')
        .update({
          name: editingPlayer.name,
          skill_offense: editingPlayer.skill_offense,
          skill_defense: editingPlayer.skill_defense,
          skill_goalie: editingPlayer.skill_goalie,
          is_active: editingPlayer.is_active
        })
        .eq('id', editingPlayer.id);
        
      if (!error) {
        setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, ...editingPlayer } as Player : p));
      }
    } else {
      // Insert
      const newId = crypto.randomUUID();
      const newPlayer = {
        id: newId,
        name: editingPlayer.name,
        skill_offense: editingPlayer.skill_offense || 5,
        skill_defense: editingPlayer.skill_defense || 5,
        skill_goalie: editingPlayer.skill_goalie || 5,
        is_active: true
      };
      
      const { error } = await supabase.from('players').insert([newPlayer]);
      
      if (!error) {
        setPlayers([...players, newPlayer]);
      }
    }
    setIsLoading(false);
    setIsModalOpen(false);
  };

  const openEditModal = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
    } else {
      setEditingPlayer({ skill_offense: 5, skill_defense: 5, skill_goalie: 5, is_active: true });
    }
    setIsModalOpen(true);
  };

  if (authLoading || role !== 'admin') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Team Roster</h1>
        <Button onClick={() => openEditModal()} variant="primary" disabled={isLoading}>Add New Player</Button>
      </div>

      <Card glass>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Offense (1-10)</th>
              <th style={{ padding: '1rem' }}>Defense (1-10)</th>
              <th style={{ padding: '1rem' }}>Goalie (1-10)</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                  No players found. Start adding some!
                </td>
              </tr>
            ) : players.map((player) => (
              <tr key={player.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color var(--transition-fast)' }} className="player-row">
                <td style={{ padding: '1rem', fontWeight: 600 }}>{player.name}</td>
                <td style={{ padding: '1rem' }}>{player.skill_offense}</td>
                <td style={{ padding: '1rem' }}>{player.skill_defense}</td>
                <td style={{ padding: '1rem' }}>{player.skill_goalie}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    backgroundColor: player.is_active ? 'rgba(0, 255, 128, 0.1)' : 'rgba(255, 51, 102, 0.1)',
                    color: player.is_active ? 'var(--primary)' : '#ff3366'
                  }}>
                    {player.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(player)}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlayer.id ? "Edit Player" : "Add Player"}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input 
            label="Player Name" 
            value={editingPlayer.name || ''} 
            onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} 
            placeholder="e.g. Lionel Messi"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Input 
              type="number" min="1" max="10" 
              label="Offense" 
              value={editingPlayer.skill_offense || ''} 
              onChange={(e) => setEditingPlayer({ ...editingPlayer, skill_offense: parseInt(e.target.value) })} 
            />
            <Input 
              type="number" min="1" max="10" 
              label="Defense" 
              value={editingPlayer.skill_defense || ''} 
              onChange={(e) => setEditingPlayer({ ...editingPlayer, skill_defense: parseInt(e.target.value) })} 
            />
            <Input 
              type="number" min="1" max="10" 
              label="Goalie" 
              value={editingPlayer.skill_goalie || ''} 
              onChange={(e) => setEditingPlayer({ ...editingPlayer, skill_goalie: parseInt(e.target.value) })} 
            />
          </div>
          
          {editingPlayer.id && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editingPlayer.is_active || false}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, is_active: e.target.checked })}
                />
                Is Active
              </label>
            </div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={isLoading || !editingPlayer.name}>
              {isLoading ? 'Saving...' : 'Save Player'}
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .player-row:hover {
          background-color: var(--glass-bg);
        }
      `}</style>
    </div>
  );
}
