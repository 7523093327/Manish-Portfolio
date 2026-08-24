import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../outputs/interface-workshop-hero.html', import.meta.url), 'utf8');
const featuredWorkHeaderSvg = readFileSync(new URL('../featured-work-header-1.svg', import.meta.url), 'utf8');
const zacksCaseStudy = readFileSync(new URL('../work/zacks/index.html', import.meta.url), 'utf8');
const zacksHeroSvg = readFileSync(new URL('../work/zacks/zacks-hero-section.svg', import.meta.url), 'utf8');
const zacksResearchSectionSvg = readFileSync(new URL('../work/zacks/section-05-research-visual-direction.svg', import.meta.url), 'utf8');
const zacksProductWorkSvg = readFileSync(new URL('../work/zacks/section-08-product-work.svg', import.meta.url));
const zacksConfidentialWorkSvg = readFileSync(new URL('../work/zacks/section-09-confidential-work.svg', import.meta.url));
const zacksThanksSvg = readFileSync(new URL('../work/zacks/thanks.svg', import.meta.url));
const vercelConfig = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
const renderedText = html.replace(/<[^>]+>/g, ' ');

const serviceScreenConfigSource = html.match(
  /function initServiceSwitchboard\(\)[\s\S]*?const services = (\[[\s\S]*?\n\s*\]);/,
)?.[1];
assert.ok(serviceScreenConfigSource, 'exposes the service-screen content configuration');
const serviceScreenConfigs = runInNewContext(`(${serviceScreenConfigSource})`);
const serviceScreenWidth = 689;
const centeredServiceAssets = [
  ['Product Design', 'Product design.svg'],
  ['UX Research', 'UX Design.svg'],
  ['UI Design', 'UI Design.svg'],
  ['Design Systems', 'Design Systems.svg'],
  ['Website Design', 'Website Design.svg'],
  ['Visual Design', 'Visual Design.svg'],
];

for (const [serviceName, assetName] of centeredServiceAssets) {
  const serviceConfig = serviceScreenConfigs.find(([name]) => name === serviceName);
  assert.ok(serviceConfig, `configures the ${serviceName} screen`);
  assert.equal(
    serviceConfig[1],
    `../Service animation/${assetName}`,
    `uses the approved ${serviceName} illustration export`,
  );

  const svg = readFileSync(new URL(`../Service animation/${assetName}`, import.meta.url), 'utf8');
  const viewBox = svg.match(/<svg\b[^>]*\bviewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  assert.equal(viewBox?.length, 4, `${serviceName} provides a measurable SVG viewBox`);
  const authoredWidth = viewBox[2];
  const renderedWidth = serviceScreenWidth * (Number.parseFloat(serviceConfig[2]) / 100);
  assert.ok(
    Math.abs(renderedWidth - authoredWidth) < 0.08,
    `${serviceName} preserves its authored width instead of stretching the centered export`,
  );

  const patternedIllustration = svg.match(/<rect\b[^>]*\bfill="url\(#pattern[^"]+\)"[^>]*\/>/)?.[0];
  if (!patternedIllustration) continue;
  const x = Number(patternedIllustration.match(/\bx="([^"]+)"/)?.[1]);
  const width = Number(patternedIllustration.match(/\bwidth="([^"]+)"/)?.[1]);
  const illustrationCenterOffset = x + width / 2 - authoredWidth / 2;
  assert.ok(
    Math.abs(illustrationCenterOffset) <= 16,
    `${serviceName} keeps its main illustration centered beneath the heading`,
  );
}

function assertVercelAnalyticsBootstrap(documentHtml, pageUrl, pageLabel) {
  const bootstrapSource = documentHtml.match(
    /<script data-vercel-analytics-bootstrap>([\s\S]*?)<\/script>/,
  )?.[1];
  assert.ok(bootstrapSource, `${pageLabel} initializes Vercel Web Analytics`);

  const context = { window: {} };
  runInNewContext(bootstrapSource, context);
  context.window.va('verification-event', { page: pageLabel });
  assert.equal(context.window.vaq.length, 1, `${pageLabel} queues analytics calls before the client loads`);
  assert.equal(context.window.vaq[0][0], 'verification-event', `${pageLabel} preserves the queued event name`);
  assert.equal(context.window.vaq[0][1].page, pageLabel, `${pageLabel} preserves queued event data`);

  const scriptSource = documentHtml.match(
    /<script defer src="([^"]+)" data-vercel-analytics-script><\/script>/,
  )?.[1];
  assert.ok(scriptSource, `${pageLabel} loads the Vercel Analytics client`);
  assert.equal(
    new URL(scriptSource, pageUrl).pathname,
    '/_vercel/insights/script.js',
    `${pageLabel} resolves the analytics client through the Vercel project`,
  );
}

assertVercelAnalyticsBootstrap(html, 'https://portfolio.example/', 'homepage');
assertVercelAnalyticsBootstrap(zacksCaseStudy, 'https://portfolio.example/work/zacks/', 'Zacks case study');

assert.match(zacksCaseStudy, /<title>Zacks Insight · Case Study<\/title>/, 'adds the Zacks case-study document');
const zacksBaseHref = zacksCaseStudy.match(/<base href="([^"]+)">/)?.[1];
const zacksSlashlessDocumentUrl = new URL('https://portfolio.example/work/zacks');
const zacksEffectiveBaseUrl = zacksBaseHref
  ? new URL(zacksBaseHref, zacksSlashlessDocumentUrl)
  : zacksSlashlessDocumentUrl;
for (const assetName of [
  'section-05-research-visual-direction.svg',
  'section-06-token-architecture.svg',
  'section-08-product-work.svg',
  'section-09-confidential-work.svg',
  'thanks.svg',
]) {
  assert.equal(
    new URL(assetName, zacksEffectiveBaseUrl).pathname,
    `/work/zacks/${assetName}`,
    `resolves ${assetName} inside the Zacks directory from the slashless public route`,
  );
}
assert.match(zacksCaseStudy, /src="zacks-hero-section\.svg"/, 'uses a case-study hero asset bundled beside the page');
assert.match(zacksCaseStudy, /url\('Icons\/UsersRound\.svg'\)/, 'keeps case-study icon paths relative to its published directory');
assert.doesNotMatch(zacksCaseStudy, /<header class="zacks-header">/, 'removes the separate Zacks case-study header bar');
assert.doesNotMatch(zacksCaseStudy, /zacks-back-button/, 'does not add a Back control to the case-study hero');
assert.match(zacksCaseStudy, /\.zacks-hero\{width:100%;min-height:100vh;padding:0;display:block;[^}]*\}/, 'keeps the hero artwork full width without side padding');
assert.match(zacksCaseStudy, /\.case-section>\.zacks-container\{width:100%;max-width:var\(--zacks-content-width\);padding-inline:clamp\(20px,5vw,76px\);margin-inline:auto\}/, 'adds explicit responsive left and right padding to every text-content section');
assert.match(zacksCaseStudy, /\.flow::before\{content:"";position:absolute;top:40px;left:12px;right:12px;height:1px;background:var\(--forest-800\);opacity:\.7\}/, 'draws one continuous desktop transformation connector instead of separated segments');
assert.match(zacksCaseStudy, /@media\(min-width:901px\)\{\.flow-step::after\{display:none\}\}/, 'removes the broken per-step connector segments on desktop');
assert.match(zacksCaseStudy, /@media\(max-width:900px\)\{\.flow::before\{display:none\}\.flow-step::after\{left:6px;width:1px;height:calc\(100% - 20px\)\}\}/, 'keeps the mobile transformation connector one CSS pixel wide');
assert.match(zacksCaseStudy, /<section class="case-export-section case-export-section--research" aria-label="Design system research and visual direction">/, 'adds the exact exported Figma Section 05 asset after the design challenge');
assert.match(zacksCaseStudy, /<section class="case-export-section case-export-section--tokens" aria-label="Token architecture">/, 'adds the latest exported Figma Section 06 asset');
assert.match(zacksCaseStudy, /<section class="case-export-section case-export-section--product-work" aria-label="Product flows">/, 'adds the exact Product Work export');
assert.match(zacksCaseStudy, /<section class="case-export-section case-export-section--confidential-work" aria-label="Confidential product work">/, 'adds the exact Confidential Work export');
assert.match(zacksCaseStudy, /<section class="case-export-section case-export-section--thanks" aria-label="Closing thanks">/, 'adds the exact closing Thanks export');
assert.equal((zacksCaseStudy.match(/class="case-export-section__layer /g) || []).length, 7, 'keeps layered reveals only for the two composite design-system sections');
assert.equal((zacksCaseStudy.match(/class="case-export-section__static"/g) || []).length, 3, 'renders each late exact export once instead of compositing duplicate SVG copies');
const tokenSectionPosition = zacksCaseStudy.indexOf('<section class="case-export-section case-export-section--tokens"');
const productWorkSectionPosition = zacksCaseStudy.indexOf('<section class="case-export-section case-export-section--product-work"');
const confidentialWorkSectionPosition = zacksCaseStudy.indexOf('<section class="case-export-section case-export-section--confidential-work"');
const thanksSectionPosition = zacksCaseStudy.indexOf('<section class="case-export-section case-export-section--thanks"');
assert.ok(
  tokenSectionPosition < productWorkSectionPosition &&
  productWorkSectionPosition < confidentialWorkSectionPosition &&
  confidentialWorkSectionPosition < thanksSectionPosition,
  'renders Token Architecture, Product Work, Confidential Work, and Thanks in the approved order',
);
assert.match(zacksCaseStudy, /\.case-export-section--product-work \.case-export-section__canvas\{aspect-ratio:1920\/1001\}/, 'preserves the Product Work export ratio');
assert.match(zacksCaseStudy, /\.case-export-section--confidential-work \.case-export-section__canvas\{aspect-ratio:1920\/934\}/, 'preserves the Confidential Work export ratio');
assert.match(zacksCaseStudy, /\.case-export-section--thanks \.case-export-section__canvas\{aspect-ratio:1930\/343\}/, 'preserves the Thanks export ratio');
assert.match(zacksCaseStudy, /\.case-export-section__static\{display:block;width:100%;height:auto;opacity:1;transform:none\}/, 'keeps late exact exports visible even when JavaScript or IntersectionObserver is unavailable');
assert.match(zacksCaseStudy, /\.case-export-section\.is-visible \.case-export-section__static\{animation:case-export-section-settle \.7s cubic-bezier\(\.2,0,0,1\) both\}/, 'adds a safe entrance effect without using hidden initial CSS state');
assert.match(zacksCaseStudy, /@keyframes case-export-section-settle\{from\{transform:translateY\(12px\);filter:brightness\(\.96\)\}to\{transform:none;filter:none\}\}/, 'uses a restrained non-blocking settle animation for exact exports');
assert.equal(createHash('sha256').update(zacksProductWorkSvg).digest('hex'), '9cb6e983fe634017e876e15acb8c13746051a16b7f67e721a8f9216a8bd8c56c', 'copies the exact Product Work SVG without the Yes/No flow labels');
assert.equal(createHash('sha256').update(zacksConfidentialWorkSvg).digest('hex'), 'c0a1837ae0eea830eda8393ffbc07d233da8a13d09322899d40c91b2fab1b263', 'copies the exact Confidential Work SVG');
assert.equal(createHash('sha256').update(zacksThanksSvg).digest('hex'), 'ffa2e8731b8fedb0f23021d7078cc3f13f6d3c45ec366b17ec1270c717579d65', 'copies the exact Thanks SVG');
assert.match(zacksCaseStudy, /case-export-section__layer--research-intro/, 'reveals the research introduction separately');
assert.match(zacksCaseStudy, /case-export-section__layer--research-references/, 'reveals market references as the second research layer');
assert.match(zacksCaseStudy, /case-export-section__layer--research-direction/, 'reveals visual direction as the final research layer');
assert.match(zacksCaseStudy, /case-export-section__layer--token-heading/, 'reveals the token heading first');
assert.match(zacksCaseStudy, /case-export-section__layer--token-stages/, 'reveals the token stages next');
assert.match(zacksCaseStudy, /case-export-section__layer--token-foundations/, 'reveals the lower token foundations separately');
assert.match(zacksCaseStudy, /case-export-section__layer--token-components/, 'reveals the lower component examples last');
assert.match(zacksCaseStudy, /\.case-export-section__layer\{[^}]*opacity:0[^}]*translateY\(16px\)[^}]*cubic-bezier\(\.2,0,0,1\)/, 'uses a restrained staged rise and fade for exported artwork layers');
assert.match(zacksCaseStudy, /\.case-export-section\.is-visible \.case-export-section__layer\{opacity:1;transform:none\}/, 'plays the layer build when the section enters the viewport');
assert.match(zacksCaseStudy, /document\.querySelectorAll\('\.reveal,\.case-export-section'\)/, 'observes exported sections with the existing scroll-reveal system');
assert.match(zacksCaseStudy, /@media\(prefers-reduced-motion:reduce\)\{\.case-export-section__layer\{opacity:1;transform:none;transition:none\}\}/, 'shows the complete supplied artwork without animation for reduced motion');
assert.match(zacksCaseStudy, /\.case-section,\.case-section--tint,\.case-export-section,\.zacks-footer\{background:#f9f7f3\}/, 'uses one continuous background color after the hero');
assert.match(zacksCaseStudy, /\.zacks-footer\{border-top:0\}/, 'removes the final divider between the last case-study section and footer');
assert.doesNotMatch(zacksResearchSectionSvg, /<rect x="0\.5" y="0\.5" width="1919" height="933" stroke="black"\/>/, 'does not render the research export frame above Token Architecture');
assert.match(zacksCaseStudy, /\.case-export-section__layer\{position:absolute;inset:-1px;[^}]*width:calc\(100% \+ 2px\);height:calc\(100% \+ 2px\)/, 'crops the SVG exports’ black outer frame outside each section canvas');
assert.match(
  zacksCaseStudy,
  /\.zacks-hero\{width:100%;min-height:100vh;padding:0;display:block;background:#0A3426\}/,
  'keeps the hero canvas green behind the rounded artwork at every viewport width',
);
assert.doesNotMatch(
  zacksHeroSvg,
  /<rect x="5" y="5" width="1910" height="1070" rx="30" stroke="#F9F7F3" stroke-width="10"\/>/,
  'does not draw cream bands around the green hero artwork',
);
assert.match(html, /href="\/work\/zacks"/, 'links the Zacks card to the published case-study route');
assert.match(vercelConfig, /"cleanUrls"\s*:\s*true/, 'enables clean case-study URLs');
assert.match(vercelConfig, /"source"\s*:\s*"\/"/, 'keeps the portfolio root rewrite');
assert.match(vercelConfig, /"destination"\s*:\s*"\/outputs\/interface-workshop-hero"/, 'keeps the homepage as the root destination');

assert.match(html, /<nav[\s>]/, 'provides semantic navigation');
assert.doesNotMatch(html, /<a href="#tools">Skills<\/a>/, 'keeps Skills out of the primary navigation');
assert.match(html, /href="\.\.\/MANISH_CV\.pdf" download="Manish-Gaud-Resume\.pdf"/, 'provides a downloadable resume in the header');
assert.match(html, />Resume <span class="nav-cta__icon"/, 'labels the header CTA as Resume');
assert.match(renderedText, /I shape messy product ideas into\s+interfaces\s+people understand\./, 'keeps the approved headline');
assert.match(html, /family=DM\+Mono:wght@400;500&family=Pixelify\+Sans:wght@400;500/, 'loads Pixelify Sans for hero metadata');
assert.match(html, /\.eyebrow\{[^}]*"Pixelify Sans",cursive/, 'uses Pixelify Sans for the hero metadata');
assert.match(renderedText, /I work with teams to simplify complex workflows, design scalable interfaces, and ship polished product experiences\./, 'keeps the approved supporting copy');
assert.match(html, /View Selected Work/, 'provides the work CTA');
assert.match(html, /Start a Project/, 'provides the project CTA');
assert.match(html, /Hero illustrations svg\/mess\.svg/, 'uses the exported messy-input scene');
assert.match(html, /Hero illustrations svg\/conveyor\.svg/, 'uses the exported conveyor scene');
assert.match(html, /prefers-reduced-motion:\s*reduce/, 'respects reduced-motion preferences');
assert.doesNotMatch(renderedText, /Worked across\s+Zacks Investment Research, PeopleHum, Cosoot, and Zenskar\./, 'keeps the client list out of the hero');
assert.match(html, /class="brands-strip"/, 'adds a dedicated brands section after the hero');
assert.match(html, /padding:clamp\(58px,7vw,96px\) 0 clamp\(32px,4vw,56px\)/, 'keeps the brands-to-work transition compact');
assert.match(html, /\.page\{height:100svh;min-height:720px/, 'sizes the desktop hero to fit the first viewport');
assert.match(html, /class="brands-marquee"/, 'wraps the brands in a ticker viewport');
assert.match(html, /@keyframes brands-ticker/, 'defines the continuous ticker animation');
assert.match(html, /brand-logo--zenskar img\{width:75%/, 'reduces the Zenskar logo to 75% scale');
assert.match(renderedText, /Worked with teams across/, 'labels the brands section');
assert.match(html, /Brands SVG\/Zenskar\.svg/, 'renders the supplied Zenskar logo');
assert.match(html, /Brands SVG\/Cosoot\.svg/, 'renders the supplied Cosoot logo');
assert.match(html, /Brands SVG\/peopleHum Logo\.svg/, 'renders the supplied peopleHum logo');
assert.match(html, /Brands SVG\/Zacks\.svg/, 'renders the supplied Zacks logo');
assert.match(html, /class="featured-work-section" id="work"/, 'adds the featured work section at the work anchor');
assert.match(renderedText, /Featured work/, 'uses one featured work heading');
assert.match(html, /<h2 class="visually-hidden" id="featured-work-title">Featured work<\/h2>/, 'keeps a semantic Featured Work heading');
assert.match(html, /class="featured-work-header__art" src="\.\.\/featured-work-header-1\.svg" alt="" aria-hidden="true"/, 'uses the supplied header artwork without duplicate announcements');
assert.match(html, /\.featured-work-header__art\{display:block;width:min\(392px,calc\(100vw - 40px\)\);height:auto\}/, 'preserves the responsive 392 by 60 header artwork');
assert.match(featuredWorkHeaderSvg, /@keyframes kf_featured-work-icon_transform_0/, 'defines a seamless icon rotation');
assert.match(featuredWorkHeaderSvg, /animation: kf_featured-work-icon_transform_0 8s linear infinite/, 'rotates the icon slowly and continuously');
assert.match(featuredWorkHeaderSvg, /rotate\(6\.283rad\)/, 'completes a full icon rotation without a reset jump');
assert.match(featuredWorkHeaderSvg, /@media \(prefers-reduced-motion:\s*reduce\)/, 'provides a static reduced-motion fallback for the icon');
assert.match(html, /padding:clamp\(48px,5vw,72px\) clamp\(22px,5vw,76px\)/, 'reduces the top gap before featured work');
assert.match(html, /top:-120px;bottom:-36px;left:-160px;width:calc\(100vw \+ 160px\)/, 'masks card artwork across the full sticky-heading reveal area');
assert.match(html, /mask-image:linear-gradient\(to bottom,#000 0,#000 calc\(100% - 48px\),transparent 100%\)/, 'feathers the lower edge of the sticky work-header mask itself');
assert.match(html, /featured-work-header\{position:sticky/, 'keeps the featured-work heading sticky on desktop');
assert.match(html, /\.work-card\{position:relative;display:block;width:min\(74\.8vw,1275px\)/, 'scales desktop cards to 85 percent while keeping them centered');
assert.match(html, /\.work-card__artwork\{position:relative;display:block;width:100%;aspect-ratio:1920\/880;overflow:hidden\}/, 'crops the exported full-frame SVG to the card artwork');
assert.equal((html.match(/class="case-study-cta"/g) || []).length, 4, 'renders one reusable CTA for each Featured Work card');
assert.equal((html.match(/class="work-card__mobile-summary"/g) || []).length, 4, 'adds one readable mobile summary per Featured Work card');
assert.equal((html.match(/class="case-study-cta__arrow"/g) || []).length, 4, 'renders exactly one arrow per CTA');
assert.match(html, /\.work-card\{--case-study-cta-top:76%/, 'places every CTA on the same card-relative baseline');
assert.match(html, /\.work-card__artwork::after\{[^}]*top:calc\(var\(--baked-case-study-cta-top\) - 1\.5%\)[^}]*background:#FBF6EE/, 'masks each asset-exported CTA at its own original position');
assert.match(html, /\.case-study-cta\{[^}]*pointer-events:none[^}]*color:var\(--ink\)/, 'uses the real card link while preserving a consistently styled CTA');
assert.match(html, /\.case-study-cta::before\{[^}]*background:#FBF6EE/, 'matches the exported card paper without a visible CTA pill');
assert.match(html, /\.case-study-cta::after\{[^}]*background:var\(--blue\)[^}]*transform:scaleX\(0\)[^}]*transform-origin:left center/, 'keeps the blue underline hidden at rest and ready to grow from the left');
assert.match(html, /\.case-study-cta::after\{[^}]*bottom:-4px/, 'keeps the animated underline four pixels below the CTA text');
assert.match(html, /\.case-study-cta::after\{[^}]*height:1px/, 'uses a fine one-pixel CTA underline');
assert.match(html, /\.work-card:hover \.case-study-cta::after,\.work-card:focus-visible \.case-study-cta::after\{transform:scaleX\(1\)\}/, 'shows the same underline on hover and keyboard focus');
assert.match(html, /\.case-study-cta__arrow\{[^}]*fill:none[^}]*stroke:currentColor[^}]*transform:rotate\(0deg\)[^}]*transform-origin:center center/, 'uses one stroke-only diagonal arrow with a stable transform origin');
assert.match(html, /\.work-card:hover \.case-study-cta__arrow,\.work-card:focus-visible \.case-study-cta__arrow\{transform:rotate\(45deg\)\}/, 'rotates the same arrow to the right on hover and focus');
assert.match(html, /\.work-card:hover \.case-study-cta,\.work-card:focus-visible \.case-study-cta\{color:var\(--blue\)\}/, 'turns the CTA label and its stroke-only arrow blue together');
assert.doesNotMatch(html, /<span class="work-card__cta-overlay"/, 'removes the prior overlapping CTA overlay elements');
assert.match(html, /@media\(max-width:700px\)\{[^}]*\.work-card__mobile-summary\{display:block/, 'shows readable project summaries on small screens');
assert.match(html, /\.case-study-cta::before\{display:none\}/, 'removes the obsolete CTA paper fill that overlaps thumbnail artwork');
assert.match(html, /transform:translateY\(-12\.96%\)/, 'hides the duplicate SVG heading above the card artwork');
assert.match(html, /Featured work sections\/work-card-01-zacks\.svg/, 'uses the Zacks exported work card');
assert.match(html, /Featured work sections\/work-card-02-peoplehum\.svg/, 'uses the peopleHum exported work card');
assert.match(html, /Featured work sections\/work-card-03-cosoot\.svg/, 'uses the Cosoot exported work card');
assert.match(html, /Featured work sections\/work-card-04-zenskar\.svg/, 'uses the Zenskar exported work card');
assert.match(html, /Scroll animation\/card_preview\.svg/, 'layers the Zacks preview artwork for scroll motion');
assert.match(html, /Scroll animation\/card_number_badge\.svg/, 'layers the Zacks number badge for scroll motion');
assert.match(html, /Scroll animation\/card_content\.svg/, 'layers the Zacks content artwork for scroll motion');
assert.match(html, /Scroll animation\/card_decorations\.svg/, 'layers the Zacks decorations for scroll motion');
assert.match(html, /class="work-card__layer work-card__layer--preview"/, 'marks the preview as an independently animated layer');
assert.doesNotMatch(html, /work-card__layer-mask/, 'does not place flat cream cover fills over the card');
assert.match(html, /Scroll animation\/card_base\.svg/, 'uses a clean base artwork without animated content baked into it');
assert.doesNotMatch(html, /mask-image:url\("data:image\/svg\+xml/, 'does not create visible rectangular cutouts over the card');
assert.match(html, /--reveal-edge:100%/, 'starts the Zacks preview reveal at its right edge');
assert.match(html, /--reveal-feather:6%/, 'gives the Zacks preview a proportional feather width');
assert.match(html, /mask-image:linear-gradient\(to right,transparent 0,transparent calc\(var\(--reveal-edge\) - var\(--reveal-feather\)\)/, 'uses a moving gradient mask instead of a hard reveal edge');
assert.match(html, /clipPath: 'inset\(0 62\.6% 0 37\.3%\)'/, 'starts the blue tape at its actual center rather than the full SVG canvas center');
assert.match(html, /gsap\.set\(badge, \{ autoAlpha: 1, scale: \.8, rotation: 3 \}\)/, 'keeps the project badge visible from its reduced reference size');
assert.match(html, /\.to\(badge, \{ scale: 1, rotation: 0/, 'grows the visible project badge from 80 to 100 percent');
assert.doesNotMatch(html, /gsap\.set\(master, \{ opacity: \.3/, 'does not expose a dim duplicate master behind the animated layers');
assert.match(html, /ScrollTrigger\.min\.js/, 'loads GSAP ScrollTrigger for the Featured Work pilot');
assert.match(html, /function initZacksWorkCardMotion\(\)/, 'scopes the Zacks card scroll animation');
assert.match(html, /function initWorkCardScaleMotion\(\)/, 'shares one entry and exit scale pattern across every work card');
assert.match(html, /function initWorkCardThumbnailMotion\(\)/, 'shares the Zacks-style thumbnail reveal with the remaining cards');
assert.match(html, /Scroll animation\/card_base_peoplehum\.svg/, 'uses a thumbnail-free PeopleHum base');
assert.match(html, /Scroll animation\/card_base_cosoot\.svg/, 'uses a thumbnail-free Cosoot base');
assert.match(html, /Scroll animation\/card_base_zenskar\.svg/, 'uses a thumbnail-free Zenskar base');
assert.match(html, /work-card__thumbnail-layer/g, 'adds isolated thumbnail reveal layers');
assert.match(html, /work-card__content-layer/g, 'adds isolated content reveal layers');
assert.match(html, /Scroll animation\/card_content_peoplehum\.svg/, 'uses a transparent PeopleHum content layer');
assert.match(html, /Scroll animation\/card_content_cosoot\.svg/, 'uses a transparent Cosoot content layer');
assert.match(html, /Scroll animation\/card_content_zenskar\.svg/, 'uses a transparent Zenskar content layer');
assert.doesNotMatch(html, /work-card--(?:peoplehum|cosoot|zenskar) \.work-card__content-layer\{clip-path:/, 'does not crop the content layers');
assert.match(html, /Scroll animation\/card_decoration_peoplehum\.svg/, 'isolates the PeopleHum decorative clip');
assert.match(html, /Scroll animation\/card_decoration_cosoot\.svg/, 'isolates the Cosoot decorative clip');
assert.match(html, /Scroll animation\/card_decoration_zenskar\.svg/, 'isolates the Zenskar decorative clip');
assert.match(html, /class="work-card__decoration-motion"/g, 'wraps each decorative clip for independent movement');
assert.match(html, /cardSelector: '\.work-card--peoplehum'/, 'configures the PeopleHum thumbnail reveal');
assert.match(html, /cardSelector: '\.work-card--cosoot'/, 'configures the Cosoot thumbnail reveal');
assert.match(html, /cardSelector: '\.work-card--zenskar'/, 'configures the Zenskar thumbnail reveal');
assert.match(html, /clipPath: config\.boundsClip, webkitClipPath: config\.boundsClip/, 'keeps each thumbnail constrained to its authored card region');
assert.match(html, /'--reveal-edge': config\.revealStart/, 'starts every thumbnail mask at its right edge');
assert.match(html, /'--reveal-edge': config\.revealEnd/, 'moves every feathered reveal from right to left');
assert.match(html, /gsap\.set\(content, \{ autoAlpha: 0, y: 32 \}\)/, 'matches the Zacks content starting state');
assert.match(html, /\.to\(content, \{ autoAlpha: 1, y: 0, duration: \.44, ease: 'power2\.out' \}, \.3\)/, 'matches the Zacks content reveal timing and movement');
assert.match(html, /gsap\.set\(decoration, \{ autoAlpha: 0, x: config\.decorationX, y: config\.decorationY, scale: \.86, rotation: config\.decorationRotation, transformOrigin: config\.decorationOrigin \}\)/, 'starts each decorative clip invisibly within its visible runway');
assert.match(html, /autoAlpha: 1,\s+x: config\.overshootX,\s+y: config\.overshootY,\s+scale: 1\.035,\s+rotation: config\.overshootRotation/, 'fades and travels each decorative clip through a small overshoot');
assert.match(html, /duration: \.5,\s+ease: 'power3\.out'/, 'uses a decelerating approach rather than an abrupt edge crossing');
assert.match(html, /\.to\(decoration, \{ x: 0, y: 0, scale: 1, rotation: 0, duration: \.18, ease: 'back\.out\(1\.15\)' \}, \.48\)/, 'settles each decorative clip into its authored position');
assert.match(html, /document\.querySelectorAll\('\.featured-work-cards \.work-card'\)/, 'targets all four featured-work cards');
assert.match(html, /start:\s*'top 92%'/, 'begins each incoming card scale near the lower viewport edge');
assert.match(html, /end:\s*'bottom 8%'/, 'continues each card scale until it leaves the upper viewport area');
assert.match(html, /scale:\s*\.8,\s*transformOrigin:\s*'50% 50%'/, 'starts every incoming card at eighty percent');
assert.match(html, /\.to\(card, \{ scale: 1, duration: \.42/, 'grows incoming cards to full scale');
assert.match(html, /\.to\(card, \{ scale: \.8, duration: \.4/, 'reduces outgoing cards back to eighty percent');
assert.match(html, /start:\s*'top 85%'/, 'starts the Zacks build as it enters the viewport');
assert.match(html, /end:\s*'center center'/, 'finishes the Zacks build near the viewport center');
assert.match(html, /scrub:\s*\.8/, 'scrubs the Zacks build smoothly with scrolling');
assert.match(html, /max-width:\s*700px/, 'uses a static Zacks card on small screens');
assert.match(html, /href="\/work\/zacks"/, 'links the Zacks card to its published case-study route');
assert.match(html, /href="https:\/\/manishgaudportfolio\.framer\.ai\/peoplehum" target="_blank" rel="noopener noreferrer"/, 'links the peopleHum card to the supplied external case study');
assert.match(html, /href="https:\/\/manishgaudportfolio\.framer\.ai\/try-cosoot" target="_blank" rel="noopener noreferrer"/, 'links the Cosoot card to the supplied external case study');
assert.match(html, /href="https:\/\/manishgaudportfolio\.framer\.ai\/zenskar-internship" target="_blank" rel="noopener noreferrer"/, 'links the Zenskar card to the supplied external case study');
assert.match(html, /gsap\.min\.js/, 'loads the local GSAP runtime');
assert.match(html, /id="stage_01_messy_inputs"/, 'provides a target for the messy-input stage');
assert.match(html, /id="stage_02_map_board"/, 'provides a target for the mapping stage');
assert.match(html, /id="stage_03_lowfi_screen"/, 'provides a target for the low-fi stage');
assert.match(html, /id="stage_04_hifi_dashboard"/, 'provides a target for the dashboard stage');
assert.match(html, /id="conveyor_belt_group"/, 'provides a target for the conveyor');
assert.match(html, /class="lamp-bulb"/, 'marks lamps for sequential illumination');
assert.match(html, /Hero illustrations svg\/lamp\.svg/, 'uses the supplied illustrated lamp asset');
assert.match(html, /gsap\.timeline\(/, 'uses a GSAP load timeline');
assert.match(html, /class="screen-outline"/, 'includes an outline construction pass for the screens');
assert.match(html, /function prepareDrawLines\(stageSelector\)/, 'prepares SVG strokes for construction');
assert.match(html, /function getBottomToTopElements\(stageSelector\)/, 'orders construction from bottom to top');
assert.match(html, /function animateStage\(tl, config\)/, 'builds each station in sequence');
assert.match(html, /function animateMessyInput\(tl\)/, 'isolates the first station construction pass');
assert.match(html, /const messyLines = createMessySketchLines\(\)/, 'draws the messy-input overlay before revealing its color layer');
assert.match(html, /function prepareSketchLines\(lines\)/, 'prepares the isolated sketch paths for drawing');
assert.match(html, /\.to\(`\$\{stage\} \.stage-fills`, \{ autoAlpha: 1/, 'resolves each colored station after its strokes');
assert.match(html, /gsap\.set\('\.screen-outline', \{ autoAlpha: 0 \}\)/, 'keeps static stations from rendering their duplicate outline layer');
assert.match(html, /overlayId: 'messy-sketch-overlay'/, 'creates a dedicated line overlay for the messy-input station');
assert.match(html, /cloneNode\(true\)/, 'draws cloned sketch paths independently from the master illustration');
assert.match(html, /minY: 85/, 'excludes the overhead lamp from the messy-input sketch overlay');
assert.match(html, /\.to\(lines, \{ autoAlpha: 0, duration: \.18/, 'removes each temporary sketch as its finished artwork resolves');
assert.match(html, /function createStageSketchLines\(config\)/, 'creates an isolated sketch overlay for each station');
assert.match(html, /function animateSketchStage\(tl, stage, lines\)/, 'applies the sketch-to-artwork handoff to every station');
assert.match(html, /animateSketchStage\(timeline, '#stage_02_map_board', mapLines\)/, 'animates the map station after the messy-input station');
assert.match(html, /animateSketchStage\(timeline, '#stage_03_lowfi_screen', lowfiLines\)/, 'animates the low-fi station after the map station');
assert.match(html, /animateSketchStage\(timeline, '#stage_04_hifi_dashboard', hifiLines\)/, 'animates the dashboard after the low-fi station');
assert.match(html, /excludeRects: \[\{ minX: 890, maxX: 960, minY: 230, maxY: 420 \}\]/, 'keeps the first control pillar out of the map sketch overlay');
assert.match(html, /excludeRects: \[\{ minX: 1315, maxX: 1390, minY: 230, maxY: 420 \}\]/, 'keeps the second control pillar out of the low-fi sketch overlay');
assert.match(html, /!config\.excludeRects\?\.some/, 'filters excluded static scene regions before cloning sketch paths');
assert.match(html, /excludePaths: \['M706\.517 163\.204V195\.847'\]/, 'removes the unwanted top connector from the map sketch overlay');
assert.match(html, /!config\.excludePaths\?\.includes\(element\.getAttribute\('d'\)\)/, 'filters excluded connector paths before cloning');
assert.match(html, /id="outline-illustration"/, 'inlines the supplied full illustration outline');
assert.match(html, /strokeDashoffset/, 'draws SVG strokes with dash offsets');
assert.match(html, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/, 'uses JavaScript reduced-motion handling');
assert.match(html, /family=Manrope/, 'loads Manrope as the body font');
assert.doesNotMatch(html, /Plus Jakarta Sans/, 'does not retain Plus Jakarta Sans');
assert.match(html, /class="page-scroll-progress"/, 'adds a fixed page scroll progress indicator');
assert.match(html, /role="progressbar"/, 'exposes scroll progress semantics to assistive technology');
assert.match(html, /class="page-scroll-progress__bar"/, 'provides a transform-driven progress fill');
assert.match(html, /function initPageScrollProgress\(\)/, 'initializes page scroll progress without React');
assert.match(html, /requestAnimationFrame\(update\)/, 'batches progress updates with the browser paint cycle');
assert.match(html, /aria-valuenow/, 'keeps the accessible progress value current');
assert.doesNotMatch(html, /initHeroHeadlineTextEffect|headline-char/, 'keeps the hero headline static beside the animated illustration');
assert.doesNotMatch(html, /setInterval\(\(\) => setActive/, 'does not advance services on a timer that can drift from the LED wipe');
assert.doesNotMatch(html, /resumeLater|pointerenter.*stopCycle|pointerleave.*resumeLater/, 'does not pause the service loop after hover or click');
assert.match(html, /module\.classList\.remove\('is-active'\)/, 'clears the previous active row before restarting a selected wipe');
assert.match(html, /void selectedModule\.offsetWidth/, 'forces a selected module wipe to restart even when it is already active');
assert.match(html, /selectedModule\.classList\.add\('is-active'\)/, 'reactivates the selected row after resetting its wipe');
assert.match(html, /activeLayer\?\.addEventListener\('animationend'/, 'advances from the active LED animation completion');
assert.match(html, /event\.animationName !== 'service-module-led-wipe' \|\| index !== activeServiceIndex/, 'ignores stale animation completions from previously active modules');
assert.match(html, /setActive\(\(activeServiceIndex \+ 1\) % services\.length\)/, 'wraps the completed module to the next service');
assert.match(html, /module\.addEventListener\('click', \(\) => setActive\(index, \{ directSelection: true \}\)\)/, 'selects a clicked module immediately');
assert.match(html, /\.brand\{flex:0 0 auto;white-space:nowrap\}/, 'keeps the portfolio logo intact in narrow desktop headers');
assert.match(html, /@media\(max-width:719px\)\{\.nav-links,\.nav-cta\{display:none\}\.mobile-menu\{display:grid;min-width:44px;min-height:44px;place-items:center\}\}/, 'uses the compact navigation before the logo can wrap');
assert.match(html, /@media\(min-width:701px\) and \(max-width:1023px\)\{\.page\{height:auto;min-height:0;padding-bottom:clamp\(64px,8vw,80px\)\}\}/, 'removes excessive full-viewport whitespace on tablets');
assert.match(html, /@media\(max-width:700px\)\{\.process-wrap\{width:100%;margin-left:0\}\.process-scene\{width:100%;min-width:0;transform:none\}\.services-switchboard\{width:calc\(100% - 40px\)\}\}/, 'fits the hero and Services illustrations within shared mobile gutters');
assert.match(html, /\.featured-work-section\{overflow-x:clip\}/, 'clips the sticky header mask without creating horizontal page overflow');
assert.match(html, /<section class="about-section" id="about" aria-labelledby="about-title">/, 'adds the semantic About section after Services');
assert.match(renderedText, /I’m Manish, a product designer with an M\.Des from IIT Guwahati\./, 'keeps the approved About introduction');
assert.match(renderedText, /AI-assisted workflows/, 'keeps the approved AI-assisted workflow copy');
assert.match(html, /About me section\/about-visual-column\.svg/, 'uses the supplied CRT visual asset');
assert.doesNotMatch(html, /About me section\/about-tools-strip\.svg/, 'does not duplicate the tools strip already contained in the CRT visual');
assert.match(html, /class="about-section__credentials"/, 'provides the four credibility cards as semantic content');
assert.match(html, /About me section\/about-title-icon\.svg/, 'uses the supplied Figma About heading icon');
assert.match(html, /animation:about-heading-icon-spin 8s linear infinite/, 'rotates the supplied About heading icon continuously');
assert.match(html, /About me section\/about-badge-education\.svg/, 'uses the supplied education badge');
assert.match(html, /About me section\/about-badge-experience\.svg/, 'uses the supplied experience badge');
assert.match(html, /About me section\/about-badge-domains\.svg/, 'uses the supplied domains badge');
assert.match(html, /About me section\/about-badge-ai-workflow\.svg/, 'uses the supplied AI workflow badge');
assert.match(html, /About me section\/Platforms for crt\.svg/, 'adds the supplied CRT platform artwork');
assert.match(html, /About me section\/Tools\.png/, 'uses the supplied perspective-ready tools artwork');
assert.match(html, /<div class="about-crt-screen"[^>]*>\s*<img class="crt-portrait" src="\.\.\/About me section\/crt-portrait-illustrated\.svg"/, 'uses the illustrated portrait as the CRT screen image');
assert.match(html, /class="crt-scanlines" aria-hidden="true"/, 'adds a CRT scanline overlay inside the screen');
assert.match(html, /class="crt-reflection" aria-hidden="true"/, 'adds a CRT reflection overlay inside the screen');
assert.match(html, /class="crt-glitch-lines" aria-hidden="true">\s*<span><\/span>\s*<span><\/span>\s*<span><\/span>/, 'adds three occasional CRT glitch-line overlays');
assert.match(html, /\.about-crt-screen\{[^}]*overflow:hidden[^}]*isolation:isolate/, 'clips all CRT effects inside the portrait mask');
assert.match(html, /\.about-crt-screen\{[^}]*mask:url\("\.\.\/About me section\/crt-portrait-illustrated\.svg"\) center\/100% 100% no-repeat/, 'uses the portrait alpha shape to clip CRT overlays at the exact screen edge');
assert.match(html, /@keyframes crt-screen-reflection/, 'defines the slow CRT glass reflection motion');
assert.match(html, /@keyframes crt-screen-glitch-line/, 'defines occasional horizontal CRT glitch lines');
assert.match(html, /\.about-crt-screen::before,\.about-crt-screen::after\{[^}]*background-image:linear-gradient/, 'adds clipped chromatic image slices to the CRT screen');
assert.match(html, /\.about-crt-screen::before\{[^}]*opacity:\.34[^}]*animation:crt-screen-slice-one 1\.8s infinite steps\(2,end\)/, 'keeps a low-opacity automatic CRT image-slice distortion visibly active');
assert.match(html, /\.about-section__visual:hover \.about-crt-screen::before,[^}]*\.about-section__visual:focus-within \.about-crt-screen::before/, 'activates the first CRT slice on hover or keyboard focus');
assert.match(html, /animation:crt-screen-slice-one \.34s infinite steps\(2,end\)/, 'uses stepped image-slice distortion for the first CRT channel');
assert.match(html, /@keyframes crt-screen-slice-one/, 'defines the first image-slice distortion');
assert.match(html, /@keyframes crt-screen-slice-two/, 'defines the second image-slice distortion');
assert.match(html, /\.crt-scanlines\{[^}]*opacity:\.28/, 'keeps the persistent scanline effect visible at normal viewing size');
assert.match(html, /\.crt-reflection\{[^}]*animation:crt-screen-reflection 7\.5s/, 'starts a visible slow CRT reflection sweep immediately');
assert.match(html, /@keyframes crt-screen-glitch-line\{0%,12%,100%/, 'brings the brief CRT glitch event into the early part of each cycle');
assert.match(html, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.crt-portrait[^}]*animation:none!important/, 'disables CRT portrait animation for reduced motion');
assert.match(html, /<section class="about-section" id="about" aria-labelledby="about-title">\s*<img class="about-section__platforms"/, 'uses the platform as a section-wide background layer');
assert.match(html, /<\/div>\s*<img class="about-section__tools-art"/, 'renders the tools artwork after the content column');
assert.match(html, /\.about-section__visual\{[^}]*left:2\.819%/, 'aligns the CRT visual to the left Figma canvas edge');
assert.match(html, /\.about-section__tools-art\{[^}]*top:75\.5%[^}]*left:53\.6%/, 'places the tools strip slightly lower beside the Figma platform edge');
assert.match(html, /\.about-section__tools-art\{[^}]*width:30vw[^}]*transform:none/, 'uses the supplied tools artwork without additional perspective distortion');
assert.match(html, /\.about-section\{[^}]*aspect-ratio:1920\/1081/, 'uses the Figma About canvas ratio on desktop');
assert.match(html, /\.about-section__visual\{[^}]*left:2\.819%[^}]*top:6%[^}]*width:56\.146%/, 'places the CRT lower while retaining its desktop alignment');
assert.match(html, /\.about-section__platforms\{[^}]*top:34\.4%[^}]*height:99\.54%/, 'compensates for the platform SVG export crop while preserving the Figma perspective');
assert.match(html, /\.about-section__heading\{[^}]*font:600 2\.5vw\//, 'scales the heading from the shared 48px Figma size');
assert.match(html, /\.about-section__content>p:not\(\.about-section__heading\)\{[^}]*font:400 1\.25vw\//, 'scales the Figma 24px About content size');
assert.match(html, /\.about-section__visual\{[^}]*width:clamp\(500px,46vw,900px\)/, 'keeps the desktop CRT illustration at a reduced visual scale');
assert.match(html, /\.about-section__inner\{display:flex;flex-direction:column/, 'uses a content-first responsive About layout');
assert.match(html, /\.about-section__content\{order:1/, 'places About copy and badges before the CRT on smaller screens');
assert.match(html, /\.about-section__visual\{[^}]*order:2/, 'moves the CRT after the About content on smaller screens');
assert.match(html, /\.about-section__tools-art\{order:3/, 'places tools after the CRT in the responsive sequence');
assert.match(html, /\.about-section__tools-art\{[^}]*z-index:3/, 'keeps the tool artwork above the platform layer');
assert.match(html, /\.about-section__platforms\{top:63%;bottom:auto/, 'places the mobile platform behind the tools and CRT stack');
assert.match(html, /\.about-section__actions a,\.about-section__actions button\{[^}]*min-height:44px/, 'keeps About actions touch-accessible');
assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/manishgaudln" target="_blank" rel="noopener noreferrer"[^>]*>View LinkedIn</, 'links the About action to the supplied LinkedIn profile');
assert.match(html, /\.about-section__inner\{grid-template-columns:1fr/, 'stacks the About layout on mobile');
assert.match(html, /@media\(prefers-reduced-motion:reduce\)\{\.about-section/, 'defines an About reduced-motion fallback');
assert.match(html, /<section class="testimonials-section" id="testimonials" aria-labelledby="testimonials-title">/, 'adds a semantic Testimonials section after About');
assert.match(html, /\.testimonials-heading img,\.contact-heading img\{[^}]*animation:section-heading-icon-spin 8s linear infinite/, 'rotates the Testimonials and Contact heading icons consistently');
assert.match(html, /@keyframes section-heading-icon-spin\{to\{transform:rotate\(360deg\)\}\}/, 'uses one shared continuous header-icon rotation');
assert.match(renderedText, /What people say about working with me\./, 'includes the Testimonials subheading');
assert.doesNotMatch(renderedText, /I value collaboration, clarity, and impact\./, 'removes the Testimonials introduction at the user’s request');
assert.match(html, /\.testimonials-subheading\{[^}]*"Manrope",sans-serif/, 'sets the Testimonials subheading in Manrope');
assert.match(html, /\.testimonial-smiley\{[^}]*top:14%/, 'moves the Testimonials smiley up into the header area');
assert.match(html, /<article class="testimonial-card testimonial-card--one">/, 'renders the first testimonial as a semantic paper-note article');
assert.match(html, /<article class="testimonial-card testimonial-card--two">/, 'renders the second testimonial as a semantic paper-note article');
assert.match(html, /<article class="testimonial-card testimonial-card--three">/, 'renders the third testimonial as a semantic paper-note article');
assert.match(renderedText, /Shivangi Khandelwal/, 'includes the supplied PeopleHum testimonial author');
assert.match(renderedText, /Shatrughan Singh/, 'includes the supplied Operon testimonial author');
assert.match(renderedText, /Anusha Rajasekaran/, 'includes the supplied Zenskar testimonial author');
assert.match(html, /class="testimonial-initials"[^>]*>SK</, 'uses initials rather than a person image for the first testimonial');
assert.match(html, /class="testimonial-initials"[^>]*>SS</, 'uses initials rather than a person image for the second testimonial');
assert.match(html, /class="testimonial-initials"[^>]*>AR</, 'uses initials rather than a person image for the third testimonial');
assert.doesNotMatch(renderedText, /Shivangi was senior to Manish|managed Manish directly|All LinkedIn members/, 'omits unnecessary LinkedIn relationship metadata');
assert.match(html, /class="testimonial-smiley" aria-hidden="true"/, 'adds the small decorative smiley doodle');
assert.match(html, /class="testimonial-smiley" aria-hidden="true"><svg[^>]*stroke="currentColor"/, 'uses the supplied outlined smile icon in the brand color');
assert.match(html, /\.testimonial-smiley svg\{[^}]*width:clamp\(58px,6vw,92px\)[^}]*height:clamp\(58px,6vw,92px\)/, 'sizes the smile icon responsively');
assert.doesNotMatch(html, /testimonial-smiley" aria-hidden="true">☺/, 'does not retain the text smiley');
assert.match(html, /class="testimonial-corner-sheet" aria-hidden="true"/, 'adds the subtle dotted paper-corner decoration');
assert.match(renderedText, /More on request/, 'adds the requested closing note as real text');
assert.match(html, /\.testimonial-card:hover\{[^}]*translateY\(-4px\)/, 'lifts testimonial notes subtly on hover');
assert.match(html, /\.testimonials-grid\{grid-template-columns:1fr/, 'stacks testimonial cards on mobile');
assert.match(html, /<section class="contact-section" id="contact" aria-labelledby="contact-title">/, 'adds a semantic Contact section');
assert.match(html, /<div class="contact-heading"><img[^>]*><h2 id="contact-title">Contact<\/h2><\/div>/, 'uses a real Contact section heading beside the icon');
assert.match(html, /\.contact-heading h2\{[^}]*Fraunces,serif/, 'matches Contact heading typography to the other section headings');
assert.match(html, /\.contact-copy \.contact-title\{[^}]*clamp\(26px,2\.4vw,38px\)[^}]*"Manrope",sans-serif/, 'uses a smaller Manrope contact pitch below the section heading');
assert.match(html, /\.contact-copy \.contact-availability\{[^}]*font-weight:400/, 'keeps the availability sentence at the regular body-copy weight');
assert.match(renderedText, /Let’s shape your next product experience\./, 'includes the supplied Contact heading');
assert.match(renderedText, /Open to freelance projects, contract roles, and selected full-time product design opportunities\./, 'includes the availability note');
assert.match(html, /href="mailto:manish\.d\.gaud@gmail\.com"/, 'links the email card to the supplied email address');
assert.match(html, /href="https:\/\/wa\.me\/917523093327" target="_blank" rel="noopener noreferrer"/, 'links the WhatsApp card to the supplied phone number using the India country prefix');
assert.match(html, /href="https:\/\/calendly\.com\/manish-d-gaud\/30min" target="_blank" rel="noopener noreferrer"/, 'links the scheduling card to the supplied Calendly page');
assert.match(html, /class="contact-card contact-card-email"/, 'renders the email contact card as an anchor');
assert.match(html, /class="contact-direct-detail">manish\.d\.gaud@gmail\.com</, 'shows the email address directly on the email card');
assert.match(html, /class="contact-card contact-card-whatsapp"/, 'renders the WhatsApp contact card as an anchor');
assert.match(html, /class="contact-direct-detail">\+91 75230 93327</, 'shows the phone number directly on the WhatsApp card');
assert.match(html, /class="contact-card-icon" aria-hidden="true"><svg[^>]*><path d="M22 16\.92v3/, 'uses a proportionate phone-receiver outline for the WhatsApp and call card');
assert.doesNotMatch(html, /M20 15\.5a3 3 0 0 1-3\.4 3/, 'removes the distorted custom chat-bubble path');
assert.match(html, /class="contact-card contact-card-calendar"/, 'renders the scheduling contact card as an anchor');
assert.match(renderedText, /Open to work/, 'uses the updated concise availability note');
assert.doesNotMatch(renderedText, /Available for selected projects/, 'removes the previous availability note');
assert.match(html, /\.contact-card:hover\{[^}]*translateY\(-4px\)/, 'lifts contact cards subtly on hover');
assert.match(html, /\.contact-cards\{grid-template-columns:1fr/, 'stacks contact cards on mobile');
assert.doesNotMatch(html, /<form\b|<input\b|<textarea\b/, 'does not add a contact form or fake form controls');

console.log('Interface Workshop hero acceptance checks passed.');
