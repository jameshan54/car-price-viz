let currentScene = 0;
let data = [];

d3.csv("data/depreciation_summary.csv").then(dataset => {
  data = preprocess(dataset);
  drawScene(currentScene);

  d3.select("#next").on("click", () => {
    if (currentScene < 3) currentScene++;
    drawScene(currentScene);
  });

  d3.select("#prev").on("click", () => {
    if (currentScene > 0) currentScene--;
    drawScene(currentScene);
  });
});

function preprocess(dataset) {
  return dataset.map(d => ({
    Brand: d.Brand,
    Model: d.Model,
    CarID: d.CarID,
    Year: +d.Year,
    Age: +d["Car Age"],
    Season: d.Season,
    Depreciation: +d.Depreciation,
    Date: d.Date
  }));
}

function drawScene(scene) {
  d3.select("#vis").html("");
  d3.select("#description").text("");

  if (scene === 0) {
    d3.select("#description").text("Scene 0: 브랜드별 평균 감가 추이");
    drawScene0();
  } else if (scene === 1) {
    d3.select("#description").text("Scene 1: 개별 모델의 감가 추이");
    drawScene1();
  } else if (scene === 2) {
    d3.select("#description").text("Scene 2: 계절별 감가 비교");
    drawScene2();
  } else if (scene === 3) {
    d3.select("#description").text("Scene 3: 직접 탐색 - 브랜드/모델 선택");
    drawScene3();
  }
}

function drawScene0() {
  // 예시 placeholder
  d3.select("#vis").append("p").text("브랜드별 감가 시각화 자리");
}

function drawScene1() {
  d3.select("#vis").append("p").text("모델별 감가 시각화 자리");
}

function drawScene2() {
  d3.select("#vis").append("p").text("계절별 감가 비교 자리");
}

function drawScene3() {
  d3.select("#vis").append("p").text("유저 선택 기반 감가 확인 자리");
}
