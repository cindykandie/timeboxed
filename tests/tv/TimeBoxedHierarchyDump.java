import com.android.uiautomator.core.Configurator;
import com.android.uiautomator.testrunner.UiAutomatorTestCase;

// Test tooling only. The stock `uiautomator dump` requires a whole second of
// accessibility inactivity, which a live clock cannot guarantee.
@SuppressWarnings("deprecation")
public class TimeBoxedHierarchyDump extends UiAutomatorTestCase {
  public void testDump() throws Exception {
    Configurator.getInstance().setWaitForIdleTimeout(0);
    // Let Android finish connecting its accessibility bridge without waiting
    // for the application's clock to become idle.
    sleep(750);
    if (getParams().containsKey("hoverX")) {
      // The bundled shell `input` command cannot inject ACTION_HOVER_MOVE.
      // Use the existing automation bridge for a real mouse hover event.
      java.lang.reflect.Method bridgeMethod = getUiDevice().getClass().getDeclaredMethod("getAutomatorBridge");
      bridgeMethod.setAccessible(true);
      Object bridge = bridgeMethod.invoke(getUiDevice());
      java.lang.reflect.Method inject = Class.forName("com.android.uiautomator.core.UiAutomatorBridge")
        .getMethod("injectInputEvent", android.view.InputEvent.class, boolean.class);
      android.view.MotionEvent.PointerProperties pointer = new android.view.MotionEvent.PointerProperties();
      pointer.id = 0;
      pointer.toolType = android.view.MotionEvent.TOOL_TYPE_MOUSE;
      android.view.MotionEvent.PointerCoords coordinates = new android.view.MotionEvent.PointerCoords();
      coordinates.x = Float.parseFloat(getParams().getString("hoverX"));
      coordinates.y = Float.parseFloat(getParams().getString("hoverY"));
      long now = android.os.SystemClock.uptimeMillis();
      android.view.MotionEvent event = android.view.MotionEvent.obtain(now, now,
        android.view.MotionEvent.ACTION_HOVER_MOVE, 1,
        new android.view.MotionEvent.PointerProperties[] { pointer },
        new android.view.MotionEvent.PointerCoords[] { coordinates },
        0, 0, 1, 1, 0, 0, android.view.InputDevice.SOURCE_MOUSE, 0);
      assertTrue("Mouse hover injection failed", (Boolean) inject.invoke(bridge, event, true));
      event.recycle();
      sleep(250);
    }
    java.io.File folder = new java.io.File(android.os.Environment.getDataDirectory(), "local/tmp");
    folder.mkdirs();
    java.io.File output = new java.io.File(folder, "timeboxed-dashboard-test.xml");
    output.delete();
    getUiDevice().dumpWindowHierarchy("timeboxed-dashboard-test.xml");
    assertTrue("No accessibility root yet", output.exists());
    System.out.println(new String(java.nio.file.Files.readAllBytes(output.toPath()), "UTF-8"));
    output.delete();
  }
}
