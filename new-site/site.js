/* Hamstra Roofing — shared site script (new hamstraroofing.com preview) */

/* ---------- Preview gate (soft, client-side; same key as the town pages) ---------- */
(function(){
  var gate=document.getElementById('gate');
  if(!gate) return;
  if(sessionStorage.getItem('hg_dg')==='1'){ gate.style.display='none'; }
  else { document.documentElement.classList.add('locked'); }
})();
function checkGate(){
  var v=(document.getElementById('gpass').value||'').trim().toLowerCase();
  if(v==='iloveroofing'){
    sessionStorage.setItem('hg_dg','1');
    document.getElementById('gate').style.display='none';
    document.documentElement.classList.remove('locked');
    if(window.__hmap) window.__hmap.invalidateSize();
  } else {
    document.getElementById('gerr').textContent='Incorrect password. Please try again.';
    document.getElementById('gpass').select();
  }
}

document.addEventListener('DOMContentLoaded',function(){
  var src=document.querySelector('header .hl-logo'), gl=document.getElementById('glogo');
  if(src&&gl) gl.appendChild(src.cloneNode(true));
  var inp=document.getElementById('gpass');
  if(inp&&document.getElementById('gate').style.display!=='none'){
    inp.focus(); inp.addEventListener('keydown',function(e){ if(e.key==='Enter') checkGate(); });
  }

  /* ---------- Mobile menu ---------- */
  var mb=document.querySelector('.menu-btn'), mn=document.getElementById('mnav');
  if(mb&&mn){
    function setMenu(open){
      mn.classList.toggle('open',open); mb.setAttribute('aria-expanded',open);
      document.documentElement.classList.toggle('menu-open',open);
      mb.querySelector('use').setAttribute('href',open?'#i-x':'#i-menu');
    }
    mb.addEventListener('click',function(){ setMenu(!mn.classList.contains('open')); });
    mn.addEventListener('click',function(e){ if(e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') setMenu(false); });
  }

  initFinder();
  initForm();
});

/* ---------- Map finder (homepage hero) ----------
   Uses towns.json: town-level centroids only, no street addresses. */
var SWATCH={'Driftwood':'#8a8074','Onyx Black':'#242424','Estate Gray':'#6b6b6b','Teak':'#6f5a45','Brownwood':'#5a4535',
  'Desert Rose':'#8a6a60','Desert Tan':'#a8927a','Peppercorn':'#4a4a4a','Slatestone Gray':'#5f6468','Williamsburg Gray':'#6e7070',
  'Peppermill Gray':'#7d7b78','Sand Castle':'#b3a58e','Aged Cedar':'#7a6450','Sierra Gray':'#8a8a88','Chateau Green':'#5d6b55'};
var CDN='https://res.cloudinary.com/dsbllwpbh/image/upload/';

function initFinder(){
  var el=document.getElementById('hmap');
  if(!el||!window.L) return;
  var TOWNS=[], marks={}, sel=null, color='', HOME_B=null;
  var map=L.map(el,{scrollWheelZoom:false,zoomControl:true,attributionControl:true}).setView([41.6,-87.85],9);
  window.__hmap=map;
  var esri='https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
  L.tileLayer(esri+'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri',maxNativeZoom:16,maxZoom:16}).addTo(map);
  L.tileLayer(esri+'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:16}).addTo(map);

  var q=document.getElementById('fq'), res=document.getElementById('fres'), strip=document.getElementById('fstrip'), more=document.getElementById('fmore');

  fetch('/new-site/towns.json').then(function(r){return r.json()}).then(function(d){
    TOWNS=d;
    var dl=document.getElementById('ftowns');
    d.slice().sort(function(a,b){return a.t.localeCompare(b.t)}).forEach(function(t){
      var o=document.createElement('option'); o.value=t.t; dl.appendChild(o);
      t.z.forEach(function(z){ var o2=document.createElement('option'); o2.value=z+' ('+t.t+')'; dl.appendChild(o2); });
    });
    // Color chips: the most-installed colors
    var tot={}; d.forEach(function(t){ for(var c in t.col){ tot[c]=(tot[c]||0)+t.col[c]; } });
    var top=Object.keys(tot).filter(function(c){return SWATCH[c]}).sort(function(a,b){return tot[b]-tot[a]}).slice(0,8);
    var ch=document.getElementById('fchips');
    top.forEach(function(c){
      var b=document.createElement('button'); b.type='button'; b.className='chip'; b.setAttribute('aria-pressed','false');
      b.innerHTML='<span class="sw" style="background:'+SWATCH[c]+'"></span>'+c;
      b.addEventListener('click',function(){
        color=(color===c)?'':c;
        ch.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===b&&color===c))});
        draw();
      });
      ch.appendChild(b);
    });
    HOME_B=L.latLngBounds(d.filter(function(t){return t.n>=3}).map(function(t){return [t.lat,t.lng]})).pad(0.02); map.fitBounds(HOME_B);
    draw();
  });

  function count(t){ return color?(t.col[color]||0):t.n; }
  function draw(){
    var max=Math.max.apply(null,TOWNS.map(count).concat([1]));
    TOWNS.forEach(function(t){
      var n=count(t), m=marks[t.t];
      if(m){ map.removeLayer(m); delete marks[t.t]; }
      if(!n) return;
      var on=sel&&sel.t===t.t;
      m=L.circleMarker([t.lat,t.lng],{radius:5+14*Math.sqrt(n/max),color:'#fff',weight:on?3:1.5,
        fillColor:on?'#1a1a1a':'#EB1A2C',fillOpacity:on?1:.78})
        .bindTooltip(t.t+': '+n+(color?' '+color:'')+' roof'+(n===1?'':'s'),{className:'ttip',direction:'top'})
        .on('click',function(){ pick(t); }).addTo(map);
      marks[t.t]=m;
    });
    show();
  }
  function show(){
    var list, label, sub;
    if(sel){
      var n=count(sel);
      label=n+' '+(color?color+' ':'')+'roof'+(n===1?'':'s')+' in '+sel.t;
      sub=color?'Tap a photo to open it':sel.s+' photographed · tap a photo';
      list=sel.ph;
      more.href='/project-map/?town='+encodeURIComponent(sel.t)+(color?'&color='+encodeURIComponent(color):'');
    } else {
      var n2=TOWNS.reduce(function(a,t){return a+count(t)},0), tw=TOWNS.filter(function(t){return count(t)}).length;
      label=n2+' '+(color?color+' ':'')+'roofs · '+tw+' towns';
      sub='Pick a town to see its roofs';
      list=[]; TOWNS.slice(0,12).forEach(function(t){ list=list.concat(t.ph.slice(0,3)); });
      more.href='/project-map/'+(color?'?color='+encodeURIComponent(color):'');
    }
    if(color) list=list.filter(function(p){return p.c.indexOf(color)>=0});
    res.innerHTML='<b>'+label+'</b><span>'+sub+'</span>';
    strip.innerHTML=list.length?list.slice(0,5).map(function(p){
      var t=sel?sel.t:'';
      return '<a href="/project-map/?p='+p.p+(t?'&town='+encodeURIComponent(t):'')+'" style="background-image:url(\''+CDN+'f_auto,q_auto,w_220,h_220,c_fill/'+p.i+'\')" aria-label="View project photo'+(p.c.length?' ('+p.c.join(', ')+')':'')+'"></a>';
    }).join(''):'<div class="empty">No photographed '+(color?color+' ':'')+'roofs here yet. Try another color or town.</div>';
  }
  function pick(t){ sel=t; if(q) q.value=t.t; map.flyTo([t.lat,t.lng],12,{duration:.8}); draw(); }
  function find(v){
    v=(v||'').trim().toLowerCase(); if(!v) { sel=null; if(HOME_B) map.flyToBounds(HOME_B); draw(); return; }
    var zip=(v.match(/\b\d{5}\b/)||[])[0];
    var t=TOWNS.find(function(t){return zip?t.z.indexOf(zip)>=0:t.t.toLowerCase()===v.replace(/\s*\(.*\)$/,'')})
      ||TOWNS.find(function(t){return t.t.toLowerCase().indexOf(v)===0});
    if(t) pick(t);
    else { res.innerHTML='<b>No Hamstra projects found there yet</b><span>Try a nearby town or ZIP</span>'; strip.innerHTML=''; }
  }
  document.getElementById('fform').addEventListener('submit',function(e){ e.preventDefault(); find(q.value); });
  q.addEventListener('change',function(){ find(q.value); });
}

/* ---------- Inspection request (Netlify Forms) ---------- */
function initForm(){
  var f=document.getElementById('inspect');
  if(!f) return;
  // ?need=hail (etc.) from an article or service page preselects the request type
  var NEED={hail:'Hail or storm damage',leak:'Roof leak or repair',replace:'Roof replacement estimate',multi:'Multi-family / HOA',cert:'Something else'};
  var need=new URLSearchParams(location.search).get('need'), sel=document.getElementById('f-type');
  if(need&&NEED[need]&&sel){ sel.value=NEED[need]; if(need==='cert'){ var m=document.getElementById('f-msg'); if(m&&!m.value) m.value='Roof certification for a home sale'; } }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=f.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Sending…';
    fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams(new FormData(f)).toString()})
    .then(function(r){ if(!r.ok) throw new Error(r.status);
      f.outerHTML='<div class="thanks" role="status"><h3>Got it. Thank you.</h3><p>Your request is in our queue. We work through requests in the order they arrive. If water is coming in right now, call <a href="tel:+18154646644"><b>(815) 464-6644</b></a>.</p></div>'; })
    .catch(function(){ btn.disabled=false; btn.textContent='Send request';
      var er=document.getElementById('ferr'); if(er) er.textContent='Sorry, that didn’t send. Please call (815) 464-6644.'; });
  });
}
