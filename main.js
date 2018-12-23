function inject() {
    const userId = getUserId();
    console.log({ userId: getUserId() });
    fetchStatsHistory(userId);

    const appMountRoot = document.getElementById("app_mount_root");
    appMountRoot.insertAdjacentHTML("afterend", `<div>${userId}</div>`);
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
    fetch("https://www.gran-turismo.com/us/api/gt7sp/profile/", { method: "POST", body })
        .then(response => response.json())
        .then(content => console.log(content));
}

inject();
