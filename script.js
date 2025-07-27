let currentScene = 0;
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

  // Show/hide navigation buttons
  d3.select("#prev").style("display", scene === 0 ? "none" : "inline-block");
  d3.select("#next").style("display", scene === 3 ? "none" : "inline-block");

  if (scene === 0) drawScene1();
  else if (scene === 1) drawScene2();
  else if (scene === 2) drawScene3();
  else if (scene === 3) drawScene4();
}

// Navigation buttons
d3.select("#prev").on("click", () => {
  if (currentScene > 0) {
    currentScene--;
    renderScene(currentScene);
  }
});

d3.select("#next").on("click", () => {
  if (currentScene < 3) {
    currentScene++;
    renderScene(currentScene);
  }
});

const color = d3.scaleOrdinal()
  .domain(["USA", "Germany", "Japan", "Korea", "UK", "Italy", "Other", "Sweden"])
  .range(["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#7f7f7f", "#17becf"]);

function createSVG() {
  return d3.select("#vis")
    .append("svg")
    .attr("width", 960)
    .attr("height", 600)
    .style("display", "block")
    .style("margin", "0 auto");
}

function drawScene1() {
  const svg = createSVG();
  const margin = { top: 60, right: 250, bottom: 100, left: 70 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(carData, v => ({
    avgPrice: d3.mean(v, d => d.price),
    count: v.length,
    country: v[0].brand_group
  }), d => d.manufacturer);

  const data = Array.from(grouped, ([manufacturer, values]) => ({
    manufacturer, ...values
  })).sort((a, b) => a.avgPrice - b.avgPrice);

  const x = d3.scaleBand().domain(data.map(d => d.manufacturer)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.avgPrice)]).nice().range([height, 0]);
  const radius = d3.scaleSqrt().domain([0, d3.max(data, d => d.count)]).range([4, 20]);
  const tooltip = d3.select("#tooltip");

  g.append("g").attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-45)").style("text-anchor", "end");

  g.append("g").call(d3.axisLeft(y).tickFormat(d3.format(",")));

  g.append("text").attr("x", width / 2).attr("y", -30).attr("text-anchor", "middle")
    .attr("font-size", "18px").attr("font-weight", "bold")
    .text("Average Used Car Price by Brand (Colored by Country Group)");

  g.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("cy", d => y(d.avgPrice))
    .attr("r", d => radius(d.count))
    .attr("fill", d => color(d.country))
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.manufacturer}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}<br>Listings: ${d.count}<br>Country: ${d.country}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));

  const legend = svg.append("g").attr("transform", `translate(${width + margin.left + 20},${margin.top})`);
  color.domain().forEach((country, i) => {
    const yOffset = i * 25;
    legend.append("circle").attr("cx", 0).attr("cy", yOffset).attr("r", 6).attr("fill", color(country));
    legend.append("text").attr("x", 15).attr("y", yOffset + 5).text(country)
      .attr("alignment-baseline", "middle").attr("font-size", "13px");
  });

  const japanTextX = x("mazda");
  const japanTextY = y(25000);

  g.append("text")
    .attr("x", japanTextX)
    .attr("y", japanTextY)
    .attr("text-anchor", "middle")
    .attr("fill", "green")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Japanese brands mostly in low-mid price range");

  const germanTextX = x("bmw");
  const germanTextY = y(8000);

  g.append("text")
    .attr("x", germanTextX)
    .attr("y", germanTextY)
    .attr("text-anchor", "middle")
    .attr("fill", "red")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("German brands span a wide range but tend to be higher priced");

  const japanPoints = data.filter(d => d.country === "Japan");
  g.selectAll(".japan-line")
    .data(japanPoints)
    .enter()
    .append("line")
    .attr("class", "japan-line")
    .attr("x1", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y1", d => y(d.avgPrice))
    .attr("x2", japanTextX)
    .attr("y2", japanTextY)
    .attr("stroke", "green")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.4);

  const germanPoints = data.filter(d => d.country === "Germany");
  g.selectAll(".german-line")
    .data(germanPoints)
    .enter()
    .append("line")
    .attr("class", "german-line")
    .attr("x1", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y1", d => y(d.avgPrice))
    .attr("x2", germanTextX)
    .attr("y2", germanTextY)
    .attr("stroke", "red")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.4);
}


function drawScene2() {
  const svg = createSVG();
  const margin = { top: 60, right: 250, bottom: 100, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(carData, v => ({ count: v.length, country: v[0].brand_group }), d => d.manufacturer);
  const data = Array.from(grouped, ([manufacturer, values]) => ({ manufacturer, ...values })).sort((a, b) => b.count - a.count);

  const x = d3.scaleBand().domain(data.map(d => d.manufacturer)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);
  const tooltip = d3.select("#tooltip");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-45)").style("text-anchor", "end");
  g.append("g").call(d3.axisLeft(y));

  g.append("text").attr("x", width / 2).attr("y", -30).attr("text-anchor", "middle")
    .attr("font-size", "18px").attr("font-weight", "bold")
    .text("Number of Listings by Brand (Colored by Country Group)");

  g.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", d => x(d.manufacturer))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", d => color(d.country))
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.manufacturer}</strong><br>Listings: ${d.count}<br>Country: ${d.country}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));

  const legend = svg.append("g").attr("transform", `translate(${width + margin.left + 20},${margin.top})`);
  color.domain().forEach((country, i) => {
    const yOffset = i * 25;
    legend.append("circle").attr("cx", 0).attr("cy", yOffset).attr("r", 6).attr("fill", color(country));
    legend.append("text").attr("x", 15).attr("y", yOffset + 5).text(country)
      .attr("alignment-baseline", "middle").attr("font-size", "13px");
  });

 
  const japaneseBrands = ["toyota", "honda", "nissan", "subaru", "lexus", "mitsubishi"];
  const japanLineY = 7000;

  g.append("text")
    .attr("x", (x("toyota") + x("mitsubishi")) / 2)
    .attr("y", y(japanLineY) - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "darkgreen")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Japanese brands have high listings");

  g.append("line")
    .attr("x1", x("toyota") + x.bandwidth() / 2)
    .attr("x2", x("mitsubishi") + x.bandwidth() / 2)
    .attr("y1", y(japanLineY))
    .attr("y2", y(japanLineY))
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 1);

  japaneseBrands.forEach(brand => {
    g.append("line")
      .attr("x1", x(brand) + x.bandwidth() / 2)
      .attr("x2", x(brand) + x.bandwidth() / 2)
      .attr("y1", y(japanLineY))
      .attr("y2", y(data.find(d => d.manufacturer === brand).count))
      .attr("stroke", "darkgreen")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-width", 1);
  });

  const germanBrands = ["bmw", "mercedes-benz", "audi", "volkswagen", "porsche"];
  const lineY = 5000; // 기존보다 낮춘 높이

  g.append("text")
    .attr("x", (x("bmw") + x("porsche")) / 2)
    .attr("y", y(lineY) - 10) // 이 부분이 핵심
    .attr("text-anchor", "middle")
    .attr("fill", "firebrick")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("German brands have moderate listings");

  g.append("line")
    .attr("x1", x("bmw") + x.bandwidth() / 2)
    .attr("x2", x("porsche") + x.bandwidth() / 2)
    .attr("y1", y(lineY))
    .attr("y2", y(lineY))
    .attr("stroke", "firebrick")
    .attr("stroke-width", 1);

  germanBrands.forEach(brand => {
  g.append("line")
    .attr("x1", x(brand) + x.bandwidth() / 2)
    .attr("x2", x(brand) + x.bandwidth() / 2)
    .attr("y1", y(lineY))      .attr("y2", y(data.find(d => d.manufacturer === brand).count))
    .attr("stroke", "firebrick")
    .attr("stroke-dasharray", "4,3")
    .attr("stroke-width", 1);
  });


}

function drawScene3() {
  const svg = createSVG();
  const margin = { top: 60, right: 50, bottom: 100, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const grouped = d3.rollup(carData, v => d3.mean(v, d => d.price), d => d.weekday);
  const data = Array.from(grouped, ([weekday, avgPrice]) => ({ weekday, avgPrice }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  const x = d3.scaleBand().domain(weekdayOrder).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.avgPrice)]).nice().range([height, 0]);
  const colorScale = d3.scaleLinear().domain(d3.extent(data, d => d.avgPrice)).range(["#c6dbef", "#08519c"]);
  const tooltip = d3.select("#tooltip");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).tickFormat(d3.format(",")));

  g.append("text").attr("x", width / 2).attr("y", -30).attr("text-anchor", "middle")
    .attr("font-size", "18px").attr("font-weight", "bold")
    .text("Average Used Car Price by Weekday");

  g.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", d => x(d.weekday))
    .attr("y", d => y(d.avgPrice))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.avgPrice))
    .attr("fill", d => colorScale(d.avgPrice))
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));

  g.selectAll("text.label")
    .data(data)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("y", d => y(d.avgPrice) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text(d => `$${d3.format(",.0f")(d.avgPrice)}`);
}

function drawScene4() {
  const svg = createSVG();
  const margin = { top: 60, right: 50, bottom: 100, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const grouped = d3.rollup(carData, v => v.length, d => d.weekday);
  const data = Array.from(grouped, ([weekday, count]) => ({ weekday, count }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  const x = d3.scaleBand().domain(weekdayOrder).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);
  const colorScale = d3.scaleLinear().domain(d3.extent(data, d => d.count)).range(["#c6dbef", "#08519c"]);
  const tooltip = d3.select("#tooltip");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).tickFormat(d3.format(",")));

  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Number of Listings by Weekday");

  g.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", d => x(d.weekday))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", d => colorScale(d.count))
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Listings: ${d.count}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));

  g.selectAll("text.label")
    .data(data)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("y", d => y(d.count) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text(d => d3.format(",")(d.count));
}

