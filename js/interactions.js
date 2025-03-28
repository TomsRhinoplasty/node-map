// js/interactions.js
export function bindTooltip(g, tooltip) {
  g.selectAll("circle.main-node, circle.sub-node, circle.sub-sub-node")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
             .html(d.desc || d.title);
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

export function initZoom(svg, g, zoomBehavior) {
  svg.call(zoomBehavior)
     .on("start.zoom", () => svg.style("cursor", "grabbing"))
     .on("end.zoom", () => svg.style("cursor", "grab"));
}

export function zoomToFit(svg, g) {
  const bounds = g.node().getBBox();
  const fullWidth = svg.node().clientWidth;
  const fullHeight = svg.node().clientHeight;
  const scale = Math.min(fullWidth / bounds.width, fullHeight / bounds.height) * 0.9;
  // Set zoom scale extent to allow some zoom in.
  const zoomBehavior = d3.zoom().scaleExtent([scale, 3]).on("zoom", event => {
    g.attr("transform", event.transform);
  });
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const translateX = fullWidth / 2 - scale * centerX;
  const translateY = fullHeight / 2 - scale * centerY;
  svg.transition().duration(750)
     .call(zoomBehavior.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  return zoomBehavior;
}

export function bindExpandCollapse(expandButton, collapseButton, updateDiagramCallback) {
  expandButton.on("click", () => {
    updateDiagramCallback("expand");
  });
  collapseButton.on("click", () => {
    updateDiagramCallback("collapse");
  });
}
