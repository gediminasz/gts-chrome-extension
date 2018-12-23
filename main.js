function getUserId(pattern = /us\/gtsport\/user\/profile\/(\d+)\/overview/) {
    return pattern.exec(location.href)[1];
}

function inject() {
    const appMountRoot = document.getElementById("app_mount_root");
    appMountRoot.insertAdjacentHTML("afterend", "<div>TEST</div>");
}

console.log({ userId: getUserId() });

inject();
