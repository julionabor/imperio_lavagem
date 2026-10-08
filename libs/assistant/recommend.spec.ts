import { describe, it, expect } from 'vitest';
import { recommend } from './recommend.ts';
import type { RecommendVehicle, AssistantAnswers } from './recommend.ts';

// ── Stock do protótipo (20 viaturas) ─────────────────────────────────────
// Preços convertidos para cêntimos; fuel/bodyType usam os labels do protótipo.

const STOCK: RecommendVehicle[] = [
  { id: '1',  priceCents:  2690000, fuel: 'Diesel',   bodyType: 'SUV' },
  { id: '2',  priceCents:  3150000, fuel: 'Diesel',   bodyType: 'Carrinha' },
  { id: '3',  priceCents:  1590000, fuel: 'Gasolina', bodyType: 'Utilitário' },
  { id: '4',  priceCents:  2990000, fuel: 'Diesel',   bodyType: 'Berlina' },
  { id: '5',  priceCents:  2540000, fuel: 'Híbrido',  bodyType: 'Berlina' },
  { id: '6',  priceCents:  3290000, fuel: 'Elétrico', bodyType: 'Berlina' },
  { id: '7',  priceCents:  2290000, fuel: 'Híbrido',  bodyType: 'SUV' },
  { id: '8',  priceCents:  1690000, fuel: 'Diesel',   bodyType: 'Carrinha' },
  { id: '9',  priceCents:  3890000, fuel: 'Diesel',   bodyType: 'SUV' },
  { id: '10', priceCents:  3390000, fuel: 'Plug-in',  bodyType: 'SUV' },
  { id: '11', priceCents:  1940000, fuel: 'Diesel',   bodyType: 'SUV' },
  { id: '12', priceCents:  1890000, fuel: 'Gasolina', bodyType: 'Utilitário' },
  { id: '13', priceCents:  5290000, fuel: 'Gasolina', bodyType: 'SUV' },
  { id: '14', priceCents:  1840000, fuel: 'Diesel',   bodyType: 'SUV' },
  { id: '15', priceCents:  4190000, fuel: 'Gasolina', bodyType: 'Coupé' },
  { id: '16', priceCents:  3450000, fuel: 'Plug-in',  bodyType: 'SUV' },
  { id: '17', priceCents:  2190000, fuel: 'Elétrico', bodyType: 'Utilitário' },
  { id: '18', priceCents:  1090000, fuel: 'Gasolina', bodyType: 'Utilitário' },
  { id: '19', priceCents:  1190000, fuel: 'Gasolina', bodyType: 'Utilitário' },
  { id: '20', priceCents:  1750000, fuel: 'Diesel',   bodyType: 'SUV' },
];

// ── Testes de estrutura ────────────────────────────────────────────────────

describe('recommend', () => {
  it('devolve no máximo 3 IDs', () => {
    const ans: AssistantAnswers = {
      uso: 'Misto', fam: 'Família pequena', orc: 'Mais de 450 €', fuel: 'Indiferente',
    };
    const result = recommend(STOCK, ans);
    expect(result.ids.length).toBeLessThanOrEqual(3);
  });

  it('IDs retornados pertencem ao stock', () => {
    const ids = STOCK.map((c) => c.id);
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Até 300 €', fuel: 'Elétrico',
    };
    const result = recommend(STOCK, ans);
    result.ids.forEach((id) => expect(ids).toContain(id));
  });

  it('sem viaturas no orçamento → exact=false e ainda devolve sugestões', () => {
    // Orçamento impossível com stock: "Até 300 €" cobre apenas carros muito baratos
    // mas todas as 20 viaturas têm prestações > 300 € a 96 meses com TAEG 15 %
    // Viatura mais barata: #18, 10 900 € → prestação ≈ 160 € → cabe em Até 300 €
    // Ajustar para que nenhuma caiba: usar stock com preço alto
    const expensiveStock: RecommendVehicle[] = [
      { id: 'a', priceCents: 9000000, fuel: 'Gasolina', bodyType: 'SUV' },
      { id: 'b', priceCents: 8000000, fuel: 'Diesel',   bodyType: 'Carrinha' },
    ];
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Até 300 €', fuel: 'Gasolina',
    };
    const result = recommend(expensiveStock, ans);
    expect(result.exact).toBe(false);
    expect(result.ids.length).toBeGreaterThan(0);
  });

  it('com orçamento "Mais de 450 €" e stock normal → exact=true', () => {
    // Várias viaturas do protótipo cabem a prestação ilimitada
    const ans: AssistantAnswers = {
      uso: 'Misto', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Indiferente',
    };
    const result = recommend(STOCK, ans);
    expect(result.exact).toBe(true);
  });

  it('prefere Diesel quando ans.fuel="Diesel"', () => {
    const ans: AssistantAnswers = {
      uso: 'Autoestrada', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Diesel',
    };
    const result = recommend(STOCK, ans);
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    const dieselCount = recommended.filter((c) => c.fuel === 'Diesel').length;
    // Deve haver pelo menos 1 diesel nas recomendações
    expect(dieselCount).toBeGreaterThan(0);
  });

  it('prefere Elétrico quando ans.fuel="Elétrico"', () => {
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Elétrico',
    };
    const result = recommend(STOCK, ans);
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    const evCount = recommended.filter((c) => c.fuel === 'Elétrico').length;
    expect(evCount).toBeGreaterThan(0);
  });

  it('prefere SUV/Carrinha para família com crianças', () => {
    const ans: AssistantAnswers = {
      uso: 'Misto', fam: 'Família com crianças', orc: 'Mais de 450 €', fuel: 'Indiferente',
    };
    const result = recommend(STOCK, ans);
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    const familyCount = recommended.filter(
      (c) => c.bodyType === 'SUV' || c.bodyType === 'Carrinha',
    ).length;
    expect(familyCount).toBeGreaterThan(0);
  });

  it('stock vazio devolve IDs vazios', () => {
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Até 300 €', fuel: 'Gasolina',
    };
    const result = recommend([], ans);
    expect(result.ids).toHaveLength(0);
  });

  it('sem duplicados nos IDs retornados', () => {
    const ans: AssistantAnswers = {
      uso: 'Misto', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Indiferente',
    };
    const result = recommend(STOCK, ans);
    const unique = new Set(result.ids);
    expect(unique.size).toBe(result.ids.length);
  });

  // Verifica correspondência com o comportamento do protótipo para o cenário padrão
  it('orçamento "300 a 450 €" → exact=true para viaturas com prestação ≤ 450 €', () => {
    // Viaturas baratas do protótipo (#18, #19, #3, #8, etc.) cabem em 450 €/mês
    const ans: AssistantAnswers = {
      uso: 'Misto', fam: 'Só eu ou a dois', orc: '300 a 450 €', fuel: 'Indiferente',
    };
    const result = recommend(STOCK, ans);
    expect(result.exact).toBe(true);
    expect(result.ids.length).toBeGreaterThan(0);
  });

  it('"Família e muita bagagem" valoriza Carrinha', () => {
    const ans: AssistantAnswers = {
      uso: 'Autoestrada', fam: 'Família e muita bagagem', orc: 'Mais de 450 €', fuel: 'Diesel',
    };
    const result = recommend(STOCK, ans);
    // Carrinhas a diesel devem pontuar mais alto
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    const carrinhasDiesel = recommended.filter(
      (c) => c.bodyType === 'Carrinha' && c.fuel === 'Diesel',
    );
    expect(carrinhasDiesel.length).toBeGreaterThan(0);
  });

  it('"Cidade" valoriza Híbrido', () => {
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Híbrido ou plug-in',
    };
    const result = recommend(STOCK, ans);
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    const hybrid = recommended.filter(
      (c) => c.fuel === 'Híbrido' || c.fuel === 'Plug-in',
    );
    expect(hybrid.length).toBeGreaterThan(0);
  });

  it('"Autoestrada" valoriza Berlina diesel', () => {
    const ans: AssistantAnswers = {
      uso: 'Autoestrada', fam: 'Só eu ou a dois', orc: 'Mais de 450 €', fuel: 'Diesel',
    };
    const result = recommend(STOCK, ans);
    const recommended = STOCK.filter((c) => result.ids.includes(c.id));
    // Berlinas e Carrinhas diesel devem aparecer nas sugestões
    const highway = recommended.filter(
      (c) => c.fuel === 'Diesel' || c.bodyType === 'Berlina' || c.bodyType === 'Carrinha',
    );
    expect(highway.length).toBeGreaterThan(0);
  });

  it('viatura #18 (Citroën C3, 10 900 €) cabe em "Até 300 €"', () => {
    // prestação ≈ 160 €/mês → deve caber em orçamento Até 300 €
    const ans: AssistantAnswers = {
      uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Até 300 €', fuel: 'Gasolina',
    };
    const result = recommend(STOCK, ans);
    // Deve existir pelo menos 1 resultado (C3 e outras baratas cabem)
    expect(result.ids.length).toBeGreaterThan(0);
    expect(result.exact).toBe(true);
  });
});
