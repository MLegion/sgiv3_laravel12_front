<template>
    <div class="max-w-3xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">MODALIDAD DE EXAMEN POR MODALIDAD</h1>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            Cada modalidad puede tener su propia modalidad de examen. Es útil cuando una sede o
            extensión no cuenta con la misma infraestructura que la sede principal — por ejemplo,
            Escolarizada-Centro en presencial y Escolarizada-Norte en online. Las modalidades que
            dejes en <strong>"Usar default del plantel"</strong> heredan el valor configurado en
            <strong>Configuración de Admisión → Modalidad del Examen</strong>.
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando modalidades...</div>

        <div v-else-if="!rows.length" class="bg-white border rounded-xl shadow-sm p-10 text-center text-sm text-slate-400">
            No hay modalidades activas registradas para este plantel.
        </div>

        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                <thead class="bg-slate-50 border-b">
                    <tr>
                        <th scope="col" class="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Modalidad</th>
                        <th scope="col" class="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 w-72">Modalidad de examen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rows" :key="row.modalityId" class="border-b last:border-b-0 hover:bg-slate-50">
                        <td class="px-4 py-3 align-middle">
                            <div class="font-semibold text-slate-700">{{ row.campusName ?? '—' }}</div>
                            <div class="text-xs text-slate-500">{{ row.modalityTypeName ?? row.modalityLabel ?? '—' }}</div>
                        </td>
                        <td class="px-4 py-3 align-middle">
                            <div class="flex items-center gap-2">
                                <select
                                    :value="row.override ?? ''"
                                    :disabled="row._saving"
                                    @change="onChange(row, ($event.target as HTMLSelectElement).value)"
                                    class="border-2 rounded-lg px-3 py-2 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    :class="row.override ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'"
                                >
                                    <option value="">— Usar default del plantel —</option>
                                    <option value="online">En línea</option>
                                    <option value="presencial">Presencial</option>
                                    <option value="mixto">Mixto (aspirante elige)</option>
                                </select>
                                <span v-if="row._saving" class="text-xs text-slate-400">guardando…</span>
                                <span v-else-if="row._savedAt" class="text-xs text-emerald-600">✓</span>
                                <span v-else-if="row._error" class="text-xs text-red-600">{{ row._error }}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface OverrideRow {
    modalityId: number
    modalityLabel: string | null
    campusName: string | null
    modalityTypeName: string | null
    modalityShort: string | null
    override: 'online' | 'presencial' | 'mixto' | null
    _saving?: boolean
    _savedAt?: number | null
    _error?: string | null
}

const rows    = ref<OverrideRow[]>([])
const loading = ref(true)

async function fetchAll() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examModeOverrides.list)
        rows.value = Array.isArray(data) ? data.map((r: any) => ({
            ...r,
            _saving: false,
            _savedAt: null,
            _error: null,
        })) : []
    } finally {
        loading.value = false
    }
}

async function onChange(row: OverrideRow, raw: string) {
    const mode = raw === '' ? null : (raw as 'online' | 'presencial' | 'mixto')
    row._saving  = true
    row._error   = null
    row._savedAt = null
    try {
        const { data } = await api.put(
            API.ADMISSIONS_API.examModeOverrides.update(row.modalityId),
            { mode },
        )
        row.override = (data?.override ?? null) as OverrideRow['override']
        row._savedAt = Date.now()
        // Limpiar la marca de éxito tras 2s — basta para feedback visual.
        setTimeout(() => { if (row._savedAt) row._savedAt = null }, 2000)
    } catch (e: any) {
        row._error = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally {
        row._saving = false
    }
}

onMounted(fetchAll)
</script>
