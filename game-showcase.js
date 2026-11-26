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
 motion.addEventListener('change',()=>{animations.forEach(a=>a.cancel());outgoing?.remove();syncPlayback();});
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
 function select(index){
  if(current===index)return;
  const game=games[index],first=current===-1;
  animations.forEach(a=>a.cancel());animations=[];outgoing?.remove();
  if(!first&&!motion.matches){
   outgoing=content.cloneNode(true);outgoing.classList.add('showcase-outgoing');outgoing.setAttribute('aria-hidden','true');outgoing.inert=true;stage.append(outgoing);
   const old=outgoing;
   const exit=old.animate([{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0)'},{opacity:0,transform:'translateY(-22px)',clipPath:'inset(0 0 100% 0)'}],{duration:420,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
   exit.onfinish=()=>old.remove();animations.push(exit);
  }
  current=index;elapsed=0;progress.firstElementChild.style.transform='scaleX(0)';
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  const backgrounds=showcase.querySelectorAll('.showcase-background img');layer=1-layer;
  backgrounds[layer].src=game.image;backgrounds.forEach((bg,i)=>bg.classList.toggle('is-visible',i===layer));
  const cover=showcase.querySelector('.showcase-cover');cover.src=game.image;cover.alt=game.name+' artwork';
  showcase.querySelector('h3').textContent=game.name;
  showcase.querySelector('.showcase-number').textContent=String(index+1).padStart(2,'0');
  showcase.querySelector('.showcase-copy p').textContent='Discover '+game.name+' in the Vegas Studio game collection.';
  const action=showcase.querySelector('.showcase-action');action.href=game.href;action.setAttribute('aria-label','View '+game.name+' details');
  if(!first&&!motion.matches){
   [content.querySelector('.showcase-cover'),content.querySelector('.showcase-copy')].forEach((element,i)=>{
    animations.push(element.animate([{opacity:0,transform:'translateY(26px)',clipPath:'inset(100% 0 0 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0)'}],{duration:540,delay:i*70,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'}));
   });
  }
 }
 select(0);
 syncPlayback();
})();
