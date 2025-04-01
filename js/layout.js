// js/layout.js

export function getSubsForMain(mId, subNodes) {
  return subNodes.filter(n => n.id.startsWith(mId + "s"));
}

export function getSubSubsForSub(sId, subSubNodes) {
  return subSubNodes.filter(n => n.id.startsWith(sId + "ss"));
}

/**
 * Calculates positions for the branch stemming from a main node.
 * It positions sub nodes (if detailLevel >= 1) and sub-sub nodes (if detailLevel === 2).
 * Returns the rightmost x position in the branch.
 */
export function placeSubBranch(mainNode, subNodes, subSubNodes, config, detailLevel) {
  // Only position sub nodes if detailLevel >= 1.
  const subs = detailLevel >= 1 ? getSubsForMain(mainNode.id, subNodes) : [];
  if (!subs.length) return mainNode.x;

  const n = subs.length;
  subs.forEach((sub, i) => {
    sub.x = mainNode.x + config.subOffsetX;
    sub.y = mainNode.y + (i - (n - 1) / 2) * config.subSpacingY;
    // Only position sub-sub nodes if detailLevel is 2.
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

  // Determine the rightmost x position in this branch.
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
 * Recalculates the positions of all main nodes (and their sub branches)
 * based on the current detailLevel.
 *
 * IMPORTANT: We reset the positions of the sub nodes.
 * For sub‑sub nodes, we only reset them if the detail level is 2.
 * (If the detail level is lower, we leave their positions alone, so that a collapse
 * animation that set them to their parent’s center isn’t immediately overwritten.)
 */
export function updateLayout(mainNodes, subNodes, subSubNodes, config, detailLevel) {
  // Reset positions for sub nodes.
  subNodes.forEach(n => { n.x = 0; n.y = 0; });
  // Only reset sub-sub nodes if detailLevel is 2 (expanded).
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
