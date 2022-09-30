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

// @ts-check

import { loadScript, readBlockConfig } from '../../scripts/scripts.js';

/**
 * @typedef {import('./googlepicker').Config} Config
 * @typedef {import('./googlepicker').GApi} GApi
 * @typedef {import('./googlepicker').Google} Google
 */

const pickedItems = [];
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';
const BASE_URL = 'https://www.googleapis.com/drive/v3';

function invalidTemplate(message) {
  return `
  <div>
    <p>${message}</p>
  </div>
  `;
}

async function getFile(id, token) {
  const resp = await fetch(`${BASE_URL}/files/${id}?fields=id,name,kind,modifiedTime,size,parents`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    console.error('Failed to get googlepicker file: ', resp, await resp.text());
    return undefined;
  }
  return resp.json();
}

/**
 * @param {HTMLElement} block
 * @param {Config} config
 */
function load(block, config) {
  let tokenClient;
  let pickerReady = false;
  /** @type {GApi} */
  let gapi;
  /** @type {Google} */
  let google;
  let picker;
  let requiredFile;

  block.innerHTML = '<div></div>';

  const openBtn = document.createElement('button');
  openBtn.innerText = 'Open Picker';
  openBtn.disabled = true;
  block.appendChild(openBtn);

  const errMsg = document.createElement('p');
  errMsg.classList.add('hidden', 'msg', 'error');
  block.appendChild(errMsg);

  const validMsg = document.createElement('p');
  errMsg.classList.add('hidden', 'msg', 'valid');
  block.appendChild(validMsg);

  function maybeEnableButtons() {
    if (pickerReady && (tokenClient || config.token)) {
      openBtn.disabled = false;
      // blocked by browser as popup
      // !picker && handleOpenClick();
    }
  }

  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
   */
  function intializePicker() {
    pickerReady = true;
    maybeEnableButtons();
  }

  function gapiLoaded() {
    // @ts-ignore
    ({ gapi, google } = window);

    gapi.load('picker', intializePicker);
  }

  function gisLoaded() {
    // @ts-ignore
    ({ google } = window);

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientid,
      scope: SCOPES,
      callback: '',
    });
    maybeEnableButtons();
  }

  function setError(msg) {
    errMsg.innerText = msg;
    if (msg) {
      errMsg.style.visibility = 'visible';
    } else {
      errMsg.style.visibility = 'hidden';
    }

    return !errMsg;
  }

  function setValidMessage(msg) {
    validMsg.innerText = msg;
    if (msg) {
      validMsg.style.visibility = 'visible';
    } else {
      validMsg.style.visibility = 'hidden';
    }
  }

  function validatePickedItems() {
    if (!config.fileid) {
      return setError();
    }

    const found = pickedItems.find((pi) => pi === config.fileid);
    if (found) {
      return setError();
    }

    const name = requiredFile?.id === config.fileid ? requiredFile.name : config.fileid;
    return setError(`Required file (${name}) not selected.`);
  }

  function pickerCallback(data) {
    picker = undefined;
    console.log('data: ', data);
    if (data.action === google.picker.Action.PICKED) {
      // confirm that the required fileId was picked
      // redirect to success page or show error message
      data.docs.forEach((doc) => {
        pickedItems.push(doc.id);
      });
    }

    if (data.action === 'loaded') {
      return;
    }

    if (validatePickedItems()) {
      if (config.successredirect) {
        const href = config.successredirect.startsWith('http')
          ? config.successredirect
          : `${window.location.origin}${config.successredirect}`;
        window.location.replace(href);
      } else {
        setValidMessage(config.successmessage);
      }
    }
  }

  /**
   *  Create and render a Picker object for searching images.
   */
  async function createPicker() {
    // get file info if defined
    if (config.fileid && !requiredFile) {
      requiredFile = await getFile(config.fileid, config.token);
      console.log('requiredFile: ', requiredFile);
    }

    const view = new google.picker.DocsView();
    view.setIncludeFolders(true);
    view.setSelectFolderEnabled(true);

    if (config.visibletypes) {
      view.setMimeTypes(config.visibletypes);
    }

    // only show folders in picker:
    // view.setMimeTypes('application/vnd.google-apps.folder');

    if (requiredFile && requiredFile.parents && requiredFile.parents.length) {
      view.setParent(requiredFile.parents[requiredFile.parents.length - 1]);
    }

    if (requiredFile && requiredFile.name) {
      view.setQuery(requiredFile.name);
    }

    const builder = new google.picker.PickerBuilder()
      .setSelectableMimeTypes(config.selectabletypes ?? 'application/vnd.google-apps.folder')
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
      .setDeveloperKey(config.apikey)
      .setAppId(config.appid)
      .setOAuthToken(config.token)
      .addView(view)
      .setTitle(config.title ?? 'Select items to share')
      .setSize(window.innerWidth * 0.75, window.innerHeight * 0.75)
      .setCallback(pickerCallback);

    picker = builder.build();
    picker.setVisible(true);
  }

  async function handleOpenClick() {
    if (config.token) {
      await createPicker();
      return;
    }

    tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
        throw response;
      }
      config.token = response.access_token;
      await createPicker();
    };

    if (config.token === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
    // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  openBtn.onclick = handleOpenClick;

  loadScript('https://apis.google.com/js/api.js', gapiLoaded);
  if (!config.token) {
    loadScript('https://accounts.google.com/gsi/client', gisLoaded);
  }
}

/**
 * @param {HTMLElement} block
 * @returns {Config}
 */
function readConfig(block) {
  const config = readBlockConfig(block);
  for (const [k, v] of Object.entries(config)) {
    config[k.replace('-', '')] = v;
  }
  console.log('config: ', config);
  config.appid = config.clientid?.split('-')[0];

  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.substring(1));
  window.location.hash = ''; // clear token to avoid accidental sharing

  config.token = hash.get('t') || url.searchParams.get('t');
  config.fileid = url.searchParams.get('f');
  return config;
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  /** @type {Config} */
  const config = readConfig(block);

  // if (!config.token) {
  //   block.innerHTML = invalidTemplate('Not authorized.');
  // }

  if (!config.clientid) {
    block.innerHTML = invalidTemplate('Missing clientId.');
  } else if (!config.apikey) {
    block.innerHTML = invalidTemplate('Missing apiKey.');
  } else {
    load(block, config);
  }
}
