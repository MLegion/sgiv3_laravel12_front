<template>
    <div class="p-6 space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Dictámenes por firmar</h1>
            <p class="text-sm text-slate-500">Expedientes de movilidad que requieren tu firma. Solo ves lo que te corresponde firmar.</p>
        </div>

        <div v-if="loading" class="text-center text-slate-400 py-10">Cargando…</div>

        <div v-else-if="!rows.length" class="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            No tienes dictámenes pendientes de firma.
        </div>

        <div v-else class="space-y-3">
            <div v-for="r in rows" :key="r.case_id" class="rounded-xl border border-slate-200 p-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="mobilityKind(r).cls">{{ mobilityKind(r).label }}</span>
                            <span class="text-slate-400 text-xs">Expediente #{{ r.case_id }}</span>
                            <span v-if="r.dictamen_number" class="text-slate-400 text-xs">· Dictamen {{ r.dictamen_number }}</span>
                        </div>
                        <p class="mt-1 text-sm font-medium text-slate-700">{{ r.student_label || 'Alumno del expediente' }}</p>
                        <router-link :to="`/school-services/mobility/${r.case_id}`" class="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver expediente completo →</router-link>
                    </div>
                    <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
                </div>

                <div class="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div v-for="s in r.pending_slots" :key="s.slot" class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p class="text-sm text-slate-600">Firmar como <b>{{ s.avala || s.slot }}</b></p>
                        <button class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700" @click="openSign(r, s)">Firmar</button>
                    </div>
                </div>
            </div>
        </div>

        <SignDocumentModal
            v-model="signOpen"
            :endpoint="signEndpoint"
            :label="signLabel"
            @signed="onSigned"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import SignDocumentModal from '@/modules/signatures/modals/SignDocumentModal.vue'
import { statusClass, statusLabel } from '@/modules/school-services/mobility.status'
import { mobilityKind } from '@/modules/school-services/mobility.labels'

const toast = useToast()
const rows = ref<any[]>([])
const loading = ref(false)
const signOpen = ref(false)
const signEndpoint = ref('')
const signLabel = ref('')

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.mobility.mySignatures)
        rows.value = data.data ?? []
    } finally {
        loading.value = false
    }
}

function openSign(r: any, s: any) {
    signEndpoint.value = API.SCHOOL_SERVICES_API.mobility.sign(r.case_id, s.slot)
    signLabel.value = s.avala || s.slot
    signOpen.value = true
}

async function onSigned() {
    toast.success('Dictamen firmado')
    await load()
}

onMounted(load)
</script>
