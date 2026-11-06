import { frameworkExamples } from "./framework-examples.mjs";
import { basicExamples } from "./basic-examples.mjs";
import { playExamples } from "./play-examples.mjs";

import { tagExamples } from "./tag-examples.mjs";

export const examples = { ...basicExamples, ...frameworkExamples, ...playExamples, ...tagExamples };
