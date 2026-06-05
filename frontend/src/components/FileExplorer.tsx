import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/atom-one-dark.css";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useState } from "react";

hljs.registerLanguage("python", python);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);

interface Props {
  files: Record<string, string>;
}

const EXT_LANG: Record<string, string> = {
  py: "python",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  html: "html",
  xml: "xml",
  css: "css",
  sh: "bash",
  bash: "bash",
};

function getLang(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] ?? "plaintext";
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

async function downloadZip(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "generated-project.zip");
}

export default function FileExplorer({ files }: Props) {
  const filenames = Object.keys(files);
  const [selected, setSelected] = useState<string | null>(null);

  // Auto-select first file when files arrive
  useEffect(() => {
    if (filenames.length > 0 && (selected === null || !files[selected])) {
      setSelected(filenames[0]);
    }
  }, [filenames.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const content = selected ? (files[selected] ?? "") : "";
  const lang = selected ? getLang(selected) : "plaintext";

  const highlighted = useMemo(() => {
    if (!content) return "";
    try {
      return hljs.highlight(content, { language: lang }).value;
    } catch {
      return hljs.highlightAuto(content).value;
    }
  }, [content, lang]);

  return (
    <div className="w-1/2 flex flex-col min-h-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex-none flex items-center border-b border-gray-800 min-h-[36px]">
        <div className="flex flex-1 overflow-x-auto">
          {filenames.length === 0 ? (
            <span className="px-4 py-2 text-[10px] text-gray-700 tracking-widest">
              ● FILES
            </span>
          ) : (
            filenames.map((f) => (
              <button
                key={f}
                onClick={() => setSelected(f)}
                title={f}
                className={`px-3 py-2 text-[11px] whitespace-nowrap border-r border-gray-800 transition-colors ${
                  selected === f
                    ? "text-[#00ffff] bg-gray-950 border-b border-b-[#00ffff]"
                    : "text-gray-600 hover:text-gray-400 hover:bg-gray-950/50"
                }`}
              >
                {basename(f)}
              </button>
            ))
          )}
        </div>

        {filenames.length > 0 && (
          <button
            onClick={() => downloadZip(files)}
            className="flex-none px-4 py-2 text-[11px] text-[#00ff88] hover:text-green-300
                       border-l border-gray-800 tracking-wider transition-colors whitespace-nowrap"
          >
            ↓ Download All
          </button>
        )}
      </div>

      {/* File path breadcrumb */}
      {selected && (
        <div className="flex-none px-4 py-1 text-[10px] text-gray-700 border-b border-gray-800 tracking-wider">
          {selected}
        </div>
      )}

      {/* Code view */}
      <div className="flex-1 overflow-auto min-h-0 bg-[#0d0d0d]">
        {content ? (
          <pre className="p-4 text-[11px] leading-relaxed m-0">
            <code
              className={`language-${lang} hljs`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        ) : (
          <div className="p-4 text-gray-700 text-xs">
            {filenames.length === 0
              ? "Generated files will appear here after the pipeline runs."
              : "Select a file from the tabs above."}
          </div>
        )}
      </div>
    </div>
  );
}
