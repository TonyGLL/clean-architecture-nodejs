import { RolePermissions } from "../../application/dtos/role.dto";

export class Role {
    constructor(
        public id: string | null,
        public name: string,
        public description: string,
        public permissions?: RolePermissions[]
    ) { }
}
