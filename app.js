const $=s=>document.querySelector(s),TR='tr',L=['year','month','week','day'];
const AY=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const GN=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const p2=n=>String(n).padStart(2,'0'),ymd=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
const dt=s=>new Date(s+'T00:00'),add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mon=d=>add(d,-((d.getDay()+6)%7)),TODAY=()=>ymd(new Date()),hm=()=>{const d=new Date();return p2(d.getHours())+':'+p2(d.getMinutes())};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cache=()=>localStorage.setItem('plans',JSON.stringify(plans));
let sb,user,plans=[],V={l:'day',d:new Date()};

const byDay=ds=>plans.filter(p=>p.day===ds&&!['season','goal','habit','bday','anniv'].includes(p.kind)).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
const ld=ds=>byDay(ds).reduce((s,p)=>s+p.weight+1,0);

/* ---------- görünümler ---------- */
function vYear(){const y=V.d.getFullYear(),t=TODAY();let h=`<h1>${y}</h1><div class="yr">`;
 for(let m=0;m<12;m++){h+=`<div class="mo" data-g="month:${y}-${p2(m+1)}-01"><b>${AY[m]}</b><div class="dots">${'<i></i>'.repeat((new Date(y,m,1).getDay()+6)%7)}`;
  for(let k=1,n=new Date(y,m+1,0).getDate();k<=n;k++){const ds=`${y}-${p2(m+1)}-${p2(k)}`;h+=`<i class="dot${ds===t?' t':''}" style="--a:${Math.min(1,ld(ds)/6)}" data-g="day:${ds}"></i>`}
  h+='</div></div>'}
 return h+'</div>'}
function vMonth(){const y=V.d.getFullYear(),m=V.d.getMonth(),t=TODAY();
 let h=`<h1>${AY[m]} ${y}</h1><div class="wk">${['Pt','Sa','Ça','Pe','Cu','Ct','Pz'].map(x=>`<span>${x}</span>`).join('')}</div><div class="mg">${'<i></i>'.repeat((new Date(y,m,1).getDay()+6)%7)}`;
 for(let k=1,n=new Date(y,m+1,0).getDate();k<=n;k++){const ds=`${y}-${p2(m+1)}-${p2(k)}`;
  h+=`<div class="c${ds===t?' t':''}" data-g="day:${ds}"><b>${k}</b><div>${byDay(ds).slice(0,4).map(p=>`<u class="w${p.weight}${p.done?' d':''}"></u>`).join('')}</div></div>`}
 return h+'</div>'}
function vWeek(){const s=mon(V.d),e=add(s,6),t=TODAY(),sh=d=>AY[d.getMonth()].slice(0,3);
 let h=`<h1>${s.getDate()} ${sh(s)} – ${e.getDate()} ${sh(e)}</h1><div class="card">`;
 for(let i=0;i<7;i++){const d=add(s,i),ds=ymd(d),n=byDay(ds),w=ld(ds);
  h+=`<div class="p${ds===t?' t':''}" data-g="day:${ds}"><div class="dn"><small>${GN[d.getDay()].slice(0,3)}</small><b>${d.getDate()}</b></div><div class="tt">${n.length?n.slice(0,3).map(p=>`<div>${p.done?`<s>${esc(p.title)}</s>`:esc(p.title)}</div>`).join('')+(n.length>3?`<small>+${n.length-3}</small>`:''):'<small>Boş gün</small>'}</div><div class="m${w>=7?' hot':''}"><i style="width:${Math.min(100,w*12.5)}%"></i></div></div>`}
 return h+'</div><p class="hint">Turuncu çubuk yoğun günü gösterir.</p>'}
const row=p=>`<div class="p${p.done?' done':''}" data-id="${p.id}"><span class="ck" data-k="${p.id}"></span><div class="tt">${esc(p.title)}${p.time?`<small>${p.time}</small>`:''}</div><span class="wt">${'●'.repeat(p.weight+1)}</span></div>`;
const cd=t=>{const [h,m]=t.split(':'),x=new Date();x.setHours(+h,+m,0,0);const k=Math.round((x-new Date())/6e4);return k>=60?`${Math.floor(k/60)} sa ${k%60} dk sonra`:k>0?`${k} dk sonra`:'şimdi'};
function nowCard(n){const dn=n.filter(p=>p.done).length,tot=n.length,r=26,c=2*Math.PI*r,nx=n.find(p=>!p.done&&p.time&&p.time>=hm())||n.find(p=>!p.done);
 return `<div class="card nw"><svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--sep)" stroke-width="7"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--ok)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*(tot?dn/tot:0)} ${c}" transform="rotate(-90 32 32)"/></svg><div class="tt"><small>Şimdi</small>${nx?esc(nx.title):tot?'Hepsi tamam':'Bugün planın yok'}${nx&&nx.time?`<small>${cd(nx.time)}</small>`:''}</div></div>`}
function vDay(){const ds=ymd(V.d),t=TODAY(),n=byDay(ds);
 let h=`<h1>${V.d.getDate()} ${AY[V.d.getMonth()]}<small>${GN[V.d.getDay()]}</small></h1>`+(ds===t?nowCard(n):'');
 for(const [nm,f] of [['Gün boyu',p=>!p.time],['Sabah',p=>p.time&&p.time<'12'],['Öğleden sonra',p=>p.time>='12'&&p.time<'18'],['Akşam',p=>p.time>='18']]){const a=n.filter(f);if(a.length)h+=`<h2>${nm}</h2><div class="card">${a.map(row).join('')}</div>`}
 if(ds===t){const s=plans.filter(p=>p.day<t&&!p.done);if(s.length)h+=`<h2>Kayanlar</h2><div class="card slid">${s.map(row).join('')}</div>`}
 return h+(n.length?'':'<p class="hint">Bu gün boş. Aşağıdan plan ekle ya da dinlen.</p>')}

function render(dir=0){const i=L.indexOf(V.l),par=['',String(V.d.getFullYear()),AY[V.d.getMonth()],'Hafta'][i];
 $('#app').innerHTML=`<nav><span><button class="mb" data-pa="menu">☰</button><button data-a="out">${i?'‹ '+par:''}</button></span><span><button data-a="prev">‹</button><button data-a="today">Bugün</button><button data-a="next">›</button><button data-a="set">⋯</button></span></nav>`+[vYear,vMonth,vWeek,vDay][i]();
 if(dir)$('#app').animate([{opacity:0,transform:`scale(${dir>0?.84:1.12})`},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(.22,1.2,.36,1)'})}
function zoom(dir){const i=L.indexOf(V.l)+dir;if(i<0||i>3)return;V.l=L[i];render(dir)}
function go(g){const [l,ds]=g.split(':'),s=Math.sign(L.indexOf(l)-L.indexOf(V.l));V={l,d:dt(ds)};render(s||1)}
function shift(n){const d=new Date(V.d),l=V.l;if(l=='year')d.setFullYear(d.getFullYear()+n);else if(l=='month'){d.setDate(1);d.setMonth(d.getMonth()+n)}else d.setDate(d.getDate()+n*(l=='week'?7:1));V.d=d;render()}

/* ---------- veri ---------- */
const remind=p=>{if(p.done)return null;const t=new Date(p.day+'T'+(p.time||'09:00'));if(p.remind_min===-1)return null;if(p.time)t.setMinutes(t.getMinutes()-(p.remind_min==null?15:p.remind_min));return t>new Date()?t.toISOString():null};
async function save(p){p.remind_at=remind(p);p.notified=false;const i=plans.findIndex(x=>x.id==p.id);i<0?plans.push(p):plans[i]=p;cache();render();
 const {error}=await sb.from('plans').upsert(p);if(error)offq([p],error)}
async function load(){const {data,error}=await sb.from('plans').select('*');if(!error){TRASH=data.filter(p=>p.deleted_at);plans=data.filter(p=>!p.deleted_at);cache();render()}}
function parse(t){const now=new Date();let s=t,d=null,tm=null,m;const R=r=>{const x=s.match(r);if(x)s=s.replace(x[0],' ');return x};
 if(R(/bugün/i))d=ymd(now);else if(R(/yarın/i))d=ymd(add(now,1));else if(R(/öbür gün|ertesi gün/i))d=ymd(add(now,2));
 else if(m=R(/(\d{1,2})\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i)){const x=new Date(now.getFullYear(),AY.map(a=>a.toLocaleLowerCase(TR)).indexOf(m[2].toLocaleLowerCase(TR)),+m[1]);if(x<add(now,-1))x.setFullYear(x.getFullYear()+1);d=ymd(x)}
 else if(m=R(/(^|\s)(pazartesi|salı|çarşamba|perşembe|cumartesi|cuma|pazar)/i)){const w=GN.map(a=>a.toLocaleLowerCase(TR)).indexOf(m[2].toLocaleLowerCase(TR));d=ymd(add(now,(w-now.getDay()+6)%7+1))}
 if(m=R(/(\d{1,2})[:.](\d{2})/))tm=`${p2(+m[1])}:${m[2]}`;else if(m=R(/saat\s*(\d{1,2})/i))tm=`${p2(+m[1])}:00`;
 s=s.replace(/\s+/g,' ').trim();return {title:s?s[0].toLocaleUpperCase(TR)+s.slice(1):'',d:d||(V.l=='day'?ymd(V.d):ymd(now)),tm}}
function quick(txt){const r=parse(txt);if(!r.title)return;V={l:'day',d:dt(r.d)};save({id:crypto.randomUUID(),title:r.title,day:r.d,time:r.tm,weight:1,done:false})}
const tog=id=>{const p=plans.find(x=>x.id==id);save({...p,done:!p.done})};

/* ---------- sayfalar (sheet) ---------- */
const sheet=h=>{$('#sh').innerHTML=`<div>${h}</div>`;$('#sh').classList.add('o')},close=()=>$('#sh').classList.remove('o');
function edit(id){const p=plans.find(x=>x.id==id);
 sheet(`<div class="card"><input id="et" value="${esc(p.title)}"><input id="ed" type="date" value="${p.day||''}"><input id="etm" type="time" value="${p.time||''}">${rmSel(p)}${rpSel(p)}${iconSel(p)}${estSel(p)}${goalSel(p)}</div><div class="seg">${['Hafif','Orta','Ağır'].map((x,i)=>`<button data-w="${i}" class="${p.weight==i?'on':''}">${x}</button>`).join('')}</div><div class="card"><button class="row" data-a="move" data-i="${id}">Bugüne al</button><button class="row red" data-a="del" data-i="${id}">Sil</button></div><button class="big" data-a="ok" data-i="${id}">Kaydet</button>`)}
const b64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function push(){try{const reg=await navigator.serviceWorker.ready;if(await Notification.requestPermission()!='granted')return alert('Bildirim izni verilmedi.');
 const s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(CFG.vapid)});
 const {error}=await sb.from('push_subs').upsert({endpoint:s.endpoint,sub:s.toJSON(),email:(user.email||'').toLowerCase()},{onConflict:'endpoint'});alert(error?error.message:'Bildirimler açık.');close()}catch(e){alert(e.message)}}
async function act(a,i){const p=i&&plans.find(x=>x.id==i);
 if(a=='out')zoom(-1);else if(a=='prev')shift(-1);else if(a=='next')shift(1);else if(a=='today'){V.d=new Date();render()}
 else if(a=='set')sheet(`<p class="hint">${esc(user.email)}</p><div class="card"><button class="row" data-a="push">Bildirimleri aç</button><button class="row red" data-a="logout">Çıkış yap</button></div>`);
 else if(a=='push')push();
 else if(a=='logout'){await sb.auth.signOut();localStorage.clear();location.reload()}
 else if(a=='in'||a=='up'){const c={email:$('#em').value.trim(),password:$('#pw').value};const {data,error}=await(a=='in'?sb.auth.signInWithPassword(c):sb.auth.signUp(c));
  if(error)alert(error.message);else if(data.session)location.reload();else alert('E-postandaki bağlantıyla hesabı onayla, sonra giriş yap.')}
 else if(a=='ok')save({...p,title:$('#et').value.trim()||p.title,day:$('#ed').value||p.day,time:$('#etm').value||null,remind_min:+$('#erm').value,repeat:$('#erp').value||null,icon:$('#eic').value||null,est:+$('#ees').value||null,goal_id:$('#egl')?($('#egl').value||null):p.goal_id,weight:+($('[data-w].on')?.dataset.w??p.weight)}),close();
 else if(a=='move'){save({...p,day:TODAY()});close()}
 else if(a=='del'){softDel(i);close()}}

/* ---------- olaylar ---------- */
document.addEventListener('pointerdown',e=>{$('#app').style.transformOrigin=`${e.pageX-$('#app').offsetLeft}px ${e.pageY}px`});
document.addEventListener('click',e=>{const t=e.target;let x;
 if(x=t.closest('[data-w]'))return document.querySelectorAll('[data-w]').forEach(b=>b.classList.toggle('on',b===x));
 if(x=t.closest('[data-k]'))return tog(x.dataset.k);
 if(x=t.closest('[data-a]'))return act(x.dataset.a,x.dataset.i);
 if(x=t.closest('[data-id]'))return edit(x.dataset.id);
 if(x=t.closest('[data-g]'))return go(x.dataset.g)});
$('#sh').onclick=e=>{if(e.target.id=='sh')close()};
$('#qf').onsubmit=e=>{e.preventDefault();quick($('#q').value);$('#q').value=''};
const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);let pd=0,pl=0,wt=0;
addEventListener('touchstart',e=>{if(e.touches.length==2)pd=pl=dist(e.touches)},{passive:true});
addEventListener('touchmove',e=>{if(pd&&e.touches.length==2)pl=dist(e.touches)},{passive:true});
addEventListener('touchend',e=>{if(pd&&e.touches.length<2){const r=pl/pd;pd=0;if(r>1.3)zoom(1);else if(r<.75)zoom(-1)}});
addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();if(Date.now()-wt<450)return;wt=Date.now();zoom(e.deltaY<0?1:-1)},{passive:false});
addEventListener('keydown',e=>{if(!user||/INPUT/.test(document.activeElement.tagName))return;if(e.key=='ArrowLeft')shift(-1);if(e.key=='ArrowRight')shift(1)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)load()});
setInterval(()=>{if(user&&P=='cal'&&V.l=='day'&&!$('#sh').classList.contains('o'))render()},6e4);

/* ---------- başlangıç ---------- */
function login(){$('#bar').style.display='none';$('#app').innerHTML=`<h1 style="margin-top:18vh">Plan</h1><div class="card"><input id="em" type="email" placeholder="E-posta" autocomplete="email"><input id="pw" type="password" placeholder="Parola" autocomplete="current-password"></div><button class="big" data-a="in">Giriş yap</button><button class="ctr" data-a="up">Hesap oluştur</button>`}
async function init(){if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
 sb=supabase.createClient(CFG.url,CFG.key);const {data:{session}}=await sb.auth.getSession();if(!session)return login();
 user=session.user;plans=JSON.parse(localStorage.getItem('plans')||'[]');render();await load();
 const q=new URLSearchParams(location.search).get('ekle');if(q){history.replaceState(null,'','./');quick(q)}}
init();
