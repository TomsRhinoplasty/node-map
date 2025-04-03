/**
 * Module for handling user interactions.
 * @module interactions
 */

/**
 * Binds tooltip events to node elements.
 * @param {Object} svgGroup - The D3 selection of the group containing nodes.
 * @param {Object} tooltip - The D3 selection of the tooltip element.
 */
export function bindTooltip(svgGroup, tooltip) {
  if (!svgGroup || !tooltip) {
    console.error("SVG group or tooltip element is missing.");
    return;
  }
  svgGroup.selectAll("circle")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
             .text(d.desc || d.title);
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY + 10) + "px");
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}

/**
 * Initializes the zoom behavior on the SVG element.
 * @param {Object} svg - The D3 selection of the SVG element.
 * @param {Object} g - The D3 selection of the main group element.
 * @param {Object} zoomBehavior - The D3 zoom behavior.
 */
export function initZoom(svg, g, zoomBehavior) {
  if (!svg || !g || !zoomBehavior) {
    console.error("SVG, group element, or zoom behavior is missing.");
    return;
  }
  svg.call(zoomBehavior)
     .on("start.zoom", () => svg.style("cursor", "grabbing"))
     .on("end.zoom", () => svg.style("cursor", "grab"));
}

/**
 * Binds expand and collapse button events to update the diagram.
 * @param {Object} expandButton - The D3 selection of the expand button.
 * @param {Object} collapseButton - The D3 selection of the collapse button.
 * @param {Function} updateDiagramCallback - Callback function to update the diagram.
 */
export function bindExpandCollapse(expandButton, collapseButton, updateDiagramCallback) {
  if (!expandButton || !collapseButton || !updateDiagramCallback) {
    console.error("Expand/collapse buttons or update callback is missing.");
    return;
  }
  expandButton.on("click", () => updateDiagramCallback("expand"));
  collapseButton.on("click", () => updateDiagramCallback("collapse"));
}
