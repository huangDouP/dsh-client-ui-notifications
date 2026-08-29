import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
const NOTIFICATIONS_NAMESPACE = "notifications";
const NotificationsSchema = z.object({
  /** Master switch: when false, nothing fires. */
  enabled: z.boolean().default(true),
  /** Notify when a session is waiting for approval or a question. */
  approval: z.boolean().default(true),
  /** Notify when a running turn finishes (agent went idle). */
  turnComplete: z.boolean().default(true),
  /** Notify when a turn/step errors. */
  error: z.boolean().default(true),
  /** Use the browser Notification API (system-level, requires permission). */
  browserNotify: z.boolean().default(true),
  /** Flash the tab title while the tab is in the background. */
  tabFlash: z.boolean().default(true),
  /** Overlay a red dot on the favicon while the tab is in the background. */
  faviconBadge: z.boolean().default(true),
  /** Play a short beep (WebAudio). */
  sound: z.boolean().default(true),
  /** Windows 原生 toast（Host 侧 PowerShell/WinRT；浏览器整个关掉也能弹）。 */
  nativeToast: z.boolean().default(false),
  /** Cooldown in seconds between two notifications of the same kind. */
  cooldownSec: z.number().default(30)
});
function apply(ctx) {
  const ns = settingsNamespace(NOTIFICATIONS_NAMESPACE);
  let settings = void 0;
  ctx.inject(["settings"], (settingsCtx) => {
    settings = settingsCtx.settings;
    settingsCtx.settings.register(ns, NotificationsSchema);
  });
  function cfg() {
    if (!settings) return {};
    try {
      const value = settings.get(ns);
      return value && typeof value === "object" ? value : {};
    } catch (e) {
      return {};
    }
  }
  const lastFired = /* @__PURE__ */ new Map();
  function cooldownOk(kind) {
    const c = cfg();
    const ms = (c.cooldownSec == null ? 30 : c.cooldownSec) * 1e3;
    const now = Date.now();
    const last = lastFired.get(kind);
    if (last !== void 0 && now - last < ms) return false;
    lastFired.set(kind, now);
    return true;
  }
  function shouldToast(kind) {
    const c = cfg();
    if (c.enabled !== true) return false;
    if (c.nativeToast !== true) return false;
    if (kind === "approval" && c.approval !== true) return false;
    if (kind === "turnComplete" && c.turnComplete !== true) return false;
    if (kind === "error" && c.error !== true) return false;
    return cooldownOk(kind);
  }
  let burntProbe = null;
  function probeBurnt() {
    if (burntProbe !== null) return burntProbe;
    const shell = ctx.get("shell");
    if (!shell) {
      burntProbe = Promise.resolve(false);
      return burntProbe;
    }
    burntProbe = (async () => {
      try {
        const spec = shell.resolve({
          command: 'powershell -NoProfile -NonInteractive -Command "$m=Get-Module -ListAvailable BurntToast; if($m){exit 0}else{exit 9}"',
          timeoutMs: 1e4
        });
        const result = await shell.run(spec);
        return result.exitCode === 0;
      } catch (e) {
        return false;
      }
    })();
    return burntProbe;
  }
  function psQuote(text) {
    return "'" + String(text).replace(/'/g, "''") + "'";
  }
  function winrtToastScript(title, body) {
    return [
      "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null",
      "[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null",
      "[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null",
      "$t=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)",
      "$x=$t.GetElementsByTagName('text')",
      "$x.Item(0).AppendChild($t.CreateTextNode(" + psQuote(title) + ")) | Out-Null",
      "$x.Item(1).AppendChild($t.CreateTextNode(" + psQuote(body) + ")) | Out-Null",
      "$n=[Windows.UI.Notifications.ToastNotification]::new($t)",
      "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('DSH').Show($n) | Out-Null"
    ].join("; ");
  }
  function utf16leBase64(text) {
    const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      bytes.push(code & 255, code >> 8 & 255);
    }
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      out += table[b0 >> 2];
      out += table[(b0 & 3) << 4 | b1 >> 4];
      if (i + 1 < bytes.length) {
        out += table[(b1 & 15) << 2 | b2 >> 6];
        out += i + 2 < bytes.length ? table[b2 & 63] : "=";
      } else {
        out += "==";
      }
    }
    return out;
  }
  async function fireNativeToast(kind, title, body) {
    try {
      const shell = ctx.get("shell");
      if (!shell) return;
      const hasBurnt = await probeBurnt();
      const script = hasBurnt ? "New-BurntToastNotification -Text " + psQuote(title) + "," + psQuote(body) + " -UniqueIdentifier dsh-notify-" + kind + " | Out-Null" : winrtToastScript(title, body);
      const spec = shell.resolve({
        command: "powershell -NoProfile -NonInteractive -EncodedCommand " + utf16leBase64(script),
        timeoutMs: 15e3
      });
      await shell.run(spec);
    } catch (e) {
    }
  }
  ctx.on("approval/request", (req, next) => {
    try {
      if (shouldToast("approval")) {
        const tool = req && typeof req.toolName === "string" ? req.toolName : "\u64CD\u4F5C";
        const reason = req && typeof req.reason === "string" && req.reason ? "\uFF1A" + req.reason : "";
        fireNativeToast("approval", "\u26A0 DSH \u9700\u8981\u4F60\u6279\u51C6", "\u300C" + tool + "\u300D\u6B63\u5728\u7B49\u5F85\u4F60\u5141\u8BB8" + reason);
      }
    } catch (e) {
    }
    return next();
  });
  const agentStatus = /* @__PURE__ */ new Map();
  ctx.on("agent/status", (payload) => {
    try {
      const agent = payload && payload.agent;
      const status = payload && payload.status;
      if (!agent || typeof status !== "string") return;
      const id = typeof agent.sessionId === "string" ? agent.sessionId : null;
      const prev = agentStatus.get(id);
      agentStatus.set(id, status);
      if (prev === "running" && status === "idle" && shouldToast("turnComplete")) {
        fireNativeToast("turnComplete", "\u2705 DSH \u56DE\u5408\u5B8C\u6210", "\u5DF2\u5B8C\u6210\uFF0C\u7B49\u5F85\u4F60\u7684\u4E0B\u4E00\u6B65" + (id ? "\uFF08" + id + "\uFF09" : ""));
      }
    } catch (e) {
    }
  });
  ctx.on("agent/error", (payload) => {
    try {
      if (!shouldToast("error")) return;
      const err = payload && payload.error;
      const msg = err && typeof err.message === "string" ? err.message : "\u56DE\u5408\u51FA\u9519";
      fireNativeToast("error", "\u26A0 DSH \u51FA\u9519\u4E86", msg);
    } catch (e) {
    }
  });
}
export {
  apply
};
