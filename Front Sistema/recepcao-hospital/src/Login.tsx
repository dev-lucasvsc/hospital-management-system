import { useState } from 'react';
import axios from 'axios';

export function Login({ aoLogar }: { aoLogar: (cargo: string, nome: string) => void }) {
  const [userId, setUserId] = useState('');
  const [pass, setPass] = useState('');

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue ao apertar Enter
    try {
      const res = await axios.post('http://localhost:8080/funcionarios/login', {
        id: Number(userId),
        senha: pass
      });
      
      // Pega o "cargo" e "nome" do banco de dados e envia para o App
      aoLogar(res.data.cargo, res.data.nome);
    } catch (err) {
      alert("❌ ADM ou senha inválidos!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoIcon}>🏥</h1>
          <h2 style={styles.title}>Sistema Hospitalar</h2>
        </div>

        <form onSubmit={entrar} style={styles.form}>
          
          <div style={styles.inputGroup}>
            {/* O texto agora é ADM, mas o input continua type="number" para o seu backend funcionar */}
            <label style={styles.label}>ADM</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={styles.input}
              placeholder="Digite seu ID (ex: 1)"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={styles.input}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            ENTRAR
          </button>
          
        </form>
      </div>
    </div>
  );
}

// Estilos embutidos do tema escuro
const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a', 
    margin: 0,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '40px 50px',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    borderTop: '5px solid #646cff',
  },
  logoArea: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  logoIcon: {
    fontSize: '50px',
    margin: '0 0 10px 0',
  },
  title: {
    color: '#f8fafc',
    fontSize: '24px',
    margin: 0,
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    textAlign: 'left' as const,
  },
  label: {
    fontSize: '14px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    borderRadius: '8px',
    border: '2px solid #334155',
    backgroundColor: '#0f172a',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    padding: '16px',
    backgroundColor: '#646cff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  }
};