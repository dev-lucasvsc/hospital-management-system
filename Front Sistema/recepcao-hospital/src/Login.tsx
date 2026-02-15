import { useState } from 'react';
import axios from 'axios';

export function Login({ aoLogar }: { aoLogar: (cargo: string, nome: string) => void }) {
  const [userId, setUserId] = useState('');
  const [pass, setPass] = useState('');

  const entrar = async () => {
    try {
      const res = await axios.post('http://localhost:8080/funcionarios/login', {
        id: Number(userId),
        senha: pass
      });
      // Pega o "cargo" do banco de dados e envia para o App
      aoLogar(res.data.cargo, res.data.nome);
    } catch (err) {
      alert("❌ Matrícula ou senha inválidos!");
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', width: '100%' }}>
      <div style={{ padding: '40px', backgroundColor: '#fff', borderRadius: '12px', textAlign: 'center', color: '#333' }}>
        <h2 style={{ color: '#0056b3' }}>🏥 Acesso ao Sistema</h2>
        <input type="number" placeholder="Sua Matrícula (ex: 1)" onChange={e => setUserId(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} style={inputStyle} />
        <button onClick={entrar} style={buttonStyle}>ENTRAR</button>
      </div>
    </div>
  );
}
const inputStyle = { display: 'block', width: '250px', padding: '12px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' as const };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const };