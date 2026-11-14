/* Dzieci Maryi: menu, karuzele, powiększanie zdjęć, formularz zapisu, zgody cookies */
(function(){
  var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};

  /* menu mobilne */
  var b=$('.burger'), nav=$('#menu');
  if(b&&nav){
    var zamknij=function(){nav.classList.remove('otw');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Otwórz menu');document.body.classList.remove('menu-otw')};
    b.addEventListener('click',function(){var o=nav.classList.toggle('otw');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Zamknij menu':'Otwórz menu');document.body.classList.toggle('menu-otw',o)});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))zamknij()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('otw')){zamknij();b.focus()}});
  }

  /* pasek mobilny po przewinięciu za pierwszy ekran */
  var mob=$('.mob'), cel=$('.hero-cta')||$('.pg-cta')||$('.pod-head');
  if(mob&&cel&&'IntersectionObserver' in window){
    new IntersectionObserver(function(en){var v=!en[0].isIntersecting&&en[0].boundingClientRect.top<0;mob.classList.toggle('widac',v);mob.setAttribute('aria-hidden',!v);$$('a',mob).forEach(function(a){a.tabIndex=v?0:-1})}).observe(cel);
  }

  /* karuzele: palec, mysz, strzałki, licznik */
  $$('[data-karuzela]').forEach(function(k){
    var tor=$('.kar-tor',k), karty=tor.children, licz=$('.kar-licz span',k), prev=$('.kar-prev',k), next=$('.kar-next',k);
    if(!karty.length)return;
    /* 1.2: pozycje kolejnych zdjęć/kart (działa też przy różnych szerokościach w pasie galerii) */
    var poz=function(j){return karty[j].offsetLeft-karty[0].offsetLeft};
    var maks=function(){return Math.max(0,tor.scrollWidth-tor.clientWidth)};
    var ktory=function(){var s=tor.scrollLeft,p=0;for(var j=0;j<karty.length;j++){if(poz(j)<=s+4)p=j}return p};
    var idz=function(j){j=Math.max(0,Math.min(karty.length-1,j));tor.scrollTo({left:Math.min(poz(j),maks()),behavior:'smooth'})};
    var dalej=function(){idz(ktory()+1)};
    var wstecz=function(){var j=ktory();idz(tor.scrollLeft>poz(j)+4?j:j-1)};
    var stan=function(){
      var max=maks()-2;
      if(prev)prev.disabled=tor.scrollLeft<=2; if(next)next.disabled=tor.scrollLeft>=max;
      k.classList.toggle('bez-przewijania',max<=0);
      if(licz)licz.textContent=tor.scrollLeft>=max&&max>0?karty.length:ktory()+1;
    };
    if(prev)prev.addEventListener('click',wstecz);
    if(next)next.addEventListener('click',dalej);
    tor.addEventListener('scroll',stan,{passive:true});
    window.addEventListener('resize',function(){requestAnimationFrame(stan)});
    tor.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){dalej();e.preventDefault()}if(e.key==='ArrowLeft'){wstecz();e.preventDefault()}});
    var start=null,sl=0,ruch=false;
    tor.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;start=e.clientX;sl=tor.scrollLeft;ruch=false});
    window.addEventListener('pointermove',function(e){if(start===null)return;var d=e.clientX-start;if(Math.abs(d)>5){ruch=true;tor.classList.add('ciag')}if(ruch)tor.scrollLeft=sl-d});
    window.addEventListener('pointerup',function(){if(start===null)return;start=null;if(ruch){tor.classList.remove('ciag');var s=tor.scrollLeft,best=0;for(var j=1;j<karty.length;j++){if(Math.abs(poz(j)-s)<Math.abs(poz(best)-s))best=j}idz(best);setTimeout(function(){ruch=false},50)}});
    tor.addEventListener('click',function(e){if(ruch){e.preventDefault();e.stopPropagation()}},true);
    tor.addEventListener('dragstart',function(e){e.preventDefault()});
    requestAnimationFrame(stan); /* 1.1: bez wymuszonego przeliczenia układu w trakcie startu skryptu */
  });

  /* powiększanie zdjęć z przesuwaniem palcem */
  var grupy=[];
  $$('[data-lightbox]').forEach(function(g){grupy.push($$('a.gal-el',g))});
  $$('.tresc .wp-block-gallery, .tresc .gallery').forEach(function(g){
    var l=[];
    $$('img',g).forEach(function(img){
      var a=img.closest('a');
      if(!a){a=document.createElement('a');img.parentNode.insertBefore(a,img);a.appendChild(img)}
      var duze=img.getAttribute('data-full-url')||(img.srcset?img.srcset.split(',').map(function(s){return s.trim().split(' ')}).sort(function(x,y){return parseInt(y[1])-parseInt(x[1])})[0][0]:img.src);
      if(!/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(a.getAttribute('href')||''))a.href=duze;
      var fc=img.closest('figure');fc=fc&&$('figcaption',fc);
      a.setAttribute('data-podpis',fc?fc.textContent.trim():(img.alt||''));
      l.push(a);
    });
    if(l.length)grupy.push(l);
  });
  $$('[data-lightbox-jedno]').forEach(function(a){grupy.push([a])});
  if(grupy.length){
    var lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Powiększone zdjęcie');lb.hidden=true;
    lb.innerHTML='<button class="lb-x" type="button" aria-label="Zamknij">&times;</button><button class="lb-p" type="button" aria-label="Poprzednie">&#8249;</button><figure class="lb-f"><img alt=""><figcaption></figcaption></figure><button class="lb-n" type="button" aria-label="Następne">&#8250;</button><p class="lb-l"></p>';
    document.body.appendChild(lb);
    var im=$('img',lb),cap=$('figcaption',lb),ll=$('.lb-l',lb),akt=[],i=0,wrocDo=null;
    var pokaz=function(n){i=(n+akt.length)%akt.length;var a=akt[i];im.src=a.href;var t=a.getAttribute('data-podpis')||'',ia=a.querySelector('img');im.alt=t||(ia&&ia.alt)||'Zdjęcie';cap.textContent=t;cap.hidden=!t;ll.textContent=akt.length>1?(i+1)+' / '+akt.length:'';lb.classList.toggle('jedno',akt.length<2)};
    var otworz=function(l,n,a){akt=l;wrocDo=a;pokaz(n);lb.hidden=false;document.body.classList.add('lb-otw');$('.lb-x',lb).focus()};
    var zamk=function(){lb.hidden=true;document.body.classList.remove('lb-otw');im.removeAttribute('src');if(wrocDo)wrocDo.focus()};
    grupy.forEach(function(l){l.forEach(function(a,n){a.addEventListener('click',function(e){if(e.defaultPrevented)return;e.preventDefault();otworz(l,n,a)})})});
    $('.lb-x',lb).addEventListener('click',zamk);
    $('.lb-p',lb).addEventListener('click',function(){pokaz(i-1)});
    $('.lb-n',lb).addEventListener('click',function(){pokaz(i+1)});
    lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-f'))zamk()});
    document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')zamk();if(e.key==='ArrowLeft')pokaz(i-1);if(e.key==='ArrowRight')pokaz(i+1)});
    var sx=null,sy=0;
    lb.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});
    lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){pokaz(dx<0?i+1:i-1)}else if(dy>90){zamk()}},{passive:true});
  }

  /* formularz zapisu: pola zależne od pielgrzymki */
  $$('form#formularz').forEach(function(f){
    var opcje={};try{opcje=JSON.parse(f.getAttribute('data-opcje')||'{}')}catch(e){}
    var wyb=$('[data-wybor]',f), prz=$('[data-przystanki]',f);
    var grupa=function(n,on){$$('[data-grupa="'+n+'"]',f).forEach(function(g){g.hidden=!on;$$('input,select,textarea',g).forEach(function(x){x.disabled=!on})})};
    var ustaw=function(){
      var o=opcje[wyb.value]||{ub:0,dok:0,kosz:0,jed:'',prz:[],cel:''};
      grupa('ub',o.ub||o.dok);grupa('ub2',!!o.ub);grupa('dok',!!o.dok);grupa('kosz',!!o.kosz);grupa('jed',!!o.jed);grupa('prz',o.prz.length>0);
      if(o.ub||o.dok){grupa('ub2',!!o.ub);grupa('dok',!!o.dok)}
      $$('[data-wym]',f).forEach(function(x){x.required=!x.disabled});
      var c=$('[data-cel]',f);if(c)c.textContent=o.cel?'Cel: '+o.cel+'.':'';
      var j=$('[data-jed]',f);if(j)j.textContent=o.jed?'(dopłata '+o.jed+')':'';
      if(prz){var cur=prz.value;prz.innerHTML='';o.prz.forEach(function(p){var op=document.createElement('option');op.textContent=p;if(p===cur)op.selected=true;prz.appendChild(op)})}
    };
    if(wyb){wyb.addEventListener('change',ustaw);ustaw()}
    f.addEventListener('submit',function(e){
      if(f.getAttribute('data-tryb')==='pokaz'){e.preventDefault();if(!f.reportValidity||f.reportValidity()){var m=$('.form-msg.pokaz',f);m.hidden=false;m.scrollIntoView({block:'center',behavior:'smooth'})}return}
      var bt=$('button[type=submit]',f);if(bt){setTimeout(function(){bt.disabled=true;bt.textContent='Wysyłanie…'},0)}
    });
  });

  /* zgody cookies: niezbędne / statystyki / mapa Google; wybór na 12 miesięcy */
  var KEY='dm-zgody',ck=$('#cookie');
  var getC=function(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Date.now()-v.t<31536e6)return v}catch(e){}return null};
  var setC=function(s,m){var v={s:s?1:0,m:m?1:0,t:Date.now()};try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}return v};
  var mapy=function(on){
    $$('.map').forEach(function(m){
      var f=$('iframe',m);
      if(!on&&f){var a=m.getAttribute('data-adres')||'';m.innerHTML='<div class="map-zast"><b>'+a.replace(/[<>&]/g,'')+'</b><p>Mapa Google jest wyłączona zgodnie z wyborem plików cookies.</p><a class="btn line" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(a)+'">Wyznacz trasę w Google Maps</a></div>'}
    });
  };
  var applyC=function(v){
    if(ck)ck.classList.toggle('on',!v);
    if(!v)return;
    mapy(!!v.m);
    if(v.s&&window.dmGa)window.dmGa();
  };
  $$('[data-consent]').forEach(function(bt){bt.addEventListener('click',function(){
    var t=bt.getAttribute('data-consent'),u=$('#ck-ust'),cs=$('#ck-s'),cm=$('#ck-m'),cur=getC();
    if(t==='ust'){if(ck)ck.classList.add('on','ust');if(u)u.hidden=false;if(cs)cs.checked=!!(cur&&cur.s);if(cm)cm.checked=!cur||!!cur.m;bt.hidden=true;$('[data-consent="save"]').hidden=false;return}
    var v=t==='all'?setC(1,1):t==='min'?setC(0,0):setC(cs&&cs.checked,cm&&cm.checked);
    if(cur&&((cur.s&&!v.s&&window.dmGaOn)||(cur.m===0&&v.m)))location.reload();
    applyC(v);
  })});
  $$('[data-cookies]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(ck)ck.classList.add('on');var u=$('[data-consent="ust"]');if(u&&!u.hidden)u.click()})});
  applyC(getC());
})();
