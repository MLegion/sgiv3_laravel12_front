<template>
    <div class="space-y-6">

        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Cuadro de Resultados</h1>
                <p class="mt-1 text-sm text-slate-500">
                    Aspirantes con resultado de examen ordenados por puntaje.
                    Activa o desactiva el switch <span class="font-semibold">¿Admitido?</span> y presiona
                    <span class="font-semibold text-blue-700">Confirmar Admisión</span> para aplicar los cambios.
                </p>
            </div>

            <button
                class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                :disabled="confirming || !periodId || items.length === 0"
                @click="openConfirm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar Admisión
            </button>
        </div>

        <!-- Filtro de periodo -->
        <div class="max-w-sm">
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período Académico <span class="text-red-500">*</span></label>
            <FormRemoteSelect
                v-model="periodId"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                item-label="name"
                item-value="academicPeriodId"
                placeholder="Selecciona un período..."
                @update:model-value="onPeriodChange"
            />
        </div>

        <!-- Sin periodo -->
        <div v-if="!periodId" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            Selecciona un período para ver el cuadro de resultados.
        </div>

        <!-- Cargando -->
        <div v-else-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
            No hay aspirantes con resultado de examen en este período.
        </div>

        <!-- Tabla de resultados -->
        <div v-else class="space-y-4">

            <!-- Estadísticas rápidas -->
            <div class="grid grid-cols-3 gap-3 max-w-sm">
                <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p class="text-xl font-bold text-slate-800">{{ totalItems }}</p>
                    <p class="text-[11px] text-slate-500 uppercase mt-0.5">Total</p>
                </div>
                <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <p class="text-xl font-bold text-green-700">{{ admittedCount }}</p>
                    <p class="text-[11px] text-green-600 uppercase mt-0.5">Admitidos</p>
                </div>
                <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <p class="text-xl font-bold text-red-700">{{ excludedIds.size }}</p>
                    <p class="text-[11px] text-red-500 uppercase mt-0.5">Excluidos</p>
                </div>
            </div>

            <!-- Tabla -->
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-12">#</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre Completo</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-44">CURP</th>
                            <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-24">Puntaje</th>
                            <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-28">¿Admitido?</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, idx) in items"
                            :key="item.id"
                            class="border-t border-slate-100 transition-colors"
                            :class="excludedIds.has(item.id) ? 'bg-red-50' : 'bg-white hover:bg-slate-50'"
                        >
                            <!-- Número progresivo global -->
                            <td class="px-4 py-3 text-xs font-mono text-slate-400 font-semibold">
                                {{ globalRank(idx) }}
                            </td>

                            <!-- Nombre -->
                            <td class="px-4 py-3">
                                <p class="font-medium text-slate-800">{{ fullName(item) }}</p>
                                <p class="text-xs text-slate-400">{{ item.email }}</p>
                            </td>

                            <!-- CURP -->
                            <td class="px-4 py-3 font-mono text-xs text-slate-600 uppercase">
                                {{ item.curp || '—' }}
                            </td>

                            <!-- Puntaje -->
                            <td class="px-4 py-3 text-center">
                                <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold" :class="scoreBadgeClass(item.entranceScore)">
                                    {{ item.entranceScore ?? '—' }}
                                </span>
                            </td>

                            <!-- Switch admitido -->
                            <td class="px-4 py-3 text-center">
                                <button
                                    type="button"
                                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                                    :class="excludedIds.has(item.id) ? 'bg-slate-300' : 'bg-green-500'"
                                    :aria-pressed="!excludedIds.has(item.id)"
                                    @click="toggleAdmitted(item.id)"
                                >
                                    <span
                                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                                        :class="excludedIds.has(item.id) ? 'translate-x-1' : 'translate-x-6'"
                                    />
                                </button>
                                <p class="text-[10px] mt-0.5" :class="excludedIds.has(item.id) ? 'text-red-500 font-semibold' : 'text-green-600'">
                                    {{ excludedIds.has(item.id) ? 'NO' : 'SÍ' }}
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-slate-500">
                <span>Página {{ currentPage }} de {{ totalPages }} — {{ totalItems }} aspirantes en total</span>
                <div class="flex gap-1">
                    <button
                        class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                        :disabled="currentPage === 1"
                        @click="goPage(currentPage - 1)"
                    >
                        ← Anterior
                    </button>
                    <button
                        v-for="p in visiblePages"
                        :key="p"
                        class="px-3 py-1.5 rounded border transition font-medium"
                        :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-100'"
                        @click="goPage(p)"
                    >
                        {{ p }}
                    </button>
                    <button
                        class="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                        :disabled="currentPage === totalPages"
                        @click="goPage(currentPage + 1)"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>

            <!-- Panel de excluidos -->
            <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-2">
                <div v-if="excludedIds.size > 0" class="border border-red-200 rounded-xl p-4 bg-red-50 space-y-2">
                    <p class="text-xs font-bold uppercase text-red-600 tracking-wide flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        Aspirantes que NO serán admitidos ({{ excludedIds.size }})
                    </p>
                    <div class="space-y-1">
                        <div
                            v-for="exc in excludedList"
                            :key="exc.id"
                            class="flex items-center justify-between bg-white border border-red-100 rounded-lg px-3 py-2 text-xs"
                        >
                            <span class="font-medium text-slate-700">{{ fullName(exc) }}</span>
                            <span class="font-mono text-slate-400">{{ exc.curp || '—' }}</span>
                            <span class="font-bold text-red-600">{{ exc.entranceScore ?? '—' }}</span>
                            <button
                                class="text-slate-400 hover:text-green-600 transition"
                                title="Volver a admitir"
                                @click="toggleAdmitted(exc.id)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>

        <!-- Modal de confirmación -->
        <Transition enter-active-class="transition-opacity duration-150" enter-from-class="opacity-0">
            <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                    <h2 class="text-base font-bold text-slate-800 uppercase tracking-wide">Confirmar Admisión</h2>

                    <div class="space-y-2 text-sm text-slate-600">
                        <p>Estás a punto de cambiar el estado a <span class="font-bold text-green-700">ADMITIDO</span> a:</p>
                        <div class="flex gap-4">
                            <div class="flex-1 text-center rounded-lg bg-green-50 border border-green-200 py-3">
                                <p class="text-2xl font-bold text-green-700">{{ admittedCount }}</p>
                                <p class="text-[11px] text-green-600 uppercase">Serán admitidos</p>
                            </div>
                            <div class="flex-1 text-center rounded-lg bg-red-50 border border-red-200 py-3">
                                <p class="text-2xl font-bold text-red-700">{{ excludedIds.size }}</p>
                                <p class="text-[11px] text-red-500 uppercase">Quedarán excluidos</p>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500">
                            Esta acción aplica a <strong>todos</strong> los aspirantes con resultado en el período,
                            incluidos los que no están visibles en la página actual.
                        </p>
                    </div>

                    <p v-if="confirmError" class="text-xs text-red-600 font-medium">{{ confirmError }}</p>

                    <div class="flex gap-2 justify-end pt-2">
                        <button
                            class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                            :disabled="confirming"
                            @click="showConfirm = false"
                        >
                            Cancelar
                        </button>
                        <button
                            class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                            :disabled="confirming"
                            @click="doAdmitBulk"
                        >
                            {{ confirming ? 'Procesando...' : 'Confirmar' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Toast de éxito -->
        <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-4">
            <div
                v-if="successMessage"
                class="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ successMessage }}
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ApplicantRow {
    id: number
    names: string
    firstSurname: string
    secondSurname: string | null
    email: string
    curp: string | null
    entranceScore: string | null
    status: number
}

// ── Estado ────────────────────────────────────────────────────────────────────

const periodId    = ref<number | null>(null)

const loading     = ref(false)
const items       = ref<ApplicantRow[]>([])
const allItems    = ref<Map<number, ApplicantRow>>(new Map()) // caché de todos los items vistos

// Paginación
const currentPage = ref(1)
const totalItems  = ref(0)
const perPage     = 50
const totalPages  = computed(() => Math.max(1, Math.ceil(totalItems.value / perPage)))

const visiblePages = computed(() => {
    const pages: number[] = []
    const start = Math.max(1, currentPage.value - 2)
    const end   = Math.min(totalPages.value, currentPage.value + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
})

// Estado de admisión: Set de IDs excluidos (switch en NO)
const excludedIds = ref<Set<number>>(new Set())

// Lista de los excluidos con sus datos (para el panel)
const excludedList = computed<ApplicantRow[]>(() => {
    const result: ApplicantRow[] = []
    for (const id of excludedIds.value) {
        const item = allItems.value.get(id)
        if (item) result.push(item)
    }
    return result.sort((a, b) => parseFloat(b.entranceScore ?? '0') - parseFloat(a.entranceScore ?? '0'))
})

const admittedCount = computed(() => totalItems.value - excludedIds.value.size)

// Modal confirmación
const showConfirm  = ref(false)
const confirming   = ref(false)
const confirmError = ref<string | null>(null)

// Toast
const successMessage = ref<string | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────

function fullName(item: ApplicantRow): string {
    return [item.firstSurname, item.secondSurname, item.names].filter(Boolean).join(' ')
}

function globalRank(localIndex: number): number {
    return (currentPage.value - 1) * perPage + localIndex + 1
}

function scoreBadgeClass(score: string | null): string {
    if (!score) return 'bg-slate-100 text-slate-400'
    const n = parseFloat(score)
    if (n >= 80) return 'bg-green-100 text-green-700'
    if (n >= 60) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-600'
}

// ── Carga de datos ────────────────────────────────────────────────────────────

async function loadPage(page: number) {
    if (!periodId.value) return
    loading.value = true
    try {
        const params = new URLSearchParams({
            page:               String(page),
            per_page:           String(perPage),
            academic_period_id: String(periodId.value),
        })
        const { data } = await api.get(API.ADMISSIONS_API.applicantRanking.list(params.toString()))
        items.value      = data.data ?? data.items ?? []
        totalItems.value = data.meta?.total ?? data.total ?? 0
        currentPage.value = page

        // Poblar caché para el panel de excluidos
        for (const item of items.value) {
            allItems.value.set(item.id, item)
        }
    } finally {
        loading.value = false
    }
}

function goPage(page: number) {
    if (page < 1 || page > totalPages.value) return
    loadPage(page)
}

function onPeriodChange(val: number | null) {
    // Resetear estado al cambiar período
    excludedIds.value = new Set()
    allItems.value    = new Map()
    currentPage.value = 1
    totalItems.value  = 0
    items.value       = []

    if (val) loadPage(1)
}

// ── Switches ──────────────────────────────────────────────────────────────────

function toggleAdmitted(id: number) {
    const next = new Set(excludedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    excludedIds.value = next
}

// ── Admisión masiva ───────────────────────────────────────────────────────────

function openConfirm() {
    confirmError.value = null
    showConfirm.value  = true
}

async function doAdmitBulk() {
    if (!periodId.value) return
    confirming.value   = true
    confirmError.value = null

    try {
        const { data } = await api.post(API.ADMISSIONS_API.applicantRanking.admitBulk, {
            academic_period_id: periodId.value,
            excluded_ids:       [...excludedIds.value],
        })

        showConfirm.value    = false
        excludedIds.value    = new Set()
        successMessage.value = `Proceso completado: ${data.admitted} admitidos, ${data.excluded} excluidos.`

        // Recargar la página actual para reflejar los cambios
        await loadPage(currentPage.value)

        setTimeout(() => { successMessage.value = null }, 5000)
    } catch (e: any) {
        confirmError.value = e?.response?.data?.message ?? 'Error al procesar la admisión.'
    } finally {
        confirming.value = false
    }
}

// Recargar cuando cambia período (ya se maneja en onPeriodChange)
watch(periodId, (val) => {
    if (!val) {
        items.value      = []
        totalItems.value = 0
    }
})
</script>
