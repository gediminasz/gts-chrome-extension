const CONTAINER_ID = "js-pex-container";
const CHART_COLOR = "#1b2c3d";

function inject() {
    const userId = getUserId();
    const appMountRoot = document.getElementById("app_mount_root");

    appMountRoot.insertAdjacentHTML("afterend", `<div id="${CONTAINER_ID}">Loading...</div>`);

    fetchStatsHistory(userId).then(
        history => m.mount(document.getElementById(CONTAINER_ID), Container(history))
    );
}

function getUserId(pattern = /us\/gtsport\/user\/profile\/(\d+)\/overview/) {
    return pattern.exec(location.href)[1];
}

function fetchStatsHistory(userId) {
    const body = new FormData;
    body.append("job", 12);
    body.append("month_begin", 10);
    body.append("month_end", 12);
    body.append("user_no", userId);
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

function Container(history) {
    const driverRatingHistory = collectStats(history, "stats12");
    const sporstmanshipRatingHistory = collectStats(history, "stats13");

    return {
        view: () => [
            m(RatingChart("Driver Rating", driverRatingHistory)),
            m(RatingChart("Sportsmanship Rating", sporstmanshipRatingHistory))
        ]
    }
}

function RatingChart(title, series) {
    return {
        view: () => (
            m("div", { style: { textAlign: "center" } }, [
                m("h1", title),
                m(
                    "div",
                    { style: { width: "800px", height: "400px", margin: "auto" } },
                    m("canvas", { width: 800, height: 400, oncreate: (vnode) => renderChart(vnode.dom, series) })
                )
            ])
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
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false
            }
        }
    });
}

window.onload = inject;
