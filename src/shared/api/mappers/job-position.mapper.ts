/* -------------------------------------------------------------------------- */
/* CREATE */
/* -------------------------------------------------------------------------- */
export function mapJobPositionCreatePayload(
    form: any
) {
    return {
        name: form.name,
        description: form.description || null,
        status: form.status,
        max_holders: form.maxHolders ? Number(form.maxHolders) : null,
        role_name: form.roleName || null,
        default_context: form.defaultContext && Object.keys(form.defaultContext).length ? form.defaultContext : null,
    }
}

/* -------------------------------------------------------------------------- */
/* UPDATE */
/* -------------------------------------------------------------------------- */
export function mapJobPositionUpdatePayload(
    form: any
) {
    return {
        name: form.name,
        description: form.description || null,
        status: form.status,
        max_holders: form.maxHolders ? Number(form.maxHolders) : null,
        role_name: form.roleName || null,
        default_context: form.defaultContext && Object.keys(form.defaultContext).length ? form.defaultContext : null,
    }
}
