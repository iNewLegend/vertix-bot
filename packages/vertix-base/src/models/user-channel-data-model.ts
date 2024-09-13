import { PrismaBotClient } from "@vertix.gg/prisma/bot-client";

import { isDebugEnabled } from "@vertix.gg/utils/src/environment";

import { ChannelModel } from "@vertix.gg/base/src/models/channel-model";

import { ModelDataOwnerStrictDataBase } from "@vertix.gg/base/src/bases/model-data-owner-strict-data-base";

import type { VoiceChannel } from "discord.js";

import type { TDataVersioningDefaultUniqueKeys } from "src/factory/data-versioning-model-factory";
import type { MasterChannelUserDataInterface } from "@vertix.gg/base/src/interfaces/master-channel-user-config";

const client = PrismaBotClient.$.getClient();

interface TDataOwnerUniqueKeys extends TDataVersioningDefaultUniqueKeys {
    ownerId: string;
    channelId: string;
}

export class UserChannelDataModel extends ModelDataOwnerStrictDataBase<
    typeof client.user,
    typeof client.userChannelData,
    PrismaBot.UserChannelData,
    TDataOwnerUniqueKeys,
    MasterChannelUserDataInterface
> {
    private static instance: UserChannelDataModel;

    public static getName() {
        return "VertixBase/Models/UserChannelData";
    }

    public constructor() {
        super(
            isDebugEnabled( "CACHE", UserChannelDataModel.getName() ),
            isDebugEnabled( "MODEL", UserChannelDataModel.getName() )
        );
    }

    public static get $() {
        if ( ! this.instance ) {
            this.instance = new UserChannelDataModel();
        }

        return this.instance;
    }

    protected getModel() {
        return client.user;
    }

    protected getDataModel() {
        return client.userChannelData;
    }

    protected getDataVersion() {
        // Fresh model/collection.
        return "0.0.0.0" as const;
    }

    protected getDataUniqueKeyName() {
        return "ownerId_channelId_key_version";
    }

    protected getStrictDataFactor(): MasterChannelUserDataInterface {
        return {
            dynamicChannelName: "",
            dynamicChannelUserLimit: -1,
            dynamicChannelState: "unknown",
            dynamicChannelVisibilityState: "unknown",
            dynamicChannelAllowedUserIds: [],
            dynamicChannelBlockedUserIds: [],
            dynamicChannelRegion: "",
            dynamicChannelPrimaryMessage: {},
        };
    }

    public async getMasterData( userId: string, masterChannelDBId: string ) {
        return this.get<MasterChannelUserDataInterface>(
            { where: { userId } },
            { channelId: masterChannelDBId, key: "MasterData" }
        );
    }

    /**
     * Function `setUserMasterData()` - This method sets “master” data for a given user.
     **/
    public async setMasterData( userId: string, masterChannelDBId: string, data: Partial<MasterChannelUserDataInterface> ) {
        return this.setStrictData(
            { where: { userId } },
            { channelId: masterChannelDBId, key: "MasterData" },
            data
        );
    }

    public async setMasterDataByDynamicChannel( userId: string, dynamicChannel: VoiceChannel, data: Partial<MasterChannelUserDataInterface> ) {
        const masterChannelDB = await ChannelModel.$.getMasterChannelDBByDynamicChannelId( dynamicChannel.id );

        if ( ! masterChannelDB ) {
            this.logger.error( this.setMasterDataByDynamicChannel,
                `Guild id: '${ dynamicChannel.guildId }' - Master channel not found for channel: '${ dynamicChannel.id }'`
            );
            return;
        }

        return this.setMasterData( userId, masterChannelDB.id, data );
    }

    public async setPrimaryMessage( userId: string, masterChannelDBId: string, content: {
        title?: string,
        description?: string
    } ) {
        return this.setMasterData( userId, masterChannelDBId, {
            dynamicChannelPrimaryMessage: content
        } );
    }

    public async getPrimaryMessage( userId: string, masterChannelDBId: string ) {
        const masterData = await this.getMasterData( userId, masterChannelDBId );

        return masterData?.dynamicChannelPrimaryMessage || {};
    }
}

