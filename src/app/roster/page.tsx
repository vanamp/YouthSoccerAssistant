"use client";

import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '@/components/ui';
import { Player } from '@/lib/supabase';

// Mock initial data
const initialPlayers: Player[] = [
  { id: '1', name: 'Alex Johnson', skill_offense: 8, skill_defense: 5, skill_goalie: 3, is_active: true },
  { id: '2', name: 'Maria Garcia', skill_offense: 9, skill_defense: 4, skill_goalie: 2, is_active: true },
  { id: '3', name: 'James Smith', skill_offense: 6, skill_defense: 8, skill_goalie: 5, is_active: true },
  { id: '4', name: 'Linda Davis', skill_offense: 4, skill_defense: 9, skill_goalie: 9, is_active: true },
];

export default function RosterPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player>>({});

  const handleSave = () => {
    if (editingPlayer.id) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, ...editingPlayer } as Player : p));
    } else {
      const newPlayer = {
        ...editingPlayer,
        id: crypto.randomUUID(),
        is_active: true
      } as Player;
      setPlayers([...players, newPlayer]);
    }
    setIsModalOpen(false);
  };

  const openEditModal = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
    } else {
      setEditingPlayer({ skill_offense: 5, skill_defense: 5, skill_goalie: 5 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Team Roster</h1>
        <Button onClick={() => openEditModal()} variant="primary">Add New Player</Button>
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
            {players.map((player) => (
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
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Player</Button>
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
