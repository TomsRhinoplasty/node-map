/**
 * Module for animation-related functions.
 * @module animation
 */

/**
 * Programmatically zoom/pan so that the specified bounding box fits entirely within the SVG.
 * @param {Object} svg - The D3 selection of the SVG element.
 * @param {Object} zoomBehavior - The D3 zoom behavior.
 * @param {Object} bounds - The bounding box { x, y, width, height }.
 * @param {number} [duration=750] - Duration of the transition in milliseconds.
 */
export function animateZoomToBounds(svg, zoomBehavior, bounds, duration = 750) {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    console.warn("Invalid bounds provided for zoom animation.");
    return;
  }
  if (!svg || !svg.node) {
    console.error("SVG element is not valid.");
    return;
  }

  const svgWidth = svg.node().clientWidth;
  const svgHeight = svg.node().clientHeight;

  // Compute scale so that the bounds fit within the SVG, with a slight margin.
  const scale = Math.min(svgWidth / bounds.width, svgHeight / bounds.height) * 0.9;

  // Calculate the center of the bounding box.
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Compute translation to center the bounding box within the SVG.
  const translateX = svgWidth / 2 - scale * centerX;
  const translateY = svgHeight / 2 - scale * centerY;

  // Animate the transform using a D3 transition.
  svg.transition()
    .duration(duration)
    .call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );
}
