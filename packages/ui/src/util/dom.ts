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

const PAGE_WIDTH = 620;
const CELL_PADDING = 20;
const CELL_BORDER_WIDTH = 1;
const CELL_TOTAL_PADDING = (CELL_PADDING * 2) + (CELL_BORDER_WIDTH * 2);
const TABLE_HEADING_BG_COLOR = '#d9ead3';
const TABLE_WRAPPER_WIDTH = 585;
const TABLE_WRAPPER_MARGIN = '0 auto';

/**
 * Calculates the final width/height based on the original aspect ratio and the desired max width/height 
 * @param width The original image width
 * @param height The original image height
 * @param maxWidth The max target width
 * @param maxHeight The max target height
 * @returns 
 */
function calculateAspectRatioFit(width: number, height: number, maxWidth: number, maxHeight: number): number[] {
  if (width > height) {
    if (width > maxWidth) {
      height = height * (maxWidth / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = width * (maxHeight / height);
      height = maxHeight;
    }
  }

  return [width, height];
}

/**
 * Decorate an image for rendering in table in an RTE
 * @param img The image to decorate
 * @param colCount Used to calculate the max-width of the image
 */
function decorateTableImg(img: HTMLImageElement, colCount: number) {
  const url = new URL(img.src);
  const maxWidth = (PAGE_WIDTH - CELL_TOTAL_PADDING) / colCount;

  // Resize the image to fit the column
  const size = calculateAspectRatioFit(img.width, img.height, maxWidth, maxWidth);

  // Keep track of the original img size
  img.setAttribute('data-og-width', img.width.toString());
  img.setAttribute('data-og-height', img.height.toString());

  // Set new image dimensions
  img.width = size[0];
  img.height = size[1];
  img.style.marginLeft = "0";
  img.style.marginTop = "0";

  img.parentElement.replaceWith(img);

  // Remove top margin surrounding image (p)..
  img.parentElement.style.marginTop = '0px';
}

/**
 * Decorate a table column for rendering in a RTE
 * @param td The column
 */
function decorateTd(td: HTMLTableCellElement) {
  td.style.verticalAlign = 'top';
  td.style.padding = "5px 5px 5px 5px";
  td.style.border = "1px solid #000";
  td.style.verticalAlign = "top";
  td.style.overflowWrap = "break-word";
  td.style.overflow = "hidden";
  td.style.marginTop = "0";
  td.style.marginBottom = "0";
  td.style.width = "33%";
}
/**
 * Decorate a table for rendering in a RTE
 * @param table The table
 */
function decorateTable(table: HTMLTableElement) {
  table.style.border = 'none';
  table.style.borderCollapse = 'none';
  table.style.width = '100%';
}

/**
 * Create a table for rendering in an RTE
 * @param data The table data
 * @param blockClasses Block classes
 * @returns Table
 */
export function createTable(data: any, blockClasses: string = '') {
  const table = document.createElement('table');
  decorateTable(table);
  const maxColumns = data.reduce((data: [], max: number) => data.length > max ? data.length : max, 0).length;
  data.forEach((row: any, index: number) => {
    const tr = document.createElement('tr');
    row.forEach((cell: any, cellIndex: number) => {
      const td = document.createElement('td');

      // The first column should be the block name row
      if (index === 0) {
        td.colSpan = maxColumns;
        td.style.backgroundColor = TABLE_HEADING_BG_COLOR;
        tr.style.height = "22.5pt";
        const classes = cell.split(' ');
        const blockName = classes.shift();
        cell = `${blockName}${(blockClasses) ? ` (${blockClasses})` : ''}`;
        // Check if row has less columns than maxColumns, if so than expand last cell
      } else if (cellIndex === row.length - 1 && cellIndex < maxColumns) {
        td.colSpan = maxColumns - cellIndex;
      }

      decorateTd(td);
      if (typeof cell === 'string') {
        td.innerHTML = cell;
      } else if (Array.isArray(cell)) {
        cell.forEach((c) => {
          td.append(c);
        });
      } else {
        td.append(cell);
      }

      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  return table;
}

/**
 * Determine the block name from the serialized name from pipeline
 * @param str The block name returned by the pipeline
 * @returns The actual block name
 */
export function computeBlockName(name: string) {
  return name
    .replace(/\s(.)/g, (s) => s.toUpperCase())
    .replace(/^(.)/g, (s) => s.toUpperCase());
}

/**
 * Creates a section metadata table
 * @param element 
 * @param story 
 */
export function createSectionMetadata(element: HTMLElement, story: any) {
  const data = [['section-metadata']];
  const sectionStyle = story.args.sectionStyles;
  if (sectionStyle) {
    if (typeof sectionStyle === 'string') {
      data.push(['style', sectionStyle]);
    } else if (Array.isArray(sectionStyle)) {
      data.push(['style', sectionStyle.join(', ')]);
    }
  }

  if (story.argTypes) {
    for (const type of Object.values(story.argTypes) as any) {
      const { table } = type;
      if (table && type.name !== 'sectionStyles') {
        const { category } = table;
        if (category && category.toLowerCase() === 'section') {
          const value = story.args[type.name];
          if (typeof value === 'string') {
            data.push([type.name, value]);
          } else if (Array.isArray(value)) {
            data.push([type.name, value.join(', ')]);
          }
        }
      }
    }
  }

  if (data.length > 1) {
    const metadataTable = createTable(data);
    element.prepend(metadataTable);
  }
}

/**
 * Converts a block (div) returned by the pipeline into a table for rendering in an RTE
 * @param element The main element that contains the divs that need to be converted to tables
 * @param blockClasses Block classes to add to the block name (first row)
 */
export function convertBlocksToTables(element: HTMLElement, blockClasses?: string) {
  element.style.width = `${TABLE_WRAPPER_WIDTH}px`;
  element.style.margin = TABLE_WRAPPER_MARGIN;
  element.querySelectorAll('div[class]').forEach((block) => {
    const name = computeBlockName(block.className);
    const data = [[name]];
    const divs = block.querySelectorAll(':scope > div');
    if (divs) {
      divs.forEach((div) => {
        blockClasses && div.classList.add(blockClasses);
        const subDivs = div.querySelectorAll(':scope > div');
        if (subDivs && subDivs.length > 0) {
          const rowData: any[] = [];
          subDivs.forEach((cell) => {
            if (cell.nodeName === 'DIV') {
              const imgs = cell.querySelectorAll('img');
              imgs.forEach((img) => decorateTableImg(img, subDivs.length));
              const cellContent: any[] = [];
              Array.from(cell.childNodes).forEach((c) => cellContent.push(c));
              rowData.push(cellContent);
            }
          });
          data.push(rowData);
        } else {
          data.push([div.innerHTML]);
        }
      });
    }
    const table = createTable(data, blockClasses);
    block.innerHTML = '';
    block.appendChild(table);
  });
}

/**
 * Converts tables to div element similar to how to the pipeline returns tables 
 * @param element The element containing the tables
 * @returns The element with all child tables converted to divs
 */
export function convertTablesToBlocks(element: HTMLElement): string {
  const wrapperDiv = document.createElement('div');
  element.querySelectorAll('table').forEach((table) => {
    table.querySelectorAll('tr:not(:first-of-type)').forEach((row, index) => {
      const rowDiv = document.createElement('div');
      row.querySelectorAll('td').forEach((col) => {
        const colDiv = document.createElement('div');
        col.querySelectorAll('img').forEach((img) => {
          const paragraph = document.createElement('p');
          const picture = document.createElement('picture');
          img.width = Number(img.getAttribute('data-og-width'));
          img.height = Number(img.getAttribute('data-og-height'));
          if (img.parentNode.nodeName === 'TD') {
            img.parentElement.append(picture);
            picture.append(img);
          } else {
            img.parentElement.replaceWith(paragraph);
            paragraph.append(picture);
            picture.append(img);
          }

        });
        Array.from(col.childNodes).forEach((c) => colDiv.append(c));
        rowDiv.appendChild(colDiv);
      });
      wrapperDiv.appendChild(rowDiv);
    });
    table.parentElement.insertAdjacentHTML('afterbegin', wrapperDiv.innerHTML);
    table.remove();
  });
  // Remove wrapped divs from Rich Text editor
  return element.querySelector('div > div').outerHTML;
}