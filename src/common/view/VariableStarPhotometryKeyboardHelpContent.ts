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

export type VariableStarPhotometryKeyboardHelpScreen = "registration" | "blink" | "photometry" | "analyzer";

const createLeftSections = (screen: VariableStarPhotometryKeyboardHelpScreen) => {
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

const createRightSections = (screen: VariableStarPhotometryKeyboardHelpScreen) => {
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

export class VariableStarPhotometryKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(screen: VariableStarPhotometryKeyboardHelpScreen) {
    super(createLeftSections(screen), createRightSections(screen));
  }
}
