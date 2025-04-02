// js/interactions.js

export function bindTooltip(svgGroup, tooltip) {
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

export function initZoom(svg, g, zoomBehavior) {
  svg.call(zoomBehavior)
     .on("start.zoom", () => svg.style("cursor", "grabbing"))
     .on("end.zoom", () => svg.style("cursor", "grab"));
}

export function bindExpandCollapse(expandButton, collapseButton, updateDiagramCallback) {
  expandButton.on("click", () => updateDiagramCallback("expand"));
  collapseButton.on("click", () => updateDiagramCallback("collapse"));
}
