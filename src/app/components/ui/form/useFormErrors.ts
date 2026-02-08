import { reactive, computed } from 'vue'

type FormErrors = Record<string, string | null>

export function useFormErrors<T extends Record<string, any>>() {
    const errors = reactive<FormErrors>({})

    /**
     * Setea errores provenientes del backend (422)
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
     * Limpia un error específico
     */
    function clearError(field: keyof T | string) {
        errors[field as string] = null
    }

    /**
     * Indica si existen errores activos
     */
    const hasErrors = computed(() => {
        return Object.values(errors).some(error => !!error)
    })

    /**
     * Valida campos requeridos
     */
    function validateRequired(fields: (keyof T)[]) {
        fields.forEach(field => {
            if (!errors[field as string]) {
                errors[field as string] = 'Campo requerido'
            }
        })
    }

    return {
        errors,
        setErrors,
        clearErrors,
        clearError,
        hasErrors,
        validateRequired,
    }
}
