import InternalPermissions from '../utils/InternalPermissions';

export const DefaultGuildPermissionsData = {
    allowed: InternalPermissions.DEFAULT,
    denied: 0
}

export interface IGuildPermissionsData {
    allowed?: number,
    denied?: number
}

export default IGuildPermissionsData;