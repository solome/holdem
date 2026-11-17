#!/usr/bin/env python3
"""Regenerate the browser and install icons from the web SVG with macOS sips."""

from pathlib import Path
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET


BRAND = Path(__file__).resolve().parents[1] / "assets" / "brand"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def rasterize(size, temp, *, full_bleed=False, maskable=False):
    root = ET.parse(BRAND / "logo.svg").getroot()
    root.set("width", str(size))
    root.set("height", str(size))
    if full_bleed:
        root.find(".//*[@id='tile']").attrib.pop("rx")
        root.remove(root.find(".//*[@id='frame']"))
    if maskable:
        # Android can crop to a centered circle with a radius of 40%.
        root.find(".//*[@id='card']").set(
            "transform", "translate(128 128) scale(.8) translate(-128 -128)"
        )
    source, dest = temp / "icon.svg", temp / "icon.png"
    ET.ElementTree(root).write(source, encoding="utf-8")
    subprocess.run(
        ["sips", "-s", "format", "png", str(source), "--out", str(dest)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return dest.read_bytes()


def ico(sizes, temp):
    data = [rasterize(size, temp) for size in sizes]
    offset = 6 + 16 * len(sizes)
    header = [struct.pack("<HHH", 0, 1, len(sizes))]
    for size, png in zip(sizes, data):
        header.append(struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(png), offset))
        offset += len(png)
    return b"".join(header + data)


with tempfile.TemporaryDirectory() as work:
    temp = Path(work)
    for name, size, full_bleed, maskable in (
        ("apple-touch-icon.png", 180, True, False),
        ("icon-192.png", 192, False, False),
        ("icon-512.png", 512, False, False),
        ("maskable-512.png", 512, True, True),
    ):
        (BRAND / name).write_bytes(rasterize(size, temp, full_bleed=full_bleed, maskable=maskable))
    (BRAND / "favicon.ico").write_bytes(ico((16, 32, 48), temp))
