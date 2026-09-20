<template>
    <div class="space-y-5 max-w-2xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Titulación</h1>

        <div v-if="!rec" class="rounded-xl border bg-white p-6 text-center text-slate-400">
            Aún no tienes un expediente de titulación registrado. Acude a la coordinación de titulación.
        </div>

        <div v-else class="space-y-4">
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <div class="flex justify-between items-center">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Expediente</h2>
                    <span class="px-3 py-1 rounded-full text-xs font-bold" :class="statusClass(rec.status)">{{ statusLabel(rec.status) }}</span>
                </div>
                <p class="text-sm text-slate-600"><b>Opción:</b> {{ rec.option_name ?? '—' }}</p>
                <p class="text-sm text-slate-600"><b>Proyecto:</b> {{ rec.project_title ?? '—' }}</p>
                <p class="text-sm text-slate-600"><b>Inglés B1:</b> {{ rec.english_b1 ? 'Acreditado' : 'Pendiente' }}</p>
                <p class="text-sm text-slate-600"><b>Sin adeudos:</b> {{ rec.no_adeudos ? 'Sí' : 'Pendiente' }}</p>
            </div>

            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Jurado</h2>
                <div v-for="j in rec.jury" :key="j.id" class="text-sm text-slate-600">{{ j.user_name }} · <span class="capitalize">{{ j.role }}</span></div>
                <p v-if="!rec.jury?.length" class="text-sm text-slate-400">Aún no se asigna jurado.</p>
            </div>

            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Acto de recepción profesional</h2>
                <div v-for="a in rec.acts" :key="a.id" class="text-sm text-slate-600 flex justify-between border-b last:border-0 py-1">
                    <span>{{ a.date }} · {{ a.start_time?.slice(0,5) }}–{{ a.end_time?.slice(0,5) }} · {{ a.place_name ?? '—' }}</span>
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="actStatusClass(a.status)">{{ actStatusLabel(a.status) }}</span>
                </div>
                <p v-if="!rec.acts?.length" class="text-sm text-slate-400">Aún no se programa tu acto.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionRecord } from '@/modules/titulacion/types/titulacion.type'
import { statusLabel, statusClass, actStatusLabel, actStatusClass } from '@/modules/titulacion/pages/status'

const T = API.TITULACION_API
const rec = ref<TitulacionRecord | null>(null)
onMounted(async () => { rec.value = (await api.get(T.me)).data ?? null })
</script>
