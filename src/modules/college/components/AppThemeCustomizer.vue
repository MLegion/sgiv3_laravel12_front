<template>
    <div class="space-y-5">
        <!-- Presets -->
        <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Tema de la aplicación</p>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                    v-for="p in PRESETS"
                    :key="p.id"
                    type="button"
                    @click="selectPreset(p.id)"
                    class="border rounded-lg p-2 text-left transition hover:shadow"
                    :class="cfg.preset === p.id ? 'border-slate-800 ring-2 ring-slate-800/20 bg-slate-50' : 'border-gray-200'"
                >
                    <div class="h-14 rounded mb-2 overflow-hidden flex" :style="{ backgroundColor: p.swatch.content }">
                        <div class="w-1/3" :style="{ backgroundColor: p.swatch.sidebar }"></div>
                        <div class="flex-1 flex flex-col">
                            <div class="h-3" :style="{ backgroundColor: p.swatch.navbar, borderBottom: '1px solid rgba(0,0,0,.08)' }"></div>
                        </div>
                    </div>
                    <p class="text-xs font-semibold text-gray-800">{{ p.label }}</p>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <!-- Controles -->
            <div class="space-y-5">
                <!-- Navbar -->
                <details class="border rounded-lg" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Barra superior (navbar)</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div>
                            <label class="text-xs text-gray-600">Estilo</label>
                            <select v-model="cfg.navbar!.variant" class="w-full h-9 px-2 border rounded text-sm">
                                <option value="light">Clara</option>
                                <option value="brand">Color de marca</option>
                                <option value="dark">Oscura</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-600">Fondo (override)</label>
                                <div class="flex gap-2">
                                    <input type="color" :value="cfg.navbar!.bg || '#ffffff'" @input="cfg.navbar!.bg = val($event)" class="h-9 w-12 border rounded" />
                                    <input type="text" v-model="cfg.navbar!.bg" class="flex-1 h-9 px-2 border rounded text-sm" placeholder="(auto)" />
                                </div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-600">Texto (override)</label>
                                <div class="flex gap-2">
                                    <input type="color" :value="cfg.navbar!.text || '#1e293b'" @input="cfg.navbar!.text = val($event)" class="h-9 w-12 border rounded" />
                                    <input type="text" v-model="cfg.navbar!.text" class="flex-1 h-9 px-2 border rounded text-sm" placeholder="(auto)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Sidebar -->
                <details class="border rounded-lg" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Menú lateral (sidebar)</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="sk in SIDEBAR_COLORS" :key="sk.key">
                                <label class="text-xs text-gray-600">{{ sk.label }}</label>
                                <div class="flex gap-2">
                                    <input type="color" :value="cfg.sidebar![sk.key] || sk.def" @input="cfg.sidebar![sk.key] = val($event)" class="h-9 w-12 border rounded" />
                                    <input type="text" v-model="cfg.sidebar![sk.key]" class="flex-1 h-9 px-2 border rounded text-sm" placeholder="(auto)" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 flex justify-between"><span>Ancho expandido</span><span>{{ cfg.sidebar!.width || 288 }}px</span></label>
                            <input type="range" min="220" max="360" step="4" :value="cfg.sidebar!.width || 288" @input="cfg.sidebar!.width = Number(val($event))" class="w-full" />
                        </div>
                    </div>
                </details>

                <!-- Contenido -->
                <details class="border rounded-lg">
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Área de contenido</summary>
                    <div class="px-4 pb-4">
                        <label class="text-xs text-gray-600">Fondo del contenido (override)</label>
                        <div class="flex gap-2">
                            <input type="color" :value="cfg.contentBg || '#f8fafc'" @input="cfg.contentBg = val($event)" class="h-9 w-12 border rounded" />
                            <input type="text" v-model="cfg.contentBg" class="flex-1 h-9 px-2 border rounded text-sm" placeholder="(auto)" />
                        </div>
                    </div>
                </details>

                <p class="text-xs text-gray-500">
                    Los <em>override</em> vacíos usan los colores del preset. El color primario se toma del ajuste de arriba
                    y también tiñe botones e items activos.
                </p>
            </div>

            <!-- Vista previa en vivo -->
            <div>
                <p class="text-sm font-medium text-gray-700 mb-2">Vista previa en vivo</p>
                <div class="border rounded-lg overflow-hidden" :style="previewVars">
                    <!-- navbar -->
                    <div class="h-11 flex items-center justify-between px-3 border-b" :style="{ backgroundColor: 'var(--app-navbar-bg)', borderColor: 'var(--app-navbar-border)' }">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded flex items-center justify-center text-white font-black text-[9px]" :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }">S3</div>
                            <span class="text-xs font-black" :style="{ color: 'var(--app-navbar-text)' }">{{ collegeName || 'Colegio' }}</span>
                        </div>
                        <div class="text-right leading-tight">
                            <p class="text-[8px] font-black uppercase tracking-widest" :style="{ color: 'var(--app-navbar-muted)' }">Usuario</p>
                            <p class="text-[10px] font-bold" :style="{ color: 'var(--app-navbar-text)' }">Admin</p>
                        </div>
                    </div>
                    <!-- body -->
                    <div class="flex" style="height: 300px" :style="{ backgroundColor: 'var(--app-content-bg)' }">
                        <!-- sidebar -->
                        <div class="w-40 border-r p-2 flex flex-col" :style="{ backgroundColor: 'var(--app-sidebar-bg)', borderColor: 'var(--app-sidebar-border)' }">
                            <p class="text-[8px] font-black uppercase tracking-[0.2em] px-2 pb-2" :style="{ color: 'var(--app-sidebar-muted)' }">Navegación</p>
                            <div class="space-y-1 text-[10px]">
                                <div class="px-2 py-1.5 rounded-lg font-semibold flex items-center gap-1.5" :style="{ backgroundColor: 'var(--app-sidebar-active-bg)', color: 'var(--app-sidebar-active-text)' }">
                                    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--app-sidebar-active-text)' }"></span> Inicio
                                </div>
                                <div class="px-2 py-1.5 rounded-lg flex items-center gap-1.5" :style="{ color: 'var(--app-sidebar-text)' }">
                                    <span class="w-1.5 h-1.5 rounded-full opacity-50" :style="{ backgroundColor: 'var(--app-sidebar-muted)' }"></span> Estudiantes
                                </div>
                                <div class="px-2 py-1.5 rounded-lg flex items-center gap-1.5" :style="{ backgroundColor: 'var(--app-sidebar-hover-bg)', color: 'var(--app-sidebar-hover-text)' }">
                                    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: 'var(--app-sidebar-hover-text)' }"></span> Reportes <span class="text-[7px] opacity-70">(hover)</span>
                                </div>
                                <p class="px-2 pt-2 text-[8px] font-black uppercase tracking-widest" :style="{ color: 'var(--app-sidebar-muted)' }">Grupo</p>
                                <div class="px-2 py-1 flex items-center gap-1.5" :style="{ color: 'var(--app-sidebar-text)' }">
                                    <span class="w-1.5 h-1.5 rounded-full opacity-50" :style="{ backgroundColor: 'var(--app-sidebar-muted)' }"></span> Sub-item
                                </div>
                            </div>
                        </div>
                        <!-- contenido -->
                        <div class="flex-1 p-3 space-y-2">
                            <div class="h-3 w-1/2 bg-black/10 rounded"></div>
                            <div class="h-2 w-3/4 bg-black/5 rounded"></div>
                            <div class="h-2 w-2/3 bg-black/5 rounded"></div>
                            <button type="button" disabled class="mt-2 px-3 py-1 text-[10px] text-white rounded font-medium" :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }">Acción primaria</button>
                        </div>
                    </div>
                    <!-- footer -->
                    <div class="py-1.5 px-3 text-center text-[9px] border-t" :style="{ backgroundColor: 'var(--app-navbar-bg)', borderColor: 'var(--app-navbar-border)', color: 'var(--app-navbar-muted)' }">
                        © {{ collegeName || 'Colegio' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { resolveAppThemeVars, type AppTheme, type AppThemePreset, type CollegeBranding } from '@/modules/auth/services/branding.service'

const props = defineProps<{ branding: CollegeBranding | null; collegeName?: string | null }>()
const theme = defineModel<AppTheme>('theme', { default: () => ({}) })

function fillTheme(src: AppTheme | null | undefined): AppTheme {
    return {
        preset: src?.preset ?? 'light',
        contentBg: src?.contentBg ?? '',
        navbar: { variant: src?.navbar?.variant ?? 'light', bg: src?.navbar?.bg ?? '', text: src?.navbar?.text ?? '', muted: src?.navbar?.muted ?? '', border: src?.navbar?.border ?? '' },
        sidebar: {
            bg: src?.sidebar?.bg ?? '', text: src?.sidebar?.text ?? '', muted: src?.sidebar?.muted ?? '', border: src?.sidebar?.border ?? '',
            hoverBg: src?.sidebar?.hoverBg ?? '', hoverText: src?.sidebar?.hoverText ?? '',
            activeBg: src?.sidebar?.activeBg ?? '', activeText: src?.sidebar?.activeText ?? '',
            width: src?.sidebar?.width,
        },
    }
}

const cfg = reactive<AppTheme>(fillTheme(theme.value))

let syncing = false
watch(cfg, () => {
    if (syncing) return
    theme.value = JSON.parse(JSON.stringify(cfg))
}, { deep: true })
watch(() => theme.value, (v) => {
    syncing = true
    Object.assign(cfg, fillTheme(v))
    syncing = false
})

function val(e: Event): string { return (e.target as HTMLInputElement).value }

function selectPreset(p: AppThemePreset) {
    cfg.preset = p
    // Limpia overrides para que el preset se vea tal cual (conserva la variante de navbar).
    cfg.contentBg = ''
    Object.assign(cfg.sidebar!, { bg: '', text: '', muted: '', border: '', hoverBg: '', hoverText: '', activeBg: '', activeText: '' })
    Object.assign(cfg.navbar!, { bg: '', text: '', muted: '', border: '' })
}

const SIDEBAR_COLORS = [
    { key: 'bg' as const, label: 'Fondo', def: '#ffffff' },
    { key: 'text' as const, label: 'Texto', def: '#475569' },
    { key: 'activeBg' as const, label: 'Item activo', def: props.branding?.primary_color || '#4f46e5' },
    { key: 'activeText' as const, label: 'Texto activo', def: '#ffffff' },
]

const PRESETS: { id: AppThemePreset; label: string; swatch: { content: string; navbar: string; sidebar: string } }[] = [
    { id: 'light', label: 'Claro', swatch: { content: '#f8fafc', navbar: '#ffffff', sidebar: '#ffffff' } },
    { id: 'dark-sidebar', label: 'Sidebar oscuro', swatch: { content: '#f8fafc', navbar: '#ffffff', sidebar: '#0f172a' } },
    { id: 'slate', label: 'Pizarra', swatch: { content: '#f1f5f9', navbar: '#ffffff', sidebar: '#1e293b' } },
    { id: 'brand-sidebar', label: 'Sidebar de marca', swatch: { content: '#f8fafc', navbar: '#ffffff', sidebar: props.branding?.primary_color || '#4f46e5' } },
    { id: 'custom', label: 'Personalizado', swatch: { content: '#eef2ff', navbar: '#ffffff', sidebar: '#312e81' } },
]

const previewVars = computed(() => resolveAppThemeVars(cfg, props.branding?.primary_color || '#4f46e5'))
</script>
