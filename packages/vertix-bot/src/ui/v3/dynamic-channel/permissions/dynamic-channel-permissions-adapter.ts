import { ChannelModel } from "@vertix.gg/base/src/models/channel-model";

import { MasterChannelDataManager } from "@vertix.gg/base/src/managers/master-channel-data-manager";

import { DynamicChannelAdapterExuWithPermissionsBase } from "@vertix.gg/bot/src/ui/v3/dynamic-channel/base/dynamic-channel-adapter-exu-with-permissions-base";

import { DynamicChannelPermissionsComponent } from "@vertix.gg/bot/src/ui/v3/dynamic-channel/permissions/dynamic-channel-permissions-component";

import {
    DynamicChannelPermissionsAccessButton,
    DynamicChannelPermissionsStateButton,
    DynamicChannelPermissionsVisibilityButton,
} from "@vertix.gg/bot/src/ui/v3/dynamic-channel/permissions/elements";

import { DEFAULT_DYNAMIC_CHANNEL_GRANTED_PERMISSIONS } from "@vertix.gg/bot/src/definitions/dynamic-channel";

import { DynamicChannelPrimaryMessageElementsGroup } from "@vertix.gg/bot/src/ui/v3/dynamic-channel/primary-message/dynamic-channel-primary-message-elements-group";

import type {
    UIDefaultButtonChannelVoiceInteraction,
    UIDefaultUserSelectMenuChannelVoiceInteraction
} from "@vertix.gg/gui/src/bases/ui-interaction-interfaces";
import type { UIArgs } from "@vertix.gg/gui/src/bases/ui-definitions";

type DefaultInteraction =
    | UIDefaultUserSelectMenuChannelVoiceInteraction
    | UIDefaultButtonChannelVoiceInteraction

export class DynamicChannelPermissionsAdapter extends DynamicChannelAdapterExuWithPermissionsBase<DefaultInteraction> {
    public static getName() {
        return "Vertix/UI-V3/DynamicChannelPermissionsAdapter";
    }

    public static getComponent() {
        return DynamicChannelPermissionsComponent;
    }

    protected static getInitiatorElement() {
        return DynamicChannelPermissionsAccessButton;
    }

    protected static getExcludedElements() {
        return [
            // DynamicChannelPermissionsAccessButton,
            DynamicChannelPermissionsStateButton,
            DynamicChannelPermissionsVisibilityButton,
        ];
    }

    protected static getExecutionSteps() {
        return {
            ... super.getExecutionSteps(),

            "Vertix/UI-V3/DynamicChannelPermissionsAccess": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessEmbedGroup"
            },

            "Vertix/UI-V3/DynamicChannelPermissionsStatePublic": {
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsPublicEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsStatePrivate": {
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsPrivateEmbedGroup",
            },

            "Vertix/UI-V3/DynamicChannelPermissionsStateHidden": {
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsHiddenEmbedGroup",
            },
            "Vertix/UI-V3/DynamicChannelPermissionsStateShown": {
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsShownEmbedGroup",
            },

            "Vertix/UI-V3/DynamicChannelPermissionsGranted": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsGrantedEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsDenied": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsDeniedEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsBlocked": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsBlockedEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsUnBlocked": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsUnblockedEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsKick": {
                elementsGroup: "Vertix/UI-V3/DynamicChannelPermissionsAccessElementsGroup",
                embedsGroup: "Vertix/UI-V3/DynamicChannelPermissionsKickEmbedGroup"
            },

            "Vertix/UI-V3/DynamicChannelPermissionsStateError": {
                embedsGroup: "VertixBot/UI-General/SomethingWentWrongEmbedGroup"
            },
            "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged": {
                embedsGroup: "VertixBot/UI-General/NothingChangedEmbedGroup"
            },
        };
    }

    protected getStartArgs() {
        return {};
    }

    protected async getReplyArgs( interaction: DefaultInteraction, argsFromManager: UIArgs ) {
        const args: UIArgs = {};

        switch ( this.getCurrentExecutionStep()?.name ) {
            case "Vertix/UI-V3/DynamicChannelPermissionsGranted":
                args.userGrantedDisplayName = argsFromManager.userGrantedDisplayName;
                break;

            case "Vertix/UI-V3/DynamicChannelPermissionsDenied":
                args.userDeniedDisplayName = argsFromManager.userDeniedDisplayName;
                break;

            case "Vertix/UI-V3/DynamicChannelPermissionsBlocked":
                args.userBlockedDisplayName = argsFromManager.userBlockedDisplayName;
                break;

            case "Vertix/UI-V3/DynamicChannelPermissionsUnBlocked":
                args.userUnBlockedDisplayName = argsFromManager.userUnBlockedDisplayName;
                break;

            case "Vertix/UI-V3/DynamicChannelPermissionsKick":
                args.userKickedDisplayName = argsFromManager.userKickedDisplayName;
                break;
        }

        const masterChannelDB = await ChannelModel.$
            .getMasterChannelDBByDynamicChannelId( interaction.channel.id );

        if ( masterChannelDB ) {
            args.dynamicChannelButtonsTemplate = await MasterChannelDataManager.$.getChannelButtonsTemplate( masterChannelDB.id, false );

            // Runs over all dynamic-channel buttons that are configured by the user(Master Channel)
            // And determine if accessButtonId is enabled , since all other "permissions" buttons are depends on the access button
            // TODO: This mechanism is broken, and it should be reworked.
            // Keep in mind that is only for version V2, and consider the effort to rework it.
            const accessButtonId = DynamicChannelPrimaryMessageElementsGroup
                .getByName( "Vertix/UI-V3/DynamicChannelPermissionsAccessButton" )?.getId();

            args.dynamicChannelButtonsIsAccessButtonAvailable = args.dynamicChannelButtonsTemplate.some(
                ( buttonId: string ) =>  buttonId === accessButtonId
            );
        }

        await this.assignUsersWithPermissions( interaction.channel, args );

        return args;
    }

    protected onEntityMap() {
        // TODO: Check if state buttons needed to move out from component, since they are non-visible.
        // Private/Public.
        this.bindButton<UIDefaultButtonChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsStateButton",
            this.onStateButtonClicked
        );

        // Hidden/Shown.
        this.bindButton<UIDefaultButtonChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsVisibilityButton",
            this.onStateVisibilityClicked
        );

        // Grant user access.
        this.bindUserSelectMenu<UIDefaultUserSelectMenuChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsGrantMenu",
            this.onGrantSelected
        );

        // Deny user access.
        this.bindSelectMenu<UIDefaultUserSelectMenuChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsDenyMenu",
            this.onDenySelected,
        );

        // Block user.
        this.bindUserSelectMenu<UIDefaultUserSelectMenuChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsBlockMenu",
            this.onBlockSelected
        );

        // Unblock user.
        this.bindUserSelectMenu<UIDefaultUserSelectMenuChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsUnblockMenu",
            this.onUnBlockSelected
        );

        // Kick user.
        this.bindUserSelectMenu<UIDefaultUserSelectMenuChannelVoiceInteraction>(
            "Vertix/UI-V3/DynamicChannelPermissionsKickMenu",
            this.onKickSelected
        );
    }

    private async onStateButtonClicked( interaction: UIDefaultButtonChannelVoiceInteraction ) {
        switch ( await this.dynamicChannelService.getChannelState( interaction.channel ) ) {
            case "public":
                if ( ! await this.dynamicChannelService.editChannelState( interaction, interaction.channel, "private" ) ) {
                    return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
                }

                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStatePrivate", {} );

            case "private":
                if ( ! await this.dynamicChannelService.editChannelState( interaction, interaction.channel, "public" ) ) {
                    return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
                }

                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStatePublic", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onStateVisibilityClicked( interaction: UIDefaultButtonChannelVoiceInteraction ) {
        switch ( await this.dynamicChannelService.getChannelVisibilityState( interaction.channel ) ) {
            case "shown":
                if ( ! await this.dynamicChannelService.editChannelVisibilityState( interaction, interaction.channel, "hidden" ) ) {
                    return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
                }

                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateHidden", {} );

            case "hidden":
                if ( ! await this.dynamicChannelService.editChannelVisibilityState( interaction, interaction.channel, "shown" ) ) {
                    return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
                }

                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateShown", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onGrantSelected( interaction: UIDefaultUserSelectMenuChannelVoiceInteraction ) {
        const targetId = interaction.values.at( 0 ) as string,
            target = interaction.guild.members.cache.get( targetId );

        if ( ! target ) {
            await interaction.deferUpdate().catch( () => {} );
            return;
        }

        switch ( await this.dynamicChannelService.addUserAccess( interaction, interaction.channel, target, DEFAULT_DYNAMIC_CHANNEL_GRANTED_PERMISSIONS ) ) {
            case "success":
                await this.editReplyWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsGranted", {
                    userGrantedDisplayName: target.displayName,
                } );
                break;

            case "action-on-bot-user":
            case "self-grant":
            case "already-granted":
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onDenySelected( interaction: UIDefaultUserSelectMenuChannelVoiceInteraction ) {
        const targetId = interaction.values.at( 0 ) as string,
            target = interaction.guild.members.cache.get( targetId );

        if ( ! target ) {
            await interaction.deferUpdate().catch( () => {
            } );
            return;
        }

        switch ( await this.dynamicChannelService.removeUserAccess( interaction, interaction.channel, target ) ) {
            case "success":
                await this.editReplyWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsDenied", {
                    userDeniedDisplayName: target.displayName,
                } );
                break;

            case "action-on-bot-user":
            case "self-deny":
            case "not-in-the-list":
            case "user-blocked":
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onBlockSelected( interaction: UIDefaultUserSelectMenuChannelVoiceInteraction ) {
        const targetId = interaction.values.at( 0 ) as string,
            target = interaction.guild.members.cache.get( targetId );

        if ( ! target ) {
            await interaction.deferUpdate().catch( () => {
            } );
            return;
        }

        switch ( await this.dynamicChannelService.editUserAccess( interaction, interaction.channel, target, DEFAULT_DYNAMIC_CHANNEL_GRANTED_PERMISSIONS, false ) ) {
            case "success":
                // Check if target is in the channel.
                if ( interaction.channel.members.has( target.id ) ) {
                    // Kick it.
                    await target.voice.setChannel( null ).catch( () => {} );
                }

                await this.editReplyWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsBlocked", {
                    userBlockedDisplayName: target.displayName,
                } );
                break;

            case "action-on-bot-user":
            case "self-edit":
            case "already-have":
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onUnBlockSelected( interaction: UIDefaultUserSelectMenuChannelVoiceInteraction ) {
        const targetId = interaction.values.at( 0 ) as string,
            target = interaction.guild.members.cache.get( targetId );

        if ( ! target ) {
            await interaction.deferUpdate().catch( () => {
            } );
            return;
        }

        switch ( await this.dynamicChannelService.removeUserAccess( interaction, interaction.channel, target, true ) ) {
            case "success":
                await this.editReplyWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsUnBlocked", {
                    userUnBlockedDisplayName: target.displayName,
                } );
                break;

            case "action-on-bot-user":
            case "not-in-the-list":
            case "self-deny":
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }

    private async onKickSelected( interaction: UIDefaultUserSelectMenuChannelVoiceInteraction ) {
        const targetId = interaction.values.at( 0 ) as string,
            target = interaction.guild.members.cache.get( targetId );

        if ( ! target ) {
            await interaction.deferUpdate().catch( () => {} );
            return;
        }

        switch ( await this.dynamicChannelService.kickUser( interaction, interaction.channel, target ) ) {
            case "success":
                await this.editReplyWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsKick", {
                    userKickedDisplayName: target.displayName,
                } );
                break;

            case "not-in-the-list":
            case "action-on-bot-user":
            case "self-action":
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateNothingChanged", {} );

            default:
                return await this.ephemeralWithStep( interaction, "Vertix/UI-V3/DynamicChannelPermissionsStateError", {} );
        }
    }
}
