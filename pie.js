    const width3  = 600;
    const height3 = 600;
    const radius = Math.min(width3, height3) / 2 - 40;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pieGen = d3.pie()
      .sort(null)
      .value(d => d.count);

    const arcGen = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(0)
      .outerRadius(radius + 10);

    const svg3 = d3.select('#pie')
      .append('svg')
      .attr('width', width3)
      .attr('height', height3)
      .append('g')
      .attr('transform', `translate(${width3/2},${height3/2})`);

    const tooltip3 = d3.select('#tooltip3');

    d3.csv('stream.csv', d => ({ language: d.LANGUAGE }))
      .then(raw => {
        // Count occurrences
        const counts = {};
        raw.forEach(d => { counts[d.language] = (counts[d.language] || 0) + 1; });
        const data = Object.entries(counts).map(([language, count]) => ({ language, count }));

        // Update color domain
        color.domain(data.map(d => d.language));
        const total = raw.length;

        // Draw slices
        const slices = svg3.selectAll('.slice')
          .data(pieGen(data))
          .join('g')
            .attr('class', 'slice')
            .on('mouseover', (event, d) => {
                const percent = ((d.data.count / total) * 100).toFixed(1) + '%';
                tooltip3.html(
                  `<span class='lang'>${d.data.language}</span>` +
                  `<span class='details'>Count: ${d.data.count}<br/>Share: ${percent}</span>`
                )
                .style('display', 'block')  // Use 'block' instead of 'visibility: visible'
                .style('position', 'absolute')
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY + 12}px`);
              })
              .on('mouseout', () => {
                tooltip3.style('display', 'none'); // Hide when mouse leaves the slice
              });
              

        slices.append('path')
          .attr('fill', d => color(d.data.language))
          .attr('d', arcGen)
          .transition()
          .duration(800)
          .attrTween('d', function(d) {
            const interp = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return t => arcGen(interp(t));
          });

        // Remove text labels: slice labels have been removed for clarity
      })
      .catch(err => console.error('Failed to load stream.csv:', err));