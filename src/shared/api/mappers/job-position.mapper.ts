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
    }
}
