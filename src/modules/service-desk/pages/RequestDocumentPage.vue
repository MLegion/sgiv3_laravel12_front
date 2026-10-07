<template>
    <div class="space-y-5 max-w-3xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Solicitar documento</h1>

        <div class="rounded-xl border bg-white p-4 space-y-3">
            <span class="text-xs font-semibold text-slate-500">Elige el documento a solicitar</span>
            <div class="grid sm:grid-cols-2 gap-2">
                <label v-for="d in docs" :key="d.code" class="flex items-start gap-2 rounded-lg border p-2 cursor-pointer" :class="pick === d.code ? 'border-blue-500 bg-blue-50' : 'border-slate-200'">
                    <input type="radio" :value="d.code" v-model="pick" class="mt-1" />
                    <span><span class="text-sm font-semibold text-slate-700">{{ d.name }}</span><br><span class="text-xs text-slate-400">{{ d.description }}</span></span>
                </label>
                <p v-if="!docs.length" class="text-sm text-slate-400 col-span-full py-2">No hay documentos disponibles para solicitar.</p>
            </div>
            <textarea v-model="notes" rows="2" placeholder="Motivo o comentario (opcional)" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
            <p v-if="msg" class="text-sm" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
            <div class="flex justify-end items-center gap-3">
                <router-link v-if="justSent" :to="{ name: 'service-desk.my-documents' }" class="text-sm font-semibold text-blue-600">Ver bandeja de documentos →</router-link>
                <button @click="submit" :disabled="!pick || busy" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Solicitar</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskDocument } from '@/modules/service-desk/types/service-desk.type'

const D = API.SERVICE_DESK_API
const docs = ref<DeskDocument[]>([])
const pick = ref(''), notes = ref(''), busy = ref(false), msg = ref(''), msgError = ref(false), justSent = ref(false)

async function submit() {
    busy.value = true; msg.value = ''; msgError.value = false
    try {
        await api.post(D.createRequest, { document_code: pick.value, notes: notes.value || null })
        msg.value = 'Solicitud enviada. Servicios Escolares la atenderá. Revísala en tu bandeja de documentos.'
        pick.value = ''; notes.value = ''; justSent.value = true
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo solicitar.'; msgError.value = true }
    finally { busy.value = false }
}

onMounted(async () => { docs.value = (await api.get(D.myRequestableDocuments)).data ?? [] })
</script>
