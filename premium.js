(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const heroButtons=[...document.querySelectorAll('[data-hero]')];
 const slides=[...document.querySelectorAll('.release-slide')];
 heroButtons.forEach(button=>button.addEventListener('click',()=>{
  const index=Number(button.dataset.hero);
  slides.forEach((slide,i)=>{slide.hidden=i!==index;slide.classList.toggle('is-active',i===index);});
  heroButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  if(!reduced.matches)slides[index].querySelector('.release-inner').animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'ease-out'});
 }));
 const tabs=[...document.querySelectorAll('[data-tool]')];
 function chooseTool(tab){
  tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});
 }
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>chooseTool(tab));
  tab.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();chooseTool(tabs[n]);tabs[n].focus();});
 });
 const screenshots=[...document.querySelectorAll('[data-image]')];
 if(screenshots.length){
  const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.setAttribute('aria-label','Enlarged game screenshot');
  const close=document.createElement('button');close.type='button';close.textContent='Close ×';
  const image=document.createElement('img');dialog.append(close,image);document.body.append(dialog);
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  screenshots.forEach(button=>button.addEventListener('click',()=>{image.src=button.dataset.image;image.alt=button.querySelector('img').alt;dialog.showModal();}));
 }
 document.querySelectorAll('.nav-group').forEach(group=>{
  group.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&innerWidth>800)group.open=true;});
  group.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!group.contains(document.activeElement))group.open=false;});
 });
 // Four independent clockwise perimeter traces, each starting at a corner.
 // Pixel-sized paths preserve the corner positions on wide and tall cards.
 const svgNS='http://www.w3.org/2000/svg';
 const traceTargets=[...document.querySelectorAll('.product-card,.hover-panel,.release-cover,.screenshot-button')];
 function layoutTrace(target){
  const svg=target.querySelector(':scope > .corner-trace');
  if(!svg)return;
  const w=target.clientWidth,h=target.clientHeight;
  if(!w||!h)return;
  const inset=2,r=Math.max(3,Math.min(parseFloat(getComputedStyle(target).borderTopLeftRadius)||10,18,w/4,h/4));
  const x=w-inset,y=h-inset;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const edges=[
   `M ${r} ${inset} H ${w-r} Q ${x} ${inset} ${x} ${r} V ${h-r} Q ${x} ${y} ${w-r} ${y} H ${r} Q ${inset} ${y} ${inset} ${h-r} V ${r} Q ${inset} ${inset} ${r} ${inset} Z`,
   `M ${x} ${r} V ${h-r} Q ${x} ${y} ${w-r} ${y} H ${r} Q ${inset} ${y} ${inset} ${h-r} V ${r} Q ${inset} ${inset} ${r} ${inset} H ${w-r} Q ${x} ${inset} ${x} ${r} Z`,
   `M ${w-r} ${y} H ${r} Q ${inset} ${y} ${inset} ${h-r} V ${r} Q ${inset} ${inset} ${r} ${inset} H ${w-r} Q ${x} ${inset} ${x} ${r} V ${h-r} Q ${x} ${y} ${w-r} ${y} Z`,
   `M ${inset} ${h-r} V ${r} Q ${inset} ${inset} ${r} ${inset} H ${w-r} Q ${x} ${inset} ${x} ${r} V ${h-r} Q ${x} ${y} ${w-r} ${y} H ${r} Q ${inset} ${y} ${inset} ${h-r} Z`
  ];
  [...svg.children].forEach((path,i)=>path.setAttribute('d',edges[i]));
 }
 const traceResize=new ResizeObserver(entries=>entries.forEach(entry=>layoutTrace(entry.target)));
 traceTargets.forEach(target=>{
  target.dataset.trace='corners';
  const svg=document.createElementNS(svgNS,'svg');svg.classList.add('corner-trace');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  for(let i=0;i<4;i++){const path=document.createElementNS(svgNS,'path');path.setAttribute('pathLength','400');path.setAttribute('vector-effect','non-scaling-stroke');svg.append(path);}
  const sweep=document.createElement('span');sweep.className='trace-sweep';sweep.setAttribute('aria-hidden','true');
  target.append(sweep,svg);layoutTrace(target);traceResize.observe(target);
 });
 // Game thumbnails: four pink lines start together, one at each rounded
 // corner, and run clockwise to the next corner around the artwork only
 // (title/category stay outside). The 3px stroke sits just outside the art
 // with a 1px white gap. The SVG is an overlay on the card, sized to the art
 // plus a margin, so nothing in the layout moves. Each segment is
 // pathLength=1 so long and short edges meet at the same moment (premium.css).
 const PAD=4,GAP=1,STROKE=3;
 function layoutCardTrace(card){
  const art=card.querySelector(':scope > .new-game-art'),svg=card.querySelector(':scope > .card-trace');
  if(!art||!svg)return;
  const w=art.offsetWidth,h=art.offsetHeight;
  if(!w||!h)return;
  const W=w+PAD*2,H=h+PAD*2,ar=parseFloat(getComputedStyle(art).borderTopLeftRadius)||0;
  Object.assign(svg.style,{left:(art.offsetLeft-PAD)+'px',top:(art.offsetTop-PAD)+'px',width:W+'px',height:H+'px'});
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  const ring=(o)=>{const L=PAD-o,T=PAD-o,R=PAD+w+o,B=PAD+h+o,r=ar+o;return{L,T,R,B,r,a:'A '+r+' '+r+' 0 0 1'};};
  const g=ring(GAP/2); // white gap ring, centred 0.5px outside the art
  svg.children[0].setAttribute('d','M '+(g.L+g.r)+' '+g.T+' H '+(g.R-g.r)+' '+g.a+' '+g.R+' '+(g.T+g.r)+' V '+(g.B-g.r)+' '+g.a+' '+(g.R-g.r)+' '+g.B+' H '+(g.L+g.r)+' '+g.a+' '+g.L+' '+(g.B-g.r)+' V '+(g.T+g.r)+' '+g.a+' '+(g.L+g.r)+' '+g.T+' Z');
  const p=ring(GAP+STROKE/2),{L,T,R,B,r}=p,arc=p.a; // pink stroke centre line
  const segs=[
   'M '+(L+r)+' '+T+' H '+(R-r)+' '+arc+' '+R+' '+(T+r), // top-left -> top-right
   'M '+R+' '+(T+r)+' V '+(B-r)+' '+arc+' '+(R-r)+' '+B, // top-right -> bottom-right
   'M '+(R-r)+' '+B+' H '+(L+r)+' '+arc+' '+L+' '+(B-r), // bottom-right -> bottom-left
   'M '+L+' '+(B-r)+' V '+(T+r)+' '+arc+' '+(L+r)+' '+T  // bottom-left -> top-left
  ];
  [...svg.querySelectorAll('.trace-line')].forEach((path,i)=>path.setAttribute('d',segs[i]));
 }
 const cardResize=new ResizeObserver(entries=>entries.forEach(entry=>layoutCardTrace(entry.target.closest('.new-game-card'))));
 document.querySelectorAll('.new-game-card').forEach(card=>{
  const art=card.querySelector(':scope > .new-game-art');if(!art)return;
  const svg=document.createElementNS(svgNS,'svg');svg.classList.add('card-trace');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  const gap=document.createElementNS(svgNS,'path');gap.classList.add('trace-gap');svg.append(gap);
  for(let i=0;i<4;i++){const path=document.createElementNS(svgNS,'path');path.classList.add('trace-line');path.setAttribute('pathLength','1');svg.append(path);}
  // Light sweep lives inside the artwork so it is clipped to the thumbnail.
  const sweep=document.createElement('span');sweep.className='card-sweep';sweep.setAttribute('aria-hidden','true');art.append(sweep);
  card.append(svg);layoutCardTrace(card);cardResize.observe(art);
 });
})();
// How it works timeline: fill the line and light the steps once in view.
(() => {
 const story=document.querySelectorAll('[data-story]');
 if(!story.length)return;
 if(!('IntersectionObserver' in window)){story.forEach(s=>s.classList.add('is-in'));return;}
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}}),{threshold:.35});
 story.forEach(s=>io.observe(s));
})();
// Marketing hero: show the current month in the decorative campaign calendar.
(() => {
 const box=document.querySelector('[data-cal]');if(!box)return;
 const now=new Date(),y=now.getFullYear(),m=now.getMonth(),today=now.getDate();
 const first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
 let html='';
 for(let i=0;i<first;i++)html+='<i></i>';
 for(let d=1;d<=days;d++)html+='<i'+(d===today?' class="is-pick"':'')+'>'+d+'</i>';
 for(let i=first+days;i%7;i++)html+='<i></i>';
 box.querySelector('[data-cal-days]').innerHTML=html;
 box.querySelector('[data-cal-title]').textContent=now.toLocaleString('en-GB',{month:'long',year:'numeric'});
})();
// Scroll reveals (cards, columns, headings) and a gentle hero-illustration parallax.
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduce.matches||!('IntersectionObserver' in window))return;
 const groups=[
  '.benefit-list > li','.sd-grid > li','.feature-columns > article','.product-grid > a','.promo-links > a',
  '.solution-tiles > li','.new-game-grid > a','.story-steps','.faq-section .faq-item',
  '.section-heading','.solution-detail h2','.product-benefits h2','.page-heading','.new-contact','.pd-stat-list > li','.pd-provider-grid > li','.pd-model-grid > li','.pd-card-grid > li','.pd-related-grid > li','.pd-game-row > li','.pd-split-row','.tm-list > li','.trust-stats > li','.pd-block h2'
 ];
 const els=[];
 groups.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{
  if(el.closest('.product-hero,.game-showcase,.release-hero'))return; // hero areas stay put
  const sibs=[...el.parentElement.children].filter(c=>c.matches(sel));
  el.style.setProperty('--ri',Math.min(sibs.indexOf(el),6));
  el.dataset.reveal='';els.push(el);
 }));
 if(!els.length)return;
 // Anything already on screen at load shows immediately (no flash of hidden content).
 const vh=innerHeight;
 els.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<vh*.92&&r.bottom>0)el.classList.add('is-revealed');});
 document.documentElement.classList.add('reveal-on');
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('is-revealed');io.unobserve(e.target);}
 }),{rootMargin:'0px 0px -8% 0px',threshold:.08});
 els.forEach(el=>{if(!el.classList.contains('is-revealed'))io.observe(el);});
 // Failsafe: never leave content hidden (e.g. throttled or non-composited views).
 setTimeout(()=>els.forEach(el=>el.classList.add('is-revealed')),4000);
})();
(() => {
 const vis=document.querySelector('.product-hero .ph-visual,.product-hero .agg-visual');
 if(!vis||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const hero=vis.closest('.product-hero');let ticking=false;
 const update=()=>{ticking=false;
  if(innerWidth<960){vis.style.removeProperty('--py');return;}
  const r=hero.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
  vis.style.setProperty('--py',(Math.max(-r.top,0)*-.12).toFixed(1)+'px'); // drifts up as you scroll away
 };
 addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
 addEventListener('resize',update);update();
})();
// Count-up numbers in stats bands, once, when they scroll into view.
(() => {
 const nums=[...document.querySelectorAll('[data-count]')];
 if(!nums.length||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
 const dec=el=>(el.dataset.count.split('.')[1]||'').length;
 const fmt=(el,v)=>dec(el)?v.toFixed(dec(el)):Math.round(v).toLocaleString('en-GB');
 const done=new WeakSet();
 const run=el=>{
  if(done.has(el))return;done.add(el);
  const end=parseFloat(el.dataset.count),dur=1300,t0=performance.now();
  const step=t=>{const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);el.textContent=fmt(el,end*e);if(p<1)requestAnimationFrame(step);else el.textContent=fmt(el,end);};
  requestAnimationFrame(step);
 };
 const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){io.unobserve(e.target);run(e.target);}
  else if(!done.has(e.target))e.target.textContent='0'; // off-screen: wait at zero
 }),{threshold:.6});
 nums.forEach(el=>io.observe(el));
 // Failsafe: never leave a number at zero.
 setTimeout(()=>nums.forEach(el=>{if(!done.has(el)){done.add(el);el.textContent=fmt(el,parseFloat(el.dataset.count));}}),8000);
})();
