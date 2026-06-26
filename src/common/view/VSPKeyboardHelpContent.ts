import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TextKeyNode,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export type VSPKeyboardHelpScreen = "registration" | "blink" | "photometry" | "analyzer";

const createLeftSections = (screen: VSPKeyboardHelpScreen) => {
  switch (screen) {
    case "registration":
    case "photometry":
      return [new MoveDraggableItemsKeyboardHelpSection()];
    case "blink":
      return [new TimeControlsKeyboardHelpSection()];
    case "analyzer":
      return [new SliderControlsKeyboardHelpSection()];
  }
};

const createRightSections = (screen: VSPKeyboardHelpScreen) => {
  switch (screen) {
    case "photometry":
      return [new SliderControlsKeyboardHelpSection()];
    case "registration": {
      const registrationStrings = StringManager.getInstance().getRegistrationViewStrings();
      const registrationActionsSection = new KeyboardHelpSection(registrationStrings.starfieldControlsStringProperty, [
        KeyboardHelpSectionRow.labelWithIcon(registrationStrings.switchOnTopStringProperty, new TextKeyNode("J"), {
          labelInnerContent: registrationStrings.switchOnTopStringProperty,
        }),
      ]);
      return [registrationActionsSection, new BasicActionsKeyboardHelpSection()];
    }
    case "blink":
    case "analyzer":
      return [new BasicActionsKeyboardHelpSection()];
  }
};

export class VSPKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(screen: VSPKeyboardHelpScreen) {
    super(createLeftSections(screen), createRightSections(screen));
  }
}
