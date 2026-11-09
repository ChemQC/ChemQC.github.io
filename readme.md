# ChemQC Website

This repository contains the static landing page for ChemQC, a laboratory data management product for polymer manufacturing laboratories. It introduces the product, shows screenshots, answers common questions, and provides contact information.

The ChemQC application itself is not included in this repository.

## Site Features

- Product introduction, benefits, screenshots, and frequently asked questions.
- Responsive navigation and expandable FAQ answers.
- Clickable product screenshots with a lightbox.
- Scroll-triggered animations and email links for demo requests and contact.

## Project Structure

```text
index.html              Page content and layout
index.js                Navigation, FAQ, lightbox, and animation behavior
css/index.css           Custom site styles
css/tailwind.css        Tailwind CSS source
css/tailwind-build.css  Prebuilt stylesheet loaded by the page
tailwind.config.js      Tailwind configuration and theme colors
assets/img/             Product screenshots
assets/logo/            ChemQC logo
assets/images/          Additional images from the landing-page template
CNAME                   Custom domain configuration
```

The site uses HTML, vanilla JavaScript, and Tailwind CSS. Tailwind utility classes use the `tw-` prefix. GSAP and ScrollTrigger, Bootstrap Icons, and Google Fonts are loaded from external services.

## Viewing Locally

Open `index.html` in a browser, or serve the repository directory with a static server. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The prebuilt stylesheet is already included, so no build is needed to view the site. External fonts, icons, and animation libraries require a network connection.

The `CNAME` file specifies the custom domain `chemqc.ir`.

## CSS Development

Tailwind reads `css/tailwind.css` and `tailwind.config.js` to generate the stylesheet loaded by the page, `css/tailwind-build.css`. Custom styles are maintained separately in `css/index.css`.

Use Node.js 22 and npm for CSS development (the scripts have been verified with Node.js 22). Check your versions and install the dependencies:

```sh
node --version
npm --version
npm install
```

While editing, watch for changes and rebuild the stylesheet automatically:

```sh
npm run start:tailwind
```

For a one-time minified production build, run:

```sh
npm run build:tailwind
```

Both commands update `css/tailwind-build.css`, which `index.html` already loads. Serve the site separately as described above and refresh the browser to see changes.

### Troubleshooting Node.js

If `npm install` reports `EBADENGINE` warnings, or a Tailwind command fails with `Cannot find module 'node:path'`, check `node --version`. Node.js 12 is too old for the current dependencies, even if installation finishes successfully. Install and use Node.js 22, then run `npm install` again.

For example, after installing [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) and reopening your terminal:

```sh
nvm install 22
nvm alias default 22
node --version
npm install
```

If the version is still incorrect, ensure the newer Node.js installation is active in your current terminal and appears before the system installation in `PATH`.

## Tests

No automated test suite is configured. `npm test` is a placeholder that exits with an error.

## Attribution

The site is based on a template from [awesome-landing-pages](https://github.com/PaulleDemon/awesome-landing-pages).
