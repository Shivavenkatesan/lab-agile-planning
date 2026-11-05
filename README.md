# Aero Prime Med — Interactive B2B Website

A responsive static website for Aero Prime Med, enhanced with a cinematic image marquee, staggered heading reveals, pointer-driven 3D card transforms, an animated sourcing flowchart and a searchable product catalogue.

## Preview
Open `index.html` in a modern browser, or serve this folder from a local web server. For example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Pages
- Home — cinematic hero, product categories, visual gallery, supply flow and B2B enquiry CTA.
- Products — category overview, filterable/searchable product list and category enquiry placeholders for Anesthesia & Respiratory and General Hospital Use.
- About, International, Wholesale, Quality, Resources and Contact.

## Interactions
- Continuous marquee motion in the hero image stage.
- GSAP + ScrollTrigger entrance animations and SVG connector tracing, with CSS/IntersectionObserver fallbacks.
- Pointer-responsive 3D tilt and scroll-depth transforms on cards and image frames.
- Word-by-word heading reveals, mobile navigation and product search/category filters.
- Reduced-motion accessibility support.

## Before launch
- Confirm the actual products, product specifications, stock and destinations you can supply.
- Review product and manufacturer documentation and all market-specific regulatory requirements.
- Replace photo placeholders or remote reference-catalogue image URLs with approved, locally hosted assets.
- Connect contact and quotation enquiries to a verified business inbox or CRM.
- Add final domain, canonical URLs, privacy/terms pages and production analytics as required.

The website uses Google Fonts, GSAP and remote image URLs; an internet connection is required for those external resources.

## Latest UI refinements (5 November 2026)
- Rebuilt the four-step supply flowchart with responsive SVG connectors measured from the actual step cards. Connector paths trace sequentially when the section scrolls into view and reflow vertically on mobile. The animation no longer depends on GSAP loading.
- Removed the JavaScript-injected product search and category-filter toolbar from the catalogue page.
- Standardized all six homepage category cards to equal dimensions; Home Care Products now appears as item 06 after Laboratory.
- Updated the Quality page's “Request Documentation” button to a high-contrast Aero Prime orange treatment.
