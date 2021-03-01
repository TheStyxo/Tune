import { Collection, Guild, GuildMember, Permissions, Role, User } from 'discord.js';
import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { InternalPermissions } from '../../database/utils/InternalPermissions';
import GuildPermission from '../../database/utils/GuildPermission';
const managablePermissions = ["DJ", "SUMMON_PLAYER", "VIEW_QUEUE", "ADD_TO_QUEUE", "MANAGE_QUEUE", "MANAGE_PLAYER"];

export default class PermissionsCommand extends BaseCommand {
    constructor() {
        super({
            name: "premissions",
            aliases: ["perms"],
            category: "settings",
            description: "Change the permissions for a member or role."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        if (!ctx.args.length) {
            const RolePermissions = ctx.guildSettings.permissions.roles.getAll().filter(p => p.allowed.bitfield !== 0 || p.denied.bitfield !== 0);
            const UserPermissions = ctx.guildSettings.permissions.users.getAll().filter(p => p.allowed.bitfield !== 0 || p.denied.bitfield !== 0);
            if (!RolePermissions.size && !UserPermissions.size) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "There are no permission overwrites set on this server"));
            else {
                const roleDisplay = RolePermissions.size ? displayUsersOrRoles(RolePermissions, true) : null;
                const userDisplay = UserPermissions.size ? displayUsersOrRoles(UserPermissions) : null;
                const finalDisplay = `${roleDisplay ? `**Roles**\n${roleDisplay}` : ""}${roleDisplay && userDisplay ? "\n\n" : ""}${userDisplay ? `**Users**\n${userDisplay}` : ""}`
                return ctx.channel.send(this.utils.embedifyString(ctx.guild, `**Permissions have been modified for**\n\n${finalDisplay}\n\nUse \`${ctx.guildSettings.prefix + this.name} view <role ID|user ID>\` to view the permissions that have been modified for a role or user.`)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
            }
        }
        else {
            const parsedInput = await parseInput(ctx.args.join(" "), ctx.guild);
            const roleOrUserPermissionData = parsedInput.found ? ctx.guildSettings.permissions[(parsedInput.found as unknown as GuildMember).user ? `users` : `roles`].getFor(parsedInput.found.id) : null;

            switch (parsedInput.option) {
                default:
                    if (!parsedInput.id) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a role or user id to view permissions for!", true));
                    if (!parsedInput.found) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Did not find a role or user with that id!", true));
                    return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Permissions for ${parsedInput.found}\n\n${displayPermissions(ctx.guildSettings.permissions[(parsedInput.found as unknown as GuildMember).user ? `users` : `roles`].getFor(parsedInput.found.id), parsedInput.found)} `));
                case 'allow':
                case 'add':
                case 'give':
                    if (!ctx.channel.permissionsFor(ctx.member)?.has("ADMINISTRATOR")) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "You need to have administrator permission on this server to modify permissions!", true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
                    if (!parsedInput.id) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a role or user id to edit permissions for!", true));
                    if (!parsedInput.found) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Did not find a role or user with that id!", true));
                    await roleOrUserPermissionData!.allow(parsedInput.requestedPerms.bitfield);
                    return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Allowed the following permissions to ${parsedInput.found}\n•\`${parsedInput.requestedPerms.toArray().join("`\n•`")}\``));
                case 'deny':
                case 'remove':
                case 'rem':
                case 'take':
                    if (!ctx.channel.permissionsFor(ctx.member)?.has("ADMINISTRATOR")) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "You need to have administrator permission on this server to modify permissions!", true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
                    if (!parsedInput.id) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a role or user id to edit permissions for!", true));
                    if (!parsedInput.found) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Did not find a role or user with that id!", true));
                    await roleOrUserPermissionData!.deny(parsedInput.requestedPerms.bitfield);
                    return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Denied the following permissions to ${parsedInput.found}\n•\`${parsedInput.requestedPerms.toArray().join("`\n•`")}\``));
                //Add a way to reset permissions
                case 'reset':
                case 'res':
                    if (!ctx.channel.permissionsFor(ctx.member)?.has("ADMINISTRATOR")) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "You need to have administrator permission on this server to modify permissions!", true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
                    if (parsedInput.requestedPerms.bitfield === 0 && !parsedInput.id) {
                        switch (parsedInput.forRolesOrUsers) {
                            default:
                                await ctx.guildSettings.permissions.roles.reset();
                                await ctx.guildSettings.permissions.users.reset();
                                return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Successfully reset all permissions for this server!`));
                            case 'r':
                            case 'role':
                            case 'roles':
                                await ctx.guildSettings.permissions.roles.reset();
                                return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Successfully reset permissions for all roles on this server!`));
                            case 'u':
                            case 'user':
                            case 'users':
                                await ctx.guildSettings.permissions.users.reset();
                                return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Successfully reset permissions for all users on this server!`));
                        }
                    }

                    if (!parsedInput.id) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a user or role id to reset the permissions for!", true));
                    if (!parsedInput.found) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Did not find a role or user with that id!", true));

                    if (parsedInput.requestedPerms.bitfield === 0) {
                        await roleOrUserPermissionData!.reset();
                        return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Reset all permissions to default for ${parsedInput.found}`));
                    }
                    else {
                        await roleOrUserPermissionData!.reset(parsedInput.requestedPerms.bitfield);
                        return ctx.channel.send(this.utils.embedifyString(ctx.guild, `Reset the following permissions for ${parsedInput.found}\n•\`${parsedInput.requestedPerms.toArray().join("`\n•`")}\``));
                    }
            }
        }
    }
}

function displayUsersOrRoles(rolesOrUsersCollection: Collection<string, GuildPermission>, isRole: boolean = false) {
    const IDsArray = [];
    for (const id of rolesOrUsersCollection.keys()) IDsArray.push(id);
    return IDsArray.length > 0 ? `•<@${isRole ? "&" : ""}${IDsArray.join(`>\n•<@${isRole ? "&" : ""}`)}>` : null;
}

async function parseInput(input: string, guild: Guild): Promise<ParsedInput> {
    const idMatch = /(?:<@&?!?)?(?<id>\d{16,})(?:>?)/.exec(input);
    const optionMatch = /(\badd\b|\bgive\b|\ballow\b|\bremove\b|\brem\b|\btake\b|\bdeny\b|\bdelete\b|\bres\b|\breset\b|\bdefault\b)/.exec(input);
    const forRolesOrUsersMatch = /(\br\b|\brole\b|\broles\b|\bu\b|\buser\b|\busers\b)/.exec(input);
    if (idMatch) input = input.replace(idMatch[0], "");
    if (optionMatch) input = input.replace(optionMatch[0], "");
    if (forRolesOrUsersMatch) input = input.replace(forRolesOrUsersMatch[0], "");
    const finalPermissions = new InternalPermissions();
    for (const permName of input.trim().replace(/[,]/, " ").toUpperCase().split(/\s+/).filter(v => v !== "" && v !== " "))
        if (permName === "ALL") {
            finalPermissions.add(InternalPermissions.ALL);
            break;
        } else if (managablePermissions.includes(permName)) finalPermissions.add(permName);

    const objToReturn: ParsedInput = {
        id: (idMatch ?? [])[1],
        option: ((optionMatch ?? [])[1]) as unknown as ParsedInput["option"],
        forRolesOrUsers: ((forRolesOrUsersMatch ?? [])[1]?.toLowerCase() || "all") as unknown as ParsedInput["forRolesOrUsers"],
        requestedPerms: finalPermissions
    };
    objToReturn.found = objToReturn.id ? await findRoleOrUser(guild, objToReturn.id) : null;

    return objToReturn;
}

export interface ParsedInput {
    id?: string,
    found?: GuildMember | Role | null,
    option?: "add" | "give" | "allow" | "remove" | "rem" | "take" | "deny" | "delete" | "res" | "reset" | "default"
    forRolesOrUsers: "roles" | "role" | "r" | "users" | "user" | "u" | "all"
    requestedPerms: InternalPermissions,
}

async function findRoleOrUser(guild: Guild, id: string) {
    if (!id) return;
    return await guild.members.fetch(id) || await guild.roles.fetch(id);
}

function displayPermissions(permissions: GuildPermission, memberOrRole: GuildMember | Role) {
    const final = permissions.calculatePermissions(memberOrRole).toArray();
    return final.length ? `•\`${final.join("`\n•`")}\`` : "**NO PERMISSIONS**";
}