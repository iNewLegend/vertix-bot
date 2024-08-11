import { isDebugEnabled } from "@vertix.gg/utils/src/environment";

import { VERSION_UI_V3 } from "@vertix.gg/base/src/definitions/version";

import { ChannelDataModelV3 } from "@vertix.gg/base/src/models/v3/channel-data-model-v3";

import { ConfigManager } from "@vertix.gg/base/src/managers/config-manager";

import type {
    MasterChannelConfigInterfaceV3,
    MasterChannelSettingsInterface
} from "@vertix.gg/base/src/interfaces/master-channel-config";

export class MasterChannelDataModelV3 extends ChannelDataModelV3 {
    private static instance: MasterChannelDataModelV3;

    private configV3 = ConfigManager.$
        .get<MasterChannelConfigInterfaceV3>( "Vertix/Config/MasterChannel", VERSION_UI_V3 );

    public static get $() {
        if ( ! this.instance ) {
            this.instance = new MasterChannelDataModelV3();
        }

        return this.instance;
    }

    public static getName() {
        return "VertixBase/Models/MasterChannelDataV3";
    }

    public constructor() {
        super(
            isDebugEnabled( "CACHE", MasterChannelDataModelV3.getName() ),
            isDebugEnabled( "MODEL", MasterChannelDataModelV3.getName() )
        );
    }

    public async getMasterChannelsWithSettings(  guildId: string ) {
        const masterChannels = await this.getAll( { where: { guildId } }, { key: "settings" } );

        debugger;
    }

    public async setSettings<T extends MasterChannelSettingsInterface>( id: string, settings: Partial<T>, assignDefaults = false ) {
        if ( assignDefaults ) {
            settings = { ...this.configV3.get( "masterChannelSettings" ), ...settings };
        }

        // Pick only the keys that are defined in the config
        settings = Object.keys( settings )
            .filter( key => this.configV3.get( "masterChannelSettings" ).hasOwnProperty( key ) )
            .reduce( ( obj, key ) => {
                obj[ key ] = settings[ key as keyof T ];
                return obj;
            }, {} as any );

        return this.upsert( { where: { id } }, { key: "settings" }, settings );
    }
}
