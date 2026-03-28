<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Detalle del Campus</h1>
            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                    @click="router.push({ name: 'school-services.campuses.edit', params: { id: route.params.id } })"
                >EDITAR</button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400">Cargando...</div>

        <template v-else-if="campus">
            <!-- Info general -->
            <div class="bg-white border rounded-xl shadow-sm p-6">
                <h2 class="text-sm font-semibold text-slate-500 uppercase mb-4">Información General</h2>
                <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><dt class="text-slate-400 text-xs uppercase">Nombre</dt><dd class="font-medium">{{ campus.name }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Nombre Corto</dt><dd>{{ campus.shortName ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Institución</dt><dd>{{ campus.college?.name ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Ciudad</dt><dd>{{ campus.city ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Estado</dt><dd>{{ campus.state ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Dirección</dt><dd>{{ campus.address ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">C.P.</dt><dd>{{ campus.zip ?? '-' }}</dd></div>
                    <div>
                        <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                        <dd>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="campus.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                                {{ campus.status ? 'ACTIVO' : 'INACTIVO' }}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Edificios -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-500 uppercase">Edificios</h2>
                    <button
                        class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="router.push({ name: 'school-services.buildings.create', query: { campusId: campus.id } })"
                    >
                        <PlusIcon class="w-3 h-3" /> AGREGAR
                    </button>
                </div>
                <p class="text-sm text-slate-400 italic">
                    Administra los edificios desde el
                    <button class="text-blue-600 underline" @click="router.push({ name: 'school-services.buildings', query: { campusId: campus.id } })">módulo de edificios</button>.
                </p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CampusType } from '@/modules/school-services/types/campus.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const campus = ref<CampusType | null>(null)

async function fetchCampus() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.byId(route.params.id as string))
        campus.value = data
    } finally {
        loading.value = false
    }
}

onMounted(fetchCampus)
</script>
