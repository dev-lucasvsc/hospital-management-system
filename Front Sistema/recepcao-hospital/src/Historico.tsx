import { useEffect, useState } from 'react';
import api from '../api';

export function Historico() {
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    api.get('/consultas/historico').then(res => setHistorico(res.data)).catch(() => {});
  }, []);

  const metricas = () => {
    if (!historico.length) return { media: 0, urgentes: 0, total: 0 };
    let totalEspera = 0, urgentes = 0;
    historico.forEach(c => {
      const espera = (new Date(c.dataHoraConclusao).getTime() - new Date(c.dataHora).getTime()) / 60000;
      totalEspera += espera;
      if (c.prioridade==='U') urgentes++;
    });
    return { media: Math.round(totalEspera/historico.length), urgentes, total: historico.length };
  };

  const m = metricas();
  const CARDS = [
    { label: 'Total de atendimentos', value: m.total,          color: 'var(--accent)' },
    { label: 'Atendimentos urgentes', value: m.urgentes,       color: 'var(--red)' },
    { label: 'Tempo médio (min)',     value: `${m.media} min`, color: 'var(--green)' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Histórico</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Todos os atendimentos concluídos</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {CARDS.map(c => (
          <div key={c.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: c.color, fontFamily:'var(--font-mono)' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="table">
          <thead><tr><th>Senha</th><th>Paciente</th><th>Prioridade</th><th>Início</th><th>Conclusão</th></tr></thead>
          <tbody>
            {historico.length===0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>Nenhum atendimento concluído ainda</td></tr>
            ) : historico.map(c => (
              <tr key={c.id}>
                <td><span className={`senha-tag senha-${c.prioridade}`}>{c.senha}</span></td>
                <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{c.paciente?.nome}</td>
                <td><span className={`badge badge-${c.prioridade}`}>{c.prioridade==='U'?'Urgente':c.prioridade==='P'?'Preferencial':'Normal'}</span></td>
                <td>{new Date(c.dataHora).toLocaleTimeString()}</td>
                <td>{c.dataHoraConclusao ? new Date(c.dataHoraConclusao).toLocaleTimeString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}