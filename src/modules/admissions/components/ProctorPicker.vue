<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                Cuidadores ({{ proctors.length }})
            </h3>
            <button
                v-if="!addingMode"
                class="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="startAdd"
            >
                <PlusIcon class="w-4 h-4" />
                AGREGAR
            </button>
        </div>

        <!-- Picker form -->
        <div v-if="addingMode" class="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-3">
            <div class="flex items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-xs text-slate-700">
                    <input
                        type="checkbox"
                        v-model="includeEmployees"
                        @change="onToggleIncludeEmployees"
                    />
                    Incluir todo el personal del plantel (no sólo docentes)
                </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                        {{ includeEmployees ? 'Empleado' : 'Docente' }}
                    </label>
                    <input
                        v-model="searchTerm"
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        class="field-sm"
                    />
                    <ul
                        v-if="candidates.length > 0"
                        class="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white text-xs"
                    >
                        <li
                            v-for="c in candidates"
                            :key="c.id"
                            class="px-2 py-1 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                            :class="{ 'bg-blue-100': selectedUser?.id === c.id }"
                            @click="selectedUser = c"
                        >
                            <div>
                                <div class="font-medium text-slate-800">{{ c.name || c.email }}</div>
                                <div class="text-[10px] text-slate-500">{{ c.email }}</div>
                            </div>
                            <span
                                v-if="!c.isTeacher"
                                class="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase"
                            >No docente</span>
                        </li>
                    </ul>
                    <p v-else-if="searched && !loading" class="text-xs text-slate-500 mt-1 italic">Sin resultados.</p>
                </div>

                <div class="space-y-2">
                    <div>
                        <label class="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Rol en sesión</label>
                        <select v-model="role" class="field-sm">
                            <option value="TITULAR">Titular</option>
                            <option value="APOYO">Apoyo</option>
                        </select>
                    </div>

                    <div v-if="selectedUser && (!selectedUser.isTeacher || includeEmployees)">
                        <label class="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                            Razón de la excepción <span class="text-red-600">*</span>
                        </label>
                        <textarea
                            v-model="exceptionReason"
                            rows="2"
                            maxlength="255"
                            placeholder="Ej: Docente no disponible; se asigna apoyo administrativo."
                            class="field-sm"
                        ></textarea>
                    </div>
                </div>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-1">
                <button class="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-50" @click="cancelAdd">CANCELAR</button>
                <button
                    class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="!selectedUser || saving"
                    @click="addProctor"
                >
                    {{ saving ? 'GUARDANDO...' : 'AGREGAR' }}
                </button>
            </div>
        </div>

        <!-- Lista de cuidadores -->
        <ul v-if="proctors.length > 0" class="space-y-1">
            <li
                v-for="p in proctors"
                :key="p.id"
                class="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2"
            >
                <div class="flex items-center gap-3">
                    <div>
                        <div class="text-sm font-medium text-slate-800">{{ p.user?.name || p.user?.email }}</div>
                        <div class="text-[10px] text-slate-500 flex items-center gap-2">
                            {{ p.user?.email }}
                            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{{ p.role }}</span>
                            <span v-if="p.isException" class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">
                                Excepción
                            </span>
                        </div>
                        <p v-if="p.exceptionReason" class="text-[11px] text-amber-700 italic mt-0.5">{{ p.exceptionReason }}</p>
                    </div>
                </div>
                <button aria-label="Quitar"
                    class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    title="Quitar"
                    @click="removeProctor(p)"
                >
                    <TrashIcon class="w-4 h-4" />
                </button>
            </li>
        </ul>
        <p v-else-if="!addingMode" class="text-xs text-slate-400 italic">Aún no hay cuidadores asignados.</p>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useConfirm } from '@/app/composables/useConfirm'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ExamSessionProctor, ProctorRole } from '@/modules/admissions/types/exam-session-proctor.type'

interface ProctorCandidate {
    id: number
    name: string | null
    email: string
    isTeacher: boolean
    roleCodes: string[]
}

const props = defineProps<{ sessionId: number }>()

const proctors = ref<ExamSessionProctor[]>([])
const candidates = ref<ProctorCandidate[]>([])
const loading = ref(false)
const searched = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const addingMode      = ref(false)
const includeEmployees = ref(false)
const searchTerm      = ref('')
const selectedUser    = ref<ProctorCandidate | null>(null)
const role            = ref<ProctorRole>('TITULAR')
const exceptionReason = ref('')

let searchTimer: number | undefined

watch(searchTerm, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => loadCandidates(), 250)
})

async function loadProctors() {
    const { data } = await api.get(API.ADMISSIONS_API.examSessions.proctors.list(props.sessionId))
    proctors.value = data
}

async function loadCandidates() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examProctorCandidates, {
            params: {
                include_employees: includeEmployees.value ? 1 : 0,
                search:            searchTerm.value || undefined,
                per_page:          15,
            },
        })
        candidates.value = data?.items ?? data?.data ?? []
        searched.value = true
    } finally {
        loading.value = false
    }
}

function startAdd() {
    addingMode.value = true
    error.value      = null
    selectedUser.value = null
    role.value         = 'TITULAR'
    exceptionReason.value = ''
    searchTerm.value      = ''
    candidates.value      = []
    searched.value        = false
    loadCandidates()
}

function cancelAdd() {
    addingMode.value = false
    selectedUser.value = null
}

function onToggleIncludeEmployees() {
    selectedUser.value = null
    loadCandidates()
}

async function addProctor() {
    error.value = null
    if (!selectedUser.value) return

    const isException = !selectedUser.value.isTeacher || includeEmployees.value
    if (isException && !exceptionReason.value.trim()) {
        error.value = 'La razón de la excepción es requerida cuando el cuidador no es docente.'
        return
    }

    saving.value = true
    try {
        await api.post(API.ADMISSIONS_API.examSessions.proctors.create(props.sessionId), {
            user_id:          selectedUser.value.id,
            role:             role.value,
            is_exception:     isException,
            exception_reason: isException ? exceptionReason.value : null,
        })
        addingMode.value = false
        await loadProctors()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo asignar al cuidador.'
    } finally {
        saving.value = false
    }
}

async function removeProctor(p: ExamSessionProctor) {
    if (!await useConfirm().confirm({ title: 'Quitar cuidador', message: `¿Quitar a ${p.user?.name || p.user?.email} como cuidador?`, variant: 'danger', confirmText: 'Quitar' })) return
    await api.delete(API.ADMISSIONS_API.examSessions.proctors.delete(props.sessionId, p.id))
    await loadProctors()
}

onMounted(loadProctors)
</script>

<style scoped>
.field-sm {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
}
.field-sm:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
