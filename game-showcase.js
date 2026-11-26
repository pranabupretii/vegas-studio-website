// Timed editorial showcase with manual selection, pause controls and reduced motion.
(() => {
 const section=document.querySelector('.new-games,.catalogue,[data-showcase-section]');
 if(!section)return;
 const cards=[...section.querySelectorAll('.new-game-card')].slice(0,6);
 const games=cards.map(card=>({name:card.querySelector('h3').textContent.trim(),image:card.dataset.previewCover||card.querySelector('img').getAttribute('src'),href:card.getAttribute('href')}));
 if(!games.length)return;
 const showcase=document.createElement('section');
 showcase.className='game-showcase';showcase.setAttribute('aria-label','Featured game preview');
 showcase.innerHTML='<div class="showcase-stage"><div class="showcase-background" aria-hidden="true"><img alt=""><img alt=""></div><div class="showcase-content"><img class="showcase-cover" alt=""><div class="showcase-copy"><div class="showcase-kicker">FEATURED GAME <span class="showcase-number"></span></div><h3></h3><p></p><a class="showcase-action" target="_blank" rel="noopener">View game details <span aria-hidden="true">â†—</span></a></div></div></div><div class="showcase-list"><div class="showcase-list-label">EXPLORE THE COLLECTION</div><div class="showcase-choices" role="group" aria-label="Choose a game to preview"></div></div>';
 const sectionTitle=section.querySelector('.new-section-top,.section-heading');
 if(sectionTitle)sectionTitle.after(showcase);else section.prepend(showcase);
 showcase.querySelector('.showcase-action').removeAttribute('target');
 showcase.querySelector('.showcase-action').textContent='Game details';
 showcase.querySelectorAll('.showcase-background img').forEach(img=>img.src=games[0].image);
 const stage=showcase.querySelector('.showcase-stage');
 const content=showcase.querySelector('.showcase-content');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const progress=document.createElement('div');progress.className='showcase-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';stage.append(progress);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='showcase-toggle';stage.append(toggle);
 showcase.setAttribute('aria-roledescription','carousel');
 let current=-1,layer=0,animations=[],outgoing,elapsed=0,last=0,frame=0;
 let userPaused=false,hovered=false,focused=false,visible=false;
 const duration=6000;
 function isRunning(){return !userPaused&&!hovered&&!focused&&visible&&!document.hidden&&!motion.matches;}
 function syncPlayback(){
  cancelAnimationFrame(frame);frame=0;last=0;
  toggle.disabled=motion.matches;
  toggle.textContent=motion.matches?'Motion reduced':userPaused?'Play':'Pause';
  toggle.setAttribute('aria-label',motion.matches?'Automatic rotation disabled for reduced motion':userPaused?'Play automatic game rotation':'Pause automatic game rotation');
  showcase.dataset.playback=isRunning()?'playing':'paused';
  if(isRunning())frame=requestAnimationFrame(tick);
 }
 function tick(now){
  if(!isRunning()){syncPlayback();return;}
  if(last)elapsed+=Math.min(now-last,100);last=now;
  if(elapsed>=duration)select((current+1)%games.length);
  progress.firstElementChild.style.transform='scaleX('+Math.min(elapsed/duration,1)+')';
  frame=requestAnimationFrame(tick);
 }
 toggle.addEventListener('click',()=>{userPaused=!userPaused;syncPlayback();});
 showcase.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;syncPlayback();}});
 showcase.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;syncPlayback();}});
 const updateFocus=()=>{focused=showcase.contains(document.activeElement)&&document.activeElement!==toggle;syncPlayback();};
 showcase.addEventListener('focusin',updateFocus);showcase.addEventListener('focusout',()=>queueMicrotask(updateFocus));
 document.addEventListener('visibilitychange',syncPlayback);
 motion.addEventListener('change',()=>{animations.forEach(a=>a.cancel());outgoing?.remove();sliceLayer?.remove();sliceLayer=null;stage.classList.remove('is-slicing');syncPlayback();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback();},{threshold:.25}).observe(showcase);
 const choices=showcase.querySelector('.showcase-choices');
 const buttons=games.map((game,i)=>{
  const button=document.createElement('button');button.type='button';button.className='showcase-choice';button.setAttribute('aria-label','Preview '+game.name);button.setAttribute('aria-pressed','false');
  const number=document.createElement('span');number.className='choice-number';number.textContent=String(i+1).padStart(2,'0');
  const image=document.createElement('img');image.src=game.image;image.alt='';
  const title=document.createElement('span');title.textContent=game.name;
  button.append(number,image,title);choices.append(button);
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')select(i)});
  button.addEventListener('focus',()=>select(i));button.addEventListener('click',()=>select(i));
  return button;
 });
 // Each slide is copied whole (blurred background, shade, poster, copy) so a
 // band cuts through every layer at exactly the same height.
 function snapshotSlide(){
  const slide=document.createElement('div');slide.className='slice-slide';
  const bg=document.createElement('div');bg.className='showcase-background';
  const visibleBg=stage.querySelector(':scope>.showcase-background img.is-visible');
  const img=document.createElement('img');img.alt='';img.className='is-visible';if(visibleBg)img.src=visibleBg.src;bg.append(img);
  const shade=document.createElement('div');shade.className='slice-shade';
  const copy=content.cloneNode(true);copy.removeAttribute('id');
  slide.append(bg,shade,copy);return slide;
 }
 // Horizontal "TV out of alignment" slice: the wide middle band shows the
 // incoming game first, outer bands follow, every band jitters sideways, then
 // all settle in line. at = moment (0..1) the band flips to the new slide.
 const BANDS=[
  {top:0,bottom:82,at:.56,x:[0,10,-6,3,0]},
  {top:18,bottom:66,at:.34,x:[0,-12,8,-3,0]},
  {top:34,bottom:34,at:.06,x:[0,16,-10,4,0]},
  {top:66,bottom:18,at:.34,x:[0,-9,12,-2,0]},
  {top:82,bottom:0,at:.56,x:[0,7,-11,3,0]}
 ];
 const SLICE_MS=500;
 let sliceLayer=null;
 function runSlice(oldSlide){
  const newSlide=snapshotSlide();
  const layer=document.createElement('div');layer.className='showcase-slices';layer.setAttribute('aria-hidden','true');layer.inert=true;
  BANDS.forEach(band=>{
   const el=document.createElement('div');el.className='slice-band';el.style.clipPath='inset('+band.top+'% 0 '+band.bottom+'% 0)';
   const before=oldSlide.cloneNode(true),after=newSlide.cloneNode(true);el.append(before,after);layer.append(el);
   const x=band.x,o=[0,.18,.42,.62,.82];
   animations.push(el.animate(x.map((v,i)=>({transform:'translateX('+v+'px)',offset:o[i]})).concat({transform:'translateX(0)',offset:1}),{duration:SLICE_MS,easing:'linear',fill:'both'}));
   animations.push(after.animate([{opacity:0,offset:0},{opacity:0,offset:band.at},{opacity:1,offset:band.at},{opacity:1,offset:1}],{duration:SLICE_MS,easing:'linear',fill:'both'}));
  });
  stage.append(layer);sliceLayer=layer;
  const cleanup=()=>{if(sliceLayer===layer){layer.remove();sliceLayer=null;stage.classList.remove('is-slicing');}};
  animations[animations.length-1].onfinish=cleanup;setTimeout(cleanup,SLICE_MS+80);
 }
 function select(index){
  if(current===index)return;
  const game=games[index],first=current===-1;
  const animate=!first&&!motion.matches;
  const oldSlide=animate?snapshotSlide():null;
  animations.forEach(a=>a.cancel());animations=[];outgoing?.remove();sliceLayer?.remove();sliceLayer=null;
  // Ranking highlight and progress restart move with the first slice.
  current=index;elapsed=0;progress.firstElementChild.style.transform='scaleX(0)';
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  // Swap the real slide instantly underneath; the slice layer covers it.
  stage.classList.toggle('is-slicing',animate);
  const backgrounds=showcase.querySelectorAll('.showcase-background img');layer=1-layer;
  backgrounds[layer].src=game.image;backgrounds.forEach((bg,i)=>bg.classList.toggle('is-visible',i===layer));
  const cover=showcase.querySelector('.showcase-cover');cover.src=game.image;cover.alt=game.name+' artwork';
  showcase.querySelector('h3').textContent=game.name;
  showcase.querySelector('.showcase-number').textContent=String(index+1).padStart(2,'0');
  showcase.querySelector('.showcase-copy p').textContent='Discover '+game.name+' in the Vegas Studio game collection.';
  const action=showcase.querySelector('.showcase-action');action.href=game.href;action.setAttribute('aria-label','View '+game.name+' details');
  if(animate)runSlice(oldSlide);
 }
 select(0);
 syncPlayback();
})();
