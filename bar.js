const totalWidth  = 1200,
totalHeight = 600,
margin       = { top: 60, right: 20, bottom: 80, left: 80 },
plotWidth    = (totalWidth - margin.left - margin.right) / 2,
plotHeight   = totalHeight - margin.top - margin.bottom;

const container = d3.select("#chart");
const tooltip   = d3.select("#tooltip2");

// Two canvases
const svg1 = container.append("svg")
        .attr("width",  plotWidth + margin.left + margin.right)
        .attr("height", plotHeight + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2 = container.append("svg")
        .attr("width",  plotWidth + margin.left + margin.right)
        .attr("height", plotHeight + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

let selectedDay = null;

d3.csv("stream.csv", d => ({
day: d.MOST_ACTIVE_DAY,
gain: +d.FOLLOWERS_GAINED_PER_STREAM
})).then(data => {
const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// freq & stats
const freqMap = new Map(days.map(d=>[d,0]));
data.forEach(d => freqMap.set(d.day, (freqMap.get(d.day)||0) + 1));
const freq  = days.map(d => ({ day: d, count: freqMap.get(d) }));

const statsMap = d3.rollup(
data,
v => ({ mean: d3.mean(v, d=>d.gain), sd: d3.deviation(v, d=>d.gain) }),
d => d.day
);
const stats = days.map(d => {
const s = statsMap.get(d) || { mean: 0, sd: 0 };
return { day: d, mean: s.mean, sd: s.sd };
});

// scales
const x1 = d3.scaleBand().domain(days).range([0, plotWidth]).padding(0.2);
const y1 = d3.scaleLinear().domain([0, d3.max(freq, d=>d.count)]).nice().range([plotHeight, 0]);
const x2 = d3.scaleBand().domain(days).range([0, plotWidth]).padding(0.2);
const y2 = d3.scaleLinear().domain([0, d3.max(stats, d=>d.mean + d.sd)]).nice().range([plotHeight, 0]);

// axes + titles
function drawAxes(svg, x, y, title, ylabel) {
svg.append("g")
 .attr("class","y-axis")
 .call(d3.axisLeft(y).ticks(5));
svg.append("g")
 .attr("class","x-axis")
 .attr("transform", `translate(0,${plotHeight})`)
 .call(d3.axisBottom(x))
 .selectAll("text")
   .attr("transform","rotate(-50)")
   .style("text-anchor","end");
svg.append("text")
 .attr("class","title")
 .attr("x", plotWidth/2).attr("y", -30)
 .text(title);
svg.append("text")
 .attr("class","axis-label")
 .attr("x", -plotHeight/2).attr("y", -50)
 .attr("transform","rotate(-90)")
 .text(ylabel);
}
drawAxes(svg1, x1, y1, "Most Active Day Frequency", "Streamers Count");
drawAxes(svg2, x2, y2, "Avg Followers Gained per Stream", "Followers Gained");

// freq bars
const bars1 = svg1.selectAll(".bar1")
.data(freq).join("rect")
.attr("class","bar1")
.attr("x", d => x1(d.day))
.attr("width", x1.bandwidth())
.attr("y", plotHeight)
.attr("height", 0)
.attr("rx", 6)
.on("mouseover", onMouseOver)
.on("mousemove", onMouseMove)
.on("mouseout",  onMouseOut)
.on("click",    onClick);

bars1.transition().duration(1200)
 .attr("y", d => y1(d.count))
 .attr("height", d => plotHeight - y1(d.count));

// mean bars
const bars2 = svg2.selectAll(".bar2")
.data(stats).join("rect")
.attr("class","bar2")
.attr("x", d => x2(d.day))
.attr("width", x2.bandwidth())
.attr("y", plotHeight)
.attr("height", 0)
.attr("rx", 6)
.on("mouseover", onMouseOver)
.on("mousemove", onMouseMove)
.on("mouseout",  onMouseOut)
.on("click",    onClick);

bars2.transition().delay(300).duration(1200)
 .attr("y", d => y2(d.mean))
 .attr("height", d => plotHeight - y2(d.mean));

// error bars
svg2.selectAll(".error-bar")
.data(stats).join("line")
  .attr("class","error-bar")
  .attr("x1", d => x2(d.day) + x2.bandwidth()/2)
  .attr("x2", d => x2(d.day) + x2.bandwidth()/2)
  .attr("y1", d => y2(d.mean - d.sd))
  .attr("y2", d => y2(d.mean + d.sd))
  .style("opacity", 0)
.transition().delay(1600).duration(600)
  .style("opacity", 1);

const capW = x2.bandwidth() * 0.5;
svg2.selectAll(".cap-top")
.data(stats).join("line")
  .attr("class","error-bar")
  .attr("x1", d => x2(d.day) + x2.bandwidth()/2 - capW/2)
  .attr("x2", d => x2(d.day) + x2.bandwidth()/2 + capW/2)
  .attr("y1", d => y2(d.mean + d.sd))
  .attr("y2", d => y2(d.mean + d.sd))
  .style("opacity", 0)
.transition().delay(1600).duration(600)
  .style("opacity", 1);
svg2.selectAll(".cap-bot")
.data(stats).join("line")
  .attr("class","error-bar")
  .attr("x1", d => x2(d.day) + x2.bandwidth()/2 - capW/2)
  .attr("x2", d => x2(d.day) + x2.bandwidth()/2 + capW/2)
  .attr("y1", d => y2(d.mean - d.sd))
  .attr("y2", d => y2(d.mean - d.sd))
  .style("opacity", 0)
.transition().delay(1600).duration(600)
  .style("opacity", 1);

// interaction handlers
function onMouseOver(event, d) {
d3.select(this).attr("opacity", 0.7);
const txt = this.classList.contains("bar1")
? `${d.day}: ${d.count} streamers`
: `${d.day}: ${d.mean.toFixed(1)}±${d.sd.toFixed(1)}`;
tooltip.style("visibility","visible").text(txt);
}
function onMouseMove(event) {
tooltip
.style("top",  `${event.pageY+15}px`)
.style("left", `${event.pageX+15}px`);
}
function onMouseOut() {
d3.select(this).attr("opacity", 1);
tooltip.style("visibility","hidden");
}
function onClick(event, d) {
selectedDay = d.day;
bars1.classed("selected", dd=>dd.day===selectedDay);
bars2.classed("selected", dd=>dd.day===selectedDay);
}

}).catch(console.error);