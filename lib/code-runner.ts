let pyodideInstance: any = null;

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
  document.head.appendChild(script);
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
  });
  pyodideInstance = await (globalThis as any).loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
  });
  return pyodideInstance;
}

function wrapPython(code: string) {
  return `
import sys, io as _io
_stdout = _io.StringIO()
_stderr = _io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
try:
${code.split("\n").map((l) => "  " + l).join("\n")}
except BaseException as _e:
  import traceback as _tb
  print(_tb.format_exc(), file=sys.stderr)
finally:
  sys.stdout = sys.__stdout__
  sys.stderr = sys.__stderr__
_stdout.getvalue() + ("STDERR:" + _stderr.getvalue() if _stderr.tell() else "")
`;
}

async function runPython(code: string): Promise<{ output: string; error?: string }> {
  const py = await loadPyodide();
  await py.loadPackagesFromImports(code);
  const result = py.runPython(wrapPython(code));
  const parts = result.split("STDERR:");
  const output = parts[0].trim();
  const error = parts[1]?.trim();
  return error ? { output, error } : { output };
}

function runJavaScript(code: string): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const worker = new Worker(
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
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.postMessage(code);
  });
}

async function runRust(code: string): Promise<{ output: string; error?: string }> {
  const res = await fetch("https://play.rust-lang.org/evaluate.json", {
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
  const data = await res.json();
  return {
    output: (data.stdout || "").trim(),
    error: data.stderr || undefined,
    // ponytail: success field from playground API
    ...(data.success === false && data.stderr ? { error: data.stderr } : {}),
  };
}

export function runCode(
  language: string,
  code: string,
): Promise<{ output: string; error?: string }> {
  switch (language.toLowerCase()) {
    case "python":
      return runPython(code);
    case "javascript":
      return runJavaScript(code);
    case "rust":
      return runRust(code);
    default:
      return Promise.resolve({ output: "", error: `Unsupported language: ${language}` });
  }
}
