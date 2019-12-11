import json
import os
import zipfile

PATHS = (
    "assets/icons/icon16.png",
    "assets/icons/icon48.png",
    "assets/icons/icon128.png",
    "lib/Chart.min.js",
    "lib/mithril.min.js",
    "lib/moment.min.js",
    "background.js",
    "main.js",
    "manifest.json",
)

with open("manifest.json", "r") as manifest:
    version = json.load(manifest)["version"]

os.makedirs("dist", exist_ok=True)

with zipfile.ZipFile(f"dist/DR-SR-Charts-{version}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
    for path in PATHS:
        zipf.write(path)
