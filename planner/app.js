"use strict";
/* Null Doubles Planner — drag sprites onto a 2v2 board. Local only. */
let SP=[], SLOTS={}, sel=null;
const $=s=>document.querySelector(s);
const KEY='null-doubles-planner';

const SLOTDEF=[
  ['foe-active','A',2,'active'],['foe-bench','B',4,'bench'],
  ['you-active','A',2,'active'],['you-bench','B',4,'bench']
];
const badge=n=>/-Mega|-Primal|-Tera$/.test(n)
  ? '<span class="mega">'+(/-Primal/.test(n)?'PRIMAL':'MEGA')+'</span>' : '';
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sprite=i=>'sprites/'+(i+1)+'.png';

/* ---------- tray ---------- */
function renderTray(q){
  q=(q||'').trim().toLowerCase();
  const out=[];
  for(let i=0;i<SP.length && out.length<150;i++){
    if(q && SP[i].toLowerCase().indexOf(q)===-1) continue;
    out.push(`<div class="cand" draggable="true" data-i="${i}" title="${esc(SP[i])}">
      <img src="${sprite(i)}" alt="" onerror="this.style.opacity=.25">
      <span>${esc(SP[i])}</span></div>`);
  }
  $('#results').innerHTML=out.join('');
  const total=q? SP.filter(n=>n.toLowerCase().includes(q)).length : SP.length;
  $('#count').textContent = total>out.length
    ? `showing ${out.length} of ${total} — keep typing`
    : `${total} pokemon`;
}

/* ---------- board ---------- */
function buildBoard(){
  for(const [id,tag,n,kind] of SLOTDEF){
    const host=$('#'+id); host.innerHTML='';
    for(let k=0;k<n;k++){
      const key=id+':'+k;
      SLOTS[key]=SLOTS[key]||null;
      const d=document.createElement('div');
      d.className='slot '+kind; d.dataset.key=key;
      host.appendChild(d);
    }
  }
  paint();
}
function paint(){
  document.querySelectorAll('.slot').forEach(d=>{
    const m=SLOTS[d.dataset.key];
    const kind=d.classList.contains('bench')?'bench':'active';
    if(!m){ d.innerHTML=`<span class="tag">${kind==='bench'?'bench':'active'}</span>
                         <span class="empty">drop here</span>`; return; }
    d.innerHTML=`<span class="tag">${kind==='bench'?'bench':'active'}</span>
      <span class="x" data-x="${d.dataset.key}">&times;</span>
      <div class="mon" draggable="true" data-from="${d.dataset.key}">
        <img src="${sprite(m.i)}" alt="" onerror="this.style.opacity=.25">
        <div class="nm">${esc(SP[m.i])}${badge(SP[m.i])}</div>
        <div class="meta">${m.level?'L'+m.level:''}${m.speed?' · '+m.speed+' spe':''}</div>
      </div>`;
  });
  speedStrip();
  save(true);
}
function speedStrip(){
  const units=[];
  for(const key in SLOTS){
    if(!key.includes('active')) continue;
    const m=SLOTS[key]; if(!m) continue;
    units.push({m,side:key.startsWith('you')?'you':'foe',spe:+m.speed||0});
  }
  if(!units.length){ $('#order').innerHTML='<span class="none">place active pokemon to see turn order</span>'; return; }
  units.sort((a,b)=>b.spe-a.spe);
  $('#order').innerHTML=units.map((u,i)=>
    (i?'<span class="arrow">▸</span>':'')+
    `<span class="u ${u.side}"><img src="${sprite(u.m.i)}" alt="">${esc(SP[u.m.i])}`+
    `${u.spe?' <b>'+u.spe+'</b>':' <i style="color:#6b7383">?</i>'}</span>`
  ).join('');
}

/* ---------- drag & drop ---------- */
let drag=null;
document.addEventListener('dragstart',e=>{
  const c=e.target.closest('.cand'), m=e.target.closest('.mon');
  if(c) drag={i:+c.dataset.i};
  else if(m) drag={from:m.dataset.from};
  else return;
  e.dataTransfer.effectAllowed='move';
  try{ e.dataTransfer.setData('text/plain','x'); }catch(_){}
});
document.addEventListener('dragover',e=>{
  const s=e.target.closest('.slot'); if(!s||!drag) return;
  e.preventDefault(); s.classList.add('over');
});
document.addEventListener('dragleave',e=>{
  const s=e.target.closest('.slot'); if(s) s.classList.remove('over');
});
document.addEventListener('drop',e=>{
  const s=e.target.closest('.slot'); if(!s||!drag) return;
  e.preventDefault(); s.classList.remove('over');
  const key=s.dataset.key;
  if(drag.from){                       // moving/swapping within the board
    const tmp=SLOTS[key]; SLOTS[key]=SLOTS[drag.from]; SLOTS[drag.from]=tmp;
  } else {
    SLOTS[key]={i:drag.i,level:'',speed:'',item:'',notes:''};
  }
  drag=null; paint();
});
document.addEventListener('dragend',()=>{ drag=null;
  document.querySelectorAll('.slot.over').forEach(s=>s.classList.remove('over')); });

/* ---------- detail ---------- */
document.addEventListener('click',e=>{
  const x=e.target.closest('[data-x]');
  if(x){ SLOTS[x.dataset.x]=null; if(sel===x.dataset.x){sel=null;$('#detail').classList.remove('on');} paint(); return; }
  const mon=e.target.closest('.mon');
  if(mon){ openDetail(mon.dataset.from); return; }
  if(e.target.id==='dclose'){ sel=null; $('#detail').classList.remove('on'); }
});
function openDetail(key){
  const m=SLOTS[key]; if(!m) return;
  sel=key;
  $('#dimg').src=sprite(m.i); $('#dname').textContent=SP[m.i];
  $('#dlevel').value=m.level||''; $('#dspeed').value=m.speed||'';
  $('#ditem').value=m.item||'';   $('#dnotes').value=m.notes||'';
  $('#detail').classList.add('on');
}
['dlevel','dspeed','ditem','dnotes'].forEach(id=>{
  document.addEventListener('input',e=>{
    if(e.target.id!==id||!sel) return;
    const m=SLOTS[sel]; if(!m) return;
    m[{dlevel:'level',dspeed:'speed',ditem:'item',dnotes:'notes'}[id]]=e.target.value;
    paint();
  });
});

/* ---------- persistence ---------- */
function save(quiet){
  try{ localStorage.setItem(KEY,JSON.stringify(SLOTS)); }catch(_){}
  if(!quiet) flash('saved');
}
function load(){
  try{
    const j=JSON.parse(localStorage.getItem(KEY)||'null');
    if(j){ SLOTS=j; buildBoard(); flash('loaded'); }
  }catch(_){}
}
function flash(t){
  const b=$('#save'); const o=b.textContent; b.textContent=t;
  setTimeout(()=>b.textContent=o,900);
}
$('#save').onclick=()=>save(false);
$('#load').onclick=load;
$('#clear').onclick=()=>{ for(const k in SLOTS) SLOTS[k]=null;
  sel=null; $('#detail').classList.remove('on'); paint(); };
$('#search').addEventListener('input',e=>renderTray(e.target.value));

fetch('species.json').then(r=>r.json()).then(d=>{
  SP=d; buildBoard();
  try{ const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(j){SLOTS=j;buildBoard();} }catch(_){}
  renderTray('');
});
