/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

console.log('load form block');

function createSelect(fd) {
  const select = document.createElement('select');
  select.id = fd.id;
  if (fd.placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fd.enum.split(',').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  if (fd.required === 'x') {
    select.setAttribute('required', 'required');
  }
  return select;
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  console.log('POST: ', form.dataset.action);
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  return payload;
}

function createButton(fd) {
  const button = document.createElement('button');
  button.textContent = fd.label;
  button.classList.add('button');
  if (fd.type === 'submit') {
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (form.checkValidity()) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        await submitForm(form);
        if (fd.redirect) {
          window.location.href = fd.redirect;
        } else {
          button.innerText = 'Thank you!';
        }
      }
    });
  }
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.inputType;
  input.id = fd.id;
  if (fd.placeholder) {
    input.setAttribute('placeholder', fd.placeholder);
  }
  if (fd.required === 'x' || fd.required === 'true' || fd.required === true) {
    input.setAttribute('required', 'required');
  }
  return input;
}

async function queryForm(formOrEl, sheet) {
  try {
    const form = formOrEl.closest('form');
    const resp = await fetch(`${form.dataset.action}.json?sheet=${sheet}`);
    return await resp.json();
  } catch (e) {
    console.error('could not fetch rating results: ', e);
    return undefined;
  }
}

function createRating(fd) {
  const fieldsetWrapper = document.createElement('span');
  fieldsetWrapper.className = 'form-rating-set-wrapper';

  const fieldset = document.createElement('fieldset');
  fieldset.classList.add('form-rating-set');

  const input = document.createElement('input');
  input.type = 'number';
  input.id = fd.id;
  input.setAttribute('hidden', true);
  input.setAttribute('min', 1);
  input.setAttribute('max', 5);
  if (fd.required === 'x' || fd.required === 'true') {
    input.setAttribute('required', 'required');
  }
  fieldset.appendChild(input);

  // field set then average rating if there is one
  fieldsetWrapper.appendChild(fieldset);

  /**
   * @type {HTMLSpanElement[]}
   */
  const stars = [];
  const toggleAt = (rating) => {
    input.value = rating + 1;
    stars.forEach((star, i) => {
      if (i <= rating) {
        star.classList.add('checked');
      } else {
        star.classList.remove('checked');
      }
    });
  };

  for (let i = 0; i < 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    fieldset.appendChild(star);

    star.addEventListener('click', () => {
      toggleAt(i);
    });

    stars.push(star);
  }
  return fieldsetWrapper;
}

function lazyLoadRatings(el) {
  console.log('form: ', el);
  // wait until next tick so that ratings is attached to form
  setTimeout(() => {
    (async () => {
      const json = await queryForm(el, 'query');
      console.log('json: ', json);
      if (!json) {
        return;
        // for testing, just set some data
        // json = {data: [{"average":"4","total":"1"}]}
      }

      const { data: [row] } = json;
      console.log('row: ', row);
      let { average, total } = row;
      average = parseFloat(average);
      average = Number.isNaN(average) ? 0 : average;

      total = String.parseInt(total);
      total = Number.isNaN(total) ? 0 : total;

      const results = document.createElement('span');
      results.classList.add('form-rating-results');
      results.innerText = `${average.toFixed(2)}/5 (${total} rating${total === 1 ? '' : 's'})`;
      el.appendChild(results);
    })().catch(console.error.bind(null, 'error lazy loading ratings: '));
  });
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.id;
  input.setAttribute('placeholder', fd.placeholder);
  if (fd.required === 'x' || fd.required === 'true') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function unflattenObject(o) {
  if (!o || typeof o !== 'object') {
    return o;
  }

  o = JSON.parse(JSON.stringify(o));
  for (const [k, v] of Object.entries(o)) {
    const spl = k.split('.');
    let obj = o;
    while (spl.length > 1) {
      const key = spl.shift();
      if (!spl.length) {
        obj[key] = v;
        break;
      }
      if (obj[key] == null) {
        obj[key] = {};
      }
      if (typeof obj[key] !== 'object') {
        break;
      }
      obj = obj[key];
    }
  }
  return o;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.id);
  label.textContent = fd.label;
  if (fd.required === 'x' || fd.required === 'true') {
    label.classList.add('required');
  }
  return label;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    try {
      const { type, condition: { key, operator, value } } = field.rule;
      if (type === 'visible') {
        if (operator === 'eq') {
          if (payload[key] === value) {
            form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
          } else {
            form.querySelector(`.${field.fieldId}`).classList.add('hidden');
          }
        }
      }
    } catch (e) {
      console.warn('Error while applying form rule: ', e);
    }
  });
}

async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  let hasSubmit = false;
  const resp = await fetch(pathname);
  const json = await resp.json();
  const form = document.createElement('form');
  const rules = [];
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  json.data.forEach((fd) => {
    fd = unflattenObject(fd);
    fd.inputType = fd.inputType || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.viewType ? ` form-${fd.viewType}` : '';
    const fieldId = `form-${fd.id}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fd.inputType) {
      case 'select':
        if (fd.viewType === 'rating') {
          fieldWrapper.append(createLabel(fd));
          const ratings = createRating(fd);
          fieldWrapper.append(ratings);
          lazyLoadRatings(ratings);
        } else {
          fieldWrapper.append(createLabel(fd));
          fieldWrapper.append(createSelect(fd));
        }
        break;
      case 'heading':
        fieldWrapper.append(createHeading(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'text-area':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createTextArea(fd));
        break;
      case 'submit':
        hasSubmit = true;
        fieldWrapper.append(createButton(fd));
        break;
      case 'rating': {
        fieldWrapper.append(createLabel(fd));
        const ratings = createRating(fd);
        fieldWrapper.append(ratings);
        lazyLoadRatings(ratings);
        break;
      }
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }

    if (fd.rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.rules) });
      } catch (e) {
        console.log(`Invalid Rule ${fd.rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });

  if (!hasSubmit) {
    // temp: auto append a submit button
    const fieldWrapper = document.createElement('div');
    fieldWrapper.classList.add('form-submit-wrapper', 'field-wrapper');
    fieldWrapper.append(createButton({ label: 'Submit', type: 'submit' }));
    form.append(fieldWrapper);
  }

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);

  return (form);
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  if (form) {
    if (form.innerText.startsWith('/')) {
      form.replaceWith(await createForm(`${window.location.origin}${form.innerText}`));
    } else if (form.innerText.startsWith('../') || form.innerText.startsWith('./')) {
      form.replaceWith(await createForm(`${form.baseURI}${form.innerText}`));
    } else {
      form.replaceWith(await createForm(form.href));
    }
  }
}
