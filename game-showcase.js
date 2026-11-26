// Featured games: retro-arcade banner.
//
// Performance notes (from profiling the previous build):
// - Each switch used to clone the whole slide 6x, including a CSS-blurred
//   124% background image, then move those copies every frame. The blur had
//   to be re-rasterised for every copy, and new <img> elements decoded on
//   the frame the effect started. That paint/decode work was the stutter.
// - Now: the blurred background is pre-rendered once per game into a tiny
//   canvas image (no CSS filter at all), the next game is decoded before its
//   transition starts, and only two persistent slide buffers + one band
//   exist. Motion is transform/opacity only, and the progress bar is a single
//   compositor-driven scaleX animation that doubles as the autoplay timer.
(() => {
 const section=document.querySelector('.new-games,.catalogue,[data-showcase-section]');
 if(!section)return;
 const cards=[...section.querySelectorAll('.new-game-card')].slice(0,6);
 const games=cards.map(card=>({
  name:card.querySelector('h3').textContent.trim(),
  image:card.dataset.previewCover||card.querySelector('img').getAttribute('src'),
  href:card.getAttribute('href')
 }));
 if(!games.length)return;

 const PROVIDER='Vegas Studio';
 const CTA_LABEL='Game details';
 const DURATION=5000;   // progress bar fill = autoplay interval
 const SLICE_MS=300;    // band reveal -> settled slide
 const FADE_MS=200;     // reduced-motion swap

 const slideHTML=
  '<div class="arcade-bg" aria-hidden="true"></div>'+
  '<div class="arcade-content">'+
   '<img class="arcade-poster" alt="" decoding="async">'+
   '<div class="arcade-copy">'+
    '<div class="arcade-rank"></div>'+
    '<div class="arcade-label">Featured game</div>'+
    '<h3 class="arcade-title"></h3>'+
    '<p class="arcade-provider"></p>'+
    '<a class="arcade-cta"></a>'+
   '</div>'+
  '</div>';

 const showcase=document.createElement('section');
 showcase.className='game-showcase';
 showcase.setAttribute('aria-label','Featured games');
 showcase.setAttribute('aria-roledescription','carousel');
 showcase.innerHTML=
  '<div class="arcade-stage">'+
   '<div class="arcade-slide is-current">'+slideHTML+'</div>'+
   '<div class="arcade-slide" aria-hidden="true">'+slideHTML+'</div>'+
   '<div class="arcade-band" aria-hidden="true"><div class="arcade-slide">'+slideHTML+'</div></div>'+
   '<div class="arcade-progress" aria-hidden="true"><span></span></div>'+
   '<button type="button" class="showcase-toggle"></button>'+
  '</div>'+
  '<div class="showcase-list"><div class="showcase-list-label">EXPLORE THE COLLECTION</div>'+
  '<div class="showcase-choices" role="group" aria-label="Choose a featured game"></div></div>';
 const sectionTitle=section.querySelector('.new-section-top,.section-heading');
 if(sectionTitle)sectionTitle.after(showcase);else section.prepend(showcase);

 const stage=showcase.querySelector('.arcade-stage');
 let [front,back]=stage.querySelectorAll(':scope > .arcade-slide');
 const band=stage.querySelector('.arcade-band');
 const bandSlide=band.firstElementChild;
 const bar=stage.querySelector('.arcade-progress span');
 const toggle=stage.querySelector('.showcase-toggle');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 back.inert=true;bandSlide.inert=true;

 // ---- assets: decode artwork + pre-render the blurred background once ----
 const assets=new Map();
 function loadAssets(i){
  if(assets.has(i))return assets.get(i);
  const p=(async()=>{
   const img=new Image();img.src=games[i].image;
   try{await img.decode();}catch(e){return {bg:''};}
   // Tiny blurred copy, upscaled by the GPU: looks like a heavy blur but
   // costs nothing to paint or move.
   const w=96,h=Math.max(1,Math.round(w*9/16));
   const c=document.createElement('canvas');c.width=w;c.height=h;
   const ctx=c.getContext('2d');
   ctx.filter='blur(3px) saturate(1.15)';
   const s=Math.max(w/img.naturalWidth,h/img.naturalHeight)*1.25;
   const dw=img.naturalWidth*s,dh=img.naturalHeight*s;
   ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
   let bg='';try{bg='url('+c.toDataURL('image/jpeg',.85)+')';}catch(e){}
   return {bg};
  })();
  assets.set(i,p);return p;
 }

 function fill(slide,i,a){
  const g=games[i];
  slide.querySelector('.arcade-bg').style.backgroundImage=a.bg||'none';
  const poster=slide.querySelector('.arcade-poster');poster.src=g.image;poster.alt=g.name+' artwork';
  slide.querySelector('.arcade-rank').textContent='#'+(i+1);
  slide.querySelector('.arcade-title').textContent=g.name;
  slide.querySelector('.arcade-provider').textContent=PROVIDER;
  const cta=slide.querySelector('.arcade-cta');cta.textContent=CTA_LABEL;cta.href=g.href;cta.setAttribute('aria-label',CTA_LABEL+': '+g.name);
 }
 // Fill a slide off-screen and wait until its poster is decoded.
 async function prepare(slide,i,my){
  const a=await loadAssets(i);
  if(my!==token)return; // a newer selection owns the buffers now
  fill(slide,i,a);
  try{await slide.querySelector('.arcade-poster').decode();}catch(e){}
 }

 // ---- state: one active transition, one timer, latest selection wins ----
 let current=-1,target=-1,token=0,anims=[];
 let userPaused=false,hovered=false,focused=false,visible=false;

 // The progress bar animation IS the autoplay timer (compositor scaleX).
 const barAnim=bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:DURATION,fill:'forwards'});
 barAnim.pause();
 barAnim.onfinish=()=>{if(isRunning())select((target+1)%games.length);};
 function restartBar(){barAnim.currentTime=0;syncPlayback();}

 function isRunning(){return !userPaused&&!hovered&&!focused&&visible&&!document.hidden&&!motion.matches;}
 function syncPlayback(){
  toggle.disabled=motion.matches;
  toggle.textContent=motion.matches?'Motion reduced':userPaused?'Play':'Pause';
  toggle.setAttribute('aria-label',motion.matches?'Automatic rotation disabled for reduced motion':userPaused?'Play automatic game rotation':'Pause automatic game rotation');
  const run=isRunning()&&target===current; // hold the bar while the next slide loads
  showcase.dataset.playback=run?'playing':'paused';
  if(run){if(barAnim.playState!=='finished')barAnim.play();}else barAnim.pause();
 }
 toggle.addEventListener('click',()=>{userPaused=!userPaused;syncPlayback();});
 stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;syncPlayback();}});
 stage.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovered=false;syncPlayback();}});
 const updateFocus=()=>{focused=stage.contains(document.activeElement)&&document.activeElement!==toggle;syncPlayback();};
 stage.addEventListener('focusin',updateFocus);stage.addEventListener('focusout',()=>queueMicrotask(updateFocus));
 document.addEventListener('visibilitychange',syncPlayback);
 motion.addEventListener('change',()=>{settle();syncPlayback();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback();},{threshold:.25}).observe(stage);

 // ---- collection list ----------------------------------------------------
 const choices=showcase.querySelector('.showcase-choices');
 const buttons=games.map((game,i)=>{
  const button=document.createElement('button');
  button.type='button';button.className='showcase-choice';
  button.setAttribute('aria-label','Feature '+game.name);button.setAttribute('aria-pressed','false');
  const number=document.createElement('span');number.className='choice-number';number.textContent=String(i+1).padStart(2,'0');
  const image=document.createElement('img');image.src=game.image;image.alt='';
  const label=document.createElement('span');label.textContent=game.name;
  button.append(number,image,label);choices.append(button);
  button.addEventListener('click',()=>select(i));
  return button;
 });
 function highlight(i){buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}

 // Jump any running transition to its end state and promote the back buffer.
 function settle(){
  if(!anims.length)return;
  const done=anims;anims=[];
  swapBuffers();done.forEach(a=>a.cancel()); // end state first, then drop the held frame
 }
 function swapBuffers(){
  const hadFocus=front.contains(document.activeElement);
  [front,back]=[back,front];
  front.classList.add('is-current');front.removeAttribute('aria-hidden');front.inert=false;
  back.classList.remove('is-current');back.setAttribute('aria-hidden','true');back.inert=true;
  band.classList.remove('is-active');
  if(hadFocus)front.querySelector('.arcade-cta').focus({preventScroll:true});
 }

 async function select(i){
  if(i===target)return;
  const my=++token;target=i;
  highlight(i);          // immediate feedback in the list
  syncPlayback();        // freeze the bar until the new slide is ready
  settle();              // only one active transition
  const first=current===-1;
  if(first){await prepare(front,i,my);if(my!==token)return;current=i;restartBar();loadAssets((i+1)%games.length);return;}
  const reduce=motion.matches;
  await Promise.all([prepare(back,i,my),reduce?null:prepare(bandSlide,i,my)]);
  if(my!==token)return;  // a newer click took over; the old slide stayed visible
  current=i;
  if(reduce){
   anims=[back.animate([{opacity:0},{opacity:1}],{duration:FADE_MS,easing:'ease-out',fill:'forwards'})];
  }else{
   band.classList.add('is-active');
   // One 300ms effect. 0-200ms: the centre band shows the incoming game and
   // shakes with shrinking swings (0,+6,-5,+4,-3,+2,0 px) while the outgoing
   // game stays above and below it. 200-300ms: the rest of the incoming
   // slide fades up and the picture settles. Only the band moves.
   const SHAKE=[0,6,-5,4,-3,2,0],SHAKE_END=200/SLICE_MS;
   anims=[
    band.animate(SHAKE.map((x,n)=>({opacity:1,transform:'translateX('+x+'px)',offset:n/(SHAKE.length-1)*SHAKE_END,easing:'ease-in-out'}))
     .concat({opacity:1,transform:'translateX(0)',offset:1}),{duration:SLICE_MS,easing:'linear',fill:'forwards'}),
    back.animate([
     {opacity:0,offset:0},{opacity:0,offset:SHAKE_END,easing:'ease-out'},{opacity:1,offset:1}
    ],{duration:SLICE_MS,easing:'linear',fill:'forwards'})
   ];
  }
  restartBar();
  const these=anims;
  Promise.all(these.map(a=>a.finished)).then(()=>{if(anims===these){anims=[];swapBuffers();these.forEach(a=>a.cancel());}}).catch(()=>{});
  loadAssets((i+1)%games.length); // decode the next game ahead of time
 }

 select(0);
 syncPlayback();
})();
