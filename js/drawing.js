// js/drawing.js
export function drawNodes(g, mainNodes, subNodes, subSubNodes, config) {
  // Draw main nodes.
  g.selectAll("circle.main-node")
    .data(mainNodes)
    .enter()
    .append("circle")
    .attr("class", d => "main-node " + d.role)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", config.mainRadius);

  g.selectAll("text.main")
    .data(mainNodes)
    .enter()
    .append("text")
    .attr("class", "node-text main-text")
    .attr("x", d => d.x)
    .attr("y", d => d.y + config.mainRadius + config.mainTextOffset)
    .text(d => d.title);

  // Draw sub nodes.
  g.selectAll("circle.sub-node")
    .data(subNodes)
    .enter()
    .append("circle")
    .attr("class", d => "sub-node " + d.role)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", config.subRadius);

  g.selectAll("text.sub")
    .data(subNodes)
    .enter()
    .append("text")
    .attr("class", "node-text sub-text")
    .attr("x", d => d.x)
    .attr("y", d => d.y + config.subRadius + config.subTextOffset)
    .text(d => d.title);

  // Draw sub-sub nodes.
  g.selectAll("circle.sub-sub-node")
    .data(subSubNodes)
    .enter()
    .append("circle")
    .attr("class", d => "sub-sub-node " + d.role)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", config.subSubRadius);

  g.selectAll("text.subsub")
    .data(subSubNodes)
    .enter()
    .append("text")
    .attr("class", "node-text subsub-text")
    .attr("x", d => d.x)
    .attr("y", d => d.y + config.subSubRadius + config.subSubTextOffset)
    .text(d => d.title);
}

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

export function drawLegend(svg) {
  const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20,20)");
  const legendData = [
    { role: "ai", label: "AI-driven Task" },
    { role: "human", label: "Human-required Task" },
    { role: "hybrid", label: "Hybrid Task" }
  ];
  const legendSpacing = 30;
  legendData.forEach((d, i) => {
    legend.append("circle")
          .attr("cx", 10)
          .attr("cy", 10 + i * legendSpacing)
          .attr("r", 8)
          .attr("class", d.role);
    legend.append("text")
          .attr("x", 30)
          .attr("y", 15 + i * legendSpacing)
          .text(d.label);
  });
}
