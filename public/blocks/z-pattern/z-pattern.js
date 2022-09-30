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
 * Z-Pattern - v0.0.1
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

function decorateText(el, size) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const heading = headings[headings.length - 1];
  if (!size) {
    heading.classList.add('heading-XS');
    heading.nextElementSibling.classList.add('body-S');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-M');
    }
  }
  if (size === 'm') {
    heading.classList.add('heading-M');
    heading.nextElementSibling.classList.add('body-S');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-M');
    }
  }
  if (size === 'l') {
    heading.classList.add('heading-L');
    heading.nextElementSibling.classList.add('body-M');
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-L');
    }
  }
}

function getBlockSize(el) {
  if (el.classList.contains('medium')) {
    return 'm';
  } else if (el.classList.contains('large')) {
    return 'l';
  } else {
    return null;
  }
}

function isOdd(num) {
  return num % 2 ? 'z-row-odd' : 'z-row-even';
}

export default function init(block) {
  block.classList.add('container');
  const h1 = block.querySelector('h1');
  if (h1) {
    h1.parentElement.parentElement.classList.add('z-pattern-heading');
    h1.classList.add('heading-L');
  }
  const size = getBlockSize(block);
  const zRows = block.querySelectorAll(':scope > div:not([class])');

  // filter empty row
  // get row count
  const { filter } = Array.prototype;
  let rowCountContentFirst = 0;
  filter.call(zRows, (node) => node.children.length > 0).forEach((row) => {
    const rowFirstChild = row.querySelector(':scope > div:first-child');
    const rowFirstChildHeadline = rowFirstChild.querySelector('h1, h2, h3, h4, h5, h6');
    if (rowFirstChildHeadline) rowCountContentFirst++;
  });

  zRows.forEach((row, i) => {
    if (rowCountContentFirst === 0) {
      row.classList.add(isOdd(i));
    } else {
      const rowFirstChild = row.querySelector(':scope > div:first-child');
      const rowClass = rowFirstChild.querySelector('h1, h2, h3, h4, h5, h6') ? 'z-row-odd' : 'z-row-even';
      row.classList.add(rowClass);
    }
    const text = row.querySelector('h1, h2, h3, h4, h5, h6').closest('div');
    text.classList.add('text');
    const image = row.querySelector(':scope > div:not([class])');
    if (image) {
      image.classList.add('image');
    }
    decorateText(text, size);
    // decorateIcons(text);
    decorateButtons(text);
  });
}
