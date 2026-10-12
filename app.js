/* RepMás — app sin servidor. Datos guardados únicamente en este dispositivo. */
(() => {
  'use strict';
  const KEY = 'repmas-data-v1';
  const $ = id => document.getElementById(id);
  const uid = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2,9)}`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const num = v => v === '' || v === null || v === undefined ? NaN : Number(String(v).replace(',', '.'));
  const fmt = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString('es-EC', { maximumFractionDigits: 2 }) : '—';
  const date = str => new Date(str).toLocaleDateString('es-EC', {day:'2-digit',month:'short',year:'numeric'});
  const shortDate = str => new Date(str).toLocaleDateString('es-EC', {day:'2-digit',month:'short'});
  const muscles = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Cuádriceps','Femoral','Glúteos','Pantorrillas','Abdomen','Otros'];
  const names = [
    ['bench','Press de banca con barra','Pecho',6,8,2,2.5],
    ['inclinedbar','Press inclinado con barra','Pecho',6,10,2,2.5],
    ['dbflat','Press plano con mancuernas','Pecho',8,12,2,2],
    ['dbincline','Press inclinado con mancuernas','Pecho',8,12,2,2],
    ['cablefly','Aperturas en polea','Pecho',12,15,1,2.5],
    ['pecdeck','Pec deck','Pecho',10,15,1,2.5],
    ['pullup','Dominadas','Espalda',6,10,2,2.5],
    ['lat','Jalón al pecho prono','Espalda',8,12,2,2.5],
    ['latneutral','Jalón al pecho neutro','Espalda',8,12,2,2.5],
    ['barrow','Remo con barra','Espalda',6,10,2,2.5],
    ['trow','Remo en máquina T','Espalda',8,12,2,2.5],
    ['dbrow','Remo unilateral con mancuerna','Espalda',8,12,2,2],
    ['cable-row','Remo sentado en polea','Espalda',8,12,2,2.5],
    ['military','Press militar','Hombros',6,10,2,2.5],
    ['lateral','Elevaciones laterales','Hombros',12,20,1,1],
    ['rear','Pájaros / deltoide posterior','Hombros',12,20,1,1],
    ['curlbar','Curl de bíceps con barra','Bíceps',8,12,1,2.5],
    ['curldb','Curl inclinado con mancuernas','Bíceps',10,12,1,1],
    ['curlhammer','Curl martillo','Bíceps',8,12,1,1],
    ['pushdown','Extensión de tríceps en polea','Tríceps',10,15,1,2.5],
    ['overhead','Extensión de tríceps sobre cabeza','Tríceps',10,15,1,2.5],
    ['skull','Press francés','Tríceps',8,12,1,2.5],
    ['squat','Sentadilla con barra','Cuádriceps',6,10,2,2.5],
    ['hack','Sentadilla hack','Cuádriceps',8,12,2,5],
    ['legpress','Prensa de piernas','Cuádriceps',10,15,2,5],
    ['legext','Extensiones de cuádriceps','Cuádriceps',12,15,1,2.5],
    ['rdl','Peso muerto rumano','Femoral',6,10,2,2.5],
    ['legcurl','Curl femoral acostado','Femoral',10,15,1,2.5],
    ['legcurlseat','Curl femoral sentado','Femoral',10,15,1,2.5],
    ['hipthrust','Hip thrust','Glúteos',8,12,2,5],
    ['calf','Elevación de gemelos','Pantorrillas',12,20,1,2.5],
    ['crunch','Crunch en polea','Abdomen',12,20,2,2.5]
  ];
  const defaultExercises = () => names.map(([id,name,muscle,min,max,rir,step]) => ({id,name,muscle,min,max,rir,step}));
  const defaultRoutines = () => [
    {id:'push',name:'Push',emoji:'↗',color:'orange',exerciseIds:['bench','dbincline','cablefly','lateral','pushdown']},
    {id:'pull',name:'Pull',emoji:'↙',color:'blue',exerciseIds:['barrow','pullup','trow','lat','curlbar','curlhammer']},
    {id:'legs',name:'Legs',emoji:'⌁',color:'purple',exerciseIds:['squat','hack','legcurl','legext','calf']},
    {id:'upper',name:'Upper',emoji:'↑',color:'pink',exerciseIds:['inclinedbar','dbflat','trow','lat','curlbar','pushdown']},
    {id:'lower',name:'Lower',emoji:'↓',color:'blue',exerciseIds:['hack','rdl','legcurl','legext','calf']}
  ];
  const defaults = () => ({version:1,exercises:defaultExercises(),routines:defaultRoutines(),workouts:[],draft:null});
  function validImport(input){
    if(!input || typeof input!=='object' || !Array.isArray(input.exercises) || !Array.isArray(input.routines) || !Array.isArray(input.workouts)) throw new Error('Archivo no válido: no contiene los datos de RepMás.');
    if(input.exercises.length>3000 || input.routines.length>500 || input.workouts.length>20000) throw new Error('Archivo demasiado grande.');
    const exercises=input.exercises.filter(e=>e && typeof e.id==='string' && typeof e.name==='string' && e.name.length<150 && muscles.includes(e.muscle)).map(e=>({...e,min:Math.max(1,Number(e.min)||6),max:Math.max(1,Number(e.max)||12),rir:Math.max(0,Math.min(5,Number(e.rir)||0)),step:Math.max(.25,Number(e.step)||2.5)}));
    const routines=input.routines.filter(r=>r && typeof r.id==='string' && typeof r.name==='string' && Array.isArray(r.exerciseIds)).map(r=>({...r,exerciseIds:r.exerciseIds.filter(id=>typeof id==='string')}));
    const workouts=input.workouts.filter(w=>w && typeof w.date==='string' && Array.isArray(w.entries) && !Number.isNaN(new Date(w.date).getTime())).map(w=>({...w,entries:w.entries.filter(e=>e && typeof e.exerciseId==='string' && Array.isArray(e.sets)).map(e=>({...e,sets:e.sets.filter(s=>s && Number.isFinite(Number(s.weight)) && Number.isFinite(Number(s.reps)) && Number(s.weight)>=0 && Number(s.reps)>0)}))}));
    if(!exercises.length || !routines.length) throw new Error('El respaldo no contiene ejercicios o rutinas válidas.');
    let draft=null;
    if(input.draft && typeof input.draft==='object' && Array.isArray(input.draft.entries) && typeof input.draft.routineId==='string') draft=input.draft;
    return {version:1,exercises,routines,workouts,draft};
  }
  function load(){try{const raw=localStorage.getItem(KEY);return raw?validImport(JSON.parse(raw)):defaults()}catch(err){console.warn('No se pudieron recuperar los datos',err);return defaults()}}
  let state=load();
  const ui={tab:'home',selectedRoutine:state.routines[0]?.id || '',muscle:'Todos',query:'',historyExercise:'',expandedHistory:'',installPrompt:null};
  let toastTimer;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.warn(e);showToast('Almacenamiento lleno o bloqueado. Exporta una copia.');return false}};
  function showToast(message){const node=$('toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3300)}
  const byId=id=>state.exercises.find(e=>e.id===id);
  const routineById=id=>state.routines.find(r=>r.id===id);
  const sessionsFor=id=>state.workouts.filter(w=>w.entries.some(e=>e.exerciseId===id && e.sets.length)).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const entryFor=(workout,id)=>workout?.entries.find(e=>e.exerciseId===id);
  function suggestion(exercise,setIndex=0){
    const sessions=sessionsFor(exercise.id);
    if(!sessions.length)return {kind:'new',text:'Primera sesión',detail:'Registra tus primeras series para empezar a recibir recomendaciones.',weight:null};
    const last=entryFor(sessions[sessions.length-1],exercise.id);
    const lastSet=last?.sets[setIndex] || last?.sets[last.sets.length-1];
    if(!lastSet)return {kind:'new',text:'Sin referencia',detail:'Registra un peso para empezar.',weight:null};
    const weight=Number(lastSet.weight),reps=Number(lastSet.reps);
    const target=Number(exercise.rir),rir=lastSet.rir==null || lastSet.rir===''?null:Number(lastSet.rir);
    const meetsRir=rir===null || rir>=target;
    if(reps>=exercise.max && meetsRir){return {kind:'up',weight:Math.round((weight+Number(exercise.step))*100)/100,text:`Subir a ${fmt(weight+Number(exercise.step))} kg`,detail:`Última vez: ${fmt(weight)} kg × ${fmt(reps)} reps${rir!==null?` · RIR ${rir}`:''}. Alcanzaste el máximo de reps${rir!==null?' y el RIR objetivo':''}.`}}
    if(sessions.length>=2){
      const prev=entryFor(sessions[sessions.length-2],exercise.id);
      const prevSet=prev?.sets[setIndex] || prev?.sets[prev.sets.length-1];
      if(prevSet && reps<exercise.min && Number(prevSet.reps)<exercise.min){
        const down=Math.max(0,Math.round((weight-Number(exercise.step))*100)/100);
        return {kind:'down',weight:down,text:`Bajar a ${fmt(down)} kg`,detail:`Dos sesiones seguidas por debajo de ${exercise.min} reps en esta serie. Prueba bajar un incremento.`};
      }
    }
    return {kind:'hold',weight,text:`Mantener ${fmt(weight)} kg`,detail:`Última vez: ${fmt(reps)} reps${rir!==null?` · RIR ${rir}`:''}. Busca alcanzar ${exercise.max} reps con RIR ≥ ${target}.`};
  }
  function recommendationHTML(exercise,index=0){
    const r=suggestion(exercise,index);return `<div class="recommend ${r.kind}"><span style="font-size:19px">${r.kind==='up'?'↗':r.kind==='down'?'↘':r.kind==='new'?'◌':'→'}</span><div><b>${esc(r.text)}</b><p>${esc(r.detail)}</p></div></div>`;
  }
  const activityCount=()=>state.workouts.length;
  const countSets=()=>state.workouts.reduce((n,w)=>n+w.entries.reduce((m,e)=>m+e.sets.length,0),0);
  function render(){
    const screen=$('screen');if(!screen)return;
    screen.innerHTML=ui.tab==='home'?renderHome():ui.tab==='train'?renderTrain():ui.tab==='library'?renderLibrary():renderHistory();
    document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.tab===ui.tab);b.setAttribute('aria-current',b.dataset.tab===ui.tab?'page':'false')});
    if(ui.tab==='history')drawChart();
  }
  const routineIcon=(r)=>`<div class="routine-icon ${esc(r.color||'')}">${esc(r.emoji||'•')}</div>`;
  function renderHome(){
    const last=state.workouts[state.workouts.length-1];
    return `<p class="eyebrow">TU PROGRESO EMPIEZA AQUÍ</p><h1 class="page-title">Una repetición<br>más fuerte.</h1><p class="lead">Tus pesos, tus repeticiones y una recomendación clara para tu próximo entreno.</p>
    <section class="hero"><p class="eyebrow">SIMPLE. GRATIS. TUYO.</p><h2>${state.draft?'Continúa donde te quedaste.':'Hoy toca mejorar.'}</h2><p>${state.draft?'Tienes un entrenamiento sin guardar. Tus series siguen aquí.':'Registra tus series y descubre cuándo subir, mantener o bajar la carga.'}</p><button class="btn light" data-action="nav" data-tab="train">${state.draft?'Continuar entrenamiento':'Empezar a entrenar'} &nbsp; →</button></section>
    <div class="stats"><div class="stat"><b>${activityCount()}</b><span>Entrenamientos</span></div><div class="stat"><b>${countSets()}</b><span>Series registradas</span></div><div class="stat"><b>${state.exercises.length}</b><span>Ejercicios</span></div></div>
    <div class="section-head"><h2>Tus rutinas</h2><button class="small-link" data-action="nav" data-tab="train">Ver todas →</button></div>
    ${state.routines.map(r=>`<div class="card routine">${routineIcon(r)}<div class="routine-text"><b>${esc(r.name)}</b><span>${r.exerciseIds.length} ejercicios</span></div><button class="circle-arrow" aria-label="Entrenar ${esc(r.name)}" data-action="select-routine" data-id="${esc(r.id)}">→</button></div>`).join('')}
    <div class="section-head"><h2>Última sesión</h2></div>${last?`<div class="card"><div class="row between"><div><h3>${esc(last.routineName)}</h3><div class="sub">${date(last.date)} · ${last.entries.length} ejercicios</div></div><span class="name-chip">COMPLETADO</span></div></div>`:`<div class="empty"><span class="big">◎</span>Todavía no hay entrenamientos. ¡El primero será tu punto de partida!</div>`}
    <p class="notice">🔒 Tus datos se guardan en este dispositivo. Puedes exportar un respaldo desde Ajustes.</p>`;
  }
  function renderTrain(){
    if(state.draft)return renderSession();
    const current=routineById(ui.selectedRoutine) || state.routines[0];
    if(!current)return '<p>No hay rutinas disponibles.</p>';
    const exercises=current.exerciseIds.map(byId).filter(Boolean);
    return `<p class="eyebrow">PLAN DE ENTRENAMIENTO</p><h1 class="page-title">A darlo todo.</h1><p class="lead">Elige tu rutina y revisa las cargas sugeridas para hoy.</p>
      <div class="pill-row">${state.routines.map(r=>`<button class="pill ${r.id===current.id?'active':''}" data-action="select-routine" data-id="${esc(r.id)}">${esc(r.name)}</button>`).join('')}<button class="pill add" data-action="new-routine">+ Nueva</button></div>
      <div class="section-head"><h2>${esc(current.name)} <span class="muted" style="font-size:12px;font-weight:500">· ${exercises.length} ejercicios</span></h2><button class="small-link" data-action="edit-routine" data-id="${esc(current.id)}">Editar rutina ✎</button></div>
      ${exercises.length?exercises.map((e,i)=>`<div class="card"><div class="exercise-top"><div><span class="exercise-name">${i+1}. ${esc(e.name)}</span><p class="sub" style="margin:6px 0 0">${esc(e.muscle)} · ${e.min}–${e.max} reps · RIR ${e.rir}</p></div><span class="tag">${fmt(e.step)} kg</span></div>${recommendationHTML(e)}</div>`).join(''):'<div class="empty">Esta rutina está vacía. Toca «Editar rutina» para agregar ejercicios.</div>'}
      <button class="btn full" data-action="start-session" ${exercises.length?'':'disabled'}>Comenzar sesión →</button><p class="notice" style="text-align:center">Sugerencias calculadas a partir de tus sesiones anteriores.</p>`;
  }
  function renderSession(){
    const d=state.draft;
    return `<p class="eyebrow">ENTRENAMIENTO EN CURSO</p><h1 class="page-title">${esc(d.routineName)}</h1><p class="lead">Registra peso, repeticiones y RIR de cada serie. El RIR es opcional.</p><div class="draft-note">● Sesión en curso · Los cambios se guardan automáticamente en este dispositivo.</div>
    ${d.entries.map((entry,ei)=>{
      const e=byId(entry.exerciseId);
      if(!e)return '';
      return `<section class="card"><div class="exercise-top"><div><h3>${esc(e.name)}</h3><p class="sub" style="margin:5px 0 0">Objetivo: ${e.min}–${e.max} reps · RIR ${e.rir}</p></div><span class="tag">${esc(e.muscle)}</span></div>
        ${recommendationHTML(e)}
        <div class="set-head"><span>Serie</span><span>KG</span><span>REPS</span><span>RIR</span><span></span></div>
        ${entry.sets.map((set,si)=>`<div class="set-row"><span class="set-no">${si+1}</span><input class="field" aria-label="Peso serie ${si+1} ${esc(e.name)}" type="number" min="0" max="99999" step="any" inputmode="decimal" placeholder="kg" data-draft-entry="${ei}" data-set="${si}" data-field="weight" value="${esc(set.weight)}"><input class="field" aria-label="Repeticiones serie ${si+1} ${esc(e.name)}" type="number" min="1" max="1000" step="1" inputmode="numeric" placeholder="reps" data-draft-entry="${ei}" data-set="${si}" data-field="reps" value="${esc(set.reps)}"><input class="field" aria-label="RIR serie ${si+1} ${esc(e.name)}" type="number" min="0" max="10" step=".5" inputmode="decimal" placeholder="—" data-draft-entry="${ei}" data-set="${si}" data-field="rir" value="${esc(set.rir)}"><button class="remove-set" title="Quitar serie" aria-label="Quitar serie ${si+1}" data-action="remove-set" data-ei="${ei}" data-si="${si}">×</button></div>`).join('')}
        <button class="add-set" data-action="add-set" data-ei="${ei}">+ Agregar serie</button></section>`;
    }).join('')}
    <div class="session-foot"><button class="btn full" data-action="finish-session">✓ Guardar entrenamiento</button></div>
    <button class="btn ghost full" data-action="discard-session">Descartar sesión</button>`;
  }
  function renderLibrary(){
    return `<p class="eyebrow">BIBLIOTECA PERSONAL</p><h1 class="page-title">Tus ejercicios.</h1><p class="lead">Configura el rango de repeticiones, RIR y el incremento de carga para cada ejercicio.</p>
    <button class="btn full" data-action="new-exercise" style="margin-bottom:19px">+ Crear ejercicio</button>
    <input id="exerciseSearch" class="search" type="search" autocomplete="off" placeholder="Buscar ejercicio..." value="${esc(ui.query)}" aria-label="Buscar ejercicios">
    <div class="pill-row" id="muscleFilters">${['Todos',...muscles].map(m=>`<button class="pill ${ui.muscle===m?'active':''}" data-action="filter-muscle" data-muscle="${esc(m)}">${esc(m)}</button>`).join('')}</div>
    <div class="card" id="libraryList">${libraryRows()}</div>`;
  }
  function libraryRows(){
    const query=ui.query.toLocaleLowerCase('es');
    const list=state.exercises.filter(e=>(ui.muscle==='Todos'||e.muscle===ui.muscle) && e.name.toLocaleLowerCase('es').includes(query));
    return list.length?list.map(e=>`<div class="exercise-item"><div class="fill"><b>${esc(e.name)}</b><div class="sub">${esc(e.muscle)} · ${e.min}–${e.max} reps · RIR ${e.rir} · +${fmt(e.step)} kg</div></div><button class="round-btn" data-action="edit-exercise" data-id="${esc(e.id)}" aria-label="Editar ${esc(e.name)}">✎</button></div>`).join(''):'<div class="empty">No se encontraron ejercicios. Puedes crear uno nuevo.</div>';
  }
  function chartData(id){return sessionsFor(id).map(w=>{const entry=entryFor(w,id);return {date:w.date,weight:Math.max(...entry.sets.map(s=>Number(s.weight)))}}).filter(p=>Number.isFinite(p.weight));}
  function chartMarkup(data){
    if(!data.length)return '<div class="empty">Registra este ejercicio en un entrenamiento para ver su progreso.</div>';
    const series=data.slice(-12),values=series.map(p=>p.weight);let min=Math.min(...values),max=Math.max(...values);
    if(min===max){min=Math.max(0,min-5);max+=5}else{const pad=(max-min)*.18;min=Math.max(0,min-pad);max+=pad}
    const left=38,right=332,top=23,bottom=176,W=350,H=214;
    const pts=series.map((p,i)=>({x:series.length===1?(left+right)/2:left+(right-left)*i/(series.length-1),y:bottom-(p.weight-min)/(max-min)*(bottom-top),...p}));
    const path=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area=pts.length>1?`<path d="${path} L${pts.at(-1).x},${bottom} L${pts[0].x},${bottom}Z" fill="#c3f35a" opacity=".09"/>`:'';
    return `<div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del peso máximo usado, últimos ${series.length} entrenamientos"><g font-family="sans-serif" font-size="10" fill="#96a3af"><text x="3" y="${top+3}">${fmt(Math.round(max*10)/10)}</text><text x="3" y="${bottom+3}">${fmt(Math.round(min*10)/10)}</text><text x="${left}" y="200">${esc(shortDate(series[0].date))}</text><text x="${right}" y="200" text-anchor="end">${esc(shortDate(series.at(-1).date))}</text><text x="3" y="12">kg</text></g><path d="M${left},${bottom}H${right}M${left},${top}H${right}" stroke="#35404c" stroke-dasharray="3 5"/>${area}<path d="${path}" stroke="#c3f35a" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#c3f35a" stroke="#141922" stroke-width="2"><title>${esc(shortDate(p.date))}: ${fmt(p.weight)} kg</title></circle>`).join('')}</svg><p class="chart-note">Peso más alto registrado por sesión · Últimas ${series.length} sesiones</p></div>`;
  }
  function drawChart(){const target=$('progressChart');if(target && ui.historyExercise)target.innerHTML=chartMarkup(chartData(ui.historyExercise));}
  function renderHistory(){
    const usedIds=[...new Set(state.workouts.flatMap(w=>w.entries.map(e=>e.exerciseId)))];
    if(usedIds.length && !usedIds.includes(ui.historyExercise))ui.historyExercise=usedIds[0];
    const reversed=[...state.workouts].reverse();
    return `<p class="eyebrow">HISTORIAL Y PROGRESO</p><h1 class="page-title">Cada kilo cuenta.</h1><p class="lead">Visualiza tu evolución real, ejercicio por ejercicio.</p>
      <div class="section-head"><h2>Progresión de cargas</h2></div>
      <div class="card">${usedIds.length?`<div class="input-wrap"><label for="chartExercise">Selecciona un ejercicio</label><select id="chartExercise" class="input-text">${usedIds.map(id=>`<option value="${esc(id)}" ${id===ui.historyExercise?'selected':''}>${esc(byId(id)?.name || id)}</option>`).join('')}</select></div><div id="progressChart"></div>`:'<div class="empty">Tu gráfica aparecerá después del primer entrenamiento.</div>'}</div>
      <div class="section-head"><h2>Entrenamientos anteriores</h2><span class="sub">${state.workouts.length} sesiones</span></div>
      ${reversed.length?reversed.map(w=>`<article class="card history-card"><div class="history-summary"><div><b>${esc(w.routineName)}</b><span>${date(w.date)} · ${w.entries.length} ejercicios · ${w.entries.reduce((n,e)=>n+e.sets.length,0)} series</span></div><button class="round-btn" data-action="toggle-history" data-id="${esc(w.id)}" aria-label="Ver detalles de ${esc(w.routineName)}">${ui.expandedHistory===w.id?'−':'+'}</button></div>
      ${ui.expandedHistory===w.id?`<div class="history-details">${w.entries.map(entry=>`<div style="margin-bottom:13px"><b style="font-size:12px">${esc(entry.exerciseName||byId(entry.exerciseId)?.name||'Ejercicio')}</b><table>${entry.sets.map((s,i)=>`<tr><td>Serie ${i+1}</td><td>${fmt(s.weight)} kg × ${fmt(s.reps)} reps${s.rir==null?'':` · RIR ${fmt(s.rir)}`}</td></tr>`).join('')}</table></div>`).join('')}<button class="btn small danger" data-action="delete-workout" data-id="${esc(w.id)}">Eliminar sesión</button></div>`:''}</article>`).join(''):'<div class="empty"><span class="big">↗</span>Aún no hay historial. Empieza a entrenar y registra tu primera sesión.</div>'}`;
  }
  function openModal(html){$('modal-inner').innerHTML=`<div class="modal-body">${html}</div>`;const m=$('modal');if(!m.open)m.showModal()}
  function closeModal(){const m=$('modal');if(m.open)m.close()}
  function modalExercise(id){
    const e=id?byId(id):null;
    openModal(`<h2>${e?'Editar ejercicio':'Nuevo ejercicio'}</h2><p class="lead">Personaliza el objetivo para que las recomendaciones se adapten a tu entrenamiento.</p>
      <form id="exerciseForm"><input type="hidden" name="id" value="${esc(e?.id||'')}"><div class="input-wrap"><label for="ex-name">Nombre</label><input class="input-text" id="ex-name" name="name" required maxlength="80" value="${esc(e?.name||'')}" placeholder="Ej. Press de banca"></div>
      <div class="input-wrap"><label for="ex-muscle">Grupo muscular</label><select class="input-text" id="ex-muscle" name="muscle">${muscles.map(m=>`<option ${e?.muscle===m?'selected':''}>${esc(m)}</option>`).join('')}</select></div>
      <div class="field-group"><div class="input-wrap"><label>Reps mínimas</label><input class="input-text" name="min" type="number" min="1" max="100" required value="${e?.min||8}"></div><div class="input-wrap"><label>Reps máximas</label><input class="input-text" name="max" type="number" min="1" max="100" required value="${e?.max||12}"></div></div>
      <div class="field-group"><div class="input-wrap"><label>RIR objetivo</label><input class="input-text" name="rir" type="number" min="0" max="5" step=".5" required value="${e?.rir??2}"></div><div class="input-wrap"><label>Incremento (kg)</label><input class="input-text" name="step" type="number" min=".25" max="100" step=".25" required value="${e?.step||2.5}"></div></div>
      <p class="notice">Ejemplo: si completas 8 de 8 reps con el RIR previsto, la próxima sesión se sugerirá sumar el incremento configurado.</p>
      <div class="modal-actions"><button class="btn secondary" type="button" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`);
  }
  function modalRoutine(id){
    const r=routineById(id);if(!r)return;
    const list=[...state.exercises].sort((a,b)=>Number(r.exerciseIds.includes(b.id))-Number(r.exerciseIds.includes(a.id)) || a.muscle.localeCompare(b.muscle,'es') || a.name.localeCompare(b.name,'es'));
    openModal(`<h2>Editar ${esc(r.name)}</h2><p class="lead">Marca los ejercicios que realizas. Los seleccionados aparecerán en esta rutina.</p>
      <div class="input-wrap"><label>Nombre de la rutina</label><input id="routineName" class="input-text" maxlength="40" value="${esc(r.name)}"></div>
      <div class="editor-list">${list.map(e=>`<div class="exercise-item"><div class="fill"><b>${esc(e.name)}</b><div class="sub">${esc(e.muscle)}</div></div><button class="round-btn" style="color:${r.exerciseIds.includes(e.id)?'var(--accent)':'var(--muted)'}" data-action="toggle-routine-exercise" data-rid="${esc(r.id)}" data-eid="${esc(e.id)}" aria-label="${r.exerciseIds.includes(e.id)?'Quitar':'Agregar'} ${esc(e.name)}">${r.exerciseIds.includes(e.id)?'✓':'+'}</button></div>`).join('')}</div>
      <div class="modal-actions"><button class="btn secondary" data-action="close-modal">Cerrar</button><button class="btn" data-action="save-routine-name" data-rid="${esc(r.id)}">Guardar nombre</button></div><button class="mini-link" style="color:var(--danger);margin-top:8px" data-action="delete-routine" data-rid="${esc(r.id)}">Eliminar esta rutina</button>`);
  }
  function modalNewRoutine(){openModal(`<h2>Crear rutina</h2><p class="lead">Ponle nombre y después elige los ejercicios.</p><form id="newRoutineForm"><div class="input-wrap"><label>Nombre</label><input class="input-text" name="name" required maxlength="40" placeholder="Ej. Torso A"></div><div class="modal-actions"><button class="btn secondary" type="button" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Crear</button></div></form>`)}
  function modalSettings(){
    openModal(`<h2>Ajustes y respaldo</h2><p class="lead">RepMás funciona gratis y sin cuenta. Tú tienes el control de tus datos.</p>
      <div class="card"><h3>📲 Instalar la app</h3><div class="install-help" style="margin-top:9px"><b>En iPhone (Safari)</b>: abre la web publicada, toca Compartir (cuadrado con flecha) → «Añadir a pantalla de inicio» → Añadir.<br><br><b>En Android (Chrome)</b>: abre el menú ⋮ → «Instalar aplicación» o «Añadir a pantalla principal».</div><button class="btn secondary small" style="margin-top:10px" data-action="install" id="installButton">Instalar si está disponible</button></div>
      <div class="card"><h3>💾 Tus datos</h3><p class="sub">No se envían a ningún servidor. Se guardan en este dispositivo y navegador. Exporta un archivo para conservarlos si cambias de teléfono o borras los datos.</p>
      <button class="btn full" data-action="export" style="margin:12px 0 8px">↓ Exportar respaldo (.json)</button><button class="btn secondary full" data-action="import">↑ Importar respaldo</button></div>
      <div class="card"><h3>⚠️ Reiniciar</h3><p class="sub">Elimina todos los entrenamientos y personalizaciones guardados en este dispositivo.</p><button class="btn danger small" data-action="reset">Borrar mis datos</button></div>
      <p class="notice">RepMás v1.0 · Hecha para progresión de cargas. Las recomendaciones son orientativas, no sustituyen la técnica ni la recuperación.</p><button class="btn secondary full" data-action="close-modal">Cerrar</button>`);
  }
  function newSession(){
    const routine=routineById(ui.selectedRoutine);if(!routine || !routine.exerciseIds.length)return;
    state.draft={id:uid(),routineId:routine.id,routineName:routine.name,date:new Date().toISOString(),entries:routine.exerciseIds.map(id=>{
      const e=byId(id);if(!e)return null;
      const sessions=sessionsFor(id);const prev=entryFor(sessions.at(-1),id);const amount=Math.max(1,Math.min(12,prev?.sets.length || 3));
      const sets=Array.from({length:amount},(_,i)=>{const r=suggestion(e,i);return {weight:r.weight===null?'':String(r.weight),reps:'',rir:''}});
      return {exerciseId:id,exerciseName:e.name,sets};
    }).filter(Boolean)};
    save();render();window.scrollTo(0,0);
  }
  function saveWorkout(){
    const d=state.draft;if(!d)return;
    let partial=0;
    const entries=d.entries.map(en=>({exerciseId:en.exerciseId,exerciseName:byId(en.exerciseId)?.name||en.exerciseName,sets:en.sets.map(s=>{
      const weight=num(s.weight), reps=num(s.reps), rir=s.rir===''?null:num(s.rir);
      if(s.reps==='' && s.rir==='')return null;
      if(!Number.isFinite(weight)||weight<0||!Number.isFinite(reps)||reps<=0||!Number.isInteger(reps)||reps>1000||(!Number.isFinite(rir)&&rir!==null)||rir<0||rir>10){partial++;return null}
      return {weight,reps,rir};
    }).filter(Boolean)})).filter(en=>en.sets.length);
    if(!entries.length){showToast('Registra al menos una serie con peso y repeticiones.');return}
    if(partial && !confirm(`Hay ${partial} serie(s) incompleta(s) o inválida(s), que no se guardarán. ¿Continuar?`))return;
    state.workouts.push({id:d.id,routineId:d.routineId,routineName:d.routineName,date:new Date().toISOString(),entries});
    state.draft=null;save();ui.tab='history';ui.historyExercise=entries[0].exerciseId;render();window.scrollTo(0,0);showToast('¡Entrenamiento guardado! ✓');
  }
  function exportData(){
    const stamp=new Date().toISOString().slice(0,10);
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`repmas-respaldo-${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Respaldo generado. Guárdalo en Archivos.');
  }
  const changeTab=(tab)=>{ui.tab=tab;render();window.scrollTo({top:0,behavior:'instant'})};
  document.addEventListener('click', async ev=>{
    const btn=ev.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action;
    if(action==='nav'){changeTab(btn.dataset.tab);return}
    if(action==='settings'){modalSettings();return}
    if(action==='close-modal'){closeModal();return}
    if(action==='select-routine'){
      ui.selectedRoutine=btn.dataset.id;changeTab('train');return;
    }
    if(action==='edit-routine'){modalRoutine(btn.dataset.id);return}
    if(action==='toggle-routine-exercise'){
      const r=routineById(btn.dataset.rid);const id=btn.dataset.eid;if(!r)return;
      r.exerciseIds=r.exerciseIds.includes(id)?r.exerciseIds.filter(x=>x!==id):[...r.exerciseIds,id];save();render();modalRoutine(r.id);return;
    }
    if(action==='save-routine-name'){
      const r=routineById(btn.dataset.rid),name=$('routineName')?.value.trim();if(!r||!name){showToast('Introduce un nombre.');return}r.name=name;save();closeModal();render();showToast('Rutina actualizada.');return;
    }
    if(action==='new-routine'){modalNewRoutine();return}
    if(action==='delete-routine'){
      if(state.routines.length<=1){showToast('Debe quedar al menos una rutina.');return}
      const r=routineById(btn.dataset.rid);if(!r||!confirm(`¿Eliminar la rutina «${r.name}»? El historial se conservará.`))return;
      state.routines=state.routines.filter(x=>x.id!==r.id);ui.selectedRoutine=state.routines[0].id;save();closeModal();render();return;
    }
    if(action==='new-exercise'){modalExercise(null);return}
    if(action==='edit-exercise'){modalExercise(btn.dataset.id);return}
    if(action==='filter-muscle'){ui.muscle=btn.dataset.muscle;render();return}
    if(action==='start-session'){newSession();return}
    if(action==='add-set'){
      const entry=state.draft?.entries[Number(btn.dataset.ei)];if(!entry)return;
      const e=byId(entry.exerciseId);const r=suggestion(e,entry.sets.length);
      entry.sets.push({weight:r.weight===null?'':String(r.weight),reps:'',rir:''});save();render();return;
    }
    if(action==='remove-set'){
      const entry=state.draft?.entries[Number(btn.dataset.ei)];if(!entry)return;
      if(entry.sets.length===1){showToast('Deja al menos una serie por ejercicio.');return}
      entry.sets.splice(Number(btn.dataset.si),1);save();render();return;
    }
    if(action==='finish-session'){saveWorkout();return}
    if(action==='discard-session'){
      if(confirm('¿Descartar este entrenamiento? Las series sin guardar se perderán.')){state.draft=null;save();render();showToast('Entrenamiento descartado.')}
      return;
    }
    if(action==='toggle-history'){ui.expandedHistory=ui.expandedHistory===btn.dataset.id?'':btn.dataset.id;render();return}
    if(action==='delete-workout'){
      if(!confirm('¿Eliminar este entrenamiento del historial? No se puede deshacer.'))return;
      state.workouts=state.workouts.filter(w=>w.id!==btn.dataset.id);ui.expandedHistory='';save();render();showToast('Entrenamiento eliminado.');return;
    }
    if(action==='export'){exportData();return}
    if(action==='import'){$('backupFile').click();return}
    if(action==='reset'){
      if(!confirm('¿Eliminar TODOS tus datos en este dispositivo? Exporta primero un respaldo si quieres conservarlos.'))return;
      state=defaults();save();closeModal();ui.selectedRoutine=state.routines[0].id;ui.tab='home';ui.historyExercise='';render();showToast('Datos reiniciados.');return;
    }
    if(action==='install'){
      if(ui.installPrompt){ui.installPrompt.prompt();await ui.installPrompt.userChoice;ui.installPrompt=null}
      else showToast('En iPhone usa Compartir → Añadir a pantalla de inicio.');
      return;
    }
  });
  document.addEventListener('submit',ev=>{
    if(ev.target.getAttribute('id')==='exerciseForm'){
      ev.preventDefault();const f=new FormData(ev.target);
      const name=String(f.get('name')||'').trim(),min=Number(f.get('min')),max=Number(f.get('max')),rir=Number(f.get('rir')),step=Number(f.get('step'));
      if(!name||min>max||min<1||max>100||rir<0||rir>5||step<.25||step>100||!Number.isFinite(step)){showToast('Revisa el rango de reps, RIR y el incremento.');return}
      const id=String(f.get('id')||'');const old=byId(id);
      const value={id:old?.id||uid(),name,muscle:String(f.get('muscle')),min,max,rir,step};
      if(old)Object.assign(old,value);else state.exercises.push(value);
      save();closeModal();render();showToast(old?'Ejercicio actualizado.':'Ejercicio creado.');return;
    }
    if(ev.target.getAttribute('id')==='newRoutineForm'){
      ev.preventDefault();const name=String(new FormData(ev.target).get('name')||'').trim();if(!name)return;
      const r={id:uid(),name,emoji:'◈',color:'purple',exerciseIds:[]};state.routines.push(r);ui.selectedRoutine=r.id;save();modalRoutine(r.id);render();return;
    }
  });
  document.addEventListener('input',ev=>{
    const el=ev.target;if(el.id==='exerciseSearch'){
      ui.query=el.value;const list=$('libraryList');if(list)list.innerHTML=libraryRows();return;
    }
    if(el.matches('[data-draft-entry]')){
      const entry=state.draft?.entries[Number(el.dataset.draftEntry)];const s=entry?.sets[Number(el.dataset.set)];if(!s)return;
      s[el.dataset.field]=el.value;save();
    }
  });
  document.addEventListener('change',ev=>{
    if(ev.target.id==='chartExercise'){ui.historyExercise=ev.target.value;drawChart()}
  });
  $('backupFile').addEventListener('change',async ev=>{
    const file=ev.target.files?.[0];if(!file)return;
    try{
      if(file.size>15_000_000)throw new Error('El archivo supera 15 MB.');
      const contents=await file.text(),imported=validImport(JSON.parse(contents));
      if(!confirm('Importar el respaldo REEMPLAZARÁ los datos actuales de este dispositivo. ¿Continuar?'))return;
      state=imported;save();ui.selectedRoutine=state.routines[0].id;ui.tab='home';ui.historyExercise='';closeModal();render();showToast('Respaldo importado correctamente.');
    }catch(err){showToast(err.message||'No se pudo leer el archivo.');console.warn(err)}finally{ev.target.value=''}
  });
  $('modal').addEventListener('click',ev=>{if(ev.target===$('modal'))closeModal()});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ui.installPrompt=e});
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Sin modo offline',err)));
  }
  render();
})();
