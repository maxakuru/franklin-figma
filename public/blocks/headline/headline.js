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

/*
 * Headline - v0.0.1
 */

function decorateButtons(el) {
  const buttons = el.querySelectorAll('em a, strong a');
  buttons.forEach((button) => {
    const parent = button.parentElement;
    const buttonType = parent.nodeName === 'STRONG' ? 'accent' : 'outline';
    button.classList.add('con-button', buttonType);
    parent.insertAdjacentElement('afterend', button);
    parent.remove();
  });
  if (buttons.length > 0) {
    buttons[0].closest('p').classList.add('action-area');
  }
}

function decorateText(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    heading.classList.add('heading-XL');
    if (heading.nextElementSibling) {
      heading.nextElementSibling.classList.add('body-S');
    }
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('body-M');
    }
  });
}

const init = (element) => {
  const children = element.querySelectorAll(':scope > div');
  const background = children[0];

  background.classList.add('background');
  const bgHasImg = background.querySelector(':scope img');
  if (!bgHasImg) {
    element.style.background = background.textContent;
    children[0].remove();
  }

  const container = children[children.length - 1];
  container.classList.add('container');
  decorateText(container);
  decorateButtons(container);
};

export default init;
