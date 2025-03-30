// js/animation.js

/**
 * Helper function to get the current position of a node by reading its group’s transform.
 */
function getCurrentPos(node) {
  let group;
  if (node.type === "main") {
    group = d3.select("#main-node-group-" + node.id);
  } else if (node.type === "sub") {
    group = d3.select("#sub-node-group-" + node.id);
  } else if (node.type === "subsub") {
    group = d3.select("#subsub-node-group-" + node.id);
  }
  if (group.empty()){
      return { x: node.x, y: node.y };
  }
  const transform = group.attr("transform"); // Expected format: translate(x,y)
  const match = /translate\(\s*([^,]+),\s*([^)]+)\)/.exec(transform);
  if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return { x: node.x, y: node.y };
}

/**
 * Compute the final endpoints for a connector based on the current positions of source and target.
 */
function computeEndpoints(d, getRadius) {
  const sourcePos = getCurrentPos(d.source);
  const targetPos = getCurrentPos(d.target);
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const angle = Math.atan2(dy, dx);
  const sourceRadius = getRadius(d.source);
  const targetRadius = getRadius(d.target);
  return {
    startX: sourcePos.x + Math.cos(angle) * sourceRadius,
    startY: sourcePos.y + Math.sin(angle) * sourceRadius,
    endX: targetPos.x - Math.cos(angle) * targetRadius,
    endY: targetPos.y - Math.sin(angle) * targetRadius
  };
}

/**
 * Compute the initial endpoints for a connector so that it appears to "grow" out of the parent's center.
 */
function computeInitialEndpoints(d, getRadius, mainNodes) {
  // Case 1: main → sub
  if (d.source.type === "main" && d.target.type === "sub") {
    const pos = getCurrentPos(d.source);
    return { startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y };
  }
  // Case 2: sub → main
  if (d.source.type === "sub" && d.target.type === "main") {
    const parentId = d.source.id.substring(0, 2);
    const parent = mainNodes.find(n => n.id === parentId);
    if (parent) {
      const pos = getCurrentPos(parent);
      return { startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y };
    }
  }
  // Case 3: sub → subsub
  if (d.source.type === "sub" && d.target.type === "subsub") {
    const pos = getCurrentPos(d.source);
    return { startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y };
  }
  // Case 4: subsub → main
  if (d.source.type === "subsub" && d.target.type === "main") {
    const parentMainId = d.source.id.substring(0, 2);
    const parentMain = mainNodes.find(n => n.id === parentMainId);
    if (parentMain) {
      const pos = getCurrentPos(parentMain);
      return { startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y };
    }
  }
  // Default: return final endpoints immediately.
  return computeEndpoints(d, getRadius);
}

/**
 * Compute an array of connector objects based on the current detail level.
 * Each connector object has a source and target.
 */
function computeConnectors(mainNodes, subNodes, subSubNodes, detailLevel) {
  let connectors = [];
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const source = mainNodes[i];
    const target = mainNodes[i + 1];
    if (detailLevel === 0) {
      connectors.push({ source, target });
    } else if (detailLevel === 1) {
      const subs = subNodes.filter(n => n.id.startsWith(source.id + "s"));
      if (subs.length > 0) {
        subs.forEach(sub => {
          connectors.push({ source, target: sub });
          connectors.push({ source: sub, target });
        });
      } else {
        connectors.push({ source, target });
      }
    } else if (detailLevel === 2) {
      const subs = subNodes.filter(n => n.id.startsWith(source.id + "s"));
      if (subs.length > 0) {
        subs.forEach(sub => {
          const subSubs = subSubNodes.filter(n => n.id.startsWith(sub.id + "ss"));
          connectors.push({ source, target: sub });
          if (subSubs.length > 0) {
            subSubs.forEach(subsub => {
              connectors.push({ source: sub, target: subsub });
              connectors.push({ source: subsub, target });
            });
          } else {
            connectors.push({ source, target: sub });
            connectors.push({ source: sub, target });
          }
        });
      } else {
        connectors.push({ source, target });
      }
    }
  }
  return connectors;
}

/**
 * Animate repositioning of node groups.
 */
export function animateNodePositions(svgGroup, duration = 750) {
  svgGroup.selectAll("g.main-node-group").transition().duration(duration)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  svgGroup.selectAll("g.sub-node-group").transition().duration(duration)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  svgGroup.selectAll("g.subsub-node-group").transition().duration(duration)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
}

/**
 * Animate connectors so that they transition from initial positions (growing out from the parent's center)
 * to their computed final positions. The tween function recomputes endpoints on each tick.
 */
export function animateConnectors(svgGroup, mainNodes, subNodes, subSubNodes, getRadius, detailLevel, duration = 750) {
  const connectorsData = computeConnectors(mainNodes, subNodes, subSubNodes, detailLevel);
  
  // Data join: bind connector data to line elements.
  const lines = svgGroup.selectAll("line.connector")
    .data(connectorsData, d => d.source.id + "-" + d.target.id);
  
  // Remove old connectors.
  lines.exit().remove();
  
  // For new connectors, set initial endpoints.
  const linesEnter = lines.enter().append("line")
    .attr("class", "connector")
    .each(function(d) {
      const init = computeInitialEndpoints(d, getRadius, mainNodes);
      d3.select(this)
        .attr("x1", init.startX)
        .attr("y1", init.startY)
        .attr("x2", init.endX)
        .attr("y2", init.endY);
    });
  
  // Merge and transition all lines to their final positions with a tween that recalculates endpoints.
  linesEnter.merge(lines).transition().duration(duration)
    .tween("attr", function(d) {
      return function(t) {
        const endpoints = computeEndpoints(d, getRadius);
        d3.select(this)
          .attr("x1", endpoints.startX)
          .attr("y1", endpoints.startY)
          .attr("x2", endpoints.endX)
          .attr("y2", endpoints.endY);
      };
    });
}

/**
 * Animate zoom-to-fit using an existing zoomBehavior.
 */
export function animateZoomReset(svg, g, zoomBehavior, duration = 750) {
  const bounds = g.node().getBBox();
  const fullWidth = svg.node().clientWidth;
  const fullHeight = svg.node().clientHeight;
  const scale = Math.min(fullWidth / bounds.width, fullHeight / bounds.height) * 0.9;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const translateX = fullWidth / 2 - scale * centerX;
  const translateY = fullHeight / 2 - scale * centerY;
  svg.transition().duration(duration)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}
