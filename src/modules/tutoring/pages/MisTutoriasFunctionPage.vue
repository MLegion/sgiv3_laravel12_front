<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">{{ title }}</h1>
            <div v-if="options.length > 1" class="flex items-center gap-2">
                <label class="text-xs font-semibold text-slate-500">Asignación:</label>
                <select v-model.number="selectedId" class="rounded-lg border-slate-300 text-sm">
                    <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
                </select>
            </div>
            <span v-else-if="options.length === 1" class="text-xs text-slate-400">{{ options[0].label }}</span>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!options.length" class="rounded-lg border bg-amber-50 border-amber-200 px-4 py-6 text-sm text-amber-800">
            {{ grupalOnly ? 'No tienes asignaciones de tutoría GRUPAL activas.' : 'No tienes asignaciones de tutoría activas.' }}
        </div>
        <!-- Reusa las páginas en modo embebido (una sola función, sin header/back).
             El key incluye `only`: al cambiar de menú (misma ruta-componente) se re-monta. -->
        <template v-else-if="selectedId">
            <AssignmentFollowupsPage v-if="only === 'seguimientos'" :id="selectedId" :embedded="true" :key="`f:${selectedId}`" />
            <AssignmentDetailPage v-else :id="selectedId" :only="only" :key="`${selectedId}:${only}`" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import AssignmentDetailPage from '@/modules/tutoring/pages/AssignmentDetailPage.vue'
import AssignmentFollowupsPage from '@/modules/tutoring/pages/AssignmentFollowupsPage.vue'

const props = defineProps<{ only: string; title: string; grupalOnly?: boolean }>()
const T = API.TUTORING_API

const loading = ref(true)
const assignments = ref<any[]>([])
const selectedId = ref<number | null>(null)

const options = computed(() => assignments.value
    .filter((a: any) => !props.grupalOnly || a.scope === 'grupal')
    .map((a: any) => ({
        id: a.id,
        label: (a.scope === 'grupal' ? 'Grupo ' + (a.group_name ?? '') : 'Tutoría individual')
            + ' · ' + (a.career_name ?? 'Sin carrera') + ' · ' + a.period_name,
    })))

// El componente se reutiliza entre las rutas de "Mis Tutorías"; al cambiar de menú
// (cambia only/grupalOnly) revalida la selección contra las opciones aplicables.
watch(options, (opts) => {
    if (!opts.find(o => o.id === selectedId.value)) selectedId.value = opts[0]?.id ?? null
})

onMounted(async () => {
    try {
        assignments.value = (await api.get(T.me.tutees)).data ?? []
        if (options.value.length) selectedId.value = options.value[0].id
    } finally { loading.value = false }
})
</script>
