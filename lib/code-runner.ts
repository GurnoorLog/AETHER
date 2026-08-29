let pyo: any = null;

async function spinUpPy() {
  if (pyo) return pyo;
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
  document.head.appendChild(script);
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
  });
  pyo = await (globalThis as any).loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
  });
  return pyo;
}

const WRAPPER = `
import ast, sys, io as _io
_stdout = _io.StringIO()
_stderr = _io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
try:
  _tree = ast.parse(_code_str)
  if _tree.body and isinstance(_tree.body[-1], ast.Expr):
    _tree.body[-1] = ast.Expr(
      value=ast.Call(
        func=ast.Name(id='print', ctx=ast.Load()),
        args=[_tree.body[-1].value],
        keywords=[],
      )
    )
  exec(compile(_tree, '<cell>', 'exec'))
except BaseException as _e:
  import traceback as _tb
  _stderr.write(_tb.format_exc())
finally:
  sys.stdout = sys.__stdout__
  sys.stderr = sys.__stderr__
_stdout.getvalue() + ("STDERR:" + _stderr.getvalue() if _stderr.tell() else "")
`;

async function pyRun(code: string): Promise<{ output: string; error?: string }> {
  const inst = await spinUpPy();
  await inst.loadPackagesFromImports(code);
  inst.globals.set("_code_str", code);
  const raw = inst.runPython(WRAPPER);
  const parts = raw.split("STDERR:");
  const out = parts[0].trim();
  const err = parts[1]?.trim();
  if (err) {
    return { output: out, error: err };
  }
  return { output: out };
}

function jsRun(code: string): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const w = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            `self.onmessage = (e) => {
  const logs = [];
  const mockConsole = { log: (...args) => logs.push(args.map(String).join(" ")) };
  try {
    const fn = new Function("console", e.data);
    const result = fn(mockConsole);
    logs.push("=> " + String(result));
    self.postMessage({ output: logs.join("\\n") });
  } catch (err) {
    self.postMessage({ output: logs.join("\\n"), error: err.message });
  }
};`,
          ],
          { type: "application/javascript" },
        ),
      ),
    );
    w.onmessage = (e) => {
      resolve(e.data);
      w.terminate();
    };
    w.postMessage(code);
  });
}

async function rustRun(code: string): Promise<{ output: string; error?: string }> {
  const r = await fetch("https://play.rust-lang.org/evaluate.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: "stable",
      mode: "debug",
      edition: "2021",
      crateType: "bin",
      tests: false,
      code,
    }),
  });
  const j = await r.json();
  const out = (j.stdout || "").trim();
  let err: string | undefined = j.stderr || undefined;
  if (j.success === false && err) err = j.stderr;
  return { output: out, error: err };
}

export function runCode(
  language: string,
  code: string,
): Promise<{ output: string; error?: string }> {
  switch (language.toLowerCase()) {
    case "python":
      return pyRun(code);
    case "javascript":
      return jsRun(code);
    case "rust":
      return rustRun(code);
    default:
      return Promise.resolve({ output: "", error: `Unsupported language: ${language}` });
  }
}
