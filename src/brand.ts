import "./splash.js";

import type { TBrand } from "scenerystack/brand";
import { brand, madeWithSceneryStackOnDark, madeWithSceneryStackOnLight } from "scenerystack/brand";

const Brand: TBrand = {
  id: "made-with-scenerystack",
  name: null,
  copyright: null,
  getLinks: () => [],
  logoOnBlackBackground: madeWithSceneryStackOnDark,
  logoOnWhiteBackground: madeWithSceneryStackOnLight,
};

brand.register("Brand", Brand);
