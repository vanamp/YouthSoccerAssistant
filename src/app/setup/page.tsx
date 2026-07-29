"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

import inputStyles from '@/components/ui/Input.module.css';

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i < 12 ? 'AM' : 'PM';
      const minute = j === 0 ? '00' : j;
      const timeString = `${hour}:${minute} ${ampm}`;
      const value = `${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`;
      options.push({ label: timeString, value });
    }
  }
  return options;
};

export default function SetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = React.useMemo(() => generateTimeOptions(), []);

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
          <div className={inputStyles.container}>
            <label className={inputStyles.label}>Game Time</label>
            <select 
              className={inputStyles.input} 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="" disabled>Select time...</option>
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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
