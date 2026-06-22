// @bun
import {
  getSettingsWithAllErrors,
  init_allErrors,
  init_notifications,
  init_useSettingsChange,
  useNotifications,
  useSettingsChange
} from "./chunk-85672e5z.js";
import {
  require_react
} from "./chunk-93gg03n2.js";
import {
  getIsRemoteMode,
  init_state
} from "./chunk-xqs9r7pg.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/notifs/useSettingsErrors.tsx
function useSettingsErrors() {
  const { addNotification, removeNotification } = useNotifications();
  const [errors, setErrors] = import_react.useState(() => {
    const { errors: errors2 } = getSettingsWithAllErrors();
    return errors2;
  });
  const handleSettingsChange = import_react.useCallback(() => {
    const { errors: errors2 } = getSettingsWithAllErrors();
    setErrors(errors2);
  }, []);
  useSettingsChange(handleSettingsChange);
  import_react.useEffect(() => {
    if (getIsRemoteMode())
      return;
    if (errors.length > 0) {
      const message = `Found ${errors.length} settings ${errors.length === 1 ? "issue" : "issues"} \xB7 /doctor for details`;
      addNotification({
        key: SETTINGS_ERRORS_NOTIFICATION_KEY,
        text: message,
        color: "warning",
        priority: "high",
        timeoutMs: 60000
      });
    } else {
      removeNotification(SETTINGS_ERRORS_NOTIFICATION_KEY);
    }
  }, [errors, addNotification, removeNotification]);
  return errors;
}
var import_react, SETTINGS_ERRORS_NOTIFICATION_KEY = "settings-errors";
var init_useSettingsErrors = __esm(() => {
  init_notifications();
  init_state();
  init_allErrors();
  init_useSettingsChange();
  import_react = __toESM(require_react(), 1);
});

export { useSettingsErrors, init_useSettingsErrors };

//# debugId=26E6A90885CA574464756E2164756E21
//# sourceMappingURL=chunk-n25ac8jz.js.map
