const iconPaths = {
  spark: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z M19 14v6m-3-3h6',
  grid: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm4-4a4 4 0 0 1 0 8',
  chat: 'M21 11a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 15-4z M9 11h.01m4 0h.01m4 0h.01',
  user: 'M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2 M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  swap: 'M4 7h15l-4-4m5 14H5l4 4',
  note: 'M9 18V5l11-2v13 M9 18c0 1.4-1.6 2.5-3.5 2.5S2 19.4 2 18s1.6-2.5 3.5-2.5S9 16.6 9 18zm11-2c0 1.4-1.6 2.5-3.5 2.5S13 17.4 13 16s1.6-2.5 3.5-2.5S20 14.6 20 16z'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name]}"/></svg>`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function link(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
const roles = ['보컬', '프로듀서', '작곡가', '작사가', '엔지니어'];
const profiles = [
  {id:'min',name:'민지',handle:'MINJI',role:'보컬',need:'프로듀서',genres:'R&B, 인디 팝, Lo-fi',style:'비대면',goal:'싱글 발매',work:'새벽의 색 — 보컬 데모',terms:'주 1회 피드백, 크레딧과 수익 배분은 작업 전에 협의',temperature:38.2,colors:['#a77cf1','#5637ab']},
  {id:'neo',name:'NEON K',handle:'NK',role:'프로듀서',need:'보컬',genres:'R&B, Lo-fi, 인디 팝',style:'비대면',goal:'싱글 발매',work:'After Hours',terms:'비대면 작업과 주간 피드백, 수익 배분 사전 협의',temperature:39.2,colors:['#a76efa','#7045aa']},
  {id:'sora',name:'소라',handle:'SR',role:'프로듀서',need:'보컬',genres:'R&B, 인디 팝',style:'혼합',goal:'싱글 발매',work:'City Lights',terms:'레퍼런스 공유 후 데모 작업, 서울에서 녹음 가능',temperature:38.7,colors:['#ef9db8','#a54e76']},
  {id:'jay',name:'JAYWAVE',handle:'JW',role:'작곡가',need:'보컬',genres:'Lo-fi, R&B',style:'비대면',goal:'싱글 발매',work:'Blue Hour',terms:'비대면 작업, 멜로디와 가사 피드백 환영',temperature:37.8,colors:['#6bcdbc','#236c72']},
  {id:'dawn',name:'DAWN',handle:'DW',role:'작사가',need:'보컬',genres:'인디 팝, 발라드',style:'비대면',goal:'포트폴리오',work:'Late Letter',terms:'주말 위주로 작업, 가사 수정 2회',temperature:36.8,colors:['#f4a879','#97506a']},
  {id:'mika',name:'MIKA',handle:'MK',role:'엔지니어',need:'프로듀서',genres:'R&B, 일렉트로닉',style:'대면',goal:'싱글 발매',work:'Velvet Mix',terms:'서울 녹음실 이용, 믹싱 일정 사전 조율',temperature:35.5,colors:['#89aaf1','#405ca7']}
];
const demo = {profiles, projects:[
  {id:'first',from:'min',to:'jay',title:'Blue Hour 보컬 피처링',status:'active',done:[],messages:[{from:'jay',text:'민지님, 데모 들어보셨어요? 후렴부터 같이 작업해 보면 좋겠어요.'}]},
  {id:'old',from:'dawn',to:'min',title:'Late Letter 가이드 녹음',status:'done',done:['dawn','min'],messages:[]}
],reviews:[{project:'old',from:'dawn',to:'min',stars:5,text:'일정에 맞춰 가이드 보컬을 전달해 주셨어요.',issue:''}]};
const storageKey = 'looproom-demo-v1';
const saved = localStorage.getItem(storageKey);
let data = saved ? JSON.parse(saved) : structuredClone(demo);
let account = 'min';
let page = 'discover';
let filter = '전체';
let activeChat = '';
let registering = false;
let timer;
let saveQueue = Promise.resolve();
const dialog = document.querySelector('#dialog');
const content = document.querySelector('#content');
const pages = {
  discover:['grid','추천 탐색'],
  projects:['users','내 협업'],
  messages:['chat','메시지'],
  profile:['user','내 프로필']
};
const person = id => data.profiles.find(profile => profile.id === id);
const me = () => person(account);
const needs = profile => Array.isArray(profile.need) ? profile.need : profile.need ? [profile.need] : [];
const projects = () => data.projects.filter(item => [item.from,item.to].includes(account));
const partner = item => person(item.from === account ? item.to : item.from);
const hasProject = id => projects().find(item => [item.from,item.to].includes(id) && ['pending','active'].includes(item.status));
const initials = profile => safe(profile.handle.slice(0,2));
const color = profile => `--a:${profile.colors[0]};--b:${profile.colors[1]}`;
const avatar = (profile, big = false) => `<span class="avatar ${big ? 'big' : ''}" style="${color(profile)}">${initials(profile)}</span>`;
const tags = text => text.split(',').map(item => item.trim()).filter(Boolean);
const chips = list => `<div class="tags">${list.map(item => `<span class="tag">${safe(item)}</span>`).join('')}</div>`;
const itemFor = id => projects().find(item => item.id === id);
const button = (text, action, id = '', primary = false) => `<button type="button" class="${primary ? 'primary' : ''}" data-act="${action}" data-id="${safe(id)}">${text}</button>`;
const heading = (title, desc) => `<h1 class="page-title">${title}</h1><p class="muted">${desc}</p>`;
const empty = text => `<div class="panel empty">${text}</div>`;
function announce(text) {
  document.querySelector('#toast').textContent = text;
  clearTimeout(timer);
  timer = setTimeout(() => { document.querySelector('#toast').textContent = ''; }, 3000);
}
function save() {
  const snapshot = JSON.stringify(data);
  localStorage.setItem(storageKey, snapshot);
  if (location.protocol === 'file:') return;
  saveQueue = saveQueue.then(async () => {
    const response = await fetch('/state', {method:'PUT',headers:{'Content-Type':'application/json'},body:snapshot});
    if (!response.ok) throw new Error('Save failed');
  }).catch(() => announce('이 브라우저에 저장했습니다. 서버 저장은 실패했습니다.'));
}
function reviewList(id) { return data.reviews.filter(review => review.to === id); }
function temperature(profile) {
  const adjustment = reviewList(profile.id).reduce((total, review) => total + (review.stars - 3) * .16 - (review.issue === '노쇼' ? 1.2 : review.issue ? .45 : 0), 0);
  return Math.max(0, Math.min(100, profile.temperature + adjustment)).toFixed(1);
}
function match(profile) {
  const own = me();
  const genres = tags(own.genres);
  const shared = tags(profile.genres).filter(tag => genres.some(genre => genre.toLowerCase() === tag.toLowerCase()));
  const taste = Math.round(35 * shared.length / Math.max(genres.length, tags(profile.genres).length, 1));
  const role = (needs(own).includes(profile.role) ? 20 : 0) + (needs(profile).includes(own.role) ? 10 : 0);
  const style = own.style === profile.style ? 15 : [own.style,profile.style].includes('혼합') ? 10 : 0;
  const goal = own.goal === profile.goal ? 20 : 0;
  const reasons = [
    shared.length ? `${shared.slice(0,2).join(' · ')} 취향이 겹쳐요` : '공통 장르가 없어요',
    role === 30 ? '서로 필요한 역할이에요' : role ? '한쪽의 필요 역할을 채워요' : '필요 역할이 달라요',
    style === 15 ? `${own.style} 작업 방식이 같아요` : style ? '작업 방식을 조율할 수 있어요' : '작업 방식이 달라요',
    goal ? `${own.goal}를 목표로 해요` : '협업 목적이 달라요'
  ];
  return {score:taste+role+style+goal, parts:[taste,role,style,goal], reasons};
}
function art() {
  const lines = Array.from({length:29}, (_, index) => {
    const y = 31 + index * 5.8;
    return `<path d="M-20 ${y+60} C 128 ${y-113}, 180 ${y+159}, 289 ${y+49} S 383 ${y-87}, 560 ${y-2}" opacity="${.30+index*.018}"/>`;
  }).join('');
  return `<svg class="hero-art" viewBox="0 0 520 245" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wave"><stop stop-color="#8b61e5" stop-opacity="0"/><stop offset=".54" stop-color="#a478f0"/><stop offset="1" stop-color="#e1b6ff"/></linearGradient><radialGradient id="halo"><stop stop-color="#9a5dec" stop-opacity=".48"/><stop offset="1" stop-color="#9a5dec" stop-opacity="0"/></radialGradient></defs><ellipse cx="394" cy="114" rx="182" ry="140" fill="url(#halo)"/><g fill="none" stroke="url(#wave)" stroke-width="1.05">${lines}</g><g fill="#ddbdff"><circle cx="295" cy="45" r="2"/><circle cx="443" cy="66" r="3"/><circle cx="381" cy="196" r="2"/><circle cx="220" cy="176" r="1.5"/></g></svg>`;
}
function card(profile, result) {
  const existing = hasProject(profile.id);
  const positive = result.reasons.filter((_, index) => result.parts[index] > 0);
  return `<article class="card"><div class="cover" style="${color(profile)}"><span class="score">${result.score}% 적합</span></div><div class="card-body"><div class="identity">${avatar(profile,true)}<span class="temperature" title="매너 온도">♨ ${temperature(profile)}°C</span></div><h3>${safe(profile?.name)}</h3><p class="role">${safe(profile.role)} · ${safe(profile.style)} 작업</p>${chips(tags(profile.genres))}<div class="reason">${icon('spark')}<span>${safe(positive.slice(0,2).join(' · ') || '프로필에서 협업 조건을 확인해 보세요.')}</span></div><div class="actions">${button('프로필 보기','details',profile.id)}${existing ? button(existing.status === 'pending' ? '요청 확인' : '메시지','project',existing.id,true) : button('협업 제안','request',profile.id,true)}</div></div></article>`;
}
function discover() {
  const candidates = data.profiles.filter(profile => profile.id !== account && (filter === '전체' || profile.role === filter)).map(profile => ({profile,result:match(profile)})).sort((a,b) => b.result.score-a.result.score);
  return `<section class="hero">${art()}<span class="eyebrow">${icon('spark')} AI 협업 매칭</span><h1>좋은 음악은<br><span>함께</span> 만들어지니까.</h1><p>취향과 작업 방식이 맞는 음악 창작자를 만나보세요.</p>${button('내 매칭 기준 보기','criteria','',true)}</section><section><div class="section-title"><div><h2>${safe(me().name)}님을 위한 협업 추천</h2><p>음악 취향, 역할, 작업 방식, 협업 목적을 비교했어요.</p></div><span class="muted">${candidates.length}명 · 적합도순</span></div><div class="filters" aria-label="추천 역할 필터">${['전체',...roles].map(role => `<button type="button" class="${role === filter ? 'on' : ''}" aria-pressed="${role === filter}" data-act="filter" data-id="${role}">${role}</button>`).join('')}</div><div class="grid">${candidates.map(({profile,result}) => card(profile,result)).join('')}</div>${candidates.length ? '' : empty('이 역할의 추천 창작자가 아직 없어요.')}</section>`;
}
function projectRow(item) {
  const other = partner(item);
  const sent = item.from === account;
  const labels = {pending:sent ? '응답 대기 중' : '받은 제안',active:item.done.length ? '완료 확인 대기 중' : '진행 중',done:item.endedEarly ? '중도 종료' : '완료',declined:'거절됨',cancelled:'철회됨'};
  let actions = '';
  if (item.status === 'pending') actions = sent ? button('요청 철회','cancel',item.id) : button('거절','decline',item.id)+button('수락','accept',item.id,true);
  if (item.status === 'active') actions = button('메시지','message',item.id,true)+(item.done.includes(account) ? '' : button('완료 확인','done',item.id))+button('협업 중도 종료','end',item.id);
  if (item.status === 'done') actions = button('메시지','message',item.id)+(data.reviews.some(review => review.project === item.id && review.from === account) ? '<span class="muted">후기 작성 완료</span>' : button('후기 남기기','review',item.id,true));
  return `<article class="panel list-row"><div class="row">${avatar(other)}<div><h3>${safe(item.title)}</h3><p class="muted">${safe(other.name)} · ${labels[item.status]}</p>${item.note ? `<p>${safe(item.note)}</p>` : ''}</div></div><div class="row">${actions}</div></article>`;
}
function projectPage() {
  const items = projects();
  const group = (title, statuses, hint) => {
    const found = items.filter(item => statuses.includes(item.status));
    return `<h2 class="subhead">${title}</h2><div class="stack">${found.length ? found.map(projectRow).join('') : empty(hint)}</div>`;
  };
  return heading('내 협업','받고 보낸 제안부터 진행 중인 작업과 완료된 협업까지 확인하세요.')+
    group('협업 요청',['pending'],'응답을 기다리는 협업 요청이 없어요.')+
    group('진행 중',['active'],'진행 중인 협업이 없어요.')+
    group('완료된 협업',['done'],'완료된 협업이 없어요.')+
    (items.some(item => ['declined','cancelled'].includes(item.status)) ? group('종료된 요청',['declined','cancelled'],'') : '');
}
function messagePage() {
  const threads = projects().filter(item => ['active','done'].includes(item.status));
  const thread = threads.find(item => item.id === activeChat) || threads[0];
  const header = heading('메시지','협업 요청을 수락하면 상대와 직접 메시지를 주고받을 수 있어요.');
  if (!thread) return header+`<div class="subhead">${empty('아직 대화가 없어요.')}</div>`;
  activeChat = thread.id;
  const other = partner(thread);
  return header+`<div class="chat subhead"><nav class="panel" aria-label="대화 목록">${threads.map(item => `<button class="${item.id === activeChat ? 'on' : ''}" data-act="message" data-id="${item.id}">${avatar(partner(item))}<span>${safe(partner(item).name)}<br><small>${safe(item.title)}</small></span></button>`).join('')}</nav><section class="panel"><h2>${safe(other.name)}</h2><p class="muted">${safe(thread.title)}</p><div class="chat-log" aria-label="메시지 기록">${thread.messages.length ? thread.messages.map(message => `<div class="bubble ${message.from === account ? 'mine' : ''}" aria-label="${safe(person(message.from).name)}의 메시지">${safe(message.text)}</div>`).join('') : '<p class="muted">첫 메시지를 보내 대화를 시작하세요.</p>'}</div><form class="composer" data-form="message"><input name="text" aria-label="메시지" placeholder="메시지를 입력하세요" maxlength="1000" required><button class="primary">전송</button></form></section></div>`;
}
function options(values, selected) {
  return values.map(value => `<option ${value === selected ? 'selected' : ''}>${safe(value)}</option>`).join('');
}
function profilePage() {
  const profile = registering ? {} : me();
  return heading(registering ? '새 프로필 등록' : '내 프로필','프로필을 저장하면 새 기준으로 추천을 계산해요.')+`<div class="subhead panel"><form class="form" data-form="profile"><div class="form-grid">
  <label>활동명<input name="name" required maxlength="30" value="${safe(profile?.name)}"></label>
  <label>내 역할<select name="role">${options(roles,profile.role)}</select></label>
  <fieldset class="role-picker"><legend>필요한 협업 역할</legend><div class="row">${roles.map(role => `<label><input type="checkbox" name="need" value="${role}" ${needs(profile).includes(role) ? 'checked' : ''}> ${role}</label>`).join('')}</div></fieldset>
  <label>선호 장르<input name="genres" required maxlength="100" value="${safe(profile?.genres)}"><small>장르를 쉼표로 구분해 주세요.</small></label>
  <label>작업 방식<select name="style">${options(['비대면','대면','혼합'],profile.style)}</select></label>
  <label>협업 목적<select name="goal">${options(['싱글 발매','EP 제작','공연','포트폴리오','연습·교류'],profile.goal)}</select></label>
  <label>대표 작업물<input name="work" required maxlength="100" value="${safe(profile?.work)}"></label>
  <label>작업물 링크 <small>선택 입력</small><input name="url" type="url" maxlength="500" value="${safe(profile.url)}" placeholder="https://"></label></div>
  <label>협업 조건<textarea name="terms" required maxlength="500" placeholder="일정, 피드백 방식, 크레딧, 수익 배분 등">${safe(profile?.terms)}</textarea></label><button class="primary">프로필 저장</button></form></div>`+(registering ? '' : `<h2 class="subhead">받은 후기 · ${temperature(profile)}°C</h2>${reviewsHtml(profile.id)}`);
}
function reviewsHtml(id) {
  const reviews = reviewList(id);
  return reviews.length ? `<div class="stack">${reviews.map(review => `<div class="panel"><strong aria-label="별점 ${review.stars}점">${'★'.repeat(review.stars)}${'☆'.repeat(5-review.stars)}</strong> <span class="muted">${safe(person(review.from).name)}${review.issue ? ' · '+safe(review.issue) : ''}</span><p class="detail">${safe(review.text)}</p></div>`).join('')}</div>` : empty('등록된 후기가 없어요.');
}
function render() {
  document.querySelector('#side').innerHTML = `<div class="brand"><i>${icon('note')}</i><div>루프<span>룸</span></div></div><div><div class="side-label">워크스페이스</div><nav aria-label="주 메뉴">${Object.entries(pages).map(([id,[glyph,label]]) => `<button data-act="nav" data-id="${id}" class="${page === id ? 'on' : ''}" ${page === id ? 'aria-current="page"' : ''}>${icon(glyph)}${label}</button>`).join('')}</nav></div><div class="side-bottom"><button class="account" data-act="accounts">${avatar(me())}<span><strong>${safe(me().name)}</strong><small>데모 계정</small></span>${icon('swap')}</button></div>`;
  document.querySelector('#top').innerHTML = `<strong>${pages[page][1]}</strong><div class="top-actions">${button('계정 전환','accounts')}${button('프로필 편집','nav','profile',true)}</div>`;
  content.innerHTML = ({discover,projects:projectPage,messages:messagePage,profile:profilePage})[page]();
  const log = content.querySelector('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}
function modal(title, body) {
  dialog.innerHTML = `<header class="dialog-head"><h2>${title}</h2><button type="button" data-act="close" aria-label="닫기">×</button></header>${body}`;
  if (!dialog.open) dialog.showModal();
}
function showDetails(profile) {
  const result = match(profile);
  const url = link(profile.url);
  const existing = hasProject(profile.id);
  modal(safe(profile?.name), `<div class="row">${avatar(profile)}<strong>${safe(profile.role)} · 적합도 ${result.score}%</strong><span class="temperature">매너 온도 ${temperature(profile)}°C</span></div><dl class="detail"><dt>포트폴리오</dt><dd>${safe(profile?.work)}${url ? ` · <a href="${safe(url)}" target="_blank" rel="noopener noreferrer">작업물 열기</a>` : ` · ${button('데모 듣기','audio',profile.id)}`}</dd><dt>협업 조건</dt><dd>${safe(profile?.terms)}</dd><dt>추천 근거</dt><dd>${result.reasons.map((text,index) => `${safe(text)} (${result.parts[index]}/${[35,30,15,20][index]})`).join('<br>')}</dd></dl>${existing ? button('협업 확인','project',existing.id,true) : button('협업 제안','request',profile.id,true)}<h3 class="subhead">받은 후기</h3>${reviewsHtml(profile.id)}`);
}
function navigate(destination) {
  dialog.close();
  page = destination;
  render();
  window.scrollTo(0,0);
}
function setStatus(id, action) {
  const item = itemFor(id);
  if (!item) return;
  if (action === 'done' && item.status === 'active' && !item.done.includes(account)) {
    item.done.push(account);
    if (item.done.length === 2) item.status = 'done';
  } else if (item.status === 'pending') {
    if (action === 'cancel' && item.from === account) item.status = 'cancelled';
    if (action === 'decline' && item.to === account) item.status = 'declined';
    if (action === 'accept' && item.to === account) item.status = 'active';
  }
  save();
  render();
  announce({active:action === 'accept' ? '협업이 시작됐어요. 메시지를 보낼 수 있어요.' : '완료 확인을 남겼어요. 상대도 확인하면 협업이 완료돼요.',done:'협업이 완료됐어요.',declined:'협업 요청을 거절했어요.',cancelled:'협업 요청을 철회했어요.'}[item.status] || '상태를 확인해 주세요.');
}
let audioContext;
let playing = [];
function playSample(id) {
  if (playing.length) {
    playing.forEach(node => { try { node.stop(); } catch {} });
    playing = [];
    document.querySelector('[data-act="audio"]').textContent = '데모 듣기';
    return;
  }
  audioContext ||= new AudioContext();
  audioContext.resume();
  const offset = data.profiles.findIndex(profile => profile.id === id);
  const now = audioContext.currentTime;
  const nodes = [0,7,10,14,12,10,7,3,0,7,12,15,14,10,7,0].map((step,index) => {
    const start = now + index * .27;
    const synth = audioContext.createOscillator();
    const gain = audioContext.createGain();
    synth.type = offset % 2 ? 'triangle' : 'sine';
    synth.frequency.value = 220 * Math.pow(2,(step + offset)/12);
    gain.gain.setValueAtTime(.001,start);
    gain.gain.exponentialRampToValueAtTime(.14,start+.025);
    gain.gain.exponentialRampToValueAtTime(.001,start+.4);
    synth.connect(gain).connect(audioContext.destination);
    synth.start(start);
    synth.stop(start+.42);
    return synth;
  });
  playing = nodes;
  document.querySelector('[data-act="audio"]').textContent = '재생 중지';
  nodes.at(-1).onended = () => {
    if (playing !== nodes) return;
    playing = [];
    const control = document.querySelector('[data-act="audio"]');
    if (control) control.textContent = '데모 듣기';
  };
}
dialog.addEventListener('close', () => {
  playing.forEach(node => { try { node.stop(); } catch {} });
  playing = [];
});
document.addEventListener('click', event => {
  const control = event.target.closest('[data-act]');
  if (!control) return;
  const {act,id} = control.dataset;
  if (act === 'register') {
    registering = true;
    return navigate('profile');
  }
  if (act === 'nav') {
    registering = false;
    return navigate(id);
  }
  if (act === 'close') return dialog.close();
  if (act === 'filter') {
    filter = id;
    render();
    content.querySelector('.filters .on').focus();
  }
  if (act === 'details') showDetails(person(id));
  if (act === 'audio') playSample(id);
  if (act === 'accounts') modal('데모 계정 전환', `<p class="muted">상대방 계정으로 전환해 제안을 수락하거나 답장을 보내볼 수 있어요.</p><div class="stack subhead">${data.profiles.map(profile => `<button class="account" data-act="switch" data-id="${profile.id}">${avatar(profile)}<span>${safe(profile?.name)} · ${safe(profile.role)}</span>${profile.id === account ? '<small>현재 계정</small>' : ''}</button>`).join('')}${button('새 프로필 등록','register','',true)}</div>`);
  if (act === 'switch') {
    account = id;
    filter = '전체';
    activeChat = '';
    navigate('discover');
    announce(`${me().name} 계정으로 전환했어요.`);
  }
  if (act === 'criteria') modal('내 매칭 기준', `<dl class="detail"><dt>음악 취향 · 35점</dt><dd>${safe(me().genres)}</dd><dt>필요 역할 · 30점</dt><dd>${safe(me().role)} ↔ ${safe(needs(me()).join(' · '))}</dd><dt>작업 방식 · 15점</dt><dd>${safe(me().style)}</dd><dt>협업 목적 · 20점</dt><dd>${safe(me().goal)}</dd></dl><p class="detail">추천 적합도는 프로필 항목을 비교하는 규칙으로 계산해요.</p><div class="subhead">${button('프로필 편집','nav','profile',true)}</div>`);
  if (act === 'request') {
    const profile = person(id);
    if (hasProject(id)) return navigate('projects');
    modal(`${safe(profile?.name)}님에게 협업 제안`, `<form class="form" data-form="request" data-id="${id}"><label>협업 제목<input name="title" required maxlength="70" placeholder="예. R&B 싱글 보컬 피처링"></label><label>제안 내용<textarea name="note" required maxlength="400" placeholder="어떤 음악을 함께 만들고 싶은지 알려주세요."></textarea></label><small>상대가 수락하면 메시지를 주고받을 수 있어요.</small><button class="primary">제안 보내기</button></form>`);
  }
  if (act === 'project') {
    const item = itemFor(id);
    if (item?.status === 'active') {
      activeChat = id;
      return navigate('messages');
    }
    navigate('projects');
  }
  if (act === 'message') {
    activeChat = id;
    navigate('messages');
  }
  if (['accept','decline','cancel','done'].includes(act)) setStatus(id,act);
  if (act === 'end') {
    const item = itemFor(id);
    if (item?.status !== 'active') return;
    modal('협업 중도 종료', `<p class="detail">노쇼나 연락 두절 등으로 작업이 중단됐다면 여기서 협업을 종료할 수 있어요. 종료 후에는 두 참여자 모두 후기를 남길 수 있어요.</p><form class="form subhead" data-form="end" data-id="${id}"><button class="primary">이 협업 종료하기</button></form>`);
  }
  if (act === 'review') {
    const item = itemFor(id);
    if (item?.status !== 'done' || data.reviews.some(review => review.project === id && review.from === account)) return;
    modal(`${safe(partner(item).name)}님 협업 후기`, `<form class="form" data-form="review" data-id="${id}"><label>별점<select name="stars">${options(['5','4','3','2','1'],'5')}</select></label><label>협업 중 문제<select name="issue"><option value="">해당 없음</option><option>노쇼</option><option>연락 두절</option><option>일정 미준수</option></select></label><label>후기<textarea name="text" maxlength="400" required placeholder="협업에서 직접 경험한 내용을 적어주세요."></textarea></label><small>별점과 문제 유형은 상대의 공개 매너 온도에 반영돼요.</small><button class="primary">후기 등록</button></form>`);
  }
});
document.addEventListener('submit', event => {
  const form = event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  const entries = [...new FormData(form)];
  const fields = Object.fromEntries(entries.map(([key,value]) => [key,value.trim()]));
  if ([...form.querySelectorAll('[required]')].some(input => !fields[input.name])) return announce('필수 항목을 입력해 주세요.');
  const id = form.dataset.id;
  if (form.dataset.form === 'profile') {
    fields.need = roles.filter(role => entries.some(([key,value]) => key === 'need' && value === role));
    if (!fields.need.length) {
      form.querySelector('[name="need"]').focus();
      return announce('필요한 협업 역할을 하나 이상 선택해 주세요.');
    }
    if (fields.url && !link(fields.url)) return announce('작업물은 http 또는 https 링크를 입력해 주세요.');
    if (!tags(fields.genres).length) return announce('선호 장르를 하나 이상 입력해 주세요.');
    if (registering) {
      const newProfile = {id:crypto.randomUUID(),handle:fields.name,temperature:36.5,colors:['#a77cf1','#5637ab'],...fields};
      data.profiles.push(newProfile);
      account = newProfile.id;
      filter = '전체';
      activeChat = '';
      registering = false;
    } else {
      Object.assign(me(),fields,{handle:fields.name});
    }
    save();
    navigate('discover');
    announce('프로필을 저장하고 추천을 갱신했어요.');
  }
  if (form.dataset.form === 'request' && id !== account && person(id) && !hasProject(id)) {
    data.projects.unshift({id:crypto.randomUUID(),from:account,to:id,...fields,status:'pending',done:[],messages:[]});
    save();
    navigate('projects');
    announce('협업 제안을 보냈어요.');
  }
  if (form.dataset.form === 'message') {
    const item = itemFor(activeChat);
    if (!item || !['active','done'].includes(item.status)) return;
    item.messages.push({from:account,text:fields.text});
    save();
    render();
    content.querySelector('.composer input').focus();
  }
  if (form.dataset.form === 'end') {
    const item = itemFor(id);
    if (item?.status !== 'active') return;
    item.status = 'done';
    item.endedEarly = true;
    save();
    navigate('projects');
    announce('협업을 종료했어요. 후기를 남길 수 있어요.');
  }
  if (form.dataset.form === 'review') {
    const item = itemFor(id);
    if (item?.status !== 'done' || data.reviews.some(review => review.project === id && review.from === account)) return;
    data.reviews.unshift({project:id,from:account,to:partner(item).id,...fields,stars:Number(fields.stars)});
    save();
    dialog.close();
    render();
    announce('후기를 등록했어요.');
  }
});
render();
if (!saved && location.protocol !== 'file:') {
  fetch('/state').then(response => response.ok ? response.json() : null).then(stored => {
    if (!stored || localStorage.getItem(storageKey)) return;
    data = stored;
    localStorage.setItem(storageKey, JSON.stringify(data));
    render();
  }).catch(() => {});
}
