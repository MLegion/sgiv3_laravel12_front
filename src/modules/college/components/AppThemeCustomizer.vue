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
                <div class="border rounded-lg overflow-hidden">
                    <AppThemePreview :theme="cfg" :branding="branding" :college-name="collegeName" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppThemePreview from '@/modules/college/components/preview/AppThemePreview.vue'
import { type AppTheme, type AppThemePreset, type CollegeBranding } from '@/modules/auth/services/branding.service'

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

// Anti-eco: guardamos el último JSON emitido para NO rehidratar cfg cuando el
// cambio en el modelo proviene de nosotros mismos (evita que el color-picker se
// "atore" al reemplazar objetos anidados en cada evento de arrastre).
let lastEmitted = JSON.stringify(theme.value ?? {})
watch(cfg, () => {
    const clone = JSON.parse(JSON.stringify(cfg))
    lastEmitted = JSON.stringify(clone)
    theme.value = clone
}, { deep: true })
watch(() => theme.value, (v) => {
    if (JSON.stringify(v ?? {}) === lastEmitted) return  // eco propio → ignorar
    Object.assign(cfg, fillTheme(v))
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

</script>
