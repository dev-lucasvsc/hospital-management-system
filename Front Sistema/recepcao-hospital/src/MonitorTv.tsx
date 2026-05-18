import { useEffect, useState } from 'react';
import api from '../api';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function MonitorTV({ aoVoltar }: { aoVoltar: () => void }) {
  const [emAtendimento, setEmAtendimento] = useState<any[]>([]);
  const [aguardando, setAguardando]       = useState<any[]>([]);
  const [ultimaChamada, setUltimaChamada] = useState<any | null>(null);
  const [piscando, setPiscando]           = useState(false);

  const buscarDados = async () => {
    try {
      const [filaRes, atendRes] = await Promise.all([
        api.get('/consultas/fila'),
        api.get('/consultas/em-atendimento-todos'),
      ]);
      setAguardando(filaRes.data);

      const atual: any[] = atendRes.data;
      setEmAtendimento(atual);

      // Detecta nova chamada para piscar
      if (atual.length > 0) {
        const maisRecente = atual.sort((a: any, b: any) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
        )[0];
        setUltimaChamada(maisRecente);
        setPiscando(true);
        setTimeout(() => setPiscando(false), 3000);
      }
    } catch {}
  };

  useEffect(() => {
    buscarDados();
    let stomp: any = null;
    try {
      const socket = new SockJS('http://localhost:8080/ws-hospital');
      stomp = Stomp.over(socket);
      stomp.debug = () => {};
      stomp.connect({}, () =>
        stomp?.subscribe('/topic/fila', () => buscarDados()), () => {}
      );
    } catch {}
    return () => { if (stomp?.connected) stomp.disconnect(() => {}); };
  }, []);

  const cor   = (p: string) => p === 'U' ? '#ef4444' : p === 'P' ? '#f59e0b' : '#3b82f6';
  const corBg = (p: string) => p === 'U' ? 'rgba(239,68,68,0.07)' : p === 'P' ? 'rgba(245,158,11,0.07)' : 'rgba(59,130,246,0.07)';
  const label = (p: string) => p === 'U' ? 'URGENTE' : p === 'P' ? 'PREFERENCIAL' : 'NORMAL';

  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#08080b', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1a1a24', background: '#0b0b0f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏥</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>Painel de Chamadas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#444456' }}>
            <span style={{ color: '#3b82f6' }}>● Normal</span>
            <span style={{ color: '#f59e0b' }}>● Preferencial</span>
            <span style={{ color: '#ef4444' }}>● Urgente</span>
          </div>
          <span style={{ fontSize: 12, color: '#444456', fontFamily: 'JetBrains Mono, monospace' }}>{hora}</span>
          <button onClick={aoVoltar} style={{ padding: '5px 12px', borderRadius: 7, background: 'transparent', border: '1px solid #222230', color: '#666680', cursor: 'pointer', fontSize: 11 }}>
            Sair da TV
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Painel principal — última chamada em destaque */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', background: ultimaChamada ? corBg(ultimaChamada.prioridade) : '#08080b', borderRight: '1px solid #1a1a24', transition: 'background 800ms ease' }}>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#333345', marginBottom: 20 }}>
            Última chamada
          </div>

          {ultimaChamada ? (
            <>
              {/* Badge de prioridade */}
              <div style={{ marginBottom: 16, padding: '3px 14px', borderRadius: 99, background: `${cor(ultimaChamada.prioridade)}18`, border: `1px solid ${cor(ultimaChamada.prioridade)}40`, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: cor(ultimaChamada.prioridade) }}>
                {label(ultimaChamada.prioridade)}
              </div>

              {/* Senha grande */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 'clamp(80px, 13vw, 150px)',
                fontWeight: 700,
                color: cor(ultimaChamada.prioridade),
                lineHeight: 1,
                letterSpacing: '-0.02em',
                marginBottom: 28,
                textShadow: `0 0 80px ${cor(ultimaChamada.prioridade)}50`,
                animation: piscando ? 'pulse 0.6s ease-in-out 3' : 'none',
              }}>
                {ultimaChamada.senha}
              </div>

              {/* Card com nome + consultório */}
              <div style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid #222230', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#e8e8f0', marginBottom: 8 }}>
                  {ultimaChamada.paciente?.nome}
                </div>
                <div style={{ fontSize: 14, color: '#666680' }}>
                  Dirija-se ao&nbsp;
                  <span style={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, background: `${cor(ultimaChamada.prioridade)}18`, padding: '2px 10px', borderRadius: 6 }}>
                    Consultório {ultimaChamada.consultorio}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#222230' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>—</div>
              <div style={{ fontSize: 14 }}>Aguardando chamadas</div>
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: '#0b0b0f' }}>

          {/* Em atendimento */}
          <div style={{ padding: '14px 16px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333345', borderBottom: '1px solid #161620' }}>
            Em atendimento
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5, borderBottom: '1px solid #161620', maxHeight: 220, overflowY: 'auto' }}>
            {emAtendimento.length === 0 ? (
              <div style={{ fontSize: 11, color: '#333345', textAlign: 'center', padding: '16px 0' }}>Nenhum em atendimento</div>
            ) : emAtendimento.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#111116', border: '1px solid #1a1a24', borderLeft: `3px solid ${cor(c.prioridade)}` }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: cor(c.prioridade), minWidth: 54 }}>{c.senha}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#b0b0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.paciente?.nome}</div>
                  <div style={{ fontSize: 10, color: '#444456' }}>Consultório {c.consultorio}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Próximos na fila */}
          <div style={{ padding: '14px 16px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333345', borderBottom: '1px solid #161620' }}>
            Próximos na fila
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {aguardando.length === 0 ? (
              <div style={{ fontSize: 11, color: '#333345', textAlign: 'center', marginTop: 24 }}>Fila vazia</div>
            ) : aguardando.slice(0, 8).map((c: any, i: number) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, background: '#111116', border: '1px solid #1a1a24', borderLeft: `3px solid ${cor(c.prioridade)}`, opacity: 1 - i * 0.08 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: cor(c.prioridade), minWidth: 54 }}>{c.senha}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#b0b0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.paciente?.nome}</div>
                  <div style={{ fontSize: 10, color: '#444456' }}>Aguardando</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #161620', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#333345' }}>Aguardando</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 18, color: '#444456' }}>{aguardando.length}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}