const CONTAINER_ID = "js-charts-container";
const CHART_COLOR = "#1b2c3d";

const DR = "stats12";
const SR = "stats13";

const CHART_TYPE_TIME = "CHART_TYPE_TIME";
const CHART_TYPE_LINEAR = "CHART_TYPE_LINEAR";

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

const Container = {
    view: (vnode) => {
        const { history } = vnode.attrs;

        return m("div", { style: { textAlign: "center", fontFamily: "sans-serif" } }, [
            m(Section, { title: "Driver Rating", series: collectStats(history, DR) }),
            m(Section, { title: "Sportsmanship Rating", series: collectStats(history, SR) }),
        ])
    },
};

function Section() {
    let chartType = CHART_TYPE_TIME;
    const setChartType = (type) => () => { chartType = type };

    return {
        view: (vnode) => {
            const { title, series } = vnode.attrs;
            if (series.length <= 1) return;

            const pillStyle = {
                display: "inline-block",
                width: "140px",
                height: "32px",
                lineHeight: "32px",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
            };
            const leftPillStyle = {
                ...pillStyle,
                borderRight: 0,
                borderRadius: "16px 0 0 16px",
            };
            const rightPillStyle = {
                ...pillStyle,
                borderRadius: "0 16px 16px 0",
            };

            return m("div", { style: { marginBottom: "20px" } }, [
                m(Title(title)),
                m("div", [
                    m(Stat("CURRENT", currentValue(series))),
                    m(Stat("MAX", maxValue(series))),
                    m("div", [
                        m("div", { style: leftPillStyle, onclick: setChartType(CHART_TYPE_TIME) }, "Time"),
                        m("div", { style: rightPillStyle, onclick: setChartType(CHART_TYPE_LINEAR) }, "Linear"),
                    ]),
                ]),
                chartType === CHART_TYPE_TIME ? m(TimeChart(series)) : m(LinearChart(series))
            ]);
        }
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
