// js/main.js
import { mainNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { gatherConnectors, drawLegend } from "./nodes.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";
import { animateZoomToBounds } from "./animation.js";

// Layout config
const config = {
  mainStartX: 100,
  mainSpacing: 500,
  centerY: window.innerHeight / 2,
  mainRadius: 50,
  subRadius: 20,
  subSubRadius: 5
};

// currentDetailLevel controls how many layers are visible (0 = main only, 1 = main+sub, etc.)
let currentDetailLevel = 0;
let prevDetailLevel = 0;

// Flag to detect if the user has manually navigated (scroll or drag).
let manualInteraction = false;

// Flatten all nodes, assign each node its depth, store a parent pointer, etc.
let allNodes = [];
function gatherAllNodes(node, depth = 0, parent = null) {
  node.depth = depth;
  node.parent = parent;
  allNodes.push(node);
  node.currentX = 0;
  node.currentY = 0;
  node.expanding = false;
  node.collapsing = false;
  if (node.children) {
    node.children.forEach(child => gatherAllNodes(child, depth + 1, node));
  }
}
mainNodes.forEach(m => gatherAllNodes(m));

// Compute the maximum depth from the data
const maxDepth = Math.max(...allNodes.map(d => d.depth));

// Create the SVG and main group
const svg = d3.select("#map")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight);

const g = svg.append("g");

// Groups for links and nodes
const linkGroup = g.append("g").attr("class", "links");
const nodeGroup = g.append("g").attr("class", "nodes");

// Create empty link selection
let linkSel = linkGroup.selectAll("line.link");

// Node selection
let nodeSel = nodeGroup.selectAll("g.node")
  .data(allNodes, d => d.id)
  .enter()
  .append("g")
  .attr("class", d => `node ${d.role}`)
  .attr("id", d => "node-" + d.id)
  .attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

// Sort nodes so deeper nodes are drawn first (in the background)
nodeSel.sort((a, b) => b.depth - a.depth);

// Circle and text
nodeSel.append("circle")
  .attr("r", d => fullRadius(d));

nodeSel.append("text")
  .attr("dy", d => {
    if (d.depth === 0) return config.mainRadius + 20;
    if (d.depth === 1) return config.subRadius + 20;
    if (d.depth === 2) return config.subSubRadius + 20;
    return 20;
  })
  .attr("text-anchor", "middle")
  .text(d => d.title);

// Draw legend
drawLegend(svg);

// D3 zoom
const zoomBehavior = d3.zoom()
  .on("zoom", event => {
    // If user-initiated, mark manual interaction
    if (event.sourceEvent) {
      manualInteraction = true;
    }
    g.attr("transform", event.transform);
  });
initZoom(svg, g, zoomBehavior);

// Tooltip
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);

// Reset Zoom button
d3.select("#resetZoom").on("click", () => {
  // Re-enable auto zoom
  manualInteraction = false;
  autoZoom();
});

/**
 * Compute the full radius of a node based on its depth.
 */
function fullRadius(d) {
  if (d.depth === 0) return config.mainRadius;
  if (d.depth === 1) return config.subRadius;
  if (d.depth === 2) return config.subSubRadius;
  return Math.max(3, config.subSubRadius - (d.depth - 2));
}

/**
 * Return the bounding box (x, y, width, height) for all final node positions
 * using node.x/node.y plus the node's radius.
 */
function getLayoutBounds() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allNodes.forEach(n => {
    const r = fullRadius(n);
    const left = n.x - r;
    const right = n.x + r;
    const top = n.y - r;
    const bottom = n.y + r;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  });
  return {
    x: minX,
    y: minY,
    width: (maxX - minX),
    height: (maxY - minY)
  };
}

/**
 * autoZoom: if manualInteraction is false, we compute the layout bounds
 * and zoom to fit that bounding box in the view.
 */
function autoZoom() {
  if (!manualInteraction) {
    const bounds = getLayoutBounds();
    // Add a short timeout so layout changes can settle
    setTimeout(() => {
      animateZoomToBounds(svg, zoomBehavior, bounds, 500);
    }, 50);
  }
}

/**
 * refreshDiagram re-runs the layout and link computations.
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
 * updateDiagram(action)
 * Changes currentDetailLevel, sets animation flags for nodes that are expanding or collapsing.
 */
function updateDiagram(action) {
  if (action === "expand") {
    if (currentDetailLevel >= maxDepth) return;
    prevDetailLevel = currentDetailLevel;
    currentDetailLevel = Math.min(currentDetailLevel + 1, maxDepth);
    // For nodes in the new layer, start them at parent's center
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
    // Mark nodes in the layer being collapsed
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
  // Auto zoom if no manual interaction
  autoZoom();
}

// Helper: find a visible ancestor at a given depth
function findParentInChain(node, depthWanted) {
  while (node && node.depth !== depthWanted) {
    node = node.parent;
  }
  return node;
}

// Helper: get the stored "expanded" (full target) position for a node
function getFullPosition(d) {
  if (d.expandedX !== undefined && d.expandedY !== undefined) {
    return { x: d.expandedX, y: d.expandedY };
  }
  return { x: d.x, y: d.y };
}

// Initial layout
refreshDiagram();

// Initialize node positions to final layout positions
allNodes.forEach(n => {
  n.currentX = n.x;
  n.currentY = n.y;
});
nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

// Auto-zoom on load (if no manual interaction yet)
autoZoom();

// Animation loop for smooth transitions
let lastTime = Date.now();
function animate() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  const speed = 5;
  const t = 1 - Math.exp(-speed * dt / 1000);

  // Animate positions toward final layout
  allNodes.forEach(n => {
    n.currentX += (n.x - n.currentX) * t;
    n.currentY += (n.y - n.currentY) * t;
  });

  // Update node positions
  nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

  // Update circle sizes
  nodeSel.select("circle").attr("r", d => {
    if (d.depth <= currentDetailLevel || d.expanding || d.collapsing) {
      return fullRadius(d);
    } else {
      return 0;
    }
  });

  // Update text opacity
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
    if (factor <= 0.5) return 0;
    return (factor - 0.5) / 0.5;
  });

  // Update connector positions
  linkSel
    .attr("x1", d => d.source.currentX)
    .attr("y1", d => d.source.currentY)
    .attr("x2", d => d.target.currentX)
    .attr("y2", d => d.target.currentY);

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bind expand/collapse
bindExpandCollapse(
  d3.select("#expandButton"),
  d3.select("#collapseButton"),
  updateDiagram
);

// Debounce for window resize
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Handle window resize
window.addEventListener("resize", debounce(() => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  svg.attr("width", w).attr("height", h);
  config.centerY = h / 2;
  refreshDiagram();
  autoZoom();
}, 200));
