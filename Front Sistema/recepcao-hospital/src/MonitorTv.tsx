import { useEffect, useState } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function MonitorTV({ aoVoltar }: { aoVoltar: () => void }) {
  const [fila, setFila] = useState<any[]>([]);

  const buscarFila = async () => {
    try {
      const res = await axios.get('http://localhost:8080/consultas/fila');
      setFila(res.data);
    } catch (err) {
      console.error("Erro ao buscar fila na TV:", err);
    }
  };

  useEffect(() => {
    buscarFila();

    let stompClient: Stomp.Client | null = null;

    try {
      const socket = new SockJS('http://localhost:8080/ws-hospital');
      stompClient = Stomp.over(socket);
      stompClient.debug = () => {}; 

      stompClient.connect({}, () => {
        stompClient?.subscribe('/topic/fila', () => {
          buscarFila();
        });
      }, (error) => {
        console.error("Erro na conexão WebSocket da TV:", error);
      });
    } catch (error) {
      console.error("Falha ao iniciar WebSocket:", error);
    }

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {});
      }
    };
  }, []);

  const getCorPrioridade = (p: string) => {
    if (p === 'U') return '#e74c3c';
    if (p === 'P') return '#f39c12';
    return '#646cff';
  };

  const chamadaAtual = fila.length > 0 ? fila[0] : null;
  const proximos = fila.slice(1, 6); // Aumentei para 5 próximos

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#0f172a', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'fixed', // ✨ Mudado para FIXED
      top: 0, 
      left: 0, 
      margin: 0,
      zIndex: 99999, // ✨ Garante que fica por cima de tudo
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <div style={{ backgroundColor: '#1e293b', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #646cff' }}>
        <h1 style={{ margin: 0, fontSize: '32px' }}>🏥 Painel de Chamadas</h1>
        <button onClick={aoVoltar} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sair da TV</button>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '30px', gap: '30px', overflow: 'hidden' }}>
        
        {/* LADO ESQUERDO: CHAMADA ATUAL */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            flex: 1, 
            backgroundColor: '#1e293b', 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            border: `10px solid ${chamadaAtual ? getCorPrioridade(chamadaAtual.prioridade) : '#334155'}`, 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)' 
          }}>
            <h2 style={{ fontSize: '50px', color: '#94a3b8', margin: 0 }}>SENHA</h2>
            <h1 style={{ fontSize: '180px', margin: '10px 0', color: chamadaAtual ? getCorPrioridade(chamadaAtual.prioridade) : '#fff', fontWeight: '900', lineHeight: '1' }}>
                {chamadaAtual ? chamadaAtual.senha : '----'}
            </h1>
            
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', width: '100%', padding: '40px 0', textAlign: 'center', marginTop: '20px' }}>
              <h2 style={{ fontSize: '60px', margin: 0, textTransform: 'uppercase' }}>{chamadaAtual ? chamadaAtual.paciente?.nome : 'Aguardando...'}</h2>
              <p style={{ fontSize: '45px', margin: '20px 0 0 0', color: '#fbbf24', fontWeight: 'bold' }}>
                DIRIJA-SE AO CONSULTÓRIO {chamadaAtual ? chamadaAtual.consultorio : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: PRÓXIMOS */}
        <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '30px', color: '#646cff', borderBottom: '2px solid #334155', paddingBottom: '15px', marginBottom: '20px', textAlign: 'center' }}>PRÓXIMOS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {proximos.map((c) => (
              <div key={c.id} style={{ backgroundColor: '#0f172a', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `8px solid ${getCorPrioridade(c.prioridade)}` }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '40px', margin: 0, color: getCorPrioridade(c.prioridade), lineHeight: '1' }}>{c.senha}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#cbd5e1', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{c.paciente?.nome}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <small style={{ color: '#646cff', fontWeight: 'bold' }}>SALA</small>
                    <h4 style={{ margin: 0, fontSize: '30px', color: '#fbbf24' }}>{c.consultorio}</h4>
                </div>
              </div>
            ))}
            {proximos.length === 0 && <p style={{ color: '#444', textAlign: 'center', marginTop: '50px' }}>Fila vazia</p>}
          </div>
        </div>

      </div>
    </div>
  );
}