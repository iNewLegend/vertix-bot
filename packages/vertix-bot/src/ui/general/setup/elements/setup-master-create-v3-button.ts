import { UIElementButtonBase } from "@vertix.gg/gui/src/bases/element-types/ui-element-button-base";

import { UIInstancesTypes } from "@vertix.gg/gui/src/bases/ui-definitions";

import type { UIButtonStyleTypes } from "@vertix.gg/gui/src/bases/ui-definitions";

export class SetupMasterCreateV3Button extends UIElementButtonBase {
    public static getName() {
        return "VertixBot/UI-General/SetupMasterCreateV3Button";
    }

    public static getInstanceType() {
        return UIInstancesTypes.Dynamic;
    }

    protected getLabel(): Promise<string> {
        return Promise.resolve( "Create Master Channel (V3)" );
    }

    protected getStyle(): Promise<UIButtonStyleTypes> {
        return Promise.resolve( "secondary" );
    }

    protected async getEmoji(): Promise<string> {
        return "➕";
    }
}
