export function required(value: any): string | null {
    if (value === null || value === undefined || value === '') {
        return 'Este campo es obligatorio'
    }
    return null
}

export function email(value: string): string | null {
    if (!value) return null
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value)
        ? null
        : 'Correo electrónico inválido'
}

export function minLength(length: number) {
    return (value: string) => {
        if (!value) return null
        return value.length >= length
            ? null
            : `Debe tener al menos ${length} caracteres`
    }
}
