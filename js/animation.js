// js/animation.js

/**
 * animateZoomToBounds(svg, zoomBehavior, bounds, duration)
 * Programmatically zoom/pan so that the specified bounding box (in diagram coordinates)
 * fits entirely within the svg.
 *
 *  - bounds: { x, y, width, height }
 */
export function animateZoomToBounds(svg, zoomBehavior, bounds, duration = 750) {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    // Fallback if bounds are invalid
    return;
  }

  const svgWidth = svg.node().clientWidth;
  const svgHeight = svg.node().clientHeight;

  // Compute scale so that the bounds fit within the svg, with some margin
  const scale = Math.min(svgWidth / bounds.width, svgHeight / bounds.height) * 0.9;

  // Center of the bounding box
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Translate so that the bounding box center maps to the SVG center
  const translateX = svgWidth / 2 - scale * centerX;
  const translateY = svgHeight / 2 - scale * centerY;

  // Animate the transform
  svg.transition()
    .duration(duration)
    .call(
      zoomBehavior.transform,
      d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(scale)
    );
}
