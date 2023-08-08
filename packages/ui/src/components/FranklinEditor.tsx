import { convertBlocksToTables } from "../util/dom";
import { useRootStore } from "../state/provider";
import { dataURLToBase64 } from "../util/node2html";

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
    // readonly: true,
    toolbar: true,
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
    const copyHandler = (e: ClipboardEvent) => {
      const div = document.createElement('div');
      div.innerHTML = editor.s.html;
      div.querySelectorAll('img').forEach((img) => {
        const { hash } = img.dataset;
        img.src = store.images[hash].base64;
      });

      e.clipboardData.setData('text/html', div.innerHTML);
      e.clipboardData.setData('text/plain', div.innerHTML);

      e.preventDefault();
    }

    window.addEventListener('copy', copyHandler);
    return () => {
      window.removeEventListener('copy', copyHandler);
    }
  }, [editor]);

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
  }, [editor, html]);

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