// Build: src/ → lib/ for a DSH client-module package.
//  - Host half  (src/index.ts)        → lib/index.js  (ESM; deps resolve from node_modules at load time)
//  - Client half(src/client/index.ts) → lib/client.js (CJS bundle wrapped in the __ModuleLoader__ factory format)
import { build } from "esbuild";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const PKG_ID = "@dsh-external/dsh-client-ui-notifications";

/** Wrap an esbuild CJS bundle into the DSH client-module loader format. */
function wrapClientBundle(js) {
	const indent = js
		.split("\n")
		.map((line) => (line ? "\t\t" + line : line))
		.join("\n");
	return [
		"window.__ModuleLoader__.load({",
		"\tid: " + JSON.stringify(PKG_ID) + ",",
		"\tfactory: (require) => {",
		"\t\tvar module = { exports: {} };",
		"\t\tvar exports = module.exports;",
		'\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
		indent,
		"\t\treturn module.exports;",
		"\t}",
		"});",
		"",
	].join("\n");
}

// ---- client half ----
const clientTmp = path.join(root, "lib", ".client.bundle.js");
await build({
	entryPoints: [path.join(root, "src/client/index.ts")],
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2020",
	// 运行期由 client loader 的 seed / graph 提供，不打进 bundle
	external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "@deepseek-ai/*"],
	outfile: clientTmp,
});
const bundled = readFileSync(clientTmp, "utf8");
writeFileSync(path.join(root, "lib/client.js"), wrapClientBundle(bundled));
rmSync(clientTmp);

// ---- host half ----
await build({
	entryPoints: [path.join(root, "src/index.ts")],
	bundle: false,
	format: "esm",
	platform: "node",
	target: "es2020",
	outfile: path.join(root, "lib/index.js"),
});

console.log("build ok: lib/index.js + lib/client.js");
