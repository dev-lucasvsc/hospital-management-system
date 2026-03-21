import { useEffect, useState } from 'react';
import axios from 'axios';

const CARGO_STYLE: Record<string, { color: string; bg: string }> = {
  ADMIN:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  MEDICO:   { color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
  RECEPCAO: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)' },
};

export function PainelAdmin() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [novo, setNovo] = useState({ nome:'', senha:'', cargo:'RECEPCAO', registroProfissional:'', cpf:'', dataNascimento:'' });
  const [loading, setLoading] = useState(false);

  const maskCPF  = (v: string) => v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1');
  const maskData = (v: string) => v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{4})\d+?$/,'$1');

  const handleChange = (e: any) => {
    let { name, value } = e.target;
    if (name==='cpf') value=maskCPF(value);
    if (name==='dataNascimento') value=maskData(value);
    setNovo({ ...novo, [name]: value });
  };

  const carregar = async () => { const res = await axios.get('http://localhost:8080/funcionarios'); setFuncionarios(res.data); };
  useEffect(() => { carregar(); }, []);

  const cadastrar = async () => {
    if (!novo.nome || !novo.senha || novo.cpf.length<14) return alert('Preencha nome, senha e CPF completo.');
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/funcionarios/cadastrar', { ...novo, cpf: novo.cpf.replace(/\D/g,'') });
      setNovo({ nome:'', senha:'', cargo:'RECEPCAO', registroProfissional:'', cpf:'', dataNascimento:'' });
      carregar();
    } catch { alert('Erro ao cadastrar.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Gestão de Equipe</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{funcionarios.length} funcionários cadastrados</p>
      </div>

      {/* Formulário novo funcionário */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
          Novo acesso
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 14px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Nome completo</label>
            <input className="input" name="nome" value={novo.nome} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Cargo</label>
            <select className="input" name="cargo" value={novo.cargo} onChange={handleChange}>
              <option value="RECEPCAO">Recepção</option>
              <option value="MEDICO">Médico</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label className="label">CPF</label>
            <input className="input" name="cpf" value={novo.cpf} onChange={handleChange} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="label">Nascimento</label>
            <input className="input" name="dataNascimento" value={novo.dataNascimento} onChange={handleChange} placeholder="DD/MM/AAAA" />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" name="senha" value={novo.senha} onChange={handleChange} />
          </div>
          {novo.cargo==='MEDICO' && (
            <div>
              <label className="label">CRM</label>
              <input className="input" name="registroProfissional" value={novo.registroProfissional} onChange={handleChange} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-primary" onClick={cadastrar} disabled={loading}>
            {loading ? 'Criando...' : '+ Criar acesso'}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Cargo</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map(f => {
              const style = CARGO_STYLE[f.cargo] || CARGO_STYLE.RECEPCAO;
              return (
                <tr key={f.id}>
                  <td><span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)', fontWeight:600 }}>#{f.id}</span></td>
                  <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{f.nome}</td>
                  <td style={{ fontFamily:'var(--font-mono)' }}>{f.cpf || '—'}</td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background: style.bg, color: style.color }}>
                      {f.cargo}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}