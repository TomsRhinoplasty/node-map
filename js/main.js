// js/main.js
import { mainNodes, subNodes, subSubNodes } from "./data.js";
import { placeSubBranch } from "./layout.js";
import { drawNodes, drawConnection, drawLegend } from "./drawing.js";
import { bindTooltip, initZoom, zoomToFit, bindExpandCollapse } from "./interactions.js";

// Configuration constants (radii, spacing, etc.)
const config = {
  mainRadius: 50,
  subRadius: 20,
  subSubRadius: 5,
  mainTextOffset: 20,
  subTextOffset: 20,
  subSubTextOffset: 20,
  mainStartX: 100,
  mainSpacing: 500,
  subOffsetX: 400,
  subSpacingY: 350,
  subSubOffsetX: 400,
  subSubSpacingY: 125
};

const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("#map").attr("width", width).attr("height", height);
const g = svg.append("g");

// Layout: place main nodes and sub-branches.
mainNodes[0].x = config.mainStartX;
let currentRight = placeSubBranch(mainNodes[0], subNodes, subSubNodes, config);
for (let i = 1; i < mainNodes.length; i++) {
  mainNodes[i].x = currentRight + config.mainSpacing;
  const newRight = placeSubBranch(mainNodes[i], subNodes, subSubNodes, config);
  currentRight = Math.max(currentRight, newRight, mainNodes[i].x);
}

// Draw nodes.
drawNodes(g, mainNodes, subNodes, subSubNodes, config);

// Function to get the radius for a given node.
function getRadius(node) {
  if (node.type === "main") return config.mainRadius;
  if (node.type === "sub") return config.subRadius;
  if (node.type === "subsub") return config.subSubRadius;
  return config.subRadius;
}

// Draw connectors between main nodes (as an example; extend as needed for detail levels).
for (let i = 0; i < mainNodes.length - 1; i++) {
  drawConnection(g, mainNodes[i], mainNodes[i+1], getRadius);
}

// Draw legend.
drawLegend(svg);

// Set up tooltip.
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);

// Set up zoom behavior.
const zoomBehavior = d3.zoom().on("zoom", event => {
  g.attr("transform", event.transform);
});
initZoom(svg, g, zoomBehavior);

// js/main.js (add near the bottom, after setting up zoomBehavior)
d3.select("#resetZoom").on("click", () => {
  zoomToFit(svg, g, zoomBehavior);
});


// Detail level for expand/collapse (0: only main, 1: main+sub, 2: main+sub+subsub).
let currentDetailLevel = 0;
function updateDiagram(action) {
  if (action === "expand") {
    currentDetailLevel = Math.min(currentDetailLevel + 1, 2);
  } else if (action === "collapse") {
    currentDetailLevel = Math.max(currentDetailLevel - 1, 0);
  }
  // Update node visibility.
  d3.selectAll("circle.main-node, text.main-text").style("display", "block");
  d3.selectAll("circle.sub-node, text.sub-text").style("display", currentDetailLevel >= 1 ? "block" : "none");
  d3.selectAll("circle.sub-sub-node, text.subsub-text").style("display", currentDetailLevel >= 2 ? "block" : "none");
  // Remove existing connectors.
  g.selectAll("line.connector").remove();
  // Redraw connectors based on detail level.
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const source = mainNodes[i];
    const target = mainNodes[i+1];
    if (currentDetailLevel === 0) {
      drawConnection(g, source, target, getRadius);
    } else if (currentDetailLevel === 1) {
      const subs = subNodes.filter(n => n.id.startsWith(source.id + "s"));
      if (subs.length > 0) {
        subs.forEach(sub => {
          drawConnection(g, source, sub, getRadius);
          drawConnection(g, sub, target, getRadius);
        });
      } else {
        drawConnection(g, source, target, getRadius);
      }
    } else if (currentDetailLevel === 2) {
      const subs = subNodes.filter(n => n.id.startsWith(source.id + "s"));
      if (subs.length > 0) {
        subs.forEach(sub => {
          const subSubs = subSubNodes.filter(n => n.id.startsWith(sub.id + "ss"));
          drawConnection(g, source, sub, getRadius);
          if (subSubs.length > 0) {
            subSubs.forEach(subsub => {
              drawConnection(g, sub, subsub, getRadius);
              drawConnection(g, subsub, target, getRadius);
            });
          } else {
            drawConnection(g, sub, target, getRadius);
          }
        });
      } else {
        drawConnection(g, source, target, getRadius);
      }
    }
  }
}

const expandButton = d3.select("#expandButton");
const collapseButton = d3.select("#collapseButton");
bindExpandCollapse(expandButton, collapseButton, updateDiagram);
