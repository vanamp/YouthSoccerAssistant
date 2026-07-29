"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

// Helper for password complexity
export const isValidPassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecial;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMsg("Password successfully updated!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Account Settings</h1>
      
      <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Change Password</h2>
        
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

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="New Password" 
            type="password"
            placeholder="New strong password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input 
            label="Confirm New Password" 
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
          </div>
          
          <Button 
            variant="primary" 
            size="lg" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
