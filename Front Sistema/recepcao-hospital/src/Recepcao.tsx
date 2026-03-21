import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Tela da recepção: cadastro de pacientes e geração de senhas na fila.
 *
 * Funcionalidades:
 * - Cadastro completo: identificação, endereço, filiação, convênio, triagem
 * - Busca automática de paciente existente pelo CPF
 * - Integração com ViaCEP para preenchimento automático de endereço
 * - Importação de dados pré-cadastrados via WhatsApp
 * - Geração de senha com prioridade (S / P / U)
 *
 * IMPORTANTE: O CPF é enviado ao backend sem máscara (apenas dígitos).
 * A máscara é apenas visual, para facilitar a digitação.
 */
export function Recepcao() {
  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', genero: '', cpf: '', numeroSus: '',
    possuiConvenio: false, numeroConvenio: '', prioridade: 'S',
    cep: '', rua: '', bairro: '', cidade: '', uf: '',
    telefone: '', nomeMae: '', nomePai: '', peso: '', altura: '',
  });

  const [consultaGerada, setConsultaGerada]     = useState<any>(null);
  const [statusConvenio, setStatusConvenio]     = useState<'pendente' | 'validando' | 'aprovado' | 'negado'>('pendente');
  const [preAgendamento, setPreAgendamento]     = useState<any>(null);

  // Máscaras visuais (apenas para exibição — o backend recebe sem máscara)
  const maskCPF = (v: string) =>
    v.replace(/\D/g, '')
     .replace(/(\d{3})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d)/, '$1.$2')
     .replace(/(\d{3})(\d{1,2})/, '$1-$2')
     .replace(/(-\d{2})\d+?$/, '$1');

  const maskData = (v: string) =>
    v.replace(/\D/g, '')
     .replace(/(\d{2})(\d)/, '$1/$2')
     .replace(/(\d{2})(\d)/, '$1/$2')
     .replace(/(\d{4})\d+?$/, '$1');

  const maskCEP = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  const maskTelefone = (v: string) => {
    v = v.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v.slice(0, 15);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'cpf')           val = maskCPF(value);
    if (name === 'dataNascimento') val = maskData(value);
    if (name === 'numeroSus')     val = value.replace(/\D/g, '').slice(0, 15);
    if (name === 'cep')           val = maskCEP(value);
    if (name === 'telefone')      val = maskTelefone(value);
    if (name === 'numeroConvenio') setStatusConvenio('pendente');
    setFormData(prev => ({
      ...prev,
      [name]: name === 'possuiConvenio' ? value === 'true' : val,
    }));
  };

  // Verifica automaticamente se há pré-agendamento WhatsApp quando CPF é preenchido
  useEffect(() => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length === 11) {
      axios
        .get(`http://localhost:8080/consultas/whatsapp/pre-agendamento/${cpfLimpo}`)
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
        nome:           preAgendamento.nome           || prev.nome,
        dataNascimento: preAgendamento.dataNascimento || prev.dataNascimento,
        telefone:       preAgendamento.telefone       || prev.telefone,
      }));
      setPreAgendamento(null);
      alert('✅ Dados do WhatsApp importados com sucesso!');
    }
  };

  const buscarCep = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return alert('Digite um CEP válido com 8 dígitos.');
    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!res.data.erro) {
        setFormData(prev => ({
          ...prev,
          rua:    res.data.logradouro,
          bairro: res.data.bairro,
          cidade: res.data.localidade,
          uf:     res.data.uf,
        }));
      }
    } catch {}
  };

  const buscarPaciente = async () => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return alert('Digite o CPF completo antes de procurar.');
    try {
      const res = await axios.get(`http://localhost:8080/consultas/historico/${cpfLimpo}`);
      if (res.data.length > 0) {
        const paciente = res.data[0].paciente;
        setFormData(prev => ({
          ...prev,
          nome:           paciente.nome           || prev.nome,
          dataNascimento: paciente.dataNascimento || prev.dataNascimento,
          numeroSus:      paciente.numeroSus      || prev.numeroSus,
          genero:         paciente.genero         || prev.genero,
          telefone:       paciente.telefone       || prev.telefone,
          nomeMae:        paciente.nomeMae        || prev.nomeMae,
          nomePai:        paciente.nomePai        || prev.nomePai,
          peso:           paciente.peso           || prev.peso,
          altura:         paciente.altura         || prev.altura,
          cep:            paciente.cep            || prev.cep,
          rua:            paciente.rua            || prev.rua,
          bairro:         paciente.bairro         || prev.bairro,
          cidade:         paciente.cidade         || prev.cidade,
          uf:             paciente.uf             || prev.uf,
        }));
        alert('✅ Paciente encontrado! Dados preenchidos automaticamente.');
      } else {
        alert('Paciente não encontrado. Preencha os dados manualmente.');
      }
    } catch {
      alert('Erro ao buscar paciente.');
    }
  };

  const validarConvenio = () => {
    if (!formData.numeroConvenio) return alert('Digite o número do convênio primeiro.');
    setStatusConvenio('validando');
    // Simulação de validação (integração real com operadora é trabalho futuro)
    setTimeout(() => {
      setStatusConvenio(formData.numeroConvenio.length >= 8 ? 'aprovado' : 'negado');
    }, 1500);
  };

  const agendar = async () => {
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (!formData.nome || cpfLimpo.length !== 11) {
      return alert('Nome e CPF (11 dígitos) são obrigatórios.');
    }

    const payload = {
      prioridade: formData.prioridade,
      paciente: {
        ...formData,
        cpf: cpfLimpo, // envia sem máscara
      },
    };

    try {
      const res = await axios.post('http://localhost:8080/consultas/agendar', payload);
      setConsultaGerada(res.data);

      // Marca o pré-agendamento do WhatsApp como importado, se existia
      if (preAgendamento) {
        await axios.put(`http://localhost:8080/consultas/whatsapp/pre-agendamento/${cpfLimpo}/concluir`);
      }

      // Limpa o formulário para o próximo paciente
      setFormData({
        nome: '', dataNascimento: '', genero: '', cpf: '', numeroSus: '',
        possuiConvenio: false, numeroConvenio: '', prioridade: 'S',
        cep: '', rua: '', bairro: '', cidade: '', uf: '',
        telefone: '', nomeMae: '', nomePai: '', peso: '', altura: '',
      });
    } catch {
      alert('Erro ao cadastrar paciente. Verifique o backend.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', width: '100%', backgroundColor: 'white', color: '#333', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
      <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '25px' }}>🏥 Cadastro de Paciente</h2>

      {/* Banner de pré-agendamento WhatsApp */}
      {preAgendamento && (
        <div style={{ backgroundColor: '#d4edda', border: '1px solid #28a745', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>📱 Pré-agendamento via WhatsApp encontrado!</strong>
            <p style={{ margin: '5px 0 0 0' }}>
              Nome: <strong>{preAgendamento.nome}</strong> — Sintomas: {preAgendamento.sintomas}
            </p>
          </div>
          <button onClick={importarWhatsApp} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Importar Dados
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>

        {/* 1. Identificação */}
        <div style={{ gridColumn: 'span 2', paddingBottom: '15px', borderBottom: '2px solid #eee' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>1. Identificação Principal</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>CPF do Paciente:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input name="cpf" value={formData.cpf} placeholder="000.000.000-00" onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={buscarPaciente} type="button" style={{ padding: '0 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔎 Procurar</button>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Nome Completo:</label>
              <input name="nome" value={formData.nome} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data de Nascimento:</label>
              <input name="dataNascimento" value={formData.dataNascimento} placeholder="DD/MM/AAAA" onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nº Cartão SUS:</label>
              <input name="numeroSus" value={formData.numeroSus} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* 2. Contato e filiação */}
        <div style={{ gridColumn: 'span 2', paddingBottom: '15px', borderBottom: '2px solid #eee' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>2. Contato, Filiação e Dados Físicos</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div><label style={labelStyle}>Telefone:</label><input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" style={inputStyle} /></div>
            <div><label style={labelStyle}>Peso (kg):</label><input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleChange} placeholder="75.5" style={inputStyle} /></div>
            <div><label style={labelStyle}>Altura (m):</label><input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} placeholder="1.75" style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Nome da Mãe:</label><input name="nomeMae" value={formData.nomeMae} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={labelStyle}>Nome do Pai (Opcional):</label><input name="nomePai" value={formData.nomePai} onChange={handleChange} style={inputStyle} /></div>
          </div>
        </div>

        {/* 3. Endereço */}
        <div style={{ gridColumn: 'span 2', backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '10px', border: '1px solid #cce5ff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0056b3' }}>📍 3. Endereço</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>CEP:</label><input name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={buscarCep} type="button" style={{ padding: '12px 20px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Buscar CEP</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>Rua:</label><input name="rua" value={formData.rua} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Bairro:</label><input name="bairro" value={formData.bairro} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cidade:</label><input name="cidade" value={formData.cidade} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>UF:</label><input name="uf" value={formData.uf} onChange={handleChange} style={inputStyle} /></div>
          </div>
        </div>

        {/* 4. Convênio */}
        <div style={{ gridColumn: 'span 2', padding: '15px', border: '1px dashed #bbb', borderRadius: '10px' }}>
          <label style={labelStyle}>4. Possui Convênio Médico?</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '5px', marginBottom: '15px' }}>
            <label><input type="radio" name="possuiConvenio" value="true"  checked={formData.possuiConvenio === true}  onChange={handleChange} /> Sim</label>
            <label><input type="radio" name="possuiConvenio" value="false" checked={formData.possuiConvenio === false} onChange={handleChange} /> Não (Particular/SUS)</label>
          </div>
          {formData.possuiConvenio && (
            <div style={{ backgroundColor: '#fffbe6', padding: '15px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
              <label style={labelStyle}>Nº da Carteirinha:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input name="numeroConvenio" value={formData.numeroConvenio} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={validarConvenio} type="button" disabled={statusConvenio === 'validando'} style={{ padding: '0 20px', backgroundColor: '#faad14', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {statusConvenio === 'validando' ? '⏳ Verificando...' : '🛡️ Validar'}
                </button>
              </div>
              {statusConvenio === 'aprovado' && <p style={{ color: '#52c41a', fontWeight: 'bold', margin: '10px 0 0 0' }}>✅ Elegibilidade Aprovada.</p>}
              {statusConvenio === 'negado'   && <p style={{ color: '#f5222d', fontWeight: 'bold', margin: '10px 0 0 0' }}>❌ Elegibilidade Negada.</p>}
            </div>
          )}
        </div>

        {/* 5. Triagem */}
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
          <h2 style={{ margin: 0 }}>SENHA GERADA:</h2>
          <h1 style={{ fontSize: '60px', color: '#0056b3', margin: '10px 0' }}>{consultaGerada.senha}</h1>
          <p>Consultório Destino: <strong>{consultaGerada.consultorio}</strong></p>
        </div>
      )}
    </div>
  );
}

const labelStyle  = { display: 'block', fontWeight: 'bold' as const, marginBottom: '5px', color: '#555', fontSize: '14px' };
const inputStyle  = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' as const, fontSize: '15px' };
const buttonStyle = { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '18px' };