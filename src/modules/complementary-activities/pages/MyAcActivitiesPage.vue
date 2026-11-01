<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Actividades complementarias disponibles</h1>
            <p class="text-xs text-slate-400">Inscríbete a las actividades con la inscripción abierta. Debes cumplir las reglas de cada una.</p>
        </div>

        <p v-if="!loading && !items.length" class="text-sm text-slate-400">No hay actividades con inscripción abierta por ahora.</p>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="a in items" :key="a.id" class="rounded-xl border bg-white p-4 space-y-2 flex flex-col">
                <div class="flex items-start justify-between gap-2">
                    <h2 class="text-sm font-bold text-slate-700 leading-tight">{{ a.name }}</h2>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 shrink-0">{{ typeLabel(a.type) }}</span>
                </div>
                <dl class="text-[11px] text-slate-500 space-y-0.5">
                    <div v-if="a.instructor_name">Instructor: {{ a.instructor_name }}</div>
                    <div v-if="a.place_name || a.location_label">Lugar: {{ a.place_name ?? a.location_label }}</div>
                    <div>Créditos: {{ a.credits }}<span v-if="a.weekly_hours"> · {{ a.weekly_hours }} h/sem</span></div>
                    <div v-if="a.starts_on || a.ends_on">Duración: {{ fmtDate(a.starts_on) }} → {{ fmtDate(a.ends_on) }}</div>
                    <div>Cupo: {{ a.attendees_count }}<span v-if="a.capacity"> / {{ a.capacity }}</span></div>
                    <div v-if="a.enrollment_closes_at" class="text-amber-600">Cierra: {{ fmt(a.enrollment_closes_at) }}</div>
                </dl>

                <div class="mt-auto pt-2">
                    <span v-if="a.is_enrolled" class="inline-flex items-center gap-2">
                        <span class="text-[11px] font-semibold text-emerald-600">✓ Inscrito</span>
                        <button @click="drop(a)" :disabled="busy" class="text-[11px] text-rose-500 hover:underline disabled:opacity-50">darme de baja</button>
                    </span>
                    <template v-else>
                        <button v-if="a.eligible" @click="enroll(a)" :disabled="busy"
                            class="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Inscribirme</button>
                        <div v-else class="text-[11px] text-slate-400">
                            <p class="font-semibold text-rose-400">No cumples:</p>
                            <ul class="list-disc list-inside"><li v-for="(r, i) in a.reasons" :key="i">{{ r }}</li></ul>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const AC = API.AC_API
const toast = useToast()
const items = ref<any[]>([])
const loading = ref(true)
const busy = ref(false)

const TYPE_LABELS: Record<string, string> = {
    group_tutoring: 'Tutoría grupal', complementaria: 'Complementaria', extraescolar: 'Extraescolar', mooc: 'MOOC',
}
const typeLabel = (t: string) => TYPE_LABELS[t] ?? t
const fmt = (v: string) => (v ? new Date(v.replace(' ', 'T')).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '')
const fmtDate = (v: string) => (v ? new Date(String(v).substring(0, 10) + 'T00:00:00').toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '…')

async function load() {
    loading.value = true
    try { const { data } = await api.get(AC.myActivities); items.value = data ?? [] }
    catch { items.value = [] }
    finally { loading.value = false }
}
async function enroll(a: any) {
    busy.value = true
    try {
        await api.post(AC.selfEnroll(a.id), {})
        toast.success('¡Inscrito!')
        await load()
    } catch (e: any) {
        const v = e?.response?.data?.violations
        toast.error(Array.isArray(v) && v.length ? v.map((x: any) => x.message).join(' · ') : (e?.response?.data?.message ?? 'No se pudo inscribir.'))
        await load()
    } finally { busy.value = false }
}
async function drop(a: any) {
    if (!confirm(`¿Darte de baja de "${a.name}"?`)) return
    busy.value = true
    try { await api.post(AC.selfDrop(a.id), {}); toast.success('Baja realizada.'); await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo dar de baja.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
