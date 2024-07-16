import { UIElementButtonBase } from "@vertix.gg/gui/src/bases/element-types/ui-element-button-base";

import { UIInstancesTypes } from "@vertix.gg/gui/src/bases/ui-definitions";

import type { UIButtonStyleTypes } from "@vertix.gg/gui/src/bases/ui-definitions";

export class YesButton extends UIElementButtonBase {
    public static getName() {
        return "Vertix/UI-V3/YesButton";
    }

    public static getInstanceType() {
        return UIInstancesTypes.Dynamic; // TODO: Should be static.
    }

    protected async getLabel() {
        return "👍 Yes";
    }

    protected async getStyle(): Promise<UIButtonStyleTypes> {
        return "primary";
    }
}
