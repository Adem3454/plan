/* Genel çevrimdışı yazma: Supabase'e giden yazma istekleri internet yokken kuyruğa alınır, bağlanınca sırayla gönderilir */
(()=>{const F=window.fetch.bind(window),K='oqf',busy={f:0};
const q=()=>JSON.parse(localStorage.getItem(K)||'[]'),sv=a=>localStorage.setItem(K,JSON.stringify(a));
const wr=(u,m)=>/\/rest\/v1\//.test(u)&&!/\/rpc\//.test(u)&&['POST','PATCH','DELETE','PUT'].includes(m);
window.fetch=async(u,o={})=>{const url=typeof u==='string'?u:u.url,m=(o.method||u.method||'GET').toUpperCase();
 if(!wr(url,m))return F(u,o);
 try{if(!navigator.onLine)throw new TypeError('offline');return await F(u,o)}
 catch(e){if(!(e instanceof TypeError))throw e;const h={};new Headers(o.headers||{}).forEach((v,k)=>{if(k.toLowerCase()!='authorization')h[k]=v});
  sv(q().concat([{url,m,h,b:typeof o.body==='string'?o.body:null}]));window.dispatchEvent(new Event('offq'));
  return new Response(m==='POST'?'[]':null,{status:m==='POST'?201:204,headers:{'Content-Type':'application/json'}})}};
window.offCount=()=>q().length;
window.flushOff=async()=>{if(busy.f||!navigator.onLine||!q().length||typeof sb==='undefined')return 0;busy.f=1;let ok=0,bad=0;
 try{const {data:{session}}=await sb.auth.getSession();if(!session)return 0;
  for(let a=q();a.length;a=q()){const it=a[0];let r;try{r=await F(it.url,{method:it.m,headers:{...it.h,Authorization:'Bearer '+session.access_token},body:it.b})}catch(e){break}
   if(r.status===401)break;sv(q().slice(1));r.ok?ok++:bad++}}finally{busy.f=0}
 if(ok||bad)window.dispatchEvent(new CustomEvent('offdone',{detail:{ok,bad}}));return ok};
addEventListener('online',()=>window.flushOff&&window.flushOff());
})();
