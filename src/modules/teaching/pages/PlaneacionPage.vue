<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Planeación</h1>
            <p class="text-sm text-slate-500 mt-1">
                Instrumentación didáctica de tus grupos asignados.
            </p>
        </div>

        <!-- Selección de la asignación de curso -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-end gap-3">
            <div class="w-64">
                <FormInput label="ASIGNACIÓN DE CURSO (ID)" type="number" v-model="assignmentId" />
            </div>
            <button
                type="button"
                class="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60"
                :disabled="!assignmentId || loading"
                @click="load"
            >
                {{ loading ? 'Cargando…' : 'Ver instrumentaciones' }}
            </button>
            <button
                v-if="assignmentId"
                type="button"
                class="ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'teaching.planeacion.create', query: { teacher_assignment_id: assignmentId } })"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVA INSTRUMENTACIÓN
            </button>
        </div>

        <div v-if="loaded" class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                        <th class="text-left px-4 py-2">#</th>
                        <th class="text-left px-4 py-2">Título</th>
                        <th class="text-left px-4 py-2">Programa</th>
                        <th class="text-left px-4 py-2">Estado</th>
                        <th class="text-right px-4 py-2">Opciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="inst in items" :key="inst.id" class="border-t border-slate-100">
                        <td class="px-4 py-2">{{ inst.id }}</td>
                        <td class="px-4 py-2">{{ inst.title ?? '(sin título)' }}</td>
                        <td class="px-4 py-2">{{ inst.studyProgram?.name ?? '—' }}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="statusClass(inst.status)">
                                {{ statusLabel(inst.status) }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button class="text-blue-600 hover:text-blue-800 text-sm" @click="router.push({ name: 'teaching.planeacion.edit', params: { id: inst.id } })">
                                Editar
                            </button>
                        </td>
                    </tr>
                    <tr v-if="!items.length">
                        <td colspan="5" class="px-4 py-6 text-center text-slate-400 text-sm">
                            Sin instrumentaciones para esta asignación.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()

const assignmentId = ref<string>((route.query.teacher_assignment_id as string) ?? '')
const items = ref<any[]>([])
const loading = ref(false)
const loaded = ref(false)

async function load() {
    if (!assignmentId.value) return
    loading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.instrumentations.list, {
            params: { teacher_assignment_id: assignmentId.value },
        })
        items.value = Array.isArray(data) ? data : (data.items ?? [])
        loaded.value = true
    } finally {
        loading.value = false
    }
}

function statusLabel(s: string): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA' } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(() => {
    if (assignmentId.value) load()
})
</script>
