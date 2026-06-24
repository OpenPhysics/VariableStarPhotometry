import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";

init({
  name: "variable-star-photometry",
  version: "0.1.0",
  brand: "made-with-scenerystack",
  locale: "en",
  availableLocales: ["en", "es", "fr"],
  splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: true,
  colorProfiles: ["default", "projector"],
  supportsSound: false,
});
