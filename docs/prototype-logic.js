// Lógica original do protótipo do Claude Design (Private_Motors.html), extraída para referência.
// NÃO é código de produção: serve de fonte de verdade para portar libs/finance, libs/search-parser e libs/assistant e para os testes.
// Contém: CARS (seed de 20 viaturas), parse() da pesquisa, pay()/fin() do financiamento, recommend() do assistente,
// sugestões do estado vazio, textos do site, paleta, escala tipográfica e tailwind.config (Tailwind 3) do design.


let IM = Math.pow(1.15, 1 / 12) - 1;
const CARS = [
  { id: 1, brand: 'Peugeot', model: '3008', version: '1.5 BlueHDi GT Line EAT8', year: 2021, km: 48200, fuel: 'Diesel', gear: 'Automática', body: 'SUV', price: 26900, cv: 130, days: 2, war: 18 },
  { id: 2, brand: 'BMW', model: 'Série 3 Touring', version: '320d M Sport', year: 2020, km: 71500, fuel: 'Diesel', gear: 'Automática', body: 'Carrinha', price: 31500, cv: 190, days: 5, drop: true },
  { id: 3, brand: 'Renault', model: 'Clio', version: '1.0 TCe Intens', year: 2022, km: 22300, fuel: 'Gasolina', gear: 'Manual', body: 'Utilitário', price: 15900, cv: 90, days: 1, war: 24 },
  { id: 4, brand: 'Mercedes-Benz', model: 'Classe A', version: 'A 180 d AMG Line', year: 2021, km: 39800, fuel: 'Diesel', gear: 'Automática', body: 'Berlina', price: 29900, cv: 116, days: 6 },
  { id: 5, brand: 'Volkswagen', model: 'Golf', version: '1.5 eTSI Life DSG', year: 2022, km: 31000, fuel: 'Híbrido', gear: 'Automática', body: 'Berlina', price: 25400, cv: 150, days: 9, war: 18 },
  { id: 6, brand: 'Tesla', model: 'Model 3', version: 'Long Range AWD', year: 2021, km: 58000, fuel: 'Elétrico', gear: 'Automática', body: 'Berlina', price: 32900, cv: 440, days: 3, drop: true },
  { id: 7, brand: 'Toyota', model: 'C-HR', version: '1.8 Hybrid Exclusive', year: 2020, km: 64000, fuel: 'Híbrido', gear: 'Automática', body: 'SUV', price: 22900, cv: 122, days: 12 },
  { id: 8, brand: 'Skoda', model: 'Octavia Break', version: '2.0 TDI Style', year: 2019, km: 92000, fuel: 'Diesel', gear: 'Manual', body: 'Carrinha', price: 16900, cv: 150, days: 20 },
  { id: 9, brand: 'Audi', model: 'Q3 Sportback', version: '35 TDI S line S tronic', year: 2022, km: 28500, fuel: 'Diesel', gear: 'Automática', body: 'SUV', price: 38900, cv: 150, days: 4, war: 24 },
  { id: 10, brand: 'Volvo', model: 'XC40', version: 'T5 Recharge Inscription', year: 2021, km: 42000, fuel: 'Plug-in', gear: 'Automática', body: 'SUV', price: 33900, cv: 262, days: 7 },
  { id: 11, brand: 'Kia', model: 'Sportage', version: '1.6 CRDi Drive', year: 2019, km: 87000, fuel: 'Diesel', gear: 'Manual', body: 'SUV', price: 19400, cv: 136, days: 15, drop: true },
  { id: 12, brand: 'Mini', model: 'Cooper', version: '1.5 Classic', year: 2020, km: 45000, fuel: 'Gasolina', gear: 'Manual', body: 'Utilitário', price: 18900, cv: 136, days: 10 },
  { id: 13, brand: 'Porsche', model: 'Macan', version: '2.0 PDK', year: 2019, km: 76000, fuel: 'Gasolina', gear: 'Automática', body: 'SUV', price: 52900, cv: 245, days: 6, war: 12 },
  { id: 14, brand: 'Dacia', model: 'Duster', version: '1.5 Blue dCi Prestige', year: 2022, km: 35000, fuel: 'Diesel', gear: 'Manual', body: 'SUV', price: 18400, cv: 115, days: 8 },
  { id: 15, brand: 'BMW', model: 'Série 4 Coupé', version: '420i M Sport', year: 2021, km: 33000, fuel: 'Gasolina', gear: 'Automática', body: 'Coupé', price: 41900, cv: 184, days: 11, war: 18 },
  { id: 16, brand: 'Hyundai', model: 'Tucson', version: '1.6 T-GDi PHEV Vanguard', year: 2022, km: 26000, fuel: 'Plug-in', gear: 'Automática', body: 'SUV', price: 34500, cv: 265, days: 14 },
  { id: 17, brand: 'Fiat', model: '500', version: 'Elétrico Icon', year: 2022, km: 18000, fuel: 'Elétrico', gear: 'Automática', body: 'Utilitário', price: 21900, cv: 118, days: 18 },
  { id: 18, brand: 'Citroën', model: 'C3', version: '1.2 PureTech Shine', year: 2019, km: 68000, fuel: 'Gasolina', gear: 'Manual', body: 'Utilitário', price: 10900, cv: 83, days: 2 },
  { id: 19, brand: 'Dacia', model: 'Sandero Stepway', version: '1.0 TCe Comfort', year: 2020, km: 51000, fuel: 'Gasolina', gear: 'Manual', body: 'Utilitário', price: 11900, cv: 90, days: 13 },
  { id: 20, brand: 'Renault', model: 'Captur', version: '1.5 dCi Exclusive', year: 2020, km: 58000, fuel: 'Diesel', gear: 'Manual', body: 'SUV', price: 17500, cv: 115, days: 16 }
];
const FUELS = ['Gasolina', 'Diesel', 'Híbrido', 'Plug-in', 'Elétrico'];
const BODIES = ['SUV', 'Carrinha', 'Berlina', 'Utilitário', 'Coupé'];
const TERMS = [24, 36, 48, 60, 72, 84, 96];
const BRANDS = Array.from(new Set(CARS.map(c => c.brand))).sort();
const nf0 = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const grp = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const eur = v => grp(v) + '\u00a0€';
const eur2 = v => { const [i, d] = v.toFixed(2).split('.'); return grp(+i) + ',' + d + '\u00a0€'; };
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const pay = (price, e, n) => { const P = Math.max(0, price - e); return P * IM / (1 - Math.pow(1 + IM, -n)); };
const fin = (price, e, n) => { const P = Math.max(0, price - e); const m = pay(price, e, n); return { P, m, mtic: m * n, juros: m * n - P }; };
const EMPTY = () => ({ brand: '', model: '', priceMax: null, monthlyMax: null, yearMin: null, kmMax: null, fuel: [], gear: '', body: [] });
const uniq = a => Array.from(new Set(a));

function parse(q) {
  const f = EMPTY();
  if (!q || !q.trim()) return f;
  let s = ' ' + norm(q) + ' ';
  const num = (a, k) => { let v = parseFloat(a.replace(/[\s.]/g, '').replace(',', '.')); if (k) v *= 1000; return v; };
  let m = s.match(/(\d[\d.\s]*\d|\d)\s*(k|mil)?\s*km/);
  if (m) { f.kmMax = num(m[1], m[2]); s = s.replace(m[0], ' '); }
  m = s.match(/(\d+)\s*(?:€|eur|euros)?\s*(?:\/|por|ao|a)\s*mes/);
  if (m) { f.monthlyMax = +m[1]; s = s.replace(m[0], ' '); }
  m = s.match(/(?:desde|depois de|a partir de|posterior a)\s*(20[0-2]\d)/) || s.match(/\b(20[12]\d)\b/);
  if (m) { f.yearMin = +m[1]; s = s.replace(m[0], ' '); }
  m = s.match(/(?:ate|max|maximo|menos de|abaixo de)\s*(\d[\d.\s]*\d|\d)\s*(k|mil)?/);
  if (m) { const v = num(m[1], m[2]); if (v < 1500) f.monthlyMax = f.monthlyMax || v; else f.priceMax = v; }
  if (/diesel|gasoleo/.test(s)) f.fuel.push('Diesel');
  if (/plug|phev/.test(s)) f.fuel.push('Plug-in'); else if (/hibrid/.test(s)) f.fuel.push('Híbrido');
  if (/gasolina/.test(s)) f.fuel.push('Gasolina');
  if (/eletric|\bev\b/.test(s)) f.fuel.push('Elétrico');
  if (/suv|jipe|crossover/.test(s)) f.body.push('SUV');
  if (/carrinha|station|touring|break|familiar/.test(s)) f.body.push('Carrinha');
  if (/berlina|sedan|hatch/.test(s)) f.body.push('Berlina');
  if (/utilitario|citadino|pequeno/.test(s)) f.body.push('Utilitário');
  if (/coupe|desportivo/.test(s)) f.body.push('Coupé');
  if (/automatic|\bauto\b|dsg/.test(s)) f.gear = 'Automática'; else if (/manual/.test(s)) f.gear = 'Manual';
  for (const b of BRANDS) { const nb = norm(b); if (s.includes(nb) || (nb === 'mercedes-benz' && s.includes('mercedes')) || (nb === 'volkswagen' && /\bvw\b/.test(s))) f.brand = b; }
  for (const c of CARS) { const w = norm(c.model).split(' ')[0]; if (w.length > 2 && !['serie', 'classe', 'model'].includes(w) && new RegExp('\\b' + w + '\\b').test(s)) { f.brand = c.brand; f.model = c.model; } }
  return f;
}
function merge(F, P) {
  return { brand: P.brand || F.brand, model: P.model || F.model, priceMax: P.priceMax ?? F.priceMax, monthlyMax: P.monthlyMax ?? F.monthlyMax, yearMin: P.yearMin ?? F.yearMin, kmMax: P.kmMax ?? F.kmMax, fuel: uniq([...F.fuel, ...P.fuel]), gear: P.gear || F.gear, body: uniq([...F.body, ...P.body]) };
}
function match(c, F, fp, bm) {
  if (F.brand && c.brand !== F.brand) return false;
  if (F.model && c.model !== F.model) return false;
  if (F.priceMax && c.price > F.priceMax) return false;
  if (F.yearMin && c.year < F.yearMin) return false;
  if (F.kmMax && c.km > F.kmMax) return false;
  if (F.fuel.length && !F.fuel.includes(c.fuel)) return false;
  if (F.gear && c.gear !== F.gear) return false;
  if (F.body.length && !F.body.includes(c.body)) return false;
  const m = pay(c.price, fp.e, fp.n);
  if (bm) return m <= bm * 1.15;
  if (F.monthlyMax && m > F.monthlyMax) return false;
  return true;
}
function chipList(F) {
  const out = [];
  if (F.brand) out.push({ k: 'brand', label: F.brand });
  if (F.model) out.push({ k: 'model', label: F.model });
  if (F.priceMax) out.push({ k: 'priceMax', label: 'Até ' + eur(F.priceMax) });
  if (F.monthlyMax) out.push({ k: 'monthlyMax', label: 'Até ' + eur(F.monthlyMax) + '/mês' });
  if (F.yearMin) out.push({ k: 'yearMin', label: 'Desde ' + F.yearMin });
  if (F.kmMax) out.push({ k: 'kmMax', label: 'Até ' + grp(F.kmMax) + ' km' });
  F.fuel.forEach(v => out.push({ k: 'fuel', v, label: v }));
  if (F.gear) out.push({ k: 'gear', label: F.gear });
  F.body.forEach(v => out.push({ k: 'body', v, label: v }));
  return out;
}
function removeChip(F, ch) {
  const G = { ...F, fuel: [...F.fuel], body: [...F.body] };
  if (ch.k === 'fuel' || ch.k === 'body') G[ch.k] = G[ch.k].filter(x => x !== ch.v);
  else if (ch.k === 'brand') { G.brand = ''; G.model = ''; }
  else if (ch.k === 'model' || ch.k === 'gear') G[ch.k] = '';
  else G[ch.k] = null;
  return G;
}
const PILL = { whiteSpace: 'nowrap', minHeight: 40, padding: '0 14px', border: 0, borderRadius: 999, font: "500 13px 'Geist'", cursor: 'pointer', transition: 'background .15s, box-shadow .15s, color .15s' };
const pillSt = on => ({ ...PILL, background: on ? '#24060a' : '#18181c', color: on ? '#ffc2c4' : '#b4b4bc', boxShadow: on ? 'inset 0 0 0 1px #d0161f' : 'inset 0 0 0 1px rgba(237,237,240,.1)' });
const tickSt = on => ({ flex: 1, minWidth: 0, minHeight: 44, padding: 0, border: 0, borderRadius: 8, font: "500 12.5px 'Geist'", fontVariantNumeric: 'tabular-nums', cursor: 'pointer', transition: 'background .15s, color .15s', background: on ? '#d0161f' : '#212126', color: on ? '#fff' : '#b4b4bc' });
const tabSt = on => ({ whiteSpace: 'nowrap', minHeight: 30, padding: '0 12px', border: 0, borderRadius: 6, font: "500 12px 'Geist'", cursor: 'pointer', background: on ? '#24060a' : 'transparent', color: on ? '#ffc2c4' : '#8e8e98', display: 'flex', alignItems: 'center', gap: 6 });
const BADGE = { whiteSpace: 'nowrap', minHeight: 24, display: 'inline-flex', alignItems: 'center', padding: '0 9px', borderRadius: 6, font: "600 11px 'Geist'", letterSpacing: '.02em', backdropFilter: 'blur(6px)' };
const B_NEW = { ...BADGE, background: 'rgba(36,6,10,.85)', color: '#ffc2c4', boxShadow: 'inset 0 0 0 1px #8c0f15' };
const B_DROP = { ...BADGE, background: 'rgba(46,36,16,.9)', color: '#f5c56b' };
const B_WAR = { ...BADGE, background: 'rgba(9,9,11,.7)', color: '#d6d6db', boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.14)' };
const DIFF = { whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, padding: '0 12px', borderRadius: 10, font: "500 13px 'Geist'", fontVariantNumeric: 'tabular-nums' };
const STEPS = [
  { q: 'Olá! Sou o assistente da Private Motors. Com quatro perguntas rápidas sugiro-lhe viaturas do nosso stock.', chips: ['Ajudem-me a escolher', 'Quero um orçamento'] },
  { q: 'Para que vai usar o carro no dia a dia?', key: 'uso', chips: ['Cidade', 'Autoestrada', 'Um pouco de tudo'] },
  { q: 'Quem costuma viajar consigo?', key: 'fam', chips: ['Só eu ou a dois', 'Família com crianças', 'Família e muita bagagem'] },
  { q: 'Que prestação mensal lhe é confortável?', key: 'orc', chips: ['Até 300 €', '300 a 450 €', 'Mais de 450 €'] },
  { q: 'E o combustível?', key: 'fuel', chips: ['Gasolina', 'Diesel', 'Híbrido ou plug-in', 'Elétrico', 'Tanto faz'] }
];

class Component extends DCLogic {
  state = {
    tab: 'home', device: 'desktop', mode: 'car', q: '', F: EMPTY(), budget: { m: 350, e: 0, n: 96 }, sort: 'recent', panel: false,
    cf: {}, open: null, favs: [], limit: 9, navOpen: false,
    asst: { open: false, step: 0, ans: {}, typing: false, msgs: [{ from: 'bot', text: STEPS[0].q }], chips: STEPS[0].chips, form: { name: '', phone: '', err: '' } },
    vaOpen: true, vb: { flip: false, e: 0, n: 96 }, vc: { e: 0, n: 96 }, vd: { e: 0, n: 72 }, ve: { e: 0, n: 72 }
  };
  setF(patch) { this.setState(s => ({ F: { ...s.F, ...patch }, limit: 9 })); }
  toggleArr(k, v) { this.setState(s => { const a = s.F[k]; return { F: { ...s.F, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] }, limit: 9 }; }); }
  setCF(id, p) { this.setState(s => ({ cf: { ...s.cf, [id]: { ...(s.cf[id] || {}), ...p } } })); }
  commit() { this.setState(s => ({ F: merge(s.F, parse(s.q)), q: '' })); }
  setAsst(p) { this.setState(s => ({ asst: { ...s.asst, ...p } })); }
  pushBot(text, extra, chips, delay) {
    this.setAsst({ typing: true, chips: [] });
    clearTimeout(this._t);
    this._t = setTimeout(() => this.setState(s => ({ asst: { ...s.asst, typing: false, chips, msgs: [...s.asst.msgs, { from: 'bot', text, ...(extra || {}) }] } })), delay || 850);
  }
  componentDidMount() { this._r = () => this.setState({ vw: window.innerWidth }); window.addEventListener('resize', this._r); this._r(); }
  componentWillUnmount() { clearTimeout(this._t); window.removeEventListener('resize', this._r); }
  recommend(ans) {
    const max = ans.orc === 'Até 300 €' ? 300 : ans.orc === '300 a 450 €' ? 450 : Infinity;
    const scored = CARS.map(c => {
      const m = pay(c.price, 0, 96); let sc = 0;
      if (ans.fuel === 'Diesel' && c.fuel === 'Diesel') sc += 3;
      if (ans.fuel === 'Gasolina' && c.fuel === 'Gasolina') sc += 3;
      if (ans.fuel === 'Elétrico' && c.fuel === 'Elétrico') sc += 3;
      if (ans.fuel === 'Híbrido ou plug-in' && (c.fuel === 'Híbrido' || c.fuel === 'Plug-in')) sc += 3;
      if (ans.fam && ans.fam !== 'Só eu ou a dois' && (c.body === 'SUV' || c.body === 'Carrinha')) sc += 2;
      if (ans.fam === 'Família e muita bagagem' && c.body === 'Carrinha') sc += 1;
      if (ans.uso === 'Cidade' && (c.body === 'Utilitário' || c.fuel === 'Elétrico' || c.fuel === 'Híbrido')) sc += 2;
      if (ans.uso === 'Autoestrada' && (c.fuel === 'Diesel' || c.body === 'Carrinha' || c.body === 'Berlina')) sc += 1;
      return { c, m, sc, fits: m <= max };
    });
    let pool = scored.filter(x => x.fits);
    const exact = pool.length > 0;
    if (!exact) pool = scored.slice().sort((a, b) => a.m - b.m).slice(0, 6);
    pool.sort((a, b) => b.sc - a.sc || a.m - b.m);
    return { ids: pool.slice(0, 3).map(x => x.c.id), exact };
  }
  asstPick(label) {
    const a = this.state.asst;
    const msgs = [...a.msgs, { from: 'me', text: label }];
    if (label === 'Recomeçar') return this.restart();
    if (label === 'Quero um orçamento' || label === 'Pedir orçamento personalizado') {
      this.setAsst({ msgs });
      return this.pushBot('Combinado. Deixe o seu nome e contacto e um comercial prepara uma proposta à medida.', { form: true }, []);
    }
    const cur = STEPS[a.step];
    const ans = cur && cur.key ? { ...a.ans, [cur.key]: label } : a.ans;
    const step = a.step + 1;
    this.setAsst({ msgs, ans, step });
    if (step < STEPS.length) return this.pushBot(STEPS[step].q, null, STEPS[step].chips, 650);
    const r = this.recommend(ans);
    this.pushBot(r.exact ? 'Com base nas suas respostas, estas três encaixam bem:' : 'Nenhuma cabe à justa nesse valor. Estas são as mais próximas:', { cars: r.ids }, ['Pedir orçamento personalizado', 'Recomeçar'], 1300);
  }
  restart() { clearTimeout(this._t); this.setAsst({ step: 0, ans: {}, typing: false, msgs: [{ from: 'bot', text: STEPS[0].q }], chips: STEPS[0].chips, form: { name: '', phone: '', err: '' } }); }
  submitForm() {
    const f = this.state.asst.form;
    const ph = (f.phone || '').replace(/\s/g, '');
    let err = '';
    if ((f.name || '').trim().length < 2) err = 'Indique o seu nome.';
    else if (!/^(\+?351)?(9[1236]\d{7}|2\d{8})$/.test(ph)) err = 'Número inválido. Use 9 dígitos, por exemplo 912 345 678.';
    if (err) return this.setAsst({ form: { ...f, err } });
    this.setState(s => ({ asst: { ...s.asst, form: { ...f, err: '' }, msgs: s.asst.msgs.map(m => m.form ? { from: 'me', text: f.name.trim() + ' · ' + f.phone } : m) } }));
    this.pushBot('Pedido enviado, ' + f.name.trim().split(' ')[0] + '. Um comercial liga-lhe hoje, até às 19h, para o ' + f.phone + '. Recebe também a proposta por SMS.', null, ['Recomeçar'], 1100);
  }
  cardVals(c, base, bm, ovr) {
    const s = this.state; const o = ovr || s.cf[c.id] || {};
    const e = o.e ?? base.e, n = o.n ?? base.n;
    const f = fin(c.price, e, n);
    const eMax = Math.floor(c.price * 0.5 / 500) * 500;
    const cap = f.mtic ? f.P / f.mtic * 100 : 100;
    const badges = [];
    if (c.days <= 3) badges.push({ t: 'Novo', st: B_NEW });
    if (c.drop) badges.push({ t: 'Baixa de preço', st: B_DROP });
    if (c.war) badges.push({ t: 'Garantia ' + c.war + ' meses', st: B_WAR });
    let diff = null;
    if (bm) { const d = bm - f.m; diff = d >= 0 ? { t: 'Sobram ' + eur(d) + ' por mês', icon: 'ph-fill ph-check-circle', st: { ...DIFF, background: '#0d2418', color: '#7fe3ad' } } : { t: 'Faltam ' + eur(-d) + ' por mês', icon: 'ph-fill ph-warning-circle', st: { ...DIFF, background: '#2e2410', color: '#f5c56b' } }; }
    const open = s.open === c.id;
    const fav = s.favs.includes(c.id);
    return {
      ...c, title: c.brand + ' ' + c.model, meta: [c.year, grp(c.km) + ' km', c.fuel, c.gear].join(' · '), meta2: c.year + ' · ' + grp(c.km) + ' km · ' + c.fuel,
      priceF: eur(c.price), mF: eur(f.m), n, e, eF: eur(e), eMax, eMaxF: eur(eMax), badges, hasDiff: !!diff, diff: diff || {}, open,
      favIcon: fav ? 'ph-fill ph-heart' : 'ph ph-heart', favSt: { color: fav ? '#ff5c62' : '#ededf0' },
      onFav: () => this.setState(st => ({ favs: st.favs.includes(c.id) ? st.favs.filter(x => x !== c.id) : [...st.favs, c.id] })),
      onToggle: () => this.setState({ open: open ? null : c.id }),
      onE: ev => this.setCF(c.id, { e: +ev.target.value, n }),
      terms: TERMS.map(t => ({ n: t, st: tickSt(t === n), on: () => this.setCF(c.id, { e, n: t }) })),
      capW: { width: cap + '%', background: '#ededf0', transition: 'width .3s ease' }, jurW: { width: (100 - cap) + '%', background: '#d0161f', transition: 'width .3s ease' },
      capF: eur(f.P), jurF: eur(f.juros), mticF: eur(f.mtic),
      toggleLabel: open ? 'Fechar simulação' : 'Ajustar prestação', sumLine: (e ? eur(e) + ' · ' : 'Sem entrada · ') + n + 'm', chevron: open ? 'ph ph-caret-up' : 'ph ph-caret-down',
      photo: 'Fotografia · ' + c.brand + ' ' + c.model
    };
  }
  renderVals() {
    const s = this.state, p = this.props;
    const taeg = (p.taeg ?? 15) / 100; IM = Math.pow(1 + taeg, 1 / 12) - 1;
    const defN = +(p.defaultTerm ?? 96);
    const taegF = nf2.format(taeg * 100).replace(/,00$/, '') + '%';
    const mobile = s.device === 'mobile', budget = s.mode === 'budget';
    const P = parse(s.q), E = merge(s.F, P);
    const fp = budget ? { e: s.budget.e, n: s.budget.n } : { e: 0, n: defN };
    const bm = budget ? s.budget.m : null;
    const count = (F, fp2, bm2) => CARS.filter(c => match(c, F, fp2 || fp, bm2 === undefined ? bm : bm2)).length;
    let list = CARS.filter(c => match(c, E, fp, bm));
    const mOf = c => pay(c.price, fp.e, fp.n);
    const sorters = { recent: (a, b) => a.days - b.days, price: (a, b) => a.price - b.price, monthly: (a, b) => mOf(a) - mOf(b), km: (a, b) => a.km - b.km };
    list.sort(sorters[s.sort]);
    if (budget) list.sort((a, b) => (mOf(a) <= bm ? 0 : 1) - (mOf(b) <= bm ? 0 : 1));
    const fitCount = budget ? list.filter(c => mOf(c) <= bm).length : 0;
    const shown = list.slice(0, s.limit);
    const committed = chipList(s.F);
    const committedLabels = committed.map(c => c.label);
    const parsedChips = chipList(P).filter(c => !committedLabels.includes(c.label));
    const chips = committed.map(ch => ({ label: ch.label, on: () => this.setState(st => ({ F: removeChip(st.F, ch) })) }));
    const allChips = chipList(E);

    let suggestions = [];
    if (!list.length) {
      const cands = allChips.map(ch => ({ label: 'Remover “' + ch.label + '”', n: count(removeChip(E, ch)), on: () => this.setState(st => ({ F: removeChip(merge(st.F, parse(st.q)), ch), q: '' })) }));
      if (bm) {
        [50, 100].forEach(d => cands.push({ label: 'Subir o orçamento para ' + eur(bm + d) + '/mês', n: count(E, fp, bm + d), on: () => this.setState(st => ({ budget: { ...st.budget, m: bm + d } })) }));
        if (fp.n < 96) cands.push({ label: 'Alargar o prazo para 96 meses', n: count(E, { ...fp, n: 96 }, bm), on: () => this.setState(st => ({ budget: { ...st.budget, n: 96 } })) });
      } else if (E.monthlyMax) {
        [50, 100].forEach(d => cands.push({ label: 'Subir a prestação para ' + eur(E.monthlyMax + d) + '/mês', n: count({ ...E, monthlyMax: E.monthlyMax + d }), on: () => this.setState(st => ({ F: { ...merge(st.F, parse(st.q)), monthlyMax: E.monthlyMax + d }, q: '' })) }));
      }
      const seen = {};
      suggestions = cands.filter(c => c.n > 0).sort((a, b) => b.n - a.n).filter(c => (seen[c.n + c.label] ? false : (seen[c.n + c.label] = true))).slice(0, 3).map(c => ({ ...c, countF: c.n + (c.n === 1 ? ' viatura' : ' viaturas') }));
    }

    const base = { e: fp.e, n: fp.n };
    const cars = shown.map(c => this.cardVals(c, base, bm));
    const activeCount = allChips.length;
    const nStr = n => n + (n === 1 ? ' viatura' : ' viaturas');
    const countLabel = budget ? nStr(list.length) + ' para o seu orçamento' : (activeCount ? nStr(list.length) : nStr(list.length) + ' em stock');

    const overlayPos = mobile ? 'absolute' : 'fixed';
    const panelSt = mobile
      ? { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, maxHeight: '84%', overflowY: 'auto', padding: '8px 20px 20px', borderRadius: '24px 24px 0 0', background: '#111114', boxShadow: '0 -20px 60px rgba(0,0,0,.6)', transform: s.panel ? 'translateY(0)' : 'translateY(105%)', transition: 'transform .35s cubic-bezier(.2,.8,.2,1)', visibility: s.panel ? 'visible' : 'hidden' }
      : { display: s.panel ? 'block' : 'none', marginTop: 4, marginBottom: 12, padding: 24, borderRadius: 16, background: '#111114', boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.08)', animation: 'pmUp .22s ease' };

    const a = s.asst;
    const asstSt = {
      position: overlayPos, zIndex: 60, display: 'flex', flexDirection: 'column', background: '#0d0d10', transition: 'transform .35s cubic-bezier(.2,.8,.2,1)',
      ...(mobile ? { inset: 0, transform: a.open ? 'none' : 'translateY(100%)' } : { top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100%', borderLeft: '1px solid rgba(237,237,240,.08)', boxShadow: '-30px 0 80px rgba(0,0,0,.6)', transform: a.open ? 'none' : 'translateX(105%)' })
    };
    const fabSt = { position: overlayPos, right: 20, bottom: 20, zIndex: 55, minHeight: 56, minWidth: 56, padding: mobile ? 0 : '0 20px 0 16px', border: 0, borderRadius: 999, background: '#d0161f', color: '#fff', font: "600 15px 'Geist'", cursor: 'pointer', display: a.open ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 32px -8px rgba(208,22,31,.6), 0 0 0 1px rgba(255,92,98,.3)' };

    const msgs = a.msgs.map(m => ({ bot: m.from === 'bot', me: m.from === 'me', text: m.text, hasCars: !!m.cars, cars: (m.cars || []).map(id => this.cardVals(CARS.find(c => c.id === id), { e: 0, n: 96 }, null)), isForm: !!m.form }));
    const prefsLine = Object.values(a.ans).join(' · ') || 'sem preferências indicadas';
    const phoneBad = !!a.form.err && a.form.err.startsWith('Número');

    const pills = (opts, cur, set) => opts.map(o => ({ label: o.label, st: pillSt(cur === o.v), on: () => set(o.v) }));
    const car0 = CARS[0];
    const va = this.cardVals(car0, { e: 0, n: defN }, null, s.cf.va || {});
    va.open = s.vaOpen; va.onToggle = () => this.setState(st => ({ vaOpen: !st.vaOpen }));
    va.toggleLabel = s.vaOpen ? 'Fechar simulação' : 'Ajustar prestação'; va.chevron = s.vaOpen ? 'ph ph-caret-up' : 'ph ph-caret-down';
    va.onE = ev => this.setState(st => ({ cf: { ...st.cf, va: { ...(st.cf.va || {}), e: +ev.target.value } } }));
    va.terms = TERMS.map(t => ({ n: t, st: tickSt(t === va.n), on: () => this.setState(st => ({ cf: { ...st.cf, va: { ...(st.cf.va || {}), n: t } } })) }));
    const fb = fin(car0.price, s.vb.e, s.vb.n);
    const setV = (k, patch) => this.setState(st => ({ [k]: { ...st[k], ...patch } }));
    const fc = fin(car0.price, s.vc.e, s.vc.n);
    const fd = fin(car0.price, s.vd.e, s.vd.n);
    const fe = fin(car0.price, s.ve.e, s.ve.n);
    const ePresets = [0, 2500, 5000, 7500, 10000];
    const maxM = pay(car0.price, s.ve.e, 24);
    const pctW = (x, t) => (t ? x / t * 100 : 0) + '%';
    const totalD = s.vd.e + fd.mtic;
    const example = (c, e, n, f) => 'Para ' + c.brand + ' ' + c.model + ' com PVP de ' + eur(c.price) + ', entrada de ' + eur(e) + ' e montante financiado de ' + eur(f.P) + ': ' + n + ' prestações mensais de ' + eur2(f.m) + ', TAN ' + nf2.format(IM * 1200) + '% (taxa fixa), TAEG ' + taegF + ', MTIC ' + eur2(f.mtic) + '. Sem comissões de abertura ou processamento incluídas; valores a confirmar com a instituição financeira parceira.';

    const tabs = [['concept', 'Conceito'], ['home', 'Homepage'], ['var', 'Card e simulador'], ['tokens', 'Tokens e componentes']].map(([k, label]) => ({ label, st: tabSt(s.tab === k), on: () => this.setState({ tab: k }) }));
    const devices = [['desktop', 'Desktop', 'ph ph-desktop'], ['mobile', 'Mobile', 'ph ph-device-mobile']].map(([k, label, icon]) => ({ label, icon, st: tabSt(s.device === k), on: () => this.setState({ device: k, panel: false, navOpen: false }) }));
    const modeSt = on => ({ whiteSpace: 'nowrap', minHeight: 48, padding: '0 18px', border: 0, borderRadius: 12, font: "600 14.5px 'Geist'", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s', background: on ? '#ededf0' : 'rgba(237,237,240,.05)', color: on ? '#09090b' : '#b4b4bc', boxShadow: on ? 'none' : 'inset 0 0 0 1px rgba(237,237,240,.1)' });

    return {
      tabs, devices, isHome: s.tab === 'home', isConcept: s.tab === 'concept', isVar: s.tab === 'var', isTokens: s.tab === 'tokens',
      goHome: () => this.setState({ tab: 'home' }), goVar: () => this.setState({ tab: 'var' }),
      mobile, desktop: !mobile, wideNav: !mobile && (s.vw || 1400) >= 1120, narrowNav: mobile || (s.vw || 1400) < 1120, showPhone: (s.vw || 1400) >= 1320, navOpenMobile: (mobile || (s.vw || 1400) < 1120) && s.navOpen, navIcon: s.navOpen ? 'ph ph-x' : 'ph ph-list', toggleNav: () => this.setState(st => ({ navOpen: !st.navOpen })),
      stageSt: mobile ? { width: 390, height: 844, margin: '32px auto 48px', position: 'relative', overflow: 'hidden', borderRadius: 44, background: '#09090b', boxShadow: '0 0 0 10px #18181c, 0 0 0 11px #2e2e35, 0 40px 100px rgba(0,0,0,.7)' } : { position: 'relative' },
      scrollSt: mobile ? { height: '100%', overflowY: 'auto', overflowX: 'hidden' } : {},
      navLinks: ['Viaturas', 'Quanto posso pagar?', 'Retoma', 'Sobre nós', 'Contactos'].map((label, i) => ({ label, st: { whiteSpace: 'nowrap', minHeight: 44, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: 8, color: i === 0 ? '#ededf0' : '#8e8e98', textDecoration: 'none', fontSize: 14, fontWeight: 500 } })),
      stockLine: CARS.length + ' viaturas em stock · crédito com resposta no próprio dia',
      modes: [['car', 'Procurar por carro', 'ph ph-car-profile'], ['budget', 'Quanto posso pagar por mês', 'ph ph-wallet']].map(([k, label, icon]) => ({ label, icon, st: modeSt(s.mode === k), on: () => this.setState({ mode: k, limit: 9 }) })),
      carMode: !budget, budgetMode: budget,
      q: s.q, hasQ: !!s.q, onQ: e => this.setState({ q: e.target.value, limit: 9 }), onQKey: e => { if (e.key === 'Enter') this.commit(); }, commit: () => this.commit(), clearQ: () => this.setState({ q: '' }),
      hasParsed: parsedChips.length > 0, noParsed: parsedChips.length === 0, parsedChips,
      quick: [
        { label: 'SUV', on: s.F.body.includes('SUV'), fn: () => this.toggleArr('body', 'SUV') },
        { label: 'Automático', on: s.F.gear === 'Automática', fn: () => this.setF({ gear: s.F.gear === 'Automática' ? '' : 'Automática' }) },
        { label: 'Elétrico', on: s.F.fuel.includes('Elétrico'), fn: () => this.toggleArr('fuel', 'Elétrico') },
        { label: 'Até 20 000 €', on: s.F.priceMax === 20000, fn: () => this.setF({ priceMax: s.F.priceMax === 20000 ? null : 20000 }) },
        { label: 'Até 300 €/mês', on: s.F.monthlyMax === 300, fn: () => this.setF({ monthlyMax: s.F.monthlyMax === 300 ? null : 300 }) },
        { label: 'Menos de 50 000 km', on: s.F.kmMax === 50000, fn: () => this.setF({ kmMax: s.F.kmMax === 50000 ? null : 50000 }) }
      ].map(x => ({ label: x.label, st: pillSt(x.on), on: x.fn })),
      examples: ['SUV diesel até 250€/mês', 'BMW automático desde 2020', 'carrinha familiar até 25 mil euros', 'elétrico com menos de 60 000 km'].map(label => ({ label, on: () => this.setState({ q: label }) })),
      budget: s.budget, bMF: eur(s.budget.m), bEF: s.budget.e ? eur(s.budget.e) : 'Sem entrada',
      onBM: e => this.setState(st => ({ budget: { ...st.budget, m: +e.target.value } })), onBE: e => this.setState(st => ({ budget: { ...st.budget, e: +e.target.value } })),
      bTerms: TERMS.map(t => ({ n: t, st: tickSt(t === s.budget.n), on: () => this.setState(st => ({ budget: { ...st.budget, n: t } })) })),
      fitCount, nearCount: list.length - fitCount, taegF,
      countLabel, countShort: nStr(list.length), sort: s.sort, onSort: e => this.setState({ sort: e.target.value }),
      sorts: [['recent', 'Mais recentes'], ['price', 'Preço'], ['monthly', 'Prestação'], ['km', 'Quilómetros']].map(([v, label]) => ({ v, label })),
      togglePanel: () => this.setState(st => ({ panel: !st.panel })), closePanel: () => this.setState({ panel: false }),
      filterBtnSt: { minHeight: 44, padding: '0 14px', border: 0, borderRadius: 10, font: "500 14px 'Geist'", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: s.panel ? '#24060a' : '#18181c', color: s.panel ? '#ffc2c4' : '#ededf0', boxShadow: s.panel ? 'inset 0 0 0 1px #d0161f' : 'inset 0 0 0 1px rgba(237,237,240,.1)' },
      hasActive: activeCount > 0, activeCount, hasChips: chips.length > 0, chips,
      clearAll: () => this.setState({ F: EMPTY(), q: '', limit: 9 }),
      sheetBackdrop: mobile && s.panel, panelSt,
      F: s.F, noBrand: !s.F.brand,
      brandOpts: [{ v: '', label: 'Todas as marcas' }, ...BRANDS.map(b => ({ v: b, label: b }))],
      modelOpts: [{ v: '', label: s.F.brand ? 'Todos os modelos' : 'Escolha a marca primeiro' }, ...uniq(CARS.filter(c => c.brand === s.F.brand).map(c => c.model)).map(m => ({ v: m, label: m }))],
      onBrand: e => this.setF({ brand: e.target.value, model: '' }), onModel: e => this.setF({ model: e.target.value }),
      priceMaxV: s.F.priceMax || 60000, priceMaxF: s.F.priceMax ? eur(s.F.priceMax) : 'Sem limite', onPriceMax: e => { const v = +e.target.value; this.setF({ priceMax: v >= 60000 ? null : v }); },
      monthlyMaxV: s.F.monthlyMax || 900, monthlyMaxF: s.F.monthlyMax ? eur(s.F.monthlyMax) + '/mês' : 'Sem limite', onMonthlyMax: e => { const v = +e.target.value; this.setF({ monthlyMax: v >= 900 ? null : v }); },
      yearPills: pills([{ v: null, label: 'Qualquer' }, { v: 2019, label: '2019' }, { v: 2020, label: '2020' }, { v: 2021, label: '2021' }, { v: 2022, label: '2022' }], s.F.yearMin, v => this.setF({ yearMin: v })),
      kmPills: pills([{ v: null, label: 'Qualquer' }, { v: 30000, label: '< 30 000' }, { v: 60000, label: '< 60 000' }, { v: 100000, label: '< 100 000' }], s.F.kmMax, v => this.setF({ kmMax: v })),
      fuelPills: FUELS.map(v => ({ label: v, st: pillSt(s.F.fuel.includes(v)), on: () => this.toggleArr('fuel', v) })),
      gearPills: pills([{ v: '', label: 'Todas' }, { v: 'Manual', label: 'Manual' }, { v: 'Automática', label: 'Automática' }], s.F.gear, v => this.setF({ gear: v })),
      bodyPills: BODIES.map(v => ({ label: v, st: pillSt(s.F.body.includes(v)), on: () => this.toggleArr('body', v) })),
      hasResults: list.length > 0, noResults: list.length === 0, cars, suggestions,
      hasMore: list.length > s.limit, moreLabel: 'Mostrar mais ' + Math.min(9, list.length - s.limit) + ' de ' + (list.length - s.limit), showMore: () => this.setState(st => ({ limit: st.limit + 9 })),
      featured: [CARS[14], CARS[12]].map(c => this.cardVals(c, { e: 0, n: defN }, null, {})),
      perks: [
        { icon: 'ph ph-shield-check', title: 'Garantia até 24 meses', body: 'Todas as viaturas saem com garantia escrita e revisão feita antes da entrega.' },
        { icon: 'ph ph-calculator', title: 'Crédito no próprio dia', body: 'A prestação que vê é a que simula. Resposta da financeira em poucas horas.' },
        { icon: 'ph ph-arrows-clockwise', title: 'Retoma avaliada em 24h', body: 'Envie fotografias do seu carro atual e receba uma proposta firme.' },
        { icon: 'ph ph-seal-check', title: '120 pontos de inspeção', body: 'Histórico verificado, quilómetros certificados e relatório entregue ao cliente.' }
      ],
      testimonials: [
        { q: 'Fiz a simulação no site ao domingo, na segunda de manhã já tinha o crédito aprovado. A prestação foi exatamente a que tinha visto.', name: 'Marta Figueiredo', ini: 'MF', car: 'Comprou um Toyota C-HR' },
        { q: 'Deram-me pela retoma mais do que esperava e explicaram tudo sem pressas. Nota-se que o carro foi bem preparado.', name: 'Rui Pacheco', ini: 'RP', car: 'Comprou um BMW Série 3 Touring' },
        { q: 'Escrevi “carrinha diesel até 300 por mês” e apareceram três opções. Fui ver duas e fiquei com a primeira.', name: 'Sofia Almeida', ini: 'SA', car: 'Comprou um Skoda Octavia Break' }
      ],
      openAsst: () => this.setAsst({ open: true }), closeAsst: () => this.setAsst({ open: false }), restartAsst: () => this.restart(),
      asstSt, fabSt, msgs, typing: a.typing, asstChips: (a.chips || []).map(label => ({ label, on: () => this.asstPick(label) })),
      form: a.form, hasFormErr: !!a.form.err, prefsLine,
      onFName: e => this.setAsst({ form: { ...a.form, name: e.target.value } }), onFPhone: e => this.setAsst({ form: { ...a.form, phone: e.target.value } }),
      submitForm: () => this.submitForm(),
      phoneSt: { minHeight: 44, padding: '0 12px', borderRadius: 10, border: 0, background: '#18181c', color: '#ededf0', font: "400 15px 'Geist'", boxShadow: phoneBad ? 'inset 0 0 0 1px #ff6b6b' : 'inset 0 0 0 1px rgba(237,237,240,.12)' },

      va, termLabels: TERMS,
      vb: { flipSt: { position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform .6s cubic-bezier(.2,.8,.2,1)', transform: s.vb.flip ? 'rotateY(180deg)' : 'none' }, flip: () => setV('vb', { flip: !s.vb.flip }), label: s.vb.e || s.vb.n !== 96 ? 'a sua prestação' : 'desde', mF: eur(fb.m), e: s.vb.e, eF: eur(s.vb.e), n: s.vb.n, onE: ev => setV('vb', { e: +ev.target.value }), onN: ev => setV('vb', { n: +ev.target.value }), PF: eur(fb.P), mticF: eur(fb.mtic) },
      vc: { mF: eur(fc.m), n: s.vc.n, onN: ev => setV('vc', { n: +ev.target.value }), ePills: [0, 2500, 5000, 7500].map(v => ({ label: v ? eur(v) : '0 €', st: { ...pillSt(s.vc.e === v), minHeight: 36, padding: '0 10px' }, on: () => setV('vc', { e: v }) })) },
      vd: {
        mF: eur2(fd.m), n: s.vd.n, e: s.vd.e, eF: eur(s.vd.e), onE: ev => setV('vd', { e: +ev.target.value }), onN: ev => setV('vd', { n: +ev.target.value }),
        entW: { width: pctW(s.vd.e, totalD), background: '#6b6b75', transition: 'width .3s' }, capW: { width: pctW(fd.P, totalD), background: '#ededf0', transition: 'width .3s' }, jurW: { width: pctW(fd.juros, totalD), background: '#d0161f', transition: 'width .3s' },
        rows: [{ k: 'Montante financiado', v: eur2(fd.P) }, { k: 'TAN (fixa)', v: nf2.format(IM * 1200) + '%' }, { k: 'TAEG', v: taegF }, { k: 'MTIC', v: eur2(fd.mtic) }],
        example: example(car0, s.vd.e, s.vd.n, fd)
      },
      ve: {
        mF: eur(fe.m), n: s.ve.n, PF: eur(fe.P), jurF: eur(fe.juros), mticF: eur(fe.mtic),
        cols: TERMS.map(t => { const m = pay(car0.price, s.ve.e, t); const on = t === s.ve.n; return { n: t, mShort: Math.round(m), aria: t + ' meses, ' + Math.round(m) + ' euros por mês', on: () => setV('ve', { n: t }), barSt: { height: (maxM ? m / maxM * 130 : 0) + 'px', borderRadius: '6px 6px 2px 2px', background: on ? '#d0161f' : '#2e2e35', boxShadow: on ? '0 0 24px rgba(208,22,31,.5)' : 'none', transition: 'height .35s cubic-bezier(.2,.8,.2,1), background .2s' }, valSt: { font: "600 11.5px 'Geist'", textAlign: 'center', color: on ? '#ededf0' : '#6b6b75', fontVariantNumeric: 'tabular-nums' }, lblSt: { font: "500 12px 'Geist'", textAlign: 'center', color: on ? '#ff5c62' : '#8e8e98' } }; }),
        ePills: ePresets.map(v => ({ label: v ? eur(v) : 'Sem entrada', st: { ...pillSt(s.ve.e === v), minHeight: 40 }, on: () => setV('ve', { e: v }) }))
      },
      legal: 'Simulação meramente indicativa e sem valor contratual. O crédito está sujeito a análise e aprovação pela instituição financeira parceira. A Private Motors atua como intermediário de crédito a título acessório.',

      principles: [
        { n: '01', title: 'Uma barra, duas formas de procurar', body: '“Procurar por carro” aceita frases como “SUV diesel até 250€/mês” e converte-as em filtros visíveis. “Quanto posso pagar por mês” troca o preço pela prestação: o cliente define mensalidade, entrada e prazo.', why: 'quem compra a crédito pensa em euros por mês, não no preço total. Os dois modos respondem às duas cabeças.' },
        { n: '02', title: 'A homepage é a página de resultados', body: 'Os resultados aparecem logo abaixo da pesquisa e atualizam a cada tecla ou filtro. Não há recarregamentos nem uma página de listagem separada à partida.', why: 'menos um passo, e o cliente vê o efeito de cada decisão no momento em que a toma.' },
        { n: '03', title: 'Filtros só quando são pedidos', body: 'Oito filtros num painel que abre por baixo da barra. Cada filtro ativo vira um chip removível, com “Limpar tudo”. Em mobile, o mesmo painel é um bottom sheet ao alcance do polegar.', why: 'a sidebar cheia de filtros é o que torna os sites de stand iguais. Aqui a grelha tem o ecrã todo.' },
        { n: '04', title: 'A prestação em todo o lado', body: 'Cada card mostra “desde X €/mês” e pode ser ajustado ali mesmo: entrada, prazo e uma barra que separa capital de juros. No modo orçamento, o card diz quanto sobra ou falta.', why: 'o financiamento é o argumento de venda. Tem de estar à vista e ser honesto sobre o custo.' },
        { n: '05', title: 'Nunca um beco sem saída', body: 'Sem resultados, o site calcula que filtro aliviar e quantas viaturas cada alteração devolve. Há sempre um botão para passar ao assistente.', why: 'um ecrã vazio é um cliente perdido; uma sugestão com número é um clique.' },
        { n: '06', title: 'Um assistente que pergunta pouco', body: 'Quatro perguntas em chips (uso, família, orçamento, combustível), três sugestões do stock em mini-cards e um pedido de orçamento com dois campos.', why: 'para quem não sabe o que quer, uma conversa curta é mais fácil do que um formulário.' }
      ],
      assumptions: [
        'Financiamento: sem entrada e TAEG de 15% por defeito (como indicado). A TAN fixa deriva da TAEG (' + nf2.format(IM * 1200) + '%), sem comissões. Ajustável no painel Tweaks.',
        'Prazo padrão do “desde X €/mês”: ' + defN + ' meses. Entrada máxima de 50% do preço.',
        'No modo orçamento mostro também viaturas até 15% acima, marcadas com “faltam X €”.',
        'Paleta própria da Private Motors. O Nocturne serviu de referência de rigor: escala de cinzas, cantos de 8–16px, glow vermelho em vez de manchas de cor.',
        'Stock fictício de 20 viaturas e fotografias por colocar. Morada e telefone são provisórios.',
        'O vermelho de erro (#FF6B6B) aparece sempre acompanhado de ícone e texto, para não se confundir com o vermelho da marca.',
        'Nesta ronda: homepage, card e simulador. Página de viatura, “Quanto posso pagar?”, retoma, comparador e contactos ficam para a seguinte.'
      ],

      palettes: [
        { name: 'Vermelho', note: 'red-500 é a marca e o fundo dos CTA; red-400 é o vermelho de texto e links', items: [['red-50', '#FFF1F1', ''], ['red-100', '#FFE0E1', ''], ['red-200', '#FFC2C4', 'Texto sobre tint'], ['red-300', '#FF9599', 'Hover de link'], ['red-400', '#FF5C62', 'Texto/ícones · 6,6:1'], ['red-500', '#D0161F', 'Marca · CTA (texto branco 5,3:1)'], ['red-600', '#B0121A', 'CTA hover'], ['red-700', '#8C0F15', 'CTA active · bordas'], ['red-800', '#660C11', ''], ['red-900', '#3F090C', 'Tint forte'], ['red-950', '#24060A', 'Tint de seleção']].map(([name, hex, use]) => ({ name, hex, use, st: { height: 64, borderRadius: 10, background: hex, boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.08)' } })) },
        { name: 'Ink (neutros)', note: 'preto profundo levemente frio; nunca #000', items: [['ink-950', '#09090B', 'Fundo'], ['ink-900', '#111114', 'Superfície 1 (cards)'], ['ink-850', '#18181C', 'Superfície 2 (inputs)'], ['ink-800', '#212126', 'Superfície 3'], ['ink-700', '#2E2E35', 'Bordas fortes'], ['ink-600', '#45454E', 'Desativado'], ['ink-500', '#6B6B75', 'Texto terciário · 3,9:1'], ['ink-400', '#8E8E98', 'Texto secundário · 6,1:1'], ['ink-300', '#B4B4BC', 'Texto de apoio · 9,4:1'], ['ink-200', '#D6D6DB', ''], ['ink-100', '#EDEDF0', 'Texto principal · 16,8:1']].map(([name, hex, use]) => ({ name, hex, use, st: { height: 64, borderRadius: 10, background: hex, boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.1)' } })) },
        { name: 'Estado', note: 'cor de texto sobre fundo tint da mesma família', items: [['success', '#4CD38A', 'Sobra · aprovado'], ['success-bg', '#0D2418', ''], ['warning', '#F5B53D', 'Falta · atenção'], ['warning-bg', '#2E2410', ''], ['error', '#FF6B6B', 'Erro (com ícone)'], ['error-bg', '#2A0F10', ''], ['info', '#6FA8FF', 'Informação'], ['info-bg', '#0F1B2E', '']].map(([name, hex, use]) => ({ name, hex, use, st: { height: 64, borderRadius: 10, background: hex, boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.1)' } })) }
      ],
      typeScale: [
        ['display-2xl', 'Archivo 125% · 700 · 40→84 / 0.96 · −3.5%', 'Uma frase chega.', { fontFamily: 'Archivo', fontStretch: '125%', fontWeight: 700, fontSize: 64, lineHeight: .96, letterSpacing: '-0.035em' }],
        ['display-xl', 'Archivo 125% · 700 · 32→48 / 1.0', 'Em destaque', { fontFamily: 'Archivo', fontStretch: '125%', fontWeight: 700, fontSize: 44, lineHeight: 1, letterSpacing: '-0.03em' }],
        ['price-xl', 'Archivo 118% · 700 · 44→56 · tabular', '312,48 €', { fontFamily: 'Archivo', fontStretch: '118%', fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' }],
        ['h1', 'Archivo 112% · 600 · 28→36 / 1.1', 'Peugeot 3008 GT Line', { fontFamily: 'Archivo', fontStretch: '112%', fontWeight: 600, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.02em' }],
        ['h2', 'Archivo 112% · 600 · 22→28 / 1.15', 'Especificações', { fontFamily: 'Archivo', fontStretch: '112%', fontWeight: 600, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em' }],
        ['h3', 'Archivo 112% · 600 · 18 / 1.2', 'BMW Série 3 Touring', { fontFamily: 'Archivo', fontStretch: '112%', fontWeight: 600, fontSize: 18, lineHeight: 1.2 }],
        ['body-lg', 'Geist · 400 · 17→19 / 1.55', 'Escreva o que procura ou comece pela prestação.', { fontFamily: 'Geist', fontSize: 18, lineHeight: 1.55, color: '#b4b4bc' }],
        ['body', 'Geist · 400 · 15 / 1.6', 'Todas as viaturas saem com garantia escrita e revisão feita.', { fontFamily: 'Geist', fontSize: 15, lineHeight: 1.6 }],
        ['label', 'Geist · 500 · 13–14 / 1.4', 'Ajustar prestação', { fontFamily: 'Geist', fontWeight: 500, fontSize: 14 }],
        ['caption', 'Geist · 400 · 12 / 1.5', '2021 · 48 200 km · Diesel · Automática', { fontFamily: 'Geist', fontSize: 12, color: '#8e8e98' }],
        ['overline', 'Geist · 600 · 11 · +14% · maiúsculas', 'Conceito', { fontFamily: 'Geist', fontWeight: 600, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ff5c62' }]
      ].map(([token, spec, sample, st]) => ({ token, spec, sample, st: { ...st, color: st.color || '#ededf0', minWidth: 0, overflowWrap: 'anywhere' } })),
      spaces: [[1, 4], [2, 8], [3, 12], [4, 16], [5, 20], [6, 24], [8, 32], [12, 48], [16, 64], [24, 96]].map(([k, px]) => ({ k: 'space-' + k, px: px + 'px', st: { width: px * 2, height: 10, borderRadius: 3, background: '#d0161f' } })),
      radii: [['sm', 6], ['md', 10], ['lg', 16], ['xl', 20], ['full', 999]].map(([k, px]) => ({ k: 'rounded-' + k, px: px === 999 ? '9999px' : px + 'px', st: { width: 64, height: 64, background: '#18181c', boxShadow: 'inset 0 0 0 1px #45454e', borderRadius: px } })),
      shadows: [['shadow-card', 'Card em repouso: aresta de 1px', 'inset 0 0 0 1px rgba(237,237,240,.07)'], ['shadow-glow', 'Hover do card e CTA destacados', 'inset 0 0 0 1px rgba(255,92,98,.35), 0 24px 48px -24px rgba(208,22,31,.6)'], ['shadow-overlay', 'Bottom sheet, painel do assistente', '0 -20px 60px rgba(0,0,0,.6), inset 0 0 0 1px rgba(237,237,240,.08)']].map(([k, use, sh]) => ({ k, use, st: { width: 140, height: 90, borderRadius: 14, background: '#111114', boxShadow: sh } })),
      stateRows: [
        { name: 'Primário', items: [['Default', '#d0161f', '', ''], ['Hover', '#b0121a', '', ''], ['Active', '#8c0f15', '', ''], ['Focus', '#d0161f', '', 'focus'], ['Disabled', '#d0161f', '', 'dis'], ['Loading', '#d0161f', 'ph ph-circle-notch', '']].map(([state, bg, icon, x]) => ({ state, label: state === 'Loading' ? 'A enviar' : 'Pedir proposta', icon, iconSt: { display: icon ? 'inline-block' : 'none', animation: 'none', fontSize: 16 }, st: { minHeight: 44, padding: '0 18px', borderRadius: 10, background: bg, color: '#fff', font: "600 14px 'Geist'", display: 'inline-flex', alignItems: 'center', gap: 8, opacity: x === 'dis' ? .4 : 1, outline: x === 'focus' ? '2px solid #ff5c62' : 'none', outlineOffset: 2 } })) },
        { name: 'Secundário', items: [['Default', 'transparent'], ['Hover', '#18181c'], ['Active', '#212126'], ['Focus', 'transparent'], ['Disabled', 'transparent']].map(([state, bg]) => ({ state, label: 'Test drive', icon: '', iconSt: { display: 'none' }, st: { minHeight: 44, padding: '0 18px', borderRadius: 10, background: bg, color: '#ededf0', font: "500 14px 'Geist'", display: 'inline-flex', alignItems: 'center', boxShadow: 'inset 0 0 0 1px rgba(237,237,240,.18)', opacity: state === 'Disabled' ? .4 : 1, outline: state === 'Focus' ? '2px solid #ff5c62' : 'none', outlineOffset: 2 } })) },
        { name: 'Ghost', items: [['Default', 'transparent'], ['Hover', '#1a0709'], ['Active', '#24060a'], ['Focus', 'transparent'], ['Disabled', 'transparent']].map(([state, bg]) => ({ state, label: 'Limpar tudo', icon: '', iconSt: { display: 'none' }, st: { minHeight: 44, padding: '0 14px', borderRadius: 10, background: bg, color: '#ff5c62', font: "500 14px 'Geist'", display: 'inline-flex', alignItems: 'center', opacity: state === 'Disabled' ? .4 : 1, outline: state === 'Focus' ? '2px solid #ff5c62' : 'none', outlineOffset: 2 } })) },
        { name: 'Chip de filtro', items: [['Inativo', false], ['Hover', 'h'], ['Ativo', true], ['Focus', 'f']].map(([state, on]) => ({ state, label: 'Diesel', icon: '', iconSt: { display: 'none' }, st: { ...pillSt(on === true), display: 'inline-flex', alignItems: 'center', background: on === 'h' ? '#212126' : pillSt(on === true).background, outline: on === 'f' ? '2px solid #ff5c62' : 'none', outlineOffset: 2 } })) },
        { name: 'Input', items: [['Default', 'rgba(237,237,240,.12)', '#6b6b75', 'O seu nome'], ['Focus', '#ff5c62', '#ededf0', 'Marta F|'], ['Erro', '#ff6b6b', '#ededf0', '91234'], ['Disabled', 'rgba(237,237,240,.08)', '#45454e', 'Indisponível']].map(([state, bd, col, label]) => ({ state, label, icon: state === 'Erro' ? 'ph ph-warning-circle' : '', iconSt: { display: state === 'Erro' ? 'inline-block' : 'none', color: '#ff6b6b' }, st: { minHeight: 44, width: 180, padding: '0 12px', borderRadius: 10, background: '#18181c', color: col, font: "400 15px 'Geist'", display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: 'inset 0 0 0 ' + (state === 'Focus' ? 2 : 1) + 'px ' + bd } })) },
        { name: 'Badges', items: [['Nova entrada', B_NEW, 'Novo'], ['Preço revisto', B_DROP, 'Baixa de preço'], ['Garantia', B_WAR, 'Garantia 18 meses'], ['Destaque', { ...BADGE, background: '#d0161f', color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em' }, 'Destaque'], ['Orçamento', { ...DIFF, background: '#0d2418', color: '#7fe3ad' }, 'Sobram 42 €'], ['Orçamento', { ...DIFF, background: '#2e2410', color: '#f5c56b' }, 'Faltam 18 €']].map(([state, st, label]) => ({ state, label, icon: '', iconSt: { display: 'none' }, st })) }
      ],
      skeletons: [1, 2, 3],
      ngComponents: [
        ['<pm-header>', 'Logo, navegação, telefone; menu em gaveta abaixo de lg'],
        ['<pm-smart-search>', 'Input em linguagem natural + chips “Entendi” + atalhos. Emite FilterState'],
        ['<pm-mode-switch>', 'Procurar por carro / Quanto posso pagar'],
        ['<pm-budget-picker>', 'Prestação, entrada e prazo; mostra “cabem / ficam perto”'],
        ['<pm-filter-chip>', 'Chip removível; variantes active, pending (tracejado)'],
        ['<pm-filter-panel>', 'Painel inline em lg+, bottom sheet (CDK Overlay) em mobile'],
        ['<pm-vehicle-card>', 'variant: default | featured | compact; @Input finance'],
        ['<pm-finance-inline>', 'Gaveta do card: slider de entrada, ticks de prazo, barra capital/juros'],
        ['<pm-finance-simulator>', 'Simulador completo da página de viatura (2a ou 2b)'],
        ['<pm-term-ticks>', 'Seletor de prazo 24–96 reutilizado em 3 sítios'],
        ['<pm-empty-state>', 'Recebe sugestões calculadas {label, count, apply()}'],
        ['<pm-assistant>', 'FAB + painel lateral / ecrã inteiro; máquina de estados da conversa'],
        ['<pm-skeleton-card>', 'Placeholder com shimmer enquanto a API responde'],
        ['FinanceService', 'pay(), mtic(), taeg() — uma única fonte para todos os cálculos']
      ].map(([sel, desc]) => ({ sel, desc })),
      twConfig: "import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./src/**/*.{html,ts}'],\n  theme: {\n    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },\n    colors: {\n      transparent: 'transparent',\n      white: '#FFFFFF',\n      red: {\n        50: '#FFF1F1', 100: '#FFE0E1', 200: '#FFC2C4',\n        300: '#FF9599', 400: '#FF5C62', 500: '#D0161F',\n        600: '#B0121A', 700: '#8C0F15', 800: '#660C11',\n        900: '#3F090C', 950: '#24060A',\n      },\n      ink: {\n        100: '#EDEDF0', 200: '#D6D6DB', 300: '#B4B4BC',\n        400: '#8E8E98', 500: '#6B6B75', 600: '#45454E',\n        700: '#2E2E35', 800: '#212126', 850: '#18181C',\n        900: '#111114', 950: '#09090B',\n      },\n      success: { DEFAULT: '#4CD38A', bg: '#0D2418' },\n      warning: { DEFAULT: '#F5B53D', bg: '#2E2410' },\n      error:   { DEFAULT: '#FF6B6B', bg: '#2A0F10' },\n      info:    { DEFAULT: '#6FA8FF', bg: '#0F1B2E' },\n    },\n    fontFamily: {\n      display: ['Archivo', 'system-ui', 'sans-serif'],\n      sans: ['Geist', 'system-ui', 'sans-serif'],\n    },\n    extend: {\n      fontSize: {\n        'display-2xl': ['5.25rem', { lineHeight: '0.96', letterSpacing: '-0.035em' }],\n        'display-xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],\n        'price-xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.035em' }],\n        h1: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],\n        h2: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],\n        h3: ['1.125rem', { lineHeight: '1.2' }],\n      },\n      fontStretch: { wide: '112%', expanded: '125%' },\n      borderRadius: { sm: '6px', md: '10px', lg: '16px', xl: '20px' },\n      boxShadow: {\n        card: 'inset 0 0 0 1px rgb(237 237 240 / .07)',\n        glow: 'inset 0 0 0 1px rgb(255 92 98 / .35), 0 24px 48px -24px rgb(208 22 31 / .6)',\n        overlay: '0 -20px 60px rgb(0 0 0 / .6)',\n      },\n      minHeight: { touch: '44px' },\n      maxWidth: { container: '1280px' },\n    },\n  },\n} satisfies Config;\n\n/* font-stretch: usar style ou plugin — o Tailwind 3 não tem utilitário nativo */"
    };
  }
}
