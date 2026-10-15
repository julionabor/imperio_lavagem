/**
 * Império da Lavagem Auto — interações da página.
 * - Renderiza o preçário a partir de js/services-data.js
 * - Atualiza preços conforme o tipo de veículo
 *   (SUV / 7 lugares / Monovolume / Carrinha / Comercial: +5€ nos packs; restantes sem taxa)
 * - Carrosséis paginados no mobile (setas, pontos, arrastar com dedo ou rato)
 * - Fecha o menu mobile ao navegar
 */
(function () {
	"use strict";

	const DATA = window.IMPERIO_DATA;
	const BOOKING_URL = "https://imperiodalavagemauto.buk.pt/";
	const mobileQuery = window.matchMedia("(max-width: 767.98px)");
	const GAP = 12; // px entre slides — igual ao gap do CSS

	const esc = (s) =>
		String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
	const num = (n) => (n % 1 ? n.toFixed(2).replace(".", ",") : String(n));
	const eur = (n) => num(n) + "€";
	const range = (a, b) => (a === b ? eur(a) : num(a) + "–" + eur(b));
	const isPack = (name) => /^Pack\b/i.test(name);

	let currentVehicle = DATA.vehicles[1];

	// ─── Preços ─────────────────────────────────────────────────────────────

	function priceAttrs(min, max, kind) {
		return `data-min="${min}" data-max="${max}" data-kind="${kind}"`;
	}

	function surchargeFor(kind) {
		return currentVehicle.big && kind !== "fixed" ? DATA.SURCHARGE[kind] : 0;
	}

	function updatePrices(animate) {
		document.querySelectorAll("[data-kind]").forEach((el) => {
			const add = surchargeFor(el.dataset.kind);
			const text = range(Number(el.dataset.min) + add, Number(el.dataset.max) + add);
			if (el.textContent !== text) {
				el.textContent = text;
				if (animate) {
					el.classList.remove("price-flash");
					void el.offsetWidth;
					el.classList.add("price-flash");
				}
			}
		});
		document.querySelectorAll("[data-surcharge-note]").forEach((el) => {
			const add = surchargeFor(el.dataset.surchargeNote);
			el.hidden = !add;
			el.textContent = `Inclui +${eur(add)} de taxa ${currentVehicle.label}`;
		});
		document.querySelectorAll("[data-split]").forEach((el) => {
			el.hidden = Number(el.dataset.split) + surchargeFor(el.dataset.splitKind) < 100;
		});

		const status = document.getElementById("vehicle-status");
		if (status) {
			status.classList.toggle("is-big", currentVehicle.big);
			status.innerHTML = currentVehicle.big
				? `<i class="bi bi-info-circle"></i><span>Preços para <strong>${esc(currentVehicle.label)}</strong>: <strong>+5€</strong> em todos os packs. Os restantes serviços mantêm o preço.</span>`
				: `<i class="bi bi-check-circle"></i><span>Preços para <strong>${esc(currentVehicle.label)}</strong>: preço base, sem taxa adicional.</span>`;
		}
	}

	// ─── Render ─────────────────────────────────────────────────────────────

	function renderVehicles() {
		const root = document.getElementById("vehicle-picker");
		if (!root) return;
		const btn = (v) => `
			<button type="button" class="vehicle-option${v === currentVehicle ? " is-active" : ""}" role="radio"
				aria-checked="${v === currentVehicle}" data-vehicle="${v.id}">
				<img src="${v.img}" alt="" loading="lazy" width="160" height="64" draggable="false">
				<span class="vehicle-option__label">${esc(v.label)}</span>
				<span class="vehicle-option__fee">${v.big ? "+5€ nos packs" : "Preço base"}</span>
			</button>`;
		const pages = [DATA.vehicles.slice(0, 4), DATA.vehicles.slice(4)];
		root.querySelector(".carousel-track").innerHTML = pages
			.map((p) => `<div class="vehicle-page">${p.map(btn).join("")}</div>`)
			.join("");

		root.addEventListener("click", (e) => {
			const b = e.target.closest(".vehicle-option");
			if (!b) return;
			root.querySelectorAll(".vehicle-option").forEach((o) => {
				o.classList.toggle("is-active", o === b);
				o.setAttribute("aria-checked", String(o === b));
			});
			currentVehicle = DATA.vehicles.find((v) => v.id === b.dataset.vehicle);
			updatePrices(true);
		});
	}

	function packCard(k) {
		const kind = isPack(k.name) ? "pack" : "avulso";
		const badges = [];
		if (k.top) badges.push('<span class="badge-soft">Mais procurado</span>');
		badges.push(
			`<span class="badge-soft" data-split="${k.min}" data-split-kind="${kind}" ${k.min < 100 ? "hidden" : ""}>Parcelável até 4x</span>`
		);
		return `
			<article class="pack-card${k.hl ? " pack-card--highlight" : ""}">
				<img class="pack-card__img" src="${k.img}" alt="" loading="lazy" draggable="false">
				<div class="pack-card__body">
					<div class="pack-card__badges">${badges.join("")}</div>
					<h4 class="pack-card__title">${esc(k.name)}</h4>
					<div>
						<span class="pack-card__price" ${priceAttrs(k.min, k.max, kind)}>${range(k.min, k.max)}</span>
						${k.note ? `<span class="pack-card__note">${esc(k.note)}</span>` : ""}
						<span class="pack-card__note pack-card__note--fee" data-surcharge-note="${kind}" hidden></span>
					</div>
					<p class="pack-card__desc">${esc(k.desc)}</p>
					<div class="pack-card__label">Inclui ${k.inc.length} ${k.inc.length === 1 ? "item" : "itens"}</div>
					<ul class="check-list">${k.inc.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
					<a class="btn btn-gold w-100 mt-auto" href="${BOOKING_URL}" target="_blank" rel="noopener">Marcar este serviço</a>
				</div>
			</article>`;
	}

	function renderGroups() {
		const root = document.getElementById("service-groups");
		if (!root) return;
		root.innerHTML = DATA.groups
			.map(
				(g) => `
			<div class="service-group" id="${g.id}">
				<div class="service-group__head">
					<h3>${esc(g.title)}</h3>
					<span>${g.packs.length} serviços</span>
				</div>
				<div class="carousel-block" data-carousel>
					<div class="carousel-viewport"><div class="carousel-track pack-grid">${g.packs.map(packCard).join("")}</div></div>
					${carouselControls(g.title)}
				</div>
			</div>`
			)
			.join("");
	}

	function renderExtras() {
		const root = document.getElementById("extras-grid");
		if (!root) return;
		root.innerHTML = DATA.extras
			.map(
				(c) => `
			<div class="extra-card">
				<div class="extra-card__cat">${esc(c.cat)}</div>
				${c.items
					.map(
						(s) => `
					<div class="extra-row">
						<div class="extra-row__text">
							<div class="extra-row__name">${esc(s.n)}</div>
							<div class="extra-row__desc">${esc(s.d)}</div>
							${s.pts ? `<ul class="check-list check-list--sm">${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
						</div>
						<div class="extra-row__price" ${s.text ? "" : priceAttrs(s.min, s.max, s.fixed ? "fixed" : "avulso")}>${s.text ? esc(s.text) : range(s.min, s.max)}</div>
					</div>`
					)
					.join("")}
			</div>`
			)
			.join("");

		const dirt = document.getElementById("dirt-list");
		if (dirt) dirt.innerHTML = DATA.dirt.map((d) => `<li>${esc(d)}</li>`).join("");
	}

	function carouselControls(label) {
		return `
			<div class="carousel-controls" aria-label="Navegar ${esc(label)}">
				<button type="button" class="carousel-btn" data-dir="-1" aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>
				<div class="carousel-dots"></div>
				<span class="carousel-counter"></span>
				<button type="button" class="carousel-btn" data-dir="1" aria-label="Seguinte"><i class="bi bi-chevron-right"></i></button>
			</div>`;
	}

	// ─── Carrossel (só ativo no mobile) ─────────────────────────────────────

	function initCarousel(block) {
		const viewport = block.querySelector(".carousel-viewport");
		const track = block.querySelector(".carousel-track");
		const dotsEl = block.querySelector(".carousel-dots");
		const counter = block.querySelector(".carousel-counter");
		const prev = block.querySelector('[data-dir="-1"]');
		const next = block.querySelector('[data-dir="1"]');
		let page = 0;

		const total = () => track.children.length;
		const offsetFor = (p) => -p * (viewport.clientWidth + GAP);

		function render() {
			if (!mobileQuery.matches) {
				track.style.transform = "";
				return;
			}
			const n = total();
			page = Math.max(0, Math.min(n - 1, page));
			track.style.transform = `translate3d(${offsetFor(page)}px, 0, 0)`;
			prev.disabled = page === 0;
			next.disabled = page === n - 1;
			if (counter) counter.textContent = `${page + 1} / ${n}`;
			dotsEl.innerHTML = Array.from(
				{ length: n },
				(_, i) =>
					`<button type="button" class="carousel-dot${i === page ? " is-active" : ""}" data-page="${i}" aria-label="Ir para ${i + 1} de ${n}"></button>`
			).join("");
		}

		prev.addEventListener("click", () => { page--; render(); });
		next.addEventListener("click", () => { page++; render(); });
		dotsEl.addEventListener("click", (e) => {
			const d = e.target.closest("[data-page]");
			if (d) { page = Number(d.dataset.page); render(); }
		});

		// Arrastar com dedo, caneta ou rato
		let drag = null;
		let suppressClick = false;

		viewport.addEventListener("pointerdown", (e) => {
			if (!mobileQuery.matches || (e.pointerType === "mouse" && e.button !== 0)) return;
			drag = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, active: false, id: e.pointerId };
		});

		viewport.addEventListener("pointermove", (e) => {
			if (!drag || e.pointerId !== drag.id) return;
			const dx = e.clientX - drag.x;
			const dy = e.clientY - drag.y;
			if (!drag.active) {
				if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
				// gesto vertical = scroll da página
				if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
				drag.active = true;
				try { viewport.setPointerCapture(e.pointerId); } catch (_) { /* ponteiro já libertado */ }
				track.classList.add("is-dragging");
			}
			e.preventDefault();
			// resistência nas pontas
			const atEdge = (page === 0 && dx > 0) || (page === total() - 1 && dx < 0);
			drag.dx = atEdge ? dx * 0.3 : dx;
			track.style.transform = `translate3d(${offsetFor(page) + drag.dx}px, 0, 0)`;
		});

		function endDrag(e) {
			if (!drag || (e && e.pointerId !== drag.id)) return;
			const { dx, active, t } = drag;
			drag = null;
			track.classList.remove("is-dragging");
			if (!active) return;
			suppressClick = true;
			setTimeout(() => { suppressClick = false; }, 60);
			const velocity = Math.abs(dx) / Math.max(1, performance.now() - t);
			const threshold = viewport.clientWidth * 0.2;
			if (Math.abs(dx) > threshold || (velocity > 0.4 && Math.abs(dx) > 30)) page += dx < 0 ? 1 : -1;
			render();
		}
		viewport.addEventListener("pointerup", endDrag);
		viewport.addEventListener("pointercancel", endDrag);
		viewport.addEventListener("lostpointercapture", endDrag);

		// Um arrasto não deve contar como clique (ex.: escolher veículo sem querer)
		viewport.addEventListener(
			"click",
			(e) => {
				if (suppressClick) {
					e.preventDefault();
					e.stopPropagation();
					suppressClick = false;
				}
			},
			true
		);

		mobileQuery.addEventListener("change", () => { page = 0; render(); });
		window.addEventListener("resize", render);
		render();
	}

	// ─── Navegação ──────────────────────────────────────────────────────────

	function initNav() {
		const menu = document.getElementById("mainNav");
		if (!menu || !window.bootstrap) return;
		menu.querySelectorAll("a.nav-link").forEach((a) =>
			a.addEventListener("click", () => {
				const c = bootstrap.Collapse.getInstance(menu);
				if (c) c.hide();
			})
		);
	}

	document.addEventListener("DOMContentLoaded", () => {
		renderVehicles();
		renderGroups();
		renderExtras();
		document.querySelectorAll("[data-carousel]").forEach(initCarousel);
		updatePrices(false);
		initNav();
		const y = document.getElementById("year");
		if (y) y.textContent = new Date().getFullYear();
	});
})();
