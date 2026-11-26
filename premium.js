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
 const traceTargets=[...document.querySelectorAll('.new-game-art,.product-card,.hover-panel,.release-cover,.screenshot-button')];
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
})();
