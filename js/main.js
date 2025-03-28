// js/main.js
import { mainNodes, subNodes, subSubNodes } from "./data.js";
import { updateLayout } from "./layout.js";
import { createNodes, drawLegend } from "./nodes.js";
import { animateNodePositions, animateConnectors, animateZoomReset } from "./animation.js";
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

// Initially recalculate layout (with only main nodes)
updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);

// Create the node groups in the SVG.
createNodes(g, mainNodes, subNodes, subSubNodes, config);

// Initially hide sub and sub-sub node groups.
d3.selectAll("g.sub-node-group").style("display", "none");
d3.selectAll("g.subsub-node-group").style("display", "none");

// Utility function: return radius based on node type.
function getRadius(node) {
  if (node.type === "main") return config.mainRadius;
  if (node.type === "sub") return config.subRadius;
  if (node.type === "subsub") return config.subSubRadius;
  return config.subRadius;
}

// Draw initial connectors (for detailLevel 0)
animateConnectors(g, mainNodes, subNodes, subSubNodes, getRadius, currentDetailLevel);

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
 * Updates the diagram when expanding or collapsing nodes.
 * Recalculates layout, sets initial positions for newly revealed nodes to come from their parent's center,
 * animates node group transitions, and redraws connectors.
 */
function updateDiagram(action) {
  // Store the current detail level as previous.
  prevDetailLevel = currentDetailLevel;
  
  // Update detail level based on the action.
  if (action === "expand") {
    currentDetailLevel = Math.min(currentDetailLevel + 1, 2);
  } else if (action === "collapse") {
    currentDetailLevel = Math.max(currentDetailLevel - 1, 0);
  }
  
  // If expanding (i.e. new detail level is higher than previous), set initial positions for new groups.
  if (currentDetailLevel > prevDetailLevel) {
    // When expanding from 0 to 1, set sub node groups' initial transform to their parent's (main node) center.
    if (currentDetailLevel === 1 && prevDetailLevel === 0) {
      d3.selectAll("g.sub-node-group")
        .each(function(d) {
          // Parent ID is first two characters (e.g., "m2" from "m2s1")
          const parentId = d.id.substring(0, 2);
          const parent = mainNodes.find(n => n.id === parentId);
          if (parent) {
            d3.select(this).attr("transform", `translate(${parent.x}, ${parent.y})`);
          }
        });
    }
    // When expanding from 1 to 2, set sub-sub node groups' initial transform to their parent's (sub node) center.
    else if (currentDetailLevel === 2 && prevDetailLevel === 1) {
      d3.selectAll("g.subsub-node-group")
        .each(function(d) {
          // Parent ID is the part before "ss" (e.g., "m2s1" from "m2s1ss1")
          const parentId = d.id.split("ss")[0];
          const parent = subNodes.find(n => n.id === parentId);
          if (parent) {
            d3.select(this).attr("transform", `translate(${parent.x}, ${parent.y})`);
          }
        });
    }
  }
  
  // Set visibility based on current detail level.
  d3.selectAll("g.main-node-group").style("display", "block");
  d3.selectAll("g.sub-node-group").style("display", currentDetailLevel >= 1 ? "block" : "none");
  d3.selectAll("g.subsub-node-group").style("display", currentDetailLevel >= 2 ? "block" : "none");
  
  // Recalculate layout based on the new detail level.
  updateLayout(mainNodes, subNodes, subSubNodes, config, currentDetailLevel);
  
  // Animate node groups to new positions.
  animateNodePositions(g);
  
  // Animate connectors.
  animateConnectors(g, mainNodes, subNodes, subSubNodes, getRadius, currentDetailLevel);
}

// Bind expand/collapse buttons.
const expandButton = d3.select("#expandButton");
const collapseButton = d3.select("#collapseButton");
bindExpandCollapse(expandButton, collapseButton, updateDiagram);
