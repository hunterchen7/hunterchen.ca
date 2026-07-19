#!/usr/bin/env python3
"""Emit sendevent lines for a REAL two-finger pinch (multitouch protocol B).

Pipe the output through `adb shell` to perform a linked pinch on the physical
touchscreen — no CDP involved, indistinguishable from human fingers at the
kernel level.

Usage:
  python3 phone-pinch.py DEVICE CX CY GAP0 GAP1 [STEPS] [SCALE] | adb -s SERIAL shell
    DEVICE  e.g. /dev/input/event6 (the touchpanel)
    CX CY   pinch center in screen px
    GAP0    starting half-gap between fingers in px
    GAP1    ending half-gap (GAP1 > GAP0 = pinch out / zoom in)
    STEPS   move frames (default 28)
    SCALE   raw-axis units per px (default 16; ABS_MT_POSITION max / screen px)

Fingers are placed horizontally around the center. Event codes: EV_ABS=3
(SLOT=47 TOUCH_MAJOR=48 POS_X=53 POS_Y=54 TRACKING_ID=57), EV_KEY=1
(BTN_TOUCH=330 BTN_TOOL_FINGER=325), EV_SYN=0.
"""

import sys


def main() -> None:
    device = sys.argv[1]
    cx, cy, gap0, gap1 = (int(v) for v in sys.argv[2:6])
    steps = int(sys.argv[6]) if len(sys.argv) > 6 else 28
    scale = int(sys.argv[7]) if len(sys.argv) > 7 else 16

    def emit(etype: int, code: int, value: int) -> None:
        print(f"sendevent {device} {etype} {code} {value}")

    def syn() -> None:
        emit(0, 0, 0)

    def positions(gap: int) -> tuple[int, int, int]:
        ax = (cx - gap) * scale
        bx = (cx + gap) * scale
        y = cy * scale
        return ax, bx, y

    ax, bx, y = positions(gap0)

    # Finger A down (slot 0)
    emit(3, 47, 0)
    emit(3, 57, 1001)
    emit(3, 53, ax)
    emit(3, 54, y)
    emit(3, 48, 60)
    emit(1, 330, 1)
    emit(1, 325, 1)
    syn()
    # Finger B down (slot 1)
    emit(3, 47, 1)
    emit(3, 57, 1002)
    emit(3, 53, bx)
    emit(3, 54, y)
    emit(3, 48, 60)
    syn()

    # Linked movement
    for step in range(1, steps + 1):
        gap = gap0 + (gap1 - gap0) * step // steps
        ax, bx, y = positions(gap)
        emit(3, 47, 0)
        emit(3, 53, ax)
        emit(3, 47, 1)
        emit(3, 53, bx)
        syn()

    # Lift both
    emit(3, 47, 0)
    emit(3, 57, -1)
    emit(3, 47, 1)
    emit(3, 57, -1)
    emit(1, 330, 0)
    emit(1, 325, 0)
    syn()


if __name__ == "__main__":
    main()
