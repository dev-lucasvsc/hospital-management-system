import { useEffect, useState } from 'react';
import api from '../api';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function PainelMedico() {
  const [fila, setFila]               = useState<any[]>([]);
  const [consultorio, setConsultorio] = useState<string|null>(null);
  const [finalizando, setFinalizando] = useState<any>(null);
  const [obs, setObs]                 = useState('');
  const [cpfBusca, setCpfBusca]       = useState('');
  const [historico, setHistorico]     = useState<any[]|null>(null);

  const buscarFila = async (c: string) => {
    try {
      const url = c==='Todos' ? '/consultas/fila' : `/consultas/fila/${c}`;
      const res = await api.get(url);
      setFila(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!consultorio) return;
    buscarFila(consultorio);
    const socket = new SockJS('http://localhost:8080/ws-hospital');
    const stomp = Stomp.over(socket);
    stomp.debug = () => {};
    stomp.connect({}, () => stomp.subscribe('/topic/fila', () => buscarFila(consultorio)));
    return () => { if (stomp?.connected) stomp.disconnect(() => {}); };
  }, [consultorio]);

  const chamarVoz = (nome: string, sala: string, senha: string) => {
    const u = new SpeechSynthesisUtterance();
    u.text = `Atenção: Senha ${senha.split('').join(' ')}. ${nome}. Comparecer ao consultório ${sala}`;
    u.lang = 'pt-BR'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const concluir = async () => {
    if (!finalizando) return;
    try {
      await api.put(`/consultas/${finalizando.id}/concluir`, obs);
      setFinalizando(null); setObs('');
    } catch { alert('Erro ao finalizar.'); }
  };

  const buscarHistorico = async () => {
    const cpfLimpo = cpfBusca.replace(/\D/g,'');
    if (cpfLimpo.length!==11) return alert('CPF incompleto.');
    try {
      const res = await api.get(`/consultas/historico/${cpfLimpo}`);
      if (res.data.length===0) alert('Nenhum prontuário encontrado.');
      else setHistorico(res.data);
    } catch { alert('Erro ao buscar histórico.'); }
  };

  const maskCPF = (v: string) => v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1');
  //const cor = (p: string) => p==='U' ? 'var(--red)' : p==='P' ? 'var(--amber)' : 'var(--blue)';

  if (!consultorio) return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Painel Médico</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selecione sua sala de atendimento</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {['01','02','03','04','05'].map(n => (
          <button key={n} onClick={() => setConsultorio(n)} style={{ padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, transition: 'all var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-surface)'; }}>
            Sala {n}
          </button>
        ))}
        <button onClick={() => setConsultorio('Todos')} style={{ padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, transition: 'all var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-focus)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; }}>
          Ver todas
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {consultorio==='Todos' ? 'Fila Geral' : `Sala ${consultorio}`}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fila.length} paciente{fila.length!==1?'s':''} aguardando</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setConsultorio(null)} style={{ marginLeft: 'auto' }}>Trocar sala</button>
      </div>

      <div className="card" style={{ padding: '14px 16px', marginBottom: 20, display:'flex', gap: 10, alignItems:'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace:'nowrap' }}>🔎 Prontuário por CPF</span>
        <input className="input" value={cpfBusca} onChange={e => setCpfBusca(maskCPF(e.target.value))} placeholder="000.000.000-00" style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={buscarHistorico}>Buscar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Senha</th><th>Paciente</th><th>Sala</th><th>Prioridade</th><th style={{ textAlign:'right' }}>Ações</th></tr>
          </thead>
          <tbody>
            {fila.length===0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding: '40px', color: 'var(--text-muted)' }}>Nenhum paciente aguardando</td></tr>
            ) : fila.map(c => (
              <tr key={c.id}>
                <td><span className={`senha-tag senha-${c.prioridade}`}>{c.senha}</span></td>
                <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{c.paciente?.nome}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CPF: {c.paciente?.cpf}</div></td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{c.consultorio}</td>
                <td><span className={`badge badge-${c.prioridade}`}>{c.prioridade==='U'?'Urgente':c.prioridade==='P'?'Preferencial':'Normal'}</span></td>
                <td><div style={{ display:'flex', gap: 6, justifyContent:'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => chamarVoz(c.paciente.nome, c.consultorio, c.senha)}>📢 Chamar</button>
                  <button className="btn btn-success btn-sm" onClick={() => setFinalizando(c)}>✓ Finalizar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {finalizando && (
        <Modal onClose={() => setFinalizando(null)} title={`Prontuário — ${finalizando.paciente?.nome}`}>
          <label className="label">Observações médicas</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={6} placeholder="Evolução clínica, diagnóstico, prescrição..."
            style={{ width:'100%', padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:13, resize:'vertical', outline:'none', fontFamily:'var(--font-body)' }} />
          <div style={{ display:'flex', gap: 8, marginTop: 16, justifyContent:'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setFinalizando(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={concluir}>Salvar e concluir</button>
          </div>
        </Modal>
      )}

      {historico && (
        <Modal onClose={() => setHistorico(null)} title={`Histórico — ${historico[0]?.paciente?.nome}`}>
          <div style={{ display:'flex', flexDirection:'column', gap: 10, maxHeight: 360, overflowY:'auto' }}>
            {historico.map((h: any) => (
              <div key={h.id} style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{new Date(h.dataHora).toLocaleString()}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{h.observacoes || 'Sem observações registradas.'}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="fade-up card" style={{ width:'100%', maxWidth:500, padding:'24px', maxHeight:'85vh', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}