import { useEffect, useState } from 'react';
import axios from 'axios';
// ✨ NOVAS IMPORTAÇÕES PARA O TEMPO REAL
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function PainelMedico() {
  const [fila, setFila] = useState<any[]>([]);
  const [meuConsultorio, setMeuConsultorio] = useState<string | null>(null);
  const [consultaFinalizando, setConsultaFinalizando] = useState<any>(null);
  const [observacoes, setObservacoes] = useState('');
  const [cpfBusca, setCpfBusca] = useState('');
  const [historicoPaciente, setHistoricoPaciente] = useState<any[] | null>(null);

  // Função para buscar a fila via API (usada na carga inicial e quando o rádio avisa)
  const buscarFila = async (consultorioSelecionado: string) => {
    try {
      const url = consultorioSelecionado === 'Todos' 
        ? 'http://localhost:8080/consultas/fila' 
        : `http://localhost:8080/consultas/fila/${consultorioSelecionado}`;
      const res = await axios.get(url);
      setFila(res.data);
    } catch (err) {
      console.error("Erro ao buscar fila");
    }
  };

  useEffect(() => {
    if (!meuConsultorio) return;
    
    // 1. Faz a busca inicial assim que o médico escolhe a sala
    buscarFila(meuConsultorio);

    // 2. ✨ CONEXÃO WEBSOCKET (Ouvindo o rádio)
    // Conecta no endereço que definimos no Java (WebSocketConfig)
    const socket = new SockJS('http://localhost:8080/ws-hospital');
    const stompClient = Stomp.over(socket);
    
    // Desativa mensagens chatas de log no console do navegador
    stompClient.debug = () => {}; 

    stompClient.connect({}, () => {
      // Se inscreve no canal "/topic/fila"
      stompClient.subscribe('/topic/fila', () => {
        // Quando o Java enviar qualquer mensagem nesse canal, o médico atualiza a fila!
        buscarFila(meuConsultorio);
      });
    });

    // Limpeza ao fechar a tela: desliga o rádio para não gastar memória
    return () => {
      if (stompClient) {
        stompClient.disconnect(() => {
          console.log("WebSocket desconectado");
        });
      }
    };
  }, [meuConsultorio]);

  const chamarPacienteVoz = (nome: string, consultorio: string, senha: string) => {
    const mensagem = new SpeechSynthesisUtterance();
    const senhaSoletrada = senha.split('').join(' ');
    mensagem.text = `Atenção: Senha ${senhaSoletrada}. ${nome}. Comparecer ao consultório ${consultorio}`;
    mensagem.lang = 'pt-BR';
    mensagem.rate = 0.9;
    window.speechSynthesis.speak(mensagem);
  };

  const confirmarFinalizacao = async () => {
    if (!consultaFinalizando) return;
    try {
      await axios.put(`http://localhost:8080/consultas/${consultaFinalizando.id}/concluir`, { 
        observacoes: observacoes 
      });
      setConsultaFinalizando(null);
      setObservacoes('');
      // Não precisamos chamar buscarFila() aqui manualmente, 
      // pois o Java vai avisar via WebSocket que a fila mudou!
    } catch (err) {
      alert("Erro ao finalizar atendimento.");
    }
  };

  const handleCpfChange = (e: any) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})/, '$1-$2');
    v = v.replace(/(-\d{2})\d+?$/, '$1');
    setCpfBusca(v);
  };

  const buscarHistorico = async () => {
    if (cpfBusca.length < 14) return alert("Digite o CPF completo.");
    try {
      const res = await axios.get(`http://localhost:8080/consultas/historico/${cpfBusca}`);
      if (res.data.length === 0) alert("Nenhum prontuário encontrado.");
      else setHistoricoPaciente(res.data);
    } catch (err) {
      alert("Erro ao buscar histórico.");
    }
  };

  const getCorPrioridade = (p: string) => {
    if (p === 'U') return '#e74c3c'; 
    if (p === 'P') return '#f39c12'; 
    return '#646cff'; 
  };

  if (!meuConsultorio) {
    return (
      <div style={{ maxWidth: '600px', width: '100%', margin: '60px auto', padding: '40px', backgroundColor: '#242424', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: '#646cff', marginBottom: '30px' }}>👨‍⚕️ Bem-vindo, Doutor(a)!</h2>
        <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '20px' }}>Selecione sua sala de atendimento:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
          {['01', '02', '03', '04', '05'].map(num => (
            <button key={num} onClick={() => setMeuConsultorio(num)} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sala {num}</button>
          ))}
          <button onClick={() => setMeuConsultorio('Todos')} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Ver Todos</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', width: '100%', padding: '20px', color: 'white', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#646cff', margin: 0 }}>👨‍⚕️ Fila: {meuConsultorio === 'Todos' ? 'Geral' : `Sala ${meuConsultorio}`}</h1>
        <button onClick={() => setMeuConsultorio(null)} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Trocar Sala</button>
      </div>

      {/* Busca de Prontuário */}
      <div style={{ backgroundColor: '#242424', padding: '15px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', border: '1px solid #444' }}>
        <span style={{ fontWeight: 'bold' }}>🔎 Prontuário por CPF:</span>
        <input value={cpfBusca} onChange={handleCpfChange} placeholder="000.000.000-00" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#333', color: 'white', width: '180px' }} />
        <button onClick={buscarHistorico} style={{ padding: '10px 20px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Buscar</button>
      </div>
      
      {/* Tabela de Fila */}
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
            <tr key={c.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ fontSize: '26px', fontWeight: 'bold', padding: '20px', color: getCorPrioridade(c.prioridade) }}>{c.senha}</td>
              <td style={{ textAlign: 'left', padding: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.paciente?.nome}</span><br/>
                <small style={{ color: '#aaa' }}>CPF: {c.paciente?.cpf}</small>
              </td>
              <td style={{ fontSize: '20px' }}>{c.consultorio}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => chamarPacienteVoz(c.paciente.nome, c.consultorio, c.senha)} style={{ backgroundColor: '#646cff', color: 'white', border: 'none', padding: '10px 15px', marginRight: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📢 Chamar</button>
                <button onClick={() => setConsultaFinalizando(c)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Finalizar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {fila.length === 0 && <p style={{ marginTop: '40px', color: '#888', fontSize: '18px' }}>Nenhum paciente aguardando.</p>}

      {/* MODAL: PRONTUÁRIO */}
      {consultaFinalizando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', color: '#333', width: '500px', textAlign: 'left' }}>
            <h2>📝 Prontuário: {consultaFinalizando.paciente?.nome}</h2>
            <textarea rows={6} style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Evolução médica..." />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px' }}>
              <button onClick={() => setConsultaFinalizando(null)} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarFinalizacao} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Salvar e Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO */}
      {historicoPaciente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', color: '#333', width: '650px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
               <h3>🗂️ Histórico: {historicoPaciente[0]?.paciente?.nome}</h3>
               <button onClick={() => setHistoricoPaciente(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
            </div>
            {historicoPaciente.map((hist: any) => (
              <div key={hist.id} style={{ margin: '15px 0', padding: '10px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'left' }}>
                <p><strong>Data:</strong> {new Date(hist.dataHora).toLocaleString()}</p>
                <p><strong>Observação:</strong> {hist.observacoes || 'Sem registro.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}