/**
 * RegistrationModel.ts
 *
 * Model for the Registration screen.
 *
 * Students align a series of CCD images (taken at different epochs) to a
 * reference image by shifting the "working" image in X/Y. Once all images
 * are registered, the aligned stack is passed to the Blink Comparator screen.
 *
 * TODO: implement star-field generation, image rendering, alignment tracking.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import type { VSPPreferencesModel } from "../../preferences/VSPPreferencesModel.js";
import VSPNamespace from "../../VSPNamespace.js";

export class RegistrationModel {
  /** Horizontal offset (in field pixels) of the working image relative to the reference. */
  public readonly offsetXProperty: NumberProperty;

  /** Vertical offset (in field pixels) of the working image relative to the reference. */
  public readonly offsetYProperty: NumberProperty;

  /** Index of the currently selected working-image epoch (0 = reference). */
  public readonly selectedEpochIndexProperty: NumberProperty;

  /** Whether the overlay grid is visible on the field. */
  public readonly showGridProperty: BooleanProperty;

  public constructor(preferences: VSPPreferencesModel, tandem?: Tandem) {
    this.offsetXProperty = new NumberProperty(0, {
      ...(tandem && { tandem: tandem.createTandem("offsetXProperty") }),
    });

    this.offsetYProperty = new NumberProperty(0, {
      ...(tandem && { tandem: tandem.createTandem("offsetYProperty") }),
    });

    this.selectedEpochIndexProperty = new NumberProperty(1, {
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("selectedEpochIndexProperty") }),
    });

    // Mirror the global preference; local override is allowed per-screen.
    this.showGridProperty = new BooleanProperty(preferences.showGridProperty.value, {
      ...(tandem && { tandem: tandem.createTandem("showGridProperty") }),
    });

    // Keep in sync with the preferences toggle
    preferences.showGridProperty.link((show) => {
      this.showGridProperty.value = show;
    });
  }

  public step(_dt: number): void {
    // No time-dependent state yet
  }

  public reset(): void {
    this.offsetXProperty.reset();
    this.offsetYProperty.reset();
    this.selectedEpochIndexProperty.reset();
  }
}

VSPNamespace.register("RegistrationModel", RegistrationModel);
