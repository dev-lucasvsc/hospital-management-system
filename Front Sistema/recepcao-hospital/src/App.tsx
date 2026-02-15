import { useState } from 'react';
import { Recepcao } from './Recepcao';
import { PainelMedico } from './PainelMedico';
import { Historico } from './Historico';
import { MonitorTV } from './MonitorTv';
import { Login } from './Login';
import { PainelAdmin } from './PainelAdmin'; // Importe a tela nova!

function App() {
  const [cargo, setCargo] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState<string>('');
  const [telaAtiva, setTelaAtiva] = useState<string>('home');

  if (!cargo) return <Login aoLogar={(c, n) => { 
    setCargo(c); 
    setNomeUsuario(n);
    if (c === 'MEDICO') setTelaAtiva('medico');
    else if (c === 'ADMIN') setTelaAtiva('admin');
    else setTelaAtiva('recepcao');
  }} />;
  
  if (telaAtiva === 'monitor') return <MonitorTV aoVoltar={() => setTelaAtiva(cargo === 'MEDICO' ? 'medico' : (cargo === 'ADMIN' ? 'admin' : 'recepcao'))} />;

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '15px', background: '#242424', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', borderBottom: '2px solid #646cff', flexWrap: 'wrap' }}>
        
        <span style={{ marginRight: 'auto', marginLeft: '20px', fontWeight: 'bold', color: '#ccc', fontSize: '18px' }}>
          👤 Olá, {nomeUsuario} <small style={{color: '#646cff'}}>({cargo})</small>
        </span>

        {cargo === 'ADMIN' && <button onClick={() => setTelaAtiva('admin')} style={getBtnStyle(telaAtiva === 'admin')}>👑 Gestão de Usuários</button>}
        
        {(cargo === 'RECEPCAO' || cargo === 'ADMIN') && <button onClick={() => setTelaAtiva('recepcao')} style={getBtnStyle(telaAtiva === 'recepcao')}>🏨 Recepção</button>}
        
        {(cargo === 'MEDICO' || cargo === 'ADMIN') && <button onClick={() => setTelaAtiva('medico')} style={getBtnStyle(telaAtiva === 'medico')}>👨‍⚕️ Painel Médico</button>}
        
        <button onClick={() => setTelaAtiva('historico')} style={getBtnStyle(telaAtiva === 'historico')}>📋 Histórico Global</button>
        <button onClick={() => setTelaAtiva('monitor')} style={getBtnStyle(false)}>📺 Abrir TV</button>
        
        <button onClick={() => { setCargo(null); setNomeUsuario(''); }} style={{...getBtnStyle(false), backgroundColor: '#e74c3c'}}>Sair</button>
      </nav>
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {telaAtiva === 'recepcao' && <Recepcao />}
        {telaAtiva === 'medico' && <PainelMedico />}
        {telaAtiva === 'historico' && <Historico />}
        {telaAtiva === 'admin' && <PainelAdmin />}
      </main>
    </div>
  );
}

const getBtnStyle = (ativo: boolean) => ({ backgroundColor: ativo ? '#646cff' : '#333', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' as const });

export default App;