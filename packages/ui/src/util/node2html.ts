import MessageBus from "@franklin-figma/messages";

const b64Encode = (bytes: Uint8Array, type = 'image/png'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(new Blob([bytes], { type }));
  });
}

export default async function nodeToHTML(node: SceneNode): Promise<string> {
  const { html, images } = await MessageBus.api.backend.nodeToHTML(node.id);
  console.info('[ui/views/Editor] converted to HTML: ', html, images);

  // insert data urls in place of imgs with hash sources
  const doc = document.createElement('div');
  doc.innerHTML = html;
  const proms = [...(doc.querySelectorAll('img') as unknown as HTMLImageElement[])].map(async (img) => {
    const hash = img.src.split('hash://')[1];
    const bytes = images[hash];

    // to use data urls
    // const blob = new Blob([bytes]);
    // const url = URL.createObjectURL(blob);

    // to use base64 strings
    // const decoder = new TextDecoder('utf8');
    // const encoded = btoa(decoder.decode(bytes));
    const url = await b64Encode(bytes);
    console.log('url: ', url);
    // const encoded = btoa(String.fromCharCode.apply(null, bytes));
    // const url = `data:image/png;base64,${encoded}`;


    img.src = url;
  });
  await Promise.all(proms);
  console.log('adjusted html: ', doc.innerHTML);

  return doc.innerHTML;
}