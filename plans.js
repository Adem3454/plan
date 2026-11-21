/* Planlar: paylaşım, roller, alt görevler, kişilere sürükle-bırak */
const COL=['#ff375f','#ff9f0a','#30d158','#0a84ff','#bf5af2','#64d2ff'];
const TPL={'Boş':[],'Hackathon':['Fikir ve kapsam','Tasarım','Frontend','Backend','Sunum'],'Etkinlik':['Mekân','Davetiye','Yemek','Müzik','Bütçe'],'İş projesi':['Hedefleri yaz','Plan çıkar','İlk taslak','Gözden geçir','Teslim']};
const J=k=>JSON.parse(localStorage.getItem(k)||'[]');
let PJ=J('pj'),TK=J('tk'),SB=J('sb'),MB=J('mb'),P='cal',V2='pano',ET=null,rt=null,GO=null,PAL=[],IMP=[];
const cacheP=()=>[['pj',PJ],['tk',TK],['sb',SB],['mb',MB]].forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
const ME=()=>(user.email||'').toLowerCase(),own=p=>p.user_id==user.id,mem=p=>MB.filter(m=>m.project_id==p.id),cur=()=>PJ.find(x=>x.id==P);
const nm=(p,e)=>{const m=mem(p).find(x=>x.email==e);return m?m.name:e},can=(t,p)=>own(p)||t.assignee==ME(),err=r=>r.error&&alert(r.error.message);
const prog=t=>{const s=SB.filter(x=>x.task_id==t.id);return s.length?s.filter(x=>x.done).length/s.length:t.status=='done'?1:0};
const avg=a=>a.length?a.reduce((s,t)=>s+prog(t),0)/a.length:0;

async function loadProj(){const r=await Promise.all(['projects','tasks','subtasks','project_members'].map(t=>sb.from(t).select('*')));
 if(r.some(x=>x.error))return console.warn(r.find(x=>x.error).error.message);
 [PJ,TK,SB,MB]=r.map(x=>x.data);PJ.sort((a,b)=>a.created_at<b.created_at?-1:1);cacheP();if(GO&&PJ.find(x=>x.id==GO)){P=GO;GO=null}render();
 if(!rt)rt=sb.channel('pj').on('postgres_changes',{event:'*',schema:'public'},()=>{clearTimeout(rt.t);rt.t=setTimeout(loadProj,500)}).subscribe()}
const _load=load;load=async function(){await _load();await loadProj()};
const _z=zoom,_s=shift;zoom=d=>P=='cal'&&_z(d);shift=n=>P=='cal'&&_s(n);
const _render=render;
render=function(d){const p=cur();$('#q').placeholder=P=='cal'?'yarın 15:00 diş hekimi':'Görev ekle · @ali pastayı al';
 if(P!='cal'&&!p)P='cal';drawSide();$('#bar').style.display=(p&&!own(p))?'none':'';
 if(P=='cal')return _render(d);
 planRender(p);if(d)$('#app').animate([{opacity:0,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.32,.72,0,1)'})};

function drawSide(){$('#side').innerHTML=`<h2>Planlar</h2><button class="si" data-pa="ck">⌕ Ara · Ctrl+K</button><button class="si${P=='cal'?' on':''}" data-pg="cal"><i style="background:var(--ac)"></i>Takvim</button>${PJ.map(p=>`<button class="si${P==p.id?' on':''}" data-pg="${p.id}"><i style="background:${p.color}"></i><span>${esc(p.name)}${own(p)?'':'<small> · paylaşılan</small>'}</span></button>`).join('')}<button class="si" data-pa="np" style="color:var(--ac)">+ Yeni plan</button>`}
const card=(t,p)=>{const sc=SB.filter(s=>s.task_id==t.id),dn=sc.filter(s=>s.done).length;
 return `<div class="tk${t.status=='done'?' done':''}" data-t="${t.id}"><span class="ck"${can(t,p)?` data-tk="${t.id}"`:''}></span><div class="tt">${esc(t.title)}<small>${[V2=='pano'&&t.assignee?esc(nm(p,t.assignee)):'',sc.length?dn+'/'+sc.length+' alt görev':''].filter(Boolean).join(' · ')}</small></div></div>`};
function planRender(p){const ts=TK.filter(t=>t.project_id==p.id).sort((a,b)=>a.pos-b.pos),pc=Math.round(avg(ts)*100),dn=ts.filter(t=>t.status=='done').length;
 const cols=V2=='kisi'?[['','Atanmamış'],...mem(p).map(m=>[m.email,m.name])]:[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']];
 $('#app').innerHTML=`<nav><span><button class="mb" data-pa="menu">☰</button></span><span><button data-pa="pset">${own(p)?'Kişiler ⋯':'Kişiler'}</button></span></nav><div class="ph" style="--c:${p.color}"><h1>${esc(p.name)}</h1><div class="pb"><i style="width:${pc}%"></i></div><small>${dn}/${ts.length} görev tamam · %${pc} · ${mem(p).length} kişi${left(p)}${own(p)?'':' · sadece kendi görevlerini düzenleyebilirsin'}</small></div><div class="seg"><button data-vw="pano" class="${V2=='pano'?'on':''}">Pano</button><button data-vw="kisi" class="${V2=='kisi'?'on':''}">Kişiler</button></div><div class="cols">${cols.map(([c,n])=>{const a=ts.filter(t=>V2=='kisi'?(t.assignee||'')==c:t.status==c),k=V2=='kisi'&&a.length;
  return `<div class="col"><h3>${esc(n)}<small>${k?Math.round(avg(a)*100)+'%':a.length}</small></h3>${k?`<div class="pb"><i style="width:${avg(a)*100}%"></i></div>`:''}<div class="list" data-c="${esc(c)}">${a.map(t=>card(t,p)).join('')}</div></div>`}).join('')}</div>`;
 document.querySelectorAll('.list').forEach(el=>new Sortable(el,{group:'t',animation:220,delay:150,delayOnTouchOnly:true,ghostClass:'gh',disabled:!own(p),onEnd:dropped}))}
function dropped(e){const c=e.to.dataset.c,t=TK.find(x=>x.id==e.item.dataset.t),ch=new Set();
 if(V2=='kisi')t.assignee=c||null;else t.status=c;
 for(const l of new Set([e.to,e.from]))[...l.children].forEach((el,i)=>{const x=TK.find(y=>y.id==el.dataset.t);if(x){x.pos=i;ch.add(x)}});
 cacheP();setTimeout(render,0);sb.from('tasks').upsert([...ch]).then(err)}
function sync(tid){const t=TK.find(x=>x.id==tid),ss=SB.filter(s=>s.task_id==tid);if(!ss.length)return;const n=ss.filter(x=>x.done).length,st=n==ss.length?'done':n?'doing':'todo';
 if(st!=t.status){t.status=st;sb.from('tasks').update({status:st}).eq('id',tid).then(err)}}
function togT(id){const t=TK.find(x=>x.id==id);if(SB.some(s=>s.task_id==id))return editT(id);t.status=t.status=='done'?'todo':'done';cacheP();render();sb.from('tasks').update({status:t.status}).eq('id',id).then(err)}
function addTask(v){v=v.trim();const p=cur();if(!v||!own(p))return;const m=v.match(/^@(\S+)\s+(.+)/);let a=null;
 if(m){const f=mem(p).find(x=>(x.name+' '+x.email).toLocaleLowerCase(TR).startsWith(m[1].toLocaleLowerCase(TR)));if(f){a=f.email;v=m[2]}}
 const t={id:crypto.randomUUID(),project_id:P,title:v,status:'todo',assignee:a,pos:9999,user_id:user.id};TK.push(t);cacheP();render();sb.from('tasks').insert(t).then(err)}
const sub=(id,fn)=>{fn();sync(SB.find(s=>s.id==id)?.task_id||ET);cacheP();editT(ET);render()};
function editT(id){ET=id;const t=TK.find(x=>x.id==id),p=cur(),o=own(p),c=can(t,p),ss=SB.filter(s=>s.task_id==id).sort((a,b)=>a.pos-b.pos);
 sheet(`<div class="card">${o?`<input id="tt" value="${esc(t.title)}">`:`<div class="row">${esc(t.title)}</div>`}</div>${o?`<div class="card"><select id="ta"><option value="">Atanmamış</option>${mem(p).map(m=>`<option value="${esc(m.email)}"${m.email==t.assignee?' selected':''}>${esc(m.name)}</option>`).join('')}</select></div>`:`<p class="hint">Atanan: ${esc(t.assignee?nm(p,t.assignee):'—')}${c?'':' · sadece görebilirsin'}</p>`}<h2>Alt görevler</h2><div class="card">${ss.map(s=>`<div class="p${s.done?' done':''}"><span class="ck"${c?` data-sk="${s.id}"`:''}></span><div class="tt">${esc(s.title)}</div>${c?`<button data-pa="ds" data-i="${s.id}">✕</button>`:''}</div>`).join('')||'<div class="row"><small>Henüz yok</small></div>'}${c?'<input id="ns" placeholder="Alt görev ekle, Enter" enterkeyhint="done">':''}</div>${o?`<div class="seg">${[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']].map(([k,n])=>`<button data-s="${k}" class="${t.status==k?'on':''}">${n}</button>`).join('')}</div><div class="card"><button class="row red" data-pa="dt" data-i="${id}">Görevi sil</button></div><button class="big" data-pa="st" data-i="${id}">Kaydet</button>`:''}`)}
function newPlan(){sheet(`<div class="card"><input id="pn" placeholder="Plan adı"></div><div class="seg">${Object.keys(TPL).map((k,i)=>`<button data-tp="${k}" class="${i?'':'on'}">${k}</button>`).join('')}</div><button class="big" data-pa="mk">Oluştur</button>`)}
function kisiler(){const p=cur(),o=own(p);sheet(`<h2>Kişiler</h2><div class="card">${mem(p).map(m=>`<div class="p"><div class="tt">${esc(m.name)}<small>${esc(m.email.endsWith('@bekliyor.local')?'davet bekliyor':m.email)}${m.role=='owner'?' · yönetici':''}</small></div>${o&&m.role!='owner'?`<button data-pa="lk" data-i="${m.id}">Bağlantı</button><button data-pa="rm" data-i="${m.id}">✕</button>`:''}</div>`).join('')}</div>${o?`<h2>Davet et</h2><div class="card"><input id="in" placeholder="Ad (ör. Yunus)"><input id="ie" type="email" placeholder="E-posta (isteğe bağlı)"></div><button class="big" data-pa="am">Davet bağlantısı oluştur</button><h2>Teslim tarihi</h2><div class="card"><input id="pd" type="date" value="${p.due||''}"></div><button class="big" data-pa="sd">Tarihi kaydet</button><div class="card" style="margin-top:16px"><button class="row" data-pa="imp">Yapıştırarak içe aktar (Gemini vb.)</button></div><div class="card"><button class="row red" data-pa="dp">Planı sil</button></div>`:''}`)}
async function pact(a,i){const p=cur();
 if(a=='menu')document.body.classList.add('sd');
 else if(a=='np'){document.body.classList.remove('sd');newPlan()}
 else if(a=='mk'){const name=$('#pn').value.trim();if(!name)return;const id=crypto.randomUUID(),pr={id,name,color:COL[PJ.length%COL.length],user_id:user.id,created_at:new Date().toISOString()};
  const ts=TPL[$('[data-tp].on').dataset.tp].map((title,n)=>({id:crypto.randomUUID(),project_id:id,title,status:'todo',assignee:null,pos:n,user_id:user.id}));
  PJ.push(pr);TK.push(...ts);MB.push({id:crypto.randomUUID(),project_id:id,email:ME(),name:ME().split('@')[0],role:'owner'});cacheP();P=id;V2='pano';close();render(1);
  const r=await sb.from('projects').insert({id,name,color:pr.color});if(r.error)return alert(r.error.message);if(ts.length)err(await sb.from('tasks').insert(ts.map(({user_id,...t})=>t)));loadProj()}
 else if(a=='pset')kisiler();
 else if(a=='am'){const e=$('#ie').value.trim().toLowerCase();if(!e)return;const m={id:crypto.randomUUID(),project_id:P,email:e,name:$('#in').value.trim()||e.split('@')[0],role:'member'};MB.push(m);cacheP();kisiler();render();sb.from('project_members').insert({id:m.id,project_id:P,email:m.email,name:m.name}).then(err)}
 else if(a=='rm'){MB=MB.filter(m=>m.id!=i);cacheP();kisiler();render();sb.from('project_members').delete().eq('id',i).then(err)}
 else if(a=='dp'){if(!confirm('Plan ve görevleri silinsin mi?'))return;const id=P;PJ=PJ.filter(x=>x.id!=id);TK=TK.filter(t=>t.project_id!=id);P='cal';cacheP();close();render(1);sb.from('projects').delete().eq('id',id).then(err)}
 else if(a=='st'){const t=TK.find(x=>x.id==i);t.title=$('#tt').value.trim()||t.title;t.assignee=$('#ta').value||null;t.status=$('[data-s].on').dataset.s;cacheP();close();render();sb.from('tasks').update({title:t.title,assignee:t.assignee,status:t.status}).eq('id',i).then(err)}
 else if(a=='dt'){TK=TK.filter(x=>x.id!=i);cacheP();close();render();sb.from('tasks').delete().eq('id',i).then(err)}
 else if(a=='ds')sub(i,()=>{SB=SB.filter(s=>s.id!=i);sb.from('subtasks').delete().eq('id',i).then(err)})}
const togS=id=>{const s=SB.find(x=>x.id==id);sub(id,()=>{s.done=!s.done;sb.from('subtasks').update({done:s.done}).eq('id',id).then(err)})};
document.addEventListener('keydown',e=>{if(e.key!='Enter'||e.target.id!='ns')return;const v=e.target.value.trim();if(!v)return;
 const s={id:crypto.randomUUID(),task_id:ET,project_id:P,title:v,done:false,pos:SB.length};sub(s.id,()=>{SB.push(s);sb.from('subtasks').insert(s).then(err)})});
document.addEventListener('click',e=>{const t=e.target;let x;
 if(document.body.classList.contains('sd')&&!t.closest('#side')){document.body.classList.remove('sd');return}
 if(x=t.closest('[data-tp],[data-s]')){const k=x.hasAttribute('data-tp')?'[data-tp]':'[data-s]';return document.querySelectorAll(k).forEach(b=>b.classList.toggle('on',b===x))}
 if(x=t.closest('[data-sk]'))return togS(x.dataset.sk);
 if(x=t.closest('[data-tk]'))return togT(x.dataset.tk);
 if(x=t.closest('[data-pa]'))return pact(x.dataset.pa,x.dataset.i);
 if(x=t.closest('[data-pg]')){P=x.dataset.pg;document.body.classList.remove('sd');return render(1)}
 if(x=t.closest('[data-vw]')){V2=x.dataset.vw;return render()}
 if(x=t.closest('[data-t]'))return editT(x.dataset.t)});
$('#qf').onsubmit=e=>{e.preventDefault();const v=$('#q').value;$('#q').value='';P=='cal'?quick(v):addTask(v)};

/* ---- davet bağlantısı, içe aktarma, arama, teslim tarihi ---- */
const left=p=>{if(!p.due)return'';const ms=new Date(p.due+'T23:59')-new Date();if(ms<0)return' · süre doldu';return` · teslime ${Math.floor(ms/864e5)} gün ${Math.floor(ms%864e5/36e5)} sa`};
const INV=new URLSearchParams(location.search).get('davet');if(INV){localStorage.setItem('inv',INV);history.replaceState(null,'',location.pathname)}
const _ld=load;load=async function(){const iv=localStorage.getItem('inv');if(iv&&user){localStorage.removeItem('inv');const r=await sb.rpc('accept_invite',{mid:iv});r.error?alert(r.error.message):GO=r.data}await _ld()};
const _lg=login;login=function(){_lg();if(localStorage.getItem('inv'))$('#app').insertAdjacentHTML('afterbegin','<p class="hint" style="margin-top:12vh">Daveti kabul etmek için giriş yap veya hesap oluştur. Plan hesabına otomatik eklenir.</p>')};
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
 if(a=='am'){const id=crypto.randomUUID(),n=$('#in').value.trim(),e=$('#ie').value.trim().toLowerCase()||`davet-${id}@bekliyor.local`;if(!n&&e.endsWith('@bekliyor.local'))return alert('Ad veya e-posta yaz.');
  MB.push({id,project_id:P,email:e,name:n||e.split('@')[0],role:'member'});cacheP();share(id);sb.from('project_members').insert({id,project_id:P,email:e,name:n||e.split('@')[0]}).then(r=>{err(r);kisiler();render()})}
 else if(a=='lk')share(i)
 else if(a=='sd'){p.due=$('#pd').value||null;cacheP();close();render();sb.from('projects').update({due:p.due}).eq('id',p.id).then(err)}
 else if(a=='imp')impSheet()
 else if(a=='ip'){IMP=parseAI($('#ai').value,p);impPrev()}
 else if(a=='ii')await doImp()
 else if(a=='ck')palette()
 else return _pa(a,i)};
