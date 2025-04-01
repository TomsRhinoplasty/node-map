/**
 * Draws a connector line between two nodes.
 */
export function drawConnection(g, source, target, getRadius) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx);
  const startX = source.x + Math.cos(angle) * getRadius(source);
  const startY = source.y + Math.sin(angle) * getRadius(source);
  const endX = target.x - Math.cos(angle) * getRadius(target);
  const endY = target.y - Math.sin(angle) * getRadius(target);
  g.append("line")
    .attr("class", "connector")
    .attr("x1", startX)
    .attr("y1", startY)
    .attr("x2", endX)
    .attr("y2", endY);
}
