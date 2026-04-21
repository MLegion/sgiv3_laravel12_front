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

            <template #cell-acciones="{ row }">
                <div class="flex items-center justify-center">
                    <button
                        type="button"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        @click="openDrawer(row)"
                    >
                        <AdjustmentsHorizontalIcon class="w-4 h-4" />
                        Gestionar
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
</script>
