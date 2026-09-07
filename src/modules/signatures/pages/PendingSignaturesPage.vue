<template>
    <div class="p-6 space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Por firmar</h1>
            <p class="text-sm text-slate-500">Documentos de cualquier trámite que requieren tu firma. Solo ves lo que te corresponde.</p>
        </div>

        <div v-if="loading" class="text-center text-slate-400 py-10">Cargando…</div>

        <div v-else-if="!rows.length" class="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            No tienes documentos pendientes de firma.
        </div>

        <div v-else class="space-y-3">
            <div v-for="(r, idx) in rows" :key="idx" class="rounded-xl border border-slate-200 p-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{{ r.type_label }}</span>
                            <span v-if="r.status_label" class="text-slate-400 text-xs">· {{ r.status_label }}</span>
                        </div>
                        <p class="mt-1 text-sm font-medium text-slate-700">{{ r.title }}</p>
                        <p v-if="r.subtitle" class="text-xs text-slate-500">{{ r.subtitle }}</p>
                        <router-link v-if="r.deep_link" :to="r.deep_link" class="text-xs text-blue-600 hover:text-blue-700 font-medium">Ver documento →</router-link>
                    </div>
                </div>

                <div class="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div v-for="s in r.slots" :key="s.slot" class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <p class="text-sm text-slate-600">Firmar como <b>{{ s.avala || s.slot }}</b></p>
                        <button class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700" @click="openSign(s)">Firmar</button>
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

const toast = useToast()
const rows = ref<any[]>([])
const loading = ref(false)
const signOpen = ref(false)
const signEndpoint = ref('')
const signLabel = ref('')

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.SIGNATURES_API.pending)
        rows.value = data.data ?? []
    } finally {
        loading.value = false
    }
}

function openSign(s: any) {
    signEndpoint.value = s.sign_endpoint
    signLabel.value = s.avala || s.slot
    signOpen.value = true
}

async function onSigned() {
    toast.success('Documento firmado')
    await load()
}

onMounted(load)
</script>
