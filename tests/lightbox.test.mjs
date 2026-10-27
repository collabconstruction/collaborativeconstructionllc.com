import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const script = fs.readFileSync(new URL('../js/lightbox.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
const base = fs.readFileSync(new URL('../src/_includes/base.njk', import.meta.url), 'utf8');
const overlayBuild = fs.readFileSync(new URL('../scripts/build-live-overlay.mjs', import.meta.url), 'utf8');

test('every element lightbox.js toggles with the hidden property has a matching [hidden] display:none rule in CSS', () => {
  // A class selector like `.lightbox { display: flex }` beats the UA stylesheet's
  // `[hidden] { display: none }` rule regardless of specificity or source order,
  // because author-origin rules always win over user-agent-origin rules. Setting
  // `el.hidden = true` in JS is therefore silently ineffective unless the stylesheet
  // adds its own `<selector>[hidden] { display: none }` override -- exactly the
  // pattern already used elsewhere in this file for .hp-field, .project-filters and
  // .gallery-arrow. Every selector lightbox.js assigns `.hidden` to must follow it.
  const toggledSelectors = ['.lightbox', '.lightbox__nav'];
  assert.match(script, /overlay\.hidden\s*=/, 'sanity check: overlay.hidden is actually used');
  assert.match(script, /(prevBtn|nextBtn)\.hidden\s*=/, 'sanity check: nav buttons use .hidden');
  for (const sel of toggledSelectors) {
    const escaped = sel.replace(/\./g, '\\.');
    const re = new RegExp(`${escaped}\\[hidden\\]\\s*\\{[^}]*display:\\s*none`);
    assert.match(css, re, `${sel}[hidden] { display: none } must exist or the overlay/arrows stay visible after being "closed"`);
  }
});

test('the lightbox dialog itself never receives a literal hidden attribute, only the nav/overlay toggle it in JS', () => {
  assert.ok(!/lightbox__dialog[^"]*"\s+hidden/.test(script), 'the dialog is always visible while its parent overlay is open');
});

test('lightbox.js is only loaded on the gallery page', () => {
  assert.match(base, /schemaType == "gallery"[\s\S]{0,120}lightbox\.js/);
});

test('the gallery lightbox is included in the protected production overlay', () => {
  // release:prepare publishes _deploy rather than _site. A new local JS file
  // referenced by the built gallery can be missing from _deploy unless the
  // curated overlay explicitly includes it (caught in PR #52 deployment).
  const list = overlayBuild.match(/const OVERLAY = \[([\s\S]*?)\];/)?.[1];
  assert.ok(list, 'protected OVERLAY list must be present');
  assert.match(list, /"js\/lightbox\.js"/, 'release must ship /js/lightbox.js');
});
