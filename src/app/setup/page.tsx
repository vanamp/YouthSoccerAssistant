"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleStartGame = () => {
    if (!opponent || !date || !time) {
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
      {authLoading ? (
        <div style={{ textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Start New Game</h1>
          
          <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Input 
          label="Opponent Team" 
          placeholder="e.g. Tigers FC"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input 
            type="date" 
            label="Game Date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input 
            type="time" 
            step={900}
            label="Game Time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        
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
      </>
      )}
    </div>
  );
}
