// js/nodes.js

/**
 * gatherConnectors:
 * 1) For each main node (except the last), link its deepest visible nodes to the next main node.
 * 2) Also, link each node to its children (if within the detail level).
 */
export function gatherConnectors(mainNodes, detailLevel) {
  let links = [];
  for (let i = 0; i < mainNodes.length - 1; i++) {
    const currentMain = mainNodes[i];
    const nextMain = mainNodes[i + 1];
    // Gather only the deepest visible nodes in currentMain’s subtree.
    const deepestNodes = gatherDeepestVisibleNodes(currentMain, detailLevel, 0);
    deepestNodes.forEach(v => {
      if (v !== nextMain) {
        links.push({ source: v, target: nextMain });
      }
    });
  }

  // Link each node to its children if they are within the detail level.
  mainNodes.forEach(m => {
    gatherParentChildLinks(m, detailLevel, 0, links);
  });

  return links;
}

/**
 * gatherDeepestVisibleNodes:
 * Returns the deepest visible nodes in a subtree up to the given detail level.
 * If a node has children and its depth is less than the detail level,
 * it recurses and returns its deepest visible children; otherwise, returns the node itself.
 */
function gatherDeepestVisibleNodes(node, detailLevel, depth) {
  if (!node.children || node.children.length === 0 || depth === detailLevel) {
    return [node];
  }
  let results = [];
  node.children.forEach(child => {
    if (depth < detailLevel) {
      results = results.concat(gatherDeepestVisibleNodes(child, detailLevel, depth + 1));
    }
  });
  return results.length > 0 ? results : [node];
}

/**
 * gatherParentChildLinks:
 * For each node, if its depth is less than the detail level, link it to its children and recurse.
 */
function gatherParentChildLinks(node, detailLevel, depth, links) {
  if (!node.children) return;
  if (depth < detailLevel) {
    node.children.forEach(child => {
      links.push({ source: node, target: child });
      gatherParentChildLinks(child, detailLevel, depth + 1, links);
    });
  }
}

/**
 * Draws a legend in the SVG.
 */
export function drawLegend(svg) {
  const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,20)");
  const legendData = [
    { role: "ai", label: "AI-driven Task" },
    { role: "human", label: "Human-required Task" },
    { role: "hybrid", label: "Hybrid Task" }
  ];
  const legendSpacing = 30;
  legendData.forEach((d, i) => {
    legend.append("circle")
          .attr("cx", 10)
          .attr("cy", 10 + i * legendSpacing)
          .attr("r", 8)
          .attr("class", d.role);
    legend.append("text")
          .attr("x", 30)
          .attr("y", 15 + i * legendSpacing)
          .text(d.label);
  });
}
