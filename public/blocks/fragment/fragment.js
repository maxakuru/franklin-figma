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

import { decorateBlock, loadBlock } from '../../scripts/scripts.js';

const fetchFragment = async (path) => {
  const resp = await fetch(`${path}.plain.html`);
  if (resp.ok) {
    return resp.text();
  }
  return null;
};

const loadFragment = async (fragmentEl) => {
  const path = fragmentEl.querySelector('div > div').textContent;
  const html = await fetchFragment(path);
  if (html) {
    fragmentEl.insertAdjacentHTML('beforeend', html);
    fragmentEl.querySelector('div').remove();

    const blocks = fragmentEl.querySelectorAll('div[class]');
    blocks.forEach((block) => {
      console.log(block);
      decorateBlock(block);
      loadBlock(block, true);
    });

    fragmentEl.classList.add('is-Visible');
  }
};

export default loadFragment;
