<template>
    <div class="space-y-4">
        <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-lg font-bold text-slate-800">Mis notificaciones</h1>
                <p class="text-xs text-slate-500">Bandeja completa con búsqueda y filtros. Eliminar quita la notificación de tu vista; queda en el sistema para auditoría.</p>
            </div>
            <button
                v-if="store.unreadCount > 0"
                class="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                @click="markAll"
            >Marcar todas como leídas</button>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[180px]">
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-1">Buscar</label>
                <input v-model="search" type="text" placeholder="Asunto o cuerpo..." class="w-full border rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-1">Estado</label>
                <select v-model="statusFilter" class="border rounded-md px-2 py-1.5 text-sm">
                    <option value="all">Todas</option>
                    <option value="unread">Sin leer</option>
                    <option value="read">Leídas</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-1">Por página</label>
                <select v-model.number="perPage" class="border rounded-md px-2 py-1.5 text-sm">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                </select>
            </div>
        </div>

        <!-- Barra de selección masiva (sólo cuando hay seleccionadas) -->
        <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
        >
            <div
                v-if="selectedCount > 0"
                class="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2"
            >
                <div class="text-xs text-indigo-900">
                    <span class="font-bold">{{ selectedCount }}</span> seleccionada{{ selectedCount === 1 ? '' : 's' }}
                </div>
                <div class="flex items-center gap-2">
                    <button
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                        @click="bulkMarkReadSelected"
                    >
                        <CheckIcon class="w-4 h-4" />
                        Marcar leídas
                    </button>
                    <button
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-50"
                        @click="confirmBulkDelete"
                    >
                        <TrashIcon class="w-4 h-4" />
                        Eliminar
                    </button>
                    <button
                        class="text-xs text-slate-500 hover:text-slate-700 underline"
                        @click="clearSelection"
                    >Cancelar</button>
                </div>
            </div>
        </transition>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div v-if="loading" class="p-6 text-sm text-slate-400 italic text-center">Cargando...</div>
            <div v-else-if="items.length === 0" class="p-6 text-sm text-slate-400 italic text-center">Sin notificaciones que coincidan.</div>
            <template v-else>
                <!-- Header con checkbox "seleccionar todo" -->
                <div class="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                    <input
                        type="checkbox"
                        class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        :checked="allOnPageSelected"
                        :indeterminate.prop="someOnPageSelected && !allOnPageSelected"
                        @change="toggleSelectAllOnPage"
                    />
                    <span class="text-[11px] uppercase font-bold tracking-wide text-slate-500">
                        {{ allOnPageSelected ? 'Quitar selección de la página' : 'Seleccionar página' }}
                    </span>
                </div>
                <ul class="divide-y divide-slate-100">
                    <li
                        v-for="n in items"
                        :key="n.id"
                        class="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3"
                        :class="[
                            !n.read_at ? 'bg-indigo-50/40' : '',
                            selected.has(n.id) ? 'ring-2 ring-indigo-300 ring-inset' : ''
                        ]"
                    >
                        <input
                            type="checkbox"
                            class="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            :checked="selected.has(n.id)"
                            @change="toggleOne(n.id)"
                        />
                        <span class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" :class="n.read_at ? 'bg-transparent' : 'bg-indigo-500'" />
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-sm font-semibold text-slate-800">{{ n.subject || '(sin asunto)' }}</p>
                                <span v-if="!n.read_at" class="text-[9px] uppercase font-bold tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Nuevo</span>
                            </div>
                            <p class="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{{ n.body_rendered }}</p>
                            <p class="text-[10px] text-slate-400 mt-1">{{ formatDateTime(n.created_at) }}</p>
                        </div>
                        <div class="flex items-start gap-1">
                            <button aria-label="Marcar como leída"
                                v-if="!n.read_at"
                                class="p-1.5 rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Marcar como leída"
                                @click="markRead(n.id)"
                            >
                                <CheckIcon class="w-4 h-4" />
                            </button>
                            <button aria-label="Eliminar de mi bandeja"
                                class="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Eliminar de mi bandeja"
                                @click="confirmDelete(n.id)"
                            >
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </li>
                </ul>
            </template>
        </div>

        <div v-if="lastPage > 1" class="flex items-center justify-between text-xs text-slate-600">
            <span>Página {{ page }} / {{ lastPage }} · {{ total }} notificaciones</span>
            <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-md border disabled:opacity-50" :disabled="page <= 1" @click="page--">Anterior</button>
                <button class="px-3 py-1.5 rounded-md border disabled:opacity-50" :disabled="page >= lastPage" @click="page++">Siguiente</button>
            </div>
        </div>

        <!-- Modal de confirmación de eliminación masiva -->
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="bulkDeleteOpen"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="cancelBulkDelete"
            >
                <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 translate-y-2"
                    appear
                >
                    <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-sm overflow-hidden">
                        <div class="p-6">
                            <div class="flex items-start gap-4">
                                <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 text-red-600">
                                    <TrashIcon class="w-5 h-5" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-base font-bold text-slate-800">¿Eliminar {{ selectedCount }} notificación{{ selectedCount === 1 ? '' : 'es' }}?</h3>
                                    <p class="text-sm text-slate-500 mt-1">
                                        Las notificaciones seleccionadas se quitarán de tu bandeja.
                                        Quedan en el sistema para auditoría pero ya no las verás.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                :disabled="bulkDeleting"
                                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-60"
                                @click="cancelBulkDelete"
                            >Cancelar</button>
                            <button
                                type="button"
                                :disabled="bulkDeleting"
                                class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-60"
                                @click="performBulkDelete"
                            >{{ bulkDeleting ? 'Eliminando...' : `Eliminar ${selectedCount}` }}</button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>

        <!-- Modal de confirmación de eliminación (single) -->
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="deleteTarget"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="cancelDelete"
            >
                <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 translate-y-2"
                    appear
                >
                    <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-sm overflow-hidden">
                        <div class="p-6">
                            <div class="flex items-start gap-4">
                                <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 text-red-600">
                                    <TrashIcon class="w-5 h-5" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-base font-bold text-slate-800">¿Eliminar notificación?</h3>
                                    <p class="text-sm text-slate-500 mt-1">
                                        Se quitará de tu bandeja. La notificación se conserva para auditoría pero ya no la verás.
                                    </p>
                                    <p v-if="deleteTarget.subject" class="mt-2 text-xs font-semibold text-slate-700 truncate">
                                        "{{ deleteTarget.subject }}"
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                :disabled="deleting"
                                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-60"
                                @click="cancelDelete"
                            >Cancelar</button>
                            <button
                                type="button"
                                :disabled="deleting"
                                class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-60"
                                @click="performDelete"
                            >{{ deleting ? 'Eliminando...' : 'Eliminar' }}</button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CheckIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useNotificationsStore } from '@/modules/notifications/stores/notifications.store'
import type { NotificationItem } from '@/modules/notifications/types/notification.type'

const store = useNotificationsStore()

const items    = ref<NotificationItem[]>([])
const loading  = ref(false)
const page     = ref(1)
const perPage  = ref(20)
const total    = ref(0)
const lastPage = ref(1)

const search       = ref('')
const statusFilter = ref<'all' | 'read' | 'unread'>('all')

// Single delete modal target
const deleteTarget = ref<NotificationItem | null>(null)
const deleting     = ref(false)

// Bulk
const selected     = ref<Set<number>>(new Set())
const bulkDeleteOpen = ref(false)
const bulkDeleting   = ref(false)

const selectedCount = computed(() => selected.value.size)
const allOnPageSelected = computed(() =>
    items.value.length > 0 && items.value.every(i => selected.value.has(i.id))
)
const someOnPageSelected = computed(() =>
    items.value.some(i => selected.value.has(i.id))
)

let debounceTimer: number | undefined

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.NOTIFICATIONS_API.inbox.list, {
            params: {
                page: page.value,
                per_page: perPage.value,
                status_filter: statusFilter.value,
                search: search.value.trim() || undefined,
            },
        })
        items.value    = data?.items ?? []
        total.value    = data?.total ?? 0
        lastPage.value = data?.lastPage ?? 1
    } finally {
        loading.value = false
    }
}

async function markRead(id: number) {
    await store.markRead(id)
    const it = items.value.find(i => i.id === id)
    if (it && !it.read_at) it.read_at = new Date().toISOString()
}

async function markAll() {
    await store.markAllRead()
    const now = new Date().toISOString()
    items.value = items.value.map(i => ({ ...i, read_at: i.read_at ?? now }))
}

function confirmDelete(id: number) {
    const target = items.value.find(i => i.id === id) ?? null
    if (!target) return
    deleteTarget.value = target
}

function cancelDelete() {
    if (deleting.value) return
    deleteTarget.value = null
}

async function performDelete() {
    if (!deleteTarget.value || deleting.value) return
    deleting.value = true
    try {
        const id = deleteTarget.value.id
        await store.remove(id)
        items.value = items.value.filter(i => i.id !== id)
        total.value = Math.max(0, total.value - 1)
        selected.value.delete(id)
        deleteTarget.value = null
    } finally {
        deleting.value = false
    }
}

function toggleOne(id: number) {
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id); else next.add(id)
    selected.value = next
}

function toggleSelectAllOnPage() {
    const next = new Set(selected.value)
    if (allOnPageSelected.value) {
        items.value.forEach(i => next.delete(i.id))
    } else {
        items.value.forEach(i => next.add(i.id))
    }
    selected.value = next
}

function clearSelection() {
    selected.value = new Set()
}

async function bulkMarkReadSelected() {
    const ids = Array.from(selected.value)
    if (ids.length === 0) return
    await store.bulkMarkRead(ids)
    const now = new Date().toISOString()
    items.value = items.value.map(i => ids.includes(i.id) && !i.read_at ? { ...i, read_at: now } : i)
    clearSelection()
}

function confirmBulkDelete() {
    if (selected.value.size === 0) return
    bulkDeleteOpen.value = true
}

function cancelBulkDelete() {
    if (bulkDeleting.value) return
    bulkDeleteOpen.value = false
}

async function performBulkDelete() {
    if (bulkDeleting.value) return
    const ids = Array.from(selected.value)
    if (ids.length === 0) return
    bulkDeleting.value = true
    try {
        const affected = await store.bulkRemove(ids)
        items.value = items.value.filter(i => !ids.includes(i.id))
        total.value = Math.max(0, total.value - affected)
        clearSelection()
        bulkDeleteOpen.value = false
        // Si la página actual quedó vacía y hay anteriores, retroceder.
        if (items.value.length === 0 && page.value > 1) {
            page.value--
        }
    } finally {
        bulkDeleting.value = false
    }
}

function formatDateTime(iso: string): string {
    if (!iso) return ''
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

watch(page, () => { clearSelection(); load() })
watch([perPage, statusFilter], () => { clearSelection(); page.value = 1; load() })
watch(search, () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => { clearSelection(); page.value = 1; load() }, 300)
})

// Recargar el listado cuando llega una notificación nueva vía WS.
// El store incrementa wsTick en cada evento .notification.delivered;
// esto evita acoplar la página al canal Echo y mantiene una sola fuente.
watch(() => store.wsTick, (next, prev) => {
    console.log('[InboxPage] wsTick:', prev, '→', next, '— reload')
    load()
})

onMounted(load)
</script>
