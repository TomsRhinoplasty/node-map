/**
 * Main module that initializes the diagram, sets up event listeners,
 * and orchestrates interactions between various modules.
 *
 * This version adds:
 *  - An improved drag-to-delete feature:
 *      • All nodes (including main nodes) may be clicked and held then dragged.
 *      • If a node is dragged more than a set threshold from its drag‑start,
 *        it is deleted. For non‑main nodes, deletion removes the node (and its descendants)
 *        from its parent; for main nodes (depth === 0), it is removed from the main node array.
 *  - Auto zoom/fit that remains active until manual pan/zoom.
 *  - Inline text editing in place:
 *      • Each node displays its title as an SVG text element.
 *      • If a node’s title is empty, we force its text to be a series of non‑breaking
 *        spaces AND we add an invisible rectangle (the edit overlay) of a large default size,
 *        so that there is a comfortable clickable area to trigger inline editing.
 *      • When you double‑click the text (or the overlay), the text is replaced in place
 *        by a foreignObject containing a contenteditable div. As you type, the editor expands
 *        horizontally and remains centered. When editing ends (on blur or Enter), the updated
 *        text is saved (or a non‑breaking space is used if empty), and the foreignObject is removed.
 */

// Constants to control the default empty editing space:
const defaultEmptyText = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"; // 10 non-breaking spaces
const defaultEmptyWidth = 250; // in pixels
const defaultEmptyHeight = 30; // in pixels

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

// Deletion threshold (in pixels).
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

  // Append the SVG text element.
  newNodes.append("text")
    .attr("dy", d => {
      if (d.depth === 0) return config.mainRadius + 20;
      if (d.depth === 1) return config.subRadius + 20;
      if (d.depth === 2) return config.subSubRadius + 20;
      return 20;
    })
    .attr("text-anchor", "middle")
    // If title is empty, show a series of non-breaking spaces.
    .text(d => d.title.trim() === "" ? defaultEmptyText : d.title)
    .style("pointer-events", "all")
    .style("cursor", "text")
    .on("dblclick", function(event, d) {
      event.stopPropagation();
      editInlineText(this, d);
    });

  // Append an invisible rectangle (edit overlay) behind the text.
  newNodes.append("rect")
    .attr("class", "editOverlay")
    .style("fill", "transparent")
    .style("pointer-events", "all")
    .style("cursor", "text")
    .on("dblclick", function(event, d) {
      event.stopPropagation();
      let txt = d3.select(this.parentNode).select("text").node();
      editInlineText(txt, d);
    });

  nodeSel = newNodes.merge(nodeSel);

  // Update the edit overlay dimensions for each node.
  nodeSel.each(function(d) {
    let textElem = d3.select(this).select("text").node();
    let bbox = textElem.getBBox();
    let w = bbox.width;
    let h = bbox.height;
    // If text is empty (only non-breaking spaces), force default dimensions.
    if (d.title.trim() === "") {
      w = defaultEmptyWidth;
      h = defaultEmptyHeight;
    }
    // Center the overlay: since the text element is centered at x=0, overlay x = -w/2.
    d3.select(this).select("rect.editOverlay")
      .attr("x", -w/2)
      .attr("y", bbox.y) // use the text element's y
      .attr("width", w)
      .attr("height", h);
  });

  bindNodeEvents();
  linkSel = linkGroup.selectAll("line.link");
}

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
  updateLayout(currentMapData, currentDetailLevel, config);
  allNodes.forEach(n => {
    if (n.depth > currentDetailLevel && !n.expanding) {
      if (n.parent) {
        n.x = n.parent.x;
        n.y = n.parent.y;
      }
    }
    if (n.depth === 0 && n.isNew) {
      n.currentX = n.x;
      n.currentY = n.y;
    }
  });
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
}

/* ===============================
   Inline Text Editing (In-Place)
   =============================== */
/**
 * Replaces the SVG text element with an inline HTML editor using a foreignObject.
 * The editor appears in place over the text element's area. If the node's text is empty,
 * the editor uses default dimensions (defaultEmptyWidth x defaultEmptyHeight) so that a spacious
 * clickable area is available. As you type, the editor expands dynamically and remains centered.
 * When editing ends (on blur or Enter), the node's title is updated (or a non-breaking space is used if empty),
 * and the foreignObject is removed.
 * @param {SVGTextElement} textElem - The SVG text element being edited.
 * @param {Object} d - The node data.
 */
function editInlineText(textElem, d) {
  const bbox = textElem.getBBox();
  const isEmpty = d.title.trim() === "";
  const width = isEmpty ? defaultEmptyWidth : (bbox.width > 0 ? bbox.width : defaultEmptyWidth);
  const height = isEmpty ? defaultEmptyHeight : (bbox.height > 0 ? bbox.height : defaultEmptyHeight);
  
  // Hide the original text element.
  d3.select(textElem).style("display", "none");
  const parentGroup = d3.select(textElem.parentNode);
  
  // Since the text is centered at x = 0, set editor x so that it is centered.
  const editorX = -width / 2;
  
  // Append a foreignObject for inline editing.
  const foreign = parentGroup.append("foreignObject")
    .attr("x", editorX)
    .attr("y", bbox.y)
    .attr("width", width + 10)
    .attr("height", height + 4)
    .attr("class", "inline-editor");
  
  // Append a contenteditable div inside the foreignObject.
  const div = foreign.append("xhtml:div")
    .attr("contenteditable", "true")
    .style("width", "100%")
    .style("height", "100%")
    .style("outline", "none")
    .style("white-space", "nowrap")
    .style("font", window.getComputedStyle(textElem).font)
    .style("text-align", "center")
    .node();
  
  div.textContent = d.title;
  setTimeout(() => {
    div.focus();
    document.execCommand("selectAll", false, null);
  }, 0);
  
  // Adjust editor width dynamically as you type and keep it centered.
  div.addEventListener("input", function() {
    let newWidth = this.scrollWidth;
    if (newWidth < defaultEmptyWidth) newWidth = defaultEmptyWidth;
    foreign.attr("width", newWidth + 10)
           .attr("x", -newWidth / 2);
  });
  
  function finishEditing() {
    const newText = div.textContent;
    d.title = newText;
    foreign.remove();
    d3.select(textElem)
      .style("display", null)
      .text(newText === "" ? "\u00A0" : newText);
  }
  
  div.addEventListener("blur", finishEditing);
  div.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditing();
    }
  });
}

/* ===============================
   Drag-to-Delete Event Handlers
   =============================== */
function dragStarted(event, d) {
  d.dragging = true;
  d.dragStartX = d.currentX;
  d.dragStartY = d.currentY;
}

function dragged(event, d) {
  d.currentX = event.x;
  d.currentY = event.y;
  d3.select(this).attr("transform", `translate(${d.currentX}, ${d.currentY})`);
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

function dragEnded(event, d) {
  d.dragging = false;
  const dx = d.currentX - d.dragStartX;
  const dy = d.currentY - d.dragStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > deletionThreshold) {
    if (d.depth === 0) {
      currentMapData = currentMapData.filter(node => node.id !== d.id);
    } else {
      removeNodeFromParent(d, d.parent);
    }
    buildAllNodes();
    refreshDiagram();
    initSelections();
  } else {
    d.currentX = d.x;
    d.currentY = d.y;
    d3.select(this).classed("toDelete", false);
  }
}

function removeNodeFromParent(node, parent) {
  if (!parent.children) return;
  parent.children = parent.children.filter(child => child.id !== node.id);
}

/* ===============================
   Utility Functions for Node Appearance
   =============================== */
function computeFullRadius(d) {
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
