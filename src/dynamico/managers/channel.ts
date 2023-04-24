import {
    ChannelType,
    DMChannel,
    MessageEditOptions,
    NonThreadGuildBasedChannel,
    VoiceChannel,
    VoiceState,
} from "discord.js";

import { E_INTERNAL_CHANNEL_TYPES } from ".prisma/client";

import MasterChannelManager from "./master-channel";

import {
    IChannelCreateArgs,
    IChannelDeleteArgs,
    IChannelEnterGenericArgs,
    IChannelLeaveGenericArgs
} from "../interfaces/channel";

import ChannelModel, { ChannelResult } from "@dynamico/models/channel";

import ChannelDataManager from "@dynamico/managers/channel-data";

import PermissionsManager from "@dynamico/managers/permissions";

import Debugger from "@dynamico/utils/debugger";

import DynamicoManager from "@dynamico/managers/dynamico";

import { ManagerCacheBase } from "@internal/bases/manager-cache-base";

const UNKNOWN_DISPLAY_NAME = "Unknown User",
    UNKNOWN_CHANNEL_NAME = "Unknown Channel";

export class ChannelManager extends ManagerCacheBase<ChannelResult> {
    private static instance: ChannelManager;

    private debugger: Debugger;

    private channelModel: ChannelModel;

    private masterChannelManager: MasterChannelManager;
    private permissionsManager: PermissionsManager;

    public static getInstance(): ChannelManager {
        if ( ! ChannelManager.instance ) {
            ChannelManager.instance = new ChannelManager();
        }

        return ChannelManager.instance;
    }

    public static getName() {
        return "Dynamico/Managers/Channel";
    }

    public constructor( shouldDebugCache = DynamicoManager.isDebugOn( "CACHE", ChannelManager.getName() ) ) {
        super( shouldDebugCache );

        this.debugger = new Debugger( this );

        this.channelModel = ChannelModel.getInstance();

        this.permissionsManager = PermissionsManager.getInstance();

        this.masterChannelManager = MasterChannelManager.getInstance();
    }

    public async onJoin( oldState: VoiceState, newState: VoiceState ) {
        const displayName = newState.member?.displayName || UNKNOWN_DISPLAY_NAME,
            channelName = newState.channel?.name || UNKNOWN_CHANNEL_NAME;

        this.logger.info( this.onJoin,
            `Guild id: '${ oldState.guild.id }' - User: '${ displayName }' joined to channel: '${ channelName }'`
        );

        await this.onEnterGeneric( {
            oldState,
            newState,
            displayName,
            channelName
        } );
    }

    public async onSwitch( oldState: VoiceState, newState: VoiceState ) {
        const displayName = newState.member?.displayName || UNKNOWN_DISPLAY_NAME,
            oldChannelName = oldState.channel?.name || UNKNOWN_CHANNEL_NAME,
            newChannelName = newState.channel?.name || UNKNOWN_CHANNEL_NAME;

        this.logger.log( this.onSwitch,
            `Guild id: '${ oldState.guild.id }' - User: '${ displayName }' switched from channel: '${ oldChannelName }' to channel: '${ newChannelName }'`
        );

        await this.onEnterGeneric( {
            oldState,
            newState,
            displayName,
            channelName: newChannelName
        } );
    }

    /**
     * Function onLeave() :: Called when a user leaves a channel,
     *
     * @note Does not goes anywhere else, mostly leave the guild.
     */
    public async onLeave( oldState: VoiceState, newState: VoiceState ) {
        const displayName = newState.member?.displayName || UNKNOWN_DISPLAY_NAME,
            channelName = newState.channel?.name || UNKNOWN_CHANNEL_NAME;

        this.logger.info( this.onLeave,
            `Guild id: '${ oldState.guild.id }' - User: '${ displayName }' left channel guild: '${ oldState.guild.name }'`
        );

        await this.onLeaveGeneric( {
            oldState,
            newState,
            displayName,
            channelName
        } );
    }

    public async onEnterGeneric( args: IChannelEnterGenericArgs ) {
        const { oldState, newState } = args;

        if ( newState.channelId && await this.channelModel.isMasterCreate( newState.channelId, newState.guild.id ) ) {
            await this.masterChannelManager.onJoinMasterCreateChannel( args );
        }

        // If the user switched channels.
        if ( oldState.channelId !== newState.channelId ) {
            await this.onLeaveGeneric( args );
        }
    }

    public async onLeaveGeneric( args: IChannelLeaveGenericArgs ) {
        const { oldState, newState } = args;

        if ( oldState.channelId && await this.channelModel.isDynamic( oldState.channelId, newState.guild.id ) ) {
            await this.masterChannelManager.onLeaveDynamicChannel( args );
        }
    }

    public async onChannelDelete( channel: DMChannel | NonThreadGuildBasedChannel ) {
        this.debugger.log( this.onChannelDelete, `Channel id: '${ channel.id }' was deleted` );

        switch ( channel.type ) {
            case ChannelType.GuildVoice:
            case ChannelType.GuildText:
                const channelId = channel.id,
                    guildId = channel.guildId;

                this.logger.info( this.onChannelDelete,
                    `Guild id: '${ guildId }' - Channel id: '${ channelId }' was deleted` );

                if ( await this.channelModel.isMasterCreate( channelId, guildId ) ) {
                    await this.channelModel.delete( channel.guild, channelId );
                }

                return true;
        }

        return false;
    }

    public async onChannelUpdate( oldChannel: DMChannel | NonThreadGuildBasedChannel, newChannel: DMChannel | NonThreadGuildBasedChannel ) {
        this.logger.info( this.onChannelUpdate, `Channel id '${ oldChannel.id }' was updated` );

        if ( ChannelType.GuildVoice === oldChannel.type && newChannel.type === ChannelType.GuildVoice ) {
            // If permissions were updated.
            if ( ( oldChannel as VoiceChannel ).permissionOverwrites !== ( newChannel as VoiceChannel ).permissionOverwrites ) {
                await this.permissionsManager
                    .onChannelPermissionsUpdate( oldChannel as VoiceChannel, newChannel as VoiceChannel );
            }
        }
    }

    public async getChannel( guildId: string, channelId: string, cache = false ) {
        this.debugger.log( this.getChannel,
            `Guild id: '${ guildId }' - Getting channel id: '${ channelId }' cache: '${ cache }'`
        );

        // If in cache, return it.
        if ( cache ) {
            const result = this.getCache( channelId );

            if ( result ) {
                return result;
            }
        }

        const result = await this.channelModel.get( guildId, channelId );

        if ( result ) {
            this.setCache( channelId, result );
        }

        return result;
    }

    public async getMasterCreateChannels( guildId: string, includeData = false ) {
        this.logger.debug( this.getMasterCreateChannels,
            `Guild id: '${ guildId }' - Getting master create channel(s)`
        );

        return await this.channelModel.getAll( guildId, E_INTERNAL_CHANNEL_TYPES.MASTER_CREATE_CHANNEL, includeData );
    }

    public async getDynamicChannels( guildId: string, includeData = false ) {
        this.logger.debug( this.getDynamicChannels,
            `Guild id: '${ guildId }' - Getting dynamic channel(s)`
        );

        return await this.channelModel.getAll( guildId, E_INTERNAL_CHANNEL_TYPES.DYNAMIC_CHANNEL, includeData );
    }

    /**
     * Function create() :: Creates a new channel for a guild.
     */
    public async create( args: IChannelCreateArgs ) {
        const { name, guild, userOwnerId, internalType, ownerChannelId = null } = args;

        this.logger.info( this.create,
            `Guild id: '${ guild.id }' - Creating channel for guild: '${ guild.name }' with the following properties: ` +
            `name: '${ name }' ownerId: '${ userOwnerId }' internalType: '${ internalType }' ` +
            `ownerChannelId: '${ args.ownerChannelId }'`
        );

        const channel = await guild.channels.create( args ),
            // Data to be inserted into the database.
            data: any = {
                internalType,
                userOwnerId,
                channelId: channel.id,
                guildId: guild.id,
                createdAtDiscord: channel.createdTimestamp,
            };

        this.debugger.log( this.create,
            `Guild id: '${ guild.id }' - Channel id '${ channel.id }' was created`
        );

        if ( channel.parentId ) {
            data.categoryId = channel.parentId;
        }

        if ( ownerChannelId ) {
            data.ownerChannelId = ownerChannelId;
        }

        return { channel, channelDB: await this.channelModel.create( { data } ) };
    }

    public async delete( args: IChannelDeleteArgs ) {
        const { channel, guild } = args;

        this.logger.info( this.delete,
            `Guild id: '${ guild.id } - Deleting channel: '${ channel.name }' guild: '${ guild.name }'`
        );

        ChannelDataManager.getInstance().removeFromCache( channel.id );

        this.channelModel.delete( guild, channel.id )
            .catch( ( e ) => this.logger.error( this.delete, "", e ) );

        // Some channels are not deletable, so we need to catch the error.
        channel.delete()
            .catch( ( e ) => this.logger.error( this.delete, "", e ) )
            .finally( () => this.removeFromCache( channel.id ) );
    }

    public async editPrimaryMessage( newMessage: MessageEditOptions, channel: VoiceChannel ) {
        const message = await channel.messages.cache.at( 0 );

        if ( ! message ) {
            this.logger.warn( this.editPrimaryMessage,
                `Guild id: '${ channel.guildId }' - Failed to find message in channel id: '${ channel.id }'` );
            return;
        }

        return message.edit( newMessage ).catch(
            ( e ) => this.logger.warn( this.editPrimaryMessage, "", e ) );
    }

    protected removeFromCache( channelId: string ) {
        this.debugger.log( this.removeFromCache, `Removing channel id: '${ channelId }' from cache.` );

        // Remove from cache.
        this.deleteCache( channelId );

        ChannelDataManager.getInstance().removeFromCache( channelId );
    }
}

export default ChannelManager;
