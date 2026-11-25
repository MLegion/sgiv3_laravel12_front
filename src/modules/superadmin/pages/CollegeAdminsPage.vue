<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800">ADMINISTRADORES DEL PLANTEL</h1>

        <!-- Filtro college -->
        <div class="bg-white rounded-lg shadow p-4 flex items-end gap-4">
            <label class="flex-1 block">
                <span class="text-sm text-gray-700">Institución educativa</span>
                <select
                    v-model="selectedCollegeId"
                    @change="loadEmployees"
                    class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                >
                    <option :value="null" disabled>Selecciona un plantel…</option>
                    <option v-for="c in colleges" :key="c.id" :value="c.id">
                        {{ c.name }}
                    </option>
                </select>
            </label>
            <div v-if="selectedCollegeId" class="text-sm">
                <div>
                    <span class="text-gray-600">Administradores:</span>
                    <span class="font-semibold ml-1">{{ adminCount }} / {{ adminLimit }}</span>
                </div>
                <div v-if="adminCount >= adminLimit" class="text-xs text-amber-600">
                    Límite alcanzado — revoca uno para asignar otro.
                </div>
            </div>
        </div>

        <!-- Lista empleados -->
        <div v-if="selectedCollegeId" class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-3 border-b flex items-center gap-3">
                <input
                    v-model="search"
                    type="text"
                    aria-label="Buscar por nombre o email"
                    placeholder="Buscar por nombre o email…"
                    class="w-full md:w-80 h-9 px-3 text-sm border rounded-md"
                />
                <span class="text-xs text-gray-500 ml-auto">{{ filteredRows.length }} empleados</span>
            </div>

            <div v-if="loading" class="p-4"><SkeletonTable :rows="5" :cols="5" /></div>
            <div v-else-if="filteredRows.length === 0" class="p-8 text-center text-sm text-gray-500">
                Sin resultados.
            </div>

            <DataTable v-else :columns="columns" :rows="filteredRows" hide-search caption="Administradores del plantel" empty-text="Sin resultados.">
                <template #cell-employee="{ row }">
                    {{ row.names }} {{ row.first_surname }} {{ row.second_surname ?? '' }}
                </template>
                <template #cell-email="{ row }">
                    <span class="text-gray-600">{{ row.email }}</span>
                </template>
                <template #cell-status="{ row }">
                    <span
                        class="text-xs px-2 py-1 rounded"
                        :class="row.employee_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'"
                    >
                        {{ row.employee_active ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
                <template #cell-admin_role="{ row }">
                    <span
                        v-if="row.is_admin"
                        class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium"
                    >
                        Admin
                    </span>
                    <span v-else class="text-xs text-gray-400">—</span>
                </template>
                <template #cell-action="{ row }">
                    <button
                        v-if="row.is_admin"
                        type="button"
                        class="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                        :disabled="busyId === row.user_id"
                        @click="revoke(row)"
                    >
                        Revocar
                    </button>
                    <button
                        v-else
                        type="button"
                        class="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="busyId === row.user_id || adminCount >= adminLimit || !row.employee_active"
                        :title="adminCount >= adminLimit
                            ? 'Límite de administradores alcanzado'
                            : (!row.employee_active ? 'Empleado inactivo' : 'Asignar como admin')"
                        @click="assign(row)"
                    >
                        Asignar admin
                    </button>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from '@/app/composables/useConfirm'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

interface Employee {
    user_id: number
    employee_id: number
    email: string
    names: string
    first_surname: string
    second_surname: string | null
    employee_active: boolean
    is_admin: boolean
}

interface College {
    id: number
    name: string
    shortName?: string
}

const columns: DataTableColumn<Employee>[] = [
    { key: 'employee', label: 'Empleado' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Estado', align: 'center' },
    { key: 'admin_role', label: 'Rol Admin', align: 'center' },
    { key: 'action', label: 'Acción', align: 'center' },
]

const colleges = ref<College[]>([])
const selectedCollegeId = ref<number | null>(null)
const rows = ref<Employee[]>([])
const loading = ref(false)
const search = ref('')
const busyId = ref<number | null>(null)
const adminCount = ref(0)
const adminLimit = ref(2)

const filteredRows = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return rows.value
    return rows.value.filter(r =>
        r.email.toLowerCase().includes(q)
        || `${r.names} ${r.first_surname} ${r.second_surname ?? ''}`.toLowerCase().includes(q)
    )
})

async function loadColleges() {
    const { data } = await api.get(API.SUPERADMIN_API.colleges.list, {
        params: { per_page: 100 }
    })
    colleges.value = data.items ?? data ?? []
}

async function loadEmployees() {
    if (!selectedCollegeId.value) return
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.colleges.employeesWithAdminFlag(selectedCollegeId.value)
        )
        rows.value = data.items ?? []
        adminCount.value = data.admin_count ?? 0
        adminLimit.value = data.admin_limit ?? 2
    } finally {
        loading.value = false
    }
}

async function assign(row: Employee) {
    if (!selectedCollegeId.value) return
    busyId.value = row.user_id
    try {
        await api.post(
            API.SUPERADMIN_API.colleges.assignAdmin(selectedCollegeId.value),
            { user_id: row.user_id }
        )
        await loadEmployees()
    } catch (e: any) {
        useToast().error(e?.response?.data?.message || 'Error al asignar admin.')
    } finally {
        busyId.value = null
    }
}

async function revoke(row: Employee) {
    if (!selectedCollegeId.value) return
    if (!await useConfirm().confirm({ title: 'Revocar rol admin', message: `¿Revocar rol admin a ${row.names} ${row.first_surname}?`, variant: 'danger', confirmText: 'Revocar' })) return
    busyId.value = row.user_id
    try {
        await api.delete(
            API.SUPERADMIN_API.colleges.removeAdmin(selectedCollegeId.value, row.user_id)
        )
        await loadEmployees()
    } catch (e: any) {
        useToast().error(e?.response?.data?.message || 'Error al revocar admin.')
    } finally {
        busyId.value = null
    }
}

onMounted(loadColleges)
</script>
