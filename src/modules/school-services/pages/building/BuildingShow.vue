<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Detalle del Edificio</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                    @click="router.push({ name: 'school-services.buildings.edit', params: { id: route.params.id } })">EDITAR</button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400">Cargando...</div>

        <template v-else-if="building">
            <div class="bg-white border rounded-xl shadow-sm p-6">
                <h2 class="text-sm font-semibold text-slate-500 uppercase mb-4">Información</h2>
                <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><dt class="text-slate-400 text-xs uppercase">Nombre</dt><dd class="font-medium">{{ building.name }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Nombre Corto</dt><dd>{{ building.shortName ?? '-' }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Plantel</dt><dd>{{ building.campus?.name ?? '-' }}</dd></div>
                    <div class="col-span-2"><dt class="text-slate-400 text-xs uppercase">Descripción</dt><dd>{{ building.description ?? '-' }}</dd></div>
                    <div>
                        <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                        <dd><span class="px-2 py-1 text-xs font-semibold rounded-full" :class="building.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ building.status ? 'ACTIVO' : 'INACTIVO' }}</span></dd>
                    </div>
                </dl>
            </div>

            <!-- Espacios -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-500 uppercase">Espacios</h2>
                    <button
                        class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="router.push({ name: 'school-services.places.create', query: { buildingId: building.id } })"
                    ><PlusIcon class="w-3 h-3" /> AGREGAR</button>
                </div>
                <p class="text-sm text-slate-400 italic">
                    Administra los espacios desde el
                    <button class="text-blue-600 underline" @click="router.push({ name: 'school-services.places', query: { buildingId: building.id } })">módulo de espacios</button>.
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
import type { BuildingType } from '@/modules/school-services/types/building.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const building = ref<BuildingType | null>(null)

async function fetchBuilding() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.buildings.byId(route.params.id as string))
        building.value = data
    } finally { loading.value = false }
}

onMounted(fetchBuilding)
</script>
