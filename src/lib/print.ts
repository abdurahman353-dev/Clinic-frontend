/**
 * Prints HTML content using a hidden iframe instead of a popup window.
 * No new window or tab ever appears — the browser's native print dialog
 * opens directly from the current page context.
 *
 * @param innerHTML   The HTML string to print
 * @param pageSize    'A4' | 'A5'
 * @param extraStyles Additional CSS string
 */
export function printHtml(
  innerHTML: string,
  pageSize: "A4" | "A5" = "A4",
  extraStyles = ""
) {
  // Remove any existing print iframe
  const existing = document.getElementById("__print_frame__");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__print_frame__";

  // Make the iframe completely invisible and non-interactive
  Object.assign(iframe.style, {
    position: "fixed",
    top: "-10000px",
    left: "-10000px",
    width: "1px",
    height: "1px",
    border: "none",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${window.location.origin}/" />
  <title>Print</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: ${pageSize}; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: white;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${extraStyles}
  </style>
</head>
<body>
${innerHTML}
</body>
</html>`);
  doc.close();

  // Wait for all images to load before printing so the logo appears
  const doPrint = () => {
    const images = Array.from(doc.images);
    if (images.length === 0) {
      triggerPrint();
    } else {
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded >= images.length) triggerPrint();
      };
      images.forEach(img => {
        if (img.complete) {
          onLoad();
        } else {
          img.onload = onLoad;
          img.onerror = onLoad; // proceed even if an image fails
        }
      });
      // Safety fallback: print after 1.5s regardless
      setTimeout(triggerPrint, 1500);
    }
  };

  const triggerPrint = (() => {
    let called = false;
    return () => {
      if (called) return;
      called = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (_) {
        // ignore
      }
      setTimeout(() => iframe.remove(), 2000);
    };
  })();

  if (iframe.contentDocument?.readyState === "complete") {
    doPrint();
  } else {
    iframe.onload = doPrint;
    // Fallback timer in case onload doesn't fire
    setTimeout(doPrint, 600);
  }
}

/**
 * Grabs the inner HTML of a DOM element by ID and sends it to the printer.
 */
export function printElementById(
  id: string,
  pageSize: "A4" | "A5" = "A4",
  extraStyles = ""
) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`printElementById: element #${id} not found`);
    return;
  }
  printHtml(el.outerHTML, pageSize, extraStyles);
}
