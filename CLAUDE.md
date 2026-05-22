# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static landing page for **Império da Lavagem Auto**, a car wash/detailing business in São João da Madeira, Portugal. No build tools, package managers, or test frameworks — open `index.html` directly in a browser to preview.

## Architecture

Single-page site (`index.html`) with a fixed left sidebar navigation and a scrollable right content area, using Bootstrap 5's two-column grid layout (`col-md-4` sidebar + `col-md-8` main content).

**Sections (anchor IDs):**
- `#section_1` — Hero with booking CTA (links to `https://imperiodalavagemauto.buk.pt`)
- `#section_2` — FAQ accordion (Bootstrap flush accordion)
- `#section_3` — Services (Bootstrap modals per service)
- `#section_5` — Contact
- `#section_6` — Location/map

**JS files:**
- `js/main1.js` — Scroll spy: highlights the active sidebar nav link as the user scrolls through sections (jQuery-based, tracks `sectionArray = [1,2,3,4,5]`)
- `js/main2.js` — Sidebar collapse on mobile nav-link click + smooth scroll with navbar height offset compensation

**CSS:**
- `css/bootstrap.min.css` + `css/bootstrap-icons.css` — vendored Bootstrap 5
- `css/main.css` — custom styles (not vendored, edit freely)

**Fonts:** Google Fonts `Unbounded` (loaded from CDN)

**Tracking:** Meta Pixel (`fbq`) is embedded in `<head>` — pixel ID `2321084058250480`.

## Key Conventions

- Content is in **Portuguese (PT)**; keep all user-visible text in Portuguese.
- Services are presented as Bootstrap modals triggered by clicking `.services-thumb` cards in `#section_3`. Each modal has its own `id` (e.g., `#lavagem-completa`).
- The sidebar nav uses `.click-scroll` class (handled by `main1.js`) — new nav items must follow the `#section_N` ID pattern and be added to `sectionArray` in `main1.js`.
- Section numbering has a gap (no `section_4` in active use — it was a monthly plans section, now commented out). Keep this in mind when adding new sections.
- Images live in `images/` (logo, hero assets) and `images/wash/` (service card photos).

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-cardiagnose-widget/plan.md`
<!-- SPECKIT END -->
