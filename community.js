const width4 = 1200;
const height4 = 1200;
const svg4 = d3.select('#community').append('svg')
  .attr('width', width4)
  .attr('height', height4);
const tooltip4 = d3.select('#tooltip4');

// Load community data: nodes with {id, group}, links with {source, target}
d3.json('community_data.json').then(({nodes, links}) => {
  // extract unique groups for color scale
  const groups = Array.from(new Set(nodes.map(d => d.group)));
  const color = d3.scaleOrdinal(d3.schemeDark2).domain(groups);

  // simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80).strength(0.8))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width4/2, height4/2));

  // zoom
  const container4 = svg4.append('g');

  // draw links
  const link = container4.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
      .attr('class', 'link');

  // draw nodes
  const node = container4.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
      .attr('class', 'node')
      .attr('r', 5)
      .attr('fill', d => color(d.group))
      .on('mouseover', (event, d) => {
        tooltip4.html(`<strong>${d.id}</strong><br/>${d.group}`)
               .style('visibility', 'visible');
      })
      .on('mousemove', event => {
        tooltip4.style('top', (event.pageY+10)+'px')
               .style('left',(event.pageX+10)+'px');
      })
      .on('mouseout', () => tooltip4.style('visibility', 'hidden'))
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  });

  // legend
  const legend = svg4.append('g')
    .attr('class','legend')
    .attr('transform','translate(100,60)')
    .style('margin-left','-25px');
  groups.forEach((g,i) => {
    const item = legend.append('g')
      .attr('class','legend-item')
      .attr('transform', `translate(0,${i*20})`);
    item.append('rect')
      .attr('class','legend-color')
      .attr('fill', color(g));
    item.append('text')
      .attr('x', 16)
      .attr('y', 12)
      .text(g);
  });
});