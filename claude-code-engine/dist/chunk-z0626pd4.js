// @bun
import {
  require_lib
} from "./chunk-fkjcetzx.js";
import"./chunk-1zbwhcbt.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// packages/image-processor-napi/src/index.ts
import { readFileSync, unlinkSync } from "fs";
function createDarwinNativeModule() {
  return {
    hasClipboardImage() {
      try {
        const result = Bun.spawnSync({
          cmd: [
            "osascript",
            "-e",
            `try
the clipboard as \xABclass PNGf\xBB
return "yes"
on error
return "no"
end try`
          ],
          stdout: "pipe",
          stderr: "pipe"
        });
        const output = result.stdout.toString().trim();
        return output === "yes";
      } catch {
        return false;
      }
    },
    readClipboardImage(maxWidth, maxHeight) {
      try {
        const tmpPath = `/tmp/claude_clipboard_native_${Date.now()}.png`;
        const script = `
set png_data to (the clipboard as \xABclass PNGf\xBB)
set fp to open for access POSIX file "${tmpPath}" with write permission
write png_data to fp
close access fp
return "${tmpPath}"
`;
        const result = Bun.spawnSync({
          cmd: ["osascript", "-e", script],
          stdout: "pipe",
          stderr: "pipe"
        });
        if (result.exitCode !== 0) {
          return null;
        }
        const file = Bun.file(tmpPath);
        const buffer = readFileSync(tmpPath);
        try {
          unlinkSync(tmpPath);
        } catch {}
        if (buffer.length === 0) {
          return null;
        }
        let width = 0;
        let height = 0;
        if (buffer.length > 24 && buffer[12] === 73 && buffer[13] === 72 && buffer[14] === 68 && buffer[15] === 82) {
          width = buffer.readUInt32BE(16);
          height = buffer.readUInt32BE(20);
        }
        const originalWidth = width;
        const originalHeight = height;
        if (maxWidth && maxHeight) {
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
        }
        return {
          png: buffer,
          width,
          height,
          originalWidth,
          originalHeight
        };
      } catch {
        return null;
      }
    }
  };
}
function getNativeModule() {
  if (process.platform === "darwin") {
    return createDarwinNativeModule();
  }
  return null;
}
var import_sharp, sharp, src_default;
var init_src = __esm(() => {
  import_sharp = __toESM(require_lib(), 1);
  sharp = import_sharp.default;
  src_default = sharp;
});
init_src();

export {
  sharp,
  getNativeModule,
  src_default as default
};

//# debugId=4DE8E82EA9EF8B6164756E2164756E21
//# sourceMappingURL=chunk-z0626pd4.js.map
