let currentScene = -1;  //
let carData;

// Load and clean data
d3.csv("data/used_cars_cleaned.csv").then(data => {
  data.forEach(d => {
    d.price = +d.price;
  });
  carData = data.filter(d => d.price > 1000 && d.price < 100000);
  
  // Intro 화면만 먼저 보여주고 renderScene은 호출하지 않음
});

// Start 버튼 누르면 Scene 1 시작
d3.select("#start-btn").on("click", () => {
  currentScene = 0;
  renderScene(currentScene);
});

// Prev/Next 버튼
d3.select("#prev").on("click", () => {
  if (currentScene === 0) {
    // Intro로 돌아감
    currentScene = -1;
    d3.select("#intro").style("display", "block");
    d3.select("#vis-section").style("display", "none");
  } else if (currentScene >= 0) {
    currentScene--;
    renderScene(currentScene);
  }
});

d3.select("#next").on("click", () => {
  if (currentScene < 5) {
    currentScene++;
    renderScene(currentScene);
  }
});

// renderScene 함수
function renderScene(scene) {
  d3.select("#intro").style("display", "none");
  d3.select("#vis-section").style("display", "block");

  d3.select("#vis").html("");

  if (scene <= 3) {
    d3.select("#scene-title").text(`Scene ${scene + 1}`);
  } else {
    d3.select("#scene-title").text("");
  }

  d3.select("#prev").style("display", scene === -1 ? "none" : "inline-block");
  d3.select("#next").style("display", scene === 4 ? "none" : "inline-block");

  if (scene === 0) drawScene1();
  else if (scene === 1) drawScene2();
  else if (scene === 2) drawScene3();
  else if (scene === 3) drawScene4();
  else if (scene === 4) drawScene5();

  window.scrollTo({ top: 0, behavior: 'smooth' });

}


const color = d3.scaleOrdinal()
  .domain(["USA", "Germany", "Japan", "Korea", "UK", "Italy", "Sweden"])
  .range(["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#17becf"]);

function createSVG() {
  return d3.select("#vis")
    .append("svg")
    .attr("width", 960)
    .attr("height", 550)
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

  const dots = g.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("cy", d => y(d.avgPrice))
    .attr("r", d => radius(d.count))
    .attr("fill", d => color(d.country))
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.manufacturer}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}<br>Listings: ${d.count}<br>Country: ${d.country}`);
      g.selectAll("circle").attr("opacity", c => c.country === d.country ? 1 : 0.1);
      d3.selectAll(".annotation").style("display", "none"); // 🔥 주석 숨김
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
      g.selectAll("circle").attr("opacity", 0.8);
      if (activeCountry === null) {
        d3.selectAll(".annotation").style("display", "block"); // 🔥 주석 다시 보임
      }
    });

  const legendBoxWidth = 140;
  const legendBoxHeight = color.domain().length * 25 + 30;
  const legendX = width + margin.left + 10;
  const legendY = margin.top - 35;

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 8)
    .attr("ry", 8);

  svg.append("text")
    .attr("x", legendX + 10)
    .attr("y", legendY + 18)
    .text("Click a country to filter")
    .attr("font-size", "13px")
    .attr("fill", "#666");

  const legend = svg.append("g")
    .attr("transform", `translate(${legendX + 10}, ${legendY + 30})`);

  let activeCountry = null;
  let brandLabels;

  color.domain().forEach((country, i) => {
    const yOffset = i * 25;
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", yOffset)
      .attr("r", 6)
      .attr("fill", color(country))
      .style("cursor", "pointer")
      .on("click", () => toggleCountryFilter(country));

    legend.append("text")
      .attr("x", 15)
      .attr("y", yOffset + 5)
      .text(country)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "13px")
      .style("cursor", "pointer")
      .on("click", () => toggleCountryFilter(country));
  });

  function toggleCountryFilter(country) {
    if (activeCountry === country) {
      activeCountry = null;
      dots.attr("opacity", 0.8);
      d3.selectAll(".annotation").style("display", "block"); // 🔥 다시 주석 보임
      if (brandLabels) brandLabels.remove();
    } else {
      activeCountry = country;
      dots.attr("opacity", d => d.country === country ? 1 : 0.1);
      d3.selectAll(".annotation").style("display", "none"); // 🔥 주석 숨김
      if (brandLabels) brandLabels.remove();
      brandLabels = g.selectAll(".brand-label")
        .data(data.filter(d => d.country === country))
        .enter()
        .append("text")
        .attr("class", "brand-label annotation")  // 🔥 브랜드명도 주석
        .attr("x", d => x(d.manufacturer) + x.bandwidth() / 2 + 8)
        .attr("y", d => y(d.avgPrice) + 12)
        .attr("text-anchor", "start")
        .attr("fill", color(country))
        .attr("font-size", "11px")
        .text(d => d.manufacturer);
    }
  }

  // === JAPAN Annotation ===
  const japanBrands = data.filter(d => d.country === "Japan");
  const japanY = y(27000);
  const japanMinX = d3.min(japanBrands, d => x(d.manufacturer) + x.bandwidth() / 2);
  const japanMaxX = d3.max(japanBrands, d => x(d.manufacturer) + x.bandwidth() / 2);

  g.selectAll(".japan-line")
    .data(japanBrands)
    .enter()
    .append("line")
    .attr("class", "annotation")
    .attr("x1", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y1", d => y(d.avgPrice))
    .attr("x2", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y2", japanY)
    .attr("stroke", "green")
    .attr("stroke-dasharray", "4 2")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.6);

  g.append("line")
    .attr("class", "annotation")
    .attr("x1", japanMinX)
    .attr("x2", japanMaxX)
    .attr("y1", japanY)
    .attr("y2", japanY)
    .attr("stroke", "green")
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", 0.6);

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (japanMinX + japanMaxX) / 2)
    .attr("y", japanY - 15)
    .attr("text-anchor", "middle")
    .attr("fill", "green")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Japanese brands mostly in low-mid price range");

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (japanMinX + japanMaxX) / 2)
    .attr("y", japanY)
    .attr("dy", "-2px")
    .attr("text-anchor", "middle")
    .attr("fill", "green")
    .attr("font-size", "12px")
    .text("Honda < Nissan < Toyota");

  // === GERMANY Annotation ===
  const germanBrands = data.filter(d => d.country === "Germany");
  const germanY = y(7000);
  const germanMinX = d3.min(germanBrands, d => x(d.manufacturer) + x.bandwidth() / 2);
  const germanMaxX = d3.max(germanBrands, d => x(d.manufacturer) + x.bandwidth() / 2);

  g.selectAll(".german-line")
    .data(germanBrands)
    .enter()
    .append("line")
    .attr("class", "annotation")
    .attr("x1", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y1", d => y(d.avgPrice))
    .attr("x2", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y2", germanY)
    .attr("stroke", "red")
    .attr("stroke-dasharray", "4 2")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.6);

  g.append("line")
    .attr("class", "annotation")
    .attr("x1", germanMinX)
    .attr("x2", germanMaxX)
    .attr("y1", germanY)
    .attr("y2", germanY)
    .attr("stroke", "red")
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", 0.6);

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (germanMinX + germanMaxX) / 2)
    .attr("y", germanY + 18)
    .attr("text-anchor", "middle")
    .attr("fill", "red")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("German brands span a wide range but tend to be higher priced");

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (germanMinX + germanMaxX) / 2)
    .attr("y", germanY + 34)
    .attr("text-anchor", "middle")
    .attr("fill", "red")
    .attr("font-size", "12px")
    .text("BMW < Mercedes < Audi");

  // === Brand name labels below dots ===
  const specialLabels = [
    { brand: "honda", color: "green" },
    { brand: "nissan", color: "green" },
    { brand: "toyota", color: "green" },
    { brand: "bmw", color: "red" },
    { brand: "mercedes-benz", color: "red" },
    { brand: "audi", color: "red" }
  ];

  g.selectAll(".special-label")
    .data(data.filter(d => specialLabels.map(l => l.brand).includes(d.manufacturer.toLowerCase())))
    .enter()
    .append("text")
    .attr("class", "annotation")
    .attr("x", d => x(d.manufacturer) + x.bandwidth() / 2)
    .attr("y", d => y(d.avgPrice) + radius(d.count) + 14)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", d => {
      const label = specialLabels.find(l => l.brand === d.manufacturer.toLowerCase());
      return label ? label.color : "black";
    })
    .text(d => d.manufacturer.charAt(0).toUpperCase() + d.manufacturer.slice(1));
}



function drawScene2() {
  const svg = createSVG();
  const margin = { top: 60, right: 250, bottom: 100, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.rollup(carData, v => ({ count: v.length, country: v[0].brand_group }), d => d.manufacturer);
  const data = Array.from(grouped, ([manufacturer, values]) => ({ manufacturer, ...values }))
    .sort((a, b) => b.count - a.count);

  const x = d3.scaleBand().domain(data.map(d => d.manufacturer)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);
  const tooltip = d3.select("#tooltip");

  let activeCountry = null;

  // ✅ x축
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // ✅ y축
  g.append("g")
    .call(d3.axisLeft(y));

  // ✅ 타이틀
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Number of Listings by Brand (Colored by Country Group)");

  // ✅ 막대
  const bars = g.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", d => x(d.manufacturer))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", d => color(d.country))
    .attr("opacity", 1)
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.manufacturer}</strong><br>Listings: ${d.count}<br>Country: ${d.country}`);
      bars.transition().duration(200)
        .attr("opacity", b => b.country === d.country ? 1 : 0.1);
      d3.selectAll(".annotation").style("display", "none");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
      bars.transition().duration(200)
        .attr("opacity", b => activeCountry ? (b.country === activeCountry ? 1 : 0.1) : 1);
      if (!activeCountry) {
        d3.selectAll(".annotation").style("display", "block");
      }
    });

  // ✅ Annotation: Japanese
  const japaneseBrands = ["toyota", "honda", "nissan", "subaru", "lexus", "mitsubishi"];
  const japanLineY = 7000;

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (x("toyota") + x("mitsubishi")) / 2)
    .attr("y", y(japanLineY) - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "darkgreen")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Japanese brands have high listings");

  g.append("line")
    .attr("class", "annotation")
    .attr("x1", x("toyota") + x.bandwidth() / 2)
    .attr("x2", x("mitsubishi") + x.bandwidth() / 2)
    .attr("y1", y(japanLineY))
    .attr("y2", y(japanLineY))
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 1);

  japaneseBrands.forEach(brand => {
    g.append("line")
      .attr("class", "annotation")
      .attr("x1", x(brand) + x.bandwidth() / 2)
      .attr("x2", x(brand) + x.bandwidth() / 2)
      .attr("y1", y(japanLineY))
      .attr("y2", y(data.find(d => d.manufacturer === brand).count))
      .attr("stroke", "darkgreen")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-width", 1);
  });

  // ✅ Annotation: German
  const germanBrands = ["bmw", "mercedes-benz", "audi", "volkswagen", "porsche"];
  const lineY = 5000;

  g.append("text")
    .attr("class", "annotation")
    .attr("x", (x("bmw") + x("porsche")) / 2)
    .attr("y", y(lineY) - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "firebrick")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("German brands have moderate listings");

  g.append("line")
    .attr("class", "annotation")
    .attr("x1", x("bmw") + x.bandwidth() / 2)
    .attr("x2", x("porsche") + x.bandwidth() / 2)
    .attr("y1", y(lineY))
    .attr("y2", y(lineY))
    .attr("stroke", "firebrick")
    .attr("stroke-width", 1);

  germanBrands.forEach(brand => {
    g.append("line")
      .attr("class", "annotation")
      .attr("x1", x(brand) + x.bandwidth() / 2)
      .attr("x2", x(brand) + x.bandwidth() / 2)
      .attr("y1", y(lineY))
      .attr("y2", y(data.find(d => d.manufacturer === brand).count))
      .attr("stroke", "firebrick")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-width", 1);
  });

  // ✅ Legend Box
  const legendBoxWidth = 140;
  const legendBoxHeight = color.domain().length * 25 + 30;
  const legendX = width + margin.left + 10;
  const legendY = margin.top - 35;

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 8)
    .attr("ry", 8);

  svg.append("text")
    .attr("x", legendX + 10)
    .attr("y", legendY + 18)
    .text("Click a country to filter")
    .attr("font-size", "13px")
    .attr("fill", "#666");

  const legend = svg.append("g")
    .attr("transform", `translate(${legendX + 10}, ${legendY + 30})`);

  color.domain().forEach((country, i) => {
    const yOffset = i * 25;

    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", yOffset)
      .attr("r", 6)
      .attr("fill", color(country))
      .style("cursor", "pointer")
      .on("click", () => toggleCountryFilter(country));

    legend.append("text")
      .attr("x", 15)
      .attr("y", yOffset + 5)
      .text(country)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "13px")
      .style("cursor", "pointer")
      .on("click", () => toggleCountryFilter(country));
  });

  function toggleCountryFilter(country) {
    if (activeCountry === country) {
      activeCountry = null;
      bars.transition().duration(300).attr("opacity", 1);
      d3.selectAll(".annotation").style("display", "block");
    } else {
      activeCountry = country;
      bars.transition().duration(300)
        .attr("opacity", d => d.country === country ? 1 : 0.1);
      d3.selectAll(".annotation").style("display", "none");
    }
  }
}


function drawScene3() {
  const svg = createSVG();
  const margin = { top: 60, right: 50, bottom: 140, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const grouped = d3.rollup(carData, v => d3.mean(v, d => d.price), d => d.weekday);
  const data = Array.from(grouped, ([weekday, avgPrice]) => ({ weekday, avgPrice }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  const x = d3.scaleBand()
    .domain(weekdayOrder)
    .range([0, width])
    .paddingInner(0.05)
    .paddingOuter(0.05);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.avgPrice)]).nice()
    .range([height, 0]);

  const colorScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.avgPrice))
    .range(["#c6dbef", "#08519c"]);

  const tooltip = d3.select("#tooltip");

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
  .call(d3.axisLeft(y).tickFormat(d => `$${d3.format(",")(d)}`));


  // Title
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Average Used Car Price by Weekday");

  // Bars
  const bars = g.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", d => x(d.weekday))
    .attr("y", d => y(d.avgPrice))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.avgPrice))
    .attr("fill", d => colorScale(d.avgPrice))
    .on("mouseover", function (event, d) {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}`);
      bars.transition().style("opacity", b => b.weekday === d.weekday ? 1 : 0.2);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
      bars.transition().style("opacity", 1);
    });

  // Price labels above bars
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

  // Annotation: Highest average price on Sunday
  const sunday = data.find(d => d.weekday === "Sunday");
  // Annotation: Highest average price on Sunday
  g.append("text")
    .attr("x", x("Sunday") + x.bandwidth() / 2)
    .attr("y", y(sunday.avgPrice) - 35)  // 다시 위로 이동
    .attr("text-anchor", "middle")
    .attr("fill", "#08519c")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Highest avg price");

  g.append("line")
    .attr("x1", x("Sunday") + x.bandwidth() / 2)
    .attr("x2", x("Sunday") + x.bandwidth() / 2)
    .attr("y1", y(sunday.avgPrice) - 10)
    .attr("y2", y(sunday.avgPrice) - 30)  // 선도 함께 위로 이동
    .attr("stroke", "#08519c")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 2");

  // Annotation: Lower prices on Monday, Tuesday
  ["Monday", "Tuesday"].forEach(day => {
    const entry = data.find(d => d.weekday === day);
    g.append("text")
      .attr("x", x(day) + x.bandwidth() / 2)
      .attr("y", y(entry.avgPrice) + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "gray")
      .attr("font-size", "12px")
      .text("Lower prices");
  });

  // Color legend
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "color-gradient");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: "#c6dbef" },
      { offset: "100%", color: "#08519c" }
    ])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  const legendWidth = 200;
  const legendHeight = 10;

  const legend = svg.append("g")
    .attr("transform", `translate(${(width + margin.left + margin.right - legendWidth) / 2}, ${height + margin.top + 50})`);

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#color-gradient)");

  legend.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Color = Avg. Used Car Price");
}


function drawScene4() {
  const svg = createSVG();
  const margin = { top: 60, right: 50, bottom: 140, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // 평균 가격 (bar chart용)
  const groupedPrices = d3.rollup(carData, v => d3.mean(v, d => d.price), d => d.weekday);
  const priceData = Array.from(groupedPrices, ([weekday, avgPrice]) => ({ weekday, avgPrice }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  // Listings 수 (line chart용)
  const groupedListings = d3.rollup(carData, v => v.length, d => d.weekday);
  const listingsData = Array.from(groupedListings, ([weekday, count]) => ({ weekday, count }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  // y축 범위 설정
  const yPrice = d3.scaleLinear()
    .domain([0, d3.max(priceData, d => d.avgPrice)]).nice()
    .range([height, 0]);

  const yListing = d3.scaleLinear()
    .domain([0, d3.max(listingsData, d => d.count)]).nice()
    .range([height, 0]);

  const x = d3.scaleBand()
    .domain(weekdayOrder)
    .range([0, width])
    .paddingInner(0.05)
    .paddingOuter(0.05);

  const colorScale = d3.scaleLinear()
    .domain(d3.extent(priceData, d => d.avgPrice))
    .range(["#c6dbef", "#08519c"]);

  const tooltip = d3.select("#tooltip");

  // x축
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // y축 (price)
  g.append("g")
    .call(d3.axisLeft(yPrice).tickFormat(d3.format(",")));

  // 왼쪽 y축 (평균 가격)
  g.append("g")
    .call(d3.axisLeft(yPrice).tickFormat(d => `$${d3.format(",")(d)}`));

  // 오른쪽 y축 (리스트 수)
  g.append("g")
    .attr("transform", `translate(${width}, 0)`)
    .call(d3.axisRight(yListing).tickFormat(d3.format(",")))
    .append("text")
    .attr("x", 40)
    .attr("y", -20)
    .attr("fill", "crimson")
    .attr("text-anchor", "start")
    .attr("font-size", "12px")


  // Title
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Average Price by Weekday (with Listings Line)");

  // Bar chart for price
  const bars = g.selectAll("rect")
    .data(priceData)
    .enter().append("rect")
    .attr("x", d => x(d.weekday))
    .attr("y", d => yPrice(d.avgPrice))
    .attr("width", x.bandwidth())
    .attr("height", d => height - yPrice(d.avgPrice))
    .attr("fill", d => colorScale(d.avgPrice))
    .on("mouseover", function (event, d) {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}`);
      bars.transition().style("opacity", b => b.weekday === d.weekday ? 1 : 0.2);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
      bars.transition().style("opacity", 1);
    });

  // Price labels
  g.selectAll("text.price-label")
    .data(priceData)
    .enter().append("text")
    .attr("class", "price-label")
    .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("y", d => yPrice(d.avgPrice) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text(d => `$${d3.format(",.0f")(d.avgPrice)}`);

  // Listings line
  const line = d3.line()
    .x(d => x(d.weekday) + x.bandwidth() / 2)
    .y(d => yListing(d.count));

  g.append("path")
    .datum(listingsData)
    .attr("fill", "none")
    .attr("stroke", "crimson")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Listings point + label
  g.selectAll("circle.listing-point")
    .data(listingsData)
    .enter().append("circle")
    .attr("class", "listing-point")
    .attr("cx", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("cy", d => yListing(d.count))
    .attr("r", 4)
    .attr("fill", "crimson");

  g.selectAll("text.listing-label")
    .data(listingsData)
    .enter().append("text")
    .attr("class", "listing-label")
    .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("y", d => yListing(d.count) - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "crimson")
    .text(d => d3.format(",")(d.count));
}



function drawScene5() {
  const container = d3.select("#vis");
  container.append("div")
    .attr("style", "text-align: center; padding: 100px 50px; max-width: 800px; margin: auto;")
    .html(`
      <h2 style="font-size: 28px; color: #333;">Summary & Insights</h2>
      <ul style="text-align: left; font-size: 18px; line-height: 1.6; color: #444; max-width: 600px; margin: 30px auto;">
        <li><strong>Japanese brands</strong> are generally more affordable.</li>
        <li><strong>German brands</strong> span wider prices but are often expensive.</li>
        <li><strong>Monday and Tuesday</strong> offer more listings with lower prices.</li>
        <li><strong>Sunday</strong> has the fewest listings and highest prices.</li>
      </ul>
      <p style="font-size: 20px; color: #555;">Use these insights to make smarter used car purchases!</p>
    `);
}

