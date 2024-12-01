// This script extracts gradients from Figma layers and formats them as needed
figma.showUI(__html__, { width: 300, height: 400 });

// Function to handle gradient extraction
async function extractGradients(node) {
  const fills = node.fills;
  if (!fills || !Array.isArray(fills)) return null;

  for (const fill of fills) {
    if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL") {
      const colors = fill.gradientStops.map((stop) => {
        const { r, g, b, a } = stop.color;
        return `rgba(${Math.round(r * 255)}, ${Math.round(
          g * 255
        )}, ${Math.round(b * 255)}, ${a})`;
      });

      const stops = fill.gradientStops.map((stop) => stop.position);

      return {
        background: colors,
        backgroundStops: stops,
      };
    }
  }
  return null;
}

// Function to process the selection in Figma
figma.ui.onmessage = async (msg) => {
  if (msg.type === "extract-gradients") {
    const selectedNodes = figma.currentPage.selection;
    if (selectedNodes.length === 0) {
      figma.notify("Please select at least one element with a gradient");
      return;
    }

    const results = [];
    for (const node of selectedNodes) {
      if (
        node.type === "RECTANGLE" ||
        node.type === "ELLIPSE" ||
        node.type === "TEXT" ||
        node.type === "FRAME" ||
        node.type === "VECTOR" ||
        node.type === "GROUP"
      ) {
        const gradientData = await extractGradients(node);
        if (gradientData) {
          results.push({
            name: node.name,
            background: gradientData.background,
            backgroundStops: gradientData.backgroundStops,
          });
        }
      }
    }

    figma.ui.postMessage({ type: "gradient-data", gradients: results });
  }
};

// UI code to show the extracted gradients
figma.ui.on("message", async (message) => {
  if (message.type === "get-gradient") {
    const selected = figma.currentPage.selection;
    if (selected.length === 0) {
      figma.notify("No layer selected");
      return;
    }

    const gradients = await Promise.all(selected.map(extractGradients));
    const formattedGradients = gradients.filter(Boolean);

    figma.ui.postMessage({
      type: "gradient-response",
      data: formattedGradients,
    });
  }
});
