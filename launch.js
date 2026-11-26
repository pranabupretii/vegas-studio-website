(() => {
  'use strict';
  // One approved identity. Legacy query parameters never change the design.
  const url=new URL(location.href);
  for(const key of ['theme','logo','embed'])url.searchParams.delete(key);
  if(url.href!==location.href)history.replaceState(null,'',url);
  const header=document.querySelector('.launch-header');
  const menu=document.getElementById('mobile-menu');
  const navigation=document.getElementById('site-navigation');
  function closeMenu(){header.dataset.open='false';menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}
  menu.addEventListener('click',()=>{const open=header.dataset.open!=='true';header.dataset.open=String(open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});
  const portals=document.querySelector('.header-actions').cloneNode(true);
  portals.className='mobile-portals';navigation.querySelector('.nav-inner').append(portals);
  document.querySelectorAll('.nav-group').forEach(group=>group.addEventListener('toggle',()=>{if(group.open)document.querySelectorAll('.nav-group').forEach(other=>{if(other!==group)other.open=false;});}));
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-group'))document.querySelectorAll('.nav-group').forEach(x=>x.open=false);});
  navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();document.querySelectorAll('.nav-group').forEach(x=>x.open=false);}});
  const current=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/index';
  navigation.querySelectorAll('a').forEach(a=>{const target=new URL(a.href);const p=target.pathname.replace(/\.html$/,'');if(p===current&&!target.hash)a.setAttribute('aria-current','page');});
  const gate=document.getElementById('age-gate');
  let confirmed=false;try{confirmed=sessionStorage.getItem('vegas-age-confirmed')==='yes';}catch{}
  if(!confirmed){gate.showModal();document.body.style.overflow='hidden';}
  gate.addEventListener('cancel',e=>e.preventDefault());
  document.getElementById('age-confirm').addEventListener('click',()=>{
    try{sessionStorage.setItem('vegas-age-confirmed','yes');}catch{}
    gate.close();document.body.style.overflow='';document.getElementById('main').focus({preventScroll:true});
  });
  document.getElementById('age-exit').addEventListener('click',()=>{
    gate.close();document.body.style.overflow='';
    const main=document.getElementById('main');
    main.innerHTML='<section class="age-blocked"><h1>Thanks for checking.</h1><p>This website is intended for adults who meet the legal age requirement. You cannot continue without confirming eligibility.</p><a class="new-primary" href="about:blank">Leave this website</a></section>';
    document.querySelector('.launch-header').hidden=true;document.querySelector('.launch-footer').hidden=true;main.focus();
  });
  const search=document.getElementById('game-search');
  if(search){
    const cards=[...document.querySelectorAll('.catalogue .new-game-card')];
    const grid=document.querySelector('.catalogue .new-game-grid');
    const sort=document.getElementById('game-sort');
    let category=['Slots','Keno','Upcoming'].includes(url.searchParams.get('type'))?url.searchParams.get('type'):'All';
    let sourceCategory=url.searchParams.get('category')||'';let tag=url.searchParams.get('tag')||'';
    const categorySelect=document.getElementById('source-category');
    if(categorySelect){categorySelect.value=sourceCategory.replace(/^slot$/,'slots');categorySelect.addEventListener('change',()=>{sourceCategory=categorySelect.value;category='All';filter();});}
    function filter(){
      if(categorySelect)categorySelect.value=sourceCategory.replace(/^slot$/,'slots');
      const term=search.value.trim().toLowerCase();let count=0;
      for(const card of cards){const categoryMatch=category==='All'||card.dataset.category===category||(category==='Upcoming'&&card.dataset.status==='UPCOMING');const sourceMatch=!sourceCategory||(card.dataset.categories||'').split('|').includes(sourceCategory.replaceAll('-',' ').replace(/^slot$/,'slots'));const tagMatch=!tag||(card.dataset.tags||'').split(' ').includes(tag);card.hidden=!(categoryMatch&&sourceMatch&&tagMatch&&card.dataset.gameName.includes(term));if(!card.hidden)count++;}
      document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
      document.getElementById('game-count').textContent=count+' '+(count===1?'game':'games');
      document.getElementById('no-games').hidden=count!==0;
      const order=[...cards];if(sort.value!=='featured')order.sort((a,b)=>a.dataset.gameName.localeCompare(b.dataset.gameName)*(sort.value==='za'?-1:1));
      for(const card of order)grid.append(card);
    }
    search.addEventListener('input',filter);sort.addEventListener('change',filter);
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;sourceCategory='';tag='';filter();}));
    document.getElementById('reset-games').addEventListener('click',()=>{category='All';sourceCategory='';tag='';search.value='';sort.value='featured';filter();search.focus();});
    filter();
  }
})();
