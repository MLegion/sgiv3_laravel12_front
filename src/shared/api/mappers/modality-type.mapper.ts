export function mapModalityTypeCreatePayload(form: any) {
    return {
        name: form.name,
        short_name: form.shortName,
        config: JSON.stringify(form.config),
        is_active: form.isActive,
    }
}

export function mapModalityTypeUpdatePayload(form: any) {
    return mapModalityTypeCreatePayload(form)
}
