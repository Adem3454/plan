const COARSE=matchMedia("(pointer:coarse)").matches;
/* Planlar: paylaşım, roller, alt görevler, kişilere sürükle-bırak */
const COL=['#ff375f','#ff9f0a','#30d158','#0a84ff','#bf5af2','#64d2ff'];
const TPL={'Boş':[],'Hackathon':['Fikir ve kapsam','Tasarım','Frontend','Backend','Sunum'],'Etkinlik':['Mekân','Davetiye','Yemek','Müzik','Bütçe'],'İş projesi':['Hedefleri yaz','Plan çıkar','İlk taslak','Gözden geçir','Teslim']};
const J=k=>JSON.parse(localStorage.getItem(k)||'[]');
let PJ=J('pj'),TK=J('tk'),SB=J('sb'),MB=J('mb'),P='cal',V2='pano',ET=null,rt=null,GO=null,PAL=[],IMP=[],COM=[],DOC=[],ACT=[],POL=[],VOT=[],NOT=[],TPLS=[],ARC=false;
const cacheP=()=>[['pj',PJ],['tk',TK],['sb',SB],['mb',MB]].forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
const ME=()=>(user.email||'').toLowerCase(),roleOf=p=>(MB.find(m=>m.project_id==p.id&&m.email==ME())||{}).role,own=p=>p.user_id==user.id||roleOf(p)=='editor',mem=p=>MB.filter(m=>m.project_id==p.id),cur=()=>PJ.find(x=>x.id==P);
const nm=(p,e)=>{const m=mem(p).find(x=>x.email==e);return m?m.name:e},can=(t,p)=>own(p)||(t.assignee==ME()&&roleOf(p)!='viewer'),err=r=>r.error&&alert(r.error.message);
const prog=t=>{const s=SB.filter(x=>x.task_id==t.id);return s.length?s.filter(x=>x.done).length/s.length:t.status=='done'?1:0};
const avg=a=>a.length?a.reduce((s,t)=>s+prog(t),0)/a.length:0;

async function loadProj(){const r=await Promise.all(['projects','tasks','subtasks','project_members','comments','docs','activity','polls','votes','notes','templates'].map(t=>sb.from(t).select('*')));
 if(r.some(x=>x.error))return console.warn(r.find(x=>x.error).error.message);
 [PJ,TK,SB,MB,COM,DOC,ACT,POL,VOT,NOT,TPLS]=r.map(x=>x.data);COM.sort((a,b)=>(a.created_at||'')<(b.created_at||'')?-1:1);PJ.sort((a,b)=>a.created_at<b.created_at?-1:1);cacheP();if(GO&&PJ.find(x=>x.id==GO)){P=GO;GO=null}render();
 if(!rt)rt=sb.channel('pj').on('postgres_changes',{event:'*',schema:'public'},()=>{clearTimeout(rt.t);rt.t=setTimeout(loadProj,500)}).subscribe()}
const _load=load;load=async function(){await _load();await loadProj()};
const _z=zoom,_s=shift;zoom=d=>P=='cal'&&_z(d);shift=n=>P=='cal'&&_s(n);
const _render=render;
render=function(d){if(SH)return shareRender();const p=cur();theme();applyLook();nowBar();tabsOn();if(d){$('#app').classList.add('enter');setTimeout(()=>$('#app').classList.remove('enter'),700)}{const rk=P=='cal'&&(V.l=='week'||V.l=='day');$('#dock').style.display=rk?'flex':'none';$('#pl').style.display=rk?'none':''}$('#q').placeholder=P=='cal'?'yarın 15:00 diş hekimi':'Görev ekle · @ali pastayı al';
 if(P!='cal'&&P!='my'&&!p)P='cal';drawSide();$('#bar').style.display=((p&&!own(p))||P=='my')?'none':'';
 if(P=='cal'){_render(d);afterCal();return}
 if(P=='my'){myRender();return}
 try{planRender(p)}catch(er){$('#app').innerHTML='<p class="hint">Plan açılamadı: '+esc(er.message)+'</p>';console.error(er)}if(d)$('#app').animate([{opacity:0,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.32,.72,0,1)'})};

function drawSide(){$('#side').innerHTML=`<h2>Planlar</h2><button class="si" data-pa="ck">⌕ Ara · Ctrl+K</button><button class="si${P=='cal'?' on':''}" data-pg="cal"><i style="background:var(--ac)"></i>Takvim</button><button class="si${P=='my'?' on':''}" data-pg="my"><i style="background:var(--ok)"></i>Benim görevlerim</button>${PJ.map(p=>`<button class="si${P==p.id?' on':''}" data-pg="${p.id}"><i style="background:${p.color}"></i><span>${esc(p.name)}${own(p)?'':'<small> · paylaşılan</small>'}</span></button>`).join('')}<button class="si" data-pa="np" style="color:var(--ac)">+ Yeni plan</button>`}
const card=(t,p)=>{const sc=SB.filter(s=>s.task_id==t.id),dn=sc.filter(s=>s.done).length;
 return `<div class="tk${t.status=='done'?' done':''}" data-t="${t.id}"><span class="ck"${can(t,p)?` data-tk="${t.id}"`:''}></span><div class="tt">${esc(t.title)}<small>${[V2=='pano'&&t.assignee?esc(nm(p,t.assignee)):'',sc.length?dn+'/'+sc.length+' alt görev':'',t.due?fmtD(t.due):'',t.repeat?'↻':'',blk(t)?'🔒 '+esc(blk(t).title)+' bekleniyor':''].filter(Boolean).join(' · ')}</small></div></div>`};
function planRender(p){const ts=TK.filter(t=>t.project_id==p.id).sort((a,b)=>a.pos-b.pos),pc=Math.round(avg(ts)*100),dn=ts.filter(t=>t.status=='done').length;
 const cols=V2=='kisi'?[['','Atanmamış'],...mem(p).map(m=>[m.email,m.name])]:[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']];
 $('#app').innerHTML=`<nav><span><button class="mb" data-pa="menu">☰</button></span><span><button data-pa="pset">${own(p)?'Kişiler ⋯':'Kişiler'}</button></span></nav><div class="ph" style="--c:${p.color}"><div><h1>${esc(p.name)}</h1><small>${dn}/${ts.length} görev tamam · %${pc} · ${mem(p).length} kişi${left(p)}${own(p)?'':' · sadece kendi görevlerini düzenleyebilirsin'}</small></div><span class="rg" style="--p:${pc}"><b>${pc}%</b></span></div><div class="seg"><button data-vw="pano" class="${V2=='pano'?'on':''}">Pano</button><button data-vw="kisi" class="${V2=='kisi'?'on':''}">Kişiler</button></div><div class="cols">${cols.map(([c,n])=>{const a=ts.filter(t=>V2=='kisi'?(c===''?!mem(p).some(m=>m.email==t.assignee):t.assignee==c):t.status==c),k=V2=='kisi'&&a.length;
  return `<div class="col"><h3>${V2=='kisi'&&c!==''?`<span class="rg" style="--p:${a.length?Math.round(avg(a)*100):0}"><b>${esc(n[0].toLocaleUpperCase(TR))}</b></span>`:''}<span class="nm">${esc(n)}</span><small>${V2=='kisi'&&a.length?a.filter(t=>t.status=='done').length+'/'+a.length:a.length}</small></h3><div class="list" data-c="${esc(c)}">${a.map(t=>card(t,p)).join('')}</div></div>`}).join('')}</div>`;
 }
function dropped(e){const c=e.to.dataset.c,t=TK.find(x=>x.id==e.item.dataset.t),ch=new Set();
 if(V2=='kisi')t.assignee=c||null;else t.status=c;
 for(const l of new Set([e.to,e.from]))[...l.children].forEach((el,i)=>{const x=TK.find(y=>y.id==el.dataset.t);if(x){x.pos=i;ch.add(x)}});
 cacheP();setTimeout(render,0);sb.from('tasks').upsert([...ch]).then(err)}
function sync(tid){const t=TK.find(x=>x.id==tid),ss=SB.filter(s=>s.task_id==tid);if(!ss.length)return;const n=ss.filter(x=>x.done).length,st=n==ss.length?'done':n?'doing':'todo';
 if(st!=t.status){t.status=st;sb.from('tasks').update({status:st}).eq('id',tid).then(err)}}
function togT(id){const t=TK.find(x=>x.id==id);if(SB.some(s=>s.task_id==id))return editT(id);if(t.status!='done'&&blk(t))return alert('Önce "'+blk(t).title+'" bitmeli.');t.status=t.status=='done'?'todo':'done';cacheP();render();sb.from('tasks').update({status:t.status}).eq('id',id).then(err)}
function addTask(v){v=v.trim();const p=cur();if(!v||!own(p))return;const m=v.match(/^@(\S+)\s+(.+)/);let a=null;
 if(m){const f=mem(p).find(x=>(x.name+' '+x.email).toLocaleLowerCase(TR).startsWith(m[1].toLocaleLowerCase(TR)));if(f){a=f.email;v=m[2]}}
 const t={id:crypto.randomUUID(),project_id:P,title:v,status:'todo',assignee:a,pos:9999,user_id:user.id};TK.push(t);cacheP();render();sb.from('tasks').insert(t).then(err)}
const sub=(id,fn)=>{fn();sync(SB.find(s=>s.id==id)?.task_id||ET);cacheP();editT(ET);render()};
function editT(id){ET=id;const t=TK.find(x=>x.id==id),p=PJ.find(x=>x.id==t.project_id),o=own(p),c=can(t,p),ss=SB.filter(s=>s.task_id==id).sort((a,b)=>a.pos-b.pos);
 sheet(`<div class="card">${o?`<input id="tt" value="${esc(t.title)}">`:`<div class="row">${esc(t.title)}</div>`}</div>${o?`<div class="card"><select id="ta"><option value="">Atanmamış</option>${mem(p).map(m=>`<option value="${esc(m.email)}"${m.email==t.assignee?' selected':''}>${esc(m.name)}</option>`).join('')}</select></div>`:`<p class="hint">Atanan: ${esc(t.assignee?nm(p,t.assignee):'—')}${c?'':' · sadece görebilirsin'}</p>`}${o?`<div class="card"><input id="td" type="date" value="${t.due||''}"></div>`:t.due?`<p class="hint">Bitiş: ${fmtD(t.due)}</p>`:''}${o?`<div class="card"><select id="tb"><option value="">Beklediği görev yok</option>${TK.filter(x=>x.project_id==t.project_id&&x.id!=t.id).map(x=>`<option value="${x.id}"${x.id==t.blocked_by?' selected':''}>Bekler: ${esc(x.title)}</option>`).join('')}</select><select id="tr">${[['','Tekrarlamaz'],['daily','Her gün'],['weekly','Her hafta'],['monthly','Her ay']].map(([k,n])=>`<option value="${k}"${(t.repeat||'')==k?' selected':''}>${n}</option>`).join('')}</select></div>`:''}<h2>Alt görevler</h2><div class="card">${ss.map(s=>`<div class="p${s.done?' done':''}"><span class="ck"${c?` data-sk="${s.id}"`:''}></span><div class="tt">${esc(s.title)}</div>${c?`<button data-pa="ds" data-i="${s.id}">✕</button>`:''}</div>`).join('')||'<div class="row"><small>Henüz yok</small></div>'}${c?'<input id="ns" placeholder="Alt görev ekle, Enter" enterkeyhint="done">':''}</div><h2>Yorumlar</h2><div class="card">${COM.filter(x=>x.task_id==id).map(x=>`<div class="p"><div class="tt"><small>${esc(x.author)}</small>${esc(x.body)}</div></div>`).join('')}<input id="nc" placeholder="Yorum yaz, @ad ile etiketle, Enter" enterkeyhint="send"></div><h2>Belgeler</h2>${docsHtml(t.project_id,id)}${o?`<div class="seg">${[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']].map(([k,n])=>`<button data-s="${k}" class="${t.status==k?'on':''}">${n}</button>`).join('')}</div><div class="card"><button class="row red" data-pa="dt" data-i="${id}">Görevi sil</button></div><button class="big" data-pa="st" data-i="${id}">Kaydet</button>`:''}`)}
function newPlan(){sheet(`<div class="card"><input id="pn" placeholder="Plan adı"></div><div class="seg">${[...Object.keys(TPL),...TPLS.filter(t=>t.kind!='routine').map(t=>t.name)].map((k,i)=>`<button data-tp="${k}" class="${i?'':'on'}">${k}</button>`).join('')}</div><button class="big" data-pa="mk">Oluştur</button>`)}
function kisiler(){const p=cur(),o=p.user_id==user.id;sheet(`${MSG?`<p class="hint">${esc(MSG)}</p>`:''}<h2>Kişiler</h2><div class="card">${mem(p).map(m=>`<div class="p"><div class="tt">${esc(m.name)}<small>${esc(m.email.endsWith('@bekliyor.local')?'davet bekliyor':m.email)}${m.role=='owner'?' · yönetici':m.role=='editor'?' · düzenleyen':m.role=='viewer'?' · izleyen':''}</small></div>${o&&m.role!='owner'?`<button data-pa="rl" data-i="${m.id}">Rol</button><button data-pa="rm" data-i="${m.id}">✕</button>`:''}</div>`).join('')}</div><div class="card"><button class="row" data-pa="pdf">Özet yazdır / PDF olarak kaydet</button></div><h2>Plan belgeleri</h2>${docsHtml(p.id,null)}${o?`<h2>Kişi ekle</h2><div class="card"><input id="in" placeholder="Kullanıcı adı yaz (ör. yun) ya da e-posta" autocomplete="off"><div id="sg"></div></div><button class="big" data-pa="am">E-postayla ekle</button><h2>Teslim tarihi</h2><div class="card"><input id="pd" type="date" value="${p.due||''}"></div><button class="big" data-pa="sd">Tarihi kaydet</button><div class="card" style="margin-top:16px"><button class="row" data-pa="imp">Yapıştırarak içe aktar (Gemini vb.)</button></div><div class="card"><button class="row" data-pa="ts">Şablon olarak kaydet</button><button class="row" data-pa="ar">${p.archived?'Arşivden çıkar':'Planı arşivle'}</button><button class="row red" data-pa="dp">Planı sil</button></div>`:''}`)}
async function pact(a,i){const p=cur();
 if(a=='menu')document.body.classList.add('sd');
 else if(a=='np'){document.body.classList.remove('sd');newPlan()}
 else if(a=='mk'){const name=$('#pn').value.trim();if(!name)return;const id=crypto.randomUUID(),pr={id,name,color:COL[PJ.length%COL.length],user_id:user.id,created_at:new Date().toISOString()};
  const ts=tplList($('[data-tp].on').dataset.tp).map((title,n)=>({id:crypto.randomUUID(),project_id:id,title,status:'todo',assignee:null,pos:n,user_id:user.id}));
  PJ.push(pr);TK.push(...ts);MB.push({id:crypto.randomUUID(),project_id:id,email:ME(),name:ME().split('@')[0],role:'owner'});cacheP();P=id;V2='pano';close();render(1);
  const r=await sb.from('projects').insert({id,name,color:pr.color});if(r.error)return alert(r.error.message);if(ts.length)err(await sb.from('tasks').insert(ts.map(({user_id,...t})=>t)));loadProj()}
 else if(a=='pset')kisiler();
 else if(a=='am'){const e=$('#ie').value.trim().toLowerCase();if(!e)return;const m={id:crypto.randomUUID(),project_id:P,email:e,name:$('#in').value.trim()||e.split('@')[0],role:'member'};MB.push(m);cacheP();kisiler();render();sb.from('project_members').insert({id:m.id,project_id:P,email:m.email,name:m.name}).then(err)}
 else if(a=='rm'){MB=MB.filter(m=>m.id!=i);cacheP();kisiler();render();sb.from('project_members').delete().eq('id',i).then(err)}
 else if(a=='dp'){if(!confirm('Plan ve görevleri silinsin mi?'))return;const id=P;PJ=PJ.filter(x=>x.id!=id);TK=TK.filter(t=>t.project_id!=id);P='cal';cacheP();close();render(1);sb.from('projects').delete().eq('id',id).then(err)}
 else if(a=='st'){const t=TK.find(x=>x.id==i);t.title=$('#tt').value.trim()||t.title;t.assignee=$('#ta').value||null;t.status=$('[data-s].on').dataset.s;t.due=$('#td').value||null;t.blocked_by=$('#tb').value||null;t.repeat=$('#tr').value||null;cacheP();close();render();sb.from('tasks').update({title:t.title,assignee:t.assignee,status:t.status,due:t.due,due_notified:false,blocked_by:t.blocked_by,repeat:t.repeat}).eq('id',i).then(err)}
 else if(a=='dt'){TK=TK.filter(x=>x.id!=i);cacheP();close();render();sb.from('tasks').delete().eq('id',i).then(err)}
 else if(a=='ds')sub(i,()=>{SB=SB.filter(s=>s.id!=i);sb.from('subtasks').delete().eq('id',i).then(err)})}
const togS=id=>{const s=SB.find(x=>x.id==id);sub(id,()=>{s.done=!s.done;sb.from('subtasks').update({done:s.done}).eq('id',id).then(err)})};
document.addEventListener('keydown',e=>{if(e.key!='Enter'||e.target.id!='ns')return;const v=e.target.value.trim();if(!v)return;
 const s={id:crypto.randomUUID(),task_id:ET,project_id:TK.find(x=>x.id==ET).project_id,title:v,done:false,pos:SB.length};sub(s.id,()=>{SB.push(s);sb.from('subtasks').insert(s).then(err)})});
document.addEventListener('click',e=>{const t=e.target;let x;
 if(document.body.classList.contains('sd')&&!t.closest('#side')){document.body.classList.remove('sd');return}
 if(x=t.closest('[data-tp],[data-s]')){const k=x.hasAttribute('data-tp')?'[data-tp]':'[data-s]';return document.querySelectorAll(k).forEach(b=>b.classList.toggle('on',b===x))}
 if(x=t.closest('[data-sk]'))return togS(x.dataset.sk);
 if(x=t.closest('[data-tk]'))return togT(x.dataset.tk);
 if(x=t.closest('[data-pa]'))return pact(x.dataset.pa,x.dataset.i);
 if(x=t.closest('[data-pg]')){P=x.dataset.pg;document.body.classList.remove('sd');return render(1)}
 if(x=t.closest('[data-vw]')){V2=x.dataset.vw;return render()}
 if((x=t.closest('[data-t]'))&&Date.now()-LD>300){try{editT(x.dataset.t)}catch(er){alert('Görev açılamadı: '+er.message)}}});
$('#qf').onsubmit=e=>{e.preventDefault();const v=$('#q').value;$('#q').value='';P=='cal'?quick(v):addTask(v)};

/* ---- davet bağlantısı, içe aktarma, arama, teslim tarihi ---- */
const left=p=>{if(!p.due)return'';const ms=new Date(p.due+'T23:59')-new Date();if(ms<0)return' · süre doldu';return` · teslime ${Math.floor(ms/864e5)} gün ${Math.floor(ms%864e5/36e5)} sa`};
const INV=new URLSearchParams(location.search).get('davet');if(INV){localStorage.setItem('inv',INV);history.replaceState(null,'',location.pathname)}
const _ld=load;load=async function(){const iv=localStorage.getItem('inv');if(iv&&user){localStorage.removeItem('inv');const r=await sb.rpc('accept_invite',{mid:iv});r.error?alert(r.error.message):GO=r.data}await _ld()};
const _lg=login;login=function(){if(SH)return shareRender();_lg();$('#pw').insertAdjacentHTML('afterend','<input id="usr" placeholder="Kullanıcı adı (sadece hesap oluştururken)" autocapitalize="none" autocomplete="off">');if(localStorage.getItem('inv'))$('#app').insertAdjacentHTML('afterbegin','<p class="hint" style="margin-top:12vh">Daveti kabul etmek için giriş yap veya hesap oluştur. Plan hesabına otomatik eklenir.</p>')};
function share(id){const p=cur(),u=`${location.origin}${location.pathname}?davet=${id}`,x={title:'Plan daveti',text:`"${p.name}" planına davet edildin. Bağlantıyı aç, giriş yap veya hesap oluştur:`,url:u};
 navigator.share?navigator.share(x).catch(()=>{}):navigator.clipboard.writeText(u).then(()=>alert('Davet bağlantısı kopyalandı:\n'+u))}
function parseAI(tx,p){const ms=mem(p),out=[],cl=s=>s.replace(/\*\*|__|`/g,'').trim(),lc=s=>s.toLocaleLowerCase(TR);
 const find=s=>{s=lc(cl(s)).replace(/[:：#]+$/,'').trim();return ms.find(m=>{const n=lc(m.name);return s==n||s.startsWith(n+' ')||s.startsWith(n+'(')||s.startsWith(n+':')})};
 let who=null,last=null,ind=0;
 for(const raw of tx.split('\n')){if(!raw.trim())continue;
  if(raw.trim()[0]=='|'){const cs=raw.split('|').map(cl).filter(Boolean);if(/^[-: ]+$/.test(cs[0]))continue;const f=cs.map(find).find(Boolean),t=cs.find(c=>!find(c));if(f&&t&&!/^(görev|kişi|sorumlu)/i.test(t))out.push({title:t,assignee:f.email,subs:[]});continue}
  const m=raw.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)$/);
  if(!m){const f=find(raw.replace(/^[#\s]+/,''));if(f){who=f.email;last=null}else if(/^\s*(#|\*\*)/.test(raw)){who=null;last=null}continue}
  const sp=m[1].replace(/\t/g,'  ').length,t=cl(m[3]);
  if(last&&sp>ind){last.subs.push(t.replace(/^\[[ xX]\]\s*/,''));continue}
  const hf=find(t);if(hf&&sp==0&&t.length<=hf.name.length+2){who=hf.email;last=null;continue}
  let a=who,title=t,x;
  if((x=t.match(/^([^:]{1,25}):\s+(.+)$/))&&find(x[1])){a=find(x[1]).email;title=x[2]}
  else if((x=t.match(/^(.+?)\s*[—–(]\s*([^—–()]+?)\)?\s*$/))&&find(x[2])){a=find(x[2]).email;title=x[1]}
  last={title,assignee:a,subs:[]};ind=sp;out.push(last)}
 return out}
function impSheet(){sheet(`<p class="hint">Gemini'a şunu yaz: "Görev dağılımını şu biçimde ver: ## Kişi adı, altında '- görev', onun altında girintili '  - alt görev'". Çıkan metni buraya yapıştır. Kişi adları plandaki adlarla aynı olmalı.</p><div class="card"><textarea id="ai" placeholder="Yapıştır…"></textarea></div><button class="big" data-pa="ip">Önizle</button>`)}
function impPrev(){const p=cur(),n=IMP.reduce((s,t)=>s+t.subs.length,0),un=IMP.filter(t=>!t.assignee).length;
 sheet(`<h2>${IMP.length} görev, ${n} alt görev${un?' · '+un+' atanmamış':''}</h2><div class="card">${IMP.slice(0,12).map(t=>`<div class="p"><div class="tt">${esc(t.title)}<small>${esc(t.assignee?nm(p,t.assignee):'Atanmamış')}${t.subs.length?' · '+t.subs.length+' alt görev':''}</small></div></div>`).join('')||'<div class="row"><small>Görev bulunamadı. Kişi adlarının plandakilerle aynı olduğunu kontrol et.</small></div>'}</div>${IMP.length?'<button class="big" data-pa="ii">İçe aktar</button>':''}<button class="ctr" data-pa="imp">Geri</button>`)}
async function doImp(){const p=cur();let pos=TK.filter(t=>t.project_id==p.id).length;const ts=[],ss=[];
 for(const x of IMP){const id=crypto.randomUUID();ts.push({id,project_id:p.id,title:x.title,status:'todo',assignee:x.assignee,pos:pos++});x.subs.forEach((t,k)=>ss.push({id:crypto.randomUUID(),task_id:id,project_id:p.id,title:t,done:false,pos:k}))}
 TK.push(...ts.map(t=>({...t,user_id:user.id})));SB.push(...ss);cacheP();close();render();
 err(await sb.from('tasks').insert(ts));if(ss.length)err(await sb.from('subtasks').insert(ss))}
function palette(){document.body.classList.remove('sd');sheet(`<div class="card"><input id="ck" placeholder="Plan veya görev ara…" autocomplete="off"></div><div class="card" id="cr"></div>`);$('#ck').focus();pal('')}
function pal(q){q=q.toLocaleLowerCase(TR);PAL=[{t:'Takvim',s:'Sayfa',g:'cal'},...PJ.map(p=>({t:p.name,s:'Plan',g:p.id})),...TK.map(t=>({t:t.title,s:(PJ.find(p=>p.id==t.project_id)||{}).name,g:t.project_id,k:t.id}))].filter(x=>x.t.toLocaleLowerCase(TR).includes(q)).slice(0,8);
 $('#cr').innerHTML=PAL.map((x,i)=>`<button class="row" data-pk="${i}">${esc(x.t)} <small>${esc(x.s||'')}</small></button>`).join('')||'<div class="row"><small>Sonuç yok</small></div>'}
const goPK=i=>{const x=PAL[i];if(!x)return;P=x.g;close();render(1);if(x.k)setTimeout(()=>editT(x.k),350)};
document.addEventListener('input',e=>{if(e.target.id=='ck')pal(e.target.value)});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='k'&&user){e.preventDefault();palette()}else if(e.key=='Enter'&&e.target.id=='ck')goPK(0)});
document.addEventListener('click',e=>{const x=e.target.closest('[data-pk]');if(x)goPK(+x.dataset.pk)});
const _pa=pact;
pact=async function(a,i){const p=cur();
 if(a=='am_old'){const id=crypto.randomUUID(),n=$('#in').value.trim(),e=$('#ie').value.trim().toLowerCase()||`davet-${id}@bekliyor.local`;if(!n&&e.endsWith('@bekliyor.local'))return alert('Ad veya e-posta yaz.');
  MB.push({id,project_id:P,email:e,name:n||e.split('@')[0],role:'member'});cacheP();share(id);sb.from('project_members').insert({id,project_id:P,email:e,name:n||e.split('@')[0]}).then(r=>{err(r);kisiler();render()})}
 else if(a=='am')addFromInput()
 else if(a=='lk')share(i)
 else if(a=='sd'){p.due=$('#pd').value||null;cacheP();close();render();sb.from('projects').update({due:p.due}).eq('id',p.id).then(err)}
 else if(a=='imp')impSheet()
 else if(a=='ip'){IMP=parseAI($('#ai').value,p);impPrev()}
 else if(a=='ii')await doImp()
 else if(a=='ck')palette()
 else return _pa(a,i)};

/* ---- kişi ekleme: otomatik tamamlama, bağlantısız ---- */
let SU=[],sut=null,MSG='';
async function addMem(e,n){const p=cur();if(mem(p).some(m=>m.email==e))return alert('Bu kişi zaten planda.');
 const m={id:crypto.randomUUID(),project_id:p.id,email:e,name:n};MB.push({...m,role:'member'});cacheP();render();
 const r=await sb.from('project_members').insert(m);
 if(r.error){MB=MB.filter(x=>x.id!=m.id);cacheP();render();return alert(r.error.message)}
 const f=await sb.rpc('find_users',{q:e});
 MSG=f.data&&f.data.some(u=>u.email==e)?`${n} eklendi, plan hesabında göründü.`:`${n} eklendi. Bu e-postayla henüz hesap yok, hesap açınca plan kendiliğinden gelir.`;
 kisiler();MSG='';render()}
function addFromInput(){const raw=$('#in').value.trim().toLowerCase();if(!raw.includes('@'))return alert('Listeden bir kişi seç ya da tam e-posta yaz.');addMem(raw,raw.split('@')[0])}
document.addEventListener('input',e=>{if(e.target.id!='in')return;clearTimeout(sut);const q=e.target.value.trim();
 if(q.length<2){$('#sg').innerHTML='';return}
 sut=setTimeout(async()=>{const r=await sb.rpc('find_users',{q});SU=(r.data||[]).filter(u=>!mem(cur()).some(m=>m.email==u.email));
  $('#sg').innerHTML=SU.map((u,i)=>`<button class="row" data-su="${i}">${esc(u.name)} <small>${esc(u.email)}</small></button>`).join('')||'<div class="row"><small>Kayıtlı kullanıcı bulunamadı. Tam e-posta yazıp Ekle\'ye basabilirsin.</small></div>'},250)});
document.addEventListener('click',e=>{const x=e.target.closest('[data-su]');if(x)addMem(SU[+x.dataset.su].email,SU[+x.dataset.su].name)});

/* ---- kullanıcı adı: kayıtta seçilir, ayarlardan değişir ---- */
const _act=act;
act=async function(a,i){
 if(a=='set'){const r=await sb.rpc('my_username');
  sheet(`<p class="hint">${esc(user.email)}</p><h2>Kullanıcı adı</h2><div class="card"><input id="un" value="${esc(r.data||'')}" placeholder="kullanıcı adı" autocapitalize="none" autocomplete="off"></div><button class="big" data-a="un">Kaydet</button><div class="card" style="margin-top:16px"><button class="row" data-pa="look">Görünüm</button><button class="row" data-pa="shr">Paylaş ve abone ol</button><button class="row" data-pa="rt">Rutin günler</button><button class="row" data-pa="bulk">Toplu ekle</button><button class="row" data-pa="trs">Silinenler</button><button class="row" data-pa="khp">Kısayollar</button><button class="row" data-pa="ics">Takvime aktar (.ics)</button><button class="row" data-a="push">Bildirimleri aç</button><button class="row red" data-a="logout">Çıkış yap</button></div>`)}
 else if(a=='un'){const r=await sb.rpc('set_username',{u:$('#un').value.trim()});if(r.error)alert(r.error.message);else{close();alert('Kullanıcı adın kaydedildi.')}}
 else if(a=='up'){const u=($('#usr')?.value||'').trim().toLowerCase();if(!/^[a-z0-9_.]{3,20}$/.test(u))return alert('Kullanıcı adı 3-20 karakter olmalı: harf, rakam, _ ve .');
  const f=await sb.rpc('username_free',{u});if(!f.data)return alert('Bu kullanıcı adı alınmış, başka bir tane dene.');
  const {data,error}=await sb.auth.signUp({email:$('#em').value.trim(),password:$('#pw').value,options:{data:{username:u}}});
  if(error)alert(error.message);else if(data.session)location.reload();else alert('E-postandaki bağlantıyla hesabı onayla, sonra giriş yap.')}
 else return _act(a,i)};

/* ---- benim görevlerim, bitiş tarihi, yorumlar, belgeler ---- */
const fmtD=d=>{const x=dt(d);return x.getDate()+' '+AY[x.getMonth()].slice(0,3)};
const myRow=x=>{const pr=PJ.find(p=>p.id==x.project_id)||{};return `<div class="p" data-t="${x.id}"><span class="ck" data-tk="${x.id}"></span><div class="tt">${esc(x.title)}<small>${esc(pr.name||'')}${x.due?' · '+fmtD(x.due):''}</small></div></div>`};
function myRender(){const t=TODAY(),wk=ymd(add(new Date(),7)),mine=TK.filter(x=>x.assignee==ME()&&x.status!='done');
 const g=[['Gecikenler',x=>x.due&&x.due<t],['Bugün',x=>x.due==t],['Bu hafta',x=>x.due>t&&x.due<=wk],['Sonra',x=>!x.due||x.due>wk]];
 $('#app').innerHTML=`<nav><span><button class="mb" data-pa="menu">☰</button></span><span></span></nav><h1>Benim görevlerim<small>${mine.length} açık görev</small></h1>`+g.map(([n,f])=>{const a=mine.filter(f).sort((x,y)=>(x.due||'9').localeCompare(y.due||'9'));return a.length?`<h2>${n}</h2><div class="card">${a.map(myRow).join('')}</div>`:''}).join('')+(mine.length?'':'<p class="hint">Sana atanmış açık görev yok.</p>')}
const _vd=vDay;vDay=function(){const ds=ymd(V.d),a=TK.filter(t=>t.due==ds&&t.status!='done'&&(t.assignee==ME()||(!t.assignee&&PJ.some(p=>p.id==t.project_id&&own(p)))));
 return _vd()+(a.length?`<h2>Planlardan</h2><div class="card">${a.map(myRow).join('')}</div>`:'')};
const docsHtml=(pid,tid)=>`<div class="card">${DOC.filter(d=>d.project_id==pid&&(d.task_id||null)==(tid||null)).map(d=>`<div class="p"><div class="tt" data-dl="${d.id}">📎 ${esc(d.name)}</div><button data-dd="${d.id}">✕</button></div>`).join('')}<label class="row" style="color:var(--ac);cursor:pointer">+ Dosya ekle<input type="file" id="fu" data-pid="${pid}" data-tid="${tid||''}" hidden></label></div>`;
document.addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(e.target.id!='fu'||!f)return;const pid=e.target.dataset.pid,tid=e.target.dataset.tid||null,path=`${pid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]/g,'_')}`;
 const u=await sb.storage.from('docs').upload(path,f);if(u.error)return alert(u.error.message);
 const d={id:crypto.randomUUID(),project_id:pid,task_id:tid,name:f.name,path,size:f.size};DOC.push(d);const r=await sb.from('docs').insert(d);if(r.error)alert(r.error.message);tid?editT(tid):kisiler()});
document.addEventListener('click',async e=>{let x;
 if(x=e.target.closest('[data-dl]')){const d=DOC.find(y=>y.id==x.dataset.dl),w=window.open('','_blank'),r=await sb.storage.from('docs').createSignedUrl(d.path,300);if(r.error){w&&w.close();alert(r.error.message)}else if(w)w.location=r.data.signedUrl;else location.href=r.data.signedUrl}
 else if(x=e.target.closest('[data-dd]')){const d=DOC.find(y=>y.id==x.dataset.dd);if(!confirm('Belge silinsin mi?'))return;DOC=DOC.filter(y=>y.id!=d.id);sb.storage.from('docs').remove([d.path]);sb.from('docs').delete().eq('id',d.id).then(err);d.task_id?editT(d.task_id):kisiler()}});
document.addEventListener('keydown',e=>{if(e.key!='Enter'||e.target.id!='nc')return;const v=e.target.value.trim();if(!v)return;const t=TK.find(x=>x.id==ET),me=(MB.find(m=>m.project_id==t.project_id&&m.email==ME())||{}).name||ME().split('@')[0];
 const c={id:crypto.randomUUID(),task_id:ET,project_id:t.project_id,author:me,body:v};COM.push(c);editT(ET);sb.from('comments').insert(c).then(err)});

/* ---- roller, akış, notlar, oylama, dengeleyici, arşiv, .ics, ses ---- */
const myName=pid=>(MB.find(m=>m.project_id==pid&&m.email==ME())||{}).name||ME().split('@')[0];
const _ds=drawSide;drawSide=function(){_ds();document.querySelectorAll('#side [data-pg]').forEach(b=>{const p=PJ.find(x=>x.id==b.dataset.pg);if(p&&p.archived)b.remove()});
 const a=PJ.filter(p=>p.archived);if(a.length)document.querySelector('#side [data-pa=np]').insertAdjacentHTML('beforebegin',`<button class="si" data-pa="arc" style="color:var(--l2)">Arşiv (${a.length}) ${ARC?'▾':'▸'}</button>`+(ARC?a.map(p=>`<button class="si${P==p.id?' on':''}" data-pg="${p.id}"><i style="background:${p.color}"></i><span>${esc(p.name)}</span></button>`).join(''):''))};
const dstr=s=>new Date(s).toLocaleString('tr',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const akisH=p=>`<div class="card">${ACT.filter(a=>a.project_id==p.id).sort((a,b)=>b.id-a.id).slice(0,40).map(a=>`<div class="p"><div class="tt"><b>${esc(a.actor)}</b> ${esc(a.text)}<small>${dstr(a.created_at)}</small></div></div>`).join('')||'<div class="row"><small>Henüz hareket yok</small></div>'}</div>`;
const notH=p=>{const t=TODAY(),me=NOT.find(n=>n.project_id==p.id&&n.user_id==user.id&&n.day==t)||{},all=NOT.filter(n=>n.project_id==p.id).sort((a,b)=>a.day<b.day?1:-1).slice(0,30);
 return `<h2>Bugünkü notun</h2><div class="card"><input id="n1" placeholder="Ne yaptım" value="${esc(me.did||'')}"><input id="n2" placeholder="Ne yapacağım" value="${esc(me.will||'')}"><input id="n3" placeholder="Neye takıldım" value="${esc(me.block||'')}"></div><button class="big" data-pa="nsv">Kaydet</button><h2>Ekip notları</h2><div class="card">${all.map(n=>`<div class="p"><div class="tt"><b>${esc(n.author)}</b> · ${fmtD(n.day)}<small>${[n.did&&'Yaptı: '+esc(n.did),n.will&&'Yapacak: '+esc(n.will),n.block&&'Takıldı: '+esc(n.block)].filter(Boolean).join(' · ')}</small></div></div>`).join('')||'<div class="row"><small>Henüz not yok</small></div>'}</div>`};
const oyH=p=>`<div class="card">${POL.filter(q=>q.project_id==p.id).map(q=>{const v=VOT.filter(x=>x.poll_id==q.id),my=v.find(x=>x.user_id==user.id);return `<div class="row"><b>${esc(q.question)}</b></div>${q.options.map((o,i)=>{const n=v.filter(x=>x.opt==i).length;return `<button class="row${my&&my.opt==i?' on':''}" data-vt="${q.id}:${i}">${esc(o)} <small>${n} oy${v.length?' · %'+Math.round(n/v.length*100):''}</small></button>`}).join('')}`}).join('')||'<div class="row"><small>Henüz oylama yok</small></div>'}</div>${own(p)?'<button class="big" data-pa="np2">Yeni oylama</button>':''}`;
function balHtml(p){const ms=mem(p).map(m=>[m,TK.filter(t=>t.project_id==p.id&&t.assignee==m.email&&t.status!='done').length]).sort((a,b)=>b[1]-a[1]);if(ms.length<2)return'';
 const hi=ms[0],lo=ms[ms.length-1];if(hi[1]-lo[1]<3)return'';
 return `<div class="card"><div class="p"><div class="tt">⚖️ ${esc(hi[0].name)}'de ${hi[1]} açık görev var, ${esc(lo[0].name)}'de ${lo[1]}<small>Bir görevi dengelemek ister misin?</small></div>${own(p)?`<button data-pa="bal" data-i="${hi[0].email}|${lo[0].email}">Dengele</button>`:''}</div></div>`}
const _pr=planRender;planRender=function(p){_pr(p);const sg=$('.seg');
 sg.insertAdjacentHTML('beforeend',[['akis','Akış'],['not','Notlar'],['oy','Oylar']].map(([k,n])=>`<button data-vw="${k}">${n}</button>`).join(''));
 sg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.vw==V2));
 if(V2=='kisi')$('.cols').insertAdjacentHTML('beforebegin',balHtml(p));
 const x={akis:akisH,not:notH,oy:oyH}[V2];if(x)$('.cols').outerHTML=x(p)};
function ics(){const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Plan//TR'],d8=s=>s.replace(/-/g,''),st='DTSTAMP:'+new Date().toISOString().replace(/[-:.]/g,'').slice(0,15)+'Z';
 plans.filter(p=>!p.done).forEach(p=>L.push('BEGIN:VEVENT','UID:'+p.id,st,p.time?`DTSTART:${d8(p.day)}T${p.time.replace(':','')}00`:`DTSTART;VALUE=DATE:${d8(p.day)}`,'SUMMARY:'+p.title,'END:VEVENT'));
 TK.filter(t=>t.due&&t.assignee==ME()&&t.status!='done').forEach(t=>L.push('BEGIN:VEVENT','UID:'+t.id,st,`DTSTART;VALUE=DATE:${d8(t.due)}`,'SUMMARY:'+t.title,'END:VEVENT'));
 L.push('END:VCALENDAR');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));a.download='plan.ics';a.click()}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR)$('#qf').insertAdjacentHTML('afterbegin','<button type="button" id="mic" aria-label="Sesle ekle">🎤</button>');
document.addEventListener('click',e=>{
 if(e.target.closest('#mic')){const R=new SR();R.lang='tr-TR';R.onresult=ev=>{$('#q').value=ev.results[0][0].transcript;$('#q').focus()};R.start();return}
 const x=e.target.closest('[data-vt]');if(!x)return;const [id,o]=x.dataset.vt.split(':');
 VOT=VOT.filter(v=>!(v.poll_id==id&&v.user_id==user.id));VOT.push({poll_id:id,user_id:user.id,opt:+o});render();
 sb.from('votes').upsert({poll_id:id,opt:+o,user_id:user.id},{onConflict:'poll_id,user_id'}).then(err)});
const _pb=pact;
pact=async function(a,i){const p=cur();
 if(a=='rl'){const m=MB.find(x=>x.id==i);m.role=m.role=='member'?'editor':m.role=='editor'?'viewer':'member';cacheP();kisiler();render();sb.from('project_members').update({role:m.role}).eq('id',i).then(err)}
 else if(a=='ar'){p.archived=!p.archived;cacheP();close();P='cal';render(1);sb.from('projects').update({archived:p.archived}).eq('id',p.id).then(err)}
 else if(a=='arc'){ARC=!ARC;drawSide()}
 else if(a=='bal'){const [x,y]=i.split('|'),t=TK.filter(k=>k.project_id==P&&k.assignee==x&&k.status!='done').sort((m,n)=>n.pos-m.pos)[0];if(t){t.assignee=y;cacheP();render();sb.from('tasks').update({assignee:y}).eq('id',t.id).then(err)}}
 else if(a=='nsv'){const t=TODAY(),r={project_id:P,user_id:user.id,author:myName(P),day:t,did:$('#n1').value.trim(),will:$('#n2').value.trim(),block:$('#n3').value.trim()};
  NOT=NOT.filter(n=>!(n.project_id==P&&n.user_id==user.id&&n.day==t));NOT.push(r);render();sb.from('notes').upsert(r,{onConflict:'project_id,user_id,day'}).then(err)}
 else if(a=='np2')sheet('<div class="card"><input id="pq" placeholder="Soru"><textarea id="po" placeholder="Seçenekler, her satıra bir tane"></textarea></div><button class="big" data-pa="mkp">Oluştur</button>')
 else if(a=='mkp'){const q=$('#pq').value.trim(),o=$('#po').value.split('\n').map(s=>s.trim()).filter(Boolean);if(!q||o.length<2)return alert('Soru ve en az 2 seçenek yaz.');
  const r={id:crypto.randomUUID(),project_id:P,question:q,options:o};POL.push(r);close();render();sb.from('polls').insert(r).then(err)}
 else if(a=='ics')ics()
 else return _pb(a,i)};

/* ---- bağımlılık, tekrar, şablon, PDF özeti ---- */
const blk=t=>{const b=t.blocked_by&&TK.find(x=>x.id==t.blocked_by);return b&&b.status!='done'?b:null};
const tplList=n=>TPL[n]||(TPLS.find(t=>t.name==n)||{tasks:[]}).tasks;
function pdf(){const p=cur(),ts=TK.filter(t=>t.project_id==p.id),pc=Math.round(avg(ts)*100),ms=mem(p);
 const body=[...ms.map(m=>[m.name,m.email]),['Atanmamış','']].map(([n,e])=>{const a=ts.filter(t=>e?t.assignee==e:!ms.some(m=>m.email==t.assignee));if(!a.length)return'';
  return `<h2>${esc(n)} <small>${a.filter(t=>t.status=='done').length}/${a.length}</small></h2><ul>${a.map(t=>`<li>${t.status=='done'?'☑':'☐'} ${esc(t.title)}${t.due?' <i>('+fmtD(t.due)+')</i>':''}${SB.filter(s=>s.task_id==t.id).map(s=>`<div class="s">${s.done?'☑':'☐'} ${esc(s.title)}</div>`).join('')}</li>`).join('')}</ul>`}).join('');
 const w=window.open('','_blank');if(!w)return alert('Açılır pencereye izin ver.');
 w.document.write(`<html><head><meta charset="utf-8"><title>${esc(p.name)}</title><style>body{font:14px -apple-system,Segoe UI,sans-serif;max-width:720px;margin:24px auto;padding:0 16px}h1{margin:0}h2{font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}small{color:#666;font-weight:400}ul{list-style:none;padding:0}li{margin:6px 0}.s{margin-left:22px;color:#444}</style></head><body><h1>${esc(p.name)}</h1><p>${new Date().toLocaleDateString('tr')} · %${pc} tamamlandı · ${ts.filter(t=>t.status=='done').length}/${ts.length} görev${left(p)}</p>${body}</body></html>`);
 w.document.close();w.focus();setTimeout(()=>w.print(),300)}
const _pc=pact;
pact=async function(a,i){const p=cur();
 if(a=='pdf')pdf();
 else if(a=='ts'){const n=prompt('Şablon adı?',p.name);if(!n)return;const r={id:crypto.randomUUID(),name:n.trim(),tasks:TK.filter(t=>t.project_id==p.id).sort((x,y)=>x.pos-y.pos).map(t=>t.title)};TPLS.push(r);sb.from('templates').insert(r).then(x=>{err(x);if(!x.error)alert('Şablon kaydedildi, yeni plan açarken görünecek.')})}
 else return _pc(a,i)};

/* ---- hafta sayfası, bugün şeritleri, blok rafı ---- */
let WSL=null,WK='',LD=0;
const by=(a,b)=>((a.pos||0)-(b.pos||0))||(a.time||'99').localeCompare(b.time||'99');
const stOf=p=>p.status||(p.done?'done':'todo');
const sp=p=>(p.spent||0)+(stOf(p)=='doing'&&p.started_at?Math.round((Date.now()-new Date(p.started_at))/6e4):0);
function setStatus(p,s){if(stOf(p)=='doing'&&p.started_at){p.spent=(p.spent||0)+Math.round((Date.now()-new Date(p.started_at))/6e4);p.started_at=null}
 if(s=='doing')p.started_at=new Date().toISOString();p.status=s;p.done=s=='done'}
const _sv=save;save=async function(p){pushUndo();if(!p.kind)p.kind=p.time?'plan':'task';hashArea(p);if(p.done&&p.status!='done')setStatus(p,'done');else if(!p.done&&p.status=='done')p.status='todo';spawn(p);return _sv(p)};
const pc=p=>{const s=stOf(p),m=sp(p);return `<div class="pc${p.done?' done':''}${p.kind=='note'?' nt':''}" data-id="${p.id}" style="--ac2:${AC[p.area]||'transparent'}">${p.kind=='note'?'<span>📝</span>':`<span class="dt ${s}" data-st="${p.id}"></span>`}<div class="tt">${p.icon?p.icon+' ':''}${esc(p.title)}<small>${[p.time,m?m+' dk':'',(p.kind=='list'||p.kind=='goal')?lp(p):'',p.kind=='note'&&p.body?esc(p.body.slice(0,40)):''].filter(Boolean).join(' · ')}</small></div>${p.day?'':`<button class="nx" data-bf="${p.id}" aria-label="Boşluk bul">⌖</button>`}<button class="nx" data-nx="${p.id}" aria-label="Yarına at">→</button></div>`};
const dueBand=()=>{const ds=ymd(V.d),a=TK.filter(t=>t.due==ds&&t.status!='done'&&(t.assignee==ME()||(!t.assignee&&PJ.some(p=>p.id==t.project_id&&own(p)))));return a.length?`<h2>Planlardan</h2><div class="card">${a.map(myRow).join('')}</div>`:''};
vWeek=function(){const s=mon(V.d),e=add(s,6),t=TODAY(),sh=d=>AY[d.getMonth()].slice(0,3);if(WK!=ymd(s)){WK=ymd(s);WSL=null}
 let h=`<h1>${s.getDate()} ${sh(s)} – ${e.getDate()} ${sh(e)}</h1><div class="wk7">`,mins=0;
 for(let i=0;i<7;i++){const d=add(s,i),ds=ymd(d),a=plans.filter(p=>p.day===ds&&isCard(p)).sort(by),w=ld(ds);a.forEach(p=>mins+=sp(p));
  h+=`<div class="wc${ds===t?' t':''}"><div class="wh" data-g="day:${ds}"><b>${GN[d.getDay()].slice(0,3)}</b> ${d.getDate()}</div><div class="m${w>=7?' hot':''}"><i style="width:${Math.min(100,w*12.5)}%"></i></div><div class="wl" data-d="${ds}">${a.map(pc).join('')}</div></div>`}
 return h+`</div><h2>Havuz · tarihsiz işler</h2><div class="wl pool" data-d="">${plans.filter(p=>!p.day&&!p.done).sort(by).map(pc).join('')}</div>`+(mins?`<p class="hint">Bu hafta ${Math.floor(mins/60)} sa ${mins%60} dk odaklandın.</p>`:'')};
vDay=function(){const ds=ymd(V.d),t=TODAY(),a=plans.filter(p=>p.day===ds&&isCard(p)).sort(by),tm=a.filter(p=>p.time&&p.kind!='note');
 let h=`<h1>${V.d.getDate()} ${AY[V.d.getMonth()]}<small>${GN[V.d.getDay()]}</small></h1>`;
 if(tm.length)h+=`<div class="strip">${tm.map(p=>`<span class="chip${p.done?' done':''}" data-id="${p.id}">${p.time} ${esc(p.title)}</span>`).join('')}</div>`;
 h+=`<!--L--><div class="lanes">${[['todo','Yapılacak'],['doing','Yapılıyor'],['done','Yapıldı']].map(([s,n])=>{const l=a.filter(p=>stOf(p)==s);return `<div class="ln-w st-${s}"><h3>${n}<small>${s=='doing'?l.length+'/3':l.length}</small></h3><div class="ln" data-s="${s}">${l.map(pc).join('')}</div></div>`}).join('')}</div><!--/L-->`;
 const rest=a.filter(p=>!p.done).length;if(rest&&ds>=t)h+=`<button class="big" data-pa="roll" data-i="${ds}">Kalanları yarına kaydır (${rest})</button>`;
 if(ds===t){const s=plans.filter(p=>p.day&&p.day<t&&!p.done&&isCard(p));if(s.length)h+=`<h2>Kayanlar</h2><div class="card slid">${s.map(row).join('')}</div>`}
 return h+dueBand()+(a.length?'':'<p class="hint">☕ Bugün bomboş, ne güzel. İstersen raftan bir taş sürükle.</p>')};
function dropPlan(e,mode){const id=e.item.dataset.id;if(!id)return;pushUndo();LM=id;const p=plans.find(x=>x.id==id),ch=new Set([p]);
 if(mode=='w'){const od=p.day;p.day=e.to.dataset.d||null;if(od&&p.day&&p.day>od&&!p.done)p.moved=(p.moved||0)+1}
 else if(mode=='b'){p.band=e.to.dataset.b||null;if(p.time&&bandOf(p)!=(p.band||''))p.time=null}
 else if(mode=='t'){p.time=e.to.dataset.h+':00';if(p.kind=='task')p.kind='plan'}
 else{const s=e.to.dataset.s;if(s=='doing'&&plans.filter(x=>x.day==p.day&&x.status=='doing'&&x.id!=p.id).length>=3&&!confirm('Yapılıyor şeridinde 3 iş var. Yine de eklensin mi?')){setTimeout(render,0);return}setStatus(p,s)}
 for(const l of new Set([e.to,e.from]))[...l.children].forEach((el,i)=>{const x=plans.find(y=>y.id==el.dataset.id);if(x){x.pos=i;ch.add(x)}});
 ch.forEach(x=>{x.remind_at=remind(x);x.notified=false});cache();setTimeout(render,0);sb.from('plans').upsert([...ch]).then(r=>r.error&&offq([...ch],r.error))}
function tileAdd(e){const k=e.item.dataset.tile;if(!k)return;e.item.remove();newItem(k,e.to.dataset.d!==undefined?e.to.dataset.d:ymd(V.d),e.to.dataset.s||'todo')}
function newItem(k,d,s){sheet(`<h2>${{plan:'Yeni plan',task:'Yeni görev',note:'Yeni not'}[k]}</h2><div class="card"><input id="ni" placeholder="Başlık">${k=='plan'?'<input id="nt" type="time">'+rmSel({}):''}${k=='plan'||k=='task'?rpSel({}):''}${k=='plan'||k=='task'||k=='list'?areaSel()+iconSel({}):''}${k=='note'?'<textarea id="nb" placeholder="Yaz…"></textarea>':''}<input id="nd" type="date" value="${d||''}"></div><button class="big" data-pa="nk" data-i="${k}|${s}">Ekle</button>`);$('#ni').focus()}
function roll(ds){pushUndo();const nx=ymd(add(dt(ds),1)),a=plans.filter(p=>p.day==ds&&!p.done&&isCard(p));a.forEach(p=>{if(stOf(p)=='doing')setStatus(p,'todo');p.moved=(p.moved||0)+1;p.day=nx;p.remind_at=remind(p);p.notified=false});cache();render();sb.from('plans').upsert(a).then(r=>r.error&&offq(a,r.error))}
function cyc(id){pushUndo();LM=id;const p=plans.find(x=>x.id==id),s={todo:'doing',doing:'done',done:'todo'}[stOf(p)];
 if(s=='doing'&&plans.filter(x=>x.day==p.day&&x.status=='doing'&&x.id!=p.id).length>=3&&!confirm('Yapılıyor şeridinde 3 iş var. Yine de eklensin mi?'))return;setStatus(p,s);save(p)}
function nxt(id){pushUndo();const p=plans.find(x=>x.id==id);p.day=ymd(add(dt(p.day||TODAY()),1));p.moved=(p.moved||0)+1;if(stOf(p)=='doing')setStatus(p,'todo');save(p)}
function afterCal(){badge();polish();const w=$('.wk7');if(w){const t=$('.wc.t');w.scrollLeft=WSL!=null?WSL:t?t.offsetLeft-(w.clientWidth-t.clientWidth)/2:0}
 }
$('#bar').insertAdjacentHTML('afterbegin','<div id="dock"><button class="tile" data-tile="plan">🕒<small>Plan</small></button><button class="tile" data-tile="task">☑️<small>Görev</small></button><button class="tile" data-tile="note">📝<small>Not</small></button><button class="tile" data-tile="list">📋<small>Liste</small></button><button class="tile" data-tile="goal">🎯<small>Hedef</small></button><button class="tile" data-tile="season">🌤️<small>Dönem</small></button></div>');

document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('wk7'))WSL=e.target.scrollLeft},true);
document.addEventListener('click',e=>{const t=e.target;let x;
 if(x=t.closest('[data-st]')){e.stopImmediatePropagation();cyc(x.dataset.st)}
 else if(x=t.closest('[data-nx]')){e.stopImmediatePropagation();nxt(x.dataset.nx)}
 else if(x=t.closest('[data-tile]')){if(Date.now()-LD>300)newItem(x.dataset.tile,V.l=='day'?ymd(V.d):TODAY(),'todo')}},true);
const _pn=pact;
pact=async function(a,i){
 if(a=='nk'){const [k,s]=i.split('|'),r={id:crypto.randomUUID(),title:$('#ni').value.trim(),day:$('#nd').value||null,time:k=='plan'?($('#nt').value||null):null,weight:1,done:s=='done',status:s,kind:k,body:k=='note'?($('#nb').value.trim()||null):null,pos:9999};if(!r.title)return;close();save(r)}
 else if(a=='roll'){roll(i);close()}
 else return _pn(a,i)};

/* ---- tek ekle paleti, liste, hedef, dönem ---- */
const isCard=p=>!['season','goal'].includes(p.kind);
const ICON={plan:'🕒',task:'☑️',list:'📋',note:'📝',goal:'🎯',season:'🌤️'},NAME={plan:'Plan',task:'Görev',list:'Liste',note:'Not',goal:'Hedef',season:'Dönem'};
const ORDER={year:['season','goal','plan','task','list','note'],month:['goal','plan','season','task','list','note'],week:['task','plan','list','goal','note','season'],day:['plan','task','note','list','goal','season']};
let LID=null;
const lp=p=>{const l=(p.body||'').split('\n').filter(Boolean);return l.length?l.filter(x=>x[1]=='x').length+'/'+l.length:''};
function addPal(){document.body.classList.remove('sd');sheet(`<div class="card"><input id="pi" placeholder="yarın 15:00 diş hekimi ya da süt al" enterkeyhint="done" autocomplete="off"></div><div class="grid">${ORDER[V.l].map(k=>`<button class="tl" data-tp2="${k}">${ICON[k]}<small>${NAME[k]}</small></button>`).join('')}</div>`);$('#pi').focus()}
function newItem(k,d,s,t=''){const N={plan:'Yeni plan',task:'Yeni görev',list:'Yeni liste',note:'Yeni not',goal:'Yeni hedef',season:'Yeni dönem'};
 sheet(`<h2>${N[k]}</h2><div class="card"><input id="ni" placeholder="Başlık" value="${esc(t)}">${k=='plan'?'<input id="nt" type="time">'+rmSel({}):''}${k=='plan'||k=='task'?rpSel({}):''}${k=='plan'||k=='task'||k=='list'?areaSel()+iconSel({}):''}${k=='goal'?`<select id="ns"><option value="week">Haftalık hedef</option><option value="month"${V.l=='month'?' selected':''}>Aylık hedef</option><option value="year"${V.l=='year'?' selected':''}>Yıllık hedef</option></select>`:''}${k=='season'?`<select id="nc">${COL.map((c,i)=>`<option value="${c}">Renk ${i+1}</option>`).join('')}</select>`:''}${k=='note'?'<textarea id="nb" placeholder="Yaz…"></textarea>':''}${k=='list'||k=='goal'?`<textarea id="nb" placeholder="${k=='goal'?'Adımlar, her satıra bir tane':'Maddeler, her satıra bir tane'}"></textarea>`:''}<input id="nd" type="date" value="${d||''}">${k=='season'?`<input id="ne" type="date" value="${ymd(add(dt(d||TODAY()),6))}">`:''}</div><button class="big" data-pa="nk" data-i="${k}|${s}">Ekle</button>`);$('#ni').focus()}
function listSheet(id){LID=id;const p=plans.find(x=>x.id==id);
 if(p.kind=='season')return sheet(`<h2>${esc(p.title)}</h2><p class="hint">${fmtD(p.day)} – ${fmtD(p.end_day||p.day)}</p><div class="card"><button class="row red" data-pa="pdl" data-i="${id}">Sil</button></div>`);
 const ls=(p.body||'').split('\n').filter(Boolean);
 sheet(`<h2>${esc(p.title)}</h2><div class="card">${ls.map((l,i)=>`<div class="p${l[1]=='x'?' done':''}"><span class="ck" data-li="${id}:${i}"></span><div class="tt">${esc(l.slice(4))}</div><button data-ld="${id}:${i}">✕</button></div>`).join('')}<input id="nl" placeholder="${p.kind=='goal'?'Adım':'Madde'} ekle, Enter"></div><div class="card"><button class="row red" data-pa="pdl" data-i="${id}">Sil</button></div>`)}
function lineOp(ref,op){const [id,i]=ref.split(':'),p=plans.find(x=>x.id==id),l=(p.body||'').split('\n').filter(Boolean);
 if(op=='t')l[i]=(l[i][1]=='x'?'[ ] ':'[x] ')+l[i].slice(4);else l.splice(+i,1);p.body=l.join('\n')||null;save(p);listSheet(id)}
const sInRange=(a,b)=>plans.filter(p=>p.kind=='season'&&p.day<=b&&(p.end_day||p.day)>=a);
const sChips=(a,b)=>{const s=sInRange(a,b);return s.length?`<div class="strip">${s.map(p=>`<span class="chip" style="background:${p.color||'#0a84ff'}30;color:${p.color||'#0a84ff'}" data-id="${p.id}">${esc(p.title)} · ${fmtD(p.day)}–${fmtD(p.end_day||p.day)}</span>`).join('')}</div>`:''};
const sameP=(d,ds,sc)=>sc=='year'?d.slice(0,4)==ds.slice(0,4):sc=='month'?d.slice(0,7)==ds.slice(0,7):ymd(mon(dt(d)))==ymd(mon(dt(ds)));
const gBand=(sc,ds)=>{const a=plans.filter(p=>p.kind=='goal'&&p.day&&(p.props||{}).scope==sc&&sameP(p.day,ds,sc));
 return a.length?`<h2>Hedefler</h2><div class="card">${a.map(g=>{const l=(g.body||'').split('\n').filter(Boolean),n=l.filter(x=>x[1]=='x').length,q=l.length?Math.round(n/l.length*100):0;return `<div class="p" data-id="${g.id}"><span class="rg" style="--p:${q}"><b>${q}</b></span><div class="tt">${esc(g.title)}<small>${n}/${l.length} adım</small></div></div>`}).join('')}</div>`:''};
const _vy=vYear,_vm=vMonth,_vw=vWeek,_vdy=vDay;
vYear=function(){const y=V.d.getFullYear();const h=_vy().replace(/(<i class="dot[^"]*" style="[^"]*)(" data-g="day:(\d{4}-\d{2}-\d{2})")/g,(m,a,b,d)=>{const s=sInRange(d,d)[0];return a+(s?`;box-shadow:0 0 0 2px ${s.color||'#0a84ff'}`:'')+b});
 return h.replace('</h1>','</h1>'+sChips(y+'-01-01',y+'-12-31')+gBand('year',ymd(V.d)))};
vMonth=function(){const y=V.d.getFullYear(),m=V.d.getMonth(),a=`${y}-${p2(m+1)}-01`,b=`${y}-${p2(m+1)}-${p2(new Date(y,m+1,0).getDate())}`;return _vm().replace('</h1>','</h1>'+sChips(a,b)+gBand('month',a))};
vWeek=function(){const s=mon(V.d);return _vw().replace('</h1>','</h1>'+sChips(ymd(s),ymd(add(s,6)))+gBand('week',ymd(s)))};
vDay=function(){const ds=ymd(V.d);return _vdy().replace('</h1>','</h1>'+sChips(ds,ds))};
$('#qf').insertAdjacentHTML('afterbegin','<button type="button" id="pl" aria-label="Ekle paleti">⊞</button>');
document.addEventListener('click',e=>{const t=e.target;let x;
 if(x=t.closest('[data-li]')){e.stopImmediatePropagation();lineOp(x.dataset.li,'t')}
 else if(x=t.closest('[data-ld]')){e.stopImmediatePropagation();lineOp(x.dataset.ld,'d')}
 else if((x=t.closest('[data-id]'))&&Date.now()-LD>300){const p=plans.find(y=>y.id==x.dataset.id);if(p&&['list','goal','season'].includes(p.kind)){e.stopImmediatePropagation();listSheet(p.id)}}
 else if(x=t.closest('[data-tp2]')){const k=x.dataset.tp2,v=$('#pi')?$('#pi').value:'';close();newItem(k,ymd(V.d),'todo',v)}
 else if(t.closest('#pl'))addPal()},true);
document.addEventListener('keydown',e=>{const tg=document.activeElement.tagName;
 if(e.key=='/'&&user&&P=='cal'&&!/INPUT|TEXTAREA|SELECT/.test(tg)){e.preventDefault();addPal()}
 else if(e.key=='Enter'&&e.target.id=='pi'&&e.target.value.trim()){quick(e.target.value);close()}
 else if(e.key=='Enter'&&e.target.id=='nl'&&e.target.value.trim()){const p=plans.find(x=>x.id==LID);p.body=((p.body||'')+'\n[ ] '+e.target.value.trim()).trim();save(p);listSheet(LID)}});
const _pq=pact;
pact=async function(a,i){
 if(a=='nk'){const [k,s]=i.split('|'),b=($('#nb')?$('#nb').value:'').trim(),r={id:crypto.randomUUID(),title:$('#ni').value.trim(),day:$('#nd').value||null,time:k=='plan'?($('#nt').value||null):null,weight:1,done:false,status:s,kind:k,pos:9999,remind_min:$('#erm')?+$('#erm').value:null,repeat:$('#erp')?($('#erp').value||null):null,area:$('#na')?($('#na').value||null):null,icon:$('#eic')?($('#eic').value||null):null,
   body:k=='note'?(b||null):(k=='list'||k=='goal')?(b.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>'[ ] '+x).join('\n')||null):null};
  if(k=='goal')r.props={scope:$('#ns').value};if(k=='season'){r.end_day=$('#ne').value||r.day;r.color=$('#nc').value}
  if(!r.title)return;close();save(r)}
 else if(a=='pdl'){softDel(i);close()}
 else return _pq(a,i)};

/* ---- takvim için kendi sürükle-bırak (Sortable yerine) ---- */
let DG=null;
const zone=(x,y)=>{const el=document.elementFromPoint(x,y),c=el&&el.closest('.wc,.ln-w,.col');return c?c.querySelector('.wl,.ln,.list'):el&&el.closest('.pool,.hr')};
function dgStart(c,x,y){const r=c.getBoundingClientRect(),g=c.cloneNode(true);g.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;margin:0;pointer-events:none;z-index:9999;opacity:.92;box-shadow:0 8px 24px rgba(0,0,0,.35)`;
 document.body.appendChild(g);DG.g=g;DG.ox=x-r.left;DG.oy=y-r.top;DG.on=true;if(!DG.tile)c.classList.add('gh');document.body.classList.add('dragging')}
function dgMove(x,y){DG.g.style.left=x-DG.ox+'px';DG.g.style.top=y-DG.oy+'px';
 document.querySelectorAll('.over').forEach(e=>e.classList.remove('over'));const z=zone(x,y);if(z)z.classList.add('over');
 const w=document.querySelector('.wk7,.lanes,.cols');if(w){const b=w.getBoundingClientRect();if(x>b.right-40)w.scrollLeft+=14;else if(x<b.left+40)w.scrollLeft-=14}
 if(y<80)scrollBy(0,-12);else if(y>innerHeight-110)scrollBy(0,12)}
function dgEnd(x,y,cancel){DG.g.remove();document.body.classList.remove('dragging');document.querySelectorAll('.over').forEach(e=>e.classList.remove('over'));
 const c=DG.c,tile=DG.tile,z=!cancel&&zone(x,y);c.classList.remove('gh');DG=null;if(!z)return;
 if(tile)return newItem(tile,z.dataset.d!==undefined?z.dataset.d:ymd(V.d),z.dataset.s||'todo');
 const from=c.parentElement,nx=[...z.children].filter(k=>k!==c&&k.classList.contains(c.classList.contains('tk')?'tk':'pc')).find(k=>{const r=k.getBoundingClientRect();return y<r.top+r.height/2});
 nx?z.insertBefore(c,nx):z.appendChild(c);c.classList.contains('tk')?dropped({item:c,to:z,from}):dropPlan({item:c,to:z,from},z.dataset.h!==undefined?'t':z.dataset.b!==undefined?'b':z.classList.contains('ln')?'s':'w')}
document.addEventListener('pointerdown',e=>{if(e.pointerType=='mouse'&&e.button!==0)return;const c=e.target.closest('.pc,.tile[data-tile],.tk');if(!c||e.target.closest('[data-st],[data-nx],[data-tk]')||(c.classList.contains('tk')&&!own(cur())))return;
 DG={c,tile:c.dataset.tile||null,x:e.clientX,y:e.clientY,on:false,touch:e.pointerType!='mouse',id:e.pointerId};
 if(DG.touch)DG.t=setTimeout(()=>{if(DG&&!DG.on)dgStart(c,DG.x,DG.y)},180)});
document.addEventListener('pointermove',e=>{if(!DG||e.pointerId!==DG.id)return;
 if(!DG.on){if(Math.hypot(e.clientX-DG.x,e.clientY-DG.y)<=(DG.touch?10:5))return;if(DG.touch){clearTimeout(DG.t);DG=null;return}dgStart(DG.c,DG.x,DG.y)}
 dgMove(e.clientX,e.clientY)});
document.addEventListener('pointerup',e=>{if(!DG||e.pointerId!==DG.id)return;clearTimeout(DG.t);if(DG.on){LD=Date.now();dgEnd(e.clientX,e.clientY,false)}else DG=null});
document.addEventListener('pointercancel',()=>{if(DG&&DG.on)dgEnd(0,0,true);else DG=null});
document.addEventListener('touchmove',e=>{if(DG&&DG.on)e.preventDefault()},{passive:false});

/* ===== büyük paket: geri al, çöp, çevrimdışı, tekrar, bantlar, çizelge, özetler, paylaşım... ===== */
const MC=['#4a78e8','#a259e6','#27a36f','#d9528f','#2e9e4f','#e8832a','#e0603a','#c98a00','#c2570c','#7a5af8','#2f7de1','#5c6bc0'],MEM=['❄️','💜','🌱','🌸','🌷','☀️','🏖️','🌻','🍂','🎃','🍁','⛄'];
const AREAS=['İş','Okul','Kişisel','Spor','Sosyal','Ev'],RM=[[15,'15 dk önce'],[5,'5 dk önce'],[60,'1 saat önce'],[1440,'1 gün önce'],[0,'Tam zamanında'],[-1,'Hatırlatma yok']],RP=[['','Tekrarlamaz'],['daily','Her gün'],['weekdays','Hafta içi her gün'],['weekly','Her hafta'],['monthly','Her ay']];
const rmSel=p=>`<select id="erm">${RM.map(([v,n])=>`<option value="${v}"${(p.remind_min==null?15:p.remind_min)==v?' selected':''}>${n}</option>`).join('')}</select>`;
const rpSel=p=>`<select id="erp">${RP.map(([v,n])=>`<option value="${v}"${(p.repeat||'')==v?' selected':''}>${n}</option>`).join('')}</select>`;
const areaSel=()=>'<select id="na"><option value="">Alan: yok</option>'+AREAS.map(a=>`<option>${a}</option>`).join('')+'</select>';
let TRASH=[],UND=[],UT=0,DM='serit',YM='load',WX=JSON.parse(localStorage.getItem('wx')||'null'),SU2=0;
const SH=new URLSearchParams(location.search).get('paylas');
function theme(){document.documentElement.style.setProperty('--ac',MC[(P=='cal'?V.d:new Date()).getMonth()])}
function toast(m,fn){let t=$('#toast');if(!t){document.body.insertAdjacentHTML('beforeend','<div id="toast"></div>');t=$('#toast')}t.innerHTML=`<button>${m}</button>`;t.firstChild.onclick=()=>{t.style.display='none';fn&&fn()};t.style.display='block';clearTimeout(t.t);t.t=setTimeout(()=>t.style.display='none',5000)}
function pushUndo(){if(Date.now()-UT<400)return;UT=Date.now();UND.push(JSON.stringify(plans));if(UND.length>10)UND.shift();toast('↶ Geri al',undo)}
function undo(){const s=UND.pop();if(!s)return;const old=JSON.parse(s),cur=new Map(plans.map(p=>[p.id,p])),back=old.filter(o=>JSON.stringify(cur.get(o.id))!=JSON.stringify(o)),gone=plans.filter(p=>!old.some(o=>o.id==p.id));
 plans=old;TRASH=TRASH.filter(t=>!old.some(o=>o.id==t.id));cache();render();if(back.length)sb.from('plans').upsert(back).then(r=>r.error&&offq(back,r.error));if(gone.length)sb.from('plans').delete().in('id',gone.map(g=>g.id))}
function softDel(id){pushUndo();const x=plans.find(p=>p.id==id);if(!x)return;x.deleted_at=new Date().toISOString();TRASH.push(x);plans=plans.filter(p=>p.id!=id);cache();render();sb.from('plans').update({deleted_at:x.deleted_at}).eq('id',id).then(r=>r.error&&alert(r.error.message))}
function trashSheet(){sheet(`<h2>Silinenler (30 gün saklanır)</h2><div class="card">${TRASH.map(p=>`<div class="p"><div class="tt">${esc(p.title)}<small>${p.day?fmtD(p.day):'Havuz'}</small></div><button data-rs="${p.id}">Geri getir</button></div>`).join('')||'<div class="row"><small>Boş</small></div>'}</div>`)}
const OQ=()=>JSON.parse(localStorage.getItem('oq')||'[]');
function offq(a,e){if(!navigator.onLine||/fetch|network|load failed/i.test(e.message)){localStorage.setItem('oq',JSON.stringify(OQ().filter(x=>!a.some(y=>y.id==x.id)).concat(a)));toast('Çevrimdışı: bağlanınca gönderilecek')}else alert(e.message)}
async function flushQ(){const q=OQ();if(!q.length||!navigator.onLine)return;const r=await sb.from('plans').upsert(q);if(!r.error)localStorage.removeItem('oq')}
addEventListener('online',flushQ);
const _l2=load;load=async function(){await flushQ();await _l2();wxLoad();sb.from('plans').delete().lt('deleted_at',new Date(Date.now()-30*864e5).toISOString()).then(()=>{})};
function hashArea(p){const m=(p.title||'').match(/(^|\s)#([\wğüşöçıİĞÜŞÖÇ]+)/);if(m&&!p.area){p.area=m[2];p.title=p.title.replace(m[0],'').trim()}}
function spawn(p){if(!p.repeat||!p.done||!p.day)return;const d=dt(p.day);if(p.repeat=='daily')d.setDate(d.getDate()+1);else if(p.repeat=='weekly')d.setDate(d.getDate()+7);else if(p.repeat=='monthly')d.setMonth(d.getMonth()+1);else{do d.setDate(d.getDate()+1);while([0,6].includes(d.getDay()))}
 const n={...p,id:crypto.randomUUID(),day:ymd(d),done:false,status:'todo',started_at:null,spent:0,moved:0};delete n.created_at;p.repeat=null;n.remind_at=remind(n);n.notified=false;plans.push(n);sb.from('plans').insert(n).then(r=>r.error&&offq([n],r.error))}
const bandOf=p=>p.time?(p.time<'12'?'sabah':p.time<'18'?'ogle':'aksam'):(p.band||'');
const bandsHtml=a=>`<div class="lanes">${[['','Gün boyu'],['sabah','Sabah'],['ogle','Öğleden sonra'],['aksam','Akşam']].map(([b,n])=>{const l=a.filter(p=>bandOf(p)==b).sort(by);return `<div class="ln-w"><h3>${n}<small>${l.length}</small></h3><div class="ln" data-b="${b}">${l.map(pc).join('')}</div></div>`}).join('')}</div>`;
const hoursHtml=a=>`<div class="ln-w" style="flex:none;width:auto;margin-bottom:10px"><h3>Zamansız</h3><div class="ln" data-b="">${a.filter(p=>!p.time).sort(by).map(pc).join('')}</div></div><div class="hours">${Array.from({length:24},(_,i)=>p2(i)).filter(h=>+h>=6||a.some(p=>p.time&&p.time.slice(0,2)==h)).map(h=>`<div class="hr" data-h="${h}"><span class="hl">${h}:00</span>${a.filter(p=>p.time&&p.time.slice(0,2)==h).sort(by).map(pc).join('')}</div>`).join('')}</div>`;
const warn=a=>{const w=[],t=a.filter(p=>p.time&&p.kind!='note'&&!p.done).sort((x,y)=>x.time.localeCompare(y.time)),m=s=>+s.slice(0,2)*60+ +s.slice(3);
 for(let i=1;i<t.length;i++)if(m(t[i].time)-m(t[i-1].time)<30)w.push(`${t[i-1].time} ${esc(t[i-1].title)} ve ${t[i].time} ${esc(t[i].title)} çakışıyor`);
 for(const [k,n] of [['sabah','Sabah'],['ogle','Öğleden sonra'],['aksam','Akşam']]){const l=a.filter(p=>!p.done&&bandOf(p)==k);if(l.length>=5||l.reduce((s,p)=>s+(p.weight||1)+1,0)>=10)w.push(`${n} çok dolu (${l.length} iş)`)}
 return w.length?`<div class="card warn">${w.map(x=>`<div class="p"><div class="tt">⚠️ ${x}</div></div>`).join('')}</div>`:''};
const radar=ds=>plans.filter(p=>p.day===ds&&!p.done&&(p.moved||0)>=3&&isCard(p)).map(p=>`<div class="card"><div class="p"><div class="tt">🔁 "${esc(p.title)}" ${p.moved} kez ertelendi<small>Bölelim mi, bırakalım mı?</small></div><button data-rd="${p.id}|split">Böl</button><button data-rd="${p.id}|drop">Bırak</button><button data-rd="${p.id}|keep">Tut</button></div></div>`).join('');
const HOL=(()=>{const o={},mv={2026:[['2026-03-20',3,'Ramazan Bayramı'],['2026-05-27',4,'Kurban Bayramı']],2027:[['2027-03-09',3,'Ramazan Bayramı'],['2027-05-16',4,'Kurban Bayramı']]};
 for(const y of [2026,2027]){[['01-01','Yılbaşı'],['04-23','Ulusal Egemenlik ve Çocuk Bayramı'],['05-01','Emek ve Dayanışma Günü'],['05-19',"Atatürk'ü Anma, Gençlik ve Spor Bayramı"],['07-15','Demokrasi ve Milli Birlik Günü'],['08-30','Zafer Bayramı'],['10-29','Cumhuriyet Bayramı']].forEach(([d,n])=>o[y+'-'+d]=n);o[y+'-10-28']='Cumhuriyet Bayramı arifesi (yarım gün)';
  mv[y].forEach(([s,k,n])=>{o[ymd(add(dt(s),-1))]=n+' arifesi (yarım gün)';for(let i=0;i<k;i++)o[ymd(add(dt(s),i))]=n})}return o})();
const hChips=(a,b)=>{const g={};Object.keys(HOL).filter(d=>d>=a&&d<=b).sort().forEach(d=>{const n=HOL[d];(g[n]=g[n]||{s:d,e:d}).e=d});const k=Object.keys(g);return k.length?`<div class="strip">${k.map(n=>`<span class="chip hol">${esc(n)} · ${fmtD(g[n].s)}${g[n].e>g[n].s?'–'+fmtD(g[n].e):''}</span>`).join('')}</div>`:''};
async function wxLoad(){try{if(WX&&Date.now()-WX.t<36e5)return;const r=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CFG.lat||41.01}&longitude=${CFG.lon||28.97}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`)).json(),d=r.daily,o={t:Date.now()};
 d.time.forEach((x,i)=>{const c=d.weathercode[i];o[x]={i:c==0?'☀️':c<4?'⛅':c<50?'🌫️':c<70?'🌧️':c<80?'❄️':c<85?'🌦️':'⛈️',hi:Math.round(d.temperature_2m_max[i]),lo:Math.round(d.temperature_2m_min[i]),p:d.precipitation_probability_max[i]}});WX=o;localStorage.setItem('wx',JSON.stringify(o));render()}catch(e){}}
const wxChip=ds=>{const w=WX&&WX[ds];return w?` · ${w.i} ${w.hi}°/${w.lo}° · yağış %${w.p}`:''};
const _vd3=vDay,_vy3=vYear,_vm3=vMonth,_vw3=vWeek;
vDay=function(){const ds=ymd(V.d),a=plans.filter(p=>p.day===ds&&isCard(p)),dn=a.filter(p=>p.done).length,q=a.length?Math.round(dn/a.length*100):0;let h=_vd3();
 if(DM=='bant')h=h.replace(/<!--L-->[\s\S]*<!--\/L-->/,bandsHtml(a));else if(DM=='saat')h=h.replace(/<!--L-->[\s\S]*<!--\/L-->/,hoursHtml(a));
 return h.replace('</h1>',`</h1><div class="dayhead"><span class="rg${q==100&&a.length?' cele':''}" style="--p:${q}"><b>${q}%</b></span><div class="tt">${dn}/${a.length} tamam<small>${HOL[ds]?esc(HOL[ds])+wxChip(ds):wxChip(ds).slice(3)}</small></div></div><div class="strip">${[['serit','Şeritler'],['bant','Bantlar'],['saat','Çizelge']].map(([k,n])=>`<span class="chip${DM==k?' on':''}" data-dm="${k}">${n}</span>`).join('')}<span class="chip" data-pa="rt">Rutin ekle</span></div>${warn(a)}${radar(ds)}`)};
vYear=function(){let h=_vy3();if(YM=='focus')h=h.replace(/style="--a:[^";]*([^"]*)" data-g="day:(\d{4}-\d{2}-\d{2})"/g,(m,r,d)=>`style="--a:${Math.min(1,plans.filter(p=>p.day===d).reduce((s,p)=>s+sp(p),0)/120)}${r}" data-g="day:${d}"`);const y=V.d.getFullYear();
 return h.replace('<h1>','<h1 class="hb">').replace('</h1>','</h1>'+hChips(y+'-01-01',y+'-12-31')+`<div class="strip">${[['load','Yoğunluk'],['focus','Odak süresi']].map(([k,n])=>`<span class="chip${YM==k?' on':''}" data-ym="${k}">${n}</span>`).join('')}</div>`)};
vMonth=function(){const y=V.d.getFullYear(),m=V.d.getMonth();return _vm3().replace('<h1>','<h1 class="hb">'+MEM[m]+' ').replace('</h1>','</h1>'+hChips(`${y}-${p2(m+1)}-01`,`${y}-${p2(m+1)}-31`)+'<div class="strip"><span class="chip" data-pa="sm">Ay özeti</span></div>')};
vWeek=function(){const s=mon(V.d),n=new Date(),sun=n.getDay()==0&&n.getHours()>=18&&localStorage.getItem('rvw')!=ymd(mon(n));
 return _vw3().replace('<h1>','<h1 class="hb">').replace('</h1>','</h1>'+hChips(ymd(s),ymd(add(s,6)))+`<div class="strip"><span class="chip${sun?' on':''}" data-pa="rv">${sun?'Pazar akşamı: haftanı değerlendir':'Haftalık değerlendirme'}</span><span class="chip" data-pa="sw">Hafta özeti</span></div>`)};
function badge(){const n=plans.filter(p=>p.day===TODAY()&&!p.done&&isCard(p)).length;if(navigator.setAppBadge)(n?navigator.setAppBadge(n):navigator.clearAppBadge()).catch(()=>{})}
function summary(a,b,title){const ps=plans.filter(p=>p.day&&p.day>=a&&p.day<=b&&isCard(p)),dn=ps.filter(p=>p.done),min=ps.reduce((s,p)=>s+sp(p),0),moved=ps.filter(p=>(p.moved||0)>0).length,days={},ar={};
 dn.forEach(p=>{days[p.day]=(days[p.day]||0)+1;const k=p.area||'Diğer';ar[k]=(ar[k]||0)+1});const best=Object.entries(days).sort((x,y)=>y[1]-x[1])[0],ks=Object.keys(ar),tot=dn.length||1;let c=0;
 const grad=ks.map((k,i)=>{const s=c;c+=ar[k]/tot*100;return `${COL[i%COL.length]} ${s}% ${c}%`}).join(',');
 sheet(`<h2>${title}</h2><div class="card"><div class="p"><div class="tt">Tamamlanan<small>${dn.length}/${ps.length} iş</small></div></div><div class="p"><div class="tt">Odaklanma<small>${Math.floor(min/60)} sa ${min%60} dk</small></div></div>${best?`<div class="p"><div class="tt">En verimli gün<small>${fmtD(best[0])} · ${best[1]} iş</small></div></div>`:''}<div class="p"><div class="tt">Ertelenen<small>${moved} iş en az bir kez kaydı</small></div></div></div>${ks.length?`<h2>Hayat dengesi (alan etiketi için #iş, #spor yaz)</h2><div class="card"><div class="p"><span class="donut" style="background:conic-gradient(${grad})"></span><div class="tt">${ks.map((k,i)=>`<small><i class="sw" style="background:${COL[i%COL.length]}"></i>${esc(k)} · %${Math.round(ar[k]/tot*100)}</small>`).join('')}</div></div></div>`:''}`)}
function review(){const s=mon(V.d),a=ymd(s),b=ymd(add(s,6)),u=plans.filter(p=>p.day&&p.day>=a&&p.day<=b&&!p.done&&isCard(p));localStorage.setItem('rvw',a);
 sheet(`<h2>Haftalık değerlendirme</h2><p class="hint">Bitmeyen ${u.length} iş var. Her biri için karar ver.</p><div class="card">${u.map(p=>`<div class="p"><div class="tt">${esc(p.title)}<small>${fmtD(p.day)}</small></div><button data-rv="${p.id}|next">Yeni hafta</button><button data-rv="${p.id}|pool">Havuz</button><button data-rv="${p.id}|done">Bitti</button></div>`).join('')||'<div class="row"><small>Hepsi tamam</small></div>'}</div>${u.length?'<button class="big" data-pa="rva">Hepsini yeni haftaya geçir</button>':''}<div class="card" style="margin-top:12px"><button class="row" data-pa="sw">Hafta özetini gör</button></div>`)}
function rtSheet(){const r=TPLS.filter(t=>t.kind=='routine');sheet(`<h2>Rutin günler</h2><div class="card">${r.map(t=>`<div class="p"><div class="tt">${esc(t.name)}<small>${t.tasks.length} iş</small></div><button data-ra="${t.id}">Bu güne ekle</button></div>`).join('')||'<div class="row"><small>Henüz rutin yok</small></div>'}</div><div class="card"><button class="row" data-pa="rsv">Bu günü rutin olarak kaydet</button></div>`)}
function bulk(){sheet(`<h2>Toplu ekle</h2><p class="hint">Her satır bir iş. "yarın 15:00 diş hekimi" gibi tarih ve saat yazabilirsin.</p><div class="card"><textarea id="bk" placeholder="Listeyi yapıştır…"></textarea><input id="bd" type="date" value="${ymd(V.d)}"></div><button class="big" data-pa="bkk">Ekle</button>`)}
function bfSheet(id){const p=plans.find(x=>x.id==id),c=[];for(let i=0;i<10;i++){const ds=ymd(add(new Date(),i));if(HOL[ds]&&!HOL[ds].includes('yarım'))continue;c.push([ds,ld(ds)+(dt(ds).getDay()%6==0?3:0)])}
 c.sort((x,y)=>x[1]-y[1]);sheet(`<h2>${esc(p.title)} için boşluk bul</h2><div class="card">${c.slice(0,3).map(([ds,l])=>`<div class="p"><div class="tt">${fmtD(ds)} ${GN[dt(ds).getDay()]}<small>${l<=2?'Çok rahat':l<=5?'Uygun':'Biraz dolu'} · yük ${l}</small></div><button data-bm="${id}|${ds}">Buraya koy</button></div>`).join('')}</div>`)}
async function myToken(){let r=await sb.from('shares').select('token').maybeSingle();if(!r.data)r=await sb.from('shares').insert({}).select('token').single();return r.data&&r.data.token}
async function shareSheet(){const t=await myToken(),u=`${location.origin}${location.pathname}?paylas=${t}`,w=`webcal://${new URL(CFG.url).host}/functions/v1/ics?t=${t}`;
 sheet(`<h2>Paylaş ve abone ol</h2><p class="hint">Bağlantıya sahip herkes önümüzdeki 3 haftalık planlarını sadece görebilir.</p><div class="card"><button class="row" data-cp="${esc(u)}">Salt okunur bağlantıyı kopyala</button><button class="row" data-cp="${esc(w)}">Takvim abonelik bağlantısını kopyala</button><button class="row red" data-pa="shx">Bağlantıları kapat ve yenile</button></div><p class="hint">Aboneliği takvim uygulamanda "Abone takvim ekle" (Google Takvim'de "URL'den") kısmına yapıştır.</p>`)}
async function shareRender(){const r=await sb.rpc('shared_view',{tok:SH}),by={};(r.data||[]).forEach(x=>(by[x.day]=by[x.day]||[]).push(x));$('#bar').style.display='none';
 $('#app').innerHTML=`<h1>Paylaşılan takvim</h1><p class="hint">Salt okunur</p>`+(Object.keys(by).sort().map(d=>`<h2>${fmtD(d)} ${GN[dt(d).getDay()]}</h2><div class="card">${by[d].map(x=>`<div class="p${x.done?' done':''}"><div class="tt">${esc(x.title)}${x.tm?`<small>${x.tm}</small>`:''}</div></div>`).join('')}</div>`).join('')||'<p class="hint">Plan yok</p>')}
const helpSheet=()=>sheet('<h2>Kısayollar</h2><div class="card"><div class="row">/ ya da N · yeni ekle</div><div class="row">T · bugün</div><div class="row">Y · yıl, A · ay, H · hafta, G · gün</div><div class="row">← → · önceki ve sonraki</div><div class="row">Ctrl+Z · geri al</div><div class="row">Ctrl+K · ara</div></div>');
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||!user)return;const k=e.key.toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k=='z'){e.preventDefault();undo();return}
 if(P!='cal'||e.ctrlKey||e.metaKey||e.altKey)return;const L2={y:'year',a:'month',h:'week',g:'day'};
 if(L2[k]){V.l=L2[k];render(1)}else if(k=='t'){V.d=new Date();render()}else if(k=='n'){addPal()}else if(e.key=='?'){helpSheet()}});
document.addEventListener('click',e=>{const t=e.target;let x;
 if(x=t.closest('[data-dm]')){e.stopImmediatePropagation();DM=x.dataset.dm;render()}
 else if(x=t.closest('[data-ym]')){e.stopImmediatePropagation();YM=x.dataset.ym;render()}
 else if(x=t.closest('[data-cp]')){e.stopImmediatePropagation();navigator.clipboard.writeText(x.dataset.cp).then(()=>toast('Kopyalandı'))}
 else if(x=t.closest('[data-bf]')){e.stopImmediatePropagation();bfSheet(x.dataset.bf)}
 else if(x=t.closest('[data-bm]')){e.stopImmediatePropagation();const [id,d]=x.dataset.bm.split('|'),p=plans.find(y=>y.id==id);p.day=d;save(p);close()}
 else if(x=t.closest('[data-rs]')){e.stopImmediatePropagation();const p=TRASH.find(y=>y.id==x.dataset.rs);TRASH=TRASH.filter(y=>y!==p);p.deleted_at=null;plans.push(p);cache();render();sb.from('plans').update({deleted_at:null}).eq('id',p.id).then(()=>{});trashSheet()}
 else if(x=t.closest('[data-rd]')){e.stopImmediatePropagation();const [id,a]=x.dataset.rd.split('|'),p=plans.find(y=>y.id==id);if(a=='drop')softDel(id);else{p.moved=0;if(a=='split'){p.kind='list';save(p);listSheet(id)}else save(p)}}
 else if(x=t.closest('[data-rv]')){e.stopImmediatePropagation();const [id,a]=x.dataset.rv.split('|'),p=plans.find(y=>y.id==id);pushUndo();if(a=='next')p.day=ymd(add(dt(p.day),7));else if(a=='pool')p.day=null;else setStatus(p,'done');save(p);review()}
 else if(x=t.closest('[data-ra]')){e.stopImmediatePropagation();const r=TPLS.find(y=>y.id==x.dataset.ra),ds=ymd(V.d);pushUndo();
  const rows=r.tasks.map(l=>{const m=l.match(/^(\d{1,2}:\d{2})\s+(.*)$/);return {id:crypto.randomUUID(),title:m?m[2]:l,day:ds,time:m?m[1]:null,weight:1,done:false,status:'todo',kind:m?'plan':'task',pos:9999}});
  rows.forEach(r=>{r.remind_at=remind(r);r.notified=false});plans.push(...rows);cache();close();render();sb.from('plans').insert(rows).then(r=>r.error&&offq(rows,r.error))}},true);
const _p5=pact;
pact=async function(a,i){
 if(a=='rt')rtSheet();
 else if(a=='rsv'){const n=prompt('Rutin adı?','Rutinim');if(!n)return;const ds=ymd(V.d),r={id:crypto.randomUUID(),name:n.trim(),kind:'routine',tasks:plans.filter(p=>p.day===ds&&isCard(p)).sort(by).map(p=>(p.time?p.time+' ':'')+p.title)};TPLS.push(r);sb.from('templates').insert(r).then(x=>{err(x);rtSheet()})}
 else if(a=='bulk')bulk();
 else if(a=='bkk'){const base=$('#bd').value||null,rows=$('#bk').value.split('\n').map(l=>l.replace(/^\s*([-*•]|\d+[.)]|\[[ xX]\])\s*/,'').trim()).filter(Boolean).map(l=>{const r=parse(l),dated=/bugün|yarın|öbür|ertesi|\d{1,2}\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)|pazartesi|salı|çarşamba|perşembe|cuma|pazar/i.test(l);return {id:crypto.randomUUID(),title:r.title,day:dated?r.d:base,time:r.tm,weight:1,done:false,status:'todo',kind:r.tm?'plan':'task',pos:9999}});
  if(!rows.length)return;pushUndo();rows.forEach(r=>{r.remind_at=remind(r);r.notified=false});plans.push(...rows);cache();close();render();sb.from('plans').insert(rows).then(r=>r.error&&offq(rows,r.error))}
 else if(a=='sw'){const s=mon(V.d);summary(ymd(s),ymd(add(s,6)),'Hafta özeti')}
 else if(a=='sm'){const y=V.d.getFullYear(),m=V.d.getMonth();summary(`${y}-${p2(m+1)}-01`,`${y}-${p2(m+1)}-31`,AY[m]+' özeti')}
 else if(a=='rv')review()
 else if(a=='rva'){const s=mon(V.d),a1=ymd(s),b1=ymd(add(s,6));pushUndo();const u=plans.filter(p=>p.day&&p.day>=a1&&p.day<=b1&&!p.done&&isCard(p));u.forEach(p=>{p.day=ymd(add(dt(p.day),7));p.moved=(p.moved||0)+1;p.remind_at=remind(p);p.notified=false});cache();close();render();sb.from('plans').upsert(u).then(r=>r.error&&offq(u,r.error))}
 else if(a=='shr')shareSheet()
 else if(a=='shx'){await sb.from('shares').delete().eq('user_id',user.id);shareSheet()}
 else if(a=='trs')trashSheet()
 else if(a=='khp')helpSheet()
 else return _p5(a,i)};

/* ===== canlılık paketi: alt sekmeler, hero, renkler, hareket, ton, kişiselleştirme ===== */
const AC={'İş':'#2f7de1','Okul':'#e8832a','Kişisel':'#d9528f','Spor':'#27a36f','Sosyal':'#a259e6','Ev':'#c98a00'},ICONS=['🦷','🏋️','📚','💼','🛒','🎂','✈️','💊','🧹','🍽️','☎️','🎯'];
const PACKS={'Ay renkleri':'','Okyanus':'#0a7fa8','Orman':'#2e8b57','Gün batımı':'#e0603a','Gece':'#7a5af8'};
const iconSel=p=>`<select id="eic"><option value="">Simge yok</option>${ICONS.map(i=>`<option${p.icon==i?' selected':''}>${i}</option>`).join('')}</select>`;
let LP=0,LM=null;
theme=function(){document.documentElement.style.setProperty('--ac',PACKS[localStorage.getItem('pack')||'']||MC[(P=='cal'?V.d:new Date()).getMonth()])};
function applyLook(){const h=new Date().getHours();document.body.classList.toggle('dense',localStorage.getItem('dense')=='1');document.body.classList.toggle('eve',localStorage.getItem('eve')!='0'&&(h>=19||h<6))}
function nowBar(){const p=plans.find(x=>stOf(x)=='doing'),n=$('#nowbar');if(!n)return;n.style.display=p?'block':'none';if(p)n.innerHTML=`<button class="pill" data-nw="${p.id}">▶ Şimdi: ${esc(p.title)} · ${sp(p)} dk</button>`}
function tabsOn(){document.querySelectorAll('#tabs [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab==(P=='cal'?V.l:'plan')))}
$('#bar').insertAdjacentHTML('afterbegin','<div id="nowbar"></div>');
$('#bar').insertAdjacentHTML('beforeend','<nav id="tabs">'+[['day','Bugün','🌤️'],['week','Hafta','🗓️'],['month','Ay','📅'],['year','Yıl','🧭'],['plan','Planlar','📁']].map(([k,n,i])=>`<button data-tab="${k}"><b>${i}</b>${n}</button>`).join('')+'</nav>');
const streak=()=>{const s=new Set(plans.filter(p=>p.done&&p.day).map(p=>p.day));let d=new Date(),n=0;if(!s.has(ymd(d)))d=add(d,-1);while(s.has(ymd(d))){n++;d=add(d,-1)}return n};
function hero(ds,a){const isT=ds===TODAY(),hr=new Date().getHours(),dn=a.filter(p=>p.done).length,rest=a.length-dn,q=a.length?Math.round(dn/a.length*100):0,dd=dt(ds),np=plans.find(x=>stOf(x)=='doing'),hol=HOL[ds],st=streak();
 const gr=hr<6?'İyi geceler':hr<12?'Günaydın':hr<18?'İyi günler':'İyi akşamlar',sub=!a.length?'bugün boş':rest?`${rest} iş seni bekliyor`:`hepsi tamam, ${dn} iş bitirdin`;
 return `<div class="hero"><div class="hr1"><div><div class="hs">${isT?gr+', '+sub:GN[dd.getDay()]}</div><div class="hd">${dd.getDate()} ${AY[dd.getMonth()]}</div><div class="hs">${isT?GN[dd.getDay()]:''}${wxChip(ds)}${hol?' · '+(hol.includes('Bayram')&&!hol.includes('arife')?'🎉 ':'')+esc(hol):''}${st>=2&&isT?' · 🔥 '+st+' gün üst üste':''}</div></div><span class="rg" data-p="${q}" style="--p:${q}"><b>${q}%</b></span></div>${np?`<div class="pill2">▶ Şimdi: ${esc(np.title)} · ${sp(np)} dk</div>`:''}${isT&&(hr>=18||(a.length&&!rest))?'<button class="hbtn" data-pa="clo">Günü kapat</button>':''}</div>`}
const _vd4=vDay;vDay=function(){const ds=ymd(V.d),a=plans.filter(p=>p.day===ds&&isCard(p));return _vd4().replace(/<h1>[\s\S]*?<\/h1>/,hero(ds,a)).replace(/<div class="dayhead">[\s\S]*?<\/div><\/div>/,'')};
function polish(){document.querySelectorAll('.hero .rg').forEach(el=>{const to=+el.dataset.p,from=LP;LP=to;if(to==from)return;let t0;const f=ts=>{t0=t0||ts;const k=Math.min(1,(ts-t0)/700),v=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));el.style.setProperty('--p',v);el.firstChild.textContent=v+'%';if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f);if(to==100&&from<100)burst()});
 if(LM){const e=document.querySelector(`.pc[data-id="${LM}"]`);if(e)e.classList.add('settle');LM=null}}
function burst(){for(let i=0;i<18;i++){const s=document.createElement('span');s.textContent=['🎉','✨','🎊'][i%3];s.className='cf';s.style.cssText=`left:${Math.random()*100}vw;animation-delay:${Math.random()*.4}s`;document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function closeDay(){const ds=TODAY(),a=plans.filter(p=>p.day===ds&&isCard(p)),dn=a.filter(p=>p.done),min=a.reduce((s,p)=>s+sp(p),0),tm=plans.filter(p=>p.day===ymd(add(new Date(),1))&&isCard(p)).sort(by)[0],rest=a.length-dn.length;
 sheet(`<h2>Günü kapat</h2><div class="card"><div class="p"><div class="tt">Bugün ${dn.length} iş tamamladın<small>${dn.slice(0,5).map(p=>esc(p.title)).join(', ')}</small></div></div><div class="p"><div class="tt">Odaklanma<small>${Math.floor(min/60)} sa ${min%60} dk</small></div></div><div class="p"><div class="tt">Yarının ilk işi<small>${tm?esc(tm.title):'Henüz plan yok'}</small></div></div></div>${rest?`<button class="big" data-pa="roll" data-i="${ds}">Kalan ${rest} işi yarına kaydır</button>`:''}`)}
function lookSheet(){const pk=localStorage.getItem('pack')||'Ay renkleri',dn=localStorage.getItem('dense')=='1',ev=localStorage.getItem('eve')!='0';
 sheet(`<h2>Görünüm</h2><h2>Tema</h2><div class="strip">${Object.keys(PACKS).map(k=>`<span class="chip${pk==k?' on':''}" data-pk2="${k}">${k}</span>`).join('')}</div><h2>Kart yoğunluğu</h2><div class="strip"><span class="chip${dn?'':' on'}" data-dn="0">Rahat</span><span class="chip${dn?' on':''}" data-dn="1">Sıkı</span></div><h2>Akşam teması</h2><div class="strip"><span class="chip${ev?' on':''}" data-ev="1">Otomatik</span><span class="chip${ev?'':' on'}" data-ev="0">Kapalı</span></div>`)}
document.addEventListener('click',e=>{const t=e.target;let x;
 if(x=t.closest('[data-tab]')){e.stopImmediatePropagation();const k=x.dataset.tab;if(k=='plan'){document.body.classList.add('sd');return}P='cal';if(k=='day')V={l:'day',d:new Date()};else V.l=k;render(1)}
 else if(x=t.closest('[data-nw]')){e.stopImmediatePropagation();const p=plans.find(y=>y.id==x.dataset.nw);P='cal';V={l:'day',d:dt(p.day||TODAY())};render(1)}
 else if(x=t.closest('[data-pk2]')){e.stopImmediatePropagation();localStorage.setItem('pack',x.dataset.pk2);theme();lookSheet()}
 else if(x=t.closest('[data-dn]')){e.stopImmediatePropagation();localStorage.setItem('dense',x.dataset.dn);applyLook();lookSheet()}
 else if(x=t.closest('[data-ev]')){e.stopImmediatePropagation();localStorage.setItem('eve',x.dataset.ev);applyLook();lookSheet()}},true);
const _p6=pact;
pact=async function(a,i){if(a=='clo')closeDay();else if(a=='look')lookSheet();else return _p6(a,i)};
