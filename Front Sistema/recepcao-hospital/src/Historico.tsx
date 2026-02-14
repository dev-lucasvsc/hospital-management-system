import { useEffect, useState } from 'react';
import axios from 'axios';

export function Historico() {
  const [historico, setHistorico] = useState<any[]>([]);

  const buscarHistorico = async () => {
    try {
      const res = await axios.get('http://localhost:8080/consultas/historico');
      setHistorico(res.data); // Corrigido aqui: era setFila e agora é setHistorico
    } catch (err) {
      console.error("Erro ao buscar histórico");
    }
  };

  const calcularMetricas = () => {
    if (historico.length === 0) return { media: 0, urgentes: 0, total: 0 };
    let totalEspera = 0;
    let urgentes = 0;
    historico.forEach(c => {
      const espera = (new Date(c.dataHoraConclusao).getTime() - new Date(c.dataHora).getTime()) / 60000;
      totalEspera += espera;
      if (c.prioridade === 'U') urgentes++;
    });
    return { media: Math.round(totalEspera / historico.length), urgentes, total: historico.length };
  };

  const metricas = calcularMetricas();
  useEffect(() => { buscarHistorico(); }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', color: 'white' }}>
      <h1 style={{ textAlign: 'center', color: '#27ae60' }}>📊 Dashboard de Gestão</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}><small>Média Espera</small><h2>{metricas.media} min</h2></div>
        <div style={{ ...cardStyle, borderLeft: '8px solid #e74c3c' }}><small>Urgentes</small><h2>{metricas.urgentes}</h2></div>
        <div style={{ ...cardStyle, borderLeft: '8px solid #646cff' }}><small>Total</small><h2>{metricas.total}</h2></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1a1a1a' }}>
        <thead>
          <tr style={{ background: '#333', color: '#27ae60' }}>
            <th style={{ padding: '15px' }}>Senha</th>
            <th>Paciente</th>
            <th>Atendimento</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '15px' }}>{c.senha}</td>
              <td>{c.paciente?.nome}</td>
              <td>{new Date(c.dataHora).toLocaleTimeString()} às {new Date(c.dataHoraConclusao).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const cardStyle = { flex: 1, backgroundColor: '#242424', padding: '20px', borderRadius: '10px', borderLeft: '8px solid #27ae60', textAlign: 'center' as const };