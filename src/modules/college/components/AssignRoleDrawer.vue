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

                                <!-- Contextos dinámicos -->
                                <template v-if="selectedRole">
                                    <div v-for="ctx in selectedRole.required_contexts" :key="ctx.alias">
                                        <label class="block text-xs font-semibold text-slate-500 mb-1">
                                            {{ aliasLabel(ctx.alias) }}
                                            <span v-if="ctx.is_required" class="text-red-500">*</span>
                                            <span v-if="ctx.is_multiple" class="text-[10px] text-slate-400 ml-1">(múltiple)</span>
                                        </label>
                                        <select
                                            v-if="!ctx.is_multiple"
                                            v-model="contextSelections[ctx.alias]"
                                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">-- Selecciona --</option>
                                            <option
                                                v-for="opt in contextOptions[ctx.alias] || []"
                                                :key="opt.id"
                                                :value="opt.id"
                                            >
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <select
                                            v-else
                                            v-model="contextSelections[ctx.alias]"
                                            multiple
                                            class="w-full min-h-[110px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        >
                                            <option
                                                v-for="opt in contextOptions[ctx.alias] || []"
                                                :key="opt.id"
                                                :value="opt.id"
                                            >
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <p v-if="!(contextOptions[ctx.alias] || []).length && !loadingContexts[ctx.alias]" class="text-[11px] text-amber-600 mt-1">
                                            No hay opciones disponibles en este college.
                                        </p>
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
const contextSelections = reactive<Record<string, number | number[] | ''>>({})
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
    Object.keys(contextSelections).forEach(k => delete contextSelections[k])
    formError.value = ''

    const role = selectedRole.value
    if (!role) return

    for (const ctx of role.required_contexts) {
        contextSelections[ctx.alias] = ctx.is_multiple ? [] : ''
        if (!contextOptions[ctx.alias]) {
            await loadContextOptions(ctx.alias)
        }
    }
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
        career:   'Carrera(s)',
        modality: 'Modalidad(es)',
        campus:   'Campus',
        college:  'College',
    }
    return labels[alias] || alias
}

async function assign() {
    if (!selectedRole.value) return
    formError.value = ''

    // Validar requeridos en frontend
    for (const ctx of selectedRole.value.required_contexts) {
        if (!ctx.is_required) continue
        const v = contextSelections[ctx.alias]
        if (ctx.is_multiple) {
            if (!Array.isArray(v) || v.length === 0) {
                formError.value = `Selecciona al menos un valor para ${aliasLabel(ctx.alias)}.`
                return
            }
        } else {
            if (v === '' || v === null || v === undefined) {
                formError.value = `Selecciona ${aliasLabel(ctx.alias)}.`
                return
            }
        }
    }

    const contexts: Record<string, number[]> = {}
    for (const ctx of selectedRole.value.required_contexts) {
        const v = contextSelections[ctx.alias]
        if (v === '' || v === null || v === undefined) continue
        contexts[ctx.alias] = Array.isArray(v) ? v.map(Number) : [Number(v)]
    }

    assigning.value = true
    try {
        const { data } = await api.post(API.COLLEGE_API.users.assign(props.user.id), {
            role_code: selectedRoleCode.value,
            contexts,
        })
        emit('changed', { ok: true, message: data.message || 'Rol asignado.' })
        selectedRoleCode.value = ''
        Object.keys(contextSelections).forEach(k => delete contextSelections[k])
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
