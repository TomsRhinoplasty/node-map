/**
 * Module for animation-related functions.
 * @module animation
 */

/**
 * Programmatically zoom/pan so that the specified bounding box fits entirely within the SVG.
 * A padding is added to the bounds so that additional elements (like node text) remain visible.
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

  // Add padding to the bounds so that the node and its text are fully visible.
  const padding = 50; // You can adjust this value to increase or decrease the margin
  const paddedBounds = {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + (2 * padding),
    height: bounds.height + (2 * padding)
  };

  // Compute scale so that the padded bounds fit within the SVG.
  const scale = Math.min(svgWidth / paddedBounds.width, svgHeight / paddedBounds.height) * 0.9;

  // Calculate the center of the padded bounding box.
  const centerX = paddedBounds.x + paddedBounds.width / 2;
  const centerY = paddedBounds.y + paddedBounds.height / 2;

  // Compute translation to center the padded bounding box within the SVG.
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
