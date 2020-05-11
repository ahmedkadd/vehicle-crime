let config = {
  'svg2': {},
  'margin': {},
  'plot': {},
  'legend': {}
};

config.svg2.width = 960;
config.svg2.height = 500;

config.margin.top = 50;
config.margin.right = 10;
config.margin.bottom = 50;
config.margin.left = 160;

config.plot.x = config.margin.left;
config.plot.y = config.margin.top;
config.plot.width = config.svg2.width - config.margin.left - config.margin.right;
config.plot.height = config.svg2.height - config.margin.top - config.margin.bottom;

config.legend.x = 750;
config.legend.y = 10;
config.legend.width = 180;
config.legend.height = 10;

let tooltipMap = {
  "Day": "Day:",
  "Neighborhood": "Neighborhood:",
  "Count": "Number of Incidents:"
};

var svg2 = d3.select("svg#heatmap_vis");
svg2.attr('width', config.svg2.width);
svg2.attr('height', config.svg2.height);

let plot = svg2.append('g');
plot.attr('id', 'plot');
plot.attr('transform', translate(config.plot.x, config.plot.y));

let scale = {};

scale.x = d3.scaleBand();
scale.x.range([0, config.plot.width]);

scale.y = d3.scaleBand();
scale.y.range([config.plot.height, 0]);

scale.color = d3.scaleSequential(d3.interpolateOranges);

let axis = {};

axis.x = d3.axisBottom(scale.x);
axis.x.tickPadding(0);
axis.x.tickSize(5);
axis.x.tickSizeOuter(0);

axis.y = d3.axisLeft(scale.y);
axis.y.tickPadding(0);
axis.y.tickSize(3);
axis.y.tickSizeOuter(0);

//TODO: maybe add tool tip convert table?

d3.tsv("daily.tsv", convertRow).then(draw);

function convertRow(row, index) {
  let out = {};

  for (let col in row) {
    switch (col) {
      case 'Day':
        out[col] = row[col];
        break;

      case 'Neighborhood':
        out[col] = row[col];
        break;

      default:
        out[col] = parseInt(row[col]);
    }
  }

  return out;
}

// https://blockbuilder.org/sjengle/47c5c20a18ec29f4e2b82905bdb7fe95
function draw(data) {
  console.log("data", data);
  let neighborhoods = d3.set(data.map(function( d ) { return d.Neighborhood; } )).values();

  let days = d3.set(data.map(function( d ) { return d.Day; } )).values();
  days.reverse();

  scale.x.domain(days);
  scale.y.domain(neighborhoods);

  let gx = svg2.append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", translate(config.plot.x, config.plot.y + config.plot.height))
    .call(axis.x);

  let gy = svg2.append("g")
    .attr("id", "y-axis")
    .attr("class", "axis")
    .attr("transform", translate(config.plot.x, config.plot.y))
    .call(axis.y);

  let counts = data.map(d => d.Count);
  let min = d3.min(counts);
  let max = d3.max(counts);

  scale.color.domain([min, max]);

  let cells = plot.selectAll('rect')
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => scale.x(d.Day))
    .attr("y", d => scale.y(d.Neighborhood))
    .attr("width", d => scale.x.bandwidth())
    .attr("height", d => scale.y.bandwidth())
    .style("fill", d => scale.color(d.Count))
    .style("stroke", d => scale.color(d.Count));

  // https://observablehq.com/@sjengle/interactivity?collection=@sjengle/interactive-scatterplot
  cells.on("mouseover.highlight", function(d) {
    d3.select(this)
      .raise()
      .style("stroke", "grey")
      .style("stroke-width", 1);
  });

  cells.on("mouseout.highlight", function(d) {
    d3.select(this).style("stroke", null);
  });

  cells.on("mouseover.tooltip", function(d) {
    let div = d3.select("body").append("div");

    div.attr("id", "details");
    div.attr("class", "tooltip");

    let rows = div.append("table")
      .selectAll("tr")
      .data(Object.keys(d))
      .enter()
      .append("tr");

    rows.append("th").text(key => tooltipMap[key]);
    rows.append("td").text(key => d[key]);

    div.style("display", "inline");
  });

  cells.on("mousemove.tooltip", function(d) {
    let div = d3.select("div#details");

    let bbox = div.node().getBoundingClientRect();

    div.style("left", (d3.event.pageX + 8) + "px")
    div.style("top",  (d3.event.pageY - bbox.height - 8) + "px");
  });

  cells.on("mouseout.tooltip", function(d) {
    d3.selectAll("div#details").remove();
  });

  drawTitles();
  drawLegend();
}

// https://bl.ocks.org/mbostock/1086421
function drawLegend() {
  let legend = svg2.append("g")
    .attr("id", "legend")
    .attr("transform", translate(config.legend.x, config.legend.y));

  legend.append("rect")
    .attr("width", config.legend.width)
    .attr("height", config.legend.height)
    .attr("fill", "url(#gradient)");

  let gradientScale = d3.scaleLinear()
    .domain([0, 100])
    .range(scale.color.domain());

  let gradient = svg2.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")

  gradient.selectAll("stop")
    .data(d3.ticks(0, 100, 50))
    .enter()
    .append("stop")
    .attr("offset", d => d + "%")
    .attr("stop-color", d => scale.color(gradientScale(d)));

  let legendScale = d3.scaleLinear()
    .domain(scale.color.domain())
    .range([0, config.legend.width]);

  let legendAxis = d3.axisBottom(legendScale)
    .tickValues(scale.color.domain())
    .tickSize(5);

  legend.append("g")
    .call(legendAxis)
    .attr("transform", translate(0, config.legend.height))
}

function drawTitles() {
  /*let title = svg.append("text")
    .text("Last 30 Days of Vehicle Break Ins")
    .attr("id", "title")
    .attr("x", 180)
    .attr("y", 26)
    .attr("font-size", "26px");*/

  let x = svg2.append("text")
    .text("Day of the Week")
    .attr("id", "axisTitle")
    .attr("x", 510)
    .attr("y", 480)
    .attr("font-size", "16px")
    .attr("font-weight", "bold");

  let y = svg2.append("text")
    .text("Neighborhoood")
    .attr("id", "axisTitle")
    .attr("x", 52)
    .attr("y", 45)
    .attr("font-size", "14px")
    .attr("font-weight", "bold");
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}