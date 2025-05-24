const rawDataURL = "streaming_data.json"; // your JSON

const svgWidth = 1000;
const svgHeight = 1100;

// Small inner margin so labels don't get cut
const margin = { top: -50, right: 20, bottom: 10, left: 20 };
const fullW = svgWidth;
const fullH = svgHeight;
const width = fullW - margin.left - margin.right;
const height = fullH - margin.top - margin.bottom;

// Select & size the SVG
const svg = d3.select("#network")
  .attr("viewBox", [0, 0, fullW, fullH]);

// Zoom container (with inner margin)
const container = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);



const tooltip = d3.select("#tooltip");

d3.json(rawDataURL).then(raw => {
  if (!raw || raw.length === 0) {
    throw new Error("No data loaded or data is empty.");
  }

  // Optimize link computation by grouping by games
  const gameToStreamers = new Map();
  raw.forEach(([streamer, game1, game2]) => {
    [game1, game2].forEach(game => {
      if (game) {
        if (!gameToStreamers.has(game)) gameToStreamers.set(game, new Set());
        gameToStreamers.get(game).add(streamer);
      }
    });
  });

  // Build nodes and links
  const nodes = [];
  const nodeSet = new Set();
  raw.forEach(([s]) => {
    if (!nodeSet.has(s)) {
      nodeSet.add(s);
      nodes.push({ id: s, degree: 0 });
    }
  });

  const edgeSet = new Set();
  const links = [];
  gameToStreamers.forEach((streamers, game) => {
    const streamerArray = Array.from(streamers);
    for (let i = 0; i < streamerArray.length; i++) {
      for (let j = i + 1; j < streamerArray.length; j++) {
        const s1 = streamerArray[i];
        const s2 = streamerArray[j];
        const key = [s1, s2].sort().join("::");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          links.push({ source: s1, target: s2, games: game });
          const node1 = nodes.find(n => n.id === s1);
          const node2 = nodes.find(n => n.id === s2);
          node1.degree++;
          node2.degree++;
        }
      }
    }
  });

  // Scales for node size
  const maxD = d3.max(nodes, d => d.degree + 10);
  const size = d3.scaleLinear().domain([0, maxD]).range([6, 24]);

  // Draw links
  const link = container.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link");

  // Node circles
  const node = container.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", d => size(d.degree))
    .attr("fill", "#9146FF")
    .on("mouseover", hoverOn)
    .on("mousemove", hoverMove)
    .on("mouseout", hoverOff)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  // Labels with basic collision avoidance
  const nLabel = container.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("class", "nodelabel")
    .attr("dx", d => size(d.degree) + 10)
    .attr("dy", 4)
    .text(d => d.id);

  // Adjust forces dynamically based on number of nodes
  const repulsionStrength = -Math.min(400, 50 + nodes.length * 5);
  const linkDistance = Math.min(120, 50 + nodes.length * 2);

  // Force simulation
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance).strength(0.8))
    .force("charge", d3.forceManyBody().strength(repulsionStrength))
    .force("center", d3.forceCenter(width / 2 + margin.left, height / 2 + margin.top))
    .force("collide", d3.forceCollide().radius(d => size(d.degree) + 10)) // Prevent node overlap
    .on("tick", ticked)
    .on("end", fitToScreen);

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    nLabel
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  }

  // Auto-fit the entire graph into view
  function fitToScreen() {
    const b = container.node().getBBox();
    const scale = 1.2 / Math.max(b.width / width, b.height / height);
    const tx = (fullW - (b.x + b.width * scale + margin.left)) / 2;
    const ty = (fullH - (b.y + b.height * scale + margin.top)) / 2;
    svg.transition().duration(700)
      .call(d3.zoom().transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
  }

  // Hover & drag handlers
  function hoverOn(event, d) {
    d3.select(this).classed("highlight-node", true);
    link.filter(l => l.source.id === d.id || l.target.id === d.id)
      .classed("highlight-link", true);
    tooltip.style("visibility", "visible")
      .text(`${d.id}: ${d.degree} connections`);
  }

  function hoverMove(event) {
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    tooltip
      .style("top", (event.clientY + scrollY + 8) + "px")
      .style("left", (event.clientX + scrollX + 8) + "px");
  }

  function hoverOff() {
    d3.select(this).classed("highlight-node", false);
    link.classed("highlight-link", false);
    tooltip.style("visibility", "hidden");
  }

  function dragstarted(event, d) {
    if (!event.active) sim.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) sim.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}).catch(error => {
  console.error("Error loading data:", error);
  d3.select("#network").append("text")
    .attr("x", fullW / 2)
    .attr("y", fullH / 2)
    .attr("text-anchor", "middle")
    .text("Failed to load data. Please try again.");
});