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
      <div style={{ background: '#0056b3', color: 'white', padding: '10px 40px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>🏥 HOSPITAL CENTRAL</h2>
        {aoVoltar && <button onClick={aoVoltar}>VOLTAR</button>}
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <div style={{ fontSize: '40px' }}>SENHA</div>
          <div style={{ fontSize: '110px', fontWeight: '900', color: ultimaSenha?.prioridade === 'U' ? '#e74c3c' : '#0056b3' }}>{ultimaSenha?.senha || "---"}</div>
          <div style={{ fontSize: '45px', fontWeight: 'bold' }}>{ultimaSenha?.paciente?.nome || "AGUARDANDO..."}</div>
          <div style={{ background: '#0056b3', color: 'white', padding: '20px 60px', borderRadius: '15px', marginTop: 30 }}>
            <h3>CONSULTÓRIO {ultimaSenha?.consultorio || "--"}</h3>
          </div>
        </div>
        <div style={{ flex: 1, padding: '20px', background: '#eee' }}>
          <h3>ÚLTIMAS CHAMADAS</h3>
          {fila.slice(1, 6).map((item, i) => (
            <div key={i} style={{ background: '#fff', margin: '10px 0', padding: 15, borderRadius: 8 }}>
              <strong>{item.senha}</strong> - {item.paciente.nome.split(' ')[0]} (C: {item.consultorio})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}