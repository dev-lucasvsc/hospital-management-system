import { useEffect, useState } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function MonitorTV({ aoVoltar }: { aoVoltar: () => void }) {
  const [fila, setFila] = useState<any[]>([]);

  const buscarFila = async () => {
    try { const res = await axios.get('http://localhost:8080/consultas/fila'); setFila(res.data); } catch {}
  };

  useEffect(() => {
    buscarFila();
    let stomp: Stomp.Client | null = null;
    try {
      const socket = new SockJS('http://localhost:8080/ws-hospital');
      stomp = Stomp.over(socket); stomp.debug = () => {};
      stomp.connect({}, () => stomp?.subscribe('/topic/fila', () => buscarFila()), () => {});
    } catch {}
    return () => { if (stomp?.connected) stomp.disconnect(() => {}); };
  }, []);

  const atual   = fila[0] ?? null;
  const proximos = fila.slice(1, 6);

  const cor = (p: string) => p==='U' ? '#ef4444' : p==='P' ? '#f59e0b' : '#3b82f6';
  const corBg = (p: string) => p==='U' ? 'rgba(239,68,68,0.06)' : p==='P' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0c',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        height: 56, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '0 32px',
        borderBottom: '1px solid #1e1e28',
        background: '#0d0d10',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🏥</div>
          <span style={{ fontSize:14, fontWeight:600, color:'#f0f0f3' }}>Painel de Chamadas</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
          <div style={{ display:'flex', gap:16, fontSize:12, color:'#4a4a5a' }}>
            <span style={{ color:'#3b82f6' }}>● Normal</span>
            <span style={{ color:'#f59e0b' }}>● Preferencial</span>
            <span style={{ color:'#ef4444' }}>● Urgente</span>
          </div>
          <button onClick={aoVoltar} style={{
            padding:'6px 14px', borderRadius:8, background:'transparent',
            border:'1px solid #2a2a35', color:'#8b8b9e', cursor:'pointer', fontSize:12,
          }}>Sair da TV</button>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', gap:1, overflow:'hidden' }}>

        {/* Chamada atual */}
        <div style={{
          flex: 2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding: '40px 60px',
          background: atual ? corBg(atual.prioridade) : '#0a0a0c',
          borderRight: '1px solid #1e1e28',
          transition: 'background 600ms ease',
        }}>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'#4a4a5a', marginBottom:24 }}>
            Chamar senha
          </div>

          {atual ? (
            <>
              <div style={{
                fontFamily:'JetBrains Mono, monospace',
                fontSize: 'clamp(80px, 14vw, 160px)',
                fontWeight: 700,
                color: cor(atual.prioridade),
                lineHeight: 1,
                letterSpacing: '-0.02em',
                marginBottom: 28,
                textShadow: `0 0 60px ${cor(atual.prioridade)}40`,
              }}>{atual.senha}</div>

              <div style={{
                padding:'12px 28px',
                background:'rgba(255,255,255,0.04)',
                borderRadius:12, border:'1px solid #2a2a35',
                textAlign:'center', marginBottom:16,
              }}>
                <div style={{ fontSize:20, fontWeight:600, color:'#f0f0f3', marginBottom:4 }}>
                  {atual.paciente?.nome}
                </div>
                <div style={{ fontSize:13, color:'#8b8b9e' }}>
                  Dirija-se ao consultório
                  <span style={{ color:'#f0f0f3', fontFamily:'JetBrains Mono,monospace', fontWeight:600, marginLeft:6 }}>
                    {atual.consultorio}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', color:'#2a2a35' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>—</div>
              <div style={{ fontSize:14 }}>Aguardando próximo paciente</div>
            </div>
          )}
        </div>

        {/* Próximos */}
        <div style={{ width:320, display:'flex', flexDirection:'column', background:'#0d0d10' }}>
          <div style={{ padding:'20px 20px 12px', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#2a2a35', borderBottom:'1px solid #1a1a22' }}>
            Próximos
          </div>
          <div style={{ flex:1, overflow:'auto', padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 }}>
            {proximos.length===0 ? (
              <div style={{ textAlign:'center', color:'#2a2a35', fontSize:12, marginTop:40 }}>Fila vazia</div>
            ) : proximos.map((c, i) => (
              <div key={c.id} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 14px', borderRadius:10,
                background:'#131316', border:'1px solid #1e1e28',
                borderLeft: `3px solid ${cor(c.prioridade)}`,
                opacity: 1 - i * 0.12,
              }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:18, color:cor(c.prioridade), minWidth:60 }}>
                  {c.senha}
                </span>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#c0c0cc', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.paciente?.nome}
                  </div>
                  <div style={{ fontSize:11, color:'#4a4a5a' }}>Sala {c.consultorio}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Contagem */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid #1a1a22', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#2a2a35' }}>Total na fila</span>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:20, color:'#4a4a5a' }}>
              {fila.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}