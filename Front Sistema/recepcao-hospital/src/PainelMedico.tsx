import { useEffect, useState } from 'react';
import axios from 'axios';

export function PainelMedico() {
  const [fila, setFila] = useState<any[]>([]);

  const buscarFila = async () => {
    try {
      const res = await axios.get('http://localhost:8080/consultas/fila');
      setFila(res.data);
    } catch (err) {
      console.error("Erro ao buscar fila");
    }
  };

  const chamarPacienteVoz = (nome: string, consultorio: string, senha: string) => {
    const mensagem = new SpeechSynthesisUtterance();
    const senhaSoletrada = senha.split('').join(' ');
    mensagem.text = `Atenção: Senha ${senhaSoletrada}. ${nome}. Comparecer ao consultório ${consultorio}`;
    mensagem.lang = 'pt-BR';
    mensagem.rate = 0.9;
    window.speechSynthesis.speak(mensagem);
  };

  const finalizarAtendimento = async (id: number) => {
    try {
      // Usamos PUT para atualizar o status e registrar a hora de conclusão no Java
      await axios.put(`http://localhost:8080/consultas/${id}/concluir`);
      buscarFila();
    } catch (err) {
      alert("Erro ao finalizar atendimento.");
    }
  };

  useEffect(() => {
    buscarFila();
    const interval = setInterval(buscarFila, 5000);
    return () => clearInterval(interval);
  }, []);

  // Função auxiliar para definir a cor baseada na prioridade
  const getCorPrioridade = (p: string) => {
    if (p === 'U') return '#e74c3c'; // Vermelho Urgente
    if (p === 'P') return '#f39c12'; // Laranja Preferencial
    return '#646cff'; // Roxo Normal
  };

  return (
    <div style={{ maxWidth: '850px', margin: '50px auto', padding: '20px', color: 'white', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '30px', color: '#646cff' }}>👨‍⚕️ Fila de Atendimento por Triagem</h1>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #444', backgroundColor: '#1a1a1a' }}>
        <thead>
          <tr style={{ background: '#333', color: '#646cff' }}>
            <th style={{ padding: '15px' }}>Senha</th>
            <th>Paciente</th>
            <th>Consultório</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {fila.map((c) => (
            <tr key={c.id} style={{ 
              borderBottom: '1px solid #444',
              backgroundColor: c.prioridade === 'U' ? 'rgba(231, 76, 60, 0.05)' : 'transparent' 
            }}>
              <td style={{ 
                fontSize: '26px', 
                fontWeight: 'bold', 
                padding: '20px',
                color: getCorPrioridade(c.prioridade)
              }}>
                {c.senha}
              </td>
              <td style={{ textAlign: 'left', padding: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.paciente?.nome}</span><br/>
                <small style={{ color: '#aaa' }}>CPF: {c.paciente?.cpf}</small><br/>
                <small style={{ color: getCorPrioridade(c.prioridade), fontWeight: 'bold' }}>
                  Chegada: {new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </td>
              <td style={{ fontSize: '20px' }}>{c.consultorio}</td>
              <td style={{ padding: '10px' }}>
                <button 
                  onClick={() => chamarPacienteVoz(c.paciente.nome, c.consultorio, c.senha)}
                  style={{ backgroundColor: '#646cff', color: 'white', border: 'none', padding: '10px 15px', marginRight: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  📢 Chamar
                </button>
                <button 
                  onClick={() => finalizarAtendimento(c.id)}
                  style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✅ Finalizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {fila.length === 0 && (
        <p style={{ marginTop: '40px', color: '#888', fontSize: '18px' }}>
          Não há pacientes aguardando atendimento.
        </p>
      )}
    </div>
  );
}