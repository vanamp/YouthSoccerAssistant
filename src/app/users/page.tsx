"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { isValidPassword } from '../settings/page';

export default function UserManagementPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        router.push('/');
      }
    }
  }, [authLoading, user, role, router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isValidPassword(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMsg(`User ${data.user.email} successfully created!`);
      setEmail('');
      setPassword('');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || role !== 'admin') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>User Management</h1>
      <p style={{ textAlign: 'center', color: 'var(--foreground-muted)', marginBottom: '2rem' }}>
        Create new Game Day Manager accounts. These users will be able to set up games, take attendance, and submit final scores.
      </p>

      <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', color: '#ff3366', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 255, 128, 0.1)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="User Email" 
            type="email"
            placeholder="manager@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Temporary Password" 
            type="text"
            placeholder="Set a password for the user"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <Button 
            variant="primary" 
            size="lg" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Creating Account...' : 'Create User Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
