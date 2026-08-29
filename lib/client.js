window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-client-ui-notifications",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
		  // If the importer is in node compatibility mode or this is not an ESM
		  // file that has been converted to a CommonJS file using a Babel-
		  // compatible transform (i.e. "__esModule" has not been set), then set
		  // "default" to the CommonJS "module.exports" for node compatibility.
		  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
		  mod
		));
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// src/client/index.ts
		var index_exports = {};
		__export(index_exports, {
		  apply: () => apply
		});
		module.exports = __toCommonJS(index_exports);
		var React = __toESM(require("react"), 1);
		var NS = "notifications";
		var FLASH_INTERVAL_MS = 800;
		var FLASH_MAX_MS = 3e4;
		var KIND_PREFIX = { approval: "\u26A0", turnComplete: "\u2705", error: "\u26A0" };
		var LOCALE_NS = "notifications.settings";
		var zhDict = {
		  nav: "\u901A\u77E5",
		  intro: "\u5F53 DSH \u9700\u8981\u4F60\u56DE\u6765\u5904\u7406\uFF08\u7B49\u5F85\u6279\u51C6/\u63D0\u95EE\u3001\u56DE\u5408\u5B8C\u6210\u3001\u51FA\u9519\uFF09\u800C\u4F60\u53C8\u4E0D\u5728\u770B\u8FD9\u4E2A\u7A97\u53E3\u65F6\uFF0C\u7528\u4E0B\u9762\u7684\u65B9\u5F0F\u63D0\u9192\u4F60\u3002",
		  enabled: "\u542F\u7528\u901A\u77E5",
		  approval: "\u7B49\u5F85\u6279\u51C6 / \u63D0\u95EE",
		  turnComplete: "\u56DE\u5408\u5B8C\u6210",
		  error: "\u51FA\u9519",
		  browserNotify: "\u6D4F\u89C8\u5668\u7CFB\u7EDF\u901A\u77E5",
		  nativeToast: "\u539F\u751F\u7CFB\u7EDF\u901A\u77E5\uFF08\u6D4F\u89C8\u5668\u5173\u95ED\u4E5F\u80FD\u5F39\uFF09",
		  tabFlash: "Tab \u6807\u9898\u95EA\u70C1",
		  faviconBadge: "favicon \u7EA2\u70B9",
		  sound: "\u58F0\u97F3\u63D0\u793A",
		  cooldown: "\u540C\u7C7B\u901A\u77E5\u51B7\u5374\uFF08\u79D2\uFF09",
		  hint: "\u6D4F\u89C8\u5668\u7CFB\u7EDF\u901A\u77E5\uFF1A\u5F00\u542F\u65F6\u6D4F\u89C8\u5668\u4F1A\u8BF7\u6C42\u300C\u5141\u8BB8\u53D1\u9001\u901A\u77E5\u300D\u6743\u9650\uFF0C\u5141\u8BB8\u540E\u5373\u4F7F\u5207\u5230\u5176\u4ED6\u7A97\u53E3\u4E5F\u4F1A\u5728\u7CFB\u7EDF\u901A\u77E5\u4E2D\u5FC3\u6536\u5230\uFF08\u9700\u6807\u7B7E\u9875\u5F00\u7740\uFF09\u3002\u539F\u751F\u7CFB\u7EDF\u901A\u77E5\uFF1A\u7531 DSH \u8FDB\u7A0B\u76F4\u63A5\u5F39 Windows toast\uFF0C\u6D4F\u89C8\u5668\u6574\u4E2A\u5173\u6389\u4E5F\u80FD\u6536\u5230\uFF08\u96F6\u4F9D\u8D56\uFF0C\u81EA\u5E26 WinRT \u5B9E\u73B0\uFF1B\u53E6\u88C5 BurntToast \u6A21\u5757\u53EF\u83B7\u5F97\u66F4\u7F8E\u89C2\u6837\u5F0F\uFF09\u3002Tab \u6807\u9898\u95EA\u70C1\u4E0E favicon \u7EA2\u70B9\u53EA\u5728\u6807\u7B7E\u9875\u5904\u4E8E\u540E\u53F0\u65F6\u751F\u6548\u3002",
		  approvalTitle: "\u26A0 \u9700\u8981\u4F60\u6279\u51C6",
		  approvalBody: "\u300C{label}\u300D\u6709\u4E00\u4E2A\u64CD\u4F5C\u6B63\u5728\u7B49\u5F85\u4F60\u5141\u8BB8",
		  questionTitle: "\u26A0 \u9700\u8981\u4F60\u56DE\u7B54",
		  questionBody: "\u300C{label}\u300D\u6709\u4E00\u4E2A\u95EE\u9898\u6B63\u5728\u7B49\u5F85\u4F60\u56DE\u7B54",
		  completeTitle: "\u2705 \u56DE\u5408\u5B8C\u6210",
		  completeBody: "\u300C{label}\u300D\u5DF2\u5B8C\u6210\uFF0C\u7B49\u5F85\u4F60\u7684\u4E0B\u4E00\u6B65",
		  errorTitle: "\u26A0 \u51FA\u9519\u4E86",
		  errorBody: "\u300C{label}\u300D\uFF1A{message}"
		};
		var enDict = {
		  nav: "Notifications",
		  intro: "When DSH needs your attention (approval/question waiting, turn complete, errors) while you are not looking at this window, get reminded with the options below.",
		  enabled: "Enable notifications",
		  approval: "Approval / question waiting",
		  turnComplete: "Turn complete",
		  error: "Errors",
		  browserNotify: "Browser notifications",
		  nativeToast: "Native system notifications (work with the browser closed)",
		  tabFlash: "Tab title flash",
		  faviconBadge: "Favicon badge",
		  sound: "Sound",
		  cooldown: "Cooldown between same-kind notifications (s)",
		  hint: "Browser notifications: the browser asks for \u201Callow notifications\u201D permission; once granted, they appear in the system notification center even when you switch windows (the tab must stay open). Native system notifications: DSH shows a Windows toast directly and they work even with the browser fully closed (zero-dependency WinRT; installing the BurntToast module yields nicer styling). Tab title flash and the favicon badge only apply while the tab is in the background.",
		  approvalTitle: "\u26A0 Approval required",
		  approvalBody: "\u201C{label}\u201D has an operation waiting for your approval",
		  questionTitle: "\u26A0 Question waiting",
		  questionBody: "\u201C{label}\u201D has a question waiting for your answer",
		  completeTitle: "\u2705 Turn complete",
		  completeBody: "\u201C{label}\u201D completed, awaiting your next step",
		  errorTitle: "\u26A0 Something went wrong",
		  errorBody: "\u201C{label}\u201D: {message}"
		};
		function fmt(tpl, params) {
		  return tpl.replace(/\{(\w+)\}/g, (m, k) => {
		    return params[k] !== void 0 ? String(params[k]) : m;
		  });
		}
		var flashTimer = null;
		var originalTitle = null;
		function startTitleFlash(prefix) {
		  if (flashTimer !== null) return;
		  if (originalTitle === null) originalTitle = document.title;
		  let on = false;
		  flashTimer = setInterval(() => {
		    on = !on;
		    document.title = on ? prefix + " " + originalTitle : originalTitle ?? "";
		  }, FLASH_INTERVAL_MS);
		  setTimeout(() => {
		    stopTitleFlash();
		  }, FLASH_MAX_MS);
		}
		function stopTitleFlash() {
		  if (flashTimer !== null) {
		    clearInterval(flashTimer);
		    flashTimer = null;
		  }
		  if (originalTitle !== null) {
		    document.title = originalTitle;
		    originalTitle = null;
		  }
		}
		var badgeLink = null;
		function setFaviconBadge(show) {
		  if (show) {
		    if (badgeLink !== null) return;
		    const link = document.createElement("link");
		    link.rel = "icon";
		    link.dataset.dshNotifyBadge = "";
		    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="50" cy="14" r="12" fill="#e5484d"/></svg>';
		    link.href = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
		    document.head.append(link);
		    badgeLink = link;
		  } else if (badgeLink !== null) {
		    badgeLink.remove();
		    badgeLink = null;
		  }
		}
		var beepCtx = null;
		function beep() {
		  try {
		    const AC = window.AudioContext || window.webkitAudioContext;
		    if (!AC) return;
		    if (beepCtx === null) beepCtx = new AC();
		    if (beepCtx.state === "suspended") {
		      try {
		        beepCtx.resume();
		      } catch (e) {
		      }
		    }
		    const o = beepCtx.createOscillator();
		    const g = beepCtx.createGain();
		    o.connect(g);
		    g.connect(beepCtx.destination);
		    o.frequency.value = 880;
		    g.gain.setValueAtTime(0.05, beepCtx.currentTime);
		    g.gain.exponentialRampToValueAtTime(1e-4, beepCtx.currentTime + 0.2);
		    o.start();
		    o.stop(beepCtx.currentTime + 0.2);
		  } catch (e) {
		  }
		}
		function warmupBeepAudio() {
		  try {
		    const AC = window.AudioContext || window.webkitAudioContext;
		    if (!AC) return;
		    if (beepCtx === null) beepCtx = new AC();
		    if (beepCtx.state === "suspended") {
		      try {
		        beepCtx.resume();
		      } catch (e) {
		      }
		    }
		  } catch (e) {
		  }
		}
		function requestNotifyPermission() {
		  if (typeof Notification === "undefined") return;
		  if (Notification.permission === "default") {
		    try {
		      Notification.requestPermission();
		    } catch (e) {
		    }
		  }
		}
		function Page(scope, requestNotifyPermission2, t, locale) {
		  return React.createElement(function NotificationsSettingsPage(_props) {
		    const force = React.useReducer((c) => c + 1, 0)[1];
		    React.useEffect(() => {
		      return scope.subscribe(force);
		    }, []);
		    React.useEffect(() => {
		      if (locale) return locale.subscribe(force);
		    }, []);
		    const snap = scope.getSnapshot();
		    const value = snap.value || {};
		    const tr = (key, fallback) => {
		      return t ? t(key) : fallback;
		    };
		    const rows = [
		      ["enabled"],
		      ["approval"],
		      ["turnComplete"],
		      ["error"],
		      ["browserNotify"],
		      ["nativeToast"],
		      ["tabFlash"],
		      ["faviconBadge"],
		      ["sound"]
		    ];
		    const rowStyle = {
		      display: "flex",
		      alignItems: "center",
		      gap: "8px",
		      minHeight: "28px",
		      fontSize: "13px",
		      cursor: "pointer"
		    };
		    const containerStyle = {
		      display: "flex",
		      flexDirection: "column",
		      gap: "6px",
		      padding: "2px 0"
		    };
		    const hintStyle = {
		      color: "var(--dsw-alias-label-secondary, #8b8b8b)",
		      fontSize: "12px",
		      lineHeight: "18px",
		      margin: "8px 0 0"
		    };
		    const els = [
		      React.createElement("p", {
		        key: "intro",
		        style: {
		          color: "var(--dsw-alias-label-secondary, #8b8b8b)",
		          fontSize: "13px",
		          lineHeight: "20px",
		          margin: "0 0 8px"
		        }
		      }, tr("intro", zhDict.intro))
		    ];
		    for (let i = 0; i < rows.length; i++) {
		      const r = rows[i];
		      const field = r[0];
		      const label = tr(field, zhDict[field] || field);
		      const checked = !!value[field];
		      const onChange = /* @__PURE__ */ ((f, cur) => {
		        return () => {
		          if (f === "browserNotify" && !cur) {
		            scope.set(f, true);
		            requestNotifyPermission2();
		            return;
		          }
		          scope.set(f, !cur);
		        };
		      })(field, checked);
		      els.push(
		        React.createElement(
		          "label",
		          { key: field, style: rowStyle },
		          React.createElement("input", { type: "checkbox", checked, onChange }),
		          React.createElement("span", null, label)
		        )
		      );
		    }
		    els.push(
		      React.createElement(
		        "label",
		        { key: "cooldown", style: rowStyle },
		        React.createElement("span", { style: { minWidth: "140px" } }, tr("cooldown", zhDict.cooldown)),
		        React.createElement("input", {
		          type: "number",
		          min: 0,
		          step: 5,
		          style: {
		            width: "72px",
		            background: "var(--dsw-alias-bg-base, #fff)",
		            border: "1px solid var(--dsw-alias-border-l2, #d0d0d0)",
		            borderRadius: "6px",
		            padding: "2px 6px",
		            fontSize: "13px"
		          },
		          value: value.cooldownSec == null ? 30 : value.cooldownSec,
		          onChange: (e) => {
		            scope.set("cooldownSec", Number(e.target.value) || 0);
		          }
		        })
		      )
		    );
		    els.push(
		      React.createElement(
		        "p",
		        { key: "hint", style: hintStyle },
		        tr("hint", zhDict.hint)
		      )
		    );
		    return React.createElement("div", { style: containerStyle }, els);
		  }, null);
		}
		function apply(ctx) {
		  const sessions = ctx.get("sessions");
		  const slots = ctx.get("slots");
		  const settingsScope = ctx.get("settingsScope");
		  if (!sessions || !settingsScope) return;
		  const locale = ctx.get("locale");
		  let t = void 0;
		  if (locale) {
		    ctx.effect(() => {
		      return locale.register(LOCALE_NS, { zh: zhDict, en: enDict });
		    }, "client-ui-notifications: locale");
		    t = locale.bind(LOCALE_NS);
		  }
		  const tr = (key, fallback) => {
		    return t ? t(key) : fallback;
		  };
		  const scope = settingsScope.bind({ namespace: NS });
		  const seen = /* @__PURE__ */ new Map();
		  const notifiedAt = /* @__PURE__ */ new Map();
		  const disposers = [];
		  const watched = /* @__PURE__ */ new Set();
		  function cfg() {
		    const v = scope.getSnapshot().value;
		    return v || {};
		  }
		  function cooldownOk(kind) {
		    const c = cfg();
		    const cooldownMs = (c.cooldownSec == null ? 30 : c.cooldownSec) * 1e3;
		    const now = Date.now();
		    const last = notifiedAt.get(kind);
		    if (last !== void 0 && now - last < cooldownMs) return false;
		    notifiedAt.set(kind, now);
		    return true;
		  }
		  function sessionTitle(id) {
		    try {
		      const list = sessions.list.getSnapshot();
		      const row = list && list.byId ? list.byId[id] : void 0;
		      return row && row.displayTitle ? row.displayTitle : id;
		    } catch (e) {
		      return id;
		    }
		  }
		  function notify(kind, title, body) {
		    const c = cfg();
		    if (!c.enabled) return;
		    if (!c[kind] && kind !== "approval") return;
		    if (kind === "approval" && !c.approval) return;
		    if (!cooldownOk(kind)) return;
		    const unfocused = typeof document.hasFocus === "function" ? !document.hasFocus() : document.hidden;
		    if (!unfocused) return;
		    if (c.sound) beep();
		    if (c.tabFlash) startTitleFlash(KIND_PREFIX[kind] || "");
		    if (c.faviconBadge) setFaviconBadge(true);
		    if (c.browserNotify && typeof Notification !== "undefined") {
		      if (Notification.permission === "granted") {
		        try {
		          const n = new Notification(title, { body, tag: "dsh-notify-" + kind });
		          n.onclick = () => {
		            try {
		              window.focus();
		            } catch (e) {
		            }
		            try {
		              n.close();
		            } catch (e) {
		            }
		          };
		        } catch (e) {
		        }
		      }
		    }
		  }
		  function pendingKinds(snap) {
		    const out = [];
		    const pend = snap.pending;
		    if (pend && pend.length) {
		      for (let i = 0; i < pend.length; i++) out.push(pend[i].kind);
		    }
		    return out.sort().join(",");
		  }
		  function evaluate(sessionId, snap) {
		    if (!snap) return;
		    const cur = {
		      running: !!snap.running,
		      pending: pendingKinds(snap),
		      error: snap.lastAgentError || null
		    };
		    const prev = seen.get(sessionId);
		    seen.set(sessionId, cur);
		    if (!prev) return;
		    const label = sessionTitle(sessionId);
		    const c = cfg();
		    if (cur.pending.indexOf("approval") !== -1 && prev.pending.indexOf("approval") === -1) {
		      notify("approval", tr("approvalTitle", zhDict.approvalTitle), fmt(tr("approvalBody", zhDict.approvalBody), { label }));
		    }
		    if (cur.pending.indexOf("question") !== -1 && prev.pending.indexOf("question") === -1) {
		      notify("approval", tr("questionTitle", zhDict.questionTitle), fmt(tr("questionBody", zhDict.questionBody), { label }));
		    }
		    if (c.turnComplete && prev.running && !cur.running) {
		      notify("turnComplete", tr("completeTitle", zhDict.completeTitle), fmt(tr("completeBody", zhDict.completeBody), { label }));
		    }
		    if (c.error && !prev.error && cur.error) {
		      notify("error", tr("errorTitle", zhDict.errorTitle), fmt(tr("errorBody", zhDict.errorBody), { label, message: cur.error }));
		    }
		  }
		  function watchSession(id) {
		    if (watched.has(id)) return;
		    const binding = sessions.binding(id);
		    if (!binding) return;
		    watched.add(id);
		    disposers.push(
		      binding.session.subscribe(() => {
		        evaluate(id, binding.session.getSnapshot());
		      })
		    );
		    evaluate(id, binding.session.getSnapshot());
		  }
		  function syncWatchers() {
		    try {
		      const list = sessions.list.getSnapshot();
		      const ids = list && list.ids ? list.ids : [];
		      for (let i = 0; i < ids.length; i++) watchSession(ids[i]);
		    } catch (e) {
		    }
		  }
		  function onFocus() {
		    stopTitleFlash();
		    setFaviconBadge(false);
		  }
		  function onVisibilityChange() {
		    if (!document.hidden) onFocus();
		  }
		  if (slots) {
		    const injectDisposer = slots.inject("settings.section", () => {
		      const regDisposer = slots.register(
		        {
		          name: "settings.section",
		          id: "notifications",
		          order: 60,
		          label: () => tr("nav", "\u901A\u77E5"),
		          locale: LOCALE_NS
		        },
		        () => Page(scope, requestNotifyPermission, t, locale)
		      );
		      disposers.push(regDisposer);
		    });
		    disposers.push(injectDisposer);
		  }
		  disposers.push(sessions.list.subscribe(syncWatchers));
		  syncWatchers();
		  document.addEventListener("focus", onFocus);
		  window.addEventListener("focus", onFocus);
		  document.addEventListener("visibilitychange", onVisibilityChange);
		  document.addEventListener("pointerdown", warmupBeepAudio);
		  document.addEventListener("keydown", warmupBeepAudio);
		  if (typeof Notification !== "undefined" && Notification.permission === "default") {
		    setTimeout(() => {
		      requestNotifyPermission();
		    }, 600);
		  }
		  ctx.effect(() => {
		    return () => {
		      for (let i = 0; i < disposers.length; i++) {
		        try {
		          disposers[i]();
		        } catch (e) {
		        }
		      }
		      document.removeEventListener("focus", onFocus);
		      window.removeEventListener("focus", onFocus);
		      document.removeEventListener("visibilitychange", onVisibilityChange);
		      document.removeEventListener("pointerdown", warmupBeepAudio);
		      document.removeEventListener("keydown", warmupBeepAudio);
		      stopTitleFlash();
		      setFaviconBadge(false);
		      if (beepCtx !== null) {
		        try {
		          beepCtx.close();
		        } catch (e) {
		        }
		        beepCtx = null;
		      }
		    };
		  }, "client-ui-notifications");
		}

		return module.exports;
	}
});
