import { useState } from 'react';
import axios from 'axios';

export function Recepcao() {
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    genero: '',
    generoOutro: '',
    cpf: '',
    numeroSus: '',
    possuiConvenio: false,
    numeroConvenio: '',
    prioridade: 'S' // Padrão Normal
  });
  
  const [consultaGerada, setConsultaGerada] = useState<any>(null);

  // --- MÁSCARAS E VALIDAÇÕES ---
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');

  const validarDataReal = (dataStr: string) => {
    if (dataStr.length < 10) return false;
    const [d, m, a] = dataStr.split('/').map(Number);
    const agora = new Date();
    if (a > agora.getFullYear() || m < 1 || m > 12) return false;
    const ultimoDia = new Date(a, m, 0).getDate();
    return d >= 1 && d <= ultimoDia;
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'cpf') val = maskCPF(value);
    if (name === 'dataNascimento') val = maskData(value);
    if (name === 'numeroSus') val = value.replace(/\D/g, '').slice(0, 15);
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'possuiConvenio' ? value === 'true' : val 
    }));
  };

  const agendar = async () => {
    // Aplicando as Regras de Negócio
    if (!formData.nome || formData.cpf.length < 14) return alert("Por favor, preencha o Nome e o CPF completo.");
    if (formData.numeroSus.length !== 15) return alert("O Nº do Cartão SUS deve ter exatamente 15 dígitos.");
    if (!validarDataReal(formData.dataNascimento)) return alert("Data de Nascimento inválida ou futura.");

    try {
      const payload = {
        paciente: { ...formData },
        prioridade: formData.prioridade
      };
      const res = await axios.post('http://localhost:8080/consultas/agendar', payload);
      setConsultaGerada(res.data);
      alert(`Cadastrado com sucesso! Consultório: ${res.data.consultorio}`);
      
      // Limpar formulário após sucesso
      setFormData({ nome: '', dataNascimento: '', genero: '', generoOutro: '', cpf: '', numeroSus: '', possuiConvenio: false, numeroConvenio: '', prioridade: 'S' });
    } catch (err) { 
      alert("Erro ao salvar. Verifique se o servidor Java está ligado."); 
    }
  };

  return (
    <div style={{ maxWidth: '700px', width: '100%', padding: '40px', backgroundColor: '#fff', color: '#333', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '30px' }}>🏥 Ficha de Cadastro Hospitalar</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
        
        {/* Nome Completo */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Nome Completo:</label>
          <input name="nome" value={formData.nome} onChange={handleChange} style={inputStyle} placeholder="Digite o nome completo" />
        </div>

        {/* Data e CPF */}
        <div>
          <label style={labelStyle}>Data de Nascimento:</label>
          <input name="dataNascimento" value={formData.dataNascimento} placeholder="DD/MM/AAAA" onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>CPF:</label>
          <input name="cpf" value={formData.cpf} placeholder="000.000.000-00" onChange={handleChange} style={inputStyle} />
        </div>

        {/* Gênero */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Gênero:</label>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
            <label><input type="radio" name="genero" value="Masculino" checked={formData.genero === 'Masculino'} onChange={handleChange} /> Masculino</label>
            <label><input type="radio" name="genero" value="Feminino" checked={formData.genero === 'Feminino'} onChange={handleChange} /> Feminino</label>
            <label><input type="radio" name="genero" value="Outro" checked={formData.genero === 'Outro'} onChange={handleChange} /> Outros</label>
          </div>
        </div>

        {/* Nº Cartão SUS */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Nº Cartão SUS (15 dígitos):</label>
          <input name="numeroSus" value={formData.numeroSus} onChange={handleChange} style={inputStyle} placeholder="000000000000000" />
        </div>

        {/* Triagem Colorida e Detalhada */}
        <div style={{ gridColumn: 'span 2', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
          <label style={labelStyle}>Grau de Urgência (Triagem):</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label style={{ color: '#27ae60', fontWeight: 'bold', cursor: 'pointer' }}>
                <input type="radio" name="prioridade" value="S" checked={formData.prioridade === 'S'} onChange={handleChange} /> Normal (S)
            </label>
            <label style={{ color: '#f39c12', fontWeight: 'bold', cursor: 'pointer' }}>
                <input type="radio" name="prioridade" value="P" checked={formData.prioridade === 'P'} onChange={handleChange} /> Preferencial (P)
            </label>
            <label style={{ color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}>
                <input type="radio" name="prioridade" value="U" checked={formData.prioridade === 'U'} onChange={handleChange} /> Urgente (U)
            </label>
          </div>
        </div>

        {/* Convênio */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Possui Convênio Médico?</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
            <label><input type="radio" name="possuiConvenio" value="true" checked={formData.possuiConvenio === true} onChange={handleChange} /> Sim</label>
            <label><input type="radio" name="possuiConvenio" value="false" checked={formData.possuiConvenio === false} onChange={handleChange} /> Não</label>
          </div>
        </div>

        {formData.possuiConvenio && (
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nº do Convênio:</label>
            <input name="numeroConvenio" value={formData.numeroConvenio} onChange={handleChange} style={inputStyle} />
          </div>
        )}
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

const labelStyle = { display: 'block', fontWeight: 'bold' as const, marginBottom: '5px', color: '#555' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as const, fontSize: '16px' };
const buttonStyle = { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '18px' };