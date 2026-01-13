export type ApiDefinition =
    | string
    | ((...args: any[]) => string)

export interface ApiModule {
    name: string
    api: Record<string, ApiDefinition>
}

export type ApiRegistry = Record<string, Record<string, ApiDefinition>>
