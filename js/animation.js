// js/animation.js

export function animateZoomReset(svg, g, zoomBehavior, duration = 750) {
  const bounds = g.node().getBBox();
  const fullWidth = svg.node().clientWidth;
  const fullHeight = svg.node().clientHeight;
  const scale = Math.min(fullWidth / bounds.width, fullHeight / bounds.height) * 0.9;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const translateX = fullWidth / 2 - scale * centerX;
  const translateY = fullHeight / 2 - scale * centerY;
  svg.transition().duration(duration)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}
