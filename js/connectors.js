/**
 * computeConnectors(allNodes, detailLevel)
 * Returns an array of edges {source, target} that replicate your old logic:
 * For each main node i, link it to main node i+1. If detailLevel≥1, link each child in i's subtree to i+1, etc.
 *
 *  - "Main nodes" are those with depth=0 (children of the dummy root).
 *  - "Sub" nodes have depth=1, "sub-sub" have depth=2, etc.
 *  - For detailLevel=0, just one line from main node i → main node i+1.
 *  - For detailLevel=1, also link each sub node of i to i+1, plus symmetrical if you want (i→sub, sub→i+1).
 *  - For detailLevel=2, same but also sub-sub nodes, etc.
 */
export function computeConnectors(allNodes, detailLevel) {
  // Filter out the dummy root (depth<0)
  const mainNodes = allNodes
    .filter(n => n.depth === 0)
    .sort((a, b) => (a.x < b.x ? -1 : 1)); // Sort left to right

  const connectors = [];
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const sourceMain = mainNodes[i];
    const targetMain = mainNodes[i + 1];
    // Always connect main i → main i+1
    connectors.push({ source: sourceMain, target: targetMain });

    if (detailLevel >= 1) {
      // For each child in sourceMain’s subtree, if depth≥1 and ≤ detailLevel+sourceMain.depth,
      // connect child → targetMain (and optionally sourceMain → child).
      const subNodes = getDescendants(sourceMain, detailLevel, sourceMain.depth);
      // For detailLevel=1, that means subNodes up to depth=1 from sourceMain’s depth=0 => actual depth=1.
      // For detailLevel=2, up to depth=2 => actual depth=2, etc.

      subNodes.forEach(child => {
        // child is in the subtree of sourceMain
        // Connect sourceMain → child, child → targetMain
        // (mimics your old symmetrical logic)
        connectors.push({ source: sourceMain, target: child });
        connectors.push({ source: child, target: targetMain });
      });
    }
  }
  return connectors;
}

/**
 * getDescendants(node, detailLevel, baseDepth)
 * Returns all descendants of 'node' whose depth ≤ baseDepth + detailLevel
 * and whose depth > baseDepth (so we skip the node itself).
 */
function getDescendants(node, detailLevel, baseDepth) {
  const results = [];
  function recurse(n) {
    if (!n.children) return;
    for (const c of n.children) {
      if (c.depth <= baseDepth + detailLevel) {
        // within visible depth
        if (c.depth > baseDepth) {
          results.push(c);
        }
        recurse(c);
      }
    }
  }
  recurse(node);
  return results;
}
