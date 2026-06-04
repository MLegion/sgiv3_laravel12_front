<template>
    <div class="space-y-5">
        <!-- Encabezado de página -->
        <header class="relative overflow-hidden rounded-2xl border bg-white px-5 py-4">
            <div class="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-50/70 to-transparent pointer-events-none"></div>
            <div class="relative flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-xl font-semibold text-slate-800 uppercase tracking-tight">Roles y sus menús</h1>
                    <p class="text-xs text-slate-500 mt-1 max-w-xl">
                        Vista <strong class="text-slate-600">informativa</strong>: muestra qué menús vería un usuario con
                        cada rol, el contexto que requiere y sus condiciones. No modifica permisos ni asignaciones.
                    </p>
                </div>
                <div v-if="!loading" class="flex gap-2 shrink-0">
                    <div class="rounded-xl border bg-white/70 backdrop-blur px-3 py-2 text-center min-w-[68px]">
                        <p class="text-lg font-black text-slate-800 leading-none">{{ roles.length }}</p>
                        <p class="text-[10px] uppercase text-slate-400 tracking-wider mt-0.5">roles</p>
                    </div>
                    <div class="rounded-xl border bg-white/70 backdrop-blur px-3 py-2 text-center min-w-[68px]">
                        <p class="text-lg font-black text-amber-600 leading-none">{{ contextRolesCount }}</p>
                        <p class="text-[10px] uppercase text-slate-400 tracking-wider mt-0.5">con ctx</p>
                    </div>
                </div>
            </div>
        </header>

        <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-400 px-1">
            <span class="inline-block w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin"></span>
            Cargando roles…
        </div>

        <div v-else class="roles-layout">
            <!-- Columna de roles (izquierda en escritorio, arriba en móvil) -->
            <aside class="roles-col space-y-2">
                <!-- Buscador -->
                <div class="relative">
                    <MagnifyingGlassIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input v-model="query" type="text" placeholder="Buscar rol…"
                        class="w-full rounded-xl border bg-white pl-9 pr-8 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition" />
                    <button v-if="query" type="button" @click="query = ''"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                </div>

                <!-- Lista -->
                <div class="rounded-xl border bg-white divide-y max-h-[70vh] overflow-y-auto">
                    <button v-for="(r, i) in filteredRoles" :key="r.code" type="button"
                        class="reveal w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 group"
                        :style="{ animationDelay: `${Math.min(i, 12) * 22}ms` }"
                        :class="selected?.code === r.code ? 'bg-blue-50/80 border-l-[3px] border-blue-500' : 'border-l-[3px] border-transparent'"
                        @click="selected = r">
                        <span class="min-w-0">
                            <span class="block text-sm font-medium truncate"
                                :class="selected?.code === r.code ? 'text-blue-700' : 'text-slate-700'">{{ r.name }}</span>
                            <span class="block text-[10px] font-mono text-slate-400 truncate">{{ r.code }}</span>
                        </span>
                        <span class="shrink-0 flex items-center gap-1">
                            <span v-if="r.requiredContexts.length"
                                class="w-1.5 h-1.5 rounded-full bg-amber-400"
                                title="Requiere contexto"></span>
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                                :class="r.menuCount ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'">
                                {{ r.menuCount }}
                            </span>
                        </span>
                    </button>

                    <div v-if="!filteredRoles.length" class="px-3 py-6 text-center text-xs text-slate-400">
                        Sin roles que coincidan con «{{ query }}».
                    </div>
                </div>
            </aside>

            <!-- Detalle del rol (derecha en escritorio) -->
            <section v-if="selected" :key="selected.code" class="detail-col space-y-4">
                <!-- Encabezado del rol -->
                <div class="rounded-2xl border bg-white p-5 reveal">
                    <div class="flex items-start justify-between flex-wrap gap-3">
                        <div class="min-w-0">
                            <h2 class="text-lg font-bold text-slate-800 truncate">{{ selected.name }}</h2>
                            <span class="text-[11px] font-mono text-slate-400">{{ selected.code }}</span>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-3xl font-black text-blue-600 leading-none tabular-nums">{{ selected.menuCount }}</p>
                            <p class="text-[10px] uppercase text-slate-400 tracking-wider">opciones de menú</p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Contexto requerido por el rol</p>
                        <div v-if="selected.requiredContexts.length" class="flex flex-wrap gap-2">
                            <span v-for="c in selected.requiredContexts" :key="c.alias"
                                class="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium"
                                :class="c.is_required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                                <span class="w-1.5 h-1.5 rounded-full" :class="c.is_required ? 'bg-amber-500' : 'bg-slate-400'"></span>
                                {{ c.alias }}<span v-if="c.is_required" class="opacity-70"> · obligatorio</span><span v-if="c.is_multiple" class="opacity-70"> · múltiple</span>
                            </span>
                        </div>
                        <p v-else class="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <GlobeAltIcon class="w-4 h-4 text-slate-400" /> Rol global · no requiere contexto.
                        </p>
                    </div>
                </div>

                <!-- Leyenda de badges -->
                <div v-if="selected.menus.length" class="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-slate-500">
                    <span class="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Leyenda</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-indigo-100 border border-indigo-200"></span> permiso requerido</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200"></span> público</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200"></span> contexto del ítem</span>
                    <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-200"></span> oculto para roles</span>
                </div>

                <!-- Menús -->
                <div v-if="!selected.menus.length" class="rounded-2xl border border-dashed bg-slate-50 p-10 text-center">
                    <Squares2X2Icon class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p class="text-sm text-slate-400">Este rol no otorga menús navegables.</p>
                </div>

                <div v-else class="space-y-3">
                    <div v-for="(group, gi) in groupedMenus" :key="group.section"
                        class="rounded-2xl border bg-white overflow-hidden reveal"
                        :style="{ animationDelay: `${gi * 35}ms` }">
                        <div class="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b flex items-center gap-2">
                            <FolderIcon class="w-4 h-4 text-slate-400 shrink-0" />
                            <span class="text-xs font-bold text-slate-600 uppercase tracking-wide truncate">{{ group.section || 'General' }}</span>
                            <span class="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">{{ group.items.length }}</span>
                        </div>
                        <ul class="divide-y">
                            <li v-for="(m, i) in group.items" :key="i"
                                class="px-4 py-2.5 flex items-start justify-between gap-3 hover:bg-blue-50/30 transition-colors">
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-slate-700">{{ m.label }}</p>
                                    <code class="text-[11px] text-slate-400">{{ m.route }}</code>
                                </div>
                                <div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[55%]">
                                    <span v-if="m.permission" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono">{{ m.permission }}</span>
                                    <span v-else class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">público</span>
                                    <span v-if="m.itemContext.length" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">ctx: {{ m.itemContext.join(', ') }}</span>
                                    <span v-if="m.excludeRoles.length" class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">oculto para: {{ m.excludeRoles.join(', ') }}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <div v-else class="detail-col rounded-2xl border border-dashed bg-slate-50 p-12 text-center">
                <CursorArrowRaysIcon class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p class="text-sm text-slate-400">Selecciona un rol para ver los menús que otorga.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { usePersistentRef } from '@/shared/composables/usePersistentRef'
import {
    FolderIcon, MagnifyingGlassIcon, XMarkIcon, GlobeAltIcon,
    Squares2X2Icon, CursorArrowRaysIcon,
} from '@heroicons/vue/24/outline'

interface RoleContext { alias: string; is_required: boolean; is_multiple: boolean }
interface RoleMenuItem { path: string; label: string; route: string; permission: string | null; itemContext: string[]; excludeRoles: string[] }
interface RoleMenus { code: string; name: string; requiredContexts: RoleContext[]; menuCount: number; menus: RoleMenuItem[] }

// Persistencia ligera para sobrevivir un F5 (rol seleccionado + búsqueda).
const loading = ref(true)
const roles = ref<RoleMenus[]>([])
const selected = ref<RoleMenus | null>(null)
const query = usePersistentRef<string>('college.rolesMenus.query', '')
const selectedCode = usePersistentRef<string>('college.rolesMenus.selectedCode', '')

watch(selected, r => { selectedCode.value = r?.code ?? '' })

const filteredRoles = computed<RoleMenus[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return roles.value
    return roles.value.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
})

const contextRolesCount = computed(() => roles.value.filter(r => r.requiredContexts.length > 0).length)

const groupedMenus = computed<{ section: string; items: RoleMenuItem[] }[]>(() => {
    if (!selected.value) return []
    const map = new Map<string, RoleMenuItem[]>()
    for (const m of selected.value.menus) {
        const key = m.path || ''
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(m)
    }
    return [...map.entries()].map(([section, items]) => ({ section, items }))
})

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.COLLEGE_API.roleMenus)
        roles.value = data ?? []
        // Restaura el rol guardado si sigue existiendo; si no, el primero.
        selected.value = roles.value.find(r => r.code === selectedCode.value) ?? roles.value[0] ?? null
    } finally { loading.value = false }
}

load()
</script>

<style scoped>
/* Layout dos columnas en escritorio, apilado en móvil — CSS plano para no depender del JIT */
.roles-layout {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: flex-start;
}
.roles-col { width: 100%; }
.detail-col { width: 100%; min-width: 0; }

@media (min-width: 768px) {
    .roles-layout { flex-direction: row; }
    .roles-col {
        width: 270px;
        flex-shrink: 0;
        position: sticky;
        top: 0.5rem;
    }
    .detail-col { flex: 1 1 0%; }
}

@keyframes reveal-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.reveal {
    animation: reveal-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
    .reveal { animation: none; }
}
</style>
