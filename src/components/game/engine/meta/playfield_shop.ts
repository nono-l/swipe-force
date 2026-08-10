// @ts-nocheck
/** Playfield sizes, shop catalog, upgrade defaults, storage keys. */
import { jsx, jsxs } from "react/jsx-runtime";
const t = () => ({ jsx, jsxs });

export var jsxRuntime = t(),
    PLAY_W = 320,
    PLAY_H = 400,
    RAIL_W = 48,
    LEFT_RAIL = RAIL_W,
    FIELD_RIGHT = 272,
    FIELD_INNER_W = 224,
    SHOP_ITEMS = [{
        id: `shot`,
        name: `SHOT`,
        desc: `弾が広がる`,
        baseCost: 120,
        max: 3,
        tier: 1
    }, {
        id: `rate`,
        name: `RATE`,
        desc: `連射速度UP`,
        baseCost: 140,
        max: 3,
        tier: 1
    }, {
        id: `speed`,
        name: `SPEED`,
        desc: `機体が速くなる`,
        baseCost: 180,
        max: 3,
        tier: 1
    }, {
        id: `power`,
        name: `POWER`,
        desc: `弾の威力UP`,
        baseCost: 200,
        max: 3,
        tier: 1
    }, {
        id: `option`,
        name: `OPTION`,
        desc: `補助ユニット`,
        baseCost: 250,
        max: 2,
        tier: 1
    }, {
        id: `life`,
        name: `1UP`,
        desc: `残機+1`,
        baseCost: 400,
        max: 5,
        tier: 1,
        consumable: !0
    }, {
        id: `shield`,
        name: `SHIELD`,
        desc: `一時バリア`,
        baseCost: 300,
        max: 1,
        tier: 1,
        consumable: !0
    }, {
        id: `lockon`,
        name: `LOCK-ON`,
        desc: `ロックオンレーザー`,
        baseCost: 500,
        max: 3,
        tier: 2
    }, {
        id: `missile`,
        name: `MISSILE`,
        desc: `誘導ミサイル`,
        baseCost: 550,
        max: 3,
        tier: 2
    }, {
        id: `particle`,
        name: `PARTICLE`,
        desc: `荷電粒子砲`,
        baseCost: 600,
        max: 3,
        tier: 2
    }, {
        id: `hyper`,
        name: `HYPER`,
        desc: `ロック強化`,
        baseCost: 900,
        max: 2,
        tier: 3
    }, {
        id: `cluster`,
        name: `CLUSTER`,
        desc: `ミサイル強化`,
        baseCost: 900,
        max: 2,
        tier: 3
    }, {
        id: `overdrive`,
        name: `OVERDRIVE`,
        desc: `粒子砲強化`,
        baseCost: 1e3,
        max: 2,
        tier: 3
    }, {
        id: `beam`,
        name: `OPT-LASER`,
        desc: `オプション長レーザー`,
        baseCost: 1500,
        max: 10,
        tier: 4,
        linkOnly: !0
    }, {
        id: `flame`,
        name: `FLAME`,
        desc: `火炎放射`,
        baseCost: 1600,
        max: 10,
        tier: 4,
        linkOnly: !0
    }],
    DEFAULT_UPGRADES = {
        shot: 0,
        rate: 0,
        speed: 0,
        power: 0,
        option: 0,
        lockon: 0,
        missile: 0,
        particle: 0,
        hyper: 0,
        cluster: 0,
        overdrive: 0,
        beam: 0,
        flame: 0
    },
    LINKED_ITEM_IDS = [`shot`, `rate`, `power`, `lockon`, `missile`, `particle`],
    HI_SCORE_KEY = `swipe_force_hi_v1`,
    SETTINGS_KEY = `swipe_force_opt_v5`,
    EASY_UP_KEY = `swipe_force_easy_up_v1`,
    NAME_CHARSET = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;

