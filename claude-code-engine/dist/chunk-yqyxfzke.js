// @bun
import {
  createAssistantMessage,
  init_messages1 as init_messages,
  init_plans
} from "./chunk-xzgt0njb.js";
import {
  init_constants1 as init_constants
} from "./chunk-kvjvqgcx.js";
import {
  init_strip_ansi,
  stripAnsi
} from "./chunk-49x6szsr.js";
import {
  init_xml
} from "./chunk-kc49dhz0.js";
import {
  getSessionId,
  init_state
} from "./chunk-232p95fy.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/messages/mappers.ts
import { randomUUID } from "crypto";
function toInternalMessages(messages) {
  return messages.flatMap((message) => {
    switch (message.type) {
      case "assistant":
        return [
          {
            type: "assistant",
            message: message.message,
            uuid: message.uuid,
            requestId: undefined,
            timestamp: new Date().toISOString()
          }
        ];
      case "user":
        return [
          {
            type: "user",
            message: message.message,
            uuid: message.uuid ?? randomUUID(),
            timestamp: message.timestamp ?? new Date().toISOString(),
            isMeta: message.isSynthetic
          }
        ];
        if (message.subtype === "compact_boundary") {
          const compactMsg = message;
          return [
            {
              type: "system",
              content: "Conversation compacted",
              level: "info",
              subtype: "compact_boundary",
              compactMetadata: fromSDKCompactMetadata(compactMsg.compact_metadata),
              uuid: message.uuid,
              timestamp: new Date().toISOString()
            }
          ];
        }
        return [];
      default:
        return [];
    }
  });
}
function toSDKCompactMetadata(meta) {
  const seg = meta.preservedSegment;
  return {
    trigger: meta.trigger,
    pre_tokens: meta.preTokens,
    ...seg && {
      preserved_segment: {
        head_uuid: seg.headUuid,
        anchor_uuid: seg.anchorUuid,
        tail_uuid: seg.tailUuid
      }
    }
  };
}
function fromSDKCompactMetadata(meta) {
  const m = meta;
  const seg = m.preserved_segment;
  return {
    trigger: m.trigger,
    preTokens: m.pre_tokens,
    ...seg && {
      preservedSegment: {
        headUuid: seg.head_uuid,
        anchorUuid: seg.anchor_uuid,
        tailUuid: seg.tail_uuid
      }
    }
  };
}
function localCommandOutputToSDKAssistantMessage(rawContent, uuid) {
  const cleanContent = stripAnsi(rawContent).replace(/<local-command-stdout>([\s\S]*?)<\/local-command-stdout>/, "$1").replace(/<local-command-stderr>([\s\S]*?)<\/local-command-stderr>/, "$1").trim();
  const synthetic = createAssistantMessage({ content: cleanContent });
  return {
    type: "assistant",
    content: synthetic.message?.content,
    message: synthetic.message,
    parent_tool_use_id: null,
    session_id: getSessionId(),
    uuid
  };
}
function toSDKRateLimitInfo(limits) {
  if (!limits) {
    return;
  }
  return {
    type: "rate_limit",
    status: limits.status,
    ...limits.resetsAt !== undefined && { resetsAt: limits.resetsAt },
    ...limits.rateLimitType !== undefined && {
      rateLimitType: limits.rateLimitType
    },
    ...limits.utilization !== undefined && {
      utilization: limits.utilization
    },
    ...limits.overageStatus !== undefined && {
      overageStatus: limits.overageStatus
    },
    ...limits.overageResetsAt !== undefined && {
      overageResetsAt: limits.overageResetsAt
    },
    ...limits.overageDisabledReason !== undefined && {
      overageDisabledReason: limits.overageDisabledReason
    },
    ...limits.isUsingOverage !== undefined && {
      isUsingOverage: limits.isUsingOverage
    },
    ...limits.surpassedThreshold !== undefined && {
      surpassedThreshold: limits.surpassedThreshold
    }
  };
}
var init_mappers = __esm(() => {
  init_state();
  init_xml();
  init_constants();
  init_strip_ansi();
  init_messages();
  init_plans();
});

export { toInternalMessages, toSDKCompactMetadata, localCommandOutputToSDKAssistantMessage, toSDKRateLimitInfo, init_mappers };

//# debugId=02998D712FB8CC5864756E2164756E21
//# sourceMappingURL=chunk-yqyxfzke.js.map
