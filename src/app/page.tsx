import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      gap: '2rem'
    }} className="animate-fade-in">
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        Dominate the Pitch with <span style={{ color: 'var(--primary)' }}>AI Lineups</span>
      </h1>
      <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '600px' }}>
        Youth Soccer Assistant automatically balances equal play time, defensive stability, and offensive presence so you can focus on coaching.
      </p>
      
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
        <Link href="/roster">
          <Button size="lg" variant="secondary">Manage Roster</Button>
        </Link>
        <Link href="/setup">
          <Button size="lg" variant="primary">Start a New Game</Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '4rem', width: '100%' }}>
        <Card glass style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Equal Play Time</h3>
          <p style={{ opacity: 0.8 }}>Automatically ensures all players get fair minutes based on historical data.</p>
        </Card>
        <Card glass style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Smart Positioning</h3>
          <p style={{ opacity: 0.8 }}>Keeps your defense strong and attack sharp using player skill ratings.</p>
        </Card>
        <Card glass style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Live Adjustments</h3>
          <p style={{ opacity: 0.8 }}>Late arrivals? No problem. Recalculate remaining quarters instantly.</p>
        </Card>
      </div>
    </div>
  );
}
