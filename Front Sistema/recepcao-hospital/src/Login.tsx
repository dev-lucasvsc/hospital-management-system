import { useState } from 'react';
import api from './api'

export function Login({ aoLogar }: { aoLogar: (cargo: string, nome: string) => void }) {
  const [userId, setUserId]   = useState('');
  const [pass, setPass]       = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/funcionarios/login', {
        id: Number(userId), senha: pass,
      });
      localStorage.setItem('token', res.data.token);
      aoLogar(res.data.cargo, res.data.nome);
    } catch {
      setErro('Matrícula ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', backgroundImage:'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(79,70,229,0.12) 0%, transparent 70%)' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'360px', padding:'0 16px' }}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg, #4f46e5, #7c3aed)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16, boxShadow:'0 0 28px rgba(79,70,229,0.4)' }}>🏥</div>
          <h1 style={{ fontSize:20, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Sistema Hospitalar</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Faça login para continuar</p>
        </div>
        <div className="card" style={{ padding:'28px 24px' }}>
          <form onSubmit={entrar} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Matrícula</label>
              <input className="input" type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Ex: 1" required autoFocus />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {erro && <div style={{ padding:'9px 12px', borderRadius:'var(--radius-md)', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:13, color:'var(--red)' }}>{erro}</div>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text-muted)' }}>UNIEURO · Projeto Integrador ADS</p>
      </div>
    </div>
  );
}