/**
 * @see https://discord.com/developers/docs/topics/gateway#sharding-for-very-large-bots
 * @see https://discord.com/api/oauth2/authorize?client_id=1079487067932868608&permissions=285213712&scope=bot%20applications.commands
 */

import botInitialize from "./dynamico";
import Prisma from "./prisma";

import GlobalLogger from "@dynamico/global-logger";

function entryPoint() {
    GlobalLogger.getInstance().info( entryPoint, "Database is connected" );

    botInitialize();
}

Prisma.getConnectPromise().then( entryPoint );
