'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
/* ---------- Catálogo de PLC (capacidades típicas, ver Clase 2) ---------- */
const PLCS={
 'LOGO! 8':{di:8,do:4,ai:4,ao:0,k:'Compacto',ip:'192.168.0.3'},
 'S7-1200 CPU 1215C AC/DC/RLY':{di:14,do:10,ai:2,ao:2,k:'Compacto',ip:'192.168.0.1'},
 'S7-1500 CPU 1513-1 PN':{di:16,do:16,ai:4,ao:2,k:'Modular',ip:'192.168.0.1'},
 'MicroLogix 1400':{di:16,do:12,ai:4,ao:2,k:'Compacto',ip:'192.168.1.10'},
 'CompactLogix L32E':{di:16,do:16,ai:4,ao:2,k:'Modular',ip:'192.168.1.20'}};
let model='S7-1200 CPU 1215C AC/DC/RLY',running=false,act=0,gT=0,level=30,sel=null,M={};
const KEYS=[...Array(16).keys()].flatMap(i=>['I'+i,'Q'+i]).concat([...Array(8).keys()].map(i=>'M'+i),['AI0','AI1','AI2','AI3','AQ0','AQ1']);
const reset=()=>{KEYS.forEach(k=>M[k]=0);act=0;gT=0;level=30};reset();
const lst=(p,n)=>[...Array(Math.min(n,16)).keys()].map(i=>p+i);
const addrs=k=>{const p=PLCS[model];return {DI:lst('I',p.di),DO:lst('Q',p.do),AI:lst('AI',p.ai),AO:lst('AQ',p.ao),M:lst('M',8)}[k]};
/* ---------- Curso ---------- */
const CARDS=[
 ['Clase 1 · Introducción','Del proceso industrial a la automatización: la pirámide de niveles 0 a 4 y el paso de la lógica cableada a la programada.',['Dinámica, variables y perturbaciones','Objetivos: calidad, productividad, flexibilidad'],'plc'],
 ['Clase 2 · Arquitectura de PLC','CPU, memoria, fuente y módulos de entradas y salidas, digitales o analógicas. Compactos frente a modulares.',['Salidas a relé y a transistor','Gama por número de E/S'],'plc'],
 ['Clase 3 · Ladder (LD)','Lenguaje gráfico de contactos NA y NC, bobinas OUT, SET y RESET, ordenado por peldaños (IEC 61131-3).',['Arranque directo de motor','Inversión de giro y estrella-triángulo'],'ladder'],
 ['Clase 4 · GRAFCET','Modelo secuencial con etapas, transiciones, receptividades y acciones, con saltos y ramas paralelas.',['Etapa inicial, normal, fuente y sumidero','Acciones condicionales, set y reset'],'grafcet'],
 ['Clase 5 · HMI y SCADA','La HMI supervisa el proceso en tiempo real; el SCADA adquiere, registra y controla la planta completa.',['Ejemplos en CodeSys y TIA Portal'],'proceso'],
 ['Clase 6 · Subrutinas','Bloques FC sin memoria propia y FB con DB de instancia para encapsular código reutilizable.',['Variables Input, Output, InOut, Temp, Static'],'ladder']];
$('#cards').innerHTML=CARDS.map(c=>`<article class="card"><h3>${c[0]}</h3><p>${c[1]}</p><ul>${c[2].map(x=>`<li>${x}</li>`).join('')}</ul><button data-go="${c[3]}">Abrir simulador</button></article>`).join('');
/* ---------- Navegación ---------- */
function go(t){$$('section').forEach(s=>s.classList.toggle('act',s.id==t));$$('#tabs button').forEach(b=>b.classList.toggle('act',b.dataset.t==t));location.hash=t;refresh()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-t],[data-go]');if(b)go(b.dataset.t||b.dataset.go)});
/* ---------- PLC, IP y E/S ---------- */
$('#model').innerHTML=Object.keys(PLCS).map(k=>`<option ${k==model?'selected':''}>${k}</option>`).join('');
const v4=s=>/^(\d{1,3}\.){3}\d{1,3}$/.test(s)&&s.split('.').every(n=>+n<=255),n32=s=>s.split('.').reduce((a,b)=>a*256+ +b,0);
function chkIP(){const ip=$('#ip').value.trim(),mk=$('#mask').value.trim(),gw=$('#gw').value.trim(),m=$('#ipmsg');let e='';
 if(!v4(ip))e='La IP no es válida (formato 0-255.0-255.0-255.0-255).';
 else if(!v4(mk)||((~n32(mk))>>>0&(((~n32(mk))>>>0)+1))!==0)e='La máscara debe ser contigua, por ejemplo 255.255.255.0.';
 else if(!v4(gw))e='La puerta de enlace no es válida.';
 else if((n32(ip)&n32(mk))!==(n32(gw)&n32(mk)))e='La puerta de enlace está fuera de la subred del PLC.';
 else if(((n32(ip)&~n32(mk))>>>0)===0||((n32(ip)|n32(mk))>>>0)===0xFFFFFFFF)e='La IP coincide con la dirección de red o de difusión.';
 m.className=e?'err':'ok';m.textContent=e||'Parámetros de red válidos.';return !e}
function setModel(){const p=PLCS[model];$('#spec').textContent=`${p.k} · ${p.di} DI · ${p.do} DO · ${p.ai} AI · ${p.ao} AO`;$('#ip').value=p.ip;$('#gw').value=p.ip.replace(/\d+$/,'254');chkIP();buildIO()}
$('#model').onchange=e=>{model=e.target.value;setModel()};['ip','mask','gw'].forEach(i=>$('#'+i).oninput=chkIP);
function buildIO(){const g=(t,l)=>`<h3>${t}</h3><div class="ios">${l||'<span class="mut">Sin canales</span>'}</div>`;
 $('#io').innerHTML=g('Entradas digitales',addrs('DI').map(a=>`<button class="di" data-a="${a}">${a}</button>`).join(''))+g('Salidas digitales',addrs('DO').map(a=>`<span class="do" data-a="${a}">${a}</span>`).join(''))+
 g('Entradas analógicas',addrs('AI').map(a=>`<label class="ai">${a}<input type="range" data-a="${a}" min="0" max="100"><output data-o="${a}"></output></label>`).join(''))+
 g('Salidas analógicas',addrs('AO').map(a=>`<span class="aq" data-a="${a}"><i></i>${a}</span>`).join(''))}
$('#io').addEventListener('click',e=>{const b=e.target.closest('.di');if(b){M[b.dataset.a]^=1;refresh()}});
$('#io').addEventListener('input',e=>{if(e.target.dataset.a){M[e.target.dataset.a]=+e.target.value;refresh()}});
function refreshIO(){$$('#io .di').forEach(b=>b.classList.toggle('on',!!M[b.dataset.a]));$$('#io .do').forEach(b=>b.classList.toggle('on',!!M[b.dataset.a]));
 $$('#io input').forEach(i=>{if(document.activeElement!==i)i.value=M[i.dataset.a];$('[data-o='+i.dataset.a+']').textContent=Math.round(M[i.dataset.a])});
 $$('#io .aq').forEach(b=>$('i',b).style.width=M[b.dataset.a]+'%')}
/* ---------- Simbología ISA 5.1 ---------- */
const bub=(l,k='f')=>{const t=(y)=>`<text x="30" y="${y}" text-anchor="middle">${l}</text>`,c='<circle cx="30" cy="30" r="15"/>';
 return k=='f'?c+t(34):k=='p'?c+'<line x1="15" y1="30" x2="45" y2="30"/>'+t(26):k=='d'?'<rect x="10" y="10" width="40" height="40"/>'+c+t(34):'<rect x="10" y="10" width="40" height="40"/><path d="M30 14L46 30L30 46L14 30Z"/>'+t(34)};
const SYM={
 tank:['Tanque','Equipos','<path d="M14 10V46Q30 58 46 46V10Q30 2 14 10Z"/>'],
 pump:['Bomba centrífuga','Equipos','<circle cx="30" cy="30" r="15"/><path d="M30 15H50M21 40L30 22L39 40"/>'],
 motor:['Motor','Equipos','<circle cx="30" cy="30" r="15"/><text x="30" y="34" text-anchor="middle">M</text>'],
 valve:['Válvula de bloqueo','Válvulas','<path d="M10 20L50 40V20L10 40Z"/>'],
 cvalve:['Válvula de control','Válvulas','<path d="M10 30L50 50V30L10 50Z"/><path d="M30 40V22M20 22a10 10 0 0 1 20 0Z"/>'],
 check:['Válvula de retención','Válvulas','<path d="M10 30H50M36 20L22 30L36 40Z"/>'],
 LT:['Transmisor de nivel LT','Campo',bub('LT')],LSH:['Interruptor nivel alto LSH','Campo',bub('LSH')],LSL:['Interruptor nivel bajo LSL','Campo',bub('LSL')],
 PT:['Transmisor de presión PT','Campo',bub('PT')],TT:['Transmisor de temperatura TT','Campo',bub('TT')],FT:['Transmisor de caudal FT','Campo',bub('FT')],
 LIC:['Controlador de nivel LIC (panel)','Panel',bub('LIC','p')],FIC:['Controlador de caudal FIC (DCS)','DCS',bub('FIC','d')],PLC:['Función en PLC','PLC',bub('PLC','c')],
 pb:['Pulsador','E/S','<rect x="14" y="26" width="32" height="10"/><path d="M30 26V14M20 14H40"/>'],lamp:['Lámpara piloto','E/S','<circle cx="30" cy="30" r="15"/><path d="M19 19L41 41M41 19L19 41"/>']};
$('#lib').innerHTML=[...new Set(Object.values(SYM).map(s=>s[1]))].map(c=>`<h3>${c}</h3>`+Object.values(SYM).filter(s=>s[1]==c).map(s=>`<div class="sym"><svg viewBox="0 0 60 60" width="64" height="64">${s[2]}</svg><div>${s[0]}</div></div>`).join('')).join('');
$('#pal').innerHTML=Object.entries(SYM).filter(([k])=>!['LIC','FIC','PLC'].includes(k)).map(([k,s])=>`<button data-add="${k}" title="${s[0]}"><svg viewBox="0 0 60 60">${s[2]}</svg>${k}</button>`).join('');
/* ---------- Constructor de procesos ---------- */
let P=[],uid=1;const KIND={tank:'',pump:'DO',valve:'DO',cvalve:'DO',motor:'DO',lamp:'DO',pb:'DI',LSH:'DI',LSL:'DI',LT:'AI'};
const add=(type,x,y,tag,bind='')=>P.push({id:uid++,type,x,y,tag,bind});
add('tank',350,120,'TK-101');add('pump',120,290,'P-101','Q0');add('motor',350,10,'M-101','Q1');add('valve',580,290,'V-101','Q2');
add('LSH',490,60,'LSH-101','I1');add('LSL',490,200,'LSL-101','I2');add('LT',230,120,'LT-101','AI0');add('pb',30,30,'HS-101','I0');add('lamp',140,30,'XL-101','Q3');
const cen=o=>[o.x+48,o.y+48];
function drawCV(){const tk=P.find(o=>o.type=='tank'),pp=P.find(o=>o.type=='pump'),vv=P.find(o=>o.type=='valve'||o.type=='cvalve'),pipe=(a,b)=>a&&b?`<polyline class="pipe" points="${cen(a)[0]},${cen(a)[1]} ${cen(a)[0]},${cen(b)[1]} ${cen(b)[0]},${cen(b)[1]}"/>`:'';
 $('#cv').innerHTML=pipe(pp,tk)+
 (vv&&tk?`<polyline class="pipe" points="${cen(tk)[0]},${cen(tk)[1]+40} ${cen(tk)[0]},${cen(vv)[1]} ${cen(vv)[0]},${cen(vv)[1]}"/>`:'')+
 P.map(o=>`<g class="it${o===sel?' sel':''}${o.bind&&M[o.bind]&&o.type!='LT'?' on':''}" data-id="${o.id}" transform="translate(${o.x},${o.y}) scale(1.6)"><g class="s">${o.type=='tank'?`<rect class="liq" x="16" y="${46-level*.36}" width="28" height="${level*.36}"/>`:''}${SYM[o.type][2]}</g><text class="tag" x="30" y="62" text-anchor="middle">${o.tag}${o.bind?' · '+o.bind:''}</text></g>`).join('')}
$('#pal').onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;const k=b.dataset.add;add(k,60+(uid%8)*40,60+(uid%5)*30,k+'-'+(100+uid));sel=P[P.length-1];insp();refresh()};
let drag=null;const cv=$('#cv');
cv.addEventListener('pointerdown',e=>{const g=e.target.closest('.it');if(!g)return;sel=P.find(o=>o.id==g.dataset.id);const r=cv.getBoundingClientRect(),k=900/r.width;drag={dx:(e.clientX-r.left)*k-sel.x,dy:(e.clientY-r.top)*k-sel.y,moved:0};if(sel.type=='pb')M[sel.bind]=1;insp();refresh()});
cv.addEventListener('pointermove',e=>{if(!drag)return;const r=cv.getBoundingClientRect(),k=900/r.width;sel.x=cl((e.clientX-r.left)*k-drag.dx,0,800);sel.y=cl((e.clientY-r.top)*k-drag.dy,0,340);drag.moved=1;drawCV()});
addEventListener('pointerup',()=>{if(drag&&sel&&sel.type=='pb'&&sel.bind)M[sel.bind]=0;drag=null;refresh()});
function insp(){const o=sel,el=$('#insp');if(!o){el.innerHTML='<p class="mut">Seleccione un símbolo.</p>';return}
 const k=KIND[o.type],opts=k?['<option value="">Sin asignar</option>'].concat(addrs(k).map(a=>`<option ${a==o.bind?'selected':''}>${a}</option>`)):[];
 el.innerHTML=`<h3>${SYM[o.type][0]}</h3><label>Etiqueta<input id="itag" value="${o.tag}"></label>${k?`<label>Dirección en el PLC<select id="ibind">${opts.join('')}</select></label>`:'<p class="mut">Este símbolo no usa E/S.</p>'}<button id="idel">Eliminar</button>`;
 $('#itag').oninput=e=>{o.tag=e.target.value;drawCV()};if(k)$('#ibind').onchange=e=>{o.bind=e.target.value;drawCV()};$('#idel').onclick=()=>{P=P.filter(x=>x!==o);sel=null;insp();drawCV()}}
/* ---------- GRAFCET ---------- */
let G=[{a:'Q3',c:'I0',n:1},{a:'Q0',c:'I1',n:2},{a:'Q1',c:'T>=3',n:3},{a:'Q2',c:'!I2',n:0}];
const acts=s=>String(s).split(',').map(x=>x.trim()).filter(Boolean).map(x=>{let m=x.match(/^(AQ\d+)\s*=\s*(\d+)$/);if(m)return{a:m[1],v:+m[2]};m=x.match(/^([SR]):\s*(\w+)$/i);return m?{m:m[1].toUpperCase(),a:m[2]}:{a:x}});
function ev(c){let e=String(c).replace(/\b(AI|AQ|I|Q|M)(\d+)\b/g,"M['$1$2']").replace(/\bT\b/g,'gT');if(!/^[\sM\[\]'AIQ0-9&|!()<>=.gT]*$/.test(e))return 0;try{return new Function('M','gT','return +!!('+e+')')(M,gT)}catch(x){return 0}}
function buildG(){$('#gt').innerHTML='<tr><th>Etapa</th><th>Acciones</th><th>Receptividad</th><th>Salta a</th><th></th></tr>'+G.map((s,i)=>`<tr><td>${i}</td><td><input data-i="${i}" data-f="a" value="${s.a}"></td><td><input data-i="${i}" data-f="c" value="${s.c}"></td><td><input data-i="${i}" data-f="n" type="number" min="0" max="${G.length-1}" value="${s.n}" style="width:60px"></td><td>${i?`<button data-del="${i}">Quitar</button>`:''}</td></tr>`).join('');gDraw()}
$('#gt').addEventListener('input',e=>{const t=e.target;if(t.dataset.f){G[t.dataset.i][t.dataset.f]=t.dataset.f=='n'?+t.value:t.value;gDraw()}});
$('#gt').addEventListener('click',e=>{const d=e.target.dataset.del;if(d){G.splice(+d,1);G.forEach(s=>s.n=Math.min(s.n,G.length-1));buildG()}});
$('#gadd').onclick=()=>{G.push({a:'',c:'I0',n:0});G[G.length-2].n=G.length-1;buildG()};
const gSvg=hl=>{const h=G.length*110+20;return `<svg id="gsvg" viewBox="0 0 460 ${h}" xmlns="http://www.w3.org/2000/svg">`+G.map((s,i)=>{const y=20+i*110;return `<g><rect class="gs${hl&&i==act?' hi':''}" x="100" y="${y}" width="60" height="40"/>${i==0?`<rect class="gs" x="94" y="${y-6}" width="72" height="52" fill="none"/>`:''}<text x="130" y="${y+25}" text-anchor="middle" style="font-size:16px">${i}</text>
 <line class="gl" x1="160" y1="${y+20}" x2="185" y2="${y+20}"/><rect class="gs" x="185" y="${y+5}" width="200" height="30"/><text x="195" y="${y+25}">${s.a||'—'}</text>
 <line class="gl" x1="130" y1="${y+40}" x2="130" y2="${y+90}"/><line class="gtr" x1="115" y1="${y+65}" x2="145" y2="${y+65}"/><text x="155" y="${y+69}">= ${s.c}</text>${s.n!=i+1?`<text x="30" y="${y+85}" style="fill:#ffb224">▲ etapa ${s.n}</text>`:''}</g>`}).join('')+'</svg>'};
function gDraw(){$('#gsvg').outerHTML=gSvg(1)}
/* ---------- Ladder ---------- */
$('#ltxt').value=`I0 & !I3 | Q4 -> Q4\nQ4 & I1 -> Q5\nQ5 & !I2 -> Q6\nI3 -> R Q4`;
const okA=a=>/^(I|Q|M)\d+$|^AI\d+$/.test(a);
function parseL(){return $('#ltxt').value.split('\n').filter(l=>l.trim()).map(l=>{const[x,r]=l.split('->');if(r==null)return{err:l};
 const T=s=>(s||'').split('&').map(t=>t.trim()).filter(Boolean).map(t=>({nc:t[0]=='!',a:t.replace('!','').trim()})),[m,b]=x.split('|'),c=r.trim().split(/\s+/),o={m:T(m),b:T(b),ct:c.length>1?c[0].toUpperCase():'OUT',ca:c[c.length-1]};
 return [...o.m,...o.b].every(t=>okA(t.a))&&okA(o.ca)&&['OUT','S','R'].includes(o.ct)?o:{err:l}})}
const ser=ts=>ts.every(t=>t.nc?!M[t.a]:!!M[t.a]);
function runL(){parseL().forEach(r=>{if(r.err)return;const v=(r.m.length&&ser(r.m))||(r.b.length&&ser(r.b));if(r.ct=='OUT')M[r.ca]=+!!v;else if(v)M[r.ca]=r.ct=='S'?1:0})}
const lSvg=live=>{const R=parseL(),W=720;let y=20,o=`<svg id="lsvg" viewBox="0 0 ${W} {H}" xmlns="http://www.w3.org/2000/svg"><line class="lc" x1="20" y1="10" x2="20" y2="{H}"/><line class="lc" x1="${W-20}" y1="10" x2="${W-20}" y2="{H}"/>`;
 R.forEach((r,i)=>{if(r.err){o+=`<text x="40" y="${y+30}" style="fill:#ff5470">Peldaño inválido: ${r.err}</text>`;y+=50;return}
  const on=live&&((r.m.length&&ser(r.m))||(r.b.length&&ser(r.b))),cy=y+30,ct=(t,x,yy)=>{const p=live&&(t.nc?!M[t.a]:!!M[t.a]);return `<g class="lc${p?' hi':''}"><line x1="${x}" y1="${yy-12}" x2="${x}" y2="${yy+12}"/><line x1="${x+18}" y1="${yy-12}" x2="${x+18}" y2="${yy+12}"/>${t.nc?`<line x1="${x-3}" y1="${yy+12}" x2="${x+21}" y2="${yy-12}"/>`:''}<text x="${x+9}" y="${yy-18}" text-anchor="middle" style="fill:inherit">${t.a}</text></g>`},
  row=(ts,yy)=>ts.map((t,k)=>ct(t,70+k*100,yy)).join('');
  o+=`<text x="26" y="${cy-22}" style="font-size:9px;fill:#7f97ad">${i}</text><line class="lw${on?' hi':''}" x1="20" y1="${cy}" x2="${W-110}" y2="${cy}"/>`+row(r.m,cy);
  if(r.b.length){o+=`<line class="lw${on?' hi':''}" x1="40" y1="${cy}" x2="40" y2="${cy+40}"/><line class="lw" x1="40" y1="${cy+40}" x2="${W-130}" y2="${cy+40}"/><line class="lw" x1="${W-130}" y1="${cy}" x2="${W-130}" y2="${cy+40}"/>`+row(r.b,cy+40)}
  o+=`<g class="lc${on?' hi':''}"><path d="M${W-84} ${cy-14}Q${W-98} ${cy} ${W-84} ${cy+14}M${W-56} ${cy-14}Q${W-42} ${cy} ${W-56} ${cy+14}"/><text x="${W-70}" y="${cy+4}" text-anchor="middle" style="fill:inherit">${r.ct=='OUT'?'':r.ct}</text><text x="${W-70}" y="${cy-20}" text-anchor="middle" style="fill:inherit">${r.ca}</text></g><line class="lw" x1="${W-40}" y1="${cy}" x2="${W-20}" y2="${cy}"/>`;
  y+=r.b.length?90:60});return (o+'</svg>').replace(/\{H\}/g,y+10)};
const lDraw=()=>{$('#lsvg').outerHTML=lSvg(running)};$('#ltxt').oninput=lDraw;
/* ---------- Ejecución ---------- */
const mode=()=>$('#mode').value;
function scan(){const dt=.1;P.forEach(o=>{if(!o.bind)return;if(o.type=='LSH')M[o.bind]=+(level>=80);if(o.type=='LSL')M[o.bind]=+(level>=20);if(o.type=='LT')M[o.bind]=Math.round(level)});
 if(mode()!='ladder'&&G.length){gT+=dt;const s=G[act];if(s&&ev(s.c)){act=cl(+s.n,0,G.length-1);gT=0}
  const lv=new Set();G.forEach(s=>acts(s.a).forEach(x=>{if(!x.m&&x.v==null)lv.add(x.a)}));lv.forEach(a=>M[a]=0);
  acts(G[act].a).forEach(x=>{if(x.v!=null)M[x.a]=x.v;else M[x.a]=x.m=='R'?0:1})}
 if(mode()!='grafcet')runL();
 const n=t=>P.filter(o=>o.type==t&&o.bind&&M[o.bind]).length;level=cl(level+(n('pump')*6-n('valve')*5-n('cvalve')*5)*dt,0,100);refresh()}
setInterval(()=>{if(running)scan()},100);
$('#run').onclick=()=>{running=!running;$('#run').textContent=running?'Detener':'Ejecutar';$('#run').classList.toggle('run',running);$('#led').classList.toggle('on',running);refresh()};
$('#rst').onclick=()=>{reset();refresh()};
function refresh(){refreshIO();const t=(($('section.act')||{}).id);if(t=='proceso')drawCV();if(t=='grafcet')gDraw();if(t=='ladder')lDraw()}
/* ---------- Informe PDF ---------- */
$('#pdf').onclick=()=>{const p=PLCS[model],bd=P.filter(o=>o.bind).map(o=>`<tr><td>${o.bind}</td><td>${o.tag}</td><td>${SYM[o.type][0]}</td></tr>`).join('');
 $('#report').innerHTML=`<h1>Informe de programación</h1><p>${new Date().toLocaleString('es-CO')}</p><h2>PLC y red</h2><table><tr><th>Modelo</th><td>${model} (${p.k})</td></tr><tr><th>Canales</th><td>${p.di} DI · ${p.do} DO · ${p.ai} AI · ${p.ao} AO</td></tr><tr><th>IP / Máscara / Gateway</th><td>${$('#ip').value} / ${$('#mask').value} / ${$('#gw').value}</td></tr><tr><th>Validación</th><td>${$('#ipmsg').textContent}</td></tr></table>
 <h2>Tabla de asignación de E/S</h2><table><tr><th>Dirección</th><th>Etiqueta</th><th>Elemento</th></tr>${bd}</table><h2>GRAFCET</h2>${gSvg(0)}<h2>Ladder</h2>${lSvg(0)}<h2>Texto Ladder</h2><pre>${$('#ltxt').value}</pre>`;print()};
setModel();buildG();insp();lDraw();go((location.hash||'#curso').slice(1)||'curso');
