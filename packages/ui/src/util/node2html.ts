import MessageBus from "@franklin-figma/messages";
import rootStore from "src/state/stores";

export const base64Encode = (bytes: Uint8Array, type = 'image/png'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(new Blob([bytes], { type }));
  });
}

export const dataURLToBase64 = async (url: string): Promise<string> => {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

export default async function nodeToHTML(node: SceneNode): Promise<string> {
  const { html, images } = await MessageBus.api.backend.nodeToHTML(node.id);
  const imageMap = Object.fromEntries(Object.entries(images).map(([k, bytes]) => [k, { bytes, base64: '' }]));
  console.info('[ui/util/node2html] converted to HTML: ', html, imageMap);

  // insert data urls in place of imgs with hash sources
  const doc = document.createElement('div');
  doc.innerHTML = html;
  const proms = [...(doc.querySelectorAll('img') as unknown as HTMLImageElement[])].map(async (img) => {
    const hash = img.src.split('hash://')[1];
    img.dataset.hash = hash;
    const bytes = imageMap[hash].bytes;

    // to use data urls
    // const blob = new Blob([bytes]);
    // const url = URL.createObjectURL(blob);

    // to use base64 strings
    const url = await base64Encode(bytes);
    // save the base64 string in state, since it's used on copy
    imageMap[hash].base64 = url;

    img.src = url;
  });
  await Promise.all(proms);

  rootStore.setImageMap(imageMap);

  return doc.innerHTML;
}