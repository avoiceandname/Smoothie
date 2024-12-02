// This script extracts gradients from Figma layers and formats them as needed
figma.showUI(__html__, { width: 600, height: 900 });

// Function to handle gradient extraction
async function extractGradients(node) {
  const gradients = {};

  // Extract fill gradients
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (
        fill.type === "GRADIENT_LINEAR" ||
        fill.type === "GRADIENT_RADIAL" ||
        fill.type === "GRADIENT_ANGULAR" ||
        fill.type === "GRADIENT_DIAMOND"
      ) {
        const colors = fill.gradientStops.map((stop) => {
          const { r, g, b, a } = stop.color;
          return `rgba(${Math.round(r * 255)}, ${Math.round(
            g * 255
          )}, ${Math.round(b * 255)}, ${a})`;
        });

        const stops = fill.gradientStops.map((stop) => stop.position);

        let gradientDirection = null;
        if (fill.type === "GRADIENT_LINEAR") {
          const { x: startX, y: startY } = fill.gradientTransform[0];
          const { x: endX, y: endY } = fill.gradientTransform[1];
          gradientDirection =
            Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        }

        gradients.fill = {
          background: colors,
          backgroundStops: stops,
          type: fill.type,
          direction: gradientDirection,
        };
      }
    }
  }

  // Extract stroke gradients
  if (node.strokes && Array.isArray(node.strokes)) {
    for (const stroke of node.strokes) {
      if (
        stroke.type === "GRADIENT_LINEAR" ||
        stroke.type === "GRADIENT_RADIAL" ||
        stroke.type === "GRADIENT_ANGULAR" ||
        stroke.type === "GRADIENT_DIAMOND"
      ) {
        const colors = stroke.gradientStops.map((stop) => {
          const { r, g, b, a } = stop.color;
          return `rgba(${Math.round(r * 255)}, ${Math.round(
            g * 255
          )}, ${Math.round(b * 255)}, ${a})`;
        });

        const stops = stroke.gradientStops.map((stop) => stop.position);

        let gradientDirection = null;
        if (stroke.type === "GRADIENT_LINEAR") {
          const { x: startX, y: startY } = stroke.gradientTransform[0];
          const { x: endX, y: endY } = stroke.gradientTransform[1];
          gradientDirection =
            Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        }

        gradients.stroke = {
          background: colors,
          backgroundStops: stops,
          type: stroke.type,
          direction: gradientDirection,
        };
      }
    }
  }

  return Object.keys(gradients).length > 0 ? gradients : null;
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
            fill: gradientData.fill || null,
            stroke: gradientData.stroke || null,
          });
        }
      }
    }

    figma.ui.postMessage({ type: "gradient-data", gradients: results });
  }
};

// Improved UI for gradient extraction (move to ui.html)
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
