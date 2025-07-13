let data;

d3.csv("data/car_sales_data_final.csv").then(raw => {
  // Convert numeric fields
  data = raw.map(d => ({
    ...d,
    Sale_Price: +d["Sale Price"],
    Age: +d["Age"],
    Month: +d["Month"]
  }));

  // Start with Scene 0
  renderScene(0);
});

function renderScene(sceneId) {
  d3.select("#chart").html("");
  d3.select("#annotation").html("");

  if (sceneId === 0) renderScene0();
  else if (sceneId === 1) renderScene1();
  else if (sceneId === 2) renderScene2();
  else if (sceneId === 3) renderScene3();
}

// Scene 0: Brand Depreciation Trend
function renderScene0() {
  d3.select("#annotation").text("This chart shows how average car prices vary by brand as vehicle age increases.");

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 50, right: 150, bottom: 60, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Nest by brand and age
  const nested = d3.groups(data, d => d["Car Make"], d => d["Age"])
    .map(([make, ageGroup]) => ({
      make,
      values: ageGroup.map(([age, records]) => ({
        age: +age,
        avgPrice: d3.mean(records, d => d.Sale_Price)
      })).sort((a, b) => a.age - b.age)
    }));

  const allAges = Array.from(new Set(data.map(d => d.Age))).sort((a, b) => a - b);

  const x = d3.scaleLinear()
    .domain(d3.extent(allAges))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(nested, b => d3.min(b.values, d => d.avgPrice)) * 0.95,
             d3.max(nested, b => d3.max(b.values, d => d.avgPrice)) * 1.05])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(nested.map(d => d.make))
    .range(d3.schemeCategory10);

  const xAxis = d3.axisBottom(x)
    .ticks(allAges.length)
    .tickFormat(d => `${d} yrs`);
  const yAxis = d3.axisLeft(y).tickFormat(d3.format(","));

  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  g.append("g").call(yAxis);

  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Car Age");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Average Price");

  const line = d3.line()
    .x(d => x(d.age))
    .y(d => y(d.avgPrice));

  g.selectAll(".line")
    .data(nested)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.make))
    .attr("stroke-width", 2)
    .attr("d", d => line(d.values));

  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

  nested.forEach((d, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(d.make));

    legend.append("text")
      .attr("x", 18)
      .attr("y", i * 20 + 10)
      .text(d.make)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });
}

// Placeholders for Scenes 1–3
function renderScene1() {
  d3.select("#annotation").text("Select a specific model to explore its depreciation trend over time.");
}

function renderScene2() {
  d3.select("#annotation").text("Compare average prices in different seasons for cars of the same age.");
}

function renderScene3() {
  d3.select("#annotation").text("Use the dropdowns to freely explore trends by brand, model, and year.");
}
