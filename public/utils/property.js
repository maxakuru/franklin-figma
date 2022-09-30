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

const getProperty = (object, objectPath) => {
  const pathArray = objectPath.split('.');
  return pathArray.reduce((acc, part) => acc && acc[part], object);
};

const getObjectProperty = (property, timeout) => new Promise((resolve) => {
  let i = 0;
  const interval = 10;
  const refreshId = setInterval(() => {
    const prop = getProperty(window, property);
    if (prop !== null && typeof prop !== 'undefined') {
      resolve(prop);
      clearInterval(refreshId);
    } else if (i >= timeout) {
      resolve(null);
      clearInterval(refreshId);
    }
    i += interval;
  }, interval);
});

export default getObjectProperty;
