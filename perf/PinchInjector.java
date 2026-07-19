import android.hardware.input.InputManager;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.MotionEvent;

import java.lang.reflect.Method;

/**
 * Injects a REAL two-pointer pinch gesture through InputManager — the same
 * mechanism scrcpy uses. Runs on-device under app_process with the adb shell
 * uid (which holds INJECT_EVENTS), so it needs no root, no /dev/input access,
 * and no cooperation from the target app.
 *
 * Usage:
 *   adb push pinch.dex /data/local/tmp/
 *   adb shell CLASSPATH=/data/local/tmp/pinch.dex app_process / PinchInjector \
 *       <cx> <cy> <gap0> <gap1> <durationMs>
 *
 * gap1 > gap0 = fingers move apart (zoom in); gap1 < gap0 = together (zoom out).
 * Fingers are horizontal around (cx, cy).
 */
public final class PinchInjector {

  private static Object inputManager;
  private static Method injectMethod;

  private static void resolveInjector() throws Exception {
    // Android 14+: InputManagerGlobal; older: InputManager.getInstance().
    try {
      Class<?> global = Class.forName("android.hardware.input.InputManagerGlobal");
      inputManager = global.getMethod("getInstance").invoke(null);
      injectMethod =
          global.getMethod("injectInputEvent", InputEvent.class, int.class);
    } catch (ClassNotFoundException e) {
      inputManager = InputManager.class.getMethod("getInstance").invoke(null);
      injectMethod =
          InputManager.class.getMethod(
              "injectInputEvent", InputEvent.class, int.class);
    }
  }

  private static void inject(MotionEvent event) throws Exception {
    // 0 = INJECT_INPUT_EVENT_MODE_ASYNC
    injectMethod.invoke(inputManager, event, 0);
    event.recycle();
  }

  private static MotionEvent obtain(
      long downTime, int action, int pointerCount, float ax, float ay, float bx, float by) {
    MotionEvent.PointerProperties[] props =
        new MotionEvent.PointerProperties[pointerCount];
    MotionEvent.PointerCoords[] coords =
        new MotionEvent.PointerCoords[pointerCount];
    for (int i = 0; i < pointerCount; i++) {
      props[i] = new MotionEvent.PointerProperties();
      props[i].id = i;
      props[i].toolType = MotionEvent.TOOL_TYPE_FINGER;
      coords[i] = new MotionEvent.PointerCoords();
      coords[i].x = i == 0 ? ax : bx;
      coords[i].y = i == 0 ? ay : by;
      coords[i].pressure = 1f;
      coords[i].size = 1f;
    }
    return MotionEvent.obtain(
        downTime,
        SystemClock.uptimeMillis(),
        action,
        pointerCount,
        props,
        coords,
        0,
        0,
        1f,
        1f,
        0,
        0,
        InputDevice.SOURCE_TOUCHSCREEN,
        0);
  }

  public static void main(String[] args) throws Exception {
    float cx = Float.parseFloat(args[0]);
    float cy = Float.parseFloat(args[1]);
    float gap0 = Float.parseFloat(args[2]);
    float gap1 = Float.parseFloat(args[3]);
    long durationMs = args.length > 4 ? Long.parseLong(args[4]) : 600;
    int steps = Math.max(10, (int) (durationMs / 12));

    resolveInjector();

    long downTime = SystemClock.uptimeMillis();

    // Finger A down.
    inject(obtain(downTime, MotionEvent.ACTION_DOWN, 1, cx - gap0, cy, 0, 0));
    // Finger B down (pointer index 1).
    int pointerDown =
        MotionEvent.ACTION_POINTER_DOWN
            | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT);
    inject(obtain(downTime, pointerDown, 2, cx - gap0, cy, cx + gap0, cy));

    // Linked movement.
    for (int step = 1; step <= steps; step++) {
      float gap = gap0 + (gap1 - gap0) * step / steps;
      inject(obtain(downTime, MotionEvent.ACTION_MOVE, 2, cx - gap, cy, cx + gap, cy));
      Thread.sleep(Math.max(4, durationMs / steps));
    }

    // Lift B then A.
    int pointerUp =
        MotionEvent.ACTION_POINTER_UP
            | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT);
    inject(obtain(downTime, pointerUp, 2, cx - gap1, cy, cx + gap1, cy));
    inject(obtain(downTime, MotionEvent.ACTION_UP, 1, cx - gap1, cy, 0, 0));

    System.out.println(
        "pinch " + (gap1 > gap0 ? "OUT" : "IN") + " done: gap " + gap0 + " -> " + gap1);
  }
}
