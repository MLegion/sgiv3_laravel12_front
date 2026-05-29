<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Enlaces de programas de estudio</h1>
            <p class="text-sm text-slate-500 mt-1">
                Materias activas en la currícula de planes activos. Asigna el link del programa oficial
                (preferir <code>tecnm.mx</code>). Usa "Buscar en web" para las de especialidad que faltan.
            </p>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <input
                v-model="search"
                type="text"
                placeholder="Filtrar por clave o nombre…"
                class="w-72 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="onlyMissing" /> Solo sin link
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="onlyActiveStudents" /> Solo con estudiantes activos
            </label>
            <span class="ml-auto text-xs text-slate-400">
                {{ filtered.length }} de {{ rows.length }} · con link: {{ linkedCount }}
            </span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                        <th class="text-left px-3 py-2">Clave</th>
                        <th class="text-left px-3 py-2">Materia</th>
                        <th class="text-center px-3 py-2">Alumnos</th>
                        <th class="text-left px-3 py-2">Programa oficial</th>
                        <th class="text-right px-3 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="r in filtered" :key="r.id" class="border-t border-slate-100 align-top">
                        <td class="px-3 py-2 font-mono">{{ r.clave }}</td>
                        <td class="px-3 py-2">{{ r.name }}</td>
                        <td class="px-3 py-2 text-center">
                            <span v-if="r.hasActiveStudents" class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">Sí</span>
                            <span v-else class="text-slate-300">—</span>
                        </td>
                        <td class="px-3 py-2">
                            <a v-if="r.programUrl" :href="r.programUrl" target="_blank" rel="noopener" class="text-blue-600 hover:underline break-all">Abrir PDF</a>
                            <span v-else-if="r.checked" class="text-amber-600 text-xs">Sin link (revisado)</span>
                            <span v-else class="text-slate-400 text-xs">Pendiente</span>
                        </td>
                        <td class="px-3 py-2">
                            <div class="flex items-center justify-end gap-2">
                                <a
                                    :href="googleUrl(r)"
                                    target="_blank"
                                    rel="noopener"
                                    class="px-2 py-1 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                                >Buscar en web</a>
                                <input
                                    v-model="drafts[r.id]"
                                    type="url"
                                    placeholder="Pega el URL del PDF…"
                                    class="w-56 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    class="px-2 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    :disabled="saving === r.id"
                                    @click="save(r)"
                                >{{ saving === r.id ? '…' : 'Guardar' }}</button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="loading">
                        <td colspan="5" class="px-3 py-6 text-center text-slate-400 text-sm">Cargando…</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const rows = ref<any[]>([])
const drafts = reactive<Record<number, string>>({})
const loading = ref(false)
const saving = ref<number | null>(null)
const search = ref('')
const onlyMissing = ref(false)
const onlyActiveStudents = ref(false)

const linkedCount = computed(() => rows.value.filter(r => r.programUrl).length)

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return rows.value.filter(r =>
        (!onlyMissing.value || !r.programUrl) &&
        (!onlyActiveStudents.value || r.hasActiveStudents) &&
        (!q || r.clave.toLowerCase().includes(q) || (r.name ?? '').toLowerCase().includes(q))
    )
})

function googleUrl(r: any): string {
    const q = `${r.clave} ${r.name} programa de estudio TecNM pdf`
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.STUDY_PROGRAMS_API.subjectLinks.list)
        rows.value = Array.isArray(data) ? data : (data.items ?? [])
        for (const r of rows.value) drafts[r.id] = r.programUrl ?? ''
    } finally {
        loading.value = false
    }
}

async function save(r: any) {
    saving.value = r.id
    try {
        const url = (drafts[r.id] ?? '').trim() || null
        await api.patch(API.STUDY_PROGRAMS_API.subjectLinks.setUrl(r.id), { program_url: url })
        r.programUrl = url
        r.checked = true
    } finally {
        saving.value = null
    }
}

onMounted(load)
</script>
