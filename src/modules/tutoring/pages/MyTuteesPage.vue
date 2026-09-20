<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Tutorados</h1>
        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!assignments.length" class="rounded-lg border bg-amber-50 border-amber-200 px-4 py-6 text-sm text-amber-800">
            No tienes asignaciones de tutoría activas.
        </div>
        <div v-else class="space-y-4">
            <div v-for="a in assignments" :key="a.id" class="rounded-xl border bg-white p-5 hover:shadow-sm cursor-pointer" @click="goDetail(a.id)">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">
                            {{ a.scope === 'grupal' ? ('Grupo ' + (a.group_name ?? '')) : 'Tutoría individual' }}
                            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" :class="a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">{{ a.status === 'active' ? 'Activa' : 'Cerrada' }}</span>
                        </p>
                        <p class="text-xs text-slate-400">{{ a.career_name ?? 'Sin carrera' }} · {{ a.period_name }}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-blue-600">{{ a.tutees.length }}</p>
                        <p class="text-[10px] uppercase text-slate-400">tutorados</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TutoringAssignment } from '@/modules/tutoring/types/tutoring.type'

const T = API.TUTORING_API
const router = useRouter()
const loading = ref(true)
const assignments = ref<TutoringAssignment[]>([])

function goDetail(id: number) { router.push({ name: 'tutoring.assignment-detail', params: { id } }) }

onMounted(async () => {
    try { assignments.value = (await api.get(T.me.tutees)).data ?? [] }
    finally { loading.value = false }
})
</script>
