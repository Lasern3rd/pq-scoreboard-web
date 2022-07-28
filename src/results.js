const startAnimationWindow = document.getElementById('start_animation_window');
const canvas = document.getElementById("render_target");
const ctx = canvas.getContext("2d");

// render metrics
const defaultTotalDuration = 30000;
const numberOfGridLines = 10;
const outerPadding = 0.05;
const totalHorizontalWhiteSpace = 0.1;
const teamNamesSectionHeight = 0.1;
const scoreLabelHeight = 0.1;
const scoresWidth = 0.1;

let data = undefined;
let metrics = {};
let startTimestamp = undefined;

const startAnimation = function() {

    startAnimationWindow.style.display = "none";

    document.documentElement
        .requestFullscreen()
        .then(v => {
            window.requestAnimationFrame(renderLoop);
        });
}

const renderLoop = function(timestamp) {

    window.requestAnimationFrame(renderLoop);

    if (startTimestamp === undefined) {
        startTimestamp = timestamp;
        return;
    }

    let elapsed = (timestamp - startTimestamp) / 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw grid
    /*
    for (let i = numberOfGridLines; i >= 0; --i)
    {
        let y = tableTop + (i * tableHeight / gridLines);
        renderTargetGraphics.DrawLine(penGridLines, tableLeft, y, tableRight, y);
    }
    */

    // draw teams
    // draw scores

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + Math.cos(elapsed) * 10,
        canvas.height / 2  + Math.sin(elapsed) * 10);
    ctx.stroke();

    console.log(elapsed)
}

let loadData = function() {

    let encodedData = new URLSearchParams(window.location.search).get("data");
    data = decodeData(encodedData);
    metrics.totalDuration = new URLSearchParams(window.location.search).get("duration") | defaultTotalDuration;

    data.totalScores = new Array(data.teams.length).fill(0);
    for (let r = 0; r < data.scores.length; ++r) {
        for (let c = 0; c < data.scores[r].length; ++c) {
            data.totalScores[c] += data.scores[r][c];
        }
    }

    metrics.horizontalPadding = totalHorizontalWhiteSpace / (data.teams.length - 1);



    durationEditText.value = "" + metrics.totalDuration;
    startAnimationWindow.style.display = "block";
}

let decodeData = function(/** @type{String} */ data) {

    return JSON.parse(atob(data
        .replace("-", "+")
        .replace("_", "/")));
}

loadData();