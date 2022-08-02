const startAnimationButton = document.getElementById('start_animation_button');
const canvas = document.getElementById("render_target");
const ctx = canvas.getContext("2d");

const animationBuffer = 10;

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
const gridLineWidth = 1;
// fireworks
const fireworksMaxNumber = 8;
const fireworksFuseMin = 400;
const fireworksFuseWindow = 800;
const fireworksLifeTimeMin = 1000;
const fireworksLifeTimeWindow = 3000;
const fireworksRespawnTimeMin = 0;
const fireworksRespawnTimeWindow = 2500;
const fireworksExpandTimeMin = 100;
const fireworksExpandTimeWindow = 100;
const fireworksParticlesMin = 16;
const fireworksParticlesWindow = 20;
const fireworksHorizontalPadding = 0.1;
const fireworksRadiusMin = 0.07;
const fireworksRadiusWindow = 0.10;
const fireworksTargetXOffset = -0.15;
const fireworksTargetXRange = 0.3;
const fireworksGravityFactor = 0.5 * 9.81 / 1000000;
const fireworksSmokeTrailLineWidth = 3;
const fireworksSmokeTrailLineSegments = 20;
const fireworksSmokeTrailLineSegmentsSteps = 0.02;

// colors
const scoreSectionBackground = "#201c28";
const gridColorStub = "rgba(128,128,128,";
const gridColor = "rgba(128,128,128," + "1)";
const textColor = "#b35900";

let data = undefined;
let metrics = {};
let startTimestamp = undefined;
let fireworks = undefined;

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

    // map elapsed time to slow down before animation steps

    let animationWindowStart = 0, animationWindowEnd = metrics.totalDuration;
    if (metrics.animationSteps.length > 1) {
        let i = metrics.animationSteps.length - 2;
        for (; i >= 0; --i) {
            if (elapsed >= metrics.animationSteps[i]) {
                animationWindowStart = metrics.animationSteps[i];
                break;
            }
        }
        animationWindowEnd = metrics.animationSteps[i + 1];
    }

    // map d in [animationWindowStart, animationWindowEnd] -f-> [0, 100] -g-> [0, 100] -f^-1-> [animationWindowStart, animationWindowEnd]
    // f: linear transform
    // choose g s.t. g(0) = 0, g(100) = 100 and g strictly monotone
    // we chose g(d) = sqrt(d) * 10
    const modifiedElapsed = linearTransform(10 * Math.sqrt(
        linearTransform(elapsed, animationWindowStart, animationWindowEnd, 0, 100)),
        0, 100, animationWindowStart, animationWindowEnd);

    let animationStepPts = modifiedElapsed * data.maxScore / metrics.totalDuration;

    if (animationStepPts > data.maxScore + animationBuffer) {
        if (!metrics.fireworks) {
            return;
        }
        animationStepPts = data.maxScore + animationBuffer;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //  ---------------------------------------------------------------------------
    // |                               outer padding                               |
    // |    -------------------------------------------------------------------    |
    // |   |         |                                                     |   |   |
    // |   |         |                    score labels                     |   |   |
    // |   |         |                                                     |   |   |
    // |   |         |--------------------------------------------- --- ---| g |   |
    // |   |    c    |           | |           | |           | |   |   |   | r |   |
    // |   |    a    |           | |           | |           | |   | m |   | i |   |
    // |   |    t    |    ---    | |           | |           | |   | a |   | d |   |
    // |   |    e    |   |   |   | |           | |    ---    | |   | x |   |   |   |
    // |   |    g    |   |   |   | |    ---    | |   |   |   | |   |   |   | l |   |
    // |   |    o    |   |   |   | |   |   |   | |   |   |   | |   | s |   | e |   |
    // |   |    r    |   |   |   | |   |   |   | |   |   |   | |   | c |   | g |   |
    // |   |    i    |   |   |   | |   |   |   | |   |   |   | |   | o |   | e |   |
    // |   |    e    |   |   |   | |   |   |   | |   |   |   | |   | r |   | n |   |
    // |   |    s    |   |   |   | |   |   |   | |   |   |   | |   | e |   | d |   |
    // |   |         |   |   |   | |   |   |   | |   |   |   | |   |   |   |   |   |
    // |   |         |-----------| |-----------| |-----------| |-----------|   |   |
    // |   |         |   team    | |   team    | |   team    | |   team    |   |   |
    // |   |         |   name    | |   name    | |   name    | |   name    |   |   |
    // |    -------------------------------------------------------------------    |
    // |                                                                           |
    //  ---------------------------------------------------------------------------

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
    const categoriesSectionMid = drawableAreaLeft + categoriesSectionWidth / 2;

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

    metrics.categoriesFontSize = findOptimalFontSize(metrics.categoriesFontSize,
        categoriesSectionWidth,
        metrics.maxCategoryTitle);
    metrics.categoriesFont = metrics.categoriesFontSize + "px Monospace";

    ctx.fillStyle = scoreSectionBackground;
    ctx.fillRect(mainSectionLeft,
        drawableAreaTop,
        mainSectionWidth,
        scoresSectionBottom - drawableAreaTop);

    // draw grid

    ctx.lineWidth = gridLineWidth;

    ctx.strokeStyle = createGridGradient(mainSectionLeft, mainSectionRight, gridColor, data.teams.length,
        mainSectionTeamColumnAndWhitespaceWidth, teamColumnSemiWidth);
    ctx.fillStyle = gridColor;
    ctx.beginPath();
    let topGrindLineBound = Math.min(animationStepPts, data.maxScore);
    let topGridLineScore = topGrindLineBound - (topGrindLineBound % 10);

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
        ctx.strokeStyle = createGridGradient(mainSectionLeft, mainSectionRight, color, data.teams.length,
            mainSectionTeamColumnAndWhitespaceWidth, teamColumnSemiWidth);
        ctx.fillStyle = color;

        let y = scoresSectionBottom - nextGridLineScore * scoresSectionHeight / data.maxScore;

        ctx.fillText("" + nextGridLineScore, mainSectionRight + legendSectionSemiWidth, y, legendSectionWidth);

        ctx.moveTo(mainSectionLeft, y);
        ctx.lineTo(mainSectionRight, y);

        ctx.stroke();
    }

    // draw main section

    const categoriesAlpha = new Array(data.categories.length).fill(0);
    const alphaIncrement = 1 / data.teams.length;

    for (let t = 0; t < data.teams.length; ++t) {

        const left = mainSectionLeft + t * mainSectionTeamColumnAndWhitespaceWidth;

        ctx.font = metrics.teamNameFont;
        ctx.fillStyle = textColor;
        ctx.fillText(data.teams[t], left + teamColumnSemiWidth, teamNamesSectionBaseline, teamColumnWidth);

        let score = 0, nextScore;
        let cntn = true;
        let bottom = scoresSectionBottom, nextBottom;

        let scoreColumnLeft = left + scoreColumnWidth;

        for (let c = 0; cntn && c < data.categories.length; ++c) {

            ctx.fillStyle = "rgb(255," + (128 + c * 128 / data.categories.length) + ",0)";
            nextScore = score + data.scores[c][t];

            if (nextScore >= animationStepPts) {
                categoriesAlpha[c] += ((animationStepPts - score) / data.scores[c][t]) * alphaIncrement;
                nextScore = animationStepPts;
                cntn = false;
            } else {
                categoriesAlpha[c] += alphaIncrement;
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
        ctx.fillStyle = textColor;
        ctx.fillText(score.toFixed(1), left + teamColumnSemiWidth, bottom - scoreLabelSectionSemiHeight, teamColumnWidth);
    }

    // draw category names
    for (let c = 0; c < data.categories.length; ++c) {

        ctx.font = metrics.categoriesFont;
        ctx.fillStyle = "rgb(255," + (128 + c * 128 / data.categories.length) + ",0," + categoriesAlpha[c] + ")";
        ctx.fillText(data.categories[c],
            categoriesSectionMid,
            scoresSectionBottom - (c + 1) * scoresSectionHeight / (data.categories.length + 1),
            categoriesSectionWidth);
    }

    if (metrics.fireworks && animationStepPts >= data.maxScore) {

        if (fireworks === undefined) {
            fireworks = new Array(fireworksMaxNumber);
        }
        for (let i = 0; i < fireworksMaxNumber; ++i) {
            if (fireworks[i] === undefined || fireworks[i].respawnTime < elapsed) {
                createFirework(elapsed, i);
            }
        }

        ctx.lineWidth = fireworksSmokeTrailLineWidth;
        const radiusScale = Math.min(drawableAreaWidth, drawableAreaHeight);

        for (const firework of fireworks) {

            if (firework.lifeTime < elapsed) {
                continue;
            }

            let age = elapsed - firework.startTime;

            if (age < firework.fuseTime) {

                const ageFactor = age / firework.fuseTime;

                let px, py;

                for (let i = fireworksSmokeTrailLineSegments, td = ageFactor;
                    i > 0 && td >= 0;
                    --i, td -= fireworksSmokeTrailLineSegmentsSteps) {

                    const mtd = (1 - td);
                    const a = mtd * mtd * mtd;
                    const b = 3 * td * mtd * mtd;
                    const c = 3 * td * td * mtd;
                    const d = td * td * td;

                    const x = drawableAreaLeft + drawableAreaWidth * (
                        a * firework.startX +
                        b * firework.bezierAX +
                        c * firework.bezierBX +
                        d * firework.targetX);
                    const y = drawableAreaBottom - drawableAreaHeight * (
                        a * firework.startY +
                        b * firework.bezierAY +
                        c * firework.bezierBY +
                        d * firework.targetY);

                    if (i < 20) {
                        ctx.beginPath();
                        ctx.strokeStyle = "rgba(255, 255, 255, " + (i / fireworksSmokeTrailLineSegments) + ")";
                        ctx.moveTo(px, py);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }

                    px = x;
                    py = y;
                }

                continue;
            }

            age -= firework.fuseTime;

            let radius = firework.radius;

            if (age < firework.expandTime) {
                radius *= age / firework.expandTime;
            }

            const gravityOffY = fireworksGravityFactor * age * age;

            const alpha = Math.sin(linearTransform(age, 0, firework.lifeTime - firework.startTime - firework.fuseTime, Math.PI / 2, Math.PI));
            let colorInner = "hsla(" + firework.color + ", 100%, 70%, " + alpha + ")";
            let colorMid = "hsla(" + firework.color + ", 100%, 60%, " + 0.7 * alpha + ")";
            let colorOuter = "hsla(" + firework.color + ", 100%, 50%, " + 0.3 * alpha + ")";

            for (let p = 0; p < firework.particles; ++p) {

                let x = drawableAreaLeft + firework.targetX * drawableAreaWidth
                    + Math.cos(Math.PI * 2 * p / firework.particles) * radius * radiusScale;
                let y = drawableAreaBottom + gravityOffY - firework.targetY * drawableAreaHeight
                    + Math.sin(Math.PI * 2 * p / firework.particles) * radius * radiusScale;

                ctx.beginPath();
                ctx.fillStyle = colorOuter;
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = colorMid;
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = colorInner;
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    window.requestAnimationFrame(renderLoop);
}

const loadData = function() {

    const params = new URLSearchParams(window.location.search);
    let encodedData = params.get("data");
    data = decodeData(encodedData);
    metrics.totalDuration = +params.get("duration");
    metrics.fireworks = params.get("fireworks") === "true";

    data.totalScores = new Array(data.teams.length).fill(0);
    for (let r = 0; r < data.scores.length; ++r) {
        for (let c = 0; c < data.scores[r].length; ++c) {
            data.totalScores[c] += data.scores[r][c];
        }
    }
    data.maxScore = data.totalScores.reduce((m, s) => Math.max(m, s), 0);
    metrics.maxTeamName = data.teams.reduce((m, t) => m.length > t.length ? m : t, "");
    metrics.maxCategoryTitle = data.categories.reduce((m, c) => m.length > c.length ? m : c, "");
    metrics.animationSteps = data.totalScores.sort((a,b) => a - b).map(p => p * metrics.totalDuration / data.maxScore);
}

const decodeData = function(/** @type{String} */ data) {

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

const linearTransform = function(x, dlb, dub, ilb, iub) {
    return ilb + (x - dlb) * (iub - ilb) / (dub - dlb);
}

const createGridGradient = function(left, right, col, teams,
    mainSectionTeamColumnAndWhitespaceWidth, teamColumnSemiWidth) {

    const width = right - left;
    let gridGradient = ctx.createLinearGradient(left, 0, right, 0);

    for (let t = 0; t < teams; ++t) {

        let x = t * mainSectionTeamColumnAndWhitespaceWidth;

        gridGradient.addColorStop(x / width, col);
        x += teamColumnSemiWidth;
        gridGradient.addColorStop(x / width, scoreSectionBackground);
        gridGradient.addColorStop((x + teamColumnSemiWidth) / width, col);
    }

    return gridGradient;
}

const createFirework = function(elapsed, i) {

    const fuseTime = fireworksFuseMin + Math.random() * fireworksFuseWindow;
    const lifeTime = elapsed + fuseTime + fireworksLifeTimeMin + Math.random() * fireworksLifeTimeWindow;

    const startX = fireworksHorizontalPadding + Math.random() * (1 - 2 * fireworksHorizontalPadding);

    const targetX = startX + fireworksTargetXOffset + Math.random() * fireworksTargetXRange;
    const targetY = 0.5 + Math.random() / 2;

    const ax = Math.random();
    const bx = Math.random();

    fireworks[i] = {
        startTime: elapsed,
        fuseTime: fuseTime,
        lifeTime: lifeTime,
        respawnTime: lifeTime + fireworksRespawnTimeMin + Math.random() * fireworksRespawnTimeWindow,
        expandTime: fireworksExpandTimeMin + Math.random() + fireworksExpandTimeWindow,
        startX: startX,
        startY: 0,
        bezierAX: startX * ax + targetX * (1 - ax),
        bezierAY: Math.random() * targetY,
        bezierBX: startX * bx + targetX * (1 - bx),
        bezierBY: Math.random() * targetY,
        targetX: targetX,
        targetY: targetY,
        radius: fireworksRadiusMin + Math.random() * fireworksRadiusWindow,
        particles: Math.round(fireworksParticlesMin + Math.random() * fireworksParticlesWindow),
        color: Math.random() * 360
    };
}

loadData();