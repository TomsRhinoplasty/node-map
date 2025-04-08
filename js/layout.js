/**
 * Module for layout computations.
 * @module layout
 */

export function updateLayout(mainNodes, detailLevel, config) {
  if (!mainNodes || !Array.isArray(mainNodes) || mainNodes.length === 0) {
    console.warn("No main nodes provided for layout update.");
    return;
  }

  // Reset positions for all nodes.
  mainNodes.forEach(m => resetPositions(m));

  /*
   * 1) Fully collapsed state (detailLevel === 0):
   *    Place main nodes in a row with an alternating vertical offset,
   *    and collapse all of their children to their parent's position.
   */
  if (detailLevel === 0) {
    let currentX = config.mainStartX;
    const verticalOffset = 100; // Adjust vertical offset as needed.
    const collapsedSpacing = 275; // Reduced spacing for fully collapsed state.

    mainNodes.forEach((node, i) => {
      const direction = (i % 2 === 0) ? -1 : 1;
      node.x = currentX;
      node.y = config.centerY + direction * verticalOffset;
      // Provide a minimal subtree height.
      node.subtreeHeight = 40;
      // Collapse all children to the parent node's position.
      collapseChildren(node);
      // Advance horizontally using the collapsed spacing.
      currentX += collapsedSpacing;
    });

    return;
  }

  /*
   * 2) Expanded state (detailLevel > 0):
   *    Place main nodes along a horizontal line at config.centerY and recursively
   *    assign positions for children.
   */
  let currentX = config.mainStartX;
  mainNodes.forEach(node => {
    node.x = currentX;
    node.y = config.centerY;

    // Compute subtree heights and assign positions for children.
    computeSubtreeHeight(node, detailLevel);
    assignPositions(node, node.y, detailLevel);

    // Move currentX based on the rightmost point of this node's subtree.
    let rightmost = getRightmostX(node);
    currentX = rightmost + config.mainSpacing;
  });
}

/**
 * Recursively resets positions (x, y) and subtree height for a node and its children.
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
 * Recursively collapses all children of a node, setting their coordinates to the parent's coordinates.
 * @param {Object} node - The node object.
 */
function collapseChildren(node) {
  if (!node.children || node.children.length === 0) return;
  node.children.forEach(child => {
    child.x = node.x;
    child.y = node.y;
    collapseChildren(child);
  });
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
  if (depth === detailLevel || !node.children || node.children.length === 0) {
    node.subtreeHeight = nodeHeight;
    return nodeHeight;
  }

  const spacing = 50; // Vertical spacing between siblings.
  let total = 0;
  node.children.forEach(child => {
    total += computeSubtreeHeight(child, detailLevel, depth + 1);
  });
  total += spacing * (node.children.length - 1);

  node.subtreeHeight = Math.max(nodeHeight, total);
  return node.subtreeHeight;
}

/**
 * Recursively assigns positions (x, y) to a node's children based on their subtree heights.
 * If a child's depth exceeds the detail level, it is collapsed to the parent's position.
 * @param {Object} node - The parent node.
 * @param {number} centerY - The y-coordinate around which to center the children.
 * @param {number} detailLevel - Maximum depth to expand.
 * @param {number} [depth=0] - Current depth of recursion.
 */
function assignPositions(node, centerY, detailLevel, depth = 0) {
  node.y = centerY;

  if (!node.children || node.children.length === 0) return;

  if (depth + 1 > detailLevel) {
    node.children.forEach(child => {
      child.x = node.x;
      child.y = node.y;
      assignPositions(child, node.y, detailLevel, depth + 1);
    });
    return;
  }

  const spacing = 50;
  let totalChildrenHeight = node.children.reduce((sum, child) => sum + child.subtreeHeight, 0)
                            + spacing * (node.children.length - 1);
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
 * @param {number} depth - The depth level (e.g., 1 for sub nodes, 2 for sub-sub nodes, etc.).
 * @returns {number} The horizontal offset.
 */
function offsetX(depth) {
  // Change this value to adjust the horizontal spacing between levels of children.
  return 300;
}
