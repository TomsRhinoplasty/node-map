// js/layout.js
export function getSubsForMain(mId, subNodes) {
  // Return sub nodes whose ID starts with the main node ID plus "s"
  return subNodes.filter(n => n.id.startsWith(mId + "s"));
}

export function getSubSubsForSub(sId, subSubNodes) {
  // Return sub-sub nodes whose ID starts with the sub node's full ID plus "ss"
  return subSubNodes.filter(n => n.id.startsWith(sId + "ss"));
}

export function placeSubBranch(mainNode, subNodes, subSubNodes, config) {
  const subs = getSubsForMain(mainNode.id, subNodes);
  if (!subs.length) return mainNode.x;
  const n = subs.length;
  subs.forEach((sub, i) => {
    sub.x = mainNode.x + config.subOffsetX;
    sub.y = mainNode.y + (i - (n - 1) / 2) * config.subSpacingY;
  });
  let rightMost = mainNode.x;
  subs.forEach(sub => {
    const subSubs = getSubSubsForSub(sub.id, subSubNodes);
    if (!subSubs.length) {
      if (sub.x > rightMost) rightMost = sub.x;
      return;
    }
    const countSS = subSubs.length;
    subSubs.forEach((ss, idx) => {
      ss.x = sub.x + config.subSubOffsetX;
      ss.y = sub.y + (idx - (countSS - 1) / 2) * config.subSubSpacingY;
    });
    const thisRight = subSubs[0].x;
    if (thisRight > rightMost) rightMost = thisRight;
  });
  return rightMost;
}
