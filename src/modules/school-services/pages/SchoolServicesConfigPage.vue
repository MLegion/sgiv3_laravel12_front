<template>
    <div class="space-y-5 max-w-4xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración — Servicios Escolares</h1>
                <p class="mt-1 text-sm text-slate-500">Define cómo se estructura el número de control de los estudiantes.</p>
            </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>

        <div v-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Form -->
            <div class="md:col-span-2 bg-white border rounded-xl shadow-sm p-6 space-y-5">
                <div>
                    <label class="text-xs font-bold uppercase text-slate-700 mb-1 block">Formato del número de control</label>
                    <input
                        v-model="form.control_number_format"
                        type="text"
                        class="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="{YY}N{SEQ4}"
                    />
                    <p v-if="formatError" class="mt-1 text-xs text-red-600">{{ formatError }}</p>
                </div>

                <!-- Tokens disponibles -->
                <div>
                    <p class="text-xs font-bold uppercase text-slate-500 mb-2">Tokens disponibles</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div v-for="t in tokens" :key="t.token" class="flex items-center gap-2 p-2 border rounded bg-slate-50">
                            <button
                                type="button"
                                class="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono text-[10px] hover:bg-indigo-700"
                                @click="insertToken(t.token)"
                            >
                                {{ t.token }}
                            </button>
                            <span class="text-slate-600">{{ t.label }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3 pt-4 border-t">
                    <button
                        class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
                        :disabled="submitting || !!formatError"
                        @click="save"
                    >
                        GUARDAR
                    </button>
                    <span v-if="saved" class="text-xs text-emerald-600 font-semibold">Configuración guardada</span>
                </div>
            </div>

            <!-- Preview -->
            <div class="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm p-5 space-y-4">
                <h3 class="text-xs font-black uppercase text-indigo-800">Vista previa</h3>

                <div class="space-y-1">
                    <label class="text-[10px] font-bold uppercase text-indigo-700">Año</label>
                    <input
                        v-model.number="previewYear"
                        type="number"
                        class="w-full px-2 py-1.5 text-sm font-mono border border-indigo-300 rounded"
                    />
                </div>

                <div class="space-y-2">
                    <p class="text-[10px] font-bold uppercase text-indigo-700">Resultado</p>
                    <div
                        v-for="n in [1, 2, 42, 999]"
                        :key="n"
                        class="flex items-center justify-between p-2 bg-white rounded border border-indigo-200"
                    >
                        <span class="text-[10px] uppercase font-bold text-slate-500">N° {{ n }}</span>
                        <code class="text-sm font-bold text-indigo-900">{{ previewFor(n) }}</code>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const loading    = ref(true)
const submitting = ref(false)
const saved      = ref(false)
const error      = ref<string | null>(null)

const form = reactive({
    control_number_format: '{YY}N{SEQ4}',
})

const previewYear = ref(new Date().getFullYear())

const tokens = [
    { token: '{YY}',   label: '2 últimos dígitos del año' },
    { token: '{YYYY}', label: 'Año completo (4 dígitos)' },
    { token: '{SEQ}',  label: 'Secuencia sin padding' },
    { token: '{SEQ4}', label: 'Secuencia con 4 dígitos' },
    { token: '{SEQ5}', label: 'Secuencia con 5 dígitos' },
    { token: '{SEQ6}', label: 'Secuencia con 6 dígitos' },
]

const formatError = computed<string | null>(() => {
    const f = form.control_number_format
    if (!f || !f.trim()) return 'El formato es obligatorio.'
    if (!/\{SEQ[0-9]*\}/.test(f)) return 'Debe incluir al menos un token de secuencia: {SEQ}, {SEQ4}, {SEQ5} o {SEQ6}.'
    return null
})

function previewFor(n: number): string {
    const f = form.control_number_format
    if (!f) return ''
    const year = previewYear.value
    let out = f.replace('{YY}', String(year).slice(-2)).replace('{YYYY}', String(year))
    const m = out.match(/\{SEQ(\d*)\}/)
    if (m) {
        const width = m[1] ? parseInt(m[1], 10) : 0
        const seqStr = width > 0 ? String(n).padStart(width, '0') : String(n)
        out = out.replace(m[0], seqStr)
    }
    return out
}

function insertToken(token: string) {
    form.control_number_format += token
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.sesConfig.show)
        form.control_number_format = data?.controlNumberFormat ?? '{YY}N{SEQ4}'
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la configuración.'
    } finally {
        loading.value = false
    }
}

async function save() {
    if (formatError.value) return
    error.value = null
    saved.value = false
    submitting.value = true
    try {
        const { data } = await api.put(API.SCHOOL_SERVICES_API.sesConfig.update, {
            control_number_format: form.control_number_format,
        })
        form.control_number_format = data?.controlNumberFormat ?? form.control_number_format
        saved.value = true
        setTimeout(() => { saved.value = false }, 2500)
    } catch (e: any) {
        error.value = e?.response?.data?.errors?.control_number_format?.[0]
                   ?? e?.response?.data?.message
                   ?? 'No se pudo guardar.'
    } finally {
        submitting.value = false
    }
}

watch(() => form.control_number_format, () => { saved.value = false })

onMounted(load)
</script>
