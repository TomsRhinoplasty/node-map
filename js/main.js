/**
 * Main module that initializes the diagram, sets up event listeners,
 * and orchestrates interactions between various modules.
 *
 * This version adds an improved drag-to-delete feature:
 * - All nodes (including main nodes) may be click-and-held and dragged.
 * - If a node is dragged more than a set threshold away from its original
 *   connected (drag-start) position, it is marked for deletion.
 *   For non-main nodes, deletion removes the node and its descendants from its parent.
 *   For main nodes (depth === 0), deletion removes the node from the main node array,
 *   causing the connectors on its left to automatically rewire to the next main node.
 *
 * Additionally, auto zoom/fit is active by default until the user manually pans or zooms.
 */

import { mainNodes as defaultMap } from "./data.js";
import { updateLayout } from "./layout.js";
import { gatherConnectors, drawLegend } from "./nodes.js";
import { bindTooltip, initZoom, bindExpandCollapse } from "./interactions.js";
import { animateZoomToBounds } from "./animation.js";
import { config } from "./config.js";

// Use a mutable copy of the default map data.
let currentMapData = JSON.parse(JSON.stringify(defaultMap));
let currentDetailLevel = 0;
let prevDetailLevel = 0;
let manualInteraction = false;
let allNodes = [];

// Deletion threshold (in pixels) – if a node is dragged farther than this distance
// from its drag-start position, it will be deleted.
const deletionThreshold = 100;

// D3 selections.
const svg = d3.select("#map");
if (svg.empty()) {
  console.error("SVG element with id 'map' not found.");
}
svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
const g = svg.append("g");
const linkGroup = g.append("g").attr("class", "links");
const nodeGroup = g.append("g").attr("class", "nodes");
let nodeSel, linkSel;

/* ===============================
   Layout and Data Building
   =============================== */
function gatherAllNodes(node, depth = 0, parent = null) {
  node.depth = depth;
  node.parent = parent;
  allNodes.push(node);
  // Initialize current positions if not already set.
  node.currentX = node.x || 0;
  node.currentY = node.y || 0;
  node.expanding = false;
  node.collapsing = false;
  if (node.children) {
    node.children.forEach(child => gatherAllNodes(child, depth + 1, node));
  }
}

function buildAllNodes() {
  allNodes = [];
  currentMapData.forEach(m => gatherAllNodes(m));
}

/* ===============================
   Node & Link Selections and Binding
   =============================== */
// Build or update the node selection (circles & text) and then bind double-click and drag events.
function initSelections() {
  nodeSel = nodeGroup.selectAll("g.node").data(allNodes, d => d.id);
  nodeSel.exit().remove();
  const newNodes = nodeSel.enter()
    .append("g")
    .attr("class", d => `node ${d.role}`)
    .attr("id", d => "node-" + d.id)
    .attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);
  newNodes.append("circle")
    .attr("r", d => computeFullRadius(d));
  newNodes.append("text")
    .attr("dy", d => {
      if (d.depth === 0) return config.mainRadius + 20;
      if (d.depth === 1) return config.subRadius + 20;
      if (d.depth === 2) return config.subSubRadius + 20;
      return 20;
    })
    .attr("text-anchor", "middle")
    .text(d => d.title);
  nodeSel = newNodes.merge(nodeSel);
  // Bind double-click and drag events.
  bindNodeEvents();
  linkSel = linkGroup.selectAll("line.link");
}

// Bind double-click for node creation and attach the drag-to-delete behavior.
function bindNodeEvents() {
  nodeGroup.selectAll("g.node")
    .on("dblclick", dblclickHandler)
    .call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    );
}

function refreshDiagram() {
  // Compute layout positions using the updated layout algorithm.
  updateLayout(currentMapData, currentDetailLevel, config);
  // For nodes deeper than currentDetailLevel (and not expanding), collapse their positions to their parent's position.
  allNodes.forEach(n => {
    if (n.depth > currentDetailLevel && !n.expanding) {
      if (n.parent) {
        n.x = n.parent.x;
        n.y = n.parent.y;
      }
    }
    // For new main nodes, force currentX/Y to their computed values so they don't animate from (0,0).
    if (n.depth === 0 && n.isNew) {
      n.currentX = n.x;
      n.currentY = n.y;
    }
  });
  // Apply repulsion simulation to visible nodes.
  applyRepulsionToVisibleNodes();
  const connectors = gatherConnectors(currentMapData, currentDetailLevel);
  linkSel = linkSel.data(connectors, d => d.source.id + "-" + d.target.id);
  linkSel.exit().remove();
  linkSel = linkSel.enter()
    .append("line")
    .attr("class", "link")
    .merge(linkSel);
  bindNodeEvents();
}

/* ===============================
   Repulsion Simulation for Visible Nodes
   =============================== */
function applyRepulsionToVisibleNodes() {
  const visibleNodes = allNodes.filter(n => n.depth <= currentDetailLevel);
  if (visibleNodes.length < 2) return;
  const simulation = d3.forceSimulation(visibleNodes)
    .force("repel", d3.forceManyBody().strength(-50))
    .force("attractX", d3.forceX(d => d.x).strength(0.5))
    .force("attractY", d3.forceY(d => d.y).strength(0.5))
    .force("collide", d3.forceCollide(d => computeFullRadius(d) + 5).strength(1))
    .stop();
  for (let i = 0; i < 30; i++) {
    simulation.tick();
  }
}

/* ===============================
   Node Creation (Double-click) Logic
   =============================== */
// When a node is double-clicked, create a new child.
function dblclickHandler(event, parentNode) {
  event.stopPropagation();
  const newId = "new_" + Date.now();
  const newNode = {
    id: newId,
    title: "New Node",
    role: "human",
    desc: "Newly created node.",
    children: []
  };
  if (!parentNode.children) {
    parentNode.children = [];
  }
  parentNode.children.push(newNode);
  if (currentDetailLevel < parentNode.depth + 1) {
    currentDetailLevel = parentNode.depth + 1;
  }
  buildAllNodes();
  refreshDiagram();
  initSelections();
  const newNodeDatum = allNodes.find(n => n.id === newId);
  if (newNodeDatum) {
    newNodeDatum.expanding = true;
    newNodeDatum.currentX = parentNode.x;
    newNodeDatum.currentY = parentNode.y;
  }
  const newNodeSelection = nodeGroup.select(`#node-${newId}`);
  if (!newNodeSelection.empty()) {
    newNodeSelection.raise();
  }
  // Do not reset manualInteraction here so that if the user has manually zoomed/panned,
  // auto zoom remains off.
}

/* ===============================
   Drag-to-Delete Event Handlers
   =============================== */

/**
 * Called when a node drag starts.
 * Records the drag-start position and sets a dragging flag.
 */
function dragStarted(event, d) {
  d.dragging = true;
  d.dragStartX = d.currentX;
  d.dragStartY = d.currentY;
}

/**
 * Called while dragging the node.
 * Updates its current position and adds the "toDelete" class if the displacement
 * from the drag-start exceeds the threshold.
 */
function dragged(event, d) {
  d.currentX = event.x;
  d.currentY = event.y;
  d3.select(this).attr("transform", `translate(${d.currentX}, ${d.currentY})`);
  
  // Calculate displacement from drag start.
  const dx = d.currentX - d.dragStartX;
  const dy = d.currentY - d.dragStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > deletionThreshold) {
    d.toDelete = true;
    d3.select(this).classed("toDelete", true);
  } else {
    d.toDelete = false;
    d3.select(this).classed("toDelete", false);
  }
}

/**
 * Called when the drag ends.
 * If the drag displacement exceeds the threshold, the node is deleted.
 * For non-main nodes, it is removed from its parent's children; for main nodes,
 * it is removed from the main node array.
 * Otherwise, the node snaps back to its computed layout position.
 * In all cases, the dragging flag is cleared.
 */
function dragEnded(event, d) {
  d.dragging = false;
  const dx = d.currentX - d.dragStartX;
  const dy = d.currentY - d.dragStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > deletionThreshold) {
    if (d.depth === 0) {
      // Main node deletion.
      currentMapData = currentMapData.filter(node => node.id !== d.id);
    } else {
      // Non-main node deletion.
      removeNodeFromParent(d, d.parent);
    }
    buildAllNodes();
    refreshDiagram();
    initSelections();
  } else {
    // Snap back to computed layout position.
    d.currentX = d.x;
    d.currentY = d.y;
    d3.select(this).classed("toDelete", false);
  }
}

/**
 * Helper function: Removes the given node from its parent's children array.
 */
function removeNodeFromParent(node, parent) {
  if (!parent.children) return;
  parent.children = parent.children.filter(child => child.id !== node.id);
}

/* ===============================
   Utility Functions for Node Appearance
   =============================== */
function computeFullRadius(d) {
  // For new main nodes, animate growth.
  if (d.isNew) {
    d.growthProgress = (d.growthProgress || 0) + 0.05;
    if (d.growthProgress >= 1) {
      d.growthProgress = 1;
      d.isNew = false;
    }
    return computeStandardRadius(d) * d.growthProgress;
  }
  if (d.depth <= currentDetailLevel || d.expanding || d.collapsing) {
    return computeStandardRadius(d);
  } else {
    return 0;
  }
}

function computeStandardRadius(d) {
  if (d.depth === 0) return config.mainRadius;
  if (d.depth === 1) return config.subRadius;
  if (d.depth === 2) return config.subSubRadius;
  return Math.max(3, config.subSubRadius - (d.depth - 2));
}

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

/* ===============================
   Auto Zooming and Animation
   =============================== */
/*
  Auto zoom/fit is active by default until the user manually pans or zooms.
  Once manual interaction is detected via mouse wheel or drag on the background,
  auto zoom is turned off until the "Reset Zoom" button is used.
*/
function autoZoom() {
  if (!manualInteraction) {
    const bounds = getLayoutBounds();
    setTimeout(() => {
      animateZoomToBounds(svg, zoomBehavior, bounds, 500);
    }, 50);
  }
}

let lastTime = Date.now();
function animate() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  const speed = 5;
  const t = 1 - Math.exp(-speed * dt / 1000);
  
  // Update positions only for nodes not being actively dragged.
  allNodes.forEach(n => {
    if (!n.dragging) {
      n.currentX += (n.x - n.currentX) * t;
      n.currentY += (n.y - n.currentY) * t;
    }
  });
  
  nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);
  nodeSel.select("circle").attr("r", d => computeFullRadius(d));
  nodeSel.select("text").style("opacity", d => (d.depth <= currentDetailLevel ? 1 : 0));
  
  linkSel.attr("x1", d => d.source.currentX)
         .attr("y1", d => d.source.currentY)
         .attr("x2", d => d.target.currentX)
         .attr("y2", d => d.target.currentY);
  
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

const zoomBehavior = d3.zoom()
  .on("zoom", event => {
    if (event.sourceEvent) {
      manualInteraction = true;
    }
    g.attr("transform", event.transform);
  });
initZoom(svg, g, zoomBehavior);
svg.on("dblclick.zoom", null);
const tooltip = d3.select("#tooltip");
bindTooltip(g, tooltip);
d3.select("#resetZoom").on("click", () => {
  manualInteraction = false;
  autoZoom();
});
bindExpandCollapse(
  d3.select("#expandButton"),
  d3.select("#collapseButton"),
  updateDiagram
);

/* ===============================
   Menu Button Event Bindings
   =============================== */
document.getElementById("newMapButton").addEventListener("click", () => {
  if (confirm("Creating a new map will clear the current one. Continue?")) {
    reloadDiagram(newMap());
  }
});
document.getElementById("saveMapButton").addEventListener("click", saveMap);
document.getElementById("loadMapButton").addEventListener("click", showMapLibrary);
document.getElementById("closeModal").addEventListener("click", closeModal);

/* ===============================
   Update Diagram on Expand/Collapse
   =============================== */
function updateDiagram(action) {
  if (action === "expand") {
    if (currentDetailLevel >= Math.max(...allNodes.map(d => d.depth))) return;
    prevDetailLevel = currentDetailLevel;
    currentDetailLevel = Math.min(currentDetailLevel + 1, Math.max(...allNodes.map(d => d.depth)));
    allNodes.forEach(n => {
      if (n.depth === currentDetailLevel) {
        const parent = n.parent;
        if (parent) {
          n.currentX = parent.currentX;
          n.currentY = parent.currentY;
          n.expanding = true;
        }
      }
      if (n.depth > currentDetailLevel) {
        n.expanding = false;
        n.collapsing = false;
      }
    });
    const visibleNodes = allNodes.filter(n => n.depth <= currentDetailLevel);
    if (visibleNodes.length > 1) {
      const sim = d3.forceSimulation(visibleNodes)
        .force("repel", d3.forceManyBody().strength(-50))
        .force("attractX", d3.forceX(d => d.x).strength(0.5))
        .force("attractY", d3.forceY(d => d.y).strength(0.5))
        .force("collide", d3.forceCollide(d => computeFullRadius(d) + 5).strength(1))
        .stop();
      for (let i = 0; i < 30; i++) {
        sim.tick();
      }
    }
    nodeSel.sort((a, b) => {
      const aVisible = a.depth <= currentDetailLevel;
      const bVisible = b.depth <= currentDetailLevel;
      if (aVisible && !bVisible) return -1;
      if (!aVisible && bVisible) return 1;
      return a.depth - b.depth;
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
    nodeSel.sort((a, b) => {
      const aVisible = a.depth <= currentDetailLevel;
      const bVisible = b.depth <= currentDetailLevel;
      if (aVisible && !bVisible) return 1;
      if (!aVisible && bVisible) return -1;
      return b.depth - a.depth;
    });
  }
  refreshDiagram();
  autoZoom();
}

/* ===============================
   Map Library and New Map Functions
   =============================== */
function newMap() {
  return [
    {
      id: "new1",
      title: "New Map",
      role: "human",
      desc: "A brand new map.",
      children: []
    }
  ];
}

function reloadDiagram(newMapData) {
  currentMapData = newMapData;
  currentDetailLevel = 0;
  nodeGroup.selectAll("*").remove();
  linkGroup.selectAll("*").remove();
  buildAllNodes();
  refreshDiagram();
  initSelections();
  allNodes.forEach(n => {
    n.currentX = n.x;
    n.currentY = n.y;
  });
  nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);
  manualInteraction = false;
  autoZoom();
}

function saveMap() {
  const name = prompt("Enter a name for your map:", "My Map " + new Date().toLocaleString());
  if (name) {
    const mapKey = "map_" + Date.now();
    const mapData = {
      name: name,
      data: currentMapData
    };
    localStorage.setItem(mapKey, JSON.stringify(mapData));
    alert("Map saved!");
  }
}

function showMapLibrary() {
  const mapListDiv = document.getElementById("mapList");
  mapListDiv.innerHTML = "";
  const defaultOption = document.createElement("div");
  defaultOption.className = "mapItem";
  defaultOption.textContent = "Default Map";
  defaultOption.addEventListener("click", () => {
    reloadDiagram(JSON.parse(JSON.stringify(defaultMap)));
    closeModal();
  });
  mapListDiv.appendChild(defaultOption);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("map_")) {
      const mapData = JSON.parse(localStorage.getItem(key));
      const mapItem = document.createElement("div");
      mapItem.className = "mapItem";
      mapItem.textContent = mapData.name;
      mapItem.addEventListener("click", () => {
        reloadDiagram(mapData.data);
        closeModal();
      });
      mapListDiv.appendChild(mapItem);
    }
  }
  document.getElementById("mapLibraryModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("mapLibraryModal").classList.add("hidden");
}

// When double-clicking on the background, add a new main node.
// Note: We do not reset the manualInteraction flag here so that if the user has manually adjusted the view,
// that state is preserved.
svg.on("dblclick", function(event) {
  if (event.target === svg.node()) {
    const newId = "new_" + Date.now();
    const newMainNode = {
      id: newId,
      title: "New Main Node",
      role: "human",
      desc: "New main node.",
      children: [],
      isNew: true,
      growthProgress: 0
    };
    currentMapData.push(newMainNode);
    buildAllNodes();
    refreshDiagram();
    initSelections();
    autoZoom();
  }
});

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.addEventListener("resize", debounce(() => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  svg.attr("width", w).attr("height", h);
  config.centerY = h / 2;
  refreshDiagram();
  autoZoom();
}, 200));

buildAllNodes();
initSelections();
refreshDiagram();
allNodes.forEach(n => {
  n.currentX = n.x;
  n.currentY = n.y;
});
nodeSel.attr("transform", d => `translate(${d.currentX}, ${d.currentY})`);
drawLegend(svg);
autoZoom();
