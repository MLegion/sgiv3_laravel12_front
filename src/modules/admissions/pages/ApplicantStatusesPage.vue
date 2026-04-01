<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Estados de Aspirante</h1>

        <p class="text-sm text-slate-500">
            Los estados son fijos del sistema. Solo puedes editar la etiqueta, descripción y color de cada uno.
        </p>

        <div v-if="loading" class="flex justify-center py-12">
            <div class="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>

        <div v-else class="divide-y border rounded-xl overflow-hidden bg-white shadow-sm">
            <div
                v-for="status in statuses"
                :key="status.id"
                class="flex items-start gap-4 px-6 py-4"
            >
                <!-- Badge de color -->
                <div class="shrink-0 pt-0.5">
                    <span
                        class="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full"
                        :class="status.color"
                    >
                        {{ status.label }}
                    </span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-slate-400 font-mono">{{ status.code }}</p>
                    <p class="text-sm text-slate-600 mt-0.5">{{ status.description }}</p>
                </div>

                <!-- Botón editar -->
                <button
                    type="button"
                    class="shrink-0 border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                    title="Editar"
                    @click="openEdit(status)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Modal editar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="editing = null" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                        <div class="flex items-center gap-3">
                            <span class="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full" :class="form.color">
                                {{ form.label || editing.label }}
                            </span>
                            <span class="text-xs text-slate-400 font-mono">{{ editing.code }}</span>
                        </div>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Etiqueta</label>
                                <input
                                    v-model="form.label"
                                    type="text"
                                    maxlength="60"
                                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                                <textarea
                                    v-model="form.description"
                                    rows="3"
                                    maxlength="255"
                                    class="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Color (clases Tailwind)
                                </label>
                                <input
                                    v-model="form.color"
                                    type="text"
                                    maxlength="120"
                                    placeholder="Ej: bg-blue-100 text-blue-700"
                                    class="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <p class="text-xs text-slate-400 mt-1">Vista previa actualiza en tiempo real en el badge superior.</p>
                            </div>

                            <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
                        </div>

                        <div class="flex justify-end gap-2 pt-2">
                            <button
                                class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition"
                                @click="editing = null"
                            >
                                CANCELAR
                            </button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                                :disabled="submitting"
                                @click="submitEdit"
                            >
                                {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ApplicantStatus } from '@/modules/admissions/types/applicant.type'

const statuses = ref<ApplicantStatus[]>([])
const loading  = ref(false)

async function fetchStatuses() {
    loading.value = true
    try {
        const res = await api.get(API.ADMISSIONS_API.applicantStatuses.list)
        statuses.value = res.data ?? []
    } catch (e) {
        console.error('[ApplicantStatusesPage] Error cargando estados:', e)
    } finally {
        loading.value = false
    }
}

// ── Editar ────────────────────────────────────────────────────────────────────

const editing    = ref<ApplicantStatus | null>(null)
const submitting = ref(false)
const formError  = ref<string | null>(null)

const form = ref({ label: '', description: '', color: '' })

function openEdit(status: ApplicantStatus) {
    editing.value    = status
    form.value       = { label: status.label, description: status.description, color: status.color }
    formError.value  = null
}

async function submitEdit() {
    if (!editing.value) return
    formError.value = null

    if (!form.value.label.trim())       { formError.value = 'La etiqueta es requerida.'; return }
    if (!form.value.description.trim()) { formError.value = 'La descripción es requerida.'; return }
    if (!form.value.color.trim())       { formError.value = 'El color es requerido.'; return }

    submitting.value = true
    try {
        const res = await api.put(API.ADMISSIONS_API.applicantStatuses.update(editing.value.id), form.value)
        const updated = res.data
        const idx = statuses.value.findIndex(s => s.id === editing.value!.id)
        if (idx !== -1) statuses.value[idx] = updated
        editing.value = null
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(() => fetchStatuses())
</script>
