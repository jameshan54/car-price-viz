let currentScene = 0;

d3.csv("data/car_prices.csv").then(data => {
  // Basic preprocessing
  data.forEach(d => {
    d.Price = +d.Price;
    d.Year = +d.Year;
    d.Month = +d.Month;
  });

  drawScene(currentScene, data);
  
  d3.select("#next").on("click", () => {
    if (currentScene < 3) currentScene++;
    drawScene(currentScene, data);
  });

  d3.select("#prev").on("click", () => {
    if (currentScene > 0) currentScene--;
    drawScene(currentScene, data);
  });
});

function drawScene(scene, data) {
  d3.select("#vis").html(""); // Clear the previous scene

  if (scene === 0) {
    d3.select("#vis").append("p").text("Scene 0: Overall Price Distribution");
  }
  else if (scene === 1) {
    d3.select("#vis").append("p").text("Scene 1: Average Price by Year");
  }
  else if (scene === 2) {
    d3.select("#vis").append("p").text("Scene 2: Seasonal Price Comparison");
  }
  else if (scene === 3) {
    d3.select("#vis").append("p").text("Scene 3: Interactive Exploration");
  }
}
