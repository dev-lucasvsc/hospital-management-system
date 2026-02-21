import { useState, useEffect } from 'react';
import axios from 'axios';

export function Recepcao() {
  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', genero: '', generoOutro: '', cpf: '', numeroSus: '', 
    possuiConvenio: false, numeroConvenio: '', prioridade: 'S',
    cep: '', rua: '', bairro: '', cidade: '', uf: '',
    telefone: '', nomeMae: '', nomePai: '', peso: '', altura: ''
  });
  
  const [consultaGerada, setConsultaGerada] = useState<any>(null);
  const [statusConvenio, setStatusConvenio] = useState<'pendente' | 'validando' | 'aprovado' | 'negado'>('pendente');
  const [preAgendamento, setPreAgendamento] = useState<any>(null);

  // MÁSCARAS
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');
  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  const maskTelefone = (v: string) => {
    v = v.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v.slice(0, 15);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'cpf') val = maskCPF(value);
    if (name === 'dataNascimento') val = maskData(value);
    if (name === 'numeroSus') val = value.replace(/\D/g, '').slice(0, 15);
    if (name === 'cep') val = maskCEP(value);
    if (name === 'telefone') val = maskTelefone(value);
    
    if (name === 'numeroConvenio') setStatusConvenio('pendente');
    setFormData(prev => ({ ...prev, [name]: name === 'possuiConvenio' ? value === 'true' : val }));
  };

  useEffect(() => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length === 11) {
      axios.get(`http://localhost:8080/consultas/whatsapp/pre-agendamento/${cpfLimpo}`)
        .then(res => setPreAgendamento(res.data))
        .catch(() => setPreAgendamento(null));
    } else {
      setPreAgendamento(null);
    }
  }, [formData.cpf]);

  const importarWhatsApp = () => {
    if (preAgendamento) {
      setFormData(prev => ({
        ...prev,
        nome: preAgendamento.nome || prev.nome,
        dataNascimento: preAgendamento.dataNascimento || prev.dataNascimento,
        telefone: preAgendamento.telefone || prev.telefone
      }));
      setPreAgendamento(null);
    }
  };

  const buscarCep = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return alert("Digite um CEP válido com 8 dígitos.");
    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!res.data.erro) {
        setFormData(prev => ({ ...prev, rua: res.data.logradouro, bairro: res.data.bairro, cidade: res.data.localidade, uf: res.data.uf }));
      }
    } catch (err) {}
  };

  // 🔎 BUSCA PACIENTE CADASTRADO (Botão Procurar corrigido para buscar sem pontos)
  const buscarPaciente = async () => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return alert("Digite o CPF completo antes de procurar.");
    
    try {
      const res = await axios.get(`http://localhost:8080/consultas/pacientes/${cpfLimpo}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          nome: res.data.nome || '', dataNascimento: res.data.dataNascimento || '',
          genero: res.data.genero || '', numeroSus: res.data.numeroSus || '',
          possuiConvenio: res.data.possuiConvenio || false, numeroConvenio: res.data.numeroConvenio || '',
          cep: res.data.cep || '', rua: res.data.rua || '', bairro: res.data.bairro || '',
          cidade: res.data.cidade || '', uf: res.data.uf || '',
          telefone: res.data.telefone || '', nomeMae: res.data.nomeMae || '', 
          nomePai: res.data.nomePai || '', peso: res.data.peso || '', altura: res.data.altura || ''
        }));
        if (res.data.possuiConvenio) setStatusConvenio('aprovado');
        alert("✅ Paciente encontrado!");
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) alert("ℹ️ Paciente novo. Preencha os dados.");
    }
  };

  const validarConvenio = () => {
    if (!formData.numeroConvenio) return;
    setStatusConvenio('validando');
    setTimeout(() => {
      if (formData.numeroConvenio.endsWith('000')) setStatusConvenio('negado');
      else setStatusConvenio('aprovado');
    }, 1500);
  };

  const agendar = async () => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (!formData.nome || cpfLimpo.length !== 11) return alert("Preencha Nome e CPF.");
    if (formData.possuiConvenio && statusConvenio !== 'aprovado') return alert("Valide a Carteirinha do Convênio!");
    
    try {
      // Envia o paciente para o Java com o CPF limpo para padronizar o banco de dados
      const pacientePayload = { ...formData, cpf: cpfLimpo };
      
      const res = await axios.post('http://localhost:8080/consultas/agendar', { paciente: pacientePayload, prioridade: formData.prioridade });
      setConsultaGerada(res.data);
      alert(`Cadastrado com sucesso! Consultório: ${res.data.consultorio}`);
      setFormData({ nome: '', dataNascimento: '', genero: '', generoOutro: '', cpf: '', numeroSus: '', possuiConvenio: false, numeroConvenio: '', prioridade: 'S', cep: '', rua: '', bairro: '', cidade: '', uf: '', telefone: '', nomeMae: '', nomePai: '', peso: '', altura: '' });
      setStatusConvenio('pendente');
    } catch (err) { alert("Erro ao salvar."); }
  };

  return (
    <div style={{ maxWidth: '850px', width: '100%', padding: '40px', backgroundColor: '#fff', color: '#333', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '30px' }}>🏥 Ficha de Cadastro Hospitalar</h2>
      
      {/* ✨ BANNER DO WHATSAPP */}
      {preAgendamento && (
        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#155724', fontWeight: 'bold' }}>💬 Encontramos um pré-agendamento via WhatsApp!</span>
          <button onClick={importarWhatsApp} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Importar Dados</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
        
        {/* BLOCO 1: IDENTIFICAÇÃO BÁSICA */}
        <div style={{ gridColumn: 'span 2', paddingBottom: '15px', borderBottom: '2px solid #eee' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>1. Identificação Principal</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>CPF do Paciente:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input name="cpf" value={formData.cpf} placeholder="000.000.000-00" onChange={handleChange} style={{...inputStyle, flex: 1}} />
                <button onClick={buscarPaciente} type="button" style={{ padding: '0 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔎 Procurar</button>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nome Completo:</label><input name="nome" value={formData.nome} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Data de Nascimento:</label><input name="dataNascimento" value={formData.dataNascimento} placeholder="DD/MM/AAAA" onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nº Cartão SUS:</label><input name="numeroSus" value={formData.numeroSus} onChange={handleChange} style={inputStyle} /></div>
          </div>
        </div>

        {/* BLOCO 2: DADOS COMPLEMENTARES */}
        <div style={{ gridColumn: 'span 2', paddingBottom: '15px', borderBottom: '2px solid #eee' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>2. Contato, Filiação e Dados Físicos</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div><label style={labelStyle}>Telefone / Celular:</label><input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" style={inputStyle} /></div>
            <div><label style={labelStyle}>Peso Atual (kg):</label><input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleChange} placeholder="Ex: 75.5" style={inputStyle} /></div>
            <div><label style={labelStyle}>Altura (m):</label><input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} placeholder="Ex: 1.75" style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Nome da Mãe:</label><input name="nomeMae" value={formData.nomeMae} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Nome do Pai (Opcional):</label><input name="nomePai" value={formData.nomePai} onChange={handleChange} style={inputStyle} /></div>
          </div>
        </div>

        {/* BLOCO 3: ENDEREÇO */}
        <div style={{ gridColumn: 'span 2', backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '10px', border: '1px solid #cce5ff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0056b3' }}>📍 3. Endereço</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>CEP:</label><input name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}><button onClick={buscarCep} type="button" style={{ padding: '12px 20px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Buscar CEP</button></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>Rua/Logradouro:</label><input name="rua" value={formData.rua} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Bairro:</label><input name="bairro" value={formData.bairro} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cidade:</label><input name="cidade" value={formData.cidade} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Estado (UF):</label><input name="uf" value={formData.uf} onChange={handleChange} style={inputStyle} /></div>
          </div>
        </div>

        {/* BLOCO 4: CONVÊNIO */}
        <div style={{ gridColumn: 'span 2', padding: '15px', border: '1px dashed #bbb', borderRadius: '10px' }}>
          <label style={labelStyle}>4. Possui Convênio Médico?</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '5px', marginBottom: '15px' }}>
            <label><input type="radio" name="possuiConvenio" value="true" checked={formData.possuiConvenio === true} onChange={handleChange} /> Sim</label>
            <label><input type="radio" name="possuiConvenio" value="false" checked={formData.possuiConvenio === false} onChange={handleChange} /> Não, é Particular/SUS</label>
          </div>
          {formData.possuiConvenio && (
            <div style={{ backgroundColor: '#fffbe6', padding: '15px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
              <label style={labelStyle}>Nº da Carteirinha do Convênio:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input name="numeroConvenio" value={formData.numeroConvenio} onChange={handleChange} style={{...inputStyle, flex: 1}} />
                <button onClick={validarConvenio} type="button" disabled={statusConvenio === 'validando'} style={{ padding: '0 20px', backgroundColor: '#faad14', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {statusConvenio === 'validando' ? '⏳ Verificando...' : '🛡️ Validar Elegibilidade'}
                </button>
              </div>
              {statusConvenio === 'aprovado' && <p style={{ color: '#52c41a', fontWeight: 'bold', margin: '10px 0 0 0' }}>✅ Elegibilidade Aprovada.</p>}
              {statusConvenio === 'negado' && <p style={{ color: '#f5222d', fontWeight: 'bold', margin: '10px 0 0 0' }}>❌ Elegibilidade Negada.</p>}
            </div>
          )}
        </div>

        {/* BLOCO 5: TRIAGEM */}
        <div style={{ gridColumn: 'span 2', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
          <label style={labelStyle}>5. Grau de Urgência (Triagem):</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label style={{ color: '#27ae60', fontWeight: 'bold' }}><input type="radio" name="prioridade" value="S" checked={formData.prioridade === 'S'} onChange={handleChange} /> Normal (S)</label>
            <label style={{ color: '#f39c12', fontWeight: 'bold' }}><input type="radio" name="prioridade" value="P" checked={formData.prioridade === 'P'} onChange={handleChange} /> Preferencial (P)</label>
            <label style={{ color: '#e74c3c', fontWeight: 'bold' }}><input type="radio" name="prioridade" value="U" checked={formData.prioridade === 'U'} onChange={handleChange} /> Urgente (U)</label>
          </div>
        </div>

      </div>

      <button onClick={agendar} style={buttonStyle}>CADASTRAR E GERAR SENHA</button>

      {consultaGerada && (
        <div style={{ marginTop: '30px', padding: '20px', border: '3px dashed #0056b3', borderRadius: '10px', backgroundColor: '#f0f7ff', textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>SENHA:</h2>
          <h1 style={{ fontSize: '60px', color: '#0056b3', margin: '10px 0' }}>{consultaGerada.senha}</h1>
          <p>Consultório Destino: <strong>{consultaGerada.consultorio}</strong></p>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontWeight: 'bold' as const, marginBottom: '5px', color: '#555', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' as const, fontSize: '15px' };
const buttonStyle = { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '18px' };