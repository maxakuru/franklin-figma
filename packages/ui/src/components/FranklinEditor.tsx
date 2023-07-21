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

import { convertBlocksToTables, createSectionMetadata, convertTablesToBlocks } from "../util/dom";
import { useRootStore } from "../state/provider";

import type { FunctionalComponent } from 'preact';
import { useState, useRef, useEffect } from 'preact/compat';
import type { Jodit as JoditT } from 'jodit';
// @ts-ignore
import { Jodit } from "jodit/es2021/jodit";

import '../../node_modules/jodit/es2021/jodit.min.css';

export interface FranklinEditorProps {
  html: string;
}

/**
 * Rich text editor for rendering and updated content for helix. 
 */
export const FranklinEditor: FunctionalComponent<FranklinEditorProps> = ({
  html = '',
}) => {
  const store = useRootStore();
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [content, setContent] = useState('');
  const [config, setConfig] = useState({
    width: '100%',
    height: 'auto',
    readonly: true,
    toolbar: false,
    zIndex: -1,
    preset: "inline",
    theme: store.theme === 'dark' ? 'dark' : 'default'
  });
  const [editor, setEditor] = useState<JoditT>();

  const makeEditor = () => {
    const inst = Jodit.make('#editor', config);
    setEditor(inst);
  }

  useEffect(() => {
    if(!containerRef.current || !editorRef.current){
      return;
    }
    makeEditor();
  }, [containerRef]);

  useEffect(() => {
    const theme = store.theme === 'dark' ? 'dark' : 'light';
    setConfig({
      ...config,
      theme
    });

    if(!editor) {
      return;
    }
    makeEditor();
  }, [store.theme]);

  useEffect(() => {
    if(!editor) {
      return;
    }

    const elem = document.createElement('div');
    elem.innerHTML = html;
    convertBlocksToTables(elem);
    setContent(elem.innerHTML);
  }, [editor]);

  useEffect(() => {
    if(!editor) {
      return;
    }

    editor.value = content;
  }, [content]);

  return <div ref={containerRef}>
    <textarea id="editor" name="editor" ref={editorRef}></textarea>
  </div>;
}