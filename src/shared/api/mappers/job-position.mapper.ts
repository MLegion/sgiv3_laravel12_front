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
    }
}
