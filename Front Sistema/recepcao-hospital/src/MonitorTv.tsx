import { useEffect, useState } from 'react';
import axios from 'axios';

export function MonitorTV({ aoVoltar }: { aoVoltar?: () => void }) {
  const [fila, setFila] = useState<any[]>([]);
  const [ultimaSenha, setUltimaSenha] = useState<any>(null);

  const buscarDados = async () => {
    try {
      const res = await axios.get('http://localhost:8080/consultas/fila');
      if (res.data.length > 0) {
        setFila(res.data);
        const topo = res.data[0];
        if (!ultimaSenha || ultimaSenha.senha !== topo.senha) {
          setUltimaSenha(topo);
          const msg = new SpeechSynthesisUtterance(`Senha ${topo.senha}. Consultório ${topo.consultorio}`);
          window.speechSynthesis.speak(msg);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const int = setInterval(buscarDados, 4000);
    return () => clearInterval(int);
  }, [ultimaSenha]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topo com cor de destaque */}
      <div style={{ background: '#0056b3', color: 'white', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🏥 HOSPITAL CENTRAL</h2>
        {aoVoltar && <button onClick={aoVoltar} style={{ cursor: 'pointer' }}>VOLTAR</button>}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* LADO ESQUERDO: SENHA ATUAL (Texto Escuro) */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRight: '4px solid #ddd' }}>
          <div style={{ fontSize: '40px', color: '#0056b3', fontWeight: 'bold' }}>SENHA</div>
          
          <div style={{ 
            fontSize: '110px', 
            fontWeight: '900', 
            color: ultimaSenha?.prioridade === 'U' ? '#e74c3c' : '#333', // Vermelho se for urgente, senão Cinza Escuro
            margin: '10px 0'
          }}>
            {ultimaSenha?.senha || "---"}
          </div>

          <div style={{ fontSize: '45px', fontWeight: 'bold', color: '#555' }}>
            {ultimaSenha?.paciente?.nome || "AGUARDANDO..."}
          </div>

          <div style={{ background: '#0056b3', color: 'white', padding: '20px 60px', borderRadius: '15px', marginTop: 30, textAlign: 'center' }}>
            <div style={{ fontSize: '20px', opacity: 0.9 }}>CONSULTÓRIO</div>
            <div style={{ fontSize: '60px', fontWeight: 'bold' }}>{ultimaSenha?.consultorio || "--"}</div>
          </div>
        </div>

        {/* LADO DIREITO: LISTA (Texto Escuro) */}
        <div style={{ flex: 1, padding: '20px', background: '#f8f9fa' }}>
          <h3 style={{ color: '#0056b3', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>ÚLTIMAS CHAMADAS</h3>
          {fila.slice(1, 6).map((item, i) => (
            <div key={i} style={{ 
              background: '#fff', 
              margin: '10px 0', 
              padding: 15, 
              borderRadius: 8, 
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#333' // Garante que o texto da lista seja visível
            }}>
              <div>
                <strong style={{ fontSize: '20px', color: '#0056b3' }}>{item.senha}</strong>
                <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666' }}>{item.paciente.nome.split(' ')[0]}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ color: '#999' }}>CONS.</small>
                <div style={{ fontWeight: 'bold', fontSize: '20px' }}>{item.consultorio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}