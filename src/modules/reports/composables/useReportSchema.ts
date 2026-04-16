import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { SchemaResponse, TableSchema, ColumnSchema, RelationSchema } from '@/modules/reports/types/schema.type'

/**
 * Composable para cargar y cachear el schema del backend.
 *
 * El schema cambia muy poco, así que lo cacheamos a nivel de módulo
 * (shared entre todas las instancias del composable) durante la sesión.
 * La primera llamada hace el fetch; las siguientes retornan el cache.
 */

// ── Estado compartido ───────────────────────────────────────────
const tables = ref<TableSchema[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const loaded = ref(false)

let inFlight: Promise<void> | null = null

async function loadSchema(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (inFlight) return inFlight

    inFlight = (async () => {
        loading.value = true
        error.value = null
        try {
            const { data } = await api.get<SchemaResponse>(API.REPORTS_API.schema.get, {
                params: force ? { refresh: 1 } : {},
            })
            tables.value = data?.tables ?? []
            loaded.value = true
        } catch (e: any) {
            error.value = e?.response?.data?.message ?? e?.message ?? 'Error al cargar el schema'
            tables.value = []
            loaded.value = false
        } finally {
            loading.value = false
            inFlight = null
        }
    })()

    return inFlight
}

export function useReportSchema() {
    // ── Lookups útiles para el Query Builder ───────────────────
    const tablesByName = computed<Record<string, TableSchema>>(() => {
        const map: Record<string, TableSchema> = {}
        for (const t of tables.value) map[t.name] = t
        return map
    })

    function getTable(name: string): TableSchema | null {
        return tablesByName.value[name] ?? null
    }

    function getColumns(tableName: string): ColumnSchema[] {
        return getTable(tableName)?.columns ?? []
    }

    function getRelations(tableName: string): RelationSchema[] {
        return getTable(tableName)?.relations ?? []
    }

    /**
     * Devuelve relaciones inversas (otras tablas que apuntan a esta).
     * Útil para sugerir JOINs "de muchos".
     */
    function getInverseRelations(tableName: string): Array<{ fromTable: string; foreignKey: string; column: string }> {
        const result: Array<{ fromTable: string; foreignKey: string; column: string }> = []
        for (const t of tables.value) {
            for (const rel of t.relations) {
                if (rel.references.table === tableName) {
                    result.push({
                        fromTable: t.name,
                        foreignKey: rel.foreignKey,
                        column: rel.references.column,
                    })
                }
            }
        }
        return result
    }

    /**
     * Busca una FK entre dos tablas (en cualquier dirección).
     * Retorna null si no hay relación directa detectada.
     */
    function findRelationBetween(fromTable: string, toTable: string): {
        direction: 'forward' | 'inverse'
        fromColumn: string
        toColumn: string
    } | null {
        // Directa: fromTable → toTable (fromTable tiene FK hacia toTable)
        const from = getTable(fromTable)
        if (from) {
            const forward = from.relations.find(r => r.references.table === toTable)
            if (forward) {
                return {
                    direction: 'forward',
                    fromColumn: forward.foreignKey,
                    toColumn: forward.references.column,
                }
            }
        }

        // Inversa: toTable → fromTable
        const to = getTable(toTable)
        if (to) {
            const inverse = to.relations.find(r => r.references.table === fromTable)
            if (inverse) {
                return {
                    direction: 'inverse',
                    fromColumn: inverse.references.column,
                    toColumn: inverse.foreignKey,
                }
            }
        }

        return null
    }

    return {
        // estado
        tables,
        loading,
        error,
        loaded,

        // acciones
        loadSchema,
        refresh: () => loadSchema(true),

        // lookups
        tablesByName,
        getTable,
        getColumns,
        getRelations,
        getInverseRelations,
        findRelationBetween,
    }
}
