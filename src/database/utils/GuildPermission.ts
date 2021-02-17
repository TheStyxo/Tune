import GuildSettings from '../structures/GuildSettings';
import { BitField, GuildMember } from 'discord.js';
import { InternalPermissions, InternalPermissionResolvable } from './InternalPermissions';
import { IGuildPermissionsData, DefaultGuildPermissionsData } from '../data_structures/GuildPermissionsData';
import dot from 'dot-prop';

export default class GuildPermission {
    // Class props //
    GuildSettings: GuildSettings;
    id: string;
    isUser: boolean;
    // Class props //

    constructor(GuildSettings: GuildSettings, id: string, isUser: boolean = true) {
        this.GuildSettings = GuildSettings;
        this.id = id;
        this.isUser = isUser;
    }

    get allowed(): Readonly<BitField<string>> {
        return new InternalPermissions(this.isUser ? this.GuildSettings._data.settings.permissions.users[this.id]?.allowed : this.GuildSettings._data.settings.permissions.roles[this.id]?.allowed || DefaultGuildPermissionsData.allowed).freeze();
    }

    get denied(): Readonly<BitField<string>> {
        return new InternalPermissions(this.isUser ? this.GuildSettings._data.settings.permissions.users[this.id]?.denied : this.GuildSettings._data.settings.permissions.roles[this.id]?.denied || DefaultGuildPermissionsData.denied).freeze();
    }

    get overwrites() {
        return new InternalPermissions(InternalPermissions.DEFAULT).add(this.allowed).remove(this.denied);
    }

    calculatePermissions(member: GuildMember): InternalPermissions {
        if (!this.isUser) return this.overwrites;

        if (member.permissions.has("ADMINISTRATOR")) return new InternalPermissions(InternalPermissions.ALL);
        else {
            const finalPermissions = new InternalPermissions(InternalPermissions.DEFAULT);
            const memberRoleIDs = member.roles.cache.keyArray();
            //For @everyone role id
            const everyonePerms = this.GuildSettings.permissions.roles.getFor(memberRoleIDs.pop() || member.guild.id);
            finalPermissions.add(everyonePerms.allowed).remove(everyonePerms.denied);
            //Add and remove permissions for each role (lowest to highest - lowest first in array)
            for (const roleID of memberRoleIDs) {
                const rolePerms = this.GuildSettings.permissions.roles.getFor(roleID);
                finalPermissions.add(rolePerms.allowed).remove(rolePerms.denied);
            }
            //User permissions override everything else
            return finalPermissions.add(this.allowed).remove(this.denied);
        }
    }

    async allow(permission: InternalPermissionResolvable): Promise<GuildPermission> {
        const newAllowed = new InternalPermissions(this.allowed).add(permission).bitfield;
        const newDenied = new InternalPermissions(this.denied).remove(permission).bitfield;

        dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`, newAllowed);
        dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`, newDenied);


        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, {
            $set: {
                [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`]: newAllowed,
                [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`]: newDenied
            }
        }, { upsert: true });

        return this;
    }

    async deny(permission: InternalPermissionResolvable): Promise<GuildPermission> {
        const newAllowed = new InternalPermissions(this.allowed).remove(permission).bitfield;
        const newDenied = new InternalPermissions(this.denied).add(permission).bitfield;

        dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`, newAllowed);
        dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`, newDenied);


        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, {
            $set: {
                [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`]: newAllowed,
                [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`]: newDenied
            }
        }, { upsert: true });

        return this;
    }

    async reset(permission?: InternalPermissionResolvable): Promise<GuildPermission> {
        if (!permission) permission = InternalPermissions.ALL;

        const newAllowed = new InternalPermissions(this.allowed).remove(permission).bitfield;
        const newDenied = new InternalPermissions(this.denied).remove(permission).bitfield;

        const empty = this.allowed.bitfield === 0 && this.denied.bitfield === 0;

        if (!empty) {
            dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`, newAllowed);
            dot.set(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`, newDenied);

            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, {
                $set: {
                    [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.allowed`]: newAllowed,
                    [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}.denied`]: newDenied
                }
            }, { upsert: true });
        }
        else {
            dot.delete(this.GuildSettings._data, `settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}`);
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, {
                $unset: {
                    [`settings.permissions.${this.isUser ? "users" : "roles"}.${this.id}`]: null
                }
            }, { upsert: true });
        }

        return this;
    }
}