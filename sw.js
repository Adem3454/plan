const C='plan-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.url.includes('.supabase.co'))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||'Plan',{body:d.body||'',icon:'icon.png',badge:'icon.png'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
