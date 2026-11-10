# ChemQC Website

This repository contains the static landing page for ChemQC, a laboratory data management product for polymer manufacturing laboratories. It introduces the product, shows screenshots, answers common questions, and provides contact information.

The site is built with Astro, Tailwind CSS 3, and vanilla JavaScript. Tailwind utilities use the `tw-` prefix. GSAP and ScrollTrigger, Bootstrap Icons, and Google Fonts load from external services.

## Local Development

Use Node.js 22 and npm. Check your version and install dependencies without changing the existing local lockfile:

```sh
node --version
npm install
npm run dev
```

Open the local URL printed by Astro. To build and preview the production site:

```sh
npm run build
npm run preview
```

The Astro scripts replace the former standalone Tailwind watch and build scripts. Vite processes `css/tailwind.css` and `css/index.css` as part of development and production builds.


## Project Structure

```text
src/pages/index.astro       Page composition
src/layouts/Layout.astro    Document metadata, styles, and scripts
src/components/             Page sections
public/assets/              Product screenshots and logo
public/index.js             Navigation, FAQ, lightbox, and animations
public/CNAME                Custom domain configuration
css/index.css               Custom site styles
css/tailwind.css            Tailwind directives
tailwind.config.js          Tailwind content paths and theme colors
astro.config.mjs            Astro and PostCSS configuration
dist/                       Generated static site
```

## Deployment

Set the repository's Pages source to **GitHub Actions** in its GitHub settings. The Pages workflow builds on pushes to `main` or manual dispatch, then deploys `dist/` using GitHub's official Pages actions. `public/CNAME` is copied into the output and specifies `chemqc.ir`. Deployment requires a later push or merge to `main`; local builds do not publish the site.

## Tests

No automated test suite is configured. Run `npm run build` to check the static build, and test navigation, FAQ, lightbox, and responsive layouts in a browser.

## Attribution

The site is based on a template from [awesome-landing-pages](https://github.com/PaulleDemon/awesome-landing-pages).
