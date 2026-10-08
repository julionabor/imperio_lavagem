/**
 * Seed da base de dados para desenvolvimento.
 * Executa com: pnpm --filter api seed
 *
 * Cria:
 * - 1 utilizador admin
 * - 1 produto de financiamento TAEG_INPUT 15 % (protótipo)
 * - Marcas e modelos para as 20 viaturas
 * - 20 viaturas do protótipo
 * - Conteúdo base (HomeContent, SiteSettings, AssistantSettings + passos)
 * - Páginas legais de exemplo
 */

import { PrismaClient, Fuel, Transmission, BodyType, VehicleCondition, VehicleStatus } from '@prisma/client';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

// ── Hash de password ───────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

// ── Dados do protótipo ─────────────────────────────────────────────────────

const CARS = [
  { id: 1,  brand: 'Peugeot',       model: 'Série 3008',          version: '1.5 BlueHDi GT Line EAT8',     year: 2021, km: 48200,  fuel: Fuel.DIESEL,   gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 26900, cv: 130, war: 18 },
  { id: 2,  brand: 'BMW',           model: 'Série 3 Touring',     version: '320d M Sport',                 year: 2020, km: 71500,  fuel: Fuel.DIESEL,   gear: Transmission.AUTOMATIC, body: BodyType.ESTATE, priceEur: 31500, cv: 190 },
  { id: 3,  brand: 'Renault',       model: 'Clio',                version: '1.0 TCe Intens',               year: 2022, km: 22300,  fuel: Fuel.PETROL,   gear: Transmission.MANUAL,    body: BodyType.CITY,  priceEur: 15900, cv: 90,  war: 24 },
  { id: 4,  brand: 'Mercedes-Benz', model: 'Classe A',            version: 'A 180 d AMG Line',             year: 2021, km: 39800,  fuel: Fuel.DIESEL,   gear: Transmission.AUTOMATIC, body: BodyType.SEDAN, priceEur: 29900, cv: 116 },
  { id: 5,  brand: 'Volkswagen',    model: 'Golf',                version: '1.5 eTSI Life DSG',            year: 2022, km: 31000,  fuel: Fuel.HYBRID,   gear: Transmission.AUTOMATIC, body: BodyType.SEDAN, priceEur: 25400, cv: 150, war: 18 },
  { id: 6,  brand: 'Tesla',         model: 'Model 3',             version: 'Long Range AWD',               year: 2021, km: 58000,  fuel: Fuel.ELECTRIC, gear: Transmission.AUTOMATIC, body: BodyType.SEDAN, priceEur: 32900, cv: 440 },
  { id: 7,  brand: 'Toyota',        model: 'C-HR',                version: '1.8 Hybrid Exclusive',         year: 2020, km: 64000,  fuel: Fuel.HYBRID,   gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 22900, cv: 122 },
  { id: 8,  brand: 'Skoda',         model: 'Octavia Break',       version: '2.0 TDI Style',                year: 2019, km: 92000,  fuel: Fuel.DIESEL,   gear: Transmission.MANUAL,    body: BodyType.ESTATE, priceEur: 16900, cv: 150 },
  { id: 9,  brand: 'Audi',          model: 'Q3 Sportback',        version: '35 TDI S line S tronic',       year: 2022, km: 28500,  fuel: Fuel.DIESEL,   gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 38900, cv: 150, war: 24 },
  { id: 10, brand: 'Volvo',         model: 'XC40',                version: 'T5 Recharge Inscription',      year: 2021, km: 42000,  fuel: Fuel.PHEV,     gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 33900, cv: 262 },
  { id: 11, brand: 'Kia',           model: 'Sportage',            version: '1.6 CRDi Drive',               year: 2019, km: 87000,  fuel: Fuel.DIESEL,   gear: Transmission.MANUAL,    body: BodyType.SUV,   priceEur: 19400, cv: 136 },
  { id: 12, brand: 'Mini',          model: 'Cooper',              version: '1.5 Classic',                  year: 2020, km: 45000,  fuel: Fuel.PETROL,   gear: Transmission.MANUAL,    body: BodyType.CITY,  priceEur: 18900, cv: 136 },
  { id: 13, brand: 'Porsche',       model: 'Macan',               version: '2.0 PDK',                      year: 2019, km: 76000,  fuel: Fuel.PETROL,   gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 52900, cv: 245, war: 12 },
  { id: 14, brand: 'Dacia',         model: 'Duster',              version: '1.5 Blue dCi Prestige',        year: 2022, km: 35000,  fuel: Fuel.DIESEL,   gear: Transmission.MANUAL,    body: BodyType.SUV,   priceEur: 18400, cv: 115 },
  { id: 15, brand: 'BMW',           model: 'Série 4 Coupé',       version: '420i M Sport',                 year: 2021, km: 33000,  fuel: Fuel.PETROL,   gear: Transmission.AUTOMATIC, body: BodyType.COUPE, priceEur: 41900, cv: 184, war: 18 },
  { id: 16, brand: 'Hyundai',       model: 'Tucson',              version: '1.6 T-GDi PHEV Vanguard',      year: 2022, km: 26000,  fuel: Fuel.PHEV,     gear: Transmission.AUTOMATIC, body: BodyType.SUV,   priceEur: 34500, cv: 265 },
  { id: 17, brand: 'Fiat',          model: '500',                 version: 'Elétrico Icon',                year: 2022, km: 18000,  fuel: Fuel.ELECTRIC, gear: Transmission.AUTOMATIC, body: BodyType.CITY,  priceEur: 21900, cv: 118 },
  { id: 18, brand: 'Citroën',       model: 'C3',                  version: '1.2 PureTech Shine',           year: 2019, km: 68000,  fuel: Fuel.PETROL,   gear: Transmission.MANUAL,    body: BodyType.CITY,  priceEur: 10900, cv: 83 },
  { id: 19, brand: 'Dacia',         model: 'Sandero Stepway',     version: '1.0 TCe Comfort',              year: 2020, km: 51000,  fuel: Fuel.PETROL,   gear: Transmission.MANUAL,    body: BodyType.CITY,  priceEur: 11900, cv: 90 },
  { id: 20, brand: 'Renault',       model: 'Captur',              version: '1.5 dCi Exclusive',            year: 2020, km: 58000,  fuel: Fuel.DIESEL,   gear: Transmission.MANUAL,    body: BodyType.SUV,   priceEur: 17500, cv: 115 },
];

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed a iniciar...');

  // ── Admin ──────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@privatemotors.pt' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@privatemotors.pt',
      passwordHash: await hashPassword('admin1234'),
      role: 'ADMIN',
    },
  });
  console.log(`✔ Admin criado: ${admin.email}`);

  // ── Produto de financiamento ────────────────────────────────────────────

  const product = await prisma.financingProduct.upsert({
    where: { id: 'default-financing-product' },
    update: {},
    create: {
      id: 'default-financing-product',
      name: 'Crédito Auto (Protótipo)',
      lenderName: 'A definir',
      isDefault: true,
      rateMode: 'TAEG_INPUT',
      taegBp: 1500,          // 15 %
      tanBp: 0,
      allowedTerms: [24, 36, 48, 60, 72, 84, 96],
      defaultTermMonths: 96,
      defaultDownPaymentPct: 0,
      maxDownPaymentPct: 50,
      budgetNearPct: 15,
      legalNote: 'Simulação indicativa, sujeita a aprovação de crédito. TAEG 15 %. Produto provisório até obtenção das condições reais da financeira parceira.',
      representativeExampleTemplate: 'Financiamento de {{priceCents | eur}} a {{termMonths}} meses, {{monthlyPaymentCents | eur}}/mês, TAEG {{taegBp | pct}}, MTIC {{mticCents | eur}}.',
    },
  });
  console.log(`✔ Produto de financiamento: ${product.name}`);

  // ── Marcas e modelos ────────────────────────────────────────────────────

  const uniqueBrands = [...new Set(CARS.map((c) => c.brand))];
  const brandMap: Record<string, string> = {};

  for (const name of uniqueBrands) {
    const b = await prisma.brand.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name), aliases: [] },
    });
    brandMap[name] = b.id;
  }
  console.log(`✔ ${uniqueBrands.length} marcas criadas`);

  const modelMap: Record<string, string> = {};
  for (const car of CARS) {
    const key = `${car.brand}|${car.model}`;
    if (modelMap[key]) continue;
    const m = await prisma.model.upsert({
      where: { brandId_slug: { brandId: brandMap[car.brand], slug: slug(car.model) } },
      update: {},
      create: { brandId: brandMap[car.brand], name: car.model, slug: slug(car.model), aliases: [] },
    });
    modelMap[key] = m.id;
  }
  console.log(`✔ ${Object.keys(modelMap).length} modelos criados`);

  // ── Viaturas ────────────────────────────────────────────────────────────

  for (const car of CARS) {
    const vehicleSlug = `${slug(car.brand)}-${slug(car.model)}-${slug(car.version)}-${car.year}`;
    await prisma.vehicle.upsert({
      where: { slug: vehicleSlug },
      update: {},
      create: {
        slug: vehicleSlug,
        status: VehicleStatus.PUBLISHED,
        condition: VehicleCondition.USED,
        brandId: brandMap[car.brand],
        modelId: modelMap[`${car.brand}|${car.model}`],
        version: car.version,
        registrationDate: new Date(`${car.year}-01-01`),
        mileageKm: car.km,
        fuel: car.fuel,
        transmission: car.gear,
        bodyType: car.body,
        powerHp: car.cv,
        priceCents: car.priceEur * 100,
        warrantyMonths: car.war ?? 0,
        financingEnabled: true,
        financingProductId: product.id,
        publishedAt: new Date(),
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }
  console.log(`✔ 20 viaturas criadas`);

  // ── Conteúdo base ───────────────────────────────────────────────────────

  await prisma.homeContent.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      companyName: 'Private Motors',
      phones: ['+351 210 000 000'],
      email: 'geral@privatemotors.pt',
      openingHours: {
        mon: '09:00-19:00',
        tue: '09:00-19:00',
        wed: '09:00-19:00',
        thu: '09:00-19:00',
        fri: '09:00-19:00',
        sat: '10:00-13:00',
        sun: 'Fechado',
      },
    },
  });

  const assistantSettings = await prisma.assistantSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  const steps = [
    { key: 'uso', question: 'Para que vai usar o carro principalmente?', position: 1, options: [{ label: 'Cidade', rules: { score: 0 } }, { label: 'Misto', rules: { score: 0 } }, { label: 'Autoestrada', rules: { score: 0 } }, { label: 'Tudo', rules: { score: 0 } }] },
    { key: 'fam', question: 'Quem vai viajar consigo habitualmente?', position: 2, options: [{ label: 'Só eu ou a dois', rules: { score: 0 } }, { label: 'Família pequena', rules: { score: 0 } }, { label: 'Família com crianças', rules: { score: 0 } }, { label: 'Família e muita bagagem', rules: { score: 0 } }] },
    { key: 'orc', question: 'Qual a prestação mensal com que se sente confortável?', position: 3, options: [{ label: 'Até 300 €', rules: { maxMonthly: 300, score: 0 } }, { label: '300 a 450 €', rules: { maxMonthly: 450, score: 0 } }, { label: 'Mais de 450 €', rules: { score: 0 } }] },
    { key: 'fuel', question: 'Que tipo de motor prefere?', position: 4, options: [{ label: 'Gasolina', rules: { fuel: ['PETROL'], score: 3 } }, { label: 'Diesel', rules: { fuel: ['DIESEL'], score: 3 } }, { label: 'Elétrico', rules: { fuel: ['ELECTRIC'], score: 3 } }, { label: 'Híbrido ou plug-in', rules: { fuel: ['HYBRID', 'PHEV'], score: 3 } }, { label: 'Indiferente', rules: { score: 0 } }] },
  ];

  for (const step of steps) {
    await prisma.assistantStep.upsert({
      where: { settingsId_key: { settingsId: assistantSettings.id, key: step.key } },
      update: {},
      create: { settingsId: assistantSettings.id, ...step },
    });
  }

  // Vantagens
  const advantages = [
    { icon: 'shield-check',    title: 'Garantia incluída',       text: 'Todas as viaturas têm garantia mínima de 12 meses.' },
    { icon: 'currency-eur',    title: 'Financiamento na hora',   text: 'Resposta de crédito no próprio dia, sem burocracia.' },
    { icon: 'file-text',       title: 'Tudo por escrito',        text: 'Contrato claro, sem letras pequenas nem surpresas.' },
    { icon: 'headset',         title: 'Apoio pós-venda',         text: 'A nossa equipa continua disponível depois da compra.' },
  ];
  for (let i = 0; i < advantages.length; i++) {
    const adv = advantages[i];
    await prisma.advantage.upsert({
      where: { id: `adv-${i + 1}` },
      update: {},
      create: { id: `adv-${i + 1}`, ...adv, position: i + 1 },
    });
  }

  // Frases de exemplo da pesquisa (do protótipo)
  const examples = [
    'SUV diesel até 250 €/mês',
    'BMW automático desde 2020',
    'carrinha familiar até 25 mil euros',
    'elétrico com menos de 60 000 km',
  ];
  for (let i = 0; i < examples.length; i++) {
    await prisma.searchExample.upsert({
      where: { id: `example-${i + 1}` },
      update: {},
      create: { id: `example-${i + 1}`, text: examples[i], position: i + 1 },
    });
  }

  // Páginas legais (conteúdo provisório)
  const legalPages = [
    { slug: 'privacidade', title: 'Política de Privacidade', body: '# Política de Privacidade\n\nConteúdo a preencher.' },
    { slug: 'cookies',     title: 'Política de Cookies',     body: '# Política de Cookies\n\nConteúdo a preencher.' },
    { slug: 'termos',      title: 'Termos e Condições',      body: '# Termos e Condições\n\nConteúdo a preencher.' },
  ];
  for (const page of legalPages) {
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
