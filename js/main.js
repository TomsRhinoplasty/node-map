// js/main.js
import { mainNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { gatherConnectors, drawLegend } from "./nodes.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";
import { animateZoomReset } from "./animation.js";

// Layout config
const config = {
  mainStartX: 100,
  mainSpacing: 500,
  centerY: window.innerHeight / 2,
  mainRadius: 50,
  subRadius: 20,
  subSubRadius: 5
};

// currentDetailLevel controls how many layers are fully visible (0 = main only, 1 = main+sub, etc.)
let currentDetailLevel = 0;
let prevDetailLevel = 0;

// Helper: compute the full (target) radius for a node based on its depth
function fullRadius(d) {
  if (d.depth === 0) return config.mainRadius;
  if (d.depth === 1) return config.subRadius;
  if (d.depth === 2) return config.subSubRadius;
  return Math.max(3, config.subSubRadius - (d.depth - 2));
}

// Flatten all nodes into a single array for data binding/animation,
// and assign each node its depth.
let allNodes = [];
function gatherAllNodes(node, depth = 0) {
  allNodes.push(node);
  node.depth = depth; // store depth
  node.currentX = 0;
  node.currentY = 0;
  // Clear animation flags
  node.expanding = false;
  node.collapsing = false;
  if (node.children) {
    node.children.forEach(child => gatherAllNodes(child, depth + 1));
  }
}
mainNodes.forEach(m => {
  gatherAllNodes(m, 0); // each main node has depth 0
});
// Compute the maximum depth from the data
const maxDepth = Math.max(...allNodes.map(d => d.depth));

// Create the SVG and main group
const svg = d3.select("#map")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight);
const g = svg.append("g");

// Create separate groups so connectors render behind nodes.
const linkGroup = g.append("g").attr("class", "links");
const nodeGroup = g.append("g").attr("class", "nodes");

// Create initial (empty) link selection
let linkSel = linkGroup.selectAll("line.link");

// Create node selection (one group per node)
let nodeSel = nodeGroup.selectAll("g.node")
  .data(allNodes, d => d.id)
  .enter()
  .append("g")
  .attr("class", d => `node ${d.role}`)
  .attr("id", d => "node-" + d.id)
  .attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

// --- Layering adjustment ---
// Sort nodes so that deeper nodes (children) are drawn first (in the background)
nodeSel.sort((a, b) => b.depth - a.depth);

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

// Zoom
const zoomBehavior = d3.zoom().on("zoom", event => {
  g.attr("transform", event.transform);
});
initZoom(svg, g, zoomBehavior);
animateZoomReset(svg, g, zoomBehavior);

// Tooltip
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);

// Reset Zoom button
d3.select("#resetZoom").on("click", () => {
  animateZoomReset(svg, g, zoomBehavior);
});

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
 * Changes currentDetailLevel and sets animation flags for nodes that are expanding or collapsing.
 * Expand does nothing if already at max depth; collapse does nothing if at 0.
 */
function updateDiagram(action) {
  if (action === "expand") {
    if (currentDetailLevel >= maxDepth) return;
    prevDetailLevel = currentDetailLevel;
    currentDetailLevel = Math.min(currentDetailLevel + 1, maxDepth);
    // For nodes in the new layer, start at their parent's center and mark as expanding.
    allNodes.forEach(n => {
      if (n.depth === currentDetailLevel) {
        const parent = findParentInChain(n, currentDetailLevel - 1);
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
    // Mark nodes in the layer being collapsed so that they animate back to their parent's center.
    allNodes.forEach(n => {
      if (n.depth === prevDetailLevel) {
        n.collapsing = true;
        const parent = findParentInChain(n, prevDetailLevel - 1);
        if (parent) {
          // Save fully expanded position for computing collapse progress.
          n.expandedX = n.x;
          n.expandedY = n.y;
          // Set target to parent's position.
          n.x = parent.x;
          n.y = parent.y;
        }
      }
    });
    currentDetailLevel = Math.max(currentDetailLevel - 1, 0);
  }
  refreshDiagram();
}

// Helper: find a visible ancestor at a given depth.
function findParentInChain(node, depthWanted) {
  let current = node;
  while (current && current.depth !== depthWanted) {
    current = getParent(current);
  }
  return current;
}

// Helper: find a node's parent by scanning allNodes.
function getParent(child) {
  for (let n of allNodes) {
    if (n.children && n.children.includes(child)) {
      return n;
    }
  }
  return null;
}

// Helper: get the stored "expanded" (full target) position for a node.
function getFullPosition(d) {
  if (d.expandedX !== undefined && d.expandedY !== undefined) {
    return { x: d.expandedX, y: d.expandedY };
  }
  return { x: d.x, y: d.y };
}

// Initial layout
refreshDiagram();

// Animation loop: smoothly update positions and text opacity; node circles now always render full size.
let lastTime = Date.now();
function animate() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  const speed = 5;
  const t = 1 - Math.exp(-speed * dt / 1000);

  // Animate positions toward their target positions.
  allNodes.forEach(n => {
    n.currentX += (n.x - n.currentX) * t;
    n.currentY += (n.y - n.currentY) * t;
  });

  // Update node positions.
  nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);

  // Update circle sizes:
  // If a node is in a visible layer (d.depth <= currentDetailLevel) or is animating (expanding or collapsing), show it at full size.
  // Otherwise, hide it.
  nodeSel.select("circle").attr("r", d => {
    if (d.depth <= currentDetailLevel || d.expanding || d.collapsing) {
      return fullRadius(d);
    } else {
      return 0;
    }
  });

  // Update text opacity:
  // For nodes at depth 0 or below currentDetailLevel, full opacity.
  // For nodes deeper than currentDetailLevel (and not animating), 0.
  // For nodes exactly at currentDetailLevel (animating), opacity is 0 if factor ≤ 0.5,
  // then increases linearly from 0 to 1 as factor goes from 0.5 to 1.
  nodeSel.select("text").style("opacity", d => {
    if (d.depth === 0) return 1;
    if (d.depth < currentDetailLevel) return 1;
    if (d.depth > currentDetailLevel && !d.expanding && !d.collapsing) return 0;
    const parent = d.expanding || d.collapsing ? findParentInChain(d, d.depth - 1)
                                                 : findParentInChain(d, currentDetailLevel - 1);
    if (!parent) return 1;
    const dx = d.currentX - parent.x;
    const dy = d.currentY - parent.y;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    const fullPos = d.expanding ? getFullPosition(d)
                     : (d.collapsing && d.expandedX !== undefined ? { x: d.expandedX, y: d.expandedY }
                                                                 : getFullPosition(d));
    const fullDistance = Math.sqrt(Math.pow(fullPos.x - parent.x, 2) +
                                   Math.pow(fullPos.y - parent.y, 2));
    const factor = (fullDistance > 0) ? Math.min(1, currentDistance / fullDistance) : 1;
    if (factor <= 0.5) return 0;
    return (factor - 0.5) / 0.5;
  });

  // Update connector positions.
  linkSel
    .attr("x1", d => d.source.currentX)
    .attr("y1", d => d.source.currentY)
    .attr("x2", d => d.target.currentX)
    .attr("y2", d => d.target.currentY);

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bind expand/collapse buttons.
bindExpandCollapse(
  d3.select("#expandButton"),
  d3.select("#collapseButton"),
  updateDiagram
);

// Handle window resize.
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  svg.attr("width", w).attr("height", h);
  config.centerY = h / 2;
  refreshDiagram();
  animateZoomReset(svg, g, zoomBehavior, 500);
});
