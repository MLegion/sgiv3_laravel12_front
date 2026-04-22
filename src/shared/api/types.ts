// ApiDefinition representa una entrada del registry.
// Permite valores de hoja (string o factory) o estructura anidada arbitraria.
// Se modela con `any` en los niveles internos para evitar falsos positivos de
// TS al acceder formas anidadas (ej: `API.X.entity.byId(...)`).
export type ApiDefinition =
    | string
    | ((...args: any[]) => string)
    | { [key: string]: any }

export interface ApiModule {
    name: string
    api: Record<string, any>
}

export type ApiRegistry = Record<string, any>
