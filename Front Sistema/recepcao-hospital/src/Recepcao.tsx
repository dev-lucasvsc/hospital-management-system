import { useState, useEffect } from 'react';
import api from '../api';

const C = {
  bg:'#0d0d0f',surface:'#131316',elevated:'#1a1a1f',hover:'#202028',input:'#18181d',
  border:'#2a2a35',focus:'#4f46e5',accent:'#4f46e5',
  text:'#f0f0f3',muted:'#8b8b9e',dim:'#4a4a5a',
  green:'#22c55e',greenBg:'rgba(34,197,94,0.08)',greenBorder:'rgba(34,197,94,0.2)',
  amber:'#f59e0b',red:'#ef4444',blue:'#3b82f6',
};
const inp:React.CSSProperties={width:'100%',padding:'9px 12px',background:C.input,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:'none',fontFamily:"'DM Sans',sans-serif"};
const lbl:React.CSSProperties={display:'block',fontSize:12,fontWeight:500,color:C.muted,marginBottom:6};
const btnG:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:4,padding:'7px 14px',borderRadius:8,background:'transparent',color:C.muted,border:`1px solid ${C.border}`,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'};
const btnP:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'center',padding:'11px 24px',borderRadius:10,background:C.accent,color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",width:'100%'};

function Sec({title,children}:{title:string;children:React.ReactNode}){
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'18px 20px'}}>
    <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:C.dim,marginBottom:14}}>{title}</div>
    {children}
  </div>;
}
function Grid({cols,children}:{cols:number;children:React.ReactNode}){
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:'12px 14px'}}>{children}</div>;
}
function Sp({cols,children}:{cols:number;children:React.ReactNode}){
  return <div style={{gridColumn:`span ${cols}`}}>{children}</div>;
}

export function Recepcao(){
  const [fd,setFd]=useState({nome:'',dataNascimento:'',genero:'',cpf:'',numeroSus:'',possuiConvenio:false,numeroConvenio:'',prioridade:'S',cep:'',rua:'',bairro:'',cidade:'',uf:'',telefone:'',nomeMae:'',nomePai:'',peso:'',altura:''});
  const [cg,setCg]=useState<any>(null);
  const [sc,setSc]=useState<'pendente'|'validando'|'aprovado'|'negado'>('pendente');
  const [pre,setPre]=useState<any>(null);
  const [load,setLoad]=useState(false);

  const mCPF=(v:string)=>v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1');
  const mDt=(v:string)=>v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{4})\d+?$/,'$1');
  const mCep=(v:string)=>v.replace(/\D/g,'').replace(/(\d{5})(\d)/,'$1-$2').slice(0,9);
  const mTel=(v:string)=>{v=v.replace(/\D/g,'');v=v.replace(/^(\d{2})(\d)/g,'($1) $2');v=v.replace(/(\d)(\d{4})$/,'$1-$2');return v.slice(0,15);};

  const ch=(e:any)=>{
    const{name,value}=e.target;let val=value;
    if(name==='cpf')val=mCPF(value);
    if(name==='dataNascimento')val=mDt(value);
    if(name==='numeroSus')val=value.replace(/\D/g,'').slice(0,15);
    if(name==='cep')val=mCep(value);
    if(name==='telefone')val=mTel(value);
    if(name==='numeroConvenio')setSc('pendente');
    setFd(p=>({...p,[name]:name==='possuiConvenio'?value==='true':val}));
  };

  useEffect(()=>{
    const c=fd.cpf.replace(/\D/g,'');
    if(c.length===11)api.get(`/consultas/whatsapp/pre-agendamento/${c}`).then(r=>setPre(r.data)).catch(()=>setPre(null));
    else setPre(null);
  },[fd.cpf]);

  const buscarCep=async()=>{const c=fd.cep.replace(/\D/g,'');if(c.length!==8)return;try{const r=await api.get(`https://viacep.com.br/ws/${c}/json/`);if(!r.data.erro)setFd(p=>({...p,rua:r.data.logradouro,bairro:r.data.bairro,cidade:r.data.localidade,uf:r.data.uf}));}catch{}};
  const buscarPac=async()=>{const c=fd.cpf.replace(/\D/g,'');if(c.length!==11)return;try{const r=await api.get(`/consultas/historico/${c}`);if(r.data.length>0){const p=r.data[0].paciente;setFd(v=>({...v,nome:p.nome||v.nome,dataNascimento:p.dataNascimento||v.dataNascimento,numeroSus:p.numeroSus||v.numeroSus,telefone:p.telefone||v.telefone,nomeMae:p.nomeMae||v.nomeMae,nomePai:p.nomePai||v.nomePai,peso:p.peso||v.peso,altura:p.altura||v.altura,cep:p.cep||v.cep,rua:p.rua||v.rua,bairro:p.bairro||v.bairro,cidade:p.cidade||v.cidade,uf:p.uf||v.uf}));}}catch{}};
  const valConv=()=>{if(!fd.numeroConvenio)return;setSc('validando');setTimeout(()=>setSc(fd.numeroConvenio.length>=8?'aprovado':'negado'),1500);};
  const agendar=async()=>{const c=fd.cpf.replace(/\D/g,'');if(!fd.nome||c.length!==11)return alert('Nome e CPF são obrigatórios.');setLoad(true);try{const r=await api.post('/consultas/agendar',{prioridade:fd.prioridade,paciente:{...fd,cpf:c}});setCg(r.data);if(pre)await api.put(`/consultas/whatsapp/pre-agendamento/${c}/concluir`);setFd({nome:'',dataNascimento:'',genero:'',cpf:'',numeroSus:'',possuiConvenio:false,numeroConvenio:'',prioridade:'S',cep:'',rua:'',bairro:'',cidade:'',uf:'',telefone:'',nomeMae:'',nomePai:'',peso:'',altura:''});}catch{alert('Erro ao cadastrar.');}finally{setLoad(false);}};

  const prios=[
    {v:'S',label:'Normal',desc:'Atendimento padrão',color:C.blue,bg:'rgba(59,130,246,0.08)',bo:'rgba(59,130,246,0.3)'},
    {v:'P',label:'Preferencial',desc:'Idoso, gestante, PCD',color:C.amber,bg:'rgba(245,158,11,0.08)',bo:'rgba(245,158,11,0.3)'},
    {v:'U',label:'Urgente',desc:'Risco à vida',color:C.red,bg:'rgba(239,68,68,0.08)',bo:'rgba(239,68,68,0.3)'},
  ];
  const sc2=(p:string)=>p==='U'?C.red:p==='P'?C.amber:C.blue;

  return(
    <div style={{maxWidth:720,margin:'0 auto',width:'100%'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:600,color:C.text,marginBottom:4}}>Recepção</h1>
        <p style={{fontSize:13,color:C.muted}}>Cadastro de pacientes e geração de senhas</p>
      </div>

      {pre&&<div style={{marginBottom:16,padding:'12px 16px',background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:18}}>📱</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.green,marginBottom:2}}>Pré-agendamento via WhatsApp encontrado</div><div style={{fontSize:12,color:C.muted}}>{pre.nome} · {pre.sintomas}</div></div>
        <button style={{...btnG,color:C.green,borderColor:C.greenBorder}} onClick={()=>{setFd(p=>({...p,nome:pre.nome||p.nome,dataNascimento:pre.dataNascimento||p.dataNascimento,telefone:pre.telefone||p.telefone}));setPre(null);}}>Importar</button>
      </div>}

      {cg&&<div style={{marginBottom:20,padding:'16px 20px',background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,display:'flex',alignItems:'center',gap:18}}>
        <div style={{width:56,height:56,borderRadius:12,flexShrink:0,background:`rgba(${cg.prioridade==='U'?'239,68,68':cg.prioridade==='P'?'245,158,11':'59,130,246'},0.1)`,border:`1px solid rgba(${cg.prioridade==='U'?'239,68,68':cg.prioridade==='P'?'245,158,11':'59,130,246'},0.3)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontWeight:700,fontSize:16,color:sc2(cg.prioridade)}}>{cg.senha}</div>
        <div><div style={{fontSize:12,color:C.muted,marginBottom:3}}>Senha gerada com sucesso</div><div style={{fontSize:15,fontWeight:600,color:C.text}}>Consultório <span style={{color:C.accent}}>{cg.consultorio}</span></div></div>
        <button style={{...btnG,marginLeft:'auto'}} onClick={()=>setCg(null)}>Limpar</button>
      </div>}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Sec title="Identificação">
          <Grid cols={4}>
            <Sp cols={4}><label style={lbl}>CPF do Paciente</label><div style={{display:'flex',gap:8}}><input style={{...inp,flex:1}} name="cpf" value={fd.cpf} placeholder="000.000.000-00" onChange={ch}/><button style={btnG} onClick={buscarPac}>🔎 Buscar</button></div></Sp>
            <Sp cols={4}><label style={lbl}>Nome Completo</label><input style={inp} name="nome" value={fd.nome} onChange={ch}/></Sp>
            <Sp cols={2}><label style={lbl}>Data de Nascimento</label><input style={inp} name="dataNascimento" value={fd.dataNascimento} placeholder="DD/MM/AAAA" onChange={ch}/></Sp>
            <Sp cols={2}><label style={lbl}>Nº Cartão SUS</label><input style={inp} name="numeroSus" value={fd.numeroSus} onChange={ch}/></Sp>
          </Grid>
        </Sec>
        <Sec title="Contato e filiação">
          <Grid cols={3}>
            <div><label style={lbl}>Telefone</label><input style={inp} name="telefone" value={fd.telefone} placeholder="(00) 00000-0000" onChange={ch}/></div>
            <div><label style={lbl}>Peso (kg)</label><input style={inp} type="number" step="0.1" name="peso" value={fd.peso} placeholder="75.5" onChange={ch}/></div>
            <div><label style={lbl}>Altura (m)</label><input style={inp} type="number" step="0.01" name="altura" value={fd.altura} placeholder="1.75" onChange={ch}/></div>
            <Sp cols={3}><label style={lbl}>Nome da Mãe</label><input style={inp} name="nomeMae" value={fd.nomeMae} onChange={ch}/></Sp>
            <Sp cols={3}><label style={lbl}>Nome do Pai (Opcional)</label><input style={inp} name="nomePai" value={fd.nomePai} onChange={ch}/></Sp>
          </Grid>
        </Sec>
        <Sec title="Endereço">
          <Grid cols={4}>
            <Sp cols={2}><label style={lbl}>CEP</label><div style={{display:'flex',gap:8}}><input style={{...inp,flex:1}} name="cep" value={fd.cep} placeholder="00000-000" onChange={ch}/><button style={btnG} onClick={buscarCep}>Buscar</button></div></Sp>
            <Sp cols={4}><label style={lbl}>Rua</label><input style={inp} name="rua" value={fd.rua} onChange={ch}/></Sp>
            <Sp cols={2}><label style={lbl}>Bairro</label><input style={inp} name="bairro" value={fd.bairro} onChange={ch}/></Sp>
            <Sp cols={1}><label style={lbl}>Cidade</label><input style={inp} name="cidade" value={fd.cidade} onChange={ch}/></Sp>
            <Sp cols={1}><label style={lbl}>UF</label><input style={inp} name="uf" value={fd.uf} onChange={ch}/></Sp>
          </Grid>
        </Sec>
        <Sec title="Convênio">
          <div style={{display:'flex',gap:20,marginBottom:fd.possuiConvenio?14:0}}>
            {[{v:'false',l:'Não (Particular / SUS)'},{v:'true',l:'Sim, possuo convênio'}].map(({v,l})=>(
              <label key={v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:C.muted}}>
                <input type="radio" name="possuiConvenio" value={v} checked={String(fd.possuiConvenio)===v} onChange={ch} style={{accentColor:C.accent}}/>{l}
              </label>
            ))}
          </div>
          {fd.possuiConvenio&&<Grid cols={3}><Sp cols={2}><label style={lbl}>Nº da Carteirinha</label><div style={{display:'flex',gap:8}}><input style={{...inp,flex:1}} name="numeroConvenio" value={fd.numeroConvenio} onChange={ch}/><button style={btnG} onClick={valConv} disabled={sc==='validando'}>{sc==='validando'?'...':'🛡️ Validar'}</button></div>{sc==='aprovado'&&<div style={{marginTop:6,fontSize:12,color:C.green}}>✓ Aprovado</div>}{sc==='negado'&&<div style={{marginTop:6,fontSize:12,color:C.red}}>✗ Negado</div>}</Sp></Grid>}
        </Sec>
        <Sec title="Grau de urgência">
          <div style={{display:'flex',gap:10}}>
            {prios.map(({v,label,desc,color,bg,bo})=>(
              <div key={v} onClick={()=>setFd(p=>({...p,prioridade:v}))} style={{flex:1,padding:'12px 14px',borderRadius:10,cursor:'pointer',background:fd.prioridade===v?bg:C.elevated,border:`1px solid ${fd.prioridade===v?bo:C.border}`,transition:'all 140ms'}}>
                <div style={{fontSize:13,fontWeight:600,color,marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:C.dim}}>{desc}</div>
              </div>
            ))}
          </div>
        </Sec>
        <button style={{...btnP,opacity:load?0.6:1}} onClick={agendar} disabled={load}>
          {load?'Cadastrando...':'Cadastrar e gerar senha →'}
        </button>
      </div>
    </div>
  );
}