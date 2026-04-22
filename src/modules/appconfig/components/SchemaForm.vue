<template>
    <div class="space-y-5">
        <div v-for="(keyDef, keyName) in schema.keys" :key="keyName"
             v-show="isVisible(keyName, keyDef)"
             class="block">

            <!-- BOOL → switch -->
            <label v-if="keyDef.type === 'bool'" class="inline-flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    :checked="!!(model[keyName] as any)"
                    @change="setValue(keyName, ($event.target as HTMLInputElement).checked)"
                />
                <span class="text-sm font-semibold text-slate-700">{{ keyDef.label }}</span>
            </label>

            <!-- ENUM (values array) → select -->
            <template v-else-if="keyDef.values && keyDef.values.length > 0">
                <span class="text-xs font-semibold text-slate-600">{{ keyDef.label }}</span>
                <select
                    :value="model[keyName] as any"
                    @change="setValue(keyName, ($event.target as HTMLSelectElement).value)"
                    class="mt-1 w-full h-9 border rounded-md px-3 text-sm bg-white"
                >
                    <option v-for="opt in keyDef.values" :key="opt" :value="opt">{{ opt }}</option>
                </select>
            </template>

            <!-- INT -->
            <template v-else-if="keyDef.type === 'int'">
                <span class="text-xs font-semibold text-slate-600">{{ keyDef.label }}</span>
                <input
                    type="number"
                    :min="keyDef.min ?? undefined"
                    :max="keyDef.max ?? undefined"
                    :value="model[keyName] as any"
                    @input="setValue(keyName, Number(($event.target as HTMLInputElement).value))"
                    :placeholder="keyDef.placeholder ?? ''"
                    class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                />
            </template>

            <!-- JSON -->
            <template v-else-if="keyDef.type === 'json'">
                <span class="text-xs font-semibold text-slate-600">{{ keyDef.label }}</span>
                <textarea
                    :value="stringifyJson(model[keyName])"
                    @input="onJsonInput(keyName, ($event.target as HTMLTextAreaElement).value)"
                    rows="4"
                    class="mt-1 w-full border rounded-md px-3 py-2 text-xs font-mono"
                    :class="jsonErrors[keyName] ? 'border-red-400' : ''"
                    spellcheck="false"
                />
                <span v-if="jsonErrors[keyName]" class="text-[10px] text-red-600">
                    JSON inválido
                </span>
            </template>

            <!-- SECRET -->
            <template v-else-if="keyDef.secret">
                <span class="text-xs font-semibold text-slate-600">
                    {{ keyDef.label }}
                    <span v-if="secretHasValue(keyName)" class="ml-1 text-[10px] text-emerald-600 font-bold uppercase">Configurado</span>
                </span>
                <input
                    type="password"
                    :value="secretInput[keyName] ?? ''"
                    @input="onSecretInput(keyName, ($event.target as HTMLInputElement).value)"
                    :placeholder="secretHasValue(keyName) ? '(dejar vacío para conservar)' : (keyDef.placeholder ?? '')"
                    class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                    autocomplete="off"
                />
            </template>

            <!-- STRING (default) -->
            <template v-else>
                <span class="text-xs font-semibold text-slate-600">{{ keyDef.label }}</span>
                <input
                    type="text"
                    :value="model[keyName] as any"
                    @input="setValue(keyName, ($event.target as HTMLInputElement).value)"
                    :placeholder="keyDef.placeholder ?? ''"
                    class="mt-1 w-full h-9 border rounded-md px-3 text-sm"
                />
            </template>

            <span v-if="keyDef.help" class="block mt-1 text-[10px] text-slate-400">{{ keyDef.help }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ConfigSchemaDef, ConfigKeyDef, ConfigValueResponse } from '@/modules/appconfig/types/appconfig.type'
import { isSecretPlaceholder } from '@/modules/appconfig/types/appconfig.type'

const props = defineProps<{
    schema: ConfigSchemaDef
    values: Record<string, ConfigValueResponse>
}>()

const emit = defineEmits<{
    (e: 'change', payload: Record<string, unknown>): void
}>()

const model = reactive<Record<string, unknown>>({})
const secretInput = reactive<Record<string, string>>({})
const jsonErrors = reactive<Record<string, boolean>>({})

function isVisible(_keyName: string, keyDef: ConfigKeyDef): boolean {
    if (!keyDef.requires) return true
    for (const [depKey, allowed] of Object.entries(keyDef.requires)) {
        const current = model[depKey]
        if (allowed === '*') {
            // cualquier valor truthy
            if (!current) return false
        } else if (Array.isArray(allowed)) {
            if (!allowed.includes(current as any)) return false
        } else if (current !== allowed) {
            return false
        }
    }
    return true
}

function secretHasValue(keyName: string): boolean {
    const v = props.values[keyName]
    return isSecretPlaceholder(v) ? v.has_value : false
}

function stringifyJson(v: unknown): string {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v
    try {
        return JSON.stringify(v, null, 2)
    } catch {
        return ''
    }
}

function onJsonInput(keyName: string, raw: string) {
    if (raw.trim() === '') {
        jsonErrors[keyName] = false
        setValue(keyName, null)
        return
    }
    try {
        const parsed = JSON.parse(raw)
        jsonErrors[keyName] = false
        setValue(keyName, parsed)
    } catch {
        jsonErrors[keyName] = true
        // guardamos el string tal cual para que el usuario siga editando, pero no emitimos cambio
        model[keyName] = raw
    }
}

function onSecretInput(keyName: string, value: string) {
    secretInput[keyName] = value
    // Cuando el usuario escribe algo, emitimos ese valor. Cuando vacía,
    // emitimos un marcador "__keep__" para que el backend conserve el valor actual.
    if (value === '' && secretHasValue(keyName)) {
        model[keyName] = { __keep__: true } as any
    } else {
        model[keyName] = value
    }
    emit('change', buildPayload())
}

function setValue(keyName: string, value: unknown) {
    model[keyName] = value
    emit('change', buildPayload())
}

function buildPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(model)) {
        if (props.schema.keys[k]?.type === 'json' && jsonErrors[k]) continue
        out[k] = v
    }
    return out
}

// Hidrata el modelo desde props cuando llegan/cambian
watch(() => [props.schema, props.values], () => {
    // reset
    for (const k of Object.keys(model)) delete model[k]
    for (const k of Object.keys(secretInput)) delete secretInput[k]
    for (const k of Object.keys(jsonErrors)) delete jsonErrors[k]

    for (const [keyName, keyDef] of Object.entries(props.schema.keys)) {
        const raw = props.values[keyName]
        if (keyDef.secret) {
            // no copiamos el secreto al modelo (el backend nos da placeholder)
            model[keyName] = isSecretPlaceholder(raw) && raw.has_value
                ? ({ __keep__: true } as any)
                : ''
        } else if (keyDef.type === 'bool') {
            model[keyName] = !!raw
        } else if (keyDef.type === 'int') {
            model[keyName] = raw === null || raw === undefined ? (keyDef.default ?? null) : Number(raw)
        } else if (keyDef.type === 'json') {
            model[keyName] = raw ?? keyDef.default ?? null
        } else {
            model[keyName] = raw ?? keyDef.default ?? ''
        }
    }
}, { immediate: true, deep: true })
</script>
