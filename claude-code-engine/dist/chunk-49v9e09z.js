// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/array.ts
function intersperse(as, separator) {
  return as.flatMap((a, i) => i ? [separator(i), a] : [a]);
}
function count(arr, pred) {
  let n = 0;
  for (const x of arr)
    n += +!!pred(x);
  return n;
}
function uniq(xs) {
  return [...new Set(xs)];
}
var init_array = () => {};

export { intersperse, count, uniq, init_array };

//# debugId=89B5CD7E38E6F6AF64756E2164756E21
//# sourceMappingURL=chunk-49v9e09z.js.map
