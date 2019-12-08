const CONTAINER_ID = "js-charts-container";
const CHART_COLOR = "#1b2c3d";

const DR = "stats12";
const SR = "stats13";

function inject() {
    const container = getContainer();
    const userId = getUserId();

    if (!userId) return;

    Promise.all([
        fetchStats(userId),
        fetchStatsHistory(userId)
    ]).then(
        ([stats, history]) => m.mount(container, { view: () => m(Container, { stats, history }) })
    );
}

function getContainer() {
    const element = document.getElementById(CONTAINER_ID);
    if (element) return element

    const appMountRoot = document.getElementById("app_mount_root");
    appMountRoot.insertAdjacentHTML("afterend", `<div id="${CONTAINER_ID}" />`);
    return document.getElementById(CONTAINER_ID);
}

function getUserId(pattern = /gtsport\/user\/profile\/(\d+)\/overview/) {
    const match = pattern.exec(location.href);
    return match && match[1];
}

function fetchStats(userId) {
    const body = new FormData;
    body.append("job", 3);
    body.append("user_no", userId);
    return fetch("https://www.gran-turismo.com/us/api/gt7sp/profile/", { method: "POST", body })
        .then(response => response.json())
        .then(({ stats }) => stats);
}

function fetchStatsHistory(userId) {
    const body = new FormData();
    body.append("job", 12);
    body.append("user_no", userId);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    body.append("year_begin", year - 2);  // GTS API returns up to two years of data
    body.append("month_begin", month);
    body.append("year_end", year);
    body.append("month_end", month);

    return fetch("https://www.gran-turismo.com/us/api/gt7sp/profile/", { method: "POST", body })
        .then(response => response.json())
        .then(({ stats_history }) => stats_history);
}

function Container() {
    let showDriverRatingOverTime = true;
    let showSportsmanshipRatingOverTime = true;

    const toggleDR = () => { showDriverRatingOverTime = !showDriverRatingOverTime };
    const toggleSR = () => { showSportsmanshipRatingOverTime = !showSportsmanshipRatingOverTime };

    return {
        view: (vnode) => {
            const { stats, history } = vnode.attrs;

            const driverRatingHistory = collectStats(history, DR);
            const sportsmanshipRatingHistory = collectStats(history, SR);

            return m("div", { style: { textAlign: "center", fontFamily: "sans-serif" } }, [
                (driverRatingHistory.length > 1) && m(Section([
                    m(Title("Driver Rating")),
                    m("div", [
                        m(Stat("CURRENT", currentValue(driverRatingHistory))),
                        m(Stat("MAX", maxValue(driverRatingHistory))),
                        m(Stat("UPRATE", stats.driver_point_up_rate)),
                        m("button", { onclick: toggleDR }, "Toggle"),
                    ]),
                    showDriverRatingOverTime
                        ? m(TimeChart(driverRatingHistory))
                        : m(LinearChart(driverRatingHistory))
                ])),
                (sportsmanshipRatingHistory.length > 1) && m(Section([
                    m(Title("Sportsmanship Rating")),
                    m("div", [
                        m(Stat("CURRENT", currentValue(sportsmanshipRatingHistory))),
                        m(Stat("MAX", maxValue(sportsmanshipRatingHistory))),
                        m("button", { onclick: toggleSR }, "Toggle"),
                    ]),
                    showSportsmanshipRatingOverTime
                        ? m(TimeChart(sportsmanshipRatingHistory, SR))
                        : m(LinearChart(sportsmanshipRatingHistory, SR))
                ]))
            ])
        }
    }
}


function Section(children) {
    return {
        view: () => m("div", { style: { marginBottom: "20px" } }, children)
    }
}

function Title(text) {
    return {
        view: () => m("h1", { style: { margin: 0 } }, text)
    }
}

function collectStats(stats, key) {
    return stats.flatMap(monthlyStats =>
        monthlyStats[key].map((value, day) =>
            ({
                x: new Date(parseInt(monthlyStats.year), parseInt(monthlyStats.month) - 1, day),
                y: parseInt(value)
            })
        ).filter(({ y }) => y !== 0));
}

function maxValue(series) {
    return Math.max(...series.map(({ y }) => y));
}

function currentValue(series) {
    return series[series.length - 1].y;
}

function Stat(label, value) {
    return {
        view: () => m(
            "div",
            { style: { display: "inline", padding: "0 10px", fontSize: "1.2rem" } },
            [`${label}: `, m("strong", value)]
        )
    }
}

function LinearChart(timeSeries) {
    const series = timeSeries.map(({ y }, x) => ({ x, y }));

    return RatingChart(element =>
        new Chart(element, {
            type: "line",
            data: {
                datasets: [
                    {
                        data: series,
                        steppedLine: "before",
                        fill: false,
                        pointRadius: 0,
                        borderColor: CHART_COLOR,
                        backgroundColor: CHART_COLOR
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [{ type: "linear" }],
                    yAxes: [{ ticks: { beginAtZero: true } }]
                },
                legend: { display: false },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    displayColors: false,
                    callbacks: {
                        title: () => ""
                    }
                },
                animation: { duration: 0 },
            }
        })
    );
}

function TimeChart(series) {
    return RatingChart(element =>
        new Chart(element, {
            type: "line",
            data: {
                datasets: [
                    {
                        data: series,
                        steppedLine: "before",
                        fill: false,
                        pointRadius: 0,
                        borderColor: CHART_COLOR,
                        backgroundColor: CHART_COLOR
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [{ type: "time", time: { unit: "month" } }],
                    yAxes: [{ ticks: { beginAtZero: true } }]
                },
                legend: { display: false },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    displayColors: false,
                    callbacks: {
                        title: ([item, ...rest], data) => {
                            const dataPoint = data.datasets[item.datasetIndex].data[item.index];
                            return dataPoint.x.toLocaleDateString(undefined, { dateStyle: "medium" })
                        }
                    }
                },
                animation: { duration: 0 },
            }
        })
    );
}

function RatingChart(chartFactory) {
    return {
        view: () => m(
            "div",
            { style: { width: "1000px", height: "400px", margin: "auto" } },
            m("canvas", { width: 1000, height: 400, oncreate: (vnode) => chartFactory(vnode.dom) })
        )
    }
}

window.onload = inject;

chrome.runtime.onMessage.addListener(
    (request) => (request === "onHistoryStateUpdated") && inject()
);
