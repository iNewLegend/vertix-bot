import process from "process";
import * as fs from "fs";
import * as path from "path";

import { E_INTERNAL_CHANNEL_TYPES } from ".prisma/client";
import { ChannelType, Client } from "discord.js";

import { CategoryManager } from "@dynamico/managers/category";
import { ChannelDataManager } from "@dynamico/managers/channel-data";
import { ChannelManager } from "@dynamico/managers/channel";

import { CURRENT_VERSION, VERSION_PHASE_4 } from "@dynamico/constants/version";

import { InitializeBase } from "@internal/bases/initialize-base";
import { PrismaInstance } from "@internal/prisma";

interface PackageJson {
    version: string;

    [ key: string ]: any;
}

const packageJsonPath = path.resolve( "./package.json" );
const packageJsonString = fs.readFileSync( packageJsonPath, { encoding: "utf8" } );
const packageJson: PackageJson = JSON.parse( packageJsonString );

export class DynamicoManager extends InitializeBase {
    private static instance: DynamicoManager;

    // TODO: Remove undefined.
    private client: Client | undefined;

    public static getName() {
        return "Dynamico/Managers/Dynamico";
    }

    public static getInstance() {
        if ( ! DynamicoManager.instance ) {
            DynamicoManager.instance = new DynamicoManager();
        }

        return DynamicoManager.instance;
    }

    public static get $() {
        return DynamicoManager.getInstance();
    }

    public static getVersion() {
        return CURRENT_VERSION;
    }

    public static getBuildVersion() {
        return packageJson.version;
    }

    public static isDebugOn( debugType: string, entityName: string ) {
        return !! process.env[ `DEBUG_${ debugType }` ]?.includes( entityName );
    }

    public constructor() {
        super();

        this.printVersion();
    }

    public getClient() {
        return this.client;
    }

    public async onReady( client: Client ) {
        if ( this.client ) {
            this.logger.error( this.onReady, "Client is already set" );
            process.exit( 1 );
            return;
        }

        this.client = client;

        if ( ! client.user || ! client.application ) {
            this.logger.error( this.onReady, "Client is not ready" );
            process.exit( 1 );
            return;
        }

        const { Commands } = ( await import( "@dynamico/commands" ) );

        await client.application.commands.set( Commands );

        setTimeout( () => {
            this.handleChannels( client );

            // TODO: Should run on background.
            this.updateGuilds();
        } );

        await this.ensureBackwardCompatibility();

        const username = client.user.username,
            id = client.user.id;

        this.logger.log( this.onReady,
            `Ready handle is set, bot: '${ username }', id: '${ id }' is online, commands is set.` );
    }

    public handleChannels( client: Client ) {
        const promises = [
            this.removeNonExistMasterChannelsFromDB( client ),
            this.removeEmptyChannels( client ),
            this.removeEmptyCategories( client ),
        ];

        Promise.all( promises ).then( () => {
            this.logger.info( this.handleChannels, "All channels are handled." );
        } );
    }

    private async removeEmptyChannels( client: Client ) {
        // Get all dynamic channels.
        const prisma = await PrismaInstance.getClient(),
            channels = await prisma.channel.findMany( {
                where: {
                    internalType: E_INTERNAL_CHANNEL_TYPES.DYNAMIC_CHANNEL
                }
            } );

        for ( const channel of channels ) {
            const guildCache = client.guilds.cache.get( channel.guildId ),
                channelCache = guildCache?.channels.cache.get( channel.channelId );

            if ( guildCache && channelCache?.members && channelCache.isVoiceBased() ) {
                if ( 0 === channelCache.members.size ) {
                    await ChannelManager.$.delete( {
                        channel: channelCache,
                        guild: guildCache,
                    } );
                }

                continue;
            }

            // Delete only from db.
            await prisma.channel.delete( {
                where: {
                    id: channel.id
                },
                include: {
                    data: true
                }
            } );

            this.logger.info( this.removeEmptyChannels,
                `Channel id: '${ channel.channelId }' is deleted from db.`
            );
        }
    }

    public async removeNonExistMasterChannelsFromDB( client: Client ) {
        // Remove non-existing master channels.
        const prisma = await PrismaInstance.getClient(),
            masterChannels = await prisma.channel.findMany( {
                where: {
                    internalType: E_INTERNAL_CHANNEL_TYPES.MASTER_CREATE_CHANNEL
                }
            } );

        for ( const channel of masterChannels ) {
            const guildCache = client.guilds.cache.get( channel.guildId ),
                channelCache = guildCache?.channels.cache.get( channel.channelId );

            if ( ! guildCache || ! channelCache ) {
                await prisma.channel.delete( {
                    where: {
                        id: channel.id
                    }
                } );

                this.logger.info( this.removeNonExistMasterChannelsFromDB,
                    `Master channel id: '${ channel.channelId }' is deleted from db.`
                );
            }
        }
    }

    public async removeEmptyCategories( client: Client ) {
        // Get all dynamic channels.
        const prisma = await PrismaInstance.getClient(),
            categories = await prisma.category.findMany();

        for ( const category of categories ) {
            const categoryCache = client.guilds.cache.get( category.guildId )?.channels.cache.get( category.categoryId );

            if ( ChannelType.GuildCategory === categoryCache?.type ) {
                if ( 0 === categoryCache.children.cache.size ) {
                    await CategoryManager.$.delete( categoryCache ).catch( ( error: any ) => {
                        this.logger.error( this.removeEmptyCategories, "", error );
                    } );
                }

                continue;
            }

            // Delete only from db.
            await prisma.category.delete( {
                where: {
                    id: category.id
                }
            } );

            this.logger.info( this.removeEmptyCategories,
                `Category id: '${ category.categoryId }' is deleted from database`
            );
        }
    }

    public async updateGuilds() {
        // Get all guilds.
        const prisma = await PrismaInstance.getClient(),
            guilds = await prisma.guild.findMany();

        for ( const guild of guilds ) {
            // Check if guild is active.
            const guildCache = this.client?.guilds.cache.get( guild.guildId ),
                name = guildCache?.name || guild.name,
                isInGuild = !! guildCache;

            prisma.guild.update( {
                where: {
                    id: guild.id
                },
                data: {
                    name,
                    isInGuild,
                    // Do not update `updatedAt` field.
                    updatedAt: guild.updatedAt,
                    updatedAtInternal: new Date(),
                },
            } ).then( () => {
                this.logger.info( this.updateGuilds,
                    `Guild id: '${ guild.guildId }' - Updated, name: '${ name }', isInGuild: '${ isInGuild }'`
                );
            } );
        }
    }

    private async ensureBackwardCompatibility() {
        await this.replaceDynamicChannelNameTemplate();
    }

    /**
     * Function replaceDynamicChannelNameTemplate() :: Replace the old template prefix and suffix '%{', '%}' to the new one '{{', '}}'
     * From version `null` to version `0.0.1`.
     */
    private async replaceDynamicChannelNameTemplate() {
        const allData = await ChannelDataManager.$.getAllData();

        for ( const data of allData ) {
            if ( null === data.version ) {
                if ( data.object && "settings" === data.key ) {
                    // Assign new one.
                    data.object.dynamicChannelNameTemplate = "{user}'s Channel";

                    // Describe version.
                    data.version = VERSION_PHASE_4;

                    await ChannelDataManager.$.setData( {
                        ownerId: data.ownerId,
                        key: data.key,
                        default: data.object,
                    } );
                }
            }
        }
    }

    private printVersion() {
        this.logger.info( this.printVersion,
            `Version: '${ DynamicoManager.getVersion() }' Build version: ${ DynamicoManager.getBuildVersion() }'`
        );
    }
}
