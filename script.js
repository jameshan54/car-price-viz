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
  .domain(["USA", "Germany", "Japan", "Korea", "UK", "Italy", "Other", "Sweden"])
  .range(["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b", "#7f7f7f", "#17becf"]);

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
      g.selectAll("circle")
        .attr("opacity", c => c.country === d.country ? 1 : 0.1);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
      g.selectAll("circle").attr("opacity", 0.8);
    });

  // Interactive Legend
  const legend = svg.append("g").attr("transform", `translate(${width + margin.left + 20},${margin.top})`);
  let activeCountry = null;

  color.domain().forEach((country, i) => {
    const yOffset = i * 25;
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", yOffset)
      .attr("r", 6)
      .attr("fill", color(country))
      .style("cursor", "pointer")
      .on("click", () => {
        if (activeCountry === country) {
          // Reset
          activeCountry = null;
          dots.attr("opacity", 0.8);
        } else {
          activeCountry = country;
          dots.attr("opacity", d => d.country === country ? 1 : 0.1);
        }
      });

    legend.append("text")
      .attr("x", 15)
      .attr("y", yOffset + 5)
      .text(country)
      .attr("alignment-baseline", "middle")
      .attr("font-size", "13px")
      .style("cursor", "pointer")
      .on("click", () => {
        if (activeCountry === country) {
          activeCountry = null;
          dots.attr("opacity", 0.8);
        } else {
          activeCountry = country;
          dots.attr("opacity", d => d.country === country ? 1 : 0.1);
        }
      });
  });

  // Annotations
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

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(",")));

  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
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

  // Bar 위 텍스트 (가격 라벨)
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

  // Annotation: Sunday 최고가
  const sunday = data.find(d => d.weekday === "Sunday");
  g.append("text")
    .attr("x", x("Sunday") + x.bandwidth() / 2)
    .attr("y", y(sunday.avgPrice) - 40)
    .attr("text-anchor", "middle")
    .attr("fill", "#08519c")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Highest average price");

  g.append("line")
    .attr("x1", x("Sunday") + x.bandwidth() / 2)
    .attr("x2", x("Sunday") + x.bandwidth() / 2)
    .attr("y1", y(sunday.avgPrice) - 10)
    .attr("y2", y(sunday.avgPrice) - 35)
    .attr("stroke", "#08519c")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 2");

  // Annotation: Monday, Tuesday 낮은 가격
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
}


function drawScene4() {
  const svg = createSVG();
  const margin = { top: 60, right: 60, bottom: 100, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Listings 수 (bar chart용)
  const groupedListings = d3.rollup(carData, v => v.length, d => d.weekday);
  const listingsData = Array.from(groupedListings, ([weekday, count]) => ({ weekday, count }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  // 평균 가격 (line chart용)
  const groupedPrices = d3.rollup(carData, v => d3.mean(v, d => d.price), d => d.weekday);
  const priceData = Array.from(groupedPrices, ([weekday, avgPrice]) => ({ weekday, avgPrice }))
    .filter(d => weekdayOrder.includes(d.weekday))
    .sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday));

  const x = d3.scaleBand()
    .domain(weekdayOrder)
    .range([0, width])
    .paddingInner(0.05)
    .paddingOuter(0.05);

  const yLeft = d3.scaleLinear()
    .domain([0, d3.max(listingsData, d => d.count)]).nice()
    .range([height, 0]);

  const yRight = d3.scaleLinear()
    .domain([d3.min(priceData, d => d.avgPrice) * 0.95, d3.max(priceData, d => d.avgPrice) * 1.05])
    .range([height, 0]);

  const colorScale = d3.scaleLinear()
    .domain(d3.extent(listingsData, d => d.count))
    .range(["#c6dbef", "#08519c"]);

  const tooltip = d3.select("#tooltip");

  // x축
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // 왼쪽 y축 (listing 수)
  g.append("g")
    .call(d3.axisLeft(yLeft).tickFormat(d3.format(",")));

  // 오른쪽 y축 (가격)
  g.append("g")
    .attr("transform", `translate(${width},0)`)
    .call(d3.axisRight(yRight).tickFormat(d3.format("$,.0f")));

  // Title
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Number of Listings by Weekday (with Avg. Price Line)");

  // Bar chart
  g.selectAll("rect")
    .data(listingsData)
    .enter().append("rect")
    .attr("x", d => x(d.weekday))
    .attr("y", d => yLeft(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - yLeft(d.count))
    .attr("fill", d => colorScale(d.count))
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Listings: ${d3.format(",")(d.count)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));

  // Bar labels
  g.selectAll("text.label")
    .data(listingsData)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("y", d => yLeft(d.count) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .text(d => d3.format(",")(d.count));

  // Line path (price)
  const line = d3.line()
    .x(d => x(d.weekday) + x.bandwidth() / 2)
    .y(d => yRight(d.avgPrice));

  g.append("path")
    .datum(priceData)
    .attr("fill", "none")
    .attr("stroke", "crimson")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Line circle markers
  g.selectAll("circle.price-point")
    .data(priceData)
    .enter()
    .append("circle")
    .attr("class", "price-point")
    .attr("cx", d => x(d.weekday) + x.bandwidth() / 2)
    .attr("cy", d => yRight(d.avgPrice))
    .attr("r", 4)
    .attr("fill", "crimson")
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip.html(`<strong>${d.weekday}</strong><br>Avg. Price: $${d3.format(",.0f")(d.avgPrice)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().style("opacity", 0));


  g.append("text")
  .attr("x", width - 10)
  .attr("y", 15)
  .attr("text-anchor", "end")
  .attr("fill", "#1f77b4")  // 변경된 색상
  .attr("font-size", "13px")
  .attr("font-weight", "bold")
  .text("More listings and lower prices on Mon/Tue,");

  g.append("text")
  .attr("x", width - 10)
  .attr("y", 32)
  .attr("text-anchor", "end")
  .attr("fill", "#1f77b4")  // 변경된 색상
  .attr("font-size", "13px")
  .attr("font-weight", "bold")
  .text("but fewer listings and higher prices on Sunday.");

};

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

