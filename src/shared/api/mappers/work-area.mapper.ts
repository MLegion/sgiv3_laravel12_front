export function mapWorkAreaCreatePayload(form: {
    name: string
    description?: string
    status: boolean
}) {
    return {
        name: form.name,
        description: form.description,
        status: form.status,
    }
}

export function mapWorkAreaUpdatePayload(form: {
    name: string
    description?: string
    status: boolean
}) {
    return {
        name: form.name,
        description: form.description,
        status: form.status,
    }
}
