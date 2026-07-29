"use client";

import React from 'react';
import Link from "next/link";
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, role } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav style={{
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
        <span style={{ color: 'var(--primary)' }}>YSA</span> Lineups
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500, alignItems: 'center' }}>
        {role === 'admin' && (
          <Link href="/roster" style={{ transition: 'color var(--transition-fast)' }}>Roster</Link>
        )}
        <Link href="/setup" style={{ transition: 'color var(--transition-fast)' }}>Game Setup</Link>
        
        {user ? (
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border)', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            Log Out
          </button>
        ) : (
          <Link 
            href="/login" 
            style={{ 
              background: 'var(--primary)', 
              color: '#000', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}
