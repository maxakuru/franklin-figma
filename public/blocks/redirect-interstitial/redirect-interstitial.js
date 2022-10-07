import { readBlockConfig } from '../../scripts/scripts.js';

const ALL_FORMATTERS = {
  capitalize: (s) => {
    return s.split(' ')
      .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

function resolveTemplate(txt, params, formatters) {
  const matches = txt.match(/(?<=\{\{).+?(?=\}\})/g);
  if(!matches) {
    return txt;
  }

  let out = txt;
  matches.forEach((param) => {
    const fs = formatters[param] || [];
    let val = params[param];
    if(!val) {
      return;
    }

    fs.forEach((f) => {
      val = f(val);
    });

    out = out.replaceAll(`{{${param}}}`, val);
  });
  return out;
}

function createFormatters(config) {
  const formatters = {};
  Object.entries(config).forEach(([k, v]) => {
    if(!k.startsWith('format-param-')) return;
    const formatterKeys = v.split(',').map(f => f.trim());
    const param = k.split('format-param-').slice(1).join('-');

    if(!formatters[param]) {
      formatters[param] = [];
    }

    formatterKeys.forEach((formatterKey) => {
      if(!ALL_FORMATTERS[formatterKey]) return;
      formatters[param].push(ALL_FORMATTERS[formatterKey]);
    });
  });

  return formatters;
}

function createOptions(config) {
  return Object.fromEntries(Object.entries(config).filter(([k]) => !k.startsWith('format-param')));
}

function createParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

/**
 * @param {HTMLDivElement} block 
 */
export default function decorate(block) {
  const container = block.querySelector('div > div');
  const config = readBlockConfig(block);
  const formatters = createFormatters(config);
  const params = createParams(config);
  const options = createOptions(config);

  const resolve = (s) => {
    return resolveTemplate(s, params, formatters);
  }

  const content = resolve(container.innerHTML);
  const cancelText = options['cancel-text'];
  const confirmText = options['confirm-text'];
  const cancelLink = decodeURIComponent(resolve(options['cancel-link'] || ''));
  const confirmLink = decodeURIComponent(resolve(options['confirm-link'] || ''));

  block.innerHTML = `
<div class="interstitial">
  ${content}
  <div class="actions">
    <p class="button-container">
      <a class="button primary" href="${confirmLink}">
        ${confirmText ? resolve(confirmText) : 'Continue'}
      </a>
    </p>
    <p class="button-container">
      <a class="button secondary" href="${cancelLink}">
        ${cancelText ? resolve(cancelText) : 'Cancel'}
      </a>
    </p>
  </div>
</div>`;
}