import { mainNodes, subNodes, subSubNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { createNodes } from "./nodes.js";
import { computeEndpoints, computeConnectors, animateZoomReset } from "./animation.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";
import { drawLegend } from "./nodes.js";

// Configuration constants
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

let width = window.innerWidth;
let height = window.innerHeight;
const svg = d3.select("#map").attr("width", width).attr("height", height);
const g = svg.append("g");

// Detail level: 0 = only main nodes, 1 = main+sub, 2 = main+sub+subsub.
let currentDetailLevel = 0;
let prevDetailLevel = currentDetailLevel;  // to track previous state

// Helper: linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Update nodes with time-based interpolation
function updateNodes(nodes, dt) {
  const speed = 5; // adjustable speed factor
  const t = 1 - Math.exp(-speed * dt / 1000);
  nodes.forEach(n => {
    if (n.currentX === undefined) {
      n.currentX = n.x;
      n.currentY = n.y;
    }
    n.currentX = lerp(n.currentX, n.x, t);
    n.currentY = lerp(n.currentY, n.y, t);
    let selector = "";
    if (n.type === "main") selector = "#main-node-group-" + n.id;
    else if (n.type === "sub") selector = "#sub-node-group-" + n.id;
    else if (n.type === "subsub") selector = "#subsub-node-group-" + n.id;
    d3.select(selector).attr("transform", `translate(${n.currentX},${n.currentY})`);
  });
}

// Update connectors continuously based on nodes' current positions.
function updateConnectors() {
  const connectorsData = computeConnectors(mainNodes, subNodes, subSubNodes, currentDetailLevel);
  const lines = g.selectAll("line.connector")
    .data(connectorsData, d => d.source.id + "-" + d.target.id);
  lines.enter()
    .append("line")
    .attr("class", "connector")
    .merge(lines)
    .attr("x1", d => computeEndpoints(d, getRadius).startX)
    .attr("y1", d => computeEndpoints(d, getRadius).startY)
    .attr("x2", d => computeEndpoints(d, getRadius).endX)
    .attr("y2", d => computeEndpoints(d, getRadius).endY);
  lines.exit().remove();
}

// Utility: return radius based on node type.
function getRadius(node) {
  if (node.type === "main") return config.mainRadius;
  if (node.type === "sub") return config.subRadius;
  if (node.type === "subsub") return config.subSubRadius;
  return config.subRadius;
}

// Initial layout calculation
updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);

// Create the node groups in the SVG.
createNodes(g, mainNodes, subNodes, subSubNodes, config);

// Initially hide sub and sub‑sub node groups.
d3.selectAll("g.sub-node-group").style("display", "none");
d3.selectAll("g.subsub-node-group").style("display", "none");

// Draw initial connectors (for detailLevel 0)
updateConnectors();

// Draw legend.
drawLegend(svg);

// Set up zoom behavior.
const zoomBehavior = d3.zoom().on("zoom", event => {
  g.attr("transform", event.transform);
});
initZoom(svg, g, zoomBehavior);
animateZoomReset(svg, g, zoomBehavior);

// Bind tooltip.
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);

// Bind reset zoom button.
d3.select("#resetZoom").on("click", () => {
  animateZoomReset(svg, g, zoomBehavior);
});

/**
 * Updates node positions based on expand/collapse actions.
 */
function updateDiagram(action) {
  prevDetailLevel = currentDetailLevel;
  if (action === "expand") {
    currentDetailLevel = Math.min(prevDetailLevel + 1, 2);
    if (currentDetailLevel === 1) {
      subNodes.forEach(n => {
        if (prevDetailLevel < 1) {
          const parent = mainNodes.find(m => m.id === n.parent);
          if (parent) {
            n.currentX = parent.x;
            n.currentY = parent.y;
          }
        }
      });
      d3.selectAll("g.sub-node-group").style("display", "block");
    } else if (currentDetailLevel === 2) {
      subSubNodes.forEach(n => {
        if (prevDetailLevel < 2) {
          const parent = subNodes.find(s => s.id === n.parent);
          if (parent) {
            n.currentX = parent.x;
            n.currentY = parent.y;
          }
        }
      });
      d3.selectAll("g.subsub-node-group").style("display", "block");
    }
    updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  } else if (action === "collapse") {
    if (prevDetailLevel === 2) {
      subSubNodes.forEach(n => {
        const parent = subNodes.find(s => s.id === n.parent);
        if (parent) {
          n.x = parent.x;
          n.y = parent.y;
        }
      });
    } else if (prevDetailLevel === 1) {
      subNodes.forEach(n => {
        const parent = mainNodes.find(m => m.id === n.parent);
        if (parent) {
          n.x = parent.x;
          n.y = parent.y;
        }
      });
    }
    currentDetailLevel = Math.max(prevDetailLevel - 1, 0);
    updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  }
  d3.selectAll("g.main-node-group").style("display", "block");
  d3.selectAll("g.sub-node-group").style("display", currentDetailLevel >= 1 ? "block" : "none");
  d3.selectAll("g.subsub-node-group").style("display", currentDetailLevel >= 2 ? "block" : "none");
}

// Bind expand/collapse buttons.
const expandButton = d3.select("#expandButton");
const collapseButton = d3.select("#collapseButton");
bindExpandCollapse(expandButton, collapseButton, updateDiagram);

// Continuous Animation Loop.
let lastTime = Date.now();
function updateAnimation() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  updateNodes(mainNodes, dt);
  updateNodes(subNodes, dt);
  updateNodes(subSubNodes, dt);
  updateConnectors();
  requestAnimationFrame(updateAnimation);
}
requestAnimationFrame(updateAnimation);

// Handle window resize.
window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  animateZoomReset(svg, g, zoomBehavior, 500);
});
