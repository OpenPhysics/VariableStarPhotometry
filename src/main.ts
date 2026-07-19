/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { AnalyzerScreen } from "./analyzer/AnalyzerScreen.js";
import { BlinkComparatorScreen } from "./blink-comparator/BlinkComparatorScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { PhotometryScreen } from "./photometry/PhotometryScreen.js";
import { VariableStarPhotometryPreferencesModel } from "./preferences/VariableStarPhotometryPreferencesModel.js";
import { VariableStarPhotometryPreferencesNode } from "./preferences/VariableStarPhotometryPreferencesNode.js";
import { RegistrationScreen } from "./registration/RegistrationScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const screenNames = stringManager.getScreenNames();

  const preferences = new VariableStarPhotometryPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new RegistrationScreen({
      preferences: preferences,
      name: screenNames.registrationStringProperty,
      tandem: Tandem.ROOT.createTandem("registrationScreen"),
    }),
    new BlinkComparatorScreen({
      preferences: preferences,
      name: screenNames.blinkComparatorStringProperty,
      tandem: Tandem.ROOT.createTandem("blinkComparatorScreen"),
    }),
    new PhotometryScreen({
      preferences: preferences,
      name: screenNames.photometryStringProperty,
      tandem: Tandem.ROOT.createTandem("photometryScreen"),
    }),
    new AnalyzerScreen({
      preferences: preferences,
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
            createContent: (tandem: Tandem) => new VariableStarPhotometryPreferencesNode(preferences, tandem),
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
