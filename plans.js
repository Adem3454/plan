/* Planlar: yan panel, plan sayfaları, pano, kişilere sürükle-bırak */
const COL=['#ff375f','#ff9f0a','#30d158','#0a84ff','#bf5af2','#64d2ff'];
const TPL={'Boş':[],'Hackathon':['Fikir ve kapsam','Tasarım','Frontend','Backend','Sunum'],'Etkinlik':['Mekân','Davetiye','Yemek','Müzik','Bütçe'],'İş projesi':['Hedefleri yaz','Plan çıkar','İlk taslak','Gözden geçir','Teslim']};
let PJ=JSON.parse(localStorage.getItem('pj')||'[]'),TK=JSON.parse(localStorage.getItem('tk')||'[]'),P='cal',V2='pano';
const cacheP=()=>{localStorage.setItem('pj',JSON.stringify(PJ));localStorage.setItem('tk',JSON.stringify(TK))};

async function loadProj(){const a=await sb.from('projects').select('*').order('created_at'),b=await sb.from('tasks').select('*');
 if(!a.error&&!b.error){PJ=a.data;TK=b.data;cacheP();render()}}
const _load=load;load=async function(){await _load();await loadProj()};
const _z=zoom,_s=shift;zoom=d=>P=='cal'&&_z(d);shift=n=>P=='cal'&&_s(n);
const _render=render;
render=function(d){$('#q').placeholder=P=='cal'?'yarın 15:00 diş hekimi':'Görev ekle · @ali pastayı al';drawSide();
 if(P=='cal'||!PJ.find(x=>x.id==P)){P='cal';drawSide();return _render(d)}
 planRender();if(d)$('#app').animate([{opacity:0,transform:'translateY(14px) scale(.97)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.32,.72,0,1)'})};

function drawSide(){$('#side').innerHTML=`<h2>Planlar</h2><button class="si${P=='cal'?' on':''}" data-pg="cal"><i style="background:var(--ac)"></i>Takvim</button>${PJ.map(p=>`<button class="si${P==p.id?' on':''}" data-pg="${p.id}"><i style="background:${p.color}"></i>${esc(p.name)}</button>`).join('')}<button class="si" data-pa="np" style="color:var(--ac)">+ Yeni plan</button>`}
const card=t=>`<div class="tk${t.status=='done'?' done':''}" data-t="${t.id}"><span class="ck" data-tk="${t.id}"></span><div class="tt">${esc(t.title)}${t.assignee&&V2=='pano'?`<small>${esc(t.assignee)}</small>`:''}</div></div>`;
function planRender(){const p=PJ.find(x=>x.id==P),ts=TK.filter(t=>t.project_id==p.id).sort((a,b)=>a.pos-b.pos),dn=ts.filter(t=>t.status=='done').length,pc=ts.length?Math.round(dn/ts.length*100):0;
 const cols=V2=='kisi'?[['','Atanmamış'],...p.members.map(m=>[m,m])]:[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']];
 const mine=c=>ts.filter(t=>V2=='kisi'?(t.assignee||'')==c:t.status==c);
 $('#app').innerHTML=`<nav><span><button class="mb" data-pa="menu">☰</button></span><span><button data-pa="pset">⋯</button></span></nav><div class="ph" style="--c:${p.color}"><h1>${esc(p.name)}</h1><div class="pb"><i style="width:${pc}%"></i></div><small>${dn}/${ts.length} tamamlandı · %${pc}</small></div><div class="seg"><button data-vw="pano" class="${V2=='pano'?'on':''}">Pano</button><button data-vw="kisi" class="${V2=='kisi'?'on':''}">Kişiler</button></div><div class="cols">${cols.map(([c,n])=>{const a=mine(c),d=a.filter(t=>t.status=='done').length,k=V2=='kisi'&&a.length;
  return `<div class="col"><h3>${esc(n)}<small>${k?d+'/'+a.length:a.length}</small></h3>${k?`<div class="pb"><i style="width:${d/a.length*100}%"></i></div>`:''}<div class="list" data-c="${esc(c)}">${a.map(card).join('')}</div></div>`}).join('')}</div>`;
 document.querySelectorAll('.list').forEach(el=>new Sortable(el,{group:'t',animation:220,delay:150,delayOnTouchOnly:true,ghostClass:'gh',onEnd:dropped}))}
function dropped(e){const c=e.to.dataset.c,t=TK.find(x=>x.id==e.item.dataset.t),ch=new Set();
 if(V2=='kisi')t.assignee=c||null;else t.status=c;
 for(const l of new Set([e.to,e.from]))[...l.children].forEach((el,i)=>{const x=TK.find(y=>y.id==el.dataset.t);if(x){x.pos=i;ch.add(x)}});
 cacheP();setTimeout(render,0);sb.from('tasks').upsert([...ch]).then(r=>r.error&&alert(r.error.message))}
function saveT(t){const j=TK.findIndex(x=>x.id==t.id);j<0?TK.push(t):TK[j]=t;cacheP();render();sb.from('tasks').upsert(t).then(r=>r.error&&alert(r.error.message))}
const togT=id=>{const t=TK.find(x=>x.id==id);saveT({...t,status:t.status=='done'?'todo':'done'})};
function addTask(v){v=v.trim();if(!v)return;const p=PJ.find(x=>x.id==P),m=v.match(/^@(\S+)\s+(.+)/);let a=null;
 if(m){a=p.members.find(n=>n.toLocaleLowerCase(TR).startsWith(m[1].toLocaleLowerCase(TR)))||null;if(a)v=m[2]}
 saveT({id:crypto.randomUUID(),project_id:P,title:v,status:'todo',assignee:a,pos:9999})}
function editT(id){const t=TK.find(x=>x.id==id),p=PJ.find(x=>x.id==P);
 sheet(`<div class="card"><input id="tt" value="${esc(t.title)}"></div><div class="card"><select id="ta"><option value="">Atanmamış</option>${p.members.map(m=>`<option${m==t.assignee?' selected':''}>${esc(m)}</option>`).join('')}</select></div><div class="seg">${[['todo','Yapılacak'],['doing','Sürüyor'],['done','Bitti']].map(([k,n])=>`<button data-s="${k}" class="${t.status==k?'on':''}">${n}</button>`).join('')}</div><div class="card"><button class="row red" data-pa="dt" data-i="${id}">Sil</button></div><button class="big" data-pa="st" data-i="${id}">Kaydet</button>`)}
function newPlan(){sheet(`<div class="card"><input id="pn" placeholder="Plan adı"><input id="pm" placeholder="Kişiler (virgülle: Ali, Zeynep)"></div><div class="seg">${Object.keys(TPL).map((k,i)=>`<button data-tp="${k}" class="${i?'':'on'}">${k}</button>`).join('')}</div><button class="big" data-pa="mk">Oluştur</button>`)}
async function pact(a,i){
 if(a=='menu')document.body.classList.add('sd');
 else if(a=='np'){document.body.classList.remove('sd');newPlan()}
 else if(a=='mk'){const name=$('#pn').value.trim();if(!name)return;const id=crypto.randomUUID(),mem=$('#pm').value.split(',').map(s=>s.trim()).filter(Boolean);
  const p={id,name,color:COL[PJ.length%COL.length],members:mem},ts=TPL[$('[data-tp].on').dataset.tp].map((title,n)=>({id:crypto.randomUUID(),project_id:id,title,status:'todo',assignee:null,pos:n}));
  PJ.push(p);TK.push(...ts);cacheP();P=id;V2='pano';close();render(1);
  const r=await sb.from('projects').upsert(p);if(r.error)return alert(r.error.message);if(ts.length){const q=await sb.from('tasks').upsert(ts);if(q.error)alert(q.error.message)}}
 else if(a=='pset')sheet(`<div class="card"><input id="nm" placeholder="Yeni kişi adı"></div><button class="big" data-pa="am">Kişi ekle</button><div class="card" style="margin-top:16px"><button class="row red" data-pa="dp">Planı sil</button></div>`);
 else if(a=='am'){const p=PJ.find(x=>x.id==P),n=$('#nm').value.trim();if(!n||p.members.includes(n))return;p.members.push(n);cacheP();close();render();sb.from('projects').upsert(p)}
 else if(a=='dp'){if(!confirm('Plan ve görevleri silinsin mi?'))return;const id=P;PJ=PJ.filter(x=>x.id!=id);TK=TK.filter(t=>t.project_id!=id);P='cal';cacheP();close();render(1);sb.from('projects').delete().eq('id',id)}
 else if(a=='st'){const t=TK.find(x=>x.id==i);t.title=$('#tt').value.trim()||t.title;t.assignee=$('#ta').value||null;t.status=$('[data-s].on').dataset.s;close();saveT(t)}
 else if(a=='dt'){TK=TK.filter(x=>x.id!=i);cacheP();close();render();sb.from('tasks').delete().eq('id',i)}}
document.addEventListener('click',e=>{const t=e.target;let x;
 if(document.body.classList.contains('sd')&&!t.closest('#side')){document.body.classList.remove('sd');return}
 if(x=t.closest('[data-tp],[data-s]')){const k=x.hasAttribute('data-tp')?'[data-tp]':'[data-s]';return document.querySelectorAll(k).forEach(b=>b.classList.toggle('on',b===x))}
 if(x=t.closest('[data-tk]'))return togT(x.dataset.tk);
 if(x=t.closest('[data-pa]'))return pact(x.dataset.pa,x.dataset.i);
 if(x=t.closest('[data-pg]')){P=x.dataset.pg;document.body.classList.remove('sd');return render(1)}
 if(x=t.closest('[data-vw]')){V2=x.dataset.vw;return render()}
 if(x=t.closest('[data-t]'))return editT(x.dataset.t)});
$('#qf').onsubmit=e=>{e.preventDefault();const v=$('#q').value;$('#q').value='';P=='cal'?quick(v):addTask(v)};
