const C='plan-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.url.includes('.supabase.co'))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||'Plan',{body:d.body||'',icon:'icon.png',badge:'icon.png',data:d.data||{},actions:d.actions||[]}))});
self.addEventListener('notificationclick',e=>{e.notification.close();
  const d=e.notification.data||{},q=e.action?`?${e.action}=${d.id}`:d.open?`?ac=${d.open}`:'';
  e.waitUntil(clients.matchAll({type:'window'}).then(l=>{if(l.length&&l[0].navigate)return l[0].navigate('./'+q).then(c=>c&&c.focus());return clients.openWindow('./'+q)}))});
