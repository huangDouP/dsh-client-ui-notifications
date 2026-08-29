import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import type { Context } from "@deepseek-ai/cordis";

/** Durable settings namespace for the notifications feature. */
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
	cooldownSec: z.number().default(30),
});

export function apply(ctx: Context) {
	const ns = settingsNamespace(NOTIFICATIONS_NAMESPACE);
	let settings: any = undefined;

	ctx.inject(["settings"], (settingsCtx: any) => {
		settings = settingsCtx.settings;
		settingsCtx.settings.register(ns, NotificationsSchema);
	});

	// ---------- 配置读取（每次事件实时读，设置页改动立即生效） ----------
	function cfg(): Record<string, unknown> {
		if (!settings) return {};
		try {
			const value = settings.get(ns) as Record<string, unknown> | undefined;
			return value && typeof value === "object" ? value : {};
		} catch (e) {
			return {};
		}
	}

	// ---------- 冷却 ----------
	const lastFired = new Map<string, number>();
	function cooldownOk(kind: string): boolean {
		const c = cfg();
		const ms = (c.cooldownSec == null ? 30 : (c.cooldownSec as number)) * 1000;
		const now = Date.now();
		const last = lastFired.get(kind);
		if (last !== undefined && now - last < ms) return false;
		lastFired.set(kind, now);
		return true;
	}

	function shouldToast(kind: "approval" | "turnComplete" | "error"): boolean {
		const c = cfg();
		if (c.enabled !== true) return false;
		if (c.nativeToast !== true) return false;
		if (kind === "approval" && c.approval !== true) return false;
		if (kind === "turnComplete" && c.turnComplete !== true) return false;
		if (kind === "error" && c.error !== true) return false;
		return cooldownOk(kind);
	}

	// ---------- BurntToast 可用性探测（缓存，只探测一次） ----------
	let burntProbe: Promise<boolean> | null = null;
	function probeBurnt(): Promise<boolean> {
		if (burntProbe !== null) return burntProbe;
		const shell: any = ctx.get("shell");
		if (!shell) {
			burntProbe = Promise.resolve(false);
			return burntProbe;
		}
		burntProbe = (async () => {
			try {
				const spec = shell.resolve({
					command: "powershell -NoProfile -NonInteractive -Command \"$m=Get-Module -ListAvailable BurntToast; if($m){exit 0}else{exit 9}\"",
					timeoutMs: 10000,
				});
				const result = await shell.run(spec);
				return result.exitCode === 0;
			} catch (e) {
				return false;
			}
		})();
		return burntProbe;
	}

	function psQuote(text: unknown): string {
		return "'" + String(text).replace(/'/g, "''") + "'";
	}

	// WinRT 原生 toast 脚本（Windows PowerShell 5.1 即可运行，零依赖）
	function winrtToastScript(title: string, body: string): string {
		return [
			"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null",
			"[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null",
			"[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null",
			"$t=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)",
			"$x=$t.GetElementsByTagName('text')",
			"$x.Item(0).AppendChild($t.CreateTextNode(" + psQuote(title) + ")) | Out-Null",
			"$x.Item(1).AppendChild($t.CreateTextNode(" + psQuote(body) + ")) | Out-Null",
			"$n=[Windows.UI.Notifications.ToastNotification]::new($t)",
			"[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('DSH').Show($n) | Out-Null",
		].join("; ");
	}

	// UTF-16LE base64（PowerShell -EncodedCommand 专用：与系统代码页无关，中文不乱码）
	function utf16leBase64(text: string): string {
		const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		const bytes: number[] = [];
		for (let i = 0; i < text.length; i++) {
			const code = text.charCodeAt(i);
			bytes.push(code & 0xff, (code >> 8) & 0xff);
		}
		let out = "";
		for (let i = 0; i < bytes.length; i += 3) {
			const b0 = bytes[i];
			const b1 = bytes[i + 1];
			const b2 = bytes[i + 2];
			out += table[b0 >> 2];
			out += table[((b0 & 3) << 4) | (b1 >> 4)];
			if (i + 1 < bytes.length) {
				out += table[((b1 & 15) << 2) | (b2 >> 6)];
				out += i + 2 < bytes.length ? table[b2 & 63] : "=";
			} else {
				out += "==";
			}
		}
		return out;
	}

	async function fireNativeToast(kind: "approval" | "turnComplete" | "error", title: string, body: string): Promise<void> {
		try {
			const shell: any = ctx.get("shell");
			if (!shell) return;
			// 装了 BurntToast 用 BurntToast（更美观），否则退回零依赖的 WinRT 原生 toast
			const hasBurnt = await probeBurnt();
			const script = hasBurnt
				? "New-BurntToastNotification -Text " + psQuote(title) + "," + psQuote(body) + " -UniqueIdentifier dsh-notify-" + kind + " | Out-Null"
				: winrtToastScript(title, body);
			// -EncodedCommand（UTF-16LE base64）：中文与引号都安全
			const spec = shell.resolve({
				command: "powershell -NoProfile -NonInteractive -EncodedCommand " + utf16leBase64(script),
				timeoutMs: 15000,
			});
			await shell.run(spec);
		} catch (e) {
			/* toast 尽力而为，失败静默 */
		}
	}

	// ---------- 事件监听 ----------

	// 等待批准（waterfall：只旁路提醒，绝不消费决定，必须 return next()）
	ctx.on("approval/request", (req: any, next: () => Promise<string>) => {
		try {
			if (shouldToast("approval")) {
				const tool = req && typeof req.toolName === "string" ? req.toolName : "操作";
				const reason = req && typeof req.reason === "string" && req.reason ? "：" + req.reason : "";
				fireNativeToast("approval", "⚠ DSH 需要你批准", "「" + tool + "」正在等待你允许" + reason);
			}
		} catch (e) { /* ignore */ }
		return next();
	});

	// 回合完成：running → idle
	const agentStatus = new Map<string | null, string>();
	ctx.on("agent/status", (payload: any) => {
		try {
			const agent = payload && payload.agent;
			const status = payload && payload.status;
			if (!agent || typeof status !== "string") return;
			const id = typeof agent.sessionId === "string" ? agent.sessionId : null;
			const prev = agentStatus.get(id);
			agentStatus.set(id, status);
			if (prev === "running" && status === "idle" && shouldToast("turnComplete")) {
				fireNativeToast("turnComplete", "✅ DSH 回合完成", "已完成，等待你的下一步" + (id ? "（" + id + "）" : ""));
			}
		} catch (e) { /* ignore */ }
	});

	// 出错
	ctx.on("agent/error", (payload: any) => {
		try {
			if (!shouldToast("error")) return;
			const err = payload && payload.error;
			const msg = err && typeof err.message === "string" ? err.message : "回合出错";
			fireNativeToast("error", "⚠ DSH 出错了", msg);
		} catch (e) { /* ignore */ }
	});
}
