// js/main.js
import { mainNodes, subNodes, subSubNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { createNodes, drawLegend } from "./nodes.js";
import { computeEndpoints, computeConnectors, animateZoomReset } from "./animation.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";

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

const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("#map").attr("width", width).attr("height", height);
const g = svg.append("g");

// Detail level: 0 = only main nodes, 1 = main+sub, 2 = main+sub+subsub.
let currentDetailLevel = 0;
let prevDetailLevel = currentDetailLevel;  // to track previous state

// --- Helper Functions for Continuous Animation --- //

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// For each visible node, continuously interpolate currentX/Y toward target x/y.
function updateNodes(nodes, level) {
  nodes.forEach(n => {
    // Only update nodes that are visible at this detail level.
    if (level <= currentDetailLevel) {
      if (n.currentX === undefined) {
        n.currentX = n.x;
        n.currentY = n.y;
      }
      // Interpolate using a factor based on elapsed time.
      // You can adjust the speed by modifying the factor.
      const t = 0.1; // a fixed interpolation factor (0.1 per frame yields a smooth transition)
      n.currentX = lerp(n.currentX, n.x, t);
      n.currentY = lerp(n.currentY, n.y, t);
      // Update the corresponding DOM element.
      let selector;
      if (level === 0) selector = "#main-node-group-" + n.id;
      else if (level === 1) selector = "#sub-node-group-" + n.id;
      else if (level === 2) selector = "#subsub-node-group-" + n.id;
      d3.select(selector).attr("transform", `translate(${n.currentX},${n.currentY})`);
    }
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

// --- End Helper Functions for Continuous Animation --- //


// Initially recalculate layout (with only main nodes)
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

/**
 * updateDiagram(action)
 * This function updates the target positions for nodes based on expand/collapse actions.
 * It uses the predetermined layout rules.
 *
 * For EXPAND:
 *   - Increase detail level.
 *   - For the newly added layer, set the node’s current position to its parent's center.
 *   - Then update the layout so that each node’s target (x,y) is recalculated.
 *
 * For COLLAPSE:
 *   - For the deepest layer, set the target (x,y) for each node to its parent's center.
 *   - Then update the layout (after a short delay if desired) and reduce the detail level.
 */
function updateDiagram(action) {
  prevDetailLevel = currentDetailLevel;
  if (action === "expand") {
    currentDetailLevel = Math.min(prevDetailLevel + 1, 2);
    // For newly added layer, initialize current positions at parent's center.
    if (currentDetailLevel === 1) {
      subNodes.forEach(n => {
        // If not already visible (from previous level 0)
        if (prevDetailLevel < 1) {
          const parentId = n.id.substring(0, 2);
          const parent = mainNodes.find(m => m.id === parentId);
          if (parent) {
            n.currentX = parent.x;
            n.currentY = parent.y;
          }
        }
      });
      // Ensure sub-node groups are set to display.
      d3.selectAll("g.sub-node-group").style("display", "block");
    } else if (currentDetailLevel === 2) {
      subSubNodes.forEach(n => {
        if (prevDetailLevel < 2) {
          const parentId = n.id.split("ss")[0];
          const parent = subNodes.find(s => s.id === parentId);
          if (parent) {
            n.currentX = parent.x;
            n.currentY = parent.y;
          }
        }
      });
      d3.selectAll("g.subsub-node-group").style("display", "block");
    }
    // Recalculate layout so that target positions (n.x, n.y) are set.
    updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  } else if (action === "collapse") {
    // For collapse, set the target positions of the deepest layer to their parent's center.
    if (prevDetailLevel === 2) {
      subSubNodes.forEach(n => {
        const parentId = n.id.split("ss")[0];
        const parent = subNodes.find(s => s.id === parentId);
        if (parent) {
          n.x = parent.x;
          n.y = parent.y;
        }
      });
      // Leave subsub groups visible until the animation brings them to parent's center.
    } else if (prevDetailLevel === 1) {
      subNodes.forEach(n => {
        const parentId = n.id.substring(0, 2);
        const parent = mainNodes.find(m => m.id === parentId);
        if (parent) {
          n.x = parent.x;
          n.y = parent.y;
        }
      });
    }
    // Update detail level after setting targets.
    currentDetailLevel = Math.max(prevDetailLevel - 1, 0);
    updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  }
  // Update display of groups based on new detail level.
  d3.selectAll("g.main-node-group").style("display", "block");
  d3.selectAll("g.sub-node-group").style("display", currentDetailLevel >= 1 ? "block" : "none");
  d3.selectAll("g.subsub-node-group").style("display", currentDetailLevel >= 2 ? "block" : "none");
  // Connectors will be updated continuously.
}

// Bind expand/collapse buttons.
const expandButton = d3.select("#expandButton");
const collapseButton = d3.select("#collapseButton");
bindExpandCollapse(expandButton, collapseButton, updateDiagram);

/**
 * Continuous Animation Loop
 * This function runs every frame and updates all visible nodes and connectors
 * by interpolating their current positions toward their target positions.
 */
let lastTime = Date.now();
function updateAnimation() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  // For a smooth animation, we use a fixed interpolation factor (t).
  // You can adjust this factor (e.g., 0.1) for faster or slower easing.
  updateNodes(mainNodes, 0);
  updateNodes(subNodes, 1);
  updateNodes(subSubNodes, 2);
  updateConnectors();
  requestAnimationFrame(updateAnimation);
}
requestAnimationFrame(updateAnimation);
