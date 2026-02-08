import { reactive } from 'vue'

type FormErrors = Record<string, string | null>

export function useFormErrors<T extends Record<string, any>>() {
    const errors = reactive<FormErrors>({})

    /**
     * Asigna errores desde backend (Laravel style)
     */
    function setErrors(backendErrors: Record<string, string[]>) {
        clearErrors()

        for (const field in backendErrors) {
            errors[field] = backendErrors[field][0]
        }
    }

    /**
     * Limpia todos los errores
     */
    function clearErrors() {
        Object.keys(errors).forEach(key => {
            errors[key] = null
        })
    }

    /**
     * Limpia error de un campo específico
     */
    function clearError(field: keyof T | string) {
        errors[field as string] = null
    }

    return {
        errors,
        setErrors,
        clearErrors,
        clearError,
    }
}
