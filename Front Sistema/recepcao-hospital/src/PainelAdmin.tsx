import { useEffect, useState } from 'react';
import axios from 'axios';

export function PainelAdmin() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [novo, setNovo] = useState({ nome: '', senha: '', cargo: 'RECEPCAO', registroProfissional: '', cpf: '', dataNascimento: '' });

  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskData = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');

  const handleChange = (e: any) => {
    let { name, value } = e.target;
    if (name === 'cpf') value = maskCPF(value);
    if (name === 'dataNascimento') value = maskData(value);
    setNovo({ ...novo, [name]: value });
  };

  const carregarFuncionarios = async () => {
    const res = await axios.get('http://localhost:8080/funcionarios');
    setFuncionarios(res.data);
  };

  const cadastrar = async () => {
    if (!novo.nome || !novo.senha || novo.cpf.length < 14) return alert("Preencha o nome, senha e o CPF completo!");
    await axios.post('http://localhost:8080/funcionarios/cadastrar', novo);
    alert("✅ Funcionário cadastrado com sucesso!");
    setNovo({ nome: '', senha: '', cargo: 'RECEPCAO', registroProfissional: '', cpf: '', dataNascimento: '' });
    carregarFuncionarios();
  };

  useEffect(() => { carregarFuncionarios(); }, []);

  const getCorCargo = (c: string) => { c === 'ADMIN' ? '#e74c3c' : (c === 'MEDICO' ? '#3498db' : '#2ecc71') };

  return (
    <div style={{ maxWidth: '1000px', width: '100%', margin: '20px auto', color: 'white' }}>
      <h1 style={{ color: '#f39c12', textAlign: 'center', marginBottom: '30px' }}>👑 Gestão de Equipe</h1>
      
      <div style={{ backgroundColor: '#242424', padding: '20px', borderRadius: '10px', marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <input placeholder="Nome Completo" name="nome" value={novo.nome} onChange={handleChange} style={inputStyle} />
        <input placeholder="CPF" name="cpf" value={novo.cpf} onChange={handleChange} style={{...inputStyle, maxWidth: '150px'}} />
        <input placeholder="Nascimento" name="dataNascimento" value={novo.dataNascimento} onChange={handleChange} style={{...inputStyle, maxWidth: '120px'}} />
        <input placeholder="Definir Senha" type="password" name="senha" value={novo.senha} onChange={handleChange} style={{...inputStyle, maxWidth: '150px'}} />
        
        <select name="cargo" value={novo.cargo} onChange={handleChange} style={inputStyle}>
          <option value="RECEPCAO">Recepção</option>
          <option value="MEDICO">Médico</option>
          <option value="ADMIN">Administrador</option>
        </select>
        
        {novo.cargo === 'MEDICO' && <input placeholder="CRM" name="registroProfissional" value={novo.registroProfissional} onChange={handleChange} style={{...inputStyle, maxWidth: '120px'}} />}

        <button onClick={cadastrar} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>➕ Criar Acesso</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1a1a1a', border: '1px solid #444' }}>
        <thead>
          <tr style={{ background: '#333', color: '#f39c12' }}>
            <th style={{ padding: '15px' }}>Matrícula</th>
            <th>Nome</th>
            <th>CPF</th>
            <th>Cargo</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map(f => (
            <tr key={f.id} style={{ borderBottom: '1px solid #444', textAlign: 'center' }}>
              <td style={{ padding: '15px', fontSize: '24px', fontWeight: 'bold' }}>{f.id}</td>
              <td style={{ fontSize: '18px' }}>{f.nome}</td>
              <td>{f.cpf || '-'}</td>
              <td><span style={{ backgroundColor: f.cargo === 'ADMIN' ? '#e74c3c' : (f.cargo === 'MEDICO' ? '#3498db' : '#2ecc71'), padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>{f.cargo}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const inputStyle = { padding: '12px', borderRadius: '5px', border: 'none', flex: 1, minWidth: '130px', fontSize: '15px' };