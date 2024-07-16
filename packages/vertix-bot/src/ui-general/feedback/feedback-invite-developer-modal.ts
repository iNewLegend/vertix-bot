import { UIModalBase } from "@vertix.gg/gui/src/bases/ui-modal-base";
import { UIInstancesTypes } from "@vertix.gg/gui/src/bases/ui-definitions";

import { FeedbackInputUrl } from "@vertix.gg/bot/src/ui-general/feedback/modal-elements/feedback-input-url";

export class FeedbackInviteDeveloperModal extends UIModalBase {
    public static getName() {
        return "VertixBot/UI-General/FeedbackInviteDeveloperModal";
    }

    public static getInstanceType() {
        return UIInstancesTypes.Static;
    }

    protected getTitle() {
        return "Invite Developer";
    }

    public static getInputElements() {
        return [
            [ FeedbackInputUrl ],
        ];
    }
}
