<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Escuela de Procedencia</h1>
            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50"
                    @click="router.push({ name: 'admissions.origin-schools.edit', params: { id: route.params.id } })"
                >EDITAR</button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400 text-sm">Cargando...</div>

        <template v-else-if="school">
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-6">
                <!-- Identificación -->
                <div>
                    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Identificación</h2>
                    <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div class="md:col-span-3">
                            <dt class="text-slate-400 text-xs uppercase">Nombre</dt>
                            <dd class="font-semibold text-slate-800">{{ school.name }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Siglas</dt>
                            <dd>{{ school.shortName ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">CCT</dt>
                            <dd class="font-mono">{{ school.cct ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Nivel Educativo</dt>
                            <dd>{{ school.schoolLevel ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                            <dd>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                                    :class="school.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                                    {{ school.status === 1 ? 'ACTIVA' : 'INACTIVA' }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Contacto -->
                <div>
                    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contacto</h2>
                    <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Teléfono</dt>
                            <dd>{{ school.phone ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Correo</dt>
                            <dd>{{ school.email ?? '—' }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Ubicación -->
                <div>
                    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ubicación</h2>
                    <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Dirección</dt>
                            <dd>{{ school.address ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Asentamiento</dt>
                            <dd>{{ school.geoSettlement?.colony ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">C.P.</dt>
                            <dd class="font-mono">{{ school.geoSettlement?.postalCode ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Municipio</dt>
                            <dd>{{ school.geoSettlement?.municipality?.name ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                            <dd>{{ school.geoSettlement?.state?.name ?? '—' }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { OriginSchoolType } from '@/modules/admissions/types/origin-school.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const school = ref<OriginSchoolType | null>(null)

async function fetchSchool() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.originSchools.byId(route.params.id as string))
        school.value = data
    } finally {
        loading.value = false
    }
}

onMounted(fetchSchool)
</script>
