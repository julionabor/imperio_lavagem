import { describe, it, expect } from 'vitest';
import { parse, merge, chipList, removeChip, emptyFilter } from './parser.ts';
import type { FilterState } from '../contracts/vehicle.ts';

// ── Frases de exemplo do protótipo (critério de saída da Fase 1) ───────────

describe('parse — frases de exemplo do design', () => {
  it('"SUV diesel até 250€/mês"', () => {
    const f = parse('SUV diesel até 250€/mês');
    expect(f.body).toContain('SUV');
    expect(f.fuel).toContain('Diesel');
    expect(f.monthlyMax).toBe(25000); // 250 € × 100
    expect(f.priceMax).toBeNull();
    expect(f.brand).toBe('');
    expect(f.gear).toBe('');
  });

  it('"BMW automático desde 2020"', () => {
    const f = parse('BMW automático desde 2020');
    expect(f.brand).toBe('BMW');
    expect(f.gear).toBe('Automática');
    expect(f.yearMin).toBe(2020);
    expect(f.fuel).toHaveLength(0);
    expect(f.body).toHaveLength(0);
  });

  it('"carrinha familiar até 25 mil euros"', () => {
    const f = parse('carrinha familiar até 25 mil euros');
    expect(f.body).toContain('Carrinha');
    expect(f.priceMax).toBe(2500000); // 25 000 € × 100
    expect(f.monthlyMax).toBeNull();
    expect(f.fuel).toHaveLength(0);
  });

  it('"elétrico com menos de 60 000 km"', () => {
    const f = parse('elétrico com menos de 60 000 km');
    expect(f.fuel).toContain('Elétrico');
    expect(f.kmMax).toBe(60000);
    expect(f.priceMax).toBeNull();
    expect(f.monthlyMax).toBeNull();
  });
});

// ── chipList — labels corretos ─────────────────────────────────────────────

describe('chipList', () => {
  it('"SUV diesel até 250€/mês" gera os chips esperados', () => {
    const f = parse('SUV diesel até 250€/mês');
    const chips = chipList(f);
    const labels = chips.map((c) => c.label);
    // label: "Até 250\u00a0€/mês" (espaço normal + nbsp antes de €)
    expect(labels).toContain('Até 250\u00a0€/mês');
    expect(labels).toContain('Diesel');
    expect(labels).toContain('SUV');
  });

  it('"BMW automático desde 2020" gera os chips esperados', () => {
    const chips = chipList(parse('BMW automático desde 2020'));
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('BMW');
    expect(labels).toContain('Automática');
    expect(labels).toContain('Desde 2020');
  });

  it('"carrinha familiar até 25 mil euros" gera chip de preço', () => {
    const chips = chipList(parse('carrinha familiar até 25 mil euros'));
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('Carrinha');
    expect(labels.some((l) => l.startsWith('Até') && l.includes('25'))).toBe(true);
  });

  it('"elétrico com menos de 60 000 km" gera chip de km', () => {
    const chips = chipList(parse('elétrico com menos de 60 000 km'));
    const labels = chips.map((c) => c.label);
    expect(labels).toContain('Elétrico');
    expect(labels.some((l) => l.includes('60') && l.includes('km'))).toBe(true);
  });

  it('FilterState vazio devolve lista vazia', () => {
    expect(chipList(emptyFilter())).toHaveLength(0);
  });
});

// ── merge ──────────────────────────────────────────────────────────────────

describe('merge', () => {
  it('P tem precedência sobre F em campos escalares', () => {
    const F: FilterState = { ...emptyFilter(), brand: 'BMW', yearMin: 2018 };
    const P: FilterState = { ...emptyFilter(), brand: 'Audi', yearMin: 2020 };
    const result = merge(F, P);
    expect(result.brand).toBe('Audi');
    expect(result.yearMin).toBe(2020);
  });

  it('F mantém campos que P não define', () => {
    const F: FilterState = { ...emptyFilter(), brand: 'BMW', priceMax: 3000000 };
    const P: FilterState = { ...emptyFilter(), gear: 'Automática' };
    const result = merge(F, P);
    expect(result.brand).toBe('BMW');
    expect(result.priceMax).toBe(3000000);
    expect(result.gear).toBe('Automática');
  });

  it('arrays fuel/body são unidos sem duplicados', () => {
    const F: FilterState = { ...emptyFilter(), fuel: ['Diesel'], body: ['SUV'] };
    const P: FilterState = { ...emptyFilter(), fuel: ['Diesel', 'Elétrico'], body: ['Carrinha'] };
    const result = merge(F, P);
    expect(result.fuel).toEqual(['Diesel', 'Elétrico']);
    expect(result.body).toEqual(['SUV', 'Carrinha']);
  });
});

// ── removeChip ────────────────────────────────────────────────────────────

describe('removeChip', () => {
  it('remove chip de brand e apaga model', () => {
    const F: FilterState = { ...emptyFilter(), brand: 'BMW', model: 'Série 3 Touring' };
    const result = removeChip(F, { k: 'brand' });
    expect(result.brand).toBe('');
    expect(result.model).toBe('');
  });

  it('remove valor específico de array fuel', () => {
    const F: FilterState = { ...emptyFilter(), fuel: ['Diesel', 'Elétrico'] };
    const result = removeChip(F, { k: 'fuel', v: 'Diesel' });
    expect(result.fuel).toEqual(['Elétrico']);
  });

  it('remove valor específico de array body', () => {
    const F: FilterState = { ...emptyFilter(), body: ['SUV', 'Carrinha'] };
    const result = removeChip(F, { k: 'body', v: 'SUV' });
    expect(result.body).toEqual(['Carrinha']);
  });

  it('remove priceMax', () => {
    const F: FilterState = { ...emptyFilter(), priceMax: 2500000 };
    const result = removeChip(F, { k: 'priceMax' });
    expect(result.priceMax).toBeNull();
  });

  it('remove monthlyMax', () => {
    const F: FilterState = { ...emptyFilter(), monthlyMax: 25000 };
    const result = removeChip(F, { k: 'monthlyMax' });
    expect(result.monthlyMax).toBeNull();
  });

  it('remove gear', () => {
    const F: FilterState = { ...emptyFilter(), gear: 'Automática' };
    const result = removeChip(F, { k: 'gear' });
    expect(result.gear).toBe('');
  });

  it('não muta o FilterState original', () => {
    const F: FilterState = { ...emptyFilter(), fuel: ['Diesel'] };
    removeChip(F, { k: 'fuel', v: 'Diesel' });
    expect(F.fuel).toEqual(['Diesel']);
  });
});

// ── parse — casos adicionais ───────────────────────────────────────────────

describe('parse — casos adicionais', () => {
  it('string vazia devolve FilterState vazio', () => {
    const f = parse('');
    expect(f).toEqual(emptyFilter());
  });

  it('só espaços devolve FilterState vazio', () => {
    const f = parse('   ');
    expect(f).toEqual(emptyFilter());
  });

  it('gasóleo → Diesel', () => {
    const f = parse('gasóleo automático');
    expect(f.fuel).toContain('Diesel');
    expect(f.gear).toBe('Automática');
  });

  it('jipe → SUV', () => {
    const f = parse('jipe até 30 000 euros');
    expect(f.body).toContain('SUV');
    expect(f.priceMax).toBe(3000000);
  });

  it('híbrido → Híbrido (sem plug)', () => {
    const f = parse('híbrido automático');
    expect(f.fuel).toContain('Híbrido');
    expect(f.fuel).not.toContain('Plug-in');
  });

  it('plug-in → Plug-in', () => {
    const f = parse('plug-in SUV');
    expect(f.fuel).toContain('Plug-in');
    expect(f.fuel).not.toContain('Híbrido');
  });

  it('valores até 1499 interpretados como prestação', () => {
    const f = parse('até 400');
    expect(f.monthlyMax).toBe(40000); // 400 € × 100
    expect(f.priceMax).toBeNull();
  });

  it('valores ≥ 1500 interpretados como preço', () => {
    const f = parse('até 20000');
    expect(f.priceMax).toBe(2000000); // 20 000 € × 100
    expect(f.monthlyMax).toBeNull();
  });

  it('VW reconhecido como Volkswagen', () => {
    const f = parse('VW Golf automático');
    expect(f.brand).toBe('Volkswagen');
  });

  it('Mercedes reconhecido como Mercedes-Benz', () => {
    const f = parse('Mercedes diesel');
    expect(f.brand).toBe('Mercedes-Benz');
  });

  it('km com ponto de milhar — "60.000 km"', () => {
    const f = parse('menos de 60.000 km');
    expect(f.kmMax).toBe(60000);
  });

  it('km com sufixo k — "60k km"', () => {
    const f = parse('menos de 60k km');
    expect(f.kmMax).toBe(60000);
  });

  it('"manual" → gear Manual', () => {
    const f = parse('citadino manual gasolina');
    expect(f.gear).toBe('Manual');
    expect(f.body).toContain('Utilitário');
  });

  it('DSG → Automática', () => {
    const f = parse('Golf DSG diesel');
    expect(f.gear).toBe('Automática');
  });

  it('crossover → SUV', () => {
    const f = parse('crossover até 30 mil euros');
    expect(f.body).toContain('SUV');
  });

  it('station → Carrinha', () => {
    const f = parse('station wagon touring 2022');
    expect(f.body).toContain('Carrinha');
    expect(f.yearMin).toBe(2022);
  });

  it('berlina/sedan → Berlina', () => {
    const f = parse('berlina diesel automática');
    expect(f.body).toContain('Berlina');
  });

  it('coupé/desportivo → Coupé', () => {
    const f = parse('desportivo gasolina');
    expect(f.body).toContain('Coupé');
  });

  it('aceita brandNames externos (sem usar fallback)', () => {
    const f = parse('Tesla elétrico', ['Tesla', 'BMW']);
    expect(f.brand).toBe('Tesla');
    expect(f.fuel).toContain('Elétrico');
  });

  it('aceita modelEntries externos', () => {
    const f = parse('Golf automático', ['Volkswagen'], [{ brand: 'Volkswagen', model: 'Golf' }]);
    expect(f.brand).toBe('Volkswagen');
    expect(f.model).toBe('Golf');
  });

  it('palavras-chave excluídas da detecção de modelo: serie, classe, model', () => {
    // "Série 3" tem primeiro token "serie" → excluído; deve detetar a marca BMW mas não modelo por token
    const f = parse('BMW Série 3 diesel desde 2020');
    expect(f.brand).toBe('BMW');
    // O modelo "Série 3 Touring" tem token 'serie' que está excluído → não deve ser detetado por token
    expect(f.model).toBe('');
  });
});
