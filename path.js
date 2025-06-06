const width5 = 1800;
    const height5 = 2300;
    const svg5 = d3.select('#path').append('svg')
      .attr('viewBox', [0, 0, width5, height5])
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const container5 = svg5.append('g');


    const shortestPath = ["xarola_","pobelter"];
    const longestPath = ['tolkin', 'k3soju', 'machete_vilches', 'paulinholokobr'];
    const communityPath = ['sardoche', 'bastighg', 'zerator', 'just_ns', 'dota2_paragon_ru', 'vatira_', 'fortnite', 'kingsleagueamericas', 'paulinholokobr'];

    d3.json('community_data.json').then(({nodes, links}) => {
      const nodeById = new Map(nodes.map(d => [d.id, d]));
      const groups = Array.from(new Set(nodes.map(d => d.group)));
      const color = d3.scaleOrdinal(d3.schemeDark2).domain(groups);

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width5 / 2, height5 /4));

      const link = container5.append('g').selectAll('line')
        .data(links).join('line').attr('class','link').style('opacity','0.25');

      const node = container5.append('g').selectAll('circle')
        .data(nodes).join('circle')
        .attr('class','node')
        .attr('r', 5)
        .attr('fill', d => color(d.group))
        .style('opacity','0.35')
        .call(d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
        );

      function makePathLinks(path) {
        const arr = [];
        for (let i = 0; i < path.length - 1; i++) {
          arr.push({ source: path[i], target: path[i + 1] });
        }
        return arr;
      }

      const shortLinksData = makePathLinks(shortestPath).filter(d => nodeById.has(d.source) && nodeById.has(d.target));
      const longLinksData  = makePathLinks(longestPath).filter(d => nodeById.has(d.source) && nodeById.has(d.target));
      const commLinksData  = makePathLinks(communityPath).filter(d => nodeById.has(d.source) && nodeById.has(d.target));

      const shortNodesData = shortestPath.map(id => nodeById.get(id)).filter(Boolean);
      const longNodesData  = longestPath.map(id => nodeById.get(id)).filter(Boolean);
      const commNodesData  = communityPath.map(id => nodeById.get(id)).filter(Boolean);

      const shortLink = container5.append('g').selectAll('line')
        .data(shortLinksData).join('line').attr('class','path-link shortest');

      const longLink = container5.append('g').selectAll('line')
        .data(longLinksData).join('line').attr('class','path-link longest');

      const commLink = container5.append('g').selectAll('line')
        .data(commLinksData).join('line').attr('class','path-link community');

      const shortNodes = container5.append('g').selectAll('circle')
        .data(shortNodesData).join('circle').attr('class','path-node shortest-node').attr('r', 5);

      const longNodes = container5.append('g').selectAll('circle')
        .data(longNodesData).join('circle').attr('class','path-node longest-node').attr('r', 5);

      const commNodes = container5.append('g').selectAll('circle')
        .data(commNodesData).join('circle').attr('class','path-node community-node').attr('r', 5);

      const shortLabels = container5.append('g').selectAll('text')
        .data(shortNodesData).join('text')
        .attr('class','path-label')
        .attr('fill','white')
        .text(d => d.id);

      const longLabels = container5.append('g').selectAll('text')
        .data(longNodesData).join('text')
        .attr('class','path-label')
        .attr('fill','white')
        .text(d => d.id);

      const commLabels = container5.append('g').selectAll('text')
        .data(commNodesData).join('text')
        .attr('class','path-label')
        .attr('fill','white')
        .text(d => d.id);

      sim.on('tick', () => {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

        node.attr('cx', d => d.x).attr('cy', d => d.y);

        shortLink.attr('x1', d => nodeById.get(d.source).x)
          .attr('y1', d => nodeById.get(d.source).y)
          .attr('x2', d => nodeById.get(d.target).x)
          .attr('y2', d => nodeById.get(d.target).y);

        longLink.attr('x1', d => nodeById.get(d.source).x)
          .attr('y1', d => nodeById.get(d.source).y)
          .attr('x2', d => nodeById.get(d.target).x)
          .attr('y2', d => nodeById.get(d.target).y);

        commLink.attr('x1', d => nodeById.get(d.source).x)
          .attr('y1', d => nodeById.get(d.source).y)
          .attr('x2', d => nodeById.get(d.target).x)
          .attr('y2', d => nodeById.get(d.target).y);

        shortNodes.attr('cx', d => d.x).attr('cy', d => d.y);
        longNodes.attr('cx', d => d.x).attr('cy', d => d.y);
        commNodes.attr('cx', d => d.x).attr('cy', d => d.y);

        shortLabels.attr('x', d => d.x + 12).attr('y', d => d.y + 4);
        longLabels.attr('x', d => d.x + 12).attr('y', d => d.y + 4);
        commLabels.attr('x', d => d.x + 12).attr('y', d => d.y + 4);
      });

      const legend = svg5.append('g').attr('class','legend').attr('transform','translate(150,40)');
      groups.forEach((g, i) => {
        const item = legend.append('g').attr('class','legend-item').attr('transform', `translate(0,${i*20})`);
        item.append('rect').attr('class','legend-color').attr('width', 12).attr('height', 12).attr('fill', color(g));
        item.append('text').attr('x', 16).attr('y', 12).text(g);
      });
    });
