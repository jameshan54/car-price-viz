// script.js

let currentScene = 0;
let currentView = "brand";
let carData;

// Load and clean data
d3.csv("data/used_cars_cleaned.csv").then(data => {
  data.forEach(d => {
    d.price = +d.price;
  });
  carData = data.filter(d => d.price > 1000 && d.price < 100000);
  renderScene(currentScene);
});

// Scene rendering controller
function renderScene(scene) {
  d3.select("#vis").html("");
  d3.select("#scene-title").text(`Scene ${scene + 1}`);
  if (scene === 0) drawScene1();
}

// Navigation buttons
d3.select("#prev").on("click", () => {
  if (currentScene > 0) {
    currentScene--;
    currentView = "brand";
    renderScene(currentScene);
  }
});

d3.select("#next").on("click", () => {
  if (currentScene < 3) {
    currentScene++;
    currentView = "brand";
    renderScene(currentScene);
  }
});

// Scene 1: Average price per brand with color by country group
function drawScene1() {
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 960)
    .attr("height", 600);

  const margin = { top: 60, right: 250, bottom: 100, left: 70 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(
    carData,
    v => ({
      avgPrice: d3.mean(v, d => d.price),
      count: v.length,
      country: v[0].brand_group
    }),
    d => d.manufacturer
  );

  const data = Array.from(grouped, ([manufacturer, values]) => ({
    manufacturer,
    avgPrice: values.avgPrice,
    count: values.count,
    country: values.country
  }));

  data.sort((a, b) => a.avgPrice - b.avgPrice);

  const x = d3.scaleBand()
    .domain(data.map(d => d.manufacturer))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.avgPrice)]).nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(["USA", "Germany", "Japan", "Korea", "UK", "Italy", "Other", "Sweden"])
    .range(["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#7f7f7f", "#17becf"]);

  const radius = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.count)])
    .range([4, 20]);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(",")));

  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Average Used Car Price by Brand (Colored by Country Group)");

  const tooltip = d3.select("#tooltip");

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("cy", d => y(d.avgPrice))
    .attr("r", d => radius(d.count))
    .attr("fill", d => color(d.country))
    .attr("opacity", 0.8)
    .on("mouseover", function (event, d) {
      tooltip.transition().style("opacity", 1);
      tooltip.html(
        `<strong>${d.manufacturer}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}<br>Listings: ${d.count}<br>Country: ${d.country}`
      );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().style("opacity", 0);
    });

  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);

  const countries = color.domain();

  countries.forEach((country, i) => {
    const yOffset = i * 25;
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", yOffset)
      .attr("r", 6)
      .attr("fill", color(country));

    legend.append("text")
      .attr("x", 15)
      .attr("y", yOffset + 5)
      .text(country)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "13px");
  });
}
