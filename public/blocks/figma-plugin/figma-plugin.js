import { loadCSS, readBlockConfig } from "../../scripts/scripts.js";

export default function decorate(block) {
  const { name } = readBlockConfig(block);
  if(!name) {
    console.error('[figma-plugin] missing name property!');
    return;
  }

  document.body.innerHTML = `<div id="app"></div>`;
  import(`/public/plugin/${name}/index.js`);
  loadCSS(`/public/plugin/${name}/index.css`);
}