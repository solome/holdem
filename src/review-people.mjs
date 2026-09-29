// Stable identities shared across every hand and the friends list.
// Source paths stay readable here; review-avatar-urls.js embeds the images at build time.
// Playing traits are intentionally empty until the friends' descriptions are recorded.
export const REVIEW_PEOPLE = Object.freeze({
  tengteng: Object.freeze({
    id: "tengteng",
    name: "腾腾",
    gender: "male",
    avatar: "src/assets/avatars/tengteng-cartoon.png",
    traits: Object.freeze([]),
  }),
  kelin: Object.freeze({
    id: "kelin",
    name: "克林",
    gender: "male",
    avatar: "src/assets/avatars/kelin-cartoon.png",
    traits: Object.freeze([]),
  }),
  xingxing: Object.freeze({
    id: "xingxing",
    name: "星星",
    gender: "male",
    avatar: "src/assets/avatars/xingxing-cartoon.png",
    traits: Object.freeze([]),
  }),
  juyipeng: Object.freeze({
    id: "juyipeng",
    name: "掬一捧",
    gender: "male",
    avatar: "src/assets/avatars/juyipeng-github.jpg",
    traits: Object.freeze([]),
    avatarSource: Object.freeze({
      type: "github",
      profileUrl: "https://github.com/solome",
      imageUrl: "https://avatars.githubusercontent.com/u/2769724?v=4&s=512",
      sha256: "6dfe5bcba850a58a29a3611a51370ab4ff35ff69416b752f0feff1c203c1827f",
    }),
  }),
  minmin: Object.freeze({
    id: "minmin",
    name: "敏敏",
    gender: "female",
    avatar: "src/assets/avatars/minmin-cartoon.png",
    traits: Object.freeze([]),
  }),
  wangwang: Object.freeze({
    id: "wangwang",
    name: "旺旺",
    gender: "male",
    avatar: "src/assets/avatars/wangwang-cartoon.png",
    traits: Object.freeze([]),
  }),
  jianjian: Object.freeze({
    id: "jianjian",
    name: "尖尖",
    gender: "male",
    avatar: "src/assets/avatars/jianjian-cartoon.png",
    traits: Object.freeze([]),
  }),
});
