// js/layout.js

/**
 * Recursively positions each main node and its descendants.
 * mainNodes[i] is placed to the right of the previous main node's rightmost X.
 *
 * detailLevel: how many levels of children to show (0 = only main, 1 = main+sub, etc.).
 */
export function updateLayout(mainNodes, detailLevel, config) {
  // Reset positions for all nodes
  // (We do this so that a collapsed node doesn't remain at some old position.)
  mainNodes.forEach(m => resetPositions(m));

  // Place the first main node
  if (mainNodes.length === 0) return;
  mainNodes[0].x = config.mainStartX;
  mainNodes[0].y = config.centerY;
  placeDescendants(mainNodes[0], 1, detailLevel, config);

  let currentRight = getRightmostX(mainNodes[0]);
  for (let i = 1; i < mainNodes.length; i++) {
    const node = mainNodes[i];
    node.x = currentRight + config.mainSpacing;
    node.y = config.centerY;
    placeDescendants(node, 1, detailLevel, config);
    currentRight = Math.max(currentRight, getRightmostX(node), node.x);
  }
}

/**
 * Recursively sets x,y=0 for a node and all children.
 */
function resetPositions(node) {
  node.x = 0;
  node.y = 0;
  if (node.children) {
    node.children.forEach(c => resetPositions(c));
  }
}

/**
 * placeDescendants:
 * Recursively positions a node's children if depth <= detailLevel.
 * If depth > detailLevel, the child collapses to the parent’s position.
 */
function placeDescendants(node, depth, detailLevel, config) {
  if (!node.children || node.children.length === 0) return;
  const n = node.children.length;
  node.children.forEach((child, i) => {
    if (depth <= detailLevel) {
      // Expand
      child.x = node.x + offsetX(depth);
      // Siblings are stacked vertically around parent's y
      child.y = node.y + (i - (n - 1) / 2) * offsetY(depth);
    } else {
      // Collapse
      child.x = node.x;
      child.y = node.y;
    }
    placeDescendants(child, depth + 1, detailLevel, config);
  });
}

/**
 * Return the rightmost x in a node's entire subtree.
 */
function getRightmostX(node) {
  let maxX = node.x;
  if (node.children) {
    node.children.forEach(c => {
      const childMax = getRightmostX(c);
      if (childMax > maxX) maxX = childMax;
    });
  }
  return maxX;
}

/**
 * Horizontal offset for each new depth (sub, sub-sub, etc.)
 */
function offsetX(depth) {
  if (depth === 1) return 400; // sub offset
  if (depth === 2) return 400; // sub-sub offset
  return 400;                 // deeper layers, same offset
}

/**
 * Vertical spacing for siblings at each depth.
 */
function offsetY(depth) {
  if (depth === 1) return 350;  // sub spacing
  if (depth === 2) return 125;  // sub-sub spacing
  return 80; // deeper levels
}
