/**
 * main.ts
 *
 * Entry point for Variable Star Photometry.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. It triggers the full bootstrap chain:
 *
 *   brand.ts → splash.ts → assert.ts → init.ts
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first — triggers: init.ts → assert.ts → splash.ts → brand.ts
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { AnalyzerScreen } from "./analyzer/AnalyzerScreen.js";
import { BlinkComparatorScreen } from "./blink-comparator/BlinkComparatorScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { PhotometryScreen } from "./photometry/PhotometryScreen.js";
import { VSPPreferencesModel } from "./preferences/VSPPreferencesModel.js";
import { VSPPreferencesNode } from "./preferences/VSPPreferencesNode.js";
import { RegistrationScreen } from "./registration/RegistrationScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const screenNames = stringManager.getScreenNames();

  const vspPreferences = new VSPPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new RegistrationScreen({
      preferences: vspPreferences,
      name: screenNames.registrationStringProperty,
      tandem: Tandem.ROOT.createTandem("registrationScreen"),
    }),
    new BlinkComparatorScreen({
      name: screenNames.blinkComparatorStringProperty,
      tandem: Tandem.ROOT.createTandem("blinkComparatorScreen"),
    }),
    new PhotometryScreen({
      name: screenNames.photometryStringProperty,
      tandem: Tandem.ROOT.createTandem("photometryScreen"),
    }),
    new AnalyzerScreen({
      name: screenNames.analyzerStringProperty,
      tandem: Tandem.ROOT.createTandem("analyzerScreen"),
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new VSPPreferencesNode(vspPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        supportsDynamicLocale: true,
      },
    }),

    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "Based on the NAAP Variable Star Photometry Lab by the University of Nebraska–Lincoln",
      qualityAssurance: "",
    },
  });

  sim.start();
});
