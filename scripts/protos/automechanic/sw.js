/* Сайт как приложение: без интернета открывается страница с адресом и
   телефонами, уже открытые страницы и фото — из памяти телефона. */
var V='am-v1',SCOPE=self.registration.scope.replace(/\/$/,'');
var KEEP=[SCOPE+'/offline',SCOPE+'/uz/offline','__IMG__/icon-192.png','__IMG__/car.webp'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(KEEP)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(function(res){var copy=res.clone();caches.open(V).then(function(c){c.put(r,copy)});return res}).catch(function(){
      return caches.match(r).then(function(hit){return hit||caches.match(SCOPE+(u.pathname.indexOf(SCOPE.replace(/^https?:\/\/[^/]+/,'')+'/uz')===0?'/uz':'')+'/offline')});
    }));
    return;
  }
  if(u.origin===location.origin&&u.pathname.indexOf('__IMG__/')===0){
    e.respondWith(caches.match(r).then(function(hit){return hit||fetch(r).then(function(res){var copy=res.clone();caches.open(V).then(function(c){c.put(r,copy)});return res})}));
  }
});
