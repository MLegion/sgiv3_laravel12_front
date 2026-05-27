<template>
    <section class="px-4 py-3 space-y-3 max-w-6xl mx-auto">
        <header class="flex items-baseline gap-3">
            <h1 class="text-lg font-semibold text-slate-800">Constancias de cuidadores</h1>
            <button
                class="ml-auto text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                :disabled="loading"
                @click="load"
            >Recargar</button>
        </header>

        <p class="text-sm text-slate-600">
            Empleados que participaron como cuidadores en el examen presencial del periodo cerrado.
            Valida cada registro para autorizar la emisión de su constancia.
        </p>

        <div v-if="loading && items.length === 0" class="text-sm text-slate-500 italic">Cargando…</div>

        <div v-else-if="items.length === 0" class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
            ✓ No hay constancias pendientes de validación. Cerrar el proceso de admisión genera esta lista.
        </div>

        <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-100 text-slate-600 text-xs">
                    <tr>
                        <th class="text-left px-3 py-2">Empleado</th>
                        <th class="text-left px-3 py-2">Periodo</th>
                        <th class="text-right px-3 py-2">Sesiones</th>
                        <th class="text-right px-3 py-2">Aspirantes</th>
                        <th class="text-left px-3 py-2">Cerrado</th>
                        <th class="text-right px-3 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="it in items" :key="it.id" class="hover:bg-slate-50">
                        <td class="px-3 py-2">
                            <div class="font-medium">{{ it.employeeFullName ?? '—' }}</div>
                            <div v-if="it.employeeEmail" class="text-xs text-slate-500">{{ it.employeeEmail }}</div>
                        </td>
                        <td class="px-3 py-2 text-slate-700">
                            {{ it.academicPeriodShortName ?? it.academicPeriodName }}
                        </td>
                        <td class="px-3 py-2 text-right font-semibold">{{ it.sessionsCount }}</td>
                        <td class="px-3 py-2 text-right">{{ it.applicantsCount }}</td>
                        <td class="px-3 py-2 text-slate-500 text-xs">{{ formatDate(it.closedAt) }}</td>
                        <td class="px-3 py-2 text-right">
                            <button
                                :disabled="busyIds.has(it.id)"
                                class="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
                                @click="confirmValidate(it)"
                            >
                                {{ busyIds.has(it.id) ? 'Validando…' : 'Validar' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>

        <ConfirmModal
            v-model="confirmOpen"
            :title="confirmTitle"
            :message="confirmMessage"
            confirm-text="Validar"
            variant="success"
            @confirm="runValidate"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'

interface PendingItem {
    id:                       number
    employeeId:               number
    userId:                   number | null
    employeeFullName:         string | null
    employeeEmail:            string | null
    academicPeriodId:         number
    academicPeriodShortName:  string | null
    academicPeriodName:       string
    sessionsCount:            number
    applicantsCount:          number
    closedAt:                 string
}

const items   = ref<PendingItem[]>([])
const loading = ref(false)
const error   = ref('')
const busyIds = ref<Set<number>>(new Set())

const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
const pendingItem    = ref<PendingItem | null>(null)

async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get<{ items: PendingItem[] }>(API.ADMISSIONS_API.proctorRecords.pending)
        items.value = data.items ?? []
    } catch (e: unknown) {
        error.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudieron cargar las constancias pendientes.'
    } finally {
        loading.value = false
    }
}

function confirmValidate(it: PendingItem): void {
    pendingItem.value = it
    confirmTitle.value = `Validar constancia de ${it.employeeFullName ?? 'empleado'}`
    confirmMessage.value = `Cubrió ${it.sessionsCount} sesión(es) y evaluó ${it.applicantsCount} aspirante(s). Al validar autorizas que esta constancia esté disponible para descarga.`
    confirmOpen.value = true
}

async function runValidate(): Promise<void> {
    const it = pendingItem.value
    pendingItem.value = null
    if (!it) return
    busyIds.value.add(it.id)
    try {
        await api.post(API.ADMISSIONS_API.proctorRecords.validate(it.id), {})
        items.value = items.value.filter(x => x.id !== it.id)
    } catch (e: unknown) {
        error.value = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? 'No se pudo validar.'
    } finally {
        busyIds.value.delete(it.id)
    }
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

onMounted(load)
</script>
