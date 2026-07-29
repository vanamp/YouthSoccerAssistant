"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Modal } from '@/components/ui';
import { Player, supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function RosterPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuth();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Single Player Edit/Add State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player>>({});

  // Bulk Add State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkPlayers, setBulkPlayers] = useState<Partial<Player>[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- Bulk Add Logic ---

  const openBulkModal = () => {
    setBulkPlayers([{ skill_offense: 5, skill_defense: 5, skill_goalie: 5, is_active: true }]);
    setIsBulkModalOpen(true);
  };

  const addBulkRow = () => {
    setBulkPlayers([...bulkPlayers, { skill_offense: 5, skill_defense: 5, skill_goalie: 5, is_active: true }]);
  };

  const removeBulkRow = (index: number) => {
    const newBulk = [...bulkPlayers];
    newBulk.splice(index, 1);
    setBulkPlayers(newBulk);
  };

  const updateBulkRow = (index: number, field: keyof Player, value: any) => {
    const newBulk = [...bulkPlayers];
    newBulk[index] = { ...newBulk[index], [field]: value };
    setBulkPlayers(newBulk);
  };

  const handleBulkSave = async () => {
    // Filter out rows with no name
    const validPlayers = bulkPlayers.filter(p => p.name && p.name.trim() !== '');
    if (validPlayers.length === 0) {
      setIsBulkModalOpen(false);
      return;
    }

    setIsBulkSaving(true);

    const playersToInsert = validPlayers.map(p => ({
      id: crypto.randomUUID(),
      name: p.name?.trim() || 'Unknown',
      skill_offense: p.skill_offense || 5,
      skill_defense: p.skill_defense || 5,
      skill_goalie: p.skill_goalie || 5,
      is_active: true
    }));

    const { error } = await supabase.from('players').insert(playersToInsert);
    
    if (!error) {
      setPlayers([...players, ...playersToInsert]);
      setIsBulkModalOpen(false);
    } else {
      alert("Error saving bulk players: " + error.message);
    }
    
    setIsBulkSaving(false);
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Name,Offense,Defense,Goalie\nExample Player,8,5,2\nAnother Player,5,8,9";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "roster_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const rows = text.split('\n');
        const newPlayers: Partial<Player>[] = [];
        
        // Skip header row if it exists by checking first line
        let startIndex = 0;
        if (rows[0].toLowerCase().includes('name')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < rows.length; i++) {
          const rowText = rows[i].trim();
          if (!rowText) continue;
          
          // Basic CSV split by comma (ignores quoted commas for simplicity)
          const cols = rowText.split(',');
          if (cols.length >= 1 && cols[0].trim() !== '') {
            newPlayers.push({
              name: cols[0].trim(),
              skill_offense: parseInt(cols[1]) || 5,
              skill_defense: parseInt(cols[2]) || 5,
              skill_goalie: parseInt(cols[3]) || 5,
              is_active: true
            });
          }
        }
        
        if (newPlayers.length > 0) {
          // If we only have 1 empty row, replace it. Otherwise append.
          if (bulkPlayers.length === 1 && !bulkPlayers[0].name) {
            setBulkPlayers(newPlayers);
          } else {
            setBulkPlayers([...bulkPlayers, ...newPlayers]);
          }
        }
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Render ---

  if (authLoading || role !== 'admin') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Team Roster</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={openBulkModal} variant="ghost" disabled={isLoading}>Bulk Add</Button>
          <Button onClick={() => openEditModal()} variant="primary" disabled={isLoading}>Add New Player</Button>
        </div>
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

      {/* SINGLE PLAYER MODAL */}
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

      {/* BULK ADD MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Add Players"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minWidth: '60vw', maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Upload from CSV</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>Format: Name, Offense, Defense, Goalie</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button size="sm" variant="ghost" onClick={downloadCSVTemplate}>
                Download Template
              </Button>
              <div>
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-upload" 
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Manual Entry / Preview</h3>
            <Button size="sm" variant="ghost" onClick={addBulkRow}>+ Add Row</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {bulkPlayers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--foreground-muted)' }}>
                No players added. Add a row or upload a CSV.
              </div>
            )}
            
            {bulkPlayers.map((p, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px' }}>
                <Input 
                  label="" placeholder="Name" 
                  value={p.name || ''} 
                  onChange={(e) => updateBulkRow(index, 'name', e.target.value)} 
                />
                <Input 
                  label="" type="number" min="1" max="10" placeholder="Offense"
                  value={p.skill_offense || ''} 
                  onChange={(e) => updateBulkRow(index, 'skill_offense', parseInt(e.target.value))} 
                />
                <Input 
                  label="" type="number" min="1" max="10" placeholder="Defense"
                  value={p.skill_defense || ''} 
                  onChange={(e) => updateBulkRow(index, 'skill_defense', parseInt(e.target.value))} 
                />
                <Input 
                  label="" type="number" min="1" max="10" placeholder="Goalie"
                  value={p.skill_goalie || ''} 
                  onChange={(e) => updateBulkRow(index, 'skill_goalie', parseInt(e.target.value))} 
                />
                <button 
                  onClick={() => removeBulkRow(index)}
                  style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                  title="Remove Row"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkSave} disabled={isBulkSaving || bulkPlayers.length === 0}>
              {isBulkSaving ? 'Saving...' : `Save ${bulkPlayers.filter(p => p.name).length} Players`}
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
