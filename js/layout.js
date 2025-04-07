/**
 * Module for layout computations.
 * @module layout
 */

/**
 * Recursively positions each main node and its descendants.
 * Main nodes are arranged horizontally with a starting x position and spacing,
 * while children are positioned dynamically based on computed subtree heights.
 * @param {Array} mainNodes - Array of main nodes.
 * @param {number} detailLevel - Number of layers of children to display (0 = only main, 1 = main+sub, etc.).
 * @param {Object} config - Configuration object with layout settings.
 */
export function updateLayout(mainNodes, detailLevel, config) {
  if (!mainNodes || !Array.isArray(mainNodes) || mainNodes.length === 0) {
    console.warn("No main nodes provided for layout update.");
    return;
  }
  
  // Reset positions for all main nodes.
  mainNodes.forEach(m => resetPositions(m));
  
  // Place main nodes horizontally.
  let currentX = config.mainStartX;
  mainNodes.forEach(node => {
    node.x = currentX;
    node.y = config.centerY;
    // Compute subtree heights for this node (up to the detail level).
    computeSubtreeHeight(node, detailLevel);
    // Assign positions (both x and y) for children dynamically.
    assignPositions(node, node.y, detailLevel);
    // Update horizontal coordinate for the next main node based on the rightmost position.
    let rightmost = getRightmostX(node);
    currentX = rightmost + config.mainSpacing;
  });
}

/**
 * Recursively resets positions (x, y) and subtree height for a node and all its children.
 * @param {Object} node - The node object.
 */
function resetPositions(node) {
  node.x = 0;
  node.y = 0;
  node.subtreeHeight = 0;
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(c => resetPositions(c));
  }
}

/**
 * Computes the total vertical space (subtree height) required for a node and its descendants,
 * considering only nodes up to the given detail level.
 * @param {Object} node - The node object.
 * @param {number} detailLevel - Maximum depth to expand.
 * @param {number} [depth=0] - Current depth of recursion.
 * @returns {number} The computed subtree height.
 */
function computeSubtreeHeight(node, detailLevel, depth = 0) {
  const nodeHeight = 40; // Base height for each node.
  // If we've reached the detail limit or there are no children, use the base height.
  if (depth === detailLevel || !node.children || node.children.length === 0) {
    node.subtreeHeight = nodeHeight;
    return nodeHeight;
  }
  
  const spacing = 10; // Vertical spacing between siblings.
  let total = 0;
  node.children.forEach(child => {
    total += computeSubtreeHeight(child, detailLevel, depth + 1);
  });
  total += spacing * (node.children.length - 1);
  
  // The subtree height is at least the base node height.
  node.subtreeHeight = Math.max(nodeHeight, total);
  return node.subtreeHeight;
}

/**
 * Recursively assigns positions (both x and y) to a node's children based on their subtree heights.
 * If a child's depth exceeds the detail level, it is collapsed to the parent's position.
 * @param {Object} node - The parent node.
 * @param {number} centerY - The y-coordinate around which to center the children.
 * @param {number} detailLevel - Maximum depth to expand.
 * @param {number} [depth=0] - Current depth of recursion.
 */
function assignPositions(node, centerY, detailLevel, depth = 0) {
  node.y = centerY;
  
  if (!node.children || node.children.length === 0) return;
  
  // If the next level is beyond the detail level, collapse children to parent's position.
  if (depth + 1 > detailLevel) {
    node.children.forEach(child => {
      child.x = node.x;
      child.y = node.y;
      assignPositions(child, node.y, detailLevel, depth + 1);
    });
    return;
  }
  
  const spacing = 10;
  // Total height needed for all children.
  let totalChildrenHeight = node.children.reduce((sum, child) => sum + child.subtreeHeight, 0)
                            + spacing * (node.children.length - 1);
  // Starting y position so that children are vertically centered around parent's center.
  let startY = centerY - totalChildrenHeight / 2;
  
  node.children.forEach(child => {
    let childCenterY = startY + child.subtreeHeight / 2;
    child.x = node.x + offsetX(depth + 1);
    child.y = childCenterY;
    assignPositions(child, childCenterY, detailLevel, depth + 1);
    startY += child.subtreeHeight + spacing;
  });
}

/**
 * Returns the rightmost x-coordinate within a node's subtree.
 * @param {Object} node - The node object.
 * @returns {number} The rightmost x-coordinate.
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
 * Computes the horizontal offset for a given depth level.
 * @param {number} depth - The depth level (e.g. 1 for sub nodes, 2 for sub-sub nodes, etc.).
 * @returns {number} The horizontal offset.
 */
function offsetX(depth) {
  // Adjust this value if you wish to change the horizontal spacing between levels.
  return 400;
}
