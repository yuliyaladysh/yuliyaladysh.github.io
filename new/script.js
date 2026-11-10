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
  var bar=d.querySelector('.progress span'), ticking=false;
  function onScroll(){
    var h=root.scrollHeight-innerHeight, p=h>0?scrollY/h:0;
    if(bar) bar.style.transform='scaleX('+p.toFixed(4)+')';
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

  // chapter tabs
  var tabs=[].slice.call(d.querySelectorAll('[role=tab]'));
  function show(i,focus){
    tabs.forEach(function(t,k){
      var on=k===i, p=d.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected',on); t.tabIndex=on?0:-1; p.hidden=!on;
    });
    if(focus) tabs[i].focus();
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){show(i)});
    t.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){e.preventDefault();show((i+1)%tabs.length,true)}
      if(e.key==='ArrowLeft'){e.preventDefault();show((i-1+tabs.length)%tabs.length,true)}
    });
  });
  [].slice.call(d.querySelectorAll('.next')).forEach(function(b){
    b.addEventListener('click',function(){
      show(+b.dataset.go-1);
      var s=d.getElementById('story'); s.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    });
  });
  // swipe between chapters on touch
  var panels=d.querySelector('.panels'), sx=null, sy=null;
  panels.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  panels.addEventListener('touchend',function(e){
    if(sx===null) return;
    var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy; sx=null;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){
      var cur=tabs.findIndex(function(t){return t.getAttribute('aria-selected')==='true'});
      var n=cur+(dx<0?1:-1); if(n>=0&&n<tabs.length) show(n);
    }
  },{passive:true});

  // torch dots for the events in chapter II (tap to open that line)
  var tw=d.querySelector('.torches');
  if(tw){
    var evs=[].slice.call(d.querySelectorAll('#p2 li[data-event]'));
    evs.forEach(function(li,i){
      li.classList.add('ev');
      var t=d.createElement('button'); t.className='torch'; t.type='button'; t.tabIndex=-1;
      t.innerHTML='<i style="animation-delay:'+(i*70)+'ms"></i><small>'+li.dataset.event.slice(2,4).replace(/^/,"’")+'</small>';
      t.title=li.querySelector('b').textContent;
      t.addEventListener('click',function(){ if(!li.classList.contains('open')) li.querySelector('.line').click(); li.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'}); });
      tw.appendChild(t);
    });
  }
  // expandable lines
  [].slice.call(d.querySelectorAll('.line')).forEach(function(b){
    b.addEventListener('click',function(){
      var li=b.parentNode, open=!li.classList.contains('open');
      li.classList.toggle('open',open); b.setAttribute('aria-expanded',open);
    });
  });
})();
