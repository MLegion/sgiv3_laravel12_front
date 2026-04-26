<template>
    <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        appear
    >
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" @click.self="$emit('close')">
            <transition
                enter-active-class="transition ease-out duration-250"
                enter-from-class="translate-x-full"
                enter-to-class="translate-x-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="translate-x-0"
                leave-to-class="translate-x-full"
                appear
            >
                <div class="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
                    <!-- Header -->
                    <div class="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestionar roles</p>
                            <h2 class="text-base font-bold text-slate-800 truncate">{{ user.name }}</h2>
                            <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
                        </div>
                        <button
                            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            @click="$emit('close')"
                        >
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                        <!-- Roles actuales -->
                        <section>
                            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Roles asignados ({{ detail?.assignments?.length || 0 }})
                            </h3>
                            <div v-if="loadingDetail" class="text-sm text-slate-400 py-3">Cargando...</div>
                            <div v-else-if="!detail?.assignments?.length" class="text-sm text-slate-400 py-3 italic">
                                Sin roles asignados en este college.
                            </div>
                            <ul v-else class="space-y-2">
                                <li
                                    v-for="a in detail.assignments"
                                    :key="a.id"
                                    class="border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3"
                                >
                                    <div class="min-w-0 flex-1">
                                        <p class="font-semibold text-sm text-slate-800">{{ a.role_name }}</p>
                                        <p class="text-[11px] text-slate-400 font-mono">{{ a.role_code }}</p>
                                        <div v-if="Object.keys(a.contexts || {}).length" class="mt-1.5 flex flex-wrap gap-1">
                                            <span
                                                v-for="(ids, alias) in a.contexts"
                                                :key="alias"
                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                                            >
                                                {{ alias }}: {{ Array.isArray(ids) ? ids.join(',') : ids }}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        v-if="a.belongs_to_current_college !== false"
                                        :disabled="revokingId === a.id"
                                        class="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 disabled:opacity-60 transition"
                                        title="Revocar rol"
                                        @click="revoke(a)"
                                    >
                                        <TrashIcon class="w-4 h-4" />
                                    </button>
                                </li>
                            </ul>
                        </section>

                        <div class="border-t border-slate-200"></div>

                        <!-- Asignar nuevo -->
                        <section>
                            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Asignar nuevo rol
                            </h3>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">Rol</label>
                                    <select
                                        v-model="selectedRoleCode"
                                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        @change="onRoleChange"
                                    >
                                        <option value="">-- Selecciona un rol --</option>
                                        <option v-for="r in roles" :key="r.code" :value="r.code">
                                            {{ r.name }}
                                        </option>
                                    </select>
                                </div>

                                <!-- Combinaciones de contexto (tuplas) -->
                                <template v-if="selectedRole && selectedRole.required_contexts.length">
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-xs font-semibold text-slate-500">
                                                Combinaciones asignadas
                                                <span class="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition"
                                                @click="addContextRow"
                                            >+ Agregar combinación</button>
                                        </div>

                                        <div class="space-y-2">
                                            <div
                                                v-for="(row, rIdx) in contextRows"
                                                :key="rIdx"
                                                class="grid gap-2 items-end p-2 rounded-lg bg-slate-50 border border-slate-200"
                                                :style="{ gridTemplateColumns: `repeat(${selectedRole.required_contexts.length}, minmax(0, 1fr)) auto` }"
                                            >
                                                <div v-for="ctx in selectedRole.required_contexts" :key="ctx.alias">
                                                    <label class="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                                                        {{ aliasLabel(ctx.alias) }}
                                                    </label>
                                                    <select
                                                        v-model="row[ctx.alias]"
                                                        class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                                    >
                                                        <option :value="null">-- Selecciona --</option>
                                                        <option
                                                            v-for="opt in contextOptions[ctx.alias] || []"
                                                            :key="opt.id"
                                                            :value="opt.id"
                                                        >{{ opt.label }}</option>
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    class="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                                                    :disabled="contextRows.length === 1"
                                                    title="Quitar combinación"
                                                    @click="removeContextRow(rIdx)"
                                                >
                                                    <TrashIcon class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p v-if="contextRows.length === 0" class="text-[11px] text-amber-600 mt-1">
                                            Agregá al menos una combinación.
                                        </p>
                                        <template v-for="ctx in selectedRole.required_contexts" :key="`empty-${ctx.alias}`">
                                            <p v-if="!(contextOptions[ctx.alias] || []).length && !loadingContexts[ctx.alias]"
                                               class="text-[11px] text-amber-600 mt-1">
                                                No hay opciones de {{ aliasLabel(ctx.alias) }} en este college.
                                            </p>
                                        </template>
                                    </div>
                                </template>

                                <div v-if="formError" class="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100">
                                    {{ formError }}
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Footer -->
                    <div class="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <button
                            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            @click="$emit('close')"
                        >Cerrar</button>
                        <button
                            class="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition"
                            :disabled="!selectedRoleCode || assigning"
                            @click="assign"
                        >{{ assigning ? 'Asignando...' : 'Asignar rol' }}</button>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { XMarkIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface RequiredContext {
    alias: string
    is_required: boolean
    is_multiple: boolean
    sort_order: number
}

interface Role {
    id: number
    code: string
    name: string
    required_contexts: RequiredContext[]
}

interface ContextOption {
    id: number
    label: string
    meta?: Record<string, any>
}

interface Assignment {
    id: number
    role_id: number
    role_code: string
    role_name: string
    contexts: Record<string, number[]>
    belongs_to_current_college?: boolean
}

interface UserDetail {
    user: { id: number, name: string, email: string }
    assignments: Assignment[]
}

const props = defineProps<{
    user: { id: number, name: string, email: string }
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'changed', payload: { ok: boolean, message: string }): void
}>()

const roles = ref<Role[]>([])
const detail = ref<UserDetail | null>(null)
const loadingDetail = ref(true)

const selectedRoleCode = ref<string>('')
// Filas de tuplas. Cada fila representa UN grupo (alias=>id). El usuario
// agrega tantas filas como combinaciones específicas necesite.
type ContextRow = Record<string, number | null>
const contextRows = ref<ContextRow[]>([])
const contextOptions = reactive<Record<string, ContextOption[]>>({})
const loadingContexts = reactive<Record<string, boolean>>({})

const assigning = ref(false)
const revokingId = ref<number | null>(null)
const formError = ref('')

const selectedRole = computed(() => roles.value.find(r => r.code === selectedRoleCode.value) || null)

onMounted(async () => {
    await Promise.all([loadRoles(), loadDetail()])
})

async function loadRoles() {
    try {
        const { data } = await api.get(API.COLLEGE_API.assignableRoles)
        roles.value = data
    } catch {
        roles.value = []
    }
}

async function loadDetail() {
    loadingDetail.value = true
    try {
        const { data } = await api.get(API.COLLEGE_API.users.byId(props.user.id))
        detail.value = data
    } catch {
        detail.value = { user: props.user, assignments: [] }
    } finally {
        loadingDetail.value = false
    }
}

watch(selectedRoleCode, () => {
    formError.value = ''
})

async function onRoleChange() {
    contextRows.value = []
    formError.value = ''

    const role = selectedRole.value
    if (!role) return

    // Cargar las opciones de cada alias requerido (en paralelo)
    await Promise.all(
        role.required_contexts.map(ctx =>
            contextOptions[ctx.alias] ? Promise.resolve() : loadContextOptions(ctx.alias)
        )
    )

    // Inicializar con UNA fila vacía si el rol requiere contextos
    if (role.required_contexts.length) {
        contextRows.value = [emptyRowForRole(role)]
    }
}

function emptyRowForRole(role: Role): ContextRow {
    const row: ContextRow = {}
    for (const ctx of role.required_contexts) row[ctx.alias] = null
    return row
}

function addContextRow() {
    if (!selectedRole.value) return
    contextRows.value.push(emptyRowForRole(selectedRole.value))
}

function removeContextRow(idx: number) {
    if (contextRows.value.length <= 1) return
    contextRows.value.splice(idx, 1)
}

async function loadContextOptions(alias: string) {
    loadingContexts[alias] = true
    try {
        const { data } = await api.get(API.COLLEGE_API.contextOptions(alias))
        contextOptions[alias] = data.items || []
    } catch {
        contextOptions[alias] = []
    } finally {
        loadingContexts[alias] = false
    }
}

function aliasLabel(alias: string): string {
    const labels: Record<string, string> = {
        career:   'Carrera',
        modality: 'Modalidad',
        campus:   'Campus',
        college:  'College',
    }
    return labels[alias] || alias
}

async function assign() {
    if (!selectedRole.value) return
    formError.value = ''

    const role = selectedRole.value
    const requiredAliases = role.required_contexts
        .filter(c => c.is_required)
        .map(c => c.alias)

    let contextGroups: Record<string, number>[] = []

    if (role.required_contexts.length) {
        if (!contextRows.value.length) {
            formError.value = 'Agregá al menos una combinación.'
            return
        }
        // Validar que cada fila tenga todos los aliases requeridos.
        for (let i = 0; i < contextRows.value.length; i++) {
            const row = contextRows.value[i]
            for (const alias of requiredAliases) {
                if (row[alias] === null || row[alias] === undefined) {
                    formError.value = `Combinación #${i + 1}: falta ${aliasLabel(alias)}.`
                    return
                }
            }
        }
        // Construir payload: [{alias: id, ...}, ...]
        contextGroups = contextRows.value.map(row => {
            const out: Record<string, number> = {}
            for (const alias of Object.keys(row)) {
                if (row[alias] !== null && row[alias] !== undefined) {
                    out[alias] = Number(row[alias])
                }
            }
            return out
        })
    }

    assigning.value = true
    try {
        const { data } = await api.post(API.COLLEGE_API.users.assign(props.user.id), {
            role_code:      selectedRoleCode.value,
            context_groups: contextGroups,
        })
        emit('changed', { ok: true, message: data.message || 'Rol asignado.' })
        selectedRoleCode.value = ''
        contextRows.value = []
        await loadDetail()
    } catch (e: any) {
        formError.value = e.response?.data?.message || 'No se pudo asignar el rol.'
    } finally {
        assigning.value = false
    }
}

async function revoke(a: Assignment) {
    if (!confirm(`¿Revocar el rol "${a.role_name}" de este usuario?`)) return
    revokingId.value = a.id
    try {
        const { data } = await api.delete(API.COLLEGE_API.users.revoke(props.user.id, a.id))
        emit('changed', { ok: true, message: data.message || 'Rol revocado.' })
        await loadDetail()
    } catch (e: any) {
        emit('changed', { ok: false, message: e.response?.data?.message || 'No se pudo revocar.' })
    } finally {
        revokingId.value = null
    }
}
</script>
