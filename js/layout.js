/**
 * Returns sub nodes for a given main node based on explicit parent property.
 */
export function getSubsForMain(mId, subNodes) {
  return subNodes.filter(n => n.parent === mId);
}

/**
 * Returns sub‑sub nodes for a given sub node based on explicit parent property.
 */
export function getSubSubsForSub(sId, subSubNodes) {
  return subSubNodes.filter(n => n.parent === sId);
}

/**
 * Positions the branch stemming from a main node.
 * Sub nodes (if detailLevel >= 1) and sub‑sub nodes (if detailLevel === 2) are positioned.
 * Returns the rightmost x position in the branch.
 */
export function placeSubBranch(mainNode, subNodes, subSubNodes, config, detailLevel) {
  const subs = detailLevel >= 1 ? getSubsForMain(mainNode.id, subNodes) : [];
  if (!subs.length) return mainNode.x;

  const n = subs.length;
  subs.forEach((sub, i) => {
    sub.x = mainNode.x + config.subOffsetX;
    sub.y = mainNode.y + (i - (n - 1) / 2) * config.subSpacingY;
    if (detailLevel >= 2) {
      const subSubs = getSubSubsForSub(sub.id, subSubNodes);
      if (subSubs.length) {
        const countSS = subSubs.length;
        subSubs.forEach((ss, idx) => {
          ss.x = sub.x + config.subSubOffsetX;
          ss.y = sub.y + (idx - (countSS - 1) / 2) * config.subSubSpacingY;
        });
      }
    }
  });

  let rightMost = mainNode.x + config.subOffsetX;
  subs.forEach(sub => {
    const subSubs = getSubSubsForSub(sub.id, subSubNodes);
    if (subSubs.length > 0) {
      const candidate = subSubs.reduce((max, node) => Math.max(max, node.x), sub.x);
      if (candidate > rightMost) rightMost = candidate;
    } else if (sub.x > rightMost) {
      rightMost = sub.x;
    }
  });
  return rightMost;
}

/**
 * Recalculates the positions of all nodes based on the current detail level.
 * Sub nodes are reset unconditionally; sub‑sub nodes are reset only if detailLevel >= 2.
 */
export function updateLayout(mainNodes, subNodes, subSubNodes, config, detailLevel) {
  subNodes.forEach(n => { n.x = 0; n.y = 0; });
  if (detailLevel >= 2) {
    subSubNodes.forEach(n => { n.x = 0; n.y = 0; });
  }
  mainNodes[0].x = config.mainStartX;
  let currentRight = placeSubBranch(mainNodes[0], subNodes, subSubNodes, config, detailLevel);
  for (let i = 1; i < mainNodes.length; i++) {
    mainNodes[i].x = currentRight + config.mainSpacing;
    const newRight = placeSubBranch(mainNodes[i], subNodes, subSubNodes, config, detailLevel);
    currentRight = Math.max(currentRight, newRight, mainNodes[i].x);
  }
}
