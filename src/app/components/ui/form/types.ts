export interface FieldError {
    message: string
}

export type FormErrors<T> = Partial<Record<keyof T, FieldError>>
