import { useState } from 'react';

export function Login({ aoLogar }: { aoLogar: (perfil: string) => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const entrar = () => {
    // Simulação de autenticação (Pode ser integrada ao banco depois)
    if (user === 'medico' && pass === '123') aoLogar('MEDICO');
    else if (user === 'recepcao' && pass === '123') aoLogar('RECEPCAO');
    else alert("Usuário ou senha inválidos!");
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
      <div style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', color: '#333' }}>
        <h2 style={{ color: '#0056b3' }}>🏥 Acesso ao Sistema</h2>
        <input placeholder="Usuário" onChange={e => setUser(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={entrar} style={buttonStyle}>ENTRAR</button>
      </div>
    </div>
  );
}
const inputStyle = { display: 'block', width: '250px', padding: '12px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ddd' };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const };