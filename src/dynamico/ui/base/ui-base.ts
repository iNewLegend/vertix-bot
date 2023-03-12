import { Interaction, NonThreadGuildBasedChannel } from "discord.js";

import { DYNAMICO_UI_BASE, DYNAMICO_UI_ELEMENT } from "@dynamico/interfaces/ui";

import { ObjectBase } from "@internal/bases";

export abstract class UIBase extends ObjectBase {
    protected loadPromise: Promise<void> | null = null;

    public static getName() {
        return DYNAMICO_UI_BASE;
    }

    protected constructor( interaction?: Interaction | NonThreadGuildBasedChannel ) {
        super();

        if ( this.getName() === DYNAMICO_UI_ELEMENT ) {
            return;
        }

        this.loadPromise = this.load( interaction );
    }

    /**
     * The method should wait for the entity(s) to be constructed and initialized.
     */
    protected abstract load( interaction?: Interaction | NonThreadGuildBasedChannel ): Promise<void>;

    public async waitUntilLoaded() {
        await this.loadPromise;
    }
}

export default UIBase;
