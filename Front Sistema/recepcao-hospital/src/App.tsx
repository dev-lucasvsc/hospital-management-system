import { useState } from 'react';
import { Recepcao }    from './Recepcao';
import { PainelMedico } from './PainelMedico';
import { Historico }   from './Historico';
import { MonitorTV }   from './MonitorTv';
import { Login }       from './Login';
import { PainelAdmin } from './PainelAdmin';

type Tela = 'recepcao' | 'medico' | 'historico' | 'admin' | 'monitor';

const NAV_ITEMS: { id: Tela; label: string; icon: string; cargos: string[] }[] = [
  { id: 'admin',    label: 'Equipe',      icon: '👑', cargos: ['ADMIN'] },
  { id: 'recepcao', label: 'Recepção',    icon: '🏨', cargos: ['ADMIN', 'RECEPCAO'] },
  { id: 'medico',   label: 'Painel Médico', icon: '⚕️', cargos: ['ADMIN', 'MEDICO'] },
  { id: 'historico',label: 'Histórico',   icon: '📋', cargos: ['ADMIN', 'MEDICO', 'RECEPCAO'] },
  { id: 'monitor',  label: 'Monitor TV',  icon: '📺', cargos: ['ADMIN', 'MEDICO', 'RECEPCAO'] },
];

export default function App() {
  const [cargo, setCargo]       = useState<string | null>(null);
  const [nome, setNome]         = useState('');
  const [tela, setTela]         = useState<Tela>('recepcao');

  const handleLogin = (c: string, n: string) => {
    setCargo(c); setNome(n);
    if (c === 'MEDICO') setTela('medico');
    else if (c === 'ADMIN') setTela('admin');
    else setTela('recepcao');
  };

  if (!cargo) return <Login aoLogar={handleLogin} />;
  if (tela === 'monitor') return <MonitorTV aoVoltar={() => setTela(cargo === 'MEDICO' ? 'medico' : cargo === 'ADMIN' ? 'admin' : 'recepcao')} />;

  const itensVisiveis = NAV_ITEMS.filter(i => i.cargos.includes(cargo));

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '0',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, flexShrink: 0,
            boxShadow: '0 0 16px rgba(79,70,229,0.3)',
          }}>🏥</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Hospital</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sistema</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {itensVisiveis.map(item => (
            <button key={item.id} onClick={() => setTela(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: tela === item.id ? 'var(--accent-glow)' : 'transparent',
                border: tela === item.id ? '1px solid rgba(79,70,229,0.25)' : '1px solid transparent',
                color: tela === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                fontSize: 13, fontWeight: tela === item.id ? 500 : 400,
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { if (tela !== item.id) (e.currentTarget.style.background = 'var(--bg-hover)'); }}
              onMouseLeave={e => { if (tela !== item.id) (e.currentTarget.style.background = 'transparent'); }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
              {tela === item.id && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent)',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}/>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, flexShrink: 0,
          }}>
            {cargo === 'ADMIN' ? '👑' : cargo === 'MEDICO' ? '⚕️' : '🏨'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cargo}</div>
          </div>
          <button onClick={() => { setCargo(null); setNome(''); }}
            title="Sair"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 15, padding: 4, borderRadius: 6,
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >⏻</button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <main style={{
        flex: 1, overflow: 'auto',
        padding: '28px 32px',
        background: 'var(--bg-base)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div className="fade-up" key={tela} style={{ width: '100%' }}>
          {tela === 'recepcao'  && <Recepcao />}
          {tela === 'medico'    && <PainelMedico />}
          {tela === 'historico' && <Historico />}
          {tela === 'admin'     && <PainelAdmin />}
        </div>
      </main>
    </div>
  );
}