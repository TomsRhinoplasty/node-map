// js/animation.js

/**
 * Helper function to get the current position of a node.
 * Now, if the node has a currentX/currentY (set by our animation loop),
 * we use those; otherwise we fall back to the node’s target x and y.
 */
export function getCurrentPos(node) {
  if (node.currentX !== undefined && node.currentY !== undefined) {
    return { x: node.currentX, y: node.currentY };
  }
  return { x: node.x, y: node.y };
}

/**
 * Compute the final endpoints for a connector based on the current positions of source and target.
 */
export function computeEndpoints(d, getRadius) {
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
 * Compute an array of connector objects based on the current detail level.
 * Each connector object has a source and target.
 */
export function computeConnectors(mainNodes, subNodes, subSubNodes, detailLevel) {
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
