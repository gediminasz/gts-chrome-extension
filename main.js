const CONTAINER_ID = "js-charts-container";
const CHART_COLOR = "#1b2c3d";

function inject() {
    const container = getContainer();
    const userId = getUserId();

    if (!userId) {
        m.render(container, "");
    } else {
        Promise.all([
            fetchStats(userId),
            fetchStatsHistory(userId)
        ]).then(
            ([stats, history]) => m.render(container, m(Container(stats, history)))
        );
    }
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
    const body = new FormData;
    body.append("job", 12);
    body.append("user_no", userId);
    body.append("month_begin", 10);
    body.append("month_end", 12);
    body.append("year_begin", 2017);
    body.append("year_end", 2050);
    return fetch("https://www.gran-turismo.com/us/api/gt7sp/profile/", { method: "POST", body })
        .then(response => response.json())
        .then(({ stats_history }) => stats_history);
}

function collectStats(stats, key) {
    return stats.flatMap(monthlyStats => monthlyStats[key] || [])
        .filter(value => value != 0)
        .map(value => parseInt(value));
}

function Container(stats, history) {
    const driverRatingHistory = collectStats(history, "stats12");
    const sportsmanshipRatingHistory = collectStats(history, "stats13");

    return {
        view: () => m("div", { style: { textAlign: "center", fontFamily: "sans-serif" } }, [
            (driverRatingHistory.length > 1) && m(Section([
                m(Title("Driver Rating")),
                m("div", [
                    m(Stat("CURRENT", currentValue(driverRatingHistory))),
                    m(Stat("MAX", maxValue(driverRatingHistory))),
                    m(Stat("UPRATE", stats.driver_point_up_rate)),
                ]),
                m(RatingChart(driverRatingHistory))
            ])),
            (sportsmanshipRatingHistory.length > 1) && m(Section([
                m(Title("Sportsmanship Rating")),
                m("div", [
                    m(Stat("CURRENT", currentValue(sportsmanshipRatingHistory))),
                    m(Stat("MAX", maxValue(sportsmanshipRatingHistory))),
                ]),
                m(RatingChart(sportsmanshipRatingHistory))
            ]))
        ])
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

function maxValue(series) {
    return Math.max(...series);
}

function currentValue(series) {
    return series[series.length - 1];
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

function RatingChart(series) {
    return {
        view: () => m(
            "div",
            { style: { width: "800px", height: "400px", margin: "auto" } },
            m("canvas", { width: 800, height: 400, oncreate: (vnode) => renderChart(vnode.dom, series) })
        )
    }
}

function renderChart(element, series) {
    return new Chart(element, {
        type: "line",
        data: {
            datasets: [
                {
                    data: series.map((y, x) => ({ x, y })),
                    steppedLine: "after",
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
            }
        }
    });
}

window.onload = inject;

chrome.runtime.onMessage.addListener(
    (request) => (request === "onHistoryStateUpdated") && inject()
);
