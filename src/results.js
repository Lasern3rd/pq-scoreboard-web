const startAnimationButton = document.getElementById('start_animation_button');
const canvas = document.getElementById("render_target");
const ctx = canvas.getContext("2d");

// render metrics
const defaultTotalDuration = 30000;
const gridLinesSpacingPts = 10;
const outerPaddingPct = 0.01;
const mainSectionWhitespaceWidthPct = 0.1;
const teamNamesSectionHeightPct = 0.1;
const categoriesSectionWidthPct = 0.15;
const scoreLabelHeightPct = 0.1;
const legendSectionWidthPct = 0.05;
const defaultFontSize = 40;
const minFontSize = 20;

// colors
const scoreSectionBackground = "#201c28";
const gridColorStub = "rgba(128,128,128,";
const gridColor = "rgba(128,128,128," + "255)";

let data = undefined;
let metrics = {};
let startTimestamp = undefined;

const startAnimation = function() {

    startAnimationButton.style.display = "none";

    document.documentElement
        .requestFullscreen()
        .then(v => {
            window.requestAnimationFrame(renderLoop);
        });
}

const renderLoop = function(timestamp) {

    if (startTimestamp === undefined) {
        startTimestamp = timestamp;
        window.requestAnimationFrame(renderLoop);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        return;
    }

    const elapsed = timestamp - startTimestamp;
    const animationStepPts = elapsed * data.maxScore / metrics.totalDuration;

    if (animationStepPts > data.maxScore) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //  ---------------------------------------------------------------------
    // |                            outer padding                            |
    // |    -------------------------------------------------------------    |
    // |   |         |                                               |   |   |
    // |   |         |                 score labels                  |   |   |
    // |   |         |                                               |   |   |
    // |   |         |--------------------------------------- --- ---| g |   |
    // |   |    c    |           |           |           |   |   |   | r |   |
    // |   |    a    |           |           |           |   | m |   | i |   |
    // |   |    t    |    ---    |           |           |   | a |   | d |   |
    // |   |    e    |   |   |   |           |    ---    |   | x |   |   |   |
    // |   |    g    |   |   |   |    ---    |   |   |   |   |   |   | l |   |
    // |   |    o    |   |   |   |   |   |   |   |   |   |   | s |   | e |   |
    // |   |    r    |   |   |   |   |   |   |   |   |   |   | c |   | g |   |
    // |   |    i    |   |   |   |   |   |   |   |   |   |   | o |   | e |   |
    // |   |    e    |   |   |   |   |   |   |   |   |   |   | r |   | n |   |
    // |   |    s    |   |   |   |   |   |   |   |   |   |   | e |   | d |   |
    // |   |         |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
    // |   |         |-----------|-----------------------------------|   |   |
    // |   |         |   team    |   team    |   team    |   team    |   |   |
    // |   |         |   name    |   name    |   name    |   name    |   |   |
    // |    -------------------------------------------------------------    |
    // |                                                                     |
    //  ---------------------------------------------------------------------

    const drawableAreaLeft = outerPaddingPct * canvas.width;
    const drawableAreaRight = (1 - outerPaddingPct) * canvas.width;
    const drawableAreaWidth = drawableAreaRight - drawableAreaLeft;
    const legendSectionWidth = legendSectionWidthPct * drawableAreaWidth;
    const categoriesSectionWidth = categoriesSectionWidthPct * drawableAreaWidth;
    const mainSectionLeft = drawableAreaLeft + categoriesSectionWidth;
    const mainSectionRight = drawableAreaRight - legendSectionWidth;
    const mainSectionWidth = mainSectionRight - mainSectionLeft;
    const teamColumnWidth = mainSectionWidth * (1 - mainSectionWhitespaceWidthPct) / data.teams.length;
    const scoreColumnWidth = teamColumnWidth / 3;
    const mainSectionWhitespaceWidth = mainSectionWidth * mainSectionWhitespaceWidthPct / (data.teams.length - 1);
    const mainSectionTeamColumnAndWhitespaceWidth = teamColumnWidth + mainSectionWhitespaceWidth;
    const teamColumnSemiWidth = teamColumnWidth / 2;
    const legendSectionSemiWidth = legendSectionWidth / 2;

    const drawableAreaTop =  outerPaddingPct * canvas.height;
    const drawableAreaBottom =  (1 - outerPaddingPct) * canvas.height;
    const drawableAreaHeight = drawableAreaBottom - drawableAreaTop;
    const scoresSectionTop = drawableAreaTop + scoreLabelHeightPct * drawableAreaHeight;
    const scoresSectionBottom = drawableAreaBottom - teamNamesSectionHeightPct * drawableAreaHeight;
    const scoresSectionHeight = scoresSectionBottom - scoresSectionTop;
    const scoreLabelSectionHeight = scoresSectionTop - drawableAreaTop;
    const teamNamesSectionBaseline = (drawableAreaBottom + scoresSectionBottom) / 2;
    const scoreLabelSectionSemiHeight = scoreLabelSectionHeight / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // derive font size
    metrics.scoresFontSize = findOptimalFontSize(metrics.scoresFontSize,
        teamColumnWidth,
        "000.0");
    metrics.scoresFont = metrics.scoresFontSize + "px Monospace";

    metrics.teamNameFontSize = findOptimalFontSize(metrics.teamNameFontSize,
        teamColumnWidth,
        metrics.maxTeamName);
    metrics.teamNameFont = metrics.teamNameFontSize + "px Monospace";

    ctx.fillStyle = scoreSectionBackground;
    ctx.fillRect(mainSectionLeft,
        drawableAreaTop,
        mainSectionWidth,
        scoresSectionBottom - drawableAreaTop);

    // draw grid
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = gridColor;
    ctx.beginPath();
    let topGridLineScore = animationStepPts - (animationStepPts % 10);

    for (let i = 0; i <= topGridLineScore; i += gridLinesSpacingPts) {

        let y = scoresSectionBottom - i * scoresSectionHeight / data.maxScore;

        ctx.fillText("" + i, mainSectionRight + legendSectionSemiWidth, y, legendSectionWidth);

        ctx.moveTo(mainSectionLeft, y);
        ctx.lineTo(mainSectionRight, y);
    }

    ctx.stroke();

    // fade in next grind line
    let nextGridLineScore = topGridLineScore + gridLinesSpacingPts;

    if (nextGridLineScore <= data.maxScore) {

        ctx.beginPath();

        let color = gridColorStub + (1 - (nextGridLineScore - animationStepPts) / gridLinesSpacingPts) + ")";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        let y = scoresSectionBottom - nextGridLineScore * scoresSectionHeight / data.maxScore;

        ctx.fillText("" + nextGridLineScore, mainSectionRight + legendSectionSemiWidth, y, legendSectionWidth);

        ctx.moveTo(mainSectionLeft, y);
        ctx.lineTo(mainSectionRight, y);

        ctx.stroke();
    }

    // draw main section

    for (let t = 0; t < data.teams.length; ++t) {

        let left = mainSectionLeft + t * mainSectionTeamColumnAndWhitespaceWidth;

        ctx.font = metrics.teamNameFont;
        ctx.fillStyle = '#FF0000'
        ctx.fillText(data.teams[t], left + teamColumnSemiWidth, teamNamesSectionBaseline, teamColumnWidth);

        let score = 0, nextScore;
        let cntn = true;
        let bottom = scoresSectionBottom, nextBottom;

        let scoreColumnLeft = left + scoreColumnWidth;

        for (let c = 0; cntn && c < data.categories.length; ++c) {

            ctx.fillStyle = 'rgb(255,' + (128 + c * 128 / data.categories.length) + ',0)';
            nextScore = score + data.scores[c][t];

            if (nextScore >= animationStepPts) {
                nextScore = animationStepPts;
                cntn = false;
            }

            nextBottom = scoresSectionBottom - nextScore * scoresSectionHeight / data.maxScore;

            ctx.fillRect(scoreColumnLeft,
                nextBottom,
                scoreColumnWidth,
                bottom - nextBottom);

            score = nextScore;
            bottom = nextBottom;
        }

        ctx.font = metrics.scoresFont;
        ctx.fillStyle = '#FF0000'
        ctx.fillText(score.toFixed(1), left + teamColumnSemiWidth, bottom - scoreLabelSectionSemiHeight, teamColumnWidth);
    }

    /*
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + Math.cos(elapsed) * 10,
        canvas.height / 2  + Math.sin(elapsed) * 10);
    ctx.stroke();
    */

    window.requestAnimationFrame(renderLoop);
}

let loadData = function() {

    const params = new URLSearchParams(window.location.search);
    let encodedData = params.get("data");
    data = decodeData(encodedData);
    metrics.totalDuration = +params.get("duration");

    data.totalScores = new Array(data.teams.length).fill(0);
    for (let r = 0; r < data.scores.length; ++r) {
        for (let c = 0; c < data.scores[r].length; ++c) {
            data.totalScores[c] += data.scores[r][c];
        }
    }
    data.maxScore = data.totalScores.reduce((m, s) => Math.max(m, s), 0);
    metrics.maxTeamName = data.teams.reduce((m, t) => m.length > t.length ? m : t, "");
}

let decodeData = function(/** @type{String} */ data) {

    return JSON.parse(atob(data
        .replace("-", "+")
        .replace("_", "/")));
}

const findOptimalFontSize = function(/** @type(Number) */ fontSize,
                                     /** @type(Number) */ maxWidth,
                                     /** @type(String) */ sampleText) {

    if (fontSize === undefined) {
        fontSize = defaultFontSize;
    }

    ctx.font = fontSize + "px Monospace";
    let textMeasurements = ctx.measureText(sampleText);

    if (textMeasurements.width < maxWidth) {
        return fontSize;
    }

    let min = minFontSize, max = fontSize;

    while (max - min > 3) {

        fontSize = Math.round((max + min) / 2);

        ctx.font = fontSize + "px Monospace";
        textMeasurements = ctx.measureText(sampleText);

        if (textMeasurements.width > maxWidth) {
            max = fontSize;
        } else {
            min = fontSize;
        }
    }

    return fontSize;
}

loadData();