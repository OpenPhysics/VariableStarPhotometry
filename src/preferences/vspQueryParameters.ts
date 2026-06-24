import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import VSPNamespace from "../VSPNamespace.js";

const vspQueryParameters = QueryStringMachine.getAll({
  /** Start with grid lines visible. */
  showGrid: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Display CCD images inverted (dark stars on light background). */
  invertImages: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

VSPNamespace.register("vspQueryParameters", vspQueryParameters);

logGlobal("phet.chipper.queryParameters");

export default vspQueryParameters;
