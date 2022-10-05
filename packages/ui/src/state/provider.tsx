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


import type { JSX, VNode } from 'preact';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

import type {
  AuthStore, 
  SelectionStore,
  RootStore, 
} from './stores';
import root from './stores';

const StoreContext = createContext<RootStore | undefined>(undefined);

export function RootStoreProvider({ children }: { children: VNode }): JSX.Element {
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
}

export function useRootStore(): RootStore {
  const context = useContext(StoreContext);
  if (typeof context === 'undefined') {
    throw new Error('useRootStore() must be used within RootStoreProvider');
  }
  return context;
}

export function useAuthStore(): AuthStore {
  const { authStore } = useRootStore();
  return authStore;
}

export function useSelectionStore(): SelectionStore {
  const { selectionStore } = useRootStore();
  return selectionStore;
}