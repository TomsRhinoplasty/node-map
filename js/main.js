/**
 * Main module that initializes the diagram, sets up event listeners,
 * and orchestrates the interactions between various modules.
 * @module main
 */

import { mainNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { gatherConnectors, drawLegend } from "./nodes.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";
import { animateZoomToBounds } from "./animation.js";
import { config } from "./config.js";

// Global variables and state
let currentDetailLevel = 0;
let prevDetailLevel = 0;
let manualInteraction = false;
let allNodes = [];

/**
 * Recursively gathers all nodes from the hierarchical structure.
 * Each node is assigned its depth and a reference to its parent.
 * @param {Object} node - The node object.
 * @param {number} depth - Current depth level.
 * @param {Object|null} parent - The parent node.
 */
function gatherAllNodes(node, depth = 0, parent = null) {
  node.depth = depth;
  node.parent = parent;
  allNodes.push(node);
  node.currentX = node.x || 0;
  node.currentY = node.y || 0;
  node.expanding = false;
  node.collapsing = false;
  if (node.children) {
    node.children.forEach(child => gatherAllNodes(child, depth + 1, node));
  }
}

// Initialize allNodes from mainNodes
mainNodes.forEach(m => gatherAllNodes(m));

// Compute the maximum depth from all nodes
const maxDepth = Math.max(...allNodes.map(d => d.depth));

// Initialize SVG and main group
const svg = d3.select("#map");
if (svg.empty()) {
  console.error("SVG element with id 'map' not found.");
}
svg.attr("width", window.innerWidth)
   .attr("height", window.innerHeight);

const g = svg.append("g");

// Create groups for links and nodes
const linkGroup = g.append("g").attr("class", "links");
const nodeGroup = g.append("g").attr("class", "nodes");

// Create initial link selection
let linkSel = linkGroup.selectAll("line.link");

// Create node selection and append group elements for each node
let nodeSel = nodeGroup.selectAll("g.node")
  .data(allNodes, d => d.id)
  .enter()
  .append("g")
  .attr("class", d => `node ${d.role}`)
  .attr("id", d => "node-" + d.id)
  .attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

// Ensure deeper nodes are drawn first
nodeSel.sort((a, b) => b.depth - a.depth);

// Append circles and text for each node
nodeSel.append("circle")
  .attr("r", d => computeFullRadius(d));

nodeSel.append("text")
  .attr("dy", d => {
    if (d.depth === 0) return config.mainRadius + 20;
    if (d.depth === 1) return config.subRadius + 20;
    if (d.depth === 2) return config.subSubRadius + 20;
    return 20;
  })
  .attr("text-anchor", "middle")
  .text(d => d.title);

// Draw the legend
drawLegend(svg);

// Set up D3 zoom behavior
const zoomBehavior = d3.zoom()
  .on("zoom", event => {
    if (event.sourceEvent) {
      manualInteraction = true;
    }
    g.attr("transform", event.transform);
  });
initZoom(svg, g, zoomBehavior);

// Bind tooltip events
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);

// Set up Reset Zoom button functionality
d3.select("#resetZoom").on("click", () => {
  manualInteraction = false;
  autoZoom();
});

/**
 * Computes the full radius of a node based on its depth.
 * @param {Object} d - The node object.
 * @returns {number} The computed radius.
 */
function computeFullRadius(d) {
  if (d.depth === 0) return config.mainRadius;
  if (d.depth === 1) return config.subRadius;
  if (d.depth === 2) return config.subSubRadius;
  return Math.max(3, config.subSubRadius - (d.depth - 2));
}

/**
 * Computes the bounding box that contains all nodes.
 * @returns {Object} Bounding box with x, y, width, and height.
 */
function getLayoutBounds() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allNodes.forEach(n => {
    const r = computeFullRadius(n);
    const left = n.x - r;
    const right = n.x + r;
    const top = n.y - r;
    const bottom = n.y + r;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Automatically zooms the SVG to fit all nodes, unless manual interaction has occurred.
 */
function autoZoom() {
  if (!manualInteraction) {
    const bounds = getLayoutBounds();
    setTimeout(() => {
      animateZoomToBounds(svg, zoomBehavior, bounds, 500);
    }, 50);
  }
}

/**
 * Refreshes the diagram by updating layout and connectors.
 */
function refreshDiagram() {
  updateLayout(mainNodes, currentDetailLevel, config);
  const connectors = gatherConnectors(mainNodes, currentDetailLevel);
  linkSel = linkSel.data(connectors, d => d.source.id + "-" + d.target.id);
  linkSel.exit().remove();
  linkSel = linkSel.enter()
    .append("line")
    .attr("class", "link")
    .merge(linkSel);
}

/**
 * Updates the diagram based on the action ("expand" or "collapse").
 * @param {string} action - The action to perform.
 */
function updateDiagram(action) {
  if (action === "expand") {
    if (currentDetailLevel >= maxDepth) return;
    prevDetailLevel = currentDetailLevel;
    currentDetailLevel = Math.min(currentDetailLevel + 1, maxDepth);
    allNodes.forEach(n => {
      if (n.depth === currentDetailLevel) {
        const parent = n.parent;
        if (parent) {
          n.currentX = parent.currentX;
          n.currentY = parent.currentY;
          n.expanding = true;
        }
      }
    });
  } else if (action === "collapse") {
    if (currentDetailLevel <= 0) return;
    prevDetailLevel = currentDetailLevel;
    allNodes.forEach(n => {
      if (n.depth === prevDetailLevel) {
        n.collapsing = true;
        const parent = n.parent;
        if (parent) {
          n.expandedX = n.x;
          n.expandedY = n.y;
          n.x = parent.x;
          n.y = parent.y;
        }
      }
    });
    currentDetailLevel = Math.max(currentDetailLevel - 1, 0);
  }
  refreshDiagram();
  autoZoom();
}

/**
 * Finds the closest ancestor of a node at the specified depth.
 * @param {Object} node - The node object.
 * @param {number} depthWanted - The desired depth.
 * @returns {Object|null} The ancestor node at the desired depth, or null if not found.
 */
function findParentInChain(node, depthWanted) {
  while (node && node.depth !== depthWanted) {
    node = node.parent;
  }
  return node;
}

/**
 * Retrieves the stored expanded position for a node.
 * @param {Object} d - The node object.
 * @returns {Object} Object with x and y coordinates.
 */
function getFullPosition(d) {
  if (d.expandedX !== undefined && d.expandedY !== undefined) {
    return { x: d.expandedX, y: d.expandedY };
  }
  return { x: d.x, y: d.y };
}

// Initial layout rendering.
refreshDiagram();
allNodes.forEach(n => {
  n.currentX = n.x;
  n.currentY = n.y;
});
nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);
autoZoom();

// Animation loop for smooth transitions.
let lastTime = Date.now();
function animate() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  const speed = 5;
  const t = 1 - Math.exp(-speed * dt / 1000);

  // Animate nodes toward their final positions.
  allNodes.forEach(n => {
    n.currentX += (n.x - n.currentX) * t;
    n.currentY += (n.y - n.currentY) * t;
  });

  // Update node positions in the DOM.
  nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

  // Update circle sizes based on current detail level and animation state.
  nodeSel.select("circle").attr("r", d => {
    if (d.depth <= currentDetailLevel || d.expanding || d.collapsing) {
      return computeFullRadius(d);
    } else {
      return 0;
    }
  });

  // Update text opacity based on expansion state.
  nodeSel.select("text").style("opacity", d => {
    if (d.depth === 0) return 1;
    if (d.depth < currentDetailLevel) return 1;
    if (d.depth > currentDetailLevel && !d.expanding && !d.collapsing) return 0;
    const parent = (d.expanding || d.collapsing)
      ? findParentInChain(d, d.depth - 1)
      : findParentInChain(d, currentDetailLevel - 1);
    if (!parent) return 1;
    const dx = d.currentX - parent.x;
    const dy = d.currentY - parent.y;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    const fullPos = d.expanding
      ? getFullPosition(d)
      : (d.collapsing && d.expandedX !== undefined
         ? { x: d.expandedX, y: d.expandedY }
         : getFullPosition(d));
    const fullDistance = Math.sqrt((fullPos.x - parent.x) ** 2 + (fullPos.y - parent.y) ** 2);
    const factor = (fullDistance > 0) ? Math.min(1, currentDistance / fullDistance) : 1;
    return factor <= 0.5 ? 0 : (factor - 0.5) / 0.5;
  });

  // Update connector positions.
  linkSel.attr("x1", d => d.source.currentX)
         .attr("y1", d => d.source.currentY)
         .attr("x2", d => d.target.currentX)
         .attr("y2", d => d.target.currentY);

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bind expand and collapse button events.
bindExpandCollapse(
  d3.select("#expandButton"),
  d3.select("#collapseButton"),
  updateDiagram
);

// Debounce function for handling window resize events.
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Update SVG dimensions and re-render layout on window resize.
window.addEventListener("resize", debounce(() => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  svg.attr("width", w).attr("height", h);
  config.centerY = h / 2;
  refreshDiagram();
  autoZoom();
}, 200));
