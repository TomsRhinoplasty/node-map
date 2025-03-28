// js/animation.js

/**
 * Compute the final endpoints for a connector based on source and target nodes.
 */
function computeEndpoints(d, getRadius) {
  const dx = d.target.x - d.source.x;
  const dy = d.target.y - d.source.y;
  const angle = Math.atan2(dy, dx);
  const sourceRadius = getRadius(d.source);
  const targetRadius = getRadius(d.target);
  return {
    startX: d.source.x + Math.cos(angle) * sourceRadius,
    startY: d.source.y + Math.sin(angle) * sourceRadius,
    endX: d.target.x - Math.cos(angle) * targetRadius,
    endY: d.target.y - Math.sin(angle) * targetRadius
  };
}

/**
 * Compute the initial endpoints for a connector so that it appears to "grow" out of the parent.
 * 
 * For connectors that branch off from the base main-to-main connection:
 * - If d.source is a sub node and d.target is a main node, the initial endpoints are set to the parent main node’s center.
 * - Similarly for a sub-sub node to main connection.
 */
function computeInitialEndpoints(d, getRadius, mainNodes) {
  // Case 1: main → sub
  if (d.source.type === "main" && d.target.type === "sub") {
    return { startX: d.source.x, startY: d.source.y, endX: d.source.x, endY: d.source.y };
  }
  // Case 2: sub → main
  if (d.source.type === "sub" && d.target.type === "main") {
    // Assume the parent's id is the first two characters of the sub node's id.
    const parentId = d.source.id.substring(0, 2);
    const parent = mainNodes.find(n => n.id === parentId);
    if (parent) {
      return { startX: parent.x, startY: parent.y, endX: parent.x, endY: parent.y };
    }
  }
  // Case 3: sub → subsub
  if (d.source.type === "sub" && d.target.type === "subsub") {
    return { startX: d.source.x, startY: d.source.y, endX: d.source.x, endY: d.source.y };
  }
  // Case 4: subsub → main
  if (d.source.type === "subsub" && d.target.type === "main") {
    // For subsub nodes, assume parent's main id is the first two characters of the subsub id.
    const parentMainId = d.source.id.substring(0, 2);
    const parentMain = mainNodes.find(n => n.id === parentMainId);
    if (parentMain) {
      return { startX: parentMain.x, startY: parentMain.y, endX: parentMain.x, endY: parentMain.y };
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
 * to their computed final positions.
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
  
  // Merge and transition all lines to their final positions.
  linesEnter.merge(lines).transition().duration(duration)
    .attrTween("x1", function(d) {
      const final = computeEndpoints(d, getRadius).startX;
      const current = +this.getAttribute("x1");
      return d3.interpolateNumber(current, final);
    })
    .attrTween("y1", function(d) {
      const final = computeEndpoints(d, getRadius).startY;
      const current = +this.getAttribute("y1");
      return d3.interpolateNumber(current, final);
    })
    .attrTween("x2", function(d) {
      const final = computeEndpoints(d, getRadius).endX;
      const current = +this.getAttribute("x2");
      return d3.interpolateNumber(current, final);
    })
    .attrTween("y2", function(d) {
      const final = computeEndpoints(d, getRadius).endY;
      const current = +this.getAttribute("y2");
      return d3.interpolateNumber(current, final);
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
