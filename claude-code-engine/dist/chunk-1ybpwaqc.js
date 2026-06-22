// @bun
import {
  Select,
  extractTextContent,
  g,
  init_marked_esm,
  init_messages1 as init_messages,
  init_select,
  stripPromptXMLTags
} from "./chunk-85672e5z.js";
import"./chunk-wttb2t11.js";
import"./chunk-k60b56gr.js";
import"./chunk-14p6wvsq.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-ptxteaeh.js";
import"./chunk-tpnz03nj.js";
import"./chunk-s8p02480.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-vj6qsm24.js";
import"./chunk-r8jcsn3v.js";
import"./chunk-652r6kww.js";
import"./chunk-6gy3q0wy.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-s3d6366c.js";
import"./chunk-ntvq0jr5.js";
import"./chunk-4vjty2rm.js";
import"./chunk-71sdcaq6.js";
import"./chunk-p5eak500.js";
import"./chunk-tdr1vsx1.js";
import"./chunk-jd7jftpn.js";
import"./chunk-c5tjtkca.js";
import"./chunk-13rzr1dm.js";
import"./chunk-24kv69g3.js";
import"./chunk-brn3ak48.js";
import"./chunk-apms8t8n.js";
import"./chunk-4spgkgr3.js";
import"./chunk-r807k1we.js";
import"./chunk-bxyw0w0f.js";
import"./chunk-qnqdg4g2.js";
import"./chunk-60fkafk2.js";
import"./chunk-znh8j5rf.js";
import"./chunk-s3m717e4.js";
import"./chunk-093ej2sf.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-km99syjh.js";
import"./chunk-fb8vcv23.js";
import"./chunk-q1j913pw.js";
import"./chunk-ekewkevz.js";
import"./chunk-aygjk70q.js";
import"./chunk-kc5qzfjq.js";
import"./chunk-zbwxz8qy.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-e0gkkbdv.js";
import"./chunk-hqxp6b72.js";
import"./chunk-87pd0zay.js";
import"./chunk-9wb7xbsz.js";
import"./chunk-w5hnghah.js";
import"./chunk-vjcwx6pg.js";
import"./chunk-bgasjg9s.js";
import"./chunk-s76nvx50.js";
import"./chunk-m3b9aggc.js";
import {
  countCharInString,
  getGlobalConfig,
  init_config1 as init_config,
  init_stringUtils,
  saveGlobalConfig
} from "./chunk-w55zdf7f.js";
import"./chunk-ajbvxecm.js";
import"./chunk-03nkrzmd.js";
import"./chunk-mmae2pva.js";
import"./chunk-epvbnq43.js";
import"./chunk-nk9870yk.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-hvc6rn64.js";
import"./chunk-4dzwj3zm.js";
import"./chunk-xsj5g58g.js";
import"./chunk-vwenx8ke.js";
import"./chunk-gr6n87et.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-7ysfd01z.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-d6c3tr39.js";
import"./chunk-hn4w9pkj.js";
import {
  Byline,
  KeyboardShortcutHint,
  Pane,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  setClipboard,
  stringWidth
} from "./chunk-93gg03n2.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3975w415.js";
import"./chunk-23170t3x.js";
import"./chunk-h3vy1y4t.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-09kej9nc.js";
import"./chunk-c4dyxsat.js";
import"./chunk-jsbc7abp.js";
import"./chunk-m28vg9w4.js";
import"./chunk-01w7y5nh.js";
import"./chunk-rhhvp5gh.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import"./chunk-xqs9r7pg.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/copy/copy.tsx
import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
function extractCodeBlocks(markdown) {
  const tokens = g.lexer(stripPromptXMLTags(markdown));
  const blocks = [];
  for (const token of tokens) {
    if (token.type === "code") {
      const codeToken = token;
      blocks.push({ code: codeToken.text, lang: codeToken.lang });
    }
  }
  return blocks;
}
function collectRecentAssistantTexts(messages) {
  const texts = [];
  for (let i = messages.length - 1;i >= 0 && texts.length < MAX_LOOKBACK; i--) {
    const msg = messages[i];
    if (msg?.type !== "assistant" || msg.isApiErrorMessage)
      continue;
    const content = msg.message.content;
    if (!Array.isArray(content))
      continue;
    const text = extractTextContent(content, `

`);
    if (text)
      texts.push(text);
  }
  return texts;
}
function fileExtension(lang) {
  if (lang) {
    const sanitized = lang.replace(/[^a-zA-Z0-9]/g, "");
    if (sanitized && sanitized !== "plaintext") {
      return `.${sanitized}`;
    }
  }
  return ".txt";
}
async function writeToFile(text, filename) {
  const filePath = join(COPY_DIR, filename);
  await mkdir(COPY_DIR, { recursive: true });
  await writeFile(filePath, text, "utf-8");
  return filePath;
}
async function copyOrWriteToFile(text, filename) {
  const raw = await setClipboard(text);
  if (raw)
    process.stdout.write(raw);
  const lineCount = countCharInString(text, `
`) + 1;
  const charCount = text.length;
  try {
    const filePath = await writeToFile(text, filename);
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)
Also written to ${filePath}`;
  } catch {
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)`;
  }
}
function truncateLine(text, maxLen) {
  const firstLine = text.split(`
`)[0] ?? "";
  if (stringWidth(firstLine) <= maxLen) {
    return firstLine;
  }
  let result = "";
  let width = 0;
  const targetWidth = maxLen - 1;
  for (const char of firstLine) {
    const charWidth = stringWidth(char);
    if (width + charWidth > targetWidth)
      break;
    result += char;
    width += charWidth;
  }
  return result + "\u2026";
}
function CopyPicker({ fullText, codeBlocks, messageAge, onDone }) {
  const focusedRef = import_react.useRef("full");
  const options = [
    {
      label: "Full response",
      value: "full",
      description: `${fullText.length} chars, ${countCharInString(fullText, `
`) + 1} lines`
    },
    ...codeBlocks.map((block, index) => {
      const blockLines = countCharInString(block.code, `
`) + 1;
      return {
        label: truncateLine(block.code, 60),
        value: index,
        description: [block.lang, blockLines > 1 ? `${blockLines} lines` : undefined].filter(Boolean).join(", ") || undefined
      };
    }),
    {
      label: "Always copy full response",
      value: "always",
      description: "Skip this picker in the future (revert via /config)"
    }
  ];
  function getSelectionContent(selected) {
    if (selected === "full" || selected === "always") {
      return { text: fullText, filename: RESPONSE_FILENAME };
    }
    const block = codeBlocks[selected];
    return {
      text: block.code,
      filename: `copy${fileExtension(block.lang)}`,
      blockIndex: selected
    };
  }
  async function handleSelect(selected) {
    const content = getSelectionContent(selected);
    if (selected === "always") {
      if (!getGlobalConfig().copyFullResponse) {
        saveGlobalConfig((c) => ({ ...c, copyFullResponse: true }));
      }
      logEvent("tengu_copy", {
        block_count: codeBlocks.length,
        always: true,
        message_age: messageAge
      });
      const result2 = await copyOrWriteToFile(content.text, content.filename);
      onDone(`${result2}
Preference saved. Use /config to change copyFullResponse`);
      return;
    }
    logEvent("tengu_copy", {
      selected_block: content.blockIndex,
      block_count: codeBlocks.length,
      message_age: messageAge
    });
    const result = await copyOrWriteToFile(content.text, content.filename);
    onDone(result);
  }
  async function handleWrite(selected) {
    const content = getSelectionContent(selected);
    logEvent("tengu_copy", {
      selected_block: content.blockIndex,
      block_count: codeBlocks.length,
      message_age: messageAge,
      write_shortcut: true
    });
    try {
      const filePath = await writeToFile(content.text, content.filename);
      onDone(`Written to ${filePath}`);
    } catch (e) {
      onDone(`Failed to write file: ${e instanceof Error ? e.message : e}`);
    }
  }
  function handleKeyDown(e) {
    if (e.key === "w") {
      e.preventDefault();
      handleWrite(focusedRef.current);
    }
  }
  return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "Select content to copy:"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(Select, {
          options,
          hideIndexes: false,
          onFocus: (value) => {
            focusedRef.current = value;
          },
          onChange: (selected) => {
            handleSelect(selected);
          },
          onCancel: () => {
            onDone("Copy cancelled", { display: "system" });
          }
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: /* @__PURE__ */ jsx_runtime.jsxs(Byline, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
                shortcut: "enter",
                action: "copy"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
                shortcut: "w",
                action: "write to file"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(KeyboardShortcutHint, {
                shortcut: "esc",
                action: "cancel"
              })
            ]
          })
        })
      ]
    })
  });
}
var import_react, jsx_runtime, COPY_DIR, RESPONSE_FILENAME = "response.md", MAX_LOOKBACK = 20, call = async (onDone, context, args) => {
  const texts = collectRecentAssistantTexts(context.messages);
  if (texts.length === 0) {
    onDone("No assistant message to copy");
    return null;
  }
  let age = 0;
  const arg = args?.trim();
  if (arg) {
    const n = Number(arg);
    if (!Number.isInteger(n) || n < 1) {
      onDone(`Usage: /copy [N] where N is 1 (latest), 2, 3, \u2026 Got: ${arg}`);
      return null;
    }
    if (n > texts.length) {
      onDone(`Only ${texts.length} assistant ${texts.length === 1 ? "message" : "messages"} available to copy`);
      return null;
    }
    age = n - 1;
  }
  const text = texts[age];
  const codeBlocks = extractCodeBlocks(text);
  const config = getGlobalConfig();
  if (codeBlocks.length === 0 || config.copyFullResponse) {
    logEvent("tengu_copy", {
      always: config.copyFullResponse,
      block_count: codeBlocks.length,
      message_age: age
    });
    const result = await copyOrWriteToFile(text, RESPONSE_FILENAME);
    onDone(result);
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(CopyPicker, {
    fullText: text,
    codeBlocks,
    messageAge: age,
    onDone
  });
};
var init_copy = __esm(() => {
  init_marked_esm();
  init_select();
  init_src();
  init_src();
  init_analytics();
  init_config();
  init_messages();
  init_stringUtils();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  COPY_DIR = join(tmpdir(), "claude");
});
init_copy();

export {
  fileExtension,
  collectRecentAssistantTexts,
  call
};

//# debugId=C201D41575E18A8F64756E2164756E21
//# sourceMappingURL=chunk-1ybpwaqc.js.map
