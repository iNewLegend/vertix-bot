import { uiUtilsWrapAsTemplate } from "@vertix.gg/gui/src/ui-utils";

import { DynamicChannelButtonBase } from "@vertix.gg/bot/src/ui-v2/dynamic-channel/base/dynamic-channel-button-base";

export class DynamicChannelPermissionsVisibilityButton extends DynamicChannelButtonBase {
    public static getName() {
        return "Vertix/UI-V2/DynamicChannelPermissionsVisibilityButton";
    }

    public getId() {
        return 4;
    }

    public getSortId() {
        return 4;
    }

    public getLabelForEmbed() {
        return "🙈 ∙ **Hidden** / 🐵 ∙ **Shown**";
    }

    public async getLabelForMenu() {
        return "Shown/Hidden";
    }

    public async getLabel(): Promise<string> {
        return uiUtilsWrapAsTemplate( "displayText" );
    }

    public async getEmoji() {
        return this.uiArgs?.isHidden ? "🙈" : "🐵";
    }

    public getEmojiForEmbed() {
        return "(🙈 / 🐵)";
    }

    protected getOptions() {
        return {
            shownText: "Shown",
            hiddenText: "Hidden",
        };
    }

    protected async getLogic() {
        const result: any = {};

        if ( this.uiArgs?.isHidden ) {
            result.displayText = uiUtilsWrapAsTemplate( "shownText" );
        } else {
            result.displayText = uiUtilsWrapAsTemplate( "hiddenText" );
        }

        return result;
    }
}
