import { ServiceLocator } from "@vertix.gg/base/src/modules/service/service-locator";

import { UIModuleBase } from "@vertix.gg/gui/src/bases/ui-module-base";
import { UICustomIdHashStrategy } from "@vertix.gg/gui/src/ui-custom-id-strategies/ui-custom-id-hash-strategy";

import { DynamicChannelPrimaryMessageElementsGroup } from "@vertix.gg/bot/src/ui/v3/dynamic-channel/primary-message/dynamic-channel-primary-message-elements-group";

import * as adapters from "@vertix.gg/bot/src/ui/v3/ui-adapters-index";

import { DynamicChannelClaimManager } from "@vertix.gg/bot/src/managers/dynamic-channel-claim-manager";

import type { UIService } from "@vertix.gg/gui/src/ui-service";

export class UIModuleV3 extends UIModuleBase {
    public static getName() {
        return "Vertix/UI-V3/Module";
    }

    public static getAdapters() {
        return Object.values( adapters );
    }

    public get $$() {
        return this.constructor as typeof UIModuleV3;
    }

    protected getCustomIdStrategy() {
        return new UICustomIdHashStrategy();
    }

    protected async initialize() {
        const uiService = ServiceLocator.$.get<UIService>( "VertixGUI/UIService" );

        DynamicChannelClaimManager.register( "Vertix/UI-V3/DynamicChannelClaimManager", {
            adapters: {
                claimStartAdapter: () => uiService.get( adapters.ClaimStartAdapter.getName() ) !,
                claimVoteAdapter: () => uiService.get<"execution">( adapters.ClaimVoteAdapter.getName() ) !,
                claimResultAdapter: () => uiService.get<"execution">( adapters.ClaimResultAdapter.getName() ) !,
            },

            dynamicChannelClaimButtonId:
                DynamicChannelPrimaryMessageElementsGroup.getByName( "Vertix/UI-V3/DynamicChannelClaimChannelButton" )!
                    .getId(),

            steps: {
                claimResultAddedSuccessfully: "Vertix/UI-V3/ClaimResultAddedSuccessfully",
                claimResultAlreadyAdded: "Vertix/UI-V3/ClaimResultAlreadyAdded",
                claimResultOwnerStop: "Vertix/UI-V3/ClaimResultOwnerStop",
                claimResultVoteAlreadySelfVoted: "Vertix/UI-V3/ClaimResultVoteAlreadySelfVoted",
                claimResultVoteAlreadyVotedSame: "Vertix/UI-V3/ClaimResultVoteAlreadyVotedSame",
                claimResultVoteUpdatedSuccessfully: "Vertix/UI-V3/ClaimResultVoteUpdatedSuccessfully",
                claimResultVotedSuccessfully: "Vertix/UI-V3/ClaimResultVotedSuccessfully",
            },

            entities: {
                claimVoteAddButton: "Vertix/UI-V3/ClaimVoteAddButton",
                claimVoteStepInButton: "Vertix/UI-V3/ClaimVoteStepInButton",
            }
        } );
    }

}

export default UIModuleV3;
