// @bun
import {
  getGlobalConfig,
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-fejeqe61.js";
import {
  require_react
} from "./chunk-0k4kr3h5.js";
import"./chunk-4hpfxga2.js";
import"./chunk-bt5n9f4r.js";
import"./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import"./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/buddy/companion.ts
function getCompanion(..._args) {
  return;
}
function rollWithSeed(..._args) {
  return;
}
function generateSeed(..._args) {
  return;
}
var init_companion = () => {};

// src/buddy/types.ts
function RARITY_STARS(..._args) {
  return;
}
var init_types = () => {};

// src/buddy/sprites.ts
function renderSprite(..._args) {
  return;
}
var init_sprites = () => {};

// src/buddy/CompanionCard.ts
function CompanionCard(..._args) {
  return;
}
var init_CompanionCard = () => {};

// src/buddy/companionReact.ts
function triggerCompanionReaction(..._args) {
  return;
}
var init_companionReact = () => {};

// src/commands/buddy/buddy.ts
function speciesLabel(species) {
  return species.charAt(0).toUpperCase() + species.slice(1);
}
async function call(onDone, context, args) {
  const sub = args?.trim().toLowerCase() ?? "";
  const setState = context.setAppState;
  if (sub === "off") {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: true }));
    onDone("companion muted", { display: "system" });
    return null;
  }
  if (sub === "on") {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
    onDone("companion unmuted", { display: "system" });
    return null;
  }
  if (sub === "pet") {
    const companion2 = getCompanion();
    if (!companion2) {
      onDone("no companion yet \xB7 run /buddy first", { display: "system" });
      return null;
    }
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
    setState?.((prev) => ({ ...prev, companionPetAt: Date.now() }));
    triggerCompanionReaction(context.messages ?? [], (reaction) => setState?.((prev) => prev.companionReaction === reaction ? prev : { ...prev, companionReaction: reaction }));
    onDone(`petted ${companion2.name}`, { display: "system" });
    return null;
  }
  const companion = getCompanion();
  if (companion && getGlobalConfig().companionMuted) {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
  }
  if (companion) {
    const lastReaction = context.getAppState?.()?.companionReaction;
    return import_react.default.createElement(CompanionCard, {
      companion,
      lastReaction,
      onDone
    });
  }
  const seed = generateSeed();
  const r = rollWithSeed(seed);
  const name = SPECIES_NAMES[r.bones.species] ?? "Buddy";
  const personality = SPECIES_PERSONALITY[r.bones.species] ?? "Mysterious and code-savvy.";
  const stored = {
    name,
    personality,
    seed,
    hatchedAt: Date.now()
  };
  saveGlobalConfig((cfg) => ({ ...cfg, companion: stored }));
  const stars = RARITY_STARS[r.bones.rarity];
  const sprite = renderSprite(r.bones, 0);
  const shiny = r.bones.shiny ? " \u2728 Shiny!" : "";
  const lines = [
    "A wild companion appeared!",
    "",
    ...sprite,
    "",
    `${name} the ${speciesLabel(r.bones.species)}${shiny}`,
    `Rarity: ${stars} (${r.bones.rarity})`,
    `"${personality}"`,
    "",
    "Your companion will now appear beside your input box!",
    "Say its name to get its take \xB7 /buddy pet \xB7 /buddy off"
  ];
  onDone(lines.join(`
`), { display: "system" });
  return null;
}
var import_react, SPECIES_NAMES, SPECIES_PERSONALITY;
var init_buddy = __esm(() => {
  init_companion();
  init_types();
  init_sprites();
  init_CompanionCard();
  init_config();
  init_companionReact();
  import_react = __toESM(require_react(), 1);
  SPECIES_NAMES = {
    duck: "Waddles",
    goose: "Goosberry",
    blob: "Gooey",
    cat: "Whiskers",
    dragon: "Ember",
    octopus: "Inky",
    owl: "Hoots",
    penguin: "Waddleford",
    turtle: "Shelly",
    snail: "Trailblazer",
    ghost: "Casper",
    axolotl: "Axie",
    capybara: "Chill",
    cactus: "Spike",
    robot: "Byte",
    rabbit: "Flops",
    mushroom: "Spore",
    chonk: "Chonk"
  };
  SPECIES_PERSONALITY = {
    duck: "Quirky and easily amused. Leaves rubber duck debugging tips everywhere.",
    goose: "Assertive and honks at bad code. Takes no prisoners in code reviews.",
    blob: "Adaptable and goes with the flow. Sometimes splits into two when confused.",
    cat: "Independent and judgmental. Watches you type with mild disdain.",
    dragon: "Fiery and passionate about architecture. Hoards good variable names.",
    octopus: "Multitasker extraordinaire. Wraps tentacles around every problem at once.",
    owl: 'Wise but verbose. Always says "let me think about that" for exactly 3 seconds.',
    penguin: "Cool under pressure. Slides gracefully through merge conflicts.",
    turtle: "Patient and thorough. Believes slow and steady wins the deploy.",
    snail: "Methodical and leaves a trail of useful comments. Never rushes.",
    ghost: "Ethereal and appears at the worst possible moments with spooky insights.",
    axolotl: "Regenerative and cheerful. Recovers from any bug with a smile.",
    capybara: "Zen master. Remains calm while everything around is on fire.",
    cactus: "Prickly on the outside but full of good intentions. Thrives on neglect.",
    robot: "Efficient and literal. Processes feedback in binary.",
    rabbit: "Energetic and hops between tasks. Finishes before you start.",
    mushroom: "Quietly insightful. Grows on you over time.",
    chonk: "Big, warm, and takes up the whole couch. Prioritizes comfort over elegance."
  };
});
init_buddy();

export {
  call
};

//# debugId=CF54D199D44AA7F664756E2164756E21
//# sourceMappingURL=chunk-9brw48n7.js.map
