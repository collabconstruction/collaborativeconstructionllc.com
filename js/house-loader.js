/* The architectural line drawing and ordinary service links work without WebGL. */
(()=>{
 const section=document.querySelector('[data-house]');if(!section)return;
 const host=section.querySelector('.house-viewport'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const staticMode=new URLSearchParams(location.search).get('scene')==='static'||navigator.connection?.saveData===true;
 let api=null,loading=false,failed=false,inView=false,generation=0;
 const allowed=()=>!motion.matches&&!staticMode;
 function fallback(){generation++;api?.dispose();api=null;section.classList.remove('house-ready');section.dataset.renderer='static';}
 async function load(){if(api||loading||failed||!allowed())return;loading=true;const token=++generation;
  try{const module=await import('/js/house-scene.js');if(token!==generation||!allowed())return;api=module.mountHouse(host);api.visible(inView);section.classList.add('house-ready');section.dataset.renderer='webgl';}
  catch{failed=true;fallback();}finally{loading=false;}
 }
 host.addEventListener('house-failed',()=>{failed=true;fallback();});
 motion.addEventListener('change',()=>{if(allowed())load();else fallback();});
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;api?.visible(inView);if(inView)load();},{rootMargin:'120px'});observer.observe(section);}else{inView=true;load();}
 addEventListener('pagehide',()=>{fallback();});addEventListener('pageshow',event=>{if(event.persisted)load();});
 if(!allowed())fallback();
})();
