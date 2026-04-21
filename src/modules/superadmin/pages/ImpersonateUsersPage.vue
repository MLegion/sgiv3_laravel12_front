<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">SIMULAR USUARIO</h1>
                <p class="text-sm text-slate-500 mt-1">
                    Selecciona un usuario para visualizar el sistema desde su sesión.
                </p>
            </div>
            <router-link
                to="/superadmin/impersonate/logs"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
                <ClipboardDocumentListIcon class="w-4 h-4" />
                Ver Bitácora
            </router-link>
        </div>

        <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg" :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
            {{ banner.message }}
        </div>

        <!-- Toggle: mostrar solo con simulación activa -->
        <div class="bg-white rounded-lg border px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                    type="checkbox"
                    v-model="onlyActive"
                    class="rounded border-gray-300"
                />
                <span class="text-slate-700">Solo usuarios con simulación activa</span>
                <span
                    v-if="activeUserIds.size > 0"
                    class="ml-1 inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
                >
                    {{ activeUserIds.size }}
                </span>
            </label>
            <button
                type="button"
                class="text-xs px-3 py-1 rounded border hover:bg-gray-50"
                :disabled="loading"
                @click="loadActiveImpersonations"
                title="Refrescar lista de sesiones activas"
            >
                Refrescar
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="filteredRows"
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
                <span
                    v-if="activeUserIds.has(row.id)"
                    class="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200"
                    title="Tiene una sesión de simulación activa"
                >
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Activa
                </span>
            </template>

            <template #cell-email="{ row }">
                <span class="text-slate-600">{{ row.email }}</span>
            </template>

            <template #cell-type="{ row }">
                <span
                    v-if="row.type"
                    class="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border"
                    :class="typeClass[row.type]"
                >
                    {{ typeLabel[row.type] }}
                </span>
                <span v-else class="text-xs text-slate-400 italic">—</span>
            </template>

            <template #cell-college="{ row }">
                <div v-if="row.college_name" class="min-w-0">
                    <p class="text-sm text-slate-700 font-medium truncate" :title="row.college_name">
                        {{ row.college_short || row.college_name }}
                    </p>
                </div>
                <span v-else class="text-xs text-slate-400 italic">—</span>
            </template>

            <template #cell-acciones="{ row }">
                <div class="flex items-center justify-center">
                    <button
                        v-if="activeUserIds.has(row.id)"
                        type="button"
                        :disabled="busyUserId === row.id"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition"
                        :title="'Hay una simulación activa para este usuario. Clic para forzar cierre.'"
                        @click="handleRevoke(row)"
                    >
                        <XMarkIcon class="w-4 h-4" />
                        {{ busyUserId === row.id ? 'Revocando...' : 'Revocar' }}
                    </button>
                    <button
                        v-else
                        type="button"
                        :disabled="busyUserId === row.id"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                        @click="handleImpersonate(row)"
                    >
                        <EyeIcon class="w-4 h-4" />
                        {{ busyUserId === row.id ? 'Iniciando...' : 'Simular' }}
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { EyeIcon, XMarkIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

interface UserRow {
    id: number
    name: string
    email: string
    type: 'employee' | 'student' | 'applicant' | null
    college_id: number | null
    college_name: string | null
    college_short: string | null
}

const auth = useAuthStore()
const busyUserId = ref<number | null>(null)
const banner = reactive({ message: '', ok: false })
const activeUserIds = ref<Set<number>>(new Set())
const onlyActive = ref(false)

async function loadActiveImpersonations() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.impersonation.active)
        activeUserIds.value = new Set<number>(
            (data.items ?? []).map((i: any) => i.impersonated_user_id)
        )
    } catch {
        activeUserIds.value = new Set()
    }
}

onMounted(loadActiveImpersonations)

const columns: DataTableColumn<UserRow>[] = [
    { key: 'id',        label: '#',          field: 'id',    sortable: true },
    { key: 'name',      label: 'NOMBRE',     field: 'name',  sortable: true, searchable: true },
    { key: 'email',     label: 'CORREO',     field: 'email', sortable: true, searchable: true },
    { key: 'type',      label: 'TIPO'                                       },
    { key: 'college',   label: 'COLLEGE'                                    },
    { key: 'acciones',  label: 'ACCIONES' },
]

const typeLabel: Record<string, string> = {
    employee:  'Empleado',
    student:   'Estudiante',
    applicant: 'Aspirante',
}

const typeClass: Record<string, string> = {
    employee:  'bg-indigo-50 text-indigo-700 border-indigo-100',
    student:   'bg-emerald-50 text-emerald-700 border-emerald-100',
    applicant: 'bg-amber-50 text-amber-700 border-amber-100',
}

const {
    rows,
    loading,
    pagination,
    fetchData,
    handleChange,
} = useDataTableFetch<UserRow>({
    endpoint: API.SUPERADMIN_API.impersonation.users,
    initialPerPage: 15,
    mapResponse: data => ({
        items:   data.items,
        total:   data.total,
        page:    data.page,
        perPage: data.perPage,
    }),
})

fetchData()

const filteredRows = computed(() =>
    onlyActive.value
        ? rows.value.filter(r => activeUserIds.value.has(r.id))
        : rows.value
)

async function handleImpersonate(row: UserRow) {
    if (busyUserId.value !== null) return
    busyUserId.value = row.id
    banner.message = ''
    try {
        await auth.startImpersonation({ userId: row.id })
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo iniciar la simulación.'
    } finally {
        busyUserId.value = null
    }
}

async function handleRevoke(row: UserRow) {
    if (busyUserId.value !== null) return
    if (!confirm(`¿Revocar la simulación activa de ${row.name}?`)) return
    busyUserId.value = row.id
    banner.message = ''
    try {
        await api.delete(API.SUPERADMIN_API.impersonation.revoke(row.id))
        activeUserIds.value.delete(row.id)
        activeUserIds.value = new Set(activeUserIds.value)  // trigger reactivity
        banner.ok = true
        banner.message = `Simulación de ${row.name} revocada.`
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo revocar la simulación.'
    } finally {
        busyUserId.value = null
    }
}
</script>
