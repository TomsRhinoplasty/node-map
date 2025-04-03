/**
 * Module for layout computations.
 * @module layout
 */

/**
 * Recursively positions each main node and its descendants.
 * The first main node starts at the configured starting position,
 * and subsequent main nodes are placed to the right of the previous node's rightmost boundary.
 * @param {Array} mainNodes - Array of main nodes.
 * @param {number} detailLevel - Number of layers of children to display (0 = only main, 1 = main+sub, etc.).
 * @param {Object} config - Configuration object with layout settings.
 */
export function updateLayout(mainNodes, detailLevel, config) {
  if (!mainNodes || !Array.isArray(mainNodes) || mainNodes.length === 0) {
    console.warn("No main nodes provided for layout update.");
    return;
  }
  // Reset positions for all nodes to avoid leftover positions from collapsed nodes.
  mainNodes.forEach(m => resetPositions(m));

  // Place the first main node.
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
 * Recursively resets positions (x, y) for a node and all its children.
 * @param {Object} node - The node object.
 */
function resetPositions(node) {
  node.x = 0;
  node.y = 0;
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(c => resetPositions(c));
  }
}

/**
 * Recursively positions a node's children if depth <= detailLevel.
 * If depth > detailLevel, the child is collapsed to the parent's position.
 * @param {Object} node - The parent node.
 * @param {number} depth - Current depth of recursion.
 * @param {number} detailLevel - Maximum depth to expand.
 * @param {Object} config - Configuration object with layout settings.
 */
function placeDescendants(node, depth, detailLevel, config) {
  if (!node.children || node.children.length === 0) return;
  const n = node.children.length;
  node.children.forEach((child, i) => {
    if (depth <= detailLevel) {
      // Expand node: assign position offset from parent.
      child.x = node.x + offsetX(depth);
      // Arrange siblings vertically around parent's y.
      child.y = node.y + (i - (n - 1) / 2) * offsetY(depth);
    } else {
      // Collapse node: align with parent's position.
      child.x = node.x;
      child.y = node.y;
    }
    placeDescendants(child, depth + 1, detailLevel, config);
  });
}

/**
 * Returns the rightmost x-coordinate within a node's subtree.
 * @param {Object} node - The node object.
 * @returns {number} Rightmost x-coordinate.
 */
function getRightmostX(node) {
  let maxX = node.x;
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(c => {
      const childMax = getRightmostX(c);
      if (childMax > maxX) maxX = childMax;
    });
  }
  return maxX;
}

/**
 * Computes horizontal offset for a given depth level.
 * @param {number} depth - The depth level (1 for sub, 2 for sub-sub, etc.).
 * @returns {number} Horizontal offset.
 */
function offsetX(depth) {
  return 400; // Uniform horizontal offset for all depths.
}

/**
 * Computes vertical spacing for sibling nodes at a given depth.
 * @param {number} depth - The depth level.
 * @returns {number} Vertical spacing.
 */
function offsetY(depth) {
  if (depth === 1) return 350;  // Spacing for sub nodes.
  if (depth === 2) return 125;  // Spacing for sub-sub nodes.
  return 80; // Spacing for deeper layers.
}
