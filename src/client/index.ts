import * as React from "react";
import type { Context } from "@deepseek-ai/cordis";

// =========================================================================
// DSH Web 等待/完成通知 —— client 半
// 依赖的浏览器能力（Notification / document / window / AudioContext）在正式
// client 模块中全部可用（动态插件沙箱没有，这正是本包不走动态插件的原因）。
// =========================================================================

const NS = "notifications";
const FLASH_INTERVAL_MS = 800;
const FLASH_MAX_MS = 30000;
const KIND_PREFIX: Record<string, string> = { approval: "⚠", turnComplete: "✅", error: "⚠" };
const LOCALE_NS = "notifications.settings";

// ---------- 本地化字典（zh / en，随通用设置的语言切换） ----------
const zhDict: Record<string, string> = {
	nav: "通知",
	intro: "当 DSH 需要你回来处理（等待批准/提问、回合完成、出错）而你又不在看这个窗口时，用下面的方式提醒你。",
	enabled: "启用通知",
	approval: "等待批准 / 提问",
	turnComplete: "回合完成",
	error: "出错",
	browserNotify: "浏览器系统通知",
	nativeToast: "原生系统通知（浏览器关闭也能弹）",
	tabFlash: "Tab 标题闪烁",
	faviconBadge: "favicon 红点",
	sound: "声音提示",
	cooldown: "同类通知冷却（秒）",
	hint: "浏览器系统通知：开启时浏览器会请求「允许发送通知」权限，允许后即使切到其他窗口也会在系统通知中心收到（需标签页开着）。原生系统通知：由 DSH 进程直接弹 Windows toast，浏览器整个关掉也能收到（零依赖，自带 WinRT 实现；另装 BurntToast 模块可获得更美观样式）。Tab 标题闪烁与 favicon 红点只在标签页处于后台时生效。",
	approvalTitle: "⚠ 需要你批准",
	approvalBody: "「{label}」有一个操作正在等待你允许",
	questionTitle: "⚠ 需要你回答",
	questionBody: "「{label}」有一个问题正在等待你回答",
	completeTitle: "✅ 回合完成",
	completeBody: "「{label}」已完成，等待你的下一步",
	errorTitle: "⚠ 出错了",
	errorBody: "「{label}」：{message}",
};
const enDict: Record<string, string> = {
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
	approvalTitle: "⚠ Approval required",
	approvalBody: "\u201C{label}\u201D has an operation waiting for your approval",
	questionTitle: "⚠ Question waiting",
	questionBody: "\u201C{label}\u201D has a question waiting for your answer",
	completeTitle: "✅ Turn complete",
	completeBody: "\u201C{label}\u201D completed, awaiting your next step",
	errorTitle: "⚠ Something went wrong",
	errorBody: "\u201C{label}\u201D: {message}",
};

function fmt(tpl: string, params: Record<string, unknown>): string {
	return tpl.replace(/\{(\w+)\}/g, (m, k: string) => {
		return params[k] !== undefined ? String(params[k]) : m;
	});
}

// ---------- 浏览器 chrome 辅助 ----------

let flashTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;

function startTitleFlash(prefix: string): void {
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

function stopTitleFlash(): void {
	if (flashTimer !== null) {
		clearInterval(flashTimer);
		flashTimer = null;
	}
	if (originalTitle !== null) {
		document.title = originalTitle;
		originalTitle = null;
	}
}

let badgeLink: HTMLLinkElement | null = null;

function setFaviconBadge(show: boolean): void {
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

let beepCtx: AudioContext | null = null;

function beep(): void {
	try {
		const AC = window.AudioContext || (window as any).webkitAudioContext;
		if (!AC) return;
		if (beepCtx === null) beepCtx = new AC();
		if (beepCtx.state === "suspended") {
			try { beepCtx.resume(); } catch (e) { /* ignore */ }
		}
		const o = beepCtx.createOscillator();
		const g = beepCtx.createGain();
		o.connect(g);
		g.connect(beepCtx.destination);
		o.frequency.value = 880;
		g.gain.setValueAtTime(0.05, beepCtx.currentTime);
		g.gain.exponentialRampToValueAtTime(0.0001, beepCtx.currentTime + 0.2);
		o.start();
		o.stop(beepCtx.currentTime + 0.2);
	} catch (e) { /* 声音只是锦上添花，失败就忽略 */ }
}

// 自动播放策略：AudioContext 需要页面有过一次用户交互才会出声。
// 在首次点击/按键时预热一次，之后后台触发的声音就能正常播放。
function warmupBeepAudio(): void {
	try {
		const AC = window.AudioContext || (window as any).webkitAudioContext;
		if (!AC) return;
		if (beepCtx === null) beepCtx = new AC();
		if (beepCtx.state === "suspended") {
			try { beepCtx.resume(); } catch (e) { /* ignore */ }
		}
	} catch (e) { /* ignore */ }
}

function requestNotifyPermission(): void {
	if (typeof Notification === "undefined") return;
	if (Notification.permission === "default") {
		try {
			Notification.requestPermission();
		} catch (e) { /* ignore */ }
	}
}

// ---------- 设置页 ----------

function Page(scope: any, requestNotifyPermission: () => void, t: any, locale: any) {
	return React.createElement(function NotificationsSettingsPage(_props: unknown) {
		const force = React.useReducer((c: number) => c + 1, 0)[1];
		React.useEffect(() => {
			return scope.subscribe(force);
		}, []);
		React.useEffect(() => {
			if (locale) return locale.subscribe(force);
		}, []);

		const snap = scope.getSnapshot();
		const value = snap.value || {};
		const tr = (key: string, fallback: string) => { return t ? t(key) : fallback; };

		const rows = [
			["enabled"],
			["approval"],
			["turnComplete"],
			["error"],
			["browserNotify"],
			["nativeToast"],
			["tabFlash"],
			["faviconBadge"],
			["sound"],
		];

		const rowStyle: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			gap: "8px",
			minHeight: "28px",
			fontSize: "13px",
			cursor: "pointer",
		};
		const containerStyle: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: "6px",
			padding: "2px 0",
		};
		const hintStyle: React.CSSProperties = {
			color: "var(--dsw-alias-label-secondary, #8b8b8b)",
			fontSize: "12px",
			lineHeight: "18px",
			margin: "8px 0 0",
		};

		const els: React.ReactElement[] = [
			React.createElement("p", {
				key: "intro",
				style: {
					color: "var(--dsw-alias-label-secondary, #8b8b8b)",
					fontSize: "13px",
					lineHeight: "20px",
					margin: "0 0 8px",
				},
			}, tr("intro", zhDict.intro)),
		];

		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const field = r[0];
			const label = tr(field, zhDict[field] || field);
			const checked = !!value[field];
			const onChange = ((f: string, cur: boolean) => {
				return () => {
					if (f === "browserNotify" && !cur) {
						scope.set(f, true);
						requestNotifyPermission();
						return;
					}
					scope.set(f, !cur);
				};
			})(field, checked);
			els.push(
				React.createElement("label", { key: field, style: rowStyle },
					React.createElement("input", { type: "checkbox", checked: checked, onChange: onChange }),
					React.createElement("span", null, label)
				)
			);
		}

		els.push(
			React.createElement("label", { key: "cooldown", style: rowStyle },
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
						fontSize: "13px",
					},
					value: value.cooldownSec == null ? 30 : value.cooldownSec,
					onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
						scope.set("cooldownSec", Number(e.target.value) || 0);
					},
				})
			)
		);

		els.push(
			React.createElement("p", { key: "hint", style: hintStyle },
				tr("hint", zhDict.hint)
			)
		);

		return React.createElement("div", { style: containerStyle }, els);
	}, null);
}

// ---------- 主逻辑 ----------

export function apply(ctx: Context): void {
	const sessions: any = ctx.get("sessions");
	const slots: any = ctx.get("slots");
	const settingsScope: any = ctx.get("settingsScope");
	if (!sessions || !settingsScope) return;

	// 本地化：注册字典 + bind 翻译函数（外壳会在语言切换时重读 label）
	const locale: any = ctx.get("locale");
	let t: any = undefined;
	if (locale) {
		ctx.effect(() => {
			return locale.register(LOCALE_NS, { zh: zhDict, en: enDict });
		}, "client-ui-notifications: locale");
		t = locale.bind(LOCALE_NS);
	}
	const tr = (key: string, fallback: string) => { return t ? t(key) : fallback; };

	const scope = settingsScope.bind({ namespace: NS });

	const seen = new Map<string, any>(); // sessionId -> { running, pendingKinds, error }
	const notifiedAt = new Map<string, number>(); // kind -> last fire timestamp
	const disposers: Array<() => void> = [];
	const watched = new Set<string>();

	function cfg(): any {
		const v = scope.getSnapshot().value;
		return v || {};
	}

	function cooldownOk(kind: string): boolean {
		const c = cfg();
		const cooldownMs = (c.cooldownSec == null ? 30 : c.cooldownSec) * 1000;
		const now = Date.now();
		const last = notifiedAt.get(kind);
		if (last !== undefined && now - last < cooldownMs) return false;
		notifiedAt.set(kind, now);
		return true;
	}

	function sessionTitle(id: string): string {
		try {
			const list = sessions.list.getSnapshot();
			const row = list && list.byId ? list.byId[id] : undefined;
			return row && row.displayTitle ? row.displayTitle : id;
		} catch (e) {
			return id;
		}
	}

	function notify(kind: string, title: string, body: string): void {
		const c = cfg();
		if (!c.enabled) return;
		if (!c[kind] && kind !== "approval") return; // approval 开关同时管 question
		if (kind === "approval" && !c.approval) return;
		if (!cooldownOk(kind)) return;

		// 只在“窗口没被聚焦”（后台标签或切到别的窗口）时提醒，避免自己打扰自己。
		const unfocused = typeof document.hasFocus === "function" ? !document.hasFocus() : document.hidden;
		if (!unfocused) return;

		if (c.sound) beep();
		if (c.tabFlash) startTitleFlash(KIND_PREFIX[kind] || "");
		if (c.faviconBadge) setFaviconBadge(true);
		if (c.browserNotify && typeof Notification !== "undefined") {
			if (Notification.permission === "granted") {
				try {
					const n = new Notification(title, { body: body, tag: "dsh-notify-" + kind });
					n.onclick = () => {
						// 点击通知：把 DSH 页面切回前台并聚焦
						try { window.focus(); } catch (e) { /* ignore */ }
						try { n.close(); } catch (e) { /* ignore */ }
					};
				} catch (e) { /* ignore */ }
			}
		}
	}

	function pendingKinds(snap: any): string {
		const out: string[] = [];
		const pend = snap.pending;
		if (pend && pend.length) {
			for (let i = 0; i < pend.length; i++) out.push(pend[i].kind);
		}
		return out.sort().join(",");
	}

	function evaluate(sessionId: string, snap: any): void {
		if (!snap) return;
		const cur = {
			running: !!snap.running,
			pending: pendingKinds(snap),
			error: snap.lastAgentError || null,
		};
		const prev = seen.get(sessionId);
		seen.set(sessionId, cur);
		if (!prev) return; // 首次见到只建立基线，不打扰

		const label = sessionTitle(sessionId);
		const c = cfg();

		if (cur.pending.indexOf("approval") !== -1 && prev.pending.indexOf("approval") === -1) {
			notify("approval", tr("approvalTitle", zhDict.approvalTitle), fmt(tr("approvalBody", zhDict.approvalBody), { label: label }));
		}
		if (cur.pending.indexOf("question") !== -1 && prev.pending.indexOf("question") === -1) {
			notify("approval", tr("questionTitle", zhDict.questionTitle), fmt(tr("questionBody", zhDict.questionBody), { label: label }));
		}
		if (c.turnComplete && prev.running && !cur.running) {
			notify("turnComplete", tr("completeTitle", zhDict.completeTitle), fmt(tr("completeBody", zhDict.completeBody), { label: label }));
		}
		if (c.error && !prev.error && cur.error) {
			notify("error", tr("errorTitle", zhDict.errorTitle), fmt(tr("errorBody", zhDict.errorBody), { label: label, message: cur.error }));
		}
	}

	function watchSession(id: string): void {
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

	function syncWatchers(): void {
		try {
			const list = sessions.list.getSnapshot();
			const ids = list && list.ids ? list.ids : [];
			for (let i = 0; i < ids.length; i++) watchSession(ids[i]);
		} catch (e) { /* ignore */ }
	}

	function onFocus(): void {
		stopTitleFlash();
		setFaviconBadge(false);
	}

	function onVisibilityChange(): void {
		if (!document.hidden) onFocus();
	}

	// 设置页
	if (slots) {
		const injectDisposer = slots.inject("settings.section", () => {
			const regDisposer = slots.register(
				{
					name: "settings.section",
					id: "notifications",
					order: 60,
					label: () => tr("nav", "通知"),
					locale: LOCALE_NS,
				},
				() => Page(scope, requestNotifyPermission, t, locale)
			);
			disposers.push(regDisposer);
		});
		disposers.push(injectDisposer);
	}

	// 会话状态监听
	disposers.push(sessions.list.subscribe(syncWatchers));
	syncWatchers();
	document.addEventListener("focus", onFocus);
	window.addEventListener("focus", onFocus);
	document.addEventListener("visibilitychange", onVisibilityChange);
	document.addEventListener("pointerdown", warmupBeepAudio);
	document.addEventListener("keydown", warmupBeepAudio);

	// 打开页面即请求浏览器通知权限（仅对“尚未决定”的状态弹一次，允许后不再弹）
	if (typeof Notification !== "undefined" && Notification.permission === "default") {
		setTimeout(() => {
			requestNotifyPermission();
		}, 600);
	}

	ctx.effect(() => {
		return () => {
			for (let i = 0; i < disposers.length; i++) {
				try { disposers[i](); } catch (e) { /* ignore */ }
			}
			document.removeEventListener("focus", onFocus);
			window.removeEventListener("focus", onFocus);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			document.removeEventListener("pointerdown", warmupBeepAudio);
			document.removeEventListener("keydown", warmupBeepAudio);
			stopTitleFlash();
			setFaviconBadge(false);
			if (beepCtx !== null) {
				try { beepCtx.close(); } catch (e) { /* ignore */ }
				beepCtx = null;
			}
		};
	}, "client-ui-notifications");
}
