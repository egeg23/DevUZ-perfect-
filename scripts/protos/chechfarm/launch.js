(function(){
'use strict';
/* launch: «Путь вашего бренда» и «Сам или с CZECHFARM». Прокрутку не трогает:
   этапы листаются кнопками и сами, пока сцена на экране. Название и страна
   живут в этой вкладке (cf-launch) и подставляются в заявку на «Партнёрам». */
var d=document,W=window,root=d.documentElement,K=JSON.parse(d.getElementById('cf-data').textContent),L=K.launch;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
var REDUCED=root.classList.contains('rm');
function fill(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]==null?'':o[k]})}
function ssGet(){try{return JSON.parse(sessionStorage.getItem('cf-launch')||'null')}catch(e){return null}}
function ssSet(v){try{sessionStorage.setItem('cf-launch',JSON.stringify(v))}catch(e){}}

var ln=$('#ln');
if(ln){
  var nm=$('#ln-name'),og=$('#ln-org'),steps=$$('.ln-steps button',ln),cap=$('.ln-cap',ln),next=$('#ln-next'),go=$('#ln-go'),s=0,auto=!REDUCED,vis=false,timer=0,N=L.stages.length;
  var COLORS=[['#0b5a53','#e5c98f'],['#284a7a','#9fd1c9'],['#a8432f','#f2e6cc'],['#5b3d8a','#e5c98f'],['#8a6420','#d7ebe6']];
  function name(){return (nm.value||'').trim()||L.mine}
  function paint(){
    var n=name(),h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;var c=COLORS[h%COLORS.length];
    ln.style.setProperty('--bc',c[0]);ln.style.setProperty('--bc2',c[1]);
    var t=$('.bx-name',ln);t.textContent=n;t.setAttribute('font-size',String(Math.max(13,Math.min(26,250/Math.max(n.length,1)))));
    $('.bx-org',ln).textContent=L.madeIn+og.value;
    $('span',go).textContent=fill(L.talk,{n:n});
    ssSet({n:(nm.value||'').trim(),o:og.value,msg:fill(L.msg,{n:n,o:og.value})})}
  function set(i){s=i;ln.setAttribute('data-s',String(i));steps.forEach(function(b,j){b.parentNode.classList.toggle('on',j<=i);b.setAttribute('aria-current',j===i?'step':'false')});
    cap.textContent=L.stages[i][1];next.hidden=i>=N-1;go.classList.toggle('show',i>=N-1)}
  function stop(){auto=false;clearInterval(timer)}
  steps.forEach(function(b){b.addEventListener('click',function(){stop();set(+b.getAttribute('data-s'))})});
  next.addEventListener('click',function(){stop();set(Math.min(N-1,s+1))});
  $('#ln-reset').addEventListener('click',function(){stop();set(0)});
  nm.addEventListener('input',paint);og.addEventListener('change',paint);nm.addEventListener('focus',stop);
  var saved=ssGet();if(saved&&saved.n)nm.value=saved.n;if(saved&&saved.o)og.value=saved.o;
  paint();set(REDUCED?N-1:0);
  timer=setInterval(function(){if(auto&&vis&&!d.hidden){if(s>=N-1){stop();return}set(s+1)}},2400);
  if('IntersectionObserver' in W)new IntersectionObserver(function(es){vis=es[0].isIntersecting},{threshold:.4}).observe(ln);else vis=true;
}

/* Заявка производителя: название и страна из «Пути бренда». */
var pf=$('#form form[data-lead="partner"]');
if(pf&&K.page==='partners'){var v=ssGet();if(v&&v.n){var m=$('[name="msg"]',pf),c=$('[name="country"]',pf);if(m&&!m.value)m.value=v.msg;if(c&&!c.value)c.value=v.o}}

/* Сам или с CZECHFARM */
var vs=$('#vs');
if(vs){
  var bs=$$('.vs-sw button',vs),vt=0,vAuto=!REDUCED;
  function vSet(on){vs.setAttribute('data-on',on?'1':'0');bs.forEach(function(b){b.setAttribute('aria-pressed',(+b.getAttribute('data-v'))===on?'true':'false')})}
  bs.forEach(function(b){b.addEventListener('click',function(){vAuto=false;vSet(+b.getAttribute('data-v'))})});
  /* Показали «Сам» — через пару секунд сами переключаем на «С CZECHFARM». */
  if('IntersectionObserver' in W&&vAuto)new IntersectionObserver(function(es){if(es[0].isIntersecting&&vAuto&&!vt)vt=setTimeout(function(){if(vAuto)vSet(1)},1800)},{threshold:.5}).observe(vs);
}
})();
