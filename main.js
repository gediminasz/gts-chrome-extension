function inject() {
    const userId = getUserId();
    const appMountRoot = document.getElementById("app_mount_root");

    appMountRoot.insertAdjacentHTML("afterend", '<div style="width: 800px; margin: auto"><canvas id="gts-pex-sr" width="800" height="400" /></div>');
    appMountRoot.insertAdjacentHTML("afterend", '<div style="width: 800px; margin: auto"><canvas id="gts-pex-dr" width="800" height="400" /></div>');

    fetchStatsHistory(userId).then(history => {
        const driverRatingHistory = collectStats(history, "stats12");
        const sporstmanshipRatingHistory = collectStats(history, "stats13");

        renderChart("gts-pex-dr", driverRatingHistory, "#1b2c3d");
        renderChart("gts-pex-sr", sporstmanshipRatingHistory, "#1b2c3d");
    });
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

function renderChart(elementId, series, color) {
    return new Chart(elementId, {
        type: 'line',
        data: {
            datasets: [
                {
                    data: series.map((y, x) => ({ x, y })),
                    steppedLine: "after",
                    fill: false,
                    pointRadius: 0,
                    borderColor: color,
                    backgroundColor: color
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{ type: 'linear' }],
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
