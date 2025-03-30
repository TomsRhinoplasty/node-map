// js/nodes.js
export function createNodes(svgGroup, mainNodes, subNodes, subSubNodes, config) {
  // Create groups for main nodes with an id attribute.
  const mainGroups = svgGroup.selectAll("g.main-node-group")
    .data(mainNodes, d => d.id)
    .enter()
    .append("g")
    .attr("id", d => "main-node-group-" + d.id)
    .attr("class", d => `main-node-group ${d.role}`)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  mainGroups.append("circle")
    .attr("r", config.mainRadius)
    .attr("class", d => `main-node ${d.role}`);

  mainGroups.append("text")
    .attr("class", "node-text main-text")
    .attr("dy", config.mainRadius + config.mainTextOffset)
    .attr("text-anchor", "middle")
    .text(d => d.title);

  // Create groups for sub nodes with an id attribute.
  const subGroups = svgGroup.selectAll("g.sub-node-group")
    .data(subNodes, d => d.id)
    .enter()
    .append("g")
    .attr("id", d => "sub-node-group-" + d.id)
    .attr("class", d => `sub-node-group ${d.role}`)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  subGroups.append("circle")
    .attr("r", config.subRadius)
    .attr("class", d => `sub-node ${d.role}`);

  subGroups.append("text")
    .attr("class", "node-text sub-text")
    .attr("dy", config.subRadius + config.subTextOffset)
    .attr("text-anchor", "middle")
    .text(d => d.title);

  // Create groups for sub‑sub nodes with an id attribute.
  const subSubGroups = svgGroup.selectAll("g.subsub-node-group")
    .data(subSubNodes, d => d.id)
    .enter()
    .append("g")
    .attr("id", d => "subsub-node-group-" + d.id)
    .attr("class", d => `subsub-node-group ${d.role}`)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  subSubGroups.append("circle")
    .attr("r", config.subSubRadius)
    .attr("class", d => `sub-sub-node ${d.role}`);

  subSubGroups.append("text")
    .attr("class", "node-text subsub-text")
    .attr("dy", config.subSubRadius + config.subSubTextOffset)
    .attr("text-anchor", "middle")
    .text(d => d.title);
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
