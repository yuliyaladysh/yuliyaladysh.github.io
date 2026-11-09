(function(){
  var d=document, root=d.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yr=d.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();

  // scroll reveal with a gentle stagger among siblings
  var items=[].slice.call(d.querySelectorAll('.reveal'));
  if(reduce||!('IntersectionObserver' in window)){items.forEach(function(el){el.classList.add('in')});}
  else{
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target, sib=[].slice.call(el.parentNode.children).filter(function(n){return n.classList.contains('reveal')});
        var i=Math.max(0,sib.indexOf(el));
        el.style.transitionDelay=Math.min(i,6)*70+'ms';
        el.classList.add('in'); io.unobserve(el);
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    items.forEach(function(el){io.observe(el)});
  }

  // progress bar + header border
  var bar=d.querySelector('.progress span'), top=d.querySelector('.top'), ticking=false;
  function onScroll(){
    var h=root.scrollHeight-innerHeight, p=h>0?scrollY/h:0;
    if(bar) bar.style.transform='scaleX('+p.toFixed(4)+')';
    if(top) top.classList.toggle('scrolled',scrollY>10);
    ticking=false;
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  onScroll();

  // rotating "currently" words
  var rot=d.querySelector('.rotator');
  if(rot&&!reduce){
    var words=rot.dataset.words.split('|'), wi=0;
    setInterval(function(){
      rot.classList.add('out');
      setTimeout(function(){wi=(wi+1)%words.length;rot.textContent=words[wi];rot.classList.remove('out')},350);
    },2600);
  }

  // counters
  var counts=[].slice.call(d.querySelectorAll('.count'));
  if(!reduce&&'IntersectionObserver' in window){
    counts.forEach(function(c){c.textContent='0'});
    var co=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target, to=+el.dataset.to, t0=null, dur=1600;
        (function step(t){
          if(!t0) t0=t;
          var k=Math.min(1,(t-t0)/dur), v=1-Math.pow(1-k,3);
          el.textContent=Math.round(to*v);
          if(k<1) requestAnimationFrame(step);
        })(performance.now());
        co.unobserve(el);
      });
    },{threshold:.6});
    counts.forEach(function(c){co.observe(c)});
  }

  // a tiny plane drifting along the dotted route in the hero
  var path=d.getElementById('routePath'), hero=d.querySelector('.hero');
  if(path&&hero&&!reduce&&path.getTotalLength){
    var plane=d.createElementNS('http://www.w3.org/2000/svg','svg');
    plane.setAttribute('viewBox','0 0 24 24');plane.setAttribute('class','plane');plane.setAttribute('aria-hidden','true');
    plane.innerHTML='<path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>';
    hero.appendChild(plane);
    var L=path.getTotalLength(), start=null, period=22000, visible=true;
    new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(hero);
    function fly(t){
      if(!start) start=t;
      if(visible){
        var k=((t-start)%period)/period, w=hero.clientWidth/1200, h=hero.clientHeight/600;
        var a=path.getPointAtLength(k*L), b=path.getPointAtLength(Math.min(L,k*L+2));
        var ang=Math.atan2((b.y-a.y)*h,(b.x-a.x)*w)*180/Math.PI+90;
        plane.style.transform='translate('+(a.x*w-11)+'px,'+(a.y*h-11)+'px) rotate('+ang+'deg)';
        plane.style.opacity=(k<.04||k>.96)?0:.9;
      }
      requestAnimationFrame(fly);
    }
    requestAnimationFrame(fly);
  }

  // timeline: collapse earlier years
  var tl=d.querySelector('.timeline'), more=d.querySelector('.more');
  var allRows=[].slice.call(d.querySelectorAll('.timeline li'));
  allRows.forEach(function(r,i){if(i>=8) r.classList.add('early')});
  if(more) more.addEventListener('click',function(){tl.classList.add('open');more.hidden=true;more.setAttribute('aria-expanded','true')});
  // timeline filter
  var tabs=[].slice.call(d.querySelectorAll('.tabs button')), rows=[].slice.call(d.querySelectorAll('.timeline li'));
  tabs.forEach(function(b){
    b.addEventListener('click',function(){
      tabs.forEach(function(x){x.setAttribute('aria-selected',x===b)});
      var f=b.dataset.filter;
      rows.forEach(function(r){r.classList.toggle('hide',f!=='all'&&r.dataset.type!==f);r.classList.add('in')});
      if(f!=='all'){tl.classList.add('open');more.hidden=true}
    });
  });
})();
