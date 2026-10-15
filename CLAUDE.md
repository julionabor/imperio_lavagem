# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static landing page for **Império da Lavagem Auto**, a car wash/detailing business in São João da Madeira, Portugal. No build tools, package managers, or test frameworks — open `index.html` directly in a browser to preview.

## Architecture

Single-page site (`index.html`) built with Bootstrap 5: a sticky top navbar (collapses below `xl`), then full-width sections.

**Sections (anchor IDs):**
- `#inicio` — Hero with booking CTA (links to `https://imperiodalavagemauto.buk.pt`)
- `#diagnostico` — CarDiagnose widget (`#cardiagnose-root`, ES module in `cardiagnose/`)
- `#servicos` — Vehicle picker + price list: `#lavagem`, `#polimento` (packs), `#avulsos`, `#taxas`
- `#faq` — FAQ (Bootstrap accordion)
- `#contacto` / `#onde-estamos` — Contacts and Google Maps embed
- Footer — includes the Livro de Reclamações link

**JS files:**
- `js/services-data.js` — Single source of truth for the price list (packs, avulsos, vehicle categories, surcharges). Edit prices/descriptions here.
- `js/site.js` — Renders the price list, updates prices for the selected vehicle (SUV / 7 lugares / carrinha / comercial: +5€ on every "Pack…" service only; other services have no surcharge), and runs the paged carousels on mobile (<768px: arrows, dots, touch or mouse drag).
- `cardiagnose/data/packs.js` — Has its own pack catalogue for recommendations; keep its prices in sync with `services-data.js`.

**CSS:**
- `css/bootstrap.min.css` + `css/bootstrap-icons.css` — vendored Bootstrap 5
- `css/main.css` — custom styles; design tokens in `:root` (navy `#0C1C33`, gold `#F2CC47`)
- `cardiagnose/style.css` — widget styles, scoped to `#cardiagnose-root`

**Fonts:** Google Fonts `Unbounded` (headings) and `Manrope` (body)

**Tracking:** Meta Pixel (`fbq`) is embedded in `<head>` — pixel ID `2321084058250480`.

## Key Conventions

- Content is in **Portuguese (PT)**; keep all user-visible text in Portuguese.
- Images live in `images/` (logo, hero assets), `images/wash/` (service photos) and `images/categorias/` (vehicle categories — WebP files with a `.jpg` extension).

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-cardiagnose-widget/plan.md`
<!-- SPECKIT END -->
