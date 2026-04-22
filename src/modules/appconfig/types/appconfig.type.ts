export type ConfigValueType = 'string' | 'int' | 'bool' | 'json' | 'datetime' | 'encrypted'
export type ConfigScope = 'global' | 'college' | 'user'

export interface ConfigKeyDef {
    key: string
    type: ConfigValueType
    label: string
    default: unknown
    secret: boolean
    help: string | null
    placeholder: string | null
    group: string | null
    values: string[] | null       // para "enum" via values
    min: number | null
    max: number | null
    requires: Record<string, unknown> | null
    unique_across_scope: boolean
}

export interface ConfigSchemaDef {
    app_id: string
    label: string
    description: string | null
    icon: string | null
    permission: string | null
    scopes: ConfigScope[]
    keys: Record<string, ConfigKeyDef>
}

export interface ConfigSchemaSummary {
    app_id: string
    label: string
    description: string | null
    icon: string | null
    permission: string | null
}

export interface SecretPlaceholder {
    __secret__: true
    has_value: boolean
    from_global?: boolean
}

export type ConfigValueResponse = string | number | boolean | null | unknown[] | Record<string, unknown> | SecretPlaceholder

export interface AppConfigResponse {
    schema: ConfigSchemaDef
    scope: ConfigScope
    scope_id: number | null
    values: Record<string, ConfigValueResponse>
}

export function isSecretPlaceholder(v: unknown): v is SecretPlaceholder {
    return !!v && typeof v === 'object' && (v as any).__secret__ === true
}
