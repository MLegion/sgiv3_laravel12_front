<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">USUARIOS DEL COLLEGE</h1>
            <p class="text-sm text-slate-500 mt-1">
                Asigna roles y sus contextos (carreras, modalidades) a los empleados del college.
            </p>
        </div>

        <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg" :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
            {{ banner.message }}
        </div>

        <!-- Filtro por rol -->
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <label class="flex-1 block max-w-md">
                <span class="text-sm text-gray-700">Filtrar por rol</span>
                <select
                    v-model="selectedRoleCode"
                    @change="fetchData"
                    class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                >
                    <option value="">Todos los roles</option>
                    <option v-for="r in availableRoles" :key="r.code" :value="r.code">
                        {{ r.name }}
                    </option>
                </select>
            </label>
            <div v-if="selectedRoleCode" class="text-sm">
                <span class="text-gray-600">Usuarios con este rol:</span>
                <span class="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                    {{ pagination?.total ?? 0 }}
                </span>
            </div>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :perPageOptions="[10, 15, 30, 50]"
            @change="handleChange"
        >
            <template #cell-id="{ value }">
                <div class="font-medium text-center">{{ value }}</div>
            </template>

            <template #cell-name="{ row }">
                <span class="font-medium text-slate-800">{{ row.name }}</span>
            </template>

            <template #cell-email="{ row }">
                <span class="text-slate-600">{{ row.email }}</span>
            </template>

            <template #cell-roles="{ row }">
                <div class="flex flex-wrap gap-1">
                    <span
                        v-for="a in row.assignments"
                        :key="a.id"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold"
                    >
                        {{ a.role_name }}
                    </span>
                    <span v-if="!row.assignments || row.assignments.length === 0" class="text-xs text-slate-400">
                        Sin roles
                    </span>
                </div>
            </template>

            <template #cell-estado="{ row }">
                <div class="flex flex-col items-start gap-0.5">
                    <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        :class="row.isDisabled ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'"
                    >
                        {{ row.isDisabled ? 'DESHABILITADO' : 'ACTIVO' }}
                    </span>
                    <span v-if="row.isDisabled && row.disabledReason" class="text-[10px] text-slate-500 italic max-w-[200px] truncate" :title="row.disabledReason ?? ''">
                        {{ row.disabledReason }}
                    </span>
                </div>
            </template>

            <template #cell-acciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        @click="openDrawer(row)"
                    >
                        <AdjustmentsHorizontalIcon class="w-4 h-4" />
                        Gestionar
                    </button>
                    <button
                        v-if="!row.isDisabled"
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition"
                        @click="openDisableModal(row)"
                        title="Deshabilitar usuario — lo desconectará al instante"
                    >
                        Deshabilitar
                    </button>
                    <button
                        v-else
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
                        @click="reactivate(row)"
                        :disabled="enabling === row.id"
                    >
                        {{ enabling === row.id ? 'Reactivando…' : 'Reactivar' }}
                    </button>
                </div>
            </template>
        </DataTable>

        <AssignRoleDrawer
            v-if="drawerUser"
            :user="drawerUser"
            @close="drawerUser = null"
            @changed="onDrawerChanged"
        />

        <!-- Modal de razón al deshabilitar -->
        <Teleport to="body">
            <div v-if="disableModal.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="closeDisableModal" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                    <h3 class="text-base font-bold text-slate-800 uppercase">Deshabilitar usuario</h3>
                    <p class="text-sm text-slate-600">
                        Se desconectará al instante a <strong>{{ disableModal.userName }}</strong> de cualquier sesión activa y no podrá ingresar de nuevo. Indica la razón (queda en auditoría).
                    </p>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Razón (mínimo 5 caracteres)
                        </label>
                        <textarea
                            v-model="disableModal.reason"
                            rows="4"
                            maxlength="500"
                            placeholder="Ej. El usuario ya no labora en el plantel / cuenta comprometida / etc."
                            class="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            :disabled="disableModal.submitting"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[11px] text-slate-400">{{ disableModal.reason.length }}/500</span>
                            <p v-if="disableModal.error" class="text-[11px] text-red-600">{{ disableModal.error }}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-md border hover:bg-slate-50"
                                :disabled="disableModal.submitting"
                                @click="closeDisableModal">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                :disabled="disableModal.submitting || disableModal.reason.trim().length < 5"
                                @click="submitDisable">
                            {{ disableModal.submitting ? 'DESHABILITANDO…' : 'DESHABILITAR' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import AssignRoleDrawer from '@/modules/college/components/AssignRoleDrawer.vue'
import { AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline'

interface Assignment {
    id: number
    role_id: number
    role_code: string
    role_name: string
    contexts: Record<string, number[]>
}

interface UserRow {
    id: number
    name: string
    email: string
    assignments: Assignment[]
    isDisabled?: boolean
    disabledAt?: string | null
    disabledReason?: string | null
}

const drawerUser = ref<UserRow | null>(null)
const banner = reactive({ message: '', ok: false })

const selectedRoleCode = ref<string>('')
const availableRoles = ref<{ code: string; name: string }[]>([])
const extraSearch = ref<Record<string, string>>({})

const columns: DataTableColumn<UserRow>[] = [
    { key: 'id',       label: '#',       field: 'id',    sortable: true },
    { key: 'name',     label: 'NOMBRE',  field: 'name',  sortable: true, searchable: true },
    { key: 'email',    label: 'CORREO',  field: 'email', sortable: true, searchable: true },
    { key: 'roles',    label: 'ROLES ASIGNADOS'                         },
    { key: 'estado',   label: 'ESTADO'                                  },
    { key: 'acciones', label: 'ACCIONES'                                },
]

const {
    rows,
    loading,
    pagination,
    fetchData: rawFetch,
    handleChange,
} = useDataTableFetch<UserRow>({
    endpoint: API.COLLEGE_API.users.list,
    initialPerPage: 15,
    extraSearch,
    mapResponse: data => ({
        items:   data.items,
        total:   data.total,
        page:    data.page,
        perPage: data.perPage,
    }),
})

/** Re-fetch agregando role_code como query param extra */
function fetchData() {
    // usa extraSearch para que el useDataTableFetch envíe role_code
    extraSearch.value = selectedRoleCode.value
        ? { role_code: selectedRoleCode.value }
        : {}
    rawFetch()
}

async function loadRoles() {
    try {
        const { data } = await api.get(API.COLLEGE_API.assignableRoles)
        availableRoles.value = (data?.items ?? data ?? [])
            .map((r: any) => ({ code: r.code, name: r.name }))
    } catch (e) {
        availableRoles.value = []
    }
}

onMounted(loadRoles)
fetchData()

function openDrawer(row: UserRow) {
    drawerUser.value = row
}

function onDrawerChanged(payload: { ok: boolean, message: string }) {
    banner.ok = payload.ok
    banner.message = payload.message
    fetchData()
}

// ── Deshabilitar / reactivar usuario ────────────────────────────────────────
const enabling = ref<number | null>(null)
const disableModal = reactive({
    open: false,
    userId: 0,
    userName: '',
    reason: '',
    submitting: false,
    error: '' as string | '',
})

function openDisableModal(row: UserRow) {
    disableModal.open = true
    disableModal.userId = row.id
    disableModal.userName = row.name
    disableModal.reason = ''
    disableModal.error = ''
    disableModal.submitting = false
}

function closeDisableModal() {
    if (disableModal.submitting) return
    disableModal.open = false
}

async function submitDisable() {
    disableModal.error = ''
    disableModal.submitting = true
    try {
        await api.post(API.COLLEGE_API.users.disable(disableModal.userId), {
            reason: disableModal.reason.trim(),
        })
        banner.ok = true
        banner.message = `Usuario ${disableModal.userName} deshabilitado.`
        disableModal.open = false
        fetchData()
    } catch (e: any) {
        disableModal.error = e?.response?.data?.message ?? 'No se pudo deshabilitar el usuario.'
    } finally {
        disableModal.submitting = false
    }
}

async function reactivate(row: UserRow) {
    enabling.value = row.id
    try {
        await api.post(API.COLLEGE_API.users.enable(row.id))
        banner.ok = true
        banner.message = `Usuario ${row.name} reactivado.`
        fetchData()
    } catch (e: any) {
        banner.ok = false
        banner.message = e?.response?.data?.message ?? 'No se pudo reactivar el usuario.'
    } finally {
        enabling.value = null
    }
}
</script>
