const resultsWindowName = "pq_scoreboard_results_window";

const windowBackgroundOverlay = document.getElementById('window_background_overlay');
const addTeamWindow = document.getElementById('add_team_window');
const addTeamEditText = document.getElementById('add_team_edit_text');
const removeTeamWindow = document.getElementById('remove_team_window');
const removeTeamText = document.getElementById('remove_team_text');
const addCategoryWindow = document.getElementById('add_category_window');
const addCategoryEditText = document.getElementById('add_category_edit_text');
const removeCategoryWindow = document.getElementById('remove_category_window');
const removeCategoryText = document.getElementById('remove_category_text');
const showResultsWindow = document.getElementById('show_results_window');
const durationEditText = document.getElementById('duration_edit_text');
const fireworksCheckBox = document.getElementById('fireworks_check_box');
const editorTable = document.getElementById('editor_table');

const defaultTotalNumberOfCategories = 10;
const defaultTotalDuration = 30000;

let totalDuration = defaultTotalDuration;
let resultsWindowHandle = null;
let totalScoresRow = null;

let showResultsWindowData = {};

const toggleOverlay = function(/** @type{Boolean} */ show,
                               /** @type{HTMLElement} */ window) {

    let display = show ? "block" :  "none";

    windowBackgroundOverlay.style.display = display;
    window.style.display = display;
};

const showAddTeamWindow = function() {

    addTeamEditText.value = null;
    toggleOverlay(true, addTeamWindow);
    addTeamEditText.focus();
};

const closeAddTeamWindow = function(/** @type{Boolean} */ add) {

    toggleOverlay(false, addTeamWindow);

    if (add) {

        const team = addTeamEditText.value;

        const index = editorTable.rows[0].cells.length;
        insertHeaderCell(editorTable.rows[0], team, true, () => showRemoveTeamWindow(index));

        insertConstDataCell(totalScoresRow, "0");

        for (let i = editorTable.rows.length - 2; i > 0; --i) {
            insertDataCell(editorTable.rows[i]);
        }
    }
};

const showRemoveTeamWindow = function(/** @type{Number} */ index) {

    removeTeamWindow.data = index;
    const teamName = editorTable.rows[0].cells[index].children[1].textContent;
    removeTeamText.textContent = "remove team \"" + teamName + "\"?";
    toggleOverlay(true, removeTeamWindow);
    removeTeamWindow.focus();
};

const closeRemoveTeamWindow = function(/** @type{Boolean} */ remove) {

    toggleOverlay(false, removeTeamWindow);

    if (remove) {

        const index = removeTeamWindow.data;

        for (let i = editorTable.rows.length - 1; i >= 0; --i) {
            editorTable.rows[i].deleteCell(index);
        }
    }
};

const showAddCategoryWindow = function() {

    addCategoryEditText.value = null;
    toggleOverlay(true, addCategoryWindow);
    addCategoryEditText.focus();
};

const closeAddCategoryWindow = function(/** @type{Boolean} */ add) {

    toggleOverlay(false, addCategoryWindow);

    if (add) {

        let category = addCategoryEditText.value;

        const index = editorTable.rows.length - 1;
        let row = editorTable.insertRow(index);

        insertHeaderCell(row, category, true, () => showRemoveCategoryWindow(index));

        for (let i = editorTable.rows[0].cells.length - 2; i >= 0; --i) {
            insertDataCell(row);
        }
    }
};

const showRemoveCategoryWindow = function(/** @type{Number} */ index) {

    removeCategoryWindow.data = index;
    const category = editorTable.rows[index].cells[0].children[1].textContent;
    removeCategoryText.textContent = "remove category \"" + category + "\"?";
    toggleOverlay(true, removeCategoryWindow);
    removeCategoryWindow.focus();
};

const closeRemoveCategoryWindow = function(/** @type{Boolean} */ remove) {

    toggleOverlay(false, removeCategoryWindow);

    if (remove) {

        const index = removeCategoryWindow.data;
        editorTable.deleteRow(index);
    }
};

const showShowResultsWindow = function() {

    let data = createDataObject();
    let encodedData = encodeData(data);
    let totalDuration = getTotalDuration(data);
    let fireworks = data.categories.length >= defaultTotalNumberOfCategories;

    saveData(encodedData, totalDuration, fireworks);

    showResultsWindowData.encodedData = encodedData;

    durationEditText.value = "" + totalDuration;
    fireworksCheckBox.checked = fireworks;

    toggleOverlay(true, showResultsWindow);
};

const closeShowResultsWindow = function(/** @type{Boolean} */ show) {

    toggleOverlay(false, showResultsWindow);

    if (show) {
        showResults(showResultsWindowData.encodedData,
            +durationEditText.value,
            fireworksCheckBox.checked);
    }
}

const closeResultsWindow = function() {

    if (resultsWindowHandle !== null && !resultsWindowHandle.closed) {
        resultsWindowHandle.close();
    }
}

const insertCell = function(/** @type{HTMLTableRowElement} */ row,
                            /** @type{String} */ data,
                            /** @type{Boolean} */ editable,
                            /** @type{String} */ cls,
                            /** @type{function} */ removeButtonAction) {

    const cell = row.insertCell();

    cell.setAttribute("class", cls);

    const contentElement = document.createElement("div");
    contentElement.textContent = data;
    if (editable) {
        contentElement.setAttribute("contenteditable", true);
    }

    if (removeButtonAction !== undefined) {
        const removeButtom = document.createElement("input");
        removeButtom.setAttribute("type", "image");
        removeButtom.setAttribute("src", "delete.svg");
        removeButtom.onclick = removeButtonAction;
        cell.appendChild(removeButtom);
    }

    cell.appendChild(contentElement);

    return contentElement;
}

const insertHeaderCell = function(/** @type{HTMLTableRowElement} */ row,
                                  /** @type{String} */ data,
                                  /** @type{Boolean} */ editable,
                                  /** @type{function} */ removeButtonAction) {

    return insertCell(row, data, editable, "tableHeader", removeButtonAction);
}

const insertDataCell = function(/** @type{HTMLTableRowElement} */ row,
                                /** @type{String} */ data = "") {

    let columnId = row.cells.length;
    let contentElement = insertCell(row, data, true, "tableData");

    contentElement.addEventListener("input", function() {
            let score = 0;
            for (let r = editorTable.rows.length - 2; r > 0; --r) {
                let elem = editorTable.rows[r].cells[columnId].children[0];
                let content = elem.textContent;
                if (isNaN(content)) {
                    elem.setAttribute("valid", "false");
                } else {
                    elem.setAttribute("valid", "true");
                    score += +content;
                }
            }
            totalScoresRow.cells[columnId].children[0].textContent = score;
        }, false);
    return contentElement;
}

const insertConstDataCell = function(/** @type{HTMLTableRowElement} */ row,
                                     /** @type{String} */ data) {

    return insertCell(row, data, false, "tableConstData");
}

const createDataObject = function() {

    let rows = editorTable.rows.length;
    let cols = editorTable.rows[0].cells.length;

    let teams = [];
    let categories = [];
    let scores = [];

    for (let c = 1; c < cols; ++c) {
        teams.push(editorTable.rows[0].cells[c].children[1].textContent);
    }

    for (let r = 1; r < rows - 1; ++r) {
        categories.push(editorTable.rows[r].cells[0].children[1].textContent);

        let scoresRow = [];

        for (let c = 1; c < cols; ++c) {
            scoresRow.push(editorTable.rows[r].cells[c].children[0].textContent | 0);
        }

        scores.push(scoresRow);
    }

    return {
        "teams": teams,
        "categories": categories,
        "scores": scores
    };
}

const loadDataObject = function(data) {

    clearData();

    if (data.teams == null ||
        data.categories == null ||
        data.scores == null ||
        data.categories.length !== data.scores.length) {

        return;
    }
    // todo: check all rows

    for (const team of data.teams) {
        const index = editorTable.rows[0].cells.length;
        insertHeaderCell(editorTable.rows[0], team, true,
            () => showRemoveTeamWindow(index));
    }

    let totalScores = new Array(data.teams.length).fill(0);

    for (let i = 0; i < data.categories.length; ++i) {

        const index = editorTable.rows.length - 1;
        let row = editorTable.insertRow(index);

        insertHeaderCell(row, data.categories[i], true,
            () => showRemoveCategoryWindow(index));

        for (let j = 0; j < data.teams.length; ++j) {
            insertDataCell(row, "" + data.scores[i][j]);
            totalScores[j] += data.scores[i][j];
        }
    }

    for (let i = 0; i < data.teams.length; ++i) {
        insertConstDataCell(totalScoresRow, totalScores[i]);
    }
}

const encodeData = function(data) {

    return btoa(JSON.stringify(data))
        .replace("==", "")
        .replace("+", "-")
        .replace("/", "_");
}

const decodeData = function(/** @type{String} */ data) {

    return JSON.parse(atob(data
        .replace("-", "+")
        .replace("_", "/")));
}

const showResults = function(/** @type{String} */ encodedData,
                             /** @type{Number} */ totalDuration,
                             /** @type{Boolean} */ fireworks) {

    resultsWindowHandle = window.open(
        "results.html?data=" + encodedData + "&duration=" + totalDuration + "&fireworks=" + fireworks,
        resultsWindowName,
        "height=300," +
        "width=600," +
        "top=0," +
        "left=0" +
        "status=no," +
        "toolbar=no," +
        "menubar=no," +
        "location=no");
    resultsWindowHandle.focus();
}

const clearData = function() {

    for (let i = editorTable.rows.length - 1; i >= 0; --i) {
        editorTable.deleteRow(-1);
    }
    let headerRow = editorTable.insertRow();
    let tlCell = headerRow.insertCell();
    tlCell.style = "width: 15%;";
    totalScoresRow = editorTable.insertRow();
    insertHeaderCell(totalScoresRow, "Total:", false);
}

const encodeAndSaveData = function() {

    let data = createDataObject();
    let encodedData = encodeData(data);
    let totalDuration = getTotalDuration(data);

    saveData(encodedData, totalDuration);
}

const getTotalDuration = function(data) {

    if (data.categories.length < defaultTotalNumberOfCategories) {
        return defaultTotalDuration * data.categories.length / defaultTotalNumberOfCategories;
    }
    return defaultTotalDuration;
}

const saveData = function(/** @type{String} */ data,
                          /** @type{Number} */ totalDuration,
                          /** @type{Boolean} */ fireworks) {

    window.history.pushState(null, null, "?data=" + data + "&duration=" + totalDuration + "&fireworks=" + fireworks);
}

const loadAndDecodeData = function() {

    const params = new URLSearchParams(window.location.search);
    let encodedData = params.get("data");
    if (encodedData !== null) {
        let data = decodeData(encodedData);
        loadDataObject(data);
    } else {
        clearData();
    }
    totalDuration = +params.get("duration");
}

loadAndDecodeData();