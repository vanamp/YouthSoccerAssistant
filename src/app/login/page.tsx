"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Sign up successful! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h1>
      
      <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 255, 128, 0.1)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="Email" 
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button 
            variant="primary" 
            size="lg" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary)', 
              fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer' 
            }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </Card>
    </div>
  );
}
