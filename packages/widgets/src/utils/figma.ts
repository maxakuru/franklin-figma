export function showUI(opts: ShowUIOptions) {
  figma.showUI(
    `<script>
      window.location.href = "${globalThis.UI_ENDPOINT}/plugin/ui";
    </script>`,
    {
      ...opts,
      title: `${opts.title} (AEM Franklin)`
    }
  );
}