"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';

export default function SetupPage() {
  const router = useRouter();
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = () => {
    if (!opponent || !date) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call and redirect
    setTimeout(() => {
      // In a real app, we'd save to Supabase here and get the new game ID
      const newGameId = crypto.randomUUID();
      router.push(`/game/${newGameId}`);
    }, 600);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Start New Game</h1>
      
      <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Input 
          label="Opponent Team" 
          placeholder="e.g. Tigers FC"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
        />
        <Input 
          type="datetime-local" 
          label="Game Date & Time" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        
        <div style={{ marginTop: '1rem' }}>
          <Button 
            variant="primary" 
            size="lg" 
            style={{ width: '100%' }}
            onClick={handleStartGame}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Game...' : 'Create Game & Set Attendance'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
