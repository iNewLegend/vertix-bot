import { UIElementButtonBase } from "@vertix.gg/bot/src/ui-v2/_base/elements/ui-element-button-base";

import { UIInstancesTypes } from "@vertix.gg/bot/src/ui-v2/_base/ui-definitions";

import type { UIButtonStyleTypes } from "@vertix.gg/bot/src/ui-v2/_base/ui-definitions";

export class BadwordsEditButton extends UIElementButtonBase {
    public static getName() {
        return "VertixBot/UI-V2/SetupBadwordsEditButton";
    }

    public static getInstanceType() {
        return UIInstancesTypes.Dynamic;
    }

    protected getLabel(): Promise<string> {
        return Promise.resolve( "Edit Bad Words" );
    }

    protected getStyle(): Promise<UIButtonStyleTypes> {
        return Promise.resolve( "primary" );
    }

    protected async getEmoji(): Promise<string> {
        return "🙅";
    }
}
