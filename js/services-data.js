/**
 * Catálogo de serviços — Império da Lavagem Auto.
 * Fonte única para o preçário da página (index.html).
 * Preços em euros. A taxa de veículo grande é aplicada em js/site.js.
 */
window.IMPERIO_DATA = (function () {
	// Taxa de veículo grande (SUV / 7 lugares / Monovolume / Carrinha / Comercial):
	// +5€ apenas nos packs (nomes começados por "Pack"). Os restantes serviços não têm taxa.
	const SURCHARGE = { pack: 5, avulso: 0 };

	const vehicles = [
		{ id: "pequeno_citadino", label: "Pequeno citadino", img: "images/categorias/pequeno_citadino.jpg", big: false },
		{ id: "citadinos", label: "Citadino", img: "images/categorias/citadinos.jpg", big: false },
		{ id: "utilitario", label: "Utilitário", img: "images/categorias/utilitario.jpg", big: false },
		{ id: "sedan", label: "Sedan", img: "images/categorias/sedan.jpg", big: false },
		{ id: "coupe", label: "Coupé", img: "images/categorias/coupe.jpg", big: false },
		{ id: "suv", label: "SUV / 7 lugares", img: "images/categorias/suv.jpg", big: true },
		{ id: "carrinha", label: "Carrinha / Monovolume", img: "images/categorias/carrinha.jpg", big: true },
		{ id: "comerciais", label: "Comercial", img: "images/categorias/comerciais.jpg", big: true },
	];

	const groups = [
		{
			id: "lavagem",
			title: "Lavagem & Higienização",
			packs: [
				{ name: "Lavagem Básica", min: 25, max: 25, img: "images/wash/brian-lundquist-bhRTtuNTHCE-unsplash.jpg", desc: "A antiga “lavagem completa”: exterior lavado à mão e interior essencial.", inc: ["Pré-lavagem", "Lavagem manual exterior", "Lavagem das jantes", "Lavagem do depósito de combustível", "Lavagem das cavas da porta", "Lavagem da cava do porta-malas", "Secagem do veículo", "Aspiração dos tapetes", "Aspiração básica", "Limpeza dos plásticos e tablier", "Hidratação dos plásticos", "Limpeza dos vidros", "Brilho nos pneus"] },
				{ name: "Higienização Apenas Interior", min: 30, max: 30, img: "images/wash/higienizacao-interior.jpg", desc: "Só o interior, higienizado a vapor e desinfetado.", inc: ["Aspiração profunda", "Aspiração e limpeza dos tapetes", "Higienização a vapor dos plásticos interiores e tablier", "Hidratação dos plásticos", "Higienização do ar condicionado", "Tratamento de ozono"] },
				{ name: "Pack Higienização Standard", min: 40, max: 40, top: true, img: "images/wash/higienizacao.jpg", desc: "Exterior completo com descontaminação e interior a vapor.", inc: ["Pré-lavagem", "Lavagem manual exterior", "Descontaminação ferrosa (quando necessário)", "Aspiração profunda c/ compressor de ar", "Lavagem das jantes", "Lavagem do depósito de combustível", "Lavagem das cavas da porta", "Lavagem da cava do porta-malas", "Lavagem dos pedais e do descanso", "Secagem do veículo", "Higienização a vapor dos plásticos interiores e hidratação", "Lavagem do volante", "Limpeza dos tapetes", "Tratamento de ozono ou aplicação de cera", "Abrilhantador de pneus"] },
				{ name: "Pack Luxo e Conforto", min: 75, max: 75, img: "images/wash/auto_lavagem_o_kleber_1_.jpg", desc: "Lavagem completa com lavagem de estofos e ozono.", inc: ["Pré-lavagem", "Lavagem manual exterior", "Aspiração simples", "Lavagem das jantes", "Lavagem do depósito de combustível", "Lavagem das cavas da porta", "Lavagem da cava do porta-malas", "Lavagem dos pedais e do descanso", "Limpeza e hidratação dos plásticos interiores", "Limpeza dos vidros", "Lavagem dos tapetes", "Secagem", "Lavagem de estofos", "Tratamento de ozono", "Abrilhantador de pneus"] },
				{ name: "Pack Higienização Premium", min: 100, max: 100, top: true, img: "images/wash/estofo.jpg", desc: "Tudo o que inclui a Higienização Standard, mais estofos, ozono premium e proteção dos plásticos.", inc: ["Pré-lavagem", "Lavagem manual exterior", "Aspiração profunda", "Lavagem das jantes", "Lavagem do depósito de combustível", "Lavagem das cavas da porta e do porta-malas", "Lavagem dos pedais e do descanso", "Secagem do veículo", "Higienização a vapor dos plásticos interiores e hidratação", "Limpeza dos vidros e dos tapetes", "Lavagem do volante, dos cintos de segurança e das palas de sol", "Lavagem dos estofos (sem remover os bancos)", "Desinfeção premium por ozono (elimina microrganismos, bactérias e partículas orgânicas que provocam odores) ou aplicação de cera", "Restauro e proteção dos plásticos interiores (até 6 meses)", "Restauro e proteção dos plásticos exteriores (até 60 dias)"] },
				{ name: "Pack Zero KM", min: 130, max: 130, hl: true, img: "images/wash/carpete-de-carros-2048x1367.jpg", desc: "Renovação total do interior e exterior — como acabado de sair do stand.", inc: ["Pré-lavagem", "Lavagem manual exterior completa", "Descontaminação ferrosa da carroçaria (quando necessário)", "Aspiração profunda", "Lavagem das jantes", "Lavagem das cavas de roda", "Lavagem da entrada do depósito de combustível", "Lavagem das cavas da porta e do porta-malas", "Lavagem dos pedais e do descanso", "Lavagem do volante", "Lavagem da alcatifa", "Lavagem do teto", "Lavagem dos cintos de segurança", "Lavagem das palas de sol", "Secagem do veículo", "Higienização profunda a vapor de todos os plásticos interiores e hidratação", "Restauro e proteção dos plásticos interiores (até 6 meses)", "Restauro e proteção dos plásticos exteriores (até 60 dias)", "Desinfeção premium por ozono (elimina microrganismos, bactérias e partículas orgânicas que provocam odores) ou aplicação de cera", "Limpeza / lavagem dos tapetes"] },
			],
		},
		{
			id: "polimento",
			title: "Polimento & Vitrificação",
			packs: [
				{ name: "Polimento", min: 140, max: 160, note: "Valor desde 140€ a 160€, perante avaliação", img: "images/wash/deniz-demirci-yeMjSP7UGlo-unsplash.jpg", desc: "Ideal para revitalizar a aparência do seu veículo e trazer um brilho poderoso.", inc: ["Polimento com remoção dos micro riscos", "Devolve brilho à pintura", "Elimina marcas superficiais"] },
				{ name: "Polimento de Faróis (Ópticas)", min: 40, max: 40, img: "images/wash/car-wash-detailing-station-scaled.jpg", desc: "Polimento para revitalizar os faróis do carro.", inc: ["Utilizamos uma polidora para aumentar o brilho", "Recuperação do brilho com remoção de até 50% dos riscos"] },
				{ name: "Pack Brilho (Polimento) & Proteção — 1 ano", min: 240, max: 270, note: "Orçamento dado presencialmente — entre 240€ e 270€", img: "images/wash/polimento-automotivo-1.jpg", desc: "Ideal para carros do dia a dia com manutenção regular.", inc: ["Polimento + vitrificação cerâmica com proteção de até 12 meses", "Restaura o brilho da pintura", "Protege contra sujidade, raios UV e químicos leves"] },
				{ name: "Pack Diamante — Polimento & Proteção Cerâmica 2 anos", min: 300, max: 330, note: "Orçamento dado presencialmente — entre 300€ e 330€", hl: true, img: "images/wash/polishing-car-after-painting-detailing-car-from-outside-device-polishing-hands2.jpg", desc: "Indicado para quem procura o máximo cuidado e preservação da pintura, mantendo o valor do seu veículo.", inc: ["Polimento + vitrificação nano cerâmica profissional com durabilidade de até 2 anos", "Acabamento de alto brilho", "Proteção duradoura contra riscos leves e sujidade", "Proteção contra agressões ambientais"] },
				{ name: "Pack Diamante Plus", min: 360, max: 360, img: "images/wash/cquartz.jpg", desc: "Pack Diamante com Higienização Premium incluída.", inc: ["Polimento + vitrificação nano cerâmica profissional com durabilidade de até 2 anos", "Acabamento de alto brilho e proteção duradoura contra riscos leves e sujidade", "Proteção contra agressões ambientais", "Higienização Premium incluída"] },
				{ name: "Pack Diamante Exclusive", min: 400, max: 400, img: "images/wash/unnamed.jpg", desc: "Pack Diamante com renovação total completa do interior.", inc: ["Polimento + vitrificação nano cerâmica profissional com durabilidade de até 2 anos", "Acabamento de alto brilho e proteção duradoura contra riscos leves e sujidade", "Proteção contra agressões ambientais", "Renovação total completa do interior (Pack Zero KM incluído)"] },
				{ name: "Pack Elite & Proteção 4 anos", min: 470, max: 500, img: "images/wash/ceramic.png", desc: "O mais alto nível de vitrificação, para a máxima proteção e longevidade da pintura.", inc: ["Polimento + proteção nano cerâmica profissional com durabilidade de até 4 anos", "Hidrorrepelência", "Substância anti-estática que repele poeira e outras substâncias", "Acabamento de alto brilho e proteção duradoura contra riscos leves", "Proteção contra agressões ambientais, raios UV e químicos"] },
			],
		},
	];

	// `fixed: true` = sem taxa de veículo grande; `text` = preço em texto livre
	const extras = [
		{ cat: "Vitrificação & cera", items: [
			{ n: "Vitrificação 1 ano", min: 200, max: 200, d: "Proteção cerâmica com durabilidade de 12 meses. Cria uma camada hidrofóbica que facilita a limpeza e protege contra raios UV, fezes de aves e agentes químicos leves." },
			{ n: "Vitrificação 2 anos", min: 280, max: 280, d: "Proteção nano-cerâmica avançada com até 2 anos de durabilidade. Garante brilho intenso, repelência à água e maior resistência a agressões externas. Ideal para quem quer a pintura protegida por mais tempo." },
			{ n: "Aplicação de Cera", min: 20, max: 20, d: "Camada de cera protetora para a pintura, com brilho imediato." },
		] },
		{ cat: "Vidros", items: [
			{ n: "Pack Cristalização & Proteção Completa", min: 139, max: 139, d: "Revitalização e remoção de marcas + proteção nano-diamante e repelência no para-brisas, vidro traseiro e laterais. Efeito repelente a partir de 45 km/h, durante 2 anos ou até 40 mil ciclos do limpa para-brisas." },
			{ n: "Pack Cristalização + Proteção (Para-brisas)", min: 89, max: 89, d: "Revitalização e remoção de marcas + proteção nano-diamante e repelência apenas no para-brisas. Efeito repelente a partir de 45 km/h, durante 2 anos ou até 40 mil ciclos." },
			{ n: "Proteção Vidros (4 vidros)", min: 99, max: 99, d: "Proteção nano-diamante e repelência no para-brisas, traseiro e laterais. Efeito repelente a partir de 45 km/h, durante 2 anos ou até 40 mil ciclos." },
			{ n: "Proteção Vidros (Para-brisas)", min: 59, max: 59, d: "Proteção nano-diamante e repelência apenas no para-brisas. Efeito repelente a partir de 45 km/h, durante 2 anos ou até 40 mil ciclos." },
			{ n: "Revitalização do Vidro", min: 50, max: 50, d: "Remoção de contaminações, marcas de chuva ácida e micro riscos superficiais em janelas e para-brisas. Melhora significativamente a nitidez. Não indicado para riscos profundos ou danos estruturais." },
			{ n: "Remoção Marcas d’Água (Vidros)", min: 25, max: 25, d: "Remove marcas d’água e calcário, devolvendo a leveza e limpeza dos vidros — caso ainda tenham recuperação." },
		] },
		{ cat: "Plásticos exteriores", items: [
			{ n: "Nível 1 — Renovação Essencial", min: 30, max: 30, d: "Restauro básico dos plásticos exteriores para recuperar a cor original. Ideal para manutenção rápida ou desgaste leve.", pts: ["Recuperação visual imediata", "Escurecimento moderado", "Proteção temporária contra UV", "Durabilidade média: 2–5 meses"] },
			{ n: "Nível 2 — Proteção e Estética", min: 50, max: 70, d: "Coating cerâmico com foco em estética e proteção. Intensifica a cor dos plásticos e cria uma camada hidrofóbica.", pts: ["Escurecimento profundo (efeito “novo”)", "Proteção contra sujidade e intempéries", "Maior resistência química", "Durabilidade média: 9–12 meses"] },
			{ n: "Nível 3 — Proteção Cerâmica Avançada", min: 90, max: 110, d: "Coating cerâmico de alta performance para proteção prolongada de plásticos e borrachas, com foco na preservação do material.", pts: ["Proteção UV de longo prazo (evita desbotamento)", "Acabamento natural tipo OEM", "Alta resistência química e ambiental", "Durabilidade média: até 24–36 meses"] },
		] },
		{ cat: "Estofos", items: [
			{ n: "Lavagem de Estofo", min: 65, max: 65, d: "Lavagem e higienização profunda dos estofos, sem remover os bancos, com produtos adequados a cada tipo de tecido." },
			{ n: "Lavagem de Estofo — Comerciais", min: 40, max: 40, fixed: true, d: "Para carrinhas comerciais que possuem apenas os bancos da frente." },
		] },
		{ cat: "Outros", items: [
			{ n: "Tratamento de Ozono", min: 20, max: 20, d: "Higienização interior com máquina de ozono: remove mau cheiro, fungos e bactérias infiltradas e desinfeta todo o interior." },
			{ n: "Remoção Marcas d’Água (Carroçaria)", min: 35, max: 35, d: "O carro seca e fica com marcas? Removemos marcas d’água e calcário, desde que ainda tenham recuperação e não tenham penetrado na pintura." },
			{ n: "Descontaminação Ferrosa", min: 15, max: 15, d: "Para carros com muita contaminação ferrosa, insetos ou sujidade resistente. Associada à lavagem do exterior." },
		] },
		{ cat: "Serviços adicionais", items: [
			{ n: "Aspiração Interior", min: 15, max: 15, d: "Apenas a aspiração interior da viatura." },
			{ n: "Lavagem Apenas Exterior", min: 15, max: 15, d: "Lavagem manual exterior, sem serviços adicionais." },
			{ n: "Higienização do Teto", min: 30, max: 30, d: "Lavagem antibacteriana da forra do teto, mediante verificação prévia de que é possível sem gerar danos." },
			{ n: "Higienização da Alcatifa", min: 30, max: 30, d: "Lavagem com antibactericida, removendo sujidade e manchas." },
			{ n: "Tratamento Específico Jantes", min: 15, max: 15, d: "Limpeza completa das jantes, incluindo o meio dos aros." },
			{ n: "Limpeza dos Vidros (interior)", min: 10, max: 10, d: "Limpeza interior dos vidros (já incluída na maior parte dos packs)." },
			{ n: "Lavagem dos Tapetes", text: "5€/unidade", d: "Valor por unidade de tapete." },
			{ n: "Manutenção de Vitrificação", min: 10, max: 10, d: "Produto de manutenção que preserva a durabilidade da camada nano-cerâmica aplicada anteriormente. Em packs tem 5€ de desconto." },
		] },
		{ cat: "Motas", items: [
			{ n: "Lavagem de Mota (até 125cc)", min: 25, max: 25, fixed: true, d: "Pré-lavagem, lavagem completa, jantes, pneus, carenagens, detalhes do motor e plásticos. Assentos higienizados e esfregados. Acabamento com cera e WD na corrente. Não desmontamos nada." },
			{ n: "Lavagem de Mota (acima de 125cc)", min: 30, max: 30, fixed: true, d: "Pré-lavagem, lavagem completa, jantes, pneus, carenagens, detalhes do motor e plásticos. Assentos higienizados e esfregados. Acabamento com cera e WD na corrente. Não desmontamos nada." },
		] },
	];

	const dirt = [
		"Barro ou terra em excesso (inclusive caixas de roda e parte inferior)",
		"Fezes de animais ou resíduos orgânicos",
		"Manchas de óleo, graxa ou materiais industriais",
		"Poeira ou fuligem acumulada por longos períodos",
		"Resíduos de obra (cimento, tinta, gesso, etc.)",
		"Lixo ou objetos acumulados no interior",
		"Mofo, limo ou mau cheiro acentuado",
		"Pelo de animais em grande quantidade",
	];

	return { SURCHARGE, vehicles, groups, extras, dirt };
})();
