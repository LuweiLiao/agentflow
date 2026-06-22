// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/openai/openaiShared.ts
function updateOpenAIUsage(current, delta) {
  return {
    input_tokens: delta.input_tokens ?? current.input_tokens,
    output_tokens: delta.output_tokens ?? current.output_tokens,
    cache_creation_input_tokens: delta.cache_creation_input_tokens !== undefined && delta.cache_creation_input_tokens > 0 ? delta.cache_creation_input_tokens : current.cache_creation_input_tokens,
    cache_read_input_tokens: delta.cache_read_input_tokens !== undefined && delta.cache_read_input_tokens > 0 ? delta.cache_read_input_tokens : current.cache_read_input_tokens
  };
}
var init_openaiShared = () => {};

export { updateOpenAIUsage, init_openaiShared };

//# debugId=466942ADBAF8460D64756E2164756E21
//# sourceMappingURL=chunk-k9tx7522.js.map
