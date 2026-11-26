// Featured games: full-width "Cinematic Gallery" hero.
// - Each slide uses the game's own wide banner artwork (visual on the right),
//   faded into deep plum on the left behind the copy.
// - Five game tabs along the bottom of the banner replace the side list.
// - Transition: one centre band shows the incoming game and shakes
//   0,+6,-5,+4,-3,+2,0 px over 200 ms while the outgoing game stays visible
//   above and below; the rest of the incoming slide fades up over 100 ms.
// - Performance: artwork is decoded before a transition starts, two slide
//   buffers + one band are reused, motion is transform/opacity only, and the
//   progress bar's scaleX animation is the single autoplay timer.
(() => {
 const section=document.querySelector('.new-games,.catalogue,[data-showcase-section]');
 if(!section)return;

 // Wide banner art from each game's detail page.
 const BANNERS={
  'game-buffaloquest':'/assets/source-b6b0a2f0dee183.png','game-fairyswish':'/assets/source-49e8d542c3df10.png',
  'game-godofthenile':'/assets/source-fcbb2bae3cae63.png','game-goldenluck':'/assets/source-74324fb0f26eea.png',
  'game-gorillamadness':'/assets/source-223bc412c1784b.png','game-greenhillsglory':'/assets/source-82c367cc93eaae.png',
  'game-jugglingjackpot':'/assets/source-309ff5c8043849.png','game-lifeofluxury':'/assets/source-78125ab77bd3bd.png',
  'game-mechanicaltitans':'/assets/source-2bdb1f05910e61.png','game-merlinsmagic':'/assets/source-88003b27526f58.png',
  'game-robinsrise':'/assets/source-2a6821e8a1c39c.png','game-rockstarriffs':'/assets/source-8147839493b3f7.png',
  'game-springtimedelight':'/assets/source-bb5844dcc49490.png','game-steamstrikes':'/assets/source-9fe9bfc48c7f19.png',
  'game-superhexakeno':'/assets/source-13ab7b740b4c59.png','game-superkeno':'/assets/source-a4ff8f4c47be29.png',
  'game-superwildkeno':'/assets/source-2073d19e204182.png','game-tripleseven':'/assets/source-523d62f9360b24.png',
  'game-wishesandwild':'/assets/source-de38de34801430.png'
 };
 const slug=href=>(href||'').split(/[?#]/)[0].replace(/^.*\//,'').replace(/\.html$/,'');

 const cards=[...section.querySelectorAll('.new-game-card')].slice(0,5);
 const games=cards.map(card=>{
  const href=card.getAttribute('href');
  const thumb=card.querySelector('img').getAttribute('src');
  return {name:card.querySelector('h3').textContent.trim(),href,thumb,art:BANNERS[slug(href)]||card.dataset.previewCover||thumb};
 });
 if(!games.length)return;

 const PROVIDER='Vegas Studio';
 const CTA_LABEL='Game details';
 const DURATION=5000;          // progress bar fill = autoplay interval
 const SLICE_MS=300;           // whole effect
 const SHAKE=[0,6,-5,4,-3,2,0];// px, over the first 200 ms
 const SHAKE_END=200/SLICE_MS;
 const FADE_MS=200;            // reduced-motion swap
 const pad=n=>String(n).padStart(2,'0');

 const slideHTML=
  '<img class="cine-art" alt="" decoding="async">'+
  '<div class="cine-shade" aria-hidden="true"></div>'+
  '<div class="cine-copy">'+
   '<div class="cine-label">Featured game <span class="cine-num"></span></div>'+
   '<h3 class="cine-title"><span></span></h3>'+
   '<p class="cine-provider"></p>'+
   '<a class="cine-cta"></a>'+
  '</div>';

 const showcase=document.createElement('section');
 showcase.className='game-showcase cine';
 showcase.setAttribute('aria-label','Featured games');
 showcase.setAttribute('aria-roledescription','carousel');
 showcase.innerHTML=
  '<div class="cine-stage">'+
   '<div class="cine-slide is-current">'+slideHTML+'</div>'+
   '<div class="cine-slide" aria-hidden="true">'+slideHTML+'</div>'+
   '<div class="cine-band" aria-hidden="true"><div class="cine-slide">'+slideHTML+'</div></div>'+
   '<button type="button" class="cine-toggle"></button>'+
  '</div>'+
  '<div class="cine-tabs" role="group" aria-label="Choose a featured game"></div>'+
  '<div class="cine-progress" aria-hidden="true"><span></span></div>';
 const sectionTitle=section.querySelector('.new-section-top,.section-heading');
 if(sectionTitle)sectionTitle.after(showcase);else section.prepend(showcase);

 const stage=showcase.querySelector('.cine-stage');
 let [front,back]=stage.querySelectorAll(':scope > .cine-slide');
 const band=stage.querySelector('.cine-band');
 const bandSlide=band.firstElementChild;
 const toggle=stage.querySelector('.cine-toggle');
 const strip=showcase.querySelector('.cine-tabs');
 const bar=showcase.querySelector('.cine-progress span');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 back.inert=true;bandSlide.inert=true;

 // Band = fixed window across the middle of the stage onto a full-size copy
 // of the incoming slide, so poster art and title line up exactly.
 function layoutBand(){
  const h=stage.clientHeight;if(!h)return;
  const top=Math.round(h*.34),bh=Math.round(h*.32);
  band.style.top=top+'px';band.style.height=bh+'px';
  bandSlide.style.top=-top+'px';bandSlide.style.height=h+'px';
 }
 new ResizeObserver(layoutBand).observe(stage);layoutBand();

 // ---- assets -------------------------------------------------------------
 const decoded=new Map();
 function loadArt(i){
  if(!decoded.has(i)){const img=new Image();img.src=games[i].art;decoded.set(i,img.decode().catch(()=>{}));}
  return decoded.get(i);
 }
 function fill(slide,i){
  const g=games[i];
  const art=slide.querySelector('.cine-art');art.src=g.art;art.alt=g.name+' artwork';
  slide.querySelector('.cine-num').textContent=pad(i+1);
  slide.querySelector('.cine-title span').textContent=g.name;
  slide.querySelector('.cine-provider').textContent=PROVIDER;
  const cta=slide.querySelector('.cine-cta');cta.textContent=CTA_LABEL;cta.href=g.href;cta.setAttribute('aria-label',CTA_LABEL+': '+g.name);
 }
 async function prepare(slide,i,my){
  await loadArt(i);
  if(my!==token)return;          // a newer selection owns the buffers now
  fill(slide,i);
  try{await slide.querySelector('.cine-art').decode();}catch(e){}
 }

 // ---- state: one active transition, one timer, latest selection wins ----
 let current=-1,target=-1,token=0,anims=[];
 let userPaused=false,hovered=false,focused=false,visible=false;
 const barAnim=bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:DURATION,fill:'forwards'});
 barAnim.pause();
 barAnim.onfinish=()=>{if(isRunning())select((target+1)%games.length);};
 function restartBar(){barAnim.currentTime=0;syncPlayback();}
 function isRunning(){return !userPaused&&!hovered&&!focused&&visible&&!document.hidden&&!motion.matches;}
 function syncPlayback(){
  toggle.disabled=motion.matches;
  toggle.textContent=motion.matches?'Motion reduced':userPaused?'Play':'Pause';
  toggle.setAttribute('aria-label',motion.matches?'Automatic rotation disabled for reduced motion':userPaused?'Play automatic game rotation':'Pause automatic game rotation');
  toggle.setAttribute('aria-pressed',String(userPaused));
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

 // ---- tabs ---------------------------------------------------------------
 const tabs=games.map((g,i)=>{
  const b=document.createElement('button');b.type='button';b.className='cine-tab';
  b.setAttribute('aria-label','Feature '+g.name);b.setAttribute('aria-pressed','false');
  const img=document.createElement('img');img.src=g.thumb;img.alt='';
  const num=document.createElement('span');num.className='cine-tab-num';num.textContent=pad(i+1);
  const name=document.createElement('span');name.className='cine-tab-name';name.textContent=g.name;
  b.append(img,num,name);strip.append(b);
  b.addEventListener('click',()=>select(i));
  return b;
 });
 function highlight(i){
  tabs.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));
  // Keep the selected tab visible in the swipeable strip (no page scroll).
  const t=tabs[i];if(strip.scrollWidth>strip.clientWidth){
   const l=t.offsetLeft-strip.offsetLeft,r=l+t.offsetWidth;
   if(l<strip.scrollLeft||r>strip.scrollLeft+strip.clientWidth)strip.scrollTo({left:l-16,behavior:motion.matches?'auto':'smooth'});
  }
 }

 function settle(){
  if(!anims.length)return;
  const done=anims;anims=[];
  swapBuffers();done.forEach(a=>a.cancel());
 }
 function swapBuffers(){
  const hadFocus=front.contains(document.activeElement);
  [front,back]=[back,front];
  front.classList.add('is-current');front.removeAttribute('aria-hidden');front.inert=false;
  back.classList.remove('is-current');back.setAttribute('aria-hidden','true');back.inert=true;
  band.classList.remove('is-active');
  if(hadFocus)front.querySelector('.cine-cta').focus({preventScroll:true});
 }

 async function select(i){
  if(i===target)return;
  const my=++token;target=i;
  highlight(i);
  syncPlayback();   // freeze the timer until the new slide is decoded
  settle();         // only one active transition
  if(current===-1){await prepare(front,i,my);if(my!==token)return;current=i;restartBar();loadArt((i+1)%games.length);return;}
  const reduce=motion.matches;
  await Promise.all([prepare(back,i,my),reduce?null:prepare(bandSlide,i,my)]);
  if(my!==token)return;  // a newer click took over; the old slide stayed up
  current=i;
  if(reduce){
   anims=[back.animate([{opacity:0},{opacity:1}],{duration:FADE_MS,easing:'ease-out',fill:'forwards'})];
  }else{
   band.classList.add('is-active');
   anims=[
    band.animate(SHAKE.map((x,n)=>({opacity:1,transform:'translateX('+x+'px)',offset:n/(SHAKE.length-1)*SHAKE_END,easing:'ease-in-out'}))
     .concat({opacity:1,transform:'translateX(0)',offset:1}),{duration:SLICE_MS,easing:'linear',fill:'forwards'}),
    back.animate([{opacity:0,offset:0},{opacity:0,offset:SHAKE_END,easing:'ease-out'},{opacity:1,offset:1}],{duration:SLICE_MS,easing:'linear',fill:'forwards'})
   ];
  }
  restartBar();
  const these=anims;
  Promise.all(these.map(a=>a.finished)).then(()=>{if(anims===these){anims=[];swapBuffers();these.forEach(a=>a.cancel());}}).catch(()=>{});
  loadArt((i+1)%games.length); // decode the next game ahead of time
 }

 select(0);
 syncPlayback();
})();
