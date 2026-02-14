import { useState } from 'react';
import { Recepcao } from './Recepcao';
import { PainelMedico } from './PainelMedico';
import { Historico } from './Historico';
import { MonitorTV } from './MonitorTv';
import { Login } from './Login';

function App() {
  const [perfil, setPerfil] = useState<string | null>(null);
  const [telaAtiva, setTelaAtiva] = useState<string>('home');

  if (!perfil) return <Login aoLogar={(p) => { setPerfil(p); setTelaAtiva(p === 'MEDICO' ? 'medico' : 'recepcao'); }} />;
  if (telaAtiva === 'monitor') return <MonitorTV aoVoltar={() => setTelaAtiva(perfil === 'MEDICO' ? 'medico' : 'recepcao')} />;

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <nav style={{ padding: '15px', background: '#242424', display: 'flex', justifyContent: 'center', gap: '15px', borderBottom: '2px solid #646cff' }}>
        {perfil === 'RECEPCAO' && <button onClick={() => setTelaAtiva('recepcao')} style={getBtnStyle(telaAtiva === 'recepcao')}>🏨 Recepção</button>}
        {perfil === 'MEDICO' && <button onClick={() => setTelaAtiva('medico')} style={getBtnStyle(telaAtiva === 'medico')}>👨‍⚕️ Painel Médico</button>}
        <button onClick={() => setTelaAtiva('historico')} style={getBtnStyle(telaAtiva === 'historico')}>📋 Histórico</button>
        <button onClick={() => setTelaAtiva('monitor')} style={getBtnStyle(false)}>📺 Abrir TV</button>
        <button onClick={() => setPerfil(null)} style={{...getBtnStyle(false), backgroundColor: '#e74c3c'}}>Sair</button>
      </nav>
      <main style={{ padding: '20px' }}>
        {telaAtiva === 'recepcao' && <Recepcao />}
        {telaAtiva === 'medico' && <PainelMedico />}
        {telaAtiva === 'historico' && <Historico />}
      </main>
    </div>
  );
}
const getBtnStyle = (ativo: boolean) => ({
  backgroundColor: ativo ? '#646cff' : '#333', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' as const
});
export default App;