import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";

export class VSPKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super([], [new BasicActionsKeyboardHelpSection()]);
  }
}
