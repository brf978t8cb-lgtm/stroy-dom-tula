(() => {
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const data=window.CATALOG||[], settings=window.SITE||{mode:'demo'}, params=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
const num=n=>String(n).replace('.',',');
const track=(event,fields={})=>{const entry={event,...fields};window.dataLayer=window.dataLayer||[];window.dataLayer.push(entry);document.dispatchEvent(new CustomEvent('site:analytics',{detail:entry}));};
const safeSession={get(k){try{return JSON.parse(sessionStorage.getItem(k))}catch{return null}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch{}},remove(k){try{sessionStorage.removeItem(k)}catch{}}};
const menu=$('.menu-toggle'), nav=$('#main-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('open',open);menu.textContent=open?'×':'☰'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){menu.click();menu.focus()}});
$$('[data-contact]').forEach(a=>a.addEventListener('click',()=>track('contact_click',{channel:a.dataset.contact})));
const ranges={house:[100,150],bath:[40,60],garage:[35,60],gazebo:[15,25]};
const matchesArea=(p,a,category='house')=>{const[lo,hi]=ranges[category]||ranges.house;return !a||(a==='small'&&p.area<lo)||(a==='medium'&&p.area>=lo&&p.area<=hi)||(a==='large'&&p.area>hi)};
function card(p){return `<article class="product-card" data-product="${p.id}"><a class="product-image" href="/stroy-dom-tula/projects/${p.id}.html"><img src="${esc(p.localImage)}" alt="Проект ${esc(p.name)}: внешний вид" loading="lazy" width="400" height="300"><span class="badge">${esc(p.material)}</span></a><div class="card-top"><h3><a href="/stroy-dom-tula/projects/${p.id}.html">${esc(p.name)}</a></h3><span>№ ${p.id}</span></div><p class="card-facts">${num(p.area)} м² · ${esc(p.floors||'—')} эт. · ${esc(p.dimensions||'Габариты уточняются')}</p><div class="card-price"><div><strong>от ${money(p.price)}</strong><small>за строительство по проекту</small></div><a class="card-action" href="/stroy-dom-tula/projects/${p.id}.html" aria-label="Смотреть проект ${esc(p.name)}">↗</a></div></article>`}
const catalog=$('[data-catalog]');
let filterAPI;
if(catalog){
 const category=catalog.dataset.catalog, base=data.filter(p=>!category||p.category===category);
 const fields={q:$('#catalog-search'),area:$('#filter-area'),material:$('#filter-material'),floors:$('#filter-floors'),budget:$('#filter-budget'),sort:$('#catalog-sort')};
 let page=1;const perPage=12;
 if(new Set(base.map(p=>p.floors)).size<2)fields.floors.closest('.field').hidden=true;
 const readUrl=()=>{const query=new URLSearchParams(location.search);Object.entries(fields).forEach(([k,el])=>el.value=query.get(k)||(k==='sort'?'selection':''));page=Math.max(1,parseInt(query.get('page'),10)||1)};
 const state=()=>Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value]));
 const saveUrl=()=>{const url=new URL(location.href);url.search='';Object.entries(state()).forEach(([k,v])=>{if(v&&v!=='selection')url.searchParams.set(k,v)});if(page>1)url.searchParams.set('page',page);history.replaceState(null,'',url)};
 function render(){
  const s=state();let result=base.filter(p=>(!s.q||(`${p.name} ${p.id}`).toLocaleLowerCase('ru').includes(s.q.trim().toLocaleLowerCase('ru')))&&matchesArea(p,s.area,category)&&(!s.material||p.material===s.material)&&(!s.floors||p.floors===s.floors)&&(!s.budget||p.price<=Number(s.budget)));
  if(s.sort==='price-asc')result.sort((a,b)=>a.price-b.price);if(s.sort==='price-desc')result.sort((a,b)=>b.price-a.price);if(s.sort==='area-asc')result.sort((a,b)=>a.area-b.area);
  const totalPages=Math.max(1,Math.ceil(result.length/perPage));page=Math.min(page,totalPages);
  $('#catalog-results').innerHTML=result.length?result.slice((page-1)*perPage,page*perPage).map(card).join(''):'<div class="empty-state" style="grid-column:1/-1"><h2>Пока нет подходящих проектов</h2><p>Попробуйте увеличить бюджет, выбрать другой материал или убрать часть условий.</p><button class="button" type="button" data-reset>Сбросить фильтры ↗</button></div>';
  $('.results-count').textContent=result.length?`Найдено: ${result.length} · показаны ${(page-1)*perPage+1}–${Math.min(page*perPage,result.length)}`:'Найдено: 0';
  const labels={q:'Поиск',area:'Площадь',material:'Материал',floors:'Этажность',budget:'Цена до'};
  $('.active-filters').innerHTML=Object.entries(s).filter(([k,v])=>v&&k!=='sort').map(([k,v])=>{const text=fields[k].tagName==='SELECT'?fields[k].selectedOptions[0]?.textContent:v;return `<button class="filter-chip" data-clear="${k}" aria-label="Убрать фильтр ${labels[k]}">${labels[k]}: ${esc(text)} ×</button>`}).join('');
  $('.pagination').innerHTML=totalPages>1?Array.from({length:totalPages},(_,i)=>`<button type="button" data-page-number="${i+1}" ${i+1===page?'aria-current="page"':''} aria-label="Страница ${i+1}">${i+1}</button>`).join(''):'';
  saveUrl();return result;
 }
 const reset=()=>{Object.entries(fields).forEach(([k,e])=>e.value=k==='sort'?'selection':'');page=1;render()};
 readUrl();render();track('category_view',{category:category||'all'});
 let timer;Object.entries(fields).forEach(([k,e])=>e.addEventListener(e.tagName==='SELECT'?'change':'input',()=>{clearTimeout(timer);timer=setTimeout(()=>{page=1;render();track('catalog_filter',{field:k,category:category||'all'})},e.tagName==='SELECT'?0:180)}));
 catalog.addEventListener('click',e=>{if(e.target.closest('[data-reset]'))reset();const clear=e.target.closest('[data-clear]');if(clear){fields[clear.dataset.clear].value='';page=1;render()}const p=e.target.closest('[data-page-number]');if(p){page=Number(p.dataset.pageNumber);render();$('.results-toolbar').scrollIntoView({block:'start'})}});
 window.addEventListener('popstate',()=>{readUrl();render()});window.addEventListener('pageshow',e=>{if(e.persisted){readUrl();render()}});
 $('.filter-toggle').addEventListener('click',e=>{const b=e.currentTarget,open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));$('#filters').classList.toggle('open',open)});
 filterAPI=(input)=>{const allowed=Object.keys(fields);for(const k of Object.keys(input)){if(!allowed.includes(k)||typeof input[k]!=='string')throw Error('Неизвестный параметр фильтра')}for(const[k,v]of Object.entries(input)){const el=fields[k];if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v))throw Error('Недопустимое значение фильтра');if(k==='budget'&&v&&(!Number.isFinite(Number(v))||Number(v)<0))throw Error('Недопустимый бюджет')};Object.entries(input).forEach(([k,v])=>fields[k].value=v);page=1;const found=render();return {count:found.length,projects:found.slice(0,12).map(p=>({id:p.id,name:p.name,url:`/stroy-dom-tula/projects/${p.id}.html`}))}};
}
const detail=$('[data-detail]');
if(detail){
 const id=detail.dataset.detail;track('product_view',{project_id:id});
 const config=$('#configuration'), key='configuration:'+id;
 const saved=safeSession.get(key);if(saved&&[...config.options].some(o=>o.value===saved))config.value=saved;
 const sync=()=>{safeSession.set(key,config.value);const selected=config.selectedOptions[0];$$('[data-detail-price]').forEach(e=>e.textContent='от '+money(Number(selected.dataset.price)));$$('a[href^="/stroy-dom-tula/inquiry.html"]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('configuration',config.value);a.href=u.pathname+u.search})};sync();config.addEventListener('change',sync);
 const main=$('.gallery-main'),dialog=$('#gallery-dialog');
 $$('[data-gallery]').forEach(b=>b.addEventListener('click',()=>{main.src=b.dataset.gallery;main.alt=b.dataset.imageLabel;$$('[data-gallery]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}));
 function openGallery(){ $('img',dialog).src=main.src;$('img',dialog).alt=main.alt;dialog.showModal() }main.addEventListener('click',openGallery);main.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGallery()}});
 $('[data-close-dialog]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
}
const selector=$('#selection-form');
if(selector){const updateAreaLabels=()=>{const category=new FormData(selector).get('category');const[lo,hi]=ranges[category];const options=$('#select-area').options;options[1].textContent=`До ${lo} м²`;options[2].textContent=`${lo}–${hi} м²`;options[3].textContent=`Больше ${hi} м²`};selector.addEventListener('change',updateAreaLabels);updateAreaLabels();selector.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(selector);const category=f.get('category'),area=f.get('area'),group=f.get('group');const found=data.filter(p=>p.category===category&&matchesArea(p,area,category)&&(!group||group===p.group));const result=$('#selection-results');result.hidden=false;result.innerHTML=`<div class="section-head"><div><span class="eyebrow accent">РЕЗУЛЬТАТ ПОДБОРА</span><h2>${found.length?'Подходящие варианты':'Попробуем другие параметры'}</h2></div><p>${found.length?`Найдено ${found.length}. Показаны первые ${found.length} по порядку подборки.`:'В этой подборке нет точного совпадения. Измените площадь или конструктив.'}</p></div><div class="product-grid">${found.map(card).join('')}</div><p style="margin-top:2rem"><a class="text-link" href="/stroy-dom-tula/inquiry.html?intent=consultation&category=${category}&area=${area}&group=${group}">Обсудить пожелания ↗</a></p>`;result.focus();result.scrollIntoView({block:'start'});track('selection_complete',{category,area,group,result_count:found.length})});selector.addEventListener('change',()=>track('selection_use'),{once:true});}
const project=data.find(p=>p.id===params.get('project'));
const allowedConfigurations=project?.id==='1202'?['Коробка · газоблок','Под ключ · газоблок']:project?.id==='1623'?['Коробка · каркас','Под ключ · каркас']:['Уточнить базовую комплектацию'];
const requested=params.get('configuration'), configuration=allowedConfigurations.includes(requested)?requested:allowedConfigurations[0];
const intent=params.get('intent')==='estimate'?'estimate':'consultation';
const categoryNames={house:'Дом',bath:'Баня',garage:'Гараж',gazebo:'Беседка'},areaNames={small:'До 100 м²',medium:'100–150 м²',large:'Больше 150 м²'},groupNames={stone:'Каменный',frame:'Каркасный / SIP',wood:'Деревянный'};
const selection={category:categoryNames[params.get('category')]?params.get('category'):'',area:areaNames[params.get('area')]?params.get('area'):'',group:groupNames[params.get('group')]?params.get('group'):''};
if(selection.category){const[lo,hi]=ranges[selection.category];Object.assign(areaNames,{small:`До ${lo} м²`,medium:`${lo}–${hi} м²`,large:`Больше ${hi} м²`})}
const panel=$('#inquiry-context');if(panel){panel.innerHTML=project?`<span class="eyebrow accent">ВЫБРАННЫЙ ПРОЕКТ</span><h3>${esc(project.name)} · № ${project.id}</h3><p>${num(project.area)} м² · ${esc(project.material)}</p><p>${esc(configuration)}</p><a class="source-link" href="/stroy-dom-tula/projects/${project.id}.html">Вернуться к проекту</a>`:`<h3>${intent==='estimate'?'Расчёт строительства':'Консультация по проекту'}</h3><p>${esc([categoryNames[selection.category],areaNames[selection.area],groupNames[selection.group]].filter(Boolean).join(' · ')||'Обсуждение ваших исходных пожеланий')}</p>`;}
$$('.lead-form').forEach(form=>{
 const contact=$('[name=contact]',form),consent=$('[name=consent]',form),submit=$('[type=submit]',form),message=$('.form-message',form);let busy=false,requestId=crypto.randomUUID();
 form.addEventListener('focusin',()=>track('form_start',{project_id:project?.id||null,intent}),{once:true});
 if(settings.mode==='live'){$('[data-mode-note]',form).textContent='После подтверждения приёма обращения специалист свяжется с вами, чтобы уточнить задачу.';$('[data-submit-label]',form).textContent=intent==='estimate'?'Отправить на расчёт':'Отправить обращение'}
 const error=(el,id,text)=>{el.setAttribute('aria-invalid',String(!!text));$('#'+id,form).textContent=text};
 contact.addEventListener('input',()=>error(contact,'contact-error',''));consent.addEventListener('change',()=>error(consent,'consent-error',''));
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;
  const c=contact.value.trim(), digits=c.replace(/\D/g,''),valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)||(/^[+\d()\s-]+$/.test(c)&&digits.length>=10&&digits.length<=15);
  error(contact,'contact-error',valid?'':'Введите телефон с кодом города или корректную почту.');error(consent,'consent-error',consent.checked?'':'Отметьте согласие после ознакомления с условиями.');
  if(!valid||!consent.checked){(valid?consent:contact).focus();return}if($('[name=website]',form).value)return;
  const context={projectId:project?.id||null,configuration:project?configuration:'',intent,selection};
  if(settings.mode!=='live'){safeSession.set('lead-preview',{...context,createdAt:Date.now()});track('form_preview',{project_id:project?.id||null});location.assign('/stroy-dom-tula/confirmation.html?mode=demo');return}
  busy=true;submit.disabled=true;submit.setAttribute('aria-busy','true');message.textContent='Передаём обращение…';
  try{const response=await fetch(settings.crmEndpoint||'/stroy-dom-tula/api/leads',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestId},body:JSON.stringify({...context,contact:c,comment:$('[name=comment]',form).value.trim(),consent:true,website:'',consentVersion:'2026-09-22'}),signal:AbortSignal.timeout(20000)});const body=await response.json();
   if(!response.ok||body.accepted!==true||!body.receiptId)throw Error(body.message||'Не удалось подтвердить приём. Данные остались в форме. Попробуйте ещё раз или свяжитесь с компанией.');
   safeSession.set('lead-receipt',{id:body.receiptId,createdAt:Date.now()});track('lead_success',{project_id:project?.id||null,receipt_id:body.receiptId});location.assign('/stroy-dom-tula/confirmation.html');
  }catch(err){message.textContent=err.name==='TimeoutError'?'Ответ не получен. Заявка могла поступить: повторная попытка проверит тот же номер обращения. Введённые данные сохранены в форме.':err.message;message.focus();track('form_error',{project_id:project?.id||null})}finally{busy=false;submit.disabled=false;submit.removeAttribute('aria-busy')}
 });
});
$$('[data-form-guard]').forEach(el=>el.disabled=false);
const confirmation=$('#confirmation');if(confirmation){const preview=safeSession.get('lead-preview'),receipt=safeSession.get('lead-receipt');if(params.get('mode')==='demo'&&preview&&Date.now()-preview.createdAt<3600000){if(preview.selection?.category){const[lo,hi]=ranges[preview.selection.category];Object.assign(areaNames,{small:`До ${lo} м²`,medium:`${lo}–${hi} м²`,large:`Больше ${hi} м²`})}const p=data.find(p=>p.id===preview.projectId);confirmation.innerHTML=`<h1>Обращение<br>подготовлено.</h1><p>Это учебный предпросмотр. Заявка не отправлена в компанию или CRM, контактные данные не сохранены.</p><div class="receipt"><span class="eyebrow accent">ПАРАМЕТРЫ ОБРАЩЕНИЯ</span><h3>${esc(p?`${p.name} · № ${p.id}`:'Консультация по строительству')}</h3><p>${esc(preview.configuration||[categoryNames[preview.selection?.category],areaNames[preview.selection?.area],groupNames[preview.selection?.group]].filter(Boolean).join(' · '))}</p></div><p>После подключения CRM здесь появится подтверждение только после реального приёма заявки. Следующий шаг — уточнение участка, комплектации и состава расчёта.</p><p><a class="text-link" href="/stroy-dom-tula/contacts.html">Контакты компании ↗</a></p>`}else if(receipt&&Date.now()-receipt.createdAt<3600000&&settings.mode==='live'){confirmation.innerHTML='<h1>Проверяем<br>статус обращения.</h1><p>Подождите, пока сервер подтвердит приём.</p>';fetch('/stroy-dom-tula/api/leads/'+encodeURIComponent(receipt.id)).then(r=>{if(!r.ok)throw Error();return r.json()}).then(r=>{if(r.accepted!==true)throw Error();confirmation.innerHTML=`<h1>Обращение принято.</h1><p>Номер: ${esc(r.receiptId)}. Специалист свяжется с вами, чтобы уточнить проект, участок и состав работ.</p>`}).catch(()=>{confirmation.innerHTML='<h1>Статус пока<br>не подтверждён.</h1><p>Обратитесь по контактам компании или обновите страницу позже.</p>'})}}
// Read/configure tools use the same filtering and rendered state as the visible catalog.
if(filterAPI&&document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'filter_project_catalog',title:'Подобрать проекты',description:'Изменить видимые фильтры каталога и показать соответствующие проекты. Не создаёт заявку.',inputSchema:{type:'object',properties:Object.fromEntries(['q','area','material','floors','budget','sort'].map(k=>[k,{type:'string'}])),additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>filterAPI(input)},{signal:lifecycle.signal})).catch(()=>{})}catch{}}
})();
