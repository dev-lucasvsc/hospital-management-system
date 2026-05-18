import { useEffect, useState } from 'react';
import api from './api';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export function PainelMedico() {
  const [consultorio, setConsultorio]       = useState<string | null>(null);
  const [filaGlobal, setFilaGlobal]         = useState<any[]>([]);
  const [emAtendimento, setEmAtendimento]   = useState<any | null>(null);
  const [obs, setObs]                       = useState('');
  const [chamando, setChamando]             = useState(false);
  const [finalizando, setFinalizando]       = useState(false);
  const [cpfBusca, setCpfBusca]             = useState('');
  const [historico, setHistorico]           = useState<any[] | null>(null);

  const buscarFila = async () => {
    try {
      const res = await api.get('/consultas/fila');
      setFilaGlobal(res.data);
    } catch {}
  };

  const buscarEmAtendimento = async (c: string) => {
    try {
      const res = await api.get(`/consultas/em-atendimento/${c}`);
      if (res.status === 200) setEmAtendimento(res.data);
      else setEmAtendimento(null);
    } catch { setEmAtendimento(null); }
  };

  useEffect(() => {
    if (!consultorio) return;
    buscarFila();
    buscarEmAtendimento(consultorio);

    const socket = new SockJS('http://localhost:8080/ws-hospital');
    const stomp = Stomp.over(socket);
    stomp.debug = () => {};
    stomp.connect({}, () => stomp.subscribe('/topic/fila', () => {
      buscarFila();
      buscarEmAtendimento(consultorio);
    }));
    return () => { if (stomp?.connected) stomp.disconnect(() => {}); };
  }, [consultorio]);

  const chamarProximo = async () => {
    if (!consultorio || chamando) return;
    setChamando(true);
    try {
      const res = await api.post(`/consultas/chamar/${consultorio}`);
      if (res.status === 204) {
        alert('Fila vazia — nenhum paciente aguardando.');
      } else {
        const paciente = res.data;
        setEmAtendimento(paciente);
        buscarFila();
      }
    } catch { alert('Erro ao chamar próximo.'); }
    finally { setChamando(false); }
  };

  const concluir = async () => {
    if (!emAtendimento || finalizando) return;
    setFinalizando(true);
    try {
      await api.put(`/consultas/${emAtendimento.id}/concluir`, obs, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setEmAtendimento(null);
      setObs('');
      buscarFila();
    } catch (e: any) {
      if (e.response?.status === 409) alert('Conflito: este atendimento já foi concluído.');
      else alert('Erro ao finalizar.');
    } finally { setFinalizando(false); }
  };

  const exportarPDF = () => {
    if (!emAtendimento) return;
    const p = emAtendimento.paciente;
    const dataAtend = new Date(emAtendimento.dataHora).toLocaleString('pt-BR');
    const dataAtual = new Date().toLocaleString('pt-BR');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Prontuário — ${p?.nome}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; max-width: 700px; margin: 0 auto; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 28px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .row { display: flex; gap: 24px; margin-bottom: 6px; }
          .field { flex: 1; }
          .label { font-size: 11px; color: #888; margin-bottom: 2px; }
          .value { font-size: 13px; font-weight: 500; }
          .obs-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px; min-height: 120px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
          .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: ${emAtendimento.prioridade === 'U' ? '#fee2e2' : emAtendimento.prioridade === 'P' ? '#fef3c7' : '#dbeafe'}; color: ${emAtendimento.prioridade === 'U' ? '#991b1b' : emAtendimento.prioridade === 'P' ? '#92400e' : '#1e40af'}; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Prontuário de Atendimento</h1>
        <div class="subtitle">Emitido em ${dataAtual}</div>

        <div class="section">
          <div class="section-title">Identificação do Atendimento</div>
          <div class="row">
            <div class="field"><div class="label">Senha</div><div class="value">${emAtendimento.senha}</div></div>
            <div class="field"><div class="label">Consultório</div><div class="value">${consultorio}</div></div>
            <div class="field"><div class="label">Prioridade</div><div class="value"><span class="badge">${emAtendimento.prioridade === 'U' ? 'Urgente' : emAtendimento.prioridade === 'P' ? 'Preferencial' : 'Normal'}</span></div></div>
            <div class="field"><div class="label">Data/Hora</div><div class="value">${dataAtend}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Paciente</div>
          <div class="row">
            <div class="field"><div class="label">Nome</div><div class="value">${p?.nome || '—'}</div></div>
            <div class="field"><div class="label">CPF</div><div class="value">${p?.cpf || '—'}</div></div>
          </div>
          <div class="row">
            <div class="field"><div class="label">Data de Nascimento</div><div class="value">${p?.dataNascimento || '—'}</div></div>
            <div class="field"><div class="label">Gênero</div><div class="value">${p?.genero || '—'}</div></div>
            <div class="field"><div class="label">Telefone</div><div class="value">${p?.telefone || '—'}</div></div>
          </div>
          <div class="row">
            <div class="field"><div class="label">Peso</div><div class="value">${p?.peso ? p.peso + ' kg' : '—'}</div></div>
            <div class="field"><div class="label">Altura</div><div class="value">${p?.altura ? p.altura + ' m' : '—'}</div></div>
            <div class="field"><div class="label">Nº SUS</div><div class="value">${p?.numeroSus || '—'}</div></div>
            <div class="field"><div class="label">Convênio</div><div class="value">${p?.possuiConvenio ? p.numeroConvenio || 'Sim' : 'Não'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Evolução Clínica / Prontuário</div>
          <div class="obs-box">${obs || 'Sem observações registradas.'}</div>
        </div>

        <div class="footer">Sistema Hospitalar — UNIEURO ADS &nbsp;|&nbsp; Documento gerado automaticamente</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const buscarHistorico = async () => {
    const cpfLimpo = cpfBusca.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return alert('CPF incompleto.');
    try {
      const res = await api.get(`/consultas/historico/${cpfLimpo}`);
      if (res.data.length === 0) alert('Nenhum prontuário encontrado.');
      else setHistorico(res.data);
    } catch { alert('Erro ao buscar histórico.'); }
  };

  const maskCPF = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

  // -------------------------------------------------------
  // Tela de seleção de sala
  // -------------------------------------------------------
  if (!consultorio) return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Painel Médico</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Selecione sua sala de atendimento</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {['01', '02', '03', '04', '05'].map(n => (
          <button key={n} onClick={() => setConsultorio(n)}
            style={{ padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, transition: 'all var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}>
            Sala {n}
          </button>
        ))}
      </div>
    </div>
  );

  // -------------------------------------------------------
  // Painel principal
  // -------------------------------------------------------
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Sala {consultorio}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filaGlobal.length} paciente{filaGlobal.length !== 1 ? 's' : ''} aguardando na fila</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setConsultorio(null); setEmAtendimento(null); }} style={{ marginLeft: 'auto' }}>Trocar sala</button>
      </div>

      {/* Card do paciente em atendimento */}
      <div className="card" style={{ marginBottom: 20, borderColor: emAtendimento ? 'rgba(79,70,229,0.4)' : 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: emAtendimento ? 16 : 0 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Em atendimento</div>
            {emAtendimento ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`senha-tag senha-${emAtendimento.prioridade}`}>{emAtendimento.senha}</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{emAtendimento.paciente?.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CPF: {emAtendimento.paciente?.cpf}</div>
                </div>
                <span className={`badge badge-${emAtendimento.prioridade}`} style={{ marginLeft: 4 }}>
                  {emAtendimento.prioridade === 'U' ? 'Urgente' : emAtendimento.prioridade === 'P' ? 'Preferencial' : 'Normal'}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum paciente em atendimento</div>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={chamarProximo}
            disabled={chamando || !!emAtendimento}
            style={{ minWidth: 140 }}>
            {chamando ? 'Chamando...' : '📢 Chamar próximo'}
          </button>
        </div>

        {emAtendimento && (
          <>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Evolução clínica / Prontuário</label>
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                rows={5}
                placeholder="Diagnóstico, prescrição, observações clínicas..."
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={exportarPDF}>📄 Exportar PDF</button>
                <button className="btn btn-success" onClick={concluir} disabled={finalizando}>
                  {finalizando ? 'Salvando...' : '✓ Finalizar atendimento'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Busca prontuário */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔎 Prontuário por CPF</span>
        <input className="input" value={cpfBusca} onChange={e => setCpfBusca(maskCPF(e.target.value))} placeholder="000.000.000-00" style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={buscarHistorico}>Buscar</button>
      </div>

      {/* Fila global */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Senha</th><th>Paciente</th><th>Prioridade</th><th>Aguardando desde</th></tr>
          </thead>
          <tbody>
            {filaGlobal.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Fila vazia</td></tr>
            ) : filaGlobal.map((c, i) => (
              <tr key={c.id} style={{ opacity: i === 0 ? 1 : 0.7 }}>
                <td><span className={`senha-tag senha-${c.prioridade}`}>{c.senha}</span></td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{c.paciente?.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CPF: {c.paciente?.cpf}</div>
                </td>
                <td><span className={`badge badge-${c.prioridade}`}>{c.prioridade === 'U' ? 'Urgente' : c.prioridade === 'P' ? 'Preferencial' : 'Normal'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal histórico */}
      {historico && (
        <Modal onClose={() => setHistorico(null)} title={`Histórico — ${historico[0]?.paciente?.nome}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
            {historico.map((h: any) => (
              <div key={h.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{new Date(h.dataHora).toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{h.observacoes || 'Sem observações registradas.'}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-up card" style={{ width: '100%', maxWidth: 500, padding: '24px', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}