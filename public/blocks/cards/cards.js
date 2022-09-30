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
 * Cards - v0.0.1
 */

function decorateHeadline(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    heading.classList.add('heading-XL');
    if (heading.nextElementSibling) {
      heading.nextElementSibling.classList.add('body-M');
    }
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('detail-M');
    }
  });
}
function decorateText(el) {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    heading.classList.add('heading-XS');
    if (heading.nextElementSibling) {
      heading.nextElementSibling.classList.add('body-S');
    }
    if (heading.previousElementSibling) {
      heading.previousElementSibling.classList.add('body-S');
    }
  });
}

export default function init(el) {
  const children = el.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  if (children.length > 1) {
    children[0].classList.add('background');
    const bgHasImg = children[0].querySelector(':scope img');
    if (!bgHasImg) {
      const bgColor = children[0].textContent;
      el.style.background = bgColor;
      children[0].remove();
    }
  }
  if (children.length > 2) {
    children[1].classList.add('card-header', 'container');
    decorateHeadline(children[1]);
  }
  foreground.classList.add('foreground', 'container');
  const cards = foreground.querySelectorAll(':scope > div');
  cards.forEach((card) => {
    card.classList.add('card');
    const image = card.querySelector(':scope img').closest('p');
    if (image) {
      image.classList.add('featured-image');
    }
  });

  decorateText(foreground);
  // decorateButtons(foreground);
}
