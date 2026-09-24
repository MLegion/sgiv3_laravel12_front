<template>
    <div class="space-y-5">
        <!-- Selector de plantilla -->
        <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Plantilla del login</p>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                    v-for="t in TEMPLATES"
                    :key="t.id"
                    type="button"
                    @click="template = t.id"
                    class="border rounded-lg p-2 text-left transition hover:shadow"
                    :class="template === t.id ? 'border-slate-800 ring-2 ring-slate-800/20 bg-slate-50' : 'border-gray-200'"
                >
                    <div class="h-16 rounded bg-slate-100 mb-2 overflow-hidden flex items-center justify-center" v-html="t.thumb"></div>
                    <p class="text-xs font-semibold text-gray-800">{{ t.label }}</p>
                    <p class="text-[10px] text-gray-500 leading-tight">{{ t.hint }}</p>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <!-- Controles -->
            <div class="space-y-5">
                <!-- Fondo -->
                <details class="border rounded-lg" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Fondo de la pantalla</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div class="flex gap-2">
                            <label v-for="bt in ['image','color','gradient']" :key="bt" class="flex-1">
                                <input type="radio" class="peer sr-only" :value="bt" v-model="cfg.background!.type" />
                                <span class="block text-center text-xs py-1.5 rounded border cursor-pointer peer-checked:bg-slate-800 peer-checked:text-white peer-checked:border-slate-800">
                                    {{ bt === 'image' ? 'Imagen' : bt === 'color' ? 'Color' : 'Degradado' }}
                                </span>
                            </label>
                        </div>
                        <div v-if="cfg.background!.type === 'color'" class="flex items-center gap-2">
                            <input type="color" v-model="cfg.background!.color" class="h-9 w-14 border rounded" />
                            <input type="text" v-model="cfg.background!.color" class="flex-1 h-9 px-3 border rounded text-sm" placeholder="#f1f5f9" />
                        </div>
                        <div v-else-if="cfg.background!.type === 'gradient'" class="space-y-2">
                            <div class="flex items-center gap-2">
                                <input type="color" v-model="cfg.background!.gradientFrom" class="h-9 w-14 border rounded" />
                                <span class="text-xs text-gray-500">→</span>
                                <input type="color" v-model="cfg.background!.gradientTo" class="h-9 w-14 border rounded" />
                                <label class="text-xs text-gray-500 ml-auto">Ángulo</label>
                                <input type="number" v-model.number="cfg.background!.gradientAngle" class="w-20 h-9 px-2 border rounded text-sm" />
                            </div>
                        </div>
                        <div v-else class="text-xs text-gray-500">
                            Usa la <strong>imagen de portada/fondo</strong> subida arriba. Puedes escribir otra URL:
                            <input type="text" v-model="cfg.background!.imageUrl" class="w-full h-9 px-3 border rounded text-sm mt-1" placeholder="(usa la portada subida)" />
                        </div>
                        <div class="pt-1">
                            <label class="text-xs text-gray-600 flex items-center justify-between">
                                <span>Oscurecer fondo (overlay)</span>
                                <span>{{ Math.round((cfg.background!.overlay ?? 0) * 100) }}%</span>
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="range" min="0" max="0.8" step="0.05" v-model.number="cfg.background!.overlay" class="flex-1" />
                                <input type="color" v-model="cfg.background!.overlayColor" class="h-8 w-12 border rounded" />
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Formulario / tarjeta -->
                <details class="border rounded-lg" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Formulario</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-600">Posición horizontal</label>
                                <select v-model="cfg.form!.position" class="w-full h-9 px-2 border rounded text-sm">
                                    <option value="left">Izquierda</option>
                                    <option value="center">Centro</option>
                                    <option value="right">Derecha</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs text-gray-600">Posición vertical</label>
                                <select v-model="cfg.form!.align" class="w-full h-9 px-2 border rounded text-sm">
                                    <option value="top">Arriba</option>
                                    <option value="center">Centro</option>
                                    <option value="bottom">Abajo</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-600">Ancho tarjeta (px)</label>
                                <input type="number" v-model.number="cfg.form!.cardWidth" class="w-full h-9 px-2 border rounded text-sm" placeholder="420" />
                            </div>
                            <div>
                                <label class="text-xs text-gray-600">Redondeo (px)</label>
                                <input type="number" v-model.number="cfg.form!.cardRadius" class="w-full h-9 px-2 border rounded text-sm" placeholder="16" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 items-end">
                            <div>
                                <label class="text-xs text-gray-600">Color tarjeta</label>
                                <div class="flex gap-2">
                                    <input type="color" v-model="cfg.form!.cardBg" class="h-9 w-12 border rounded" />
                                    <input type="text" v-model="cfg.form!.cardBg" class="flex-1 h-9 px-2 border rounded text-sm" placeholder="#ffffff" />
                                </div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-600 flex justify-between"><span>Opacidad tarjeta</span><span>{{ Math.round((cfg.form!.cardOpacity ?? 1) * 100) }}%</span></label>
                                <input type="range" min="0.4" max="1" step="0.05" v-model.number="cfg.form!.cardOpacity" class="w-full" />
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Split -->
                <details v-if="template === 'split'" class="border rounded-lg" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Diseño dividido</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div>
                            <label class="text-xs text-gray-600">Lado de la imagen</label>
                            <select v-model="cfg.split!.imageSide" class="w-full h-9 px-2 border rounded text-sm">
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 flex justify-between"><span>Ancho del formulario</span><span>{{ cfg.split!.formRatio }}%</span></label>
                            <input type="range" min="30" max="70" step="1" v-model.number="cfg.split!.formRatio" class="w-full" />
                        </div>
                    </div>
                </details>

                <!-- Colores -->
                <details class="border rounded-lg">
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Colores</summary>
                    <div class="px-4 pb-4 grid grid-cols-2 gap-3">
                        <div v-for="ck in COLOR_KEYS" :key="ck.key">
                            <label class="text-xs text-gray-600">{{ ck.label }}</label>
                            <div class="flex gap-2">
                                <input type="color" :value="cfg.colors![ck.key] || ck.def" @input="cfg.colors![ck.key] = ($event.target as HTMLInputElement).value" class="h-9 w-12 border rounded" />
                                <input type="text" v-model="cfg.colors![ck.key]" class="flex-1 h-9 px-2 border rounded text-sm" :placeholder="ck.def" />
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Tipografía -->
                <details class="border rounded-lg">
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Tipografía</summary>
                    <div class="px-4 pb-4 space-y-3">
                        <div>
                            <label class="text-xs text-gray-600">Familia tipográfica (CSS font-family)</label>
                            <input type="text" v-model="cfg.typography!.fontFamily" class="w-full h-9 px-2 border rounded text-sm" placeholder="Inter, system-ui, sans-serif" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-600">Tamaño título (px)</label>
                                <input type="number" v-model.number="cfg.typography!.titleSize" class="w-full h-9 px-2 border rounded text-sm" placeholder="20" />
                            </div>
                            <div>
                                <label class="text-xs text-gray-600">Tamaño base (px)</label>
                                <input type="number" v-model.number="cfg.typography!.baseSize" class="w-full h-9 px-2 border rounded text-sm" placeholder="14" />
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Mostrar -->
                <details class="border rounded-lg">
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 select-none">Elementos visibles</summary>
                    <div class="px-4 pb-4 grid grid-cols-2 gap-2">
                        <label v-for="sk in SHOW_KEYS" :key="sk.key" class="flex items-center gap-2 text-xs text-gray-700">
                            <input type="checkbox" :checked="cfg.show![sk.key] !== false" @change="cfg.show![sk.key] = ($event.target as HTMLInputElement).checked" />
                            {{ sk.label }}
                        </label>
                    </div>
                </details>

                <!-- HTML personalizado -->
                <details v-if="template === 'custom'" class="border rounded-lg border-amber-300 bg-amber-50/40" open>
                    <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-amber-800 select-none">HTML personalizado (avanzado)</summary>
                    <div class="px-4 pb-4 space-y-2">
                        <p class="text-xs text-amber-800">
                            Escribe la estructura completa del login. Coloca el marcador
                            <code class="bg-white px-1 rounded border">&lt;div data-login-form&gt;&lt;/div&gt;</code>
                            donde quieras que aparezca el formulario real (usuario/contraseña/Google).
                            Marcadores disponibles:
                            <code class="bg-white px-1 rounded border">&#123;&#123;title&#125;&#125;</code>,
                            <code class="bg-white px-1 rounded border">&#123;&#123;subtitle&#125;&#125;</code>,
                            <code class="bg-white px-1 rounded border">&#123;&#123;logo&#125;&#125;</code>,
                            <code class="bg-white px-1 rounded border">&#123;&#123;hero&#125;&#125;</code>,
                            <code class="bg-white px-1 rounded border">&#123;&#123;tecnm&#125;&#125;</code>,
                            <code class="bg-white px-1 rounded border">&#123;&#123;primary&#125;&#125;</code>.
                            Por seguridad se eliminan <code class="bg-white px-1 rounded border">&lt;script&gt;</code>, eventos <code>on*</code> e iframes.
                        </p>
                        <textarea
                            v-model="cfg.customHtml"
                            rows="14"
                            spellcheck="false"
                            class="w-full font-mono text-xs p-3 border rounded bg-white"
                            placeholder="<div class='min-h-screen flex items-center justify-center' style='background:#0f172a'>&#10;  <div class='bg-white rounded-xl p-8' style='width:360px'>&#10;    <img src='{{logo}}' style='height:56px;margin:0 auto 16px'/>&#10;    <h1 style='text-align:center;color:{{primary}}'>{{title}}</h1>&#10;    <div data-login-form></div>&#10;  </div>&#10;</div>"
                        ></textarea>
                        <button type="button" class="text-xs px-3 py-1.5 rounded border border-amber-400 bg-white hover:bg-amber-50" @click="loadStarterHtml">
                            Cargar ejemplo de arranque
                        </button>
                    </div>
                </details>
            </div>

            <!-- Vista previa en vivo -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium text-gray-700">Vista previa en vivo</p>
                    <span class="text-[10px] text-gray-400">escala 45% · no interactiva</span>
                </div>
                <div class="border rounded-lg overflow-hidden bg-slate-200" style="height: 560px">
                    <div class="preview-scale">
                        <component :is="previewComponent" :c="previewC" :branding="previewBranding" :config="cfg" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import LoginCentered from '@/modules/auth/components/login/templates/LoginCentered.vue'
import LoginSplit from '@/modules/auth/components/login/templates/LoginSplit.vue'
import LoginHero from '@/modules/auth/components/login/templates/LoginHero.vue'
import LoginMinimal from '@/modules/auth/components/login/templates/LoginMinimal.vue'
import LoginCustom from '@/modules/auth/components/login/templates/LoginCustom.vue'
import type { LoginController } from '@/modules/auth/composables/useLoginController'
import type { CollegeBranding, LoginConfig, LoginTemplate } from '@/modules/auth/services/branding.service'

const props = defineProps<{ branding: CollegeBranding | null; collegeName?: string | null }>()

const template = defineModel<LoginTemplate>('template', { default: 'centered' })
const config = defineModel<LoginConfig>('config', { default: () => ({}) })

/* -------- config reactiva con defaults completos -------- */
function fillDefaults(src: LoginConfig | null | undefined): Required<Pick<LoginConfig, 'background' | 'form' | 'split' | 'show' | 'colors' | 'typography'>> & LoginConfig {
    return {
        background: { type: 'image', color: '#f1f5f9', gradientFrom: '', gradientTo: '#1e293b', gradientAngle: 135, imageUrl: '', overlay: 0, overlayColor: '#000000', ...(src?.background ?? {}) },
        form: { position: 'center', align: 'center', cardWidth: undefined, cardRadius: 16, cardBg: '#ffffff', cardOpacity: 1, ...(src?.form ?? {}) },
        split: { imageSide: 'left', formRatio: 42, ...(src?.split ?? {}) },
        show: { hero: true, logos: true, subtitle: true, tecnmLogo: true, aspirantesLink: true, ...(src?.show ?? {}) },
        colors: { button: '', buttonText: '#ffffff', link: '', text: '', ...(src?.colors ?? {}) },
        typography: { fontFamily: '', titleSize: undefined, baseSize: undefined, ...(src?.typography ?? {}) },
        customHtml: src?.customHtml ?? '',
    }
}

const cfg = reactive<LoginConfig>(fillDefaults(config.value))

// Propaga cambios locales al v-model del padre. Anti-eco por JSON: no rehidrata
// cfg cuando el cambio del modelo lo emitimos nosotros (evita que el color-picker
// se "atore" al reemplazar objetos anidados en cada evento de arrastre).
let lastEmitted = JSON.stringify(config.value ?? {})
watch(cfg, () => {
    const clone = JSON.parse(JSON.stringify(cfg))
    lastEmitted = JSON.stringify(clone)
    config.value = clone
}, { deep: true })

// Si el padre reemplaza el config (recarga externa), rehidrata.
watch(() => config.value, (v) => {
    if (JSON.stringify(v ?? {}) === lastEmitted) return
    Object.assign(cfg, fillDefaults(v))
})

const COLOR_KEYS = [
    { key: 'button' as const, label: 'Botón', def: props.branding?.primary_color || '#4f46e5' },
    { key: 'buttonText' as const, label: 'Texto botón', def: '#ffffff' },
    { key: 'link' as const, label: 'Enlaces', def: props.branding?.primary_color || '#4f46e5' },
    { key: 'text' as const, label: 'Texto general', def: '#334155' },
]
const SHOW_KEYS = [
    { key: 'logos' as const, label: 'Logo del colegio' },
    { key: 'tecnmLogo' as const, label: 'Logo TecNM' },
    { key: 'subtitle' as const, label: 'Subtítulo' },
    { key: 'hero' as const, label: 'Imagen/ilustración' },
    { key: 'aspirantesLink' as const, label: 'Enlace aspirantes' },
]

const TEMPLATES: { id: LoginTemplate; label: string; hint: string; thumb: string }[] = [
    { id: 'centered', label: 'Centrado', hint: 'Tarjeta al centro', thumb: '<svg viewBox="0 0 80 50" class="w-full h-full"><rect width="80" height="50" fill="#e2e8f0"/><rect x="26" y="14" width="28" height="22" rx="2" fill="#fff" stroke="#94a3b8"/></svg>' },
    { id: 'split', label: 'Dividido', hint: 'Imagen + formulario', thumb: '<svg viewBox="0 0 80 50" class="w-full h-full"><rect width="80" height="50" fill="#e2e8f0"/><rect width="40" height="50" fill="#64748b"/><rect x="48" y="14" width="24" height="22" rx="2" fill="#fff" stroke="#94a3b8"/></svg>' },
    { id: 'hero', label: 'Fondo completo', hint: 'Imagen a pantalla', thumb: '<svg viewBox="0 0 80 50" class="w-full h-full"><rect width="80" height="50" fill="#475569"/><rect x="8" y="12" width="26" height="26" rx="2" fill="#fff" stroke="#94a3b8"/></svg>' },
    { id: 'minimal', label: 'Minimalista', hint: 'Limpio, sin adornos', thumb: '<svg viewBox="0 0 80 50" class="w-full h-full"><rect width="80" height="50" fill="#f8fafc"/><rect x="30" y="18" width="20" height="16" rx="1" fill="#fff" stroke="#cbd5e1"/></svg>' },
    { id: 'custom', label: 'Personalizado', hint: 'HTML libre', thumb: '<svg viewBox="0 0 80 50" class="w-full h-full"><rect width="80" height="50" fill="#fef3c7"/><text x="40" y="30" font-size="14" text-anchor="middle" fill="#b45309">&lt;/&gt;</text></svg>' },
]

/* -------- preview -------- */
const previewMap = { centered: LoginCentered, split: LoginSplit, hero: LoginHero, minimal: LoginMinimal, custom: LoginCustom }
const previewComponent = computed(() => previewMap[template.value] ?? LoginCentered)

// Branding para la vista previa (usa el subido + primary del branding real).
const previewBranding = computed<CollegeBranding>(() => ({
    ...(props.branding ?? {} as any),
    welcome_title: props.branding?.welcome_title || props.collegeName || 'Colegio',
} as CollegeBranding))

// Controlador simulado: solo para renderizar el formulario (no envía nada).
const previewC = computed(() => {
    const primary = props.branding?.primary_color || '#4f46e5'
    return {
        authStore: { mfaChallenge: false },
        collegeStore: { colleges: [] as any[], selectedCollege: null },
        branding: ref(previewBranding.value),
        brandedCollegeLocked: ref(true),
        brandedLogo: ref(props.branding?.logo_url ?? null),
        brandedTitle: ref(previewBranding.value.welcome_title),
        brandedSubtitle: ref(props.branding?.welcome_subtitle ?? null),
        brandedHero: ref(props.branding?.hero_url ?? null),
        primaryColor: ref(primary),
        disabledBanner: ref(false),
        collegeId: ref<number | null>(null),
        email: ref(''),
        password: ref(''),
        showPassword: ref(false),
        googleLoading: ref(false),
        submitting: ref(false),
        rememberMe: ref(false),
        errors: ref({}),
        googleDomain: ref(null),
        googleReady: ref(false),
        onGoogleLogin: () => {},
        onCollegeChange: () => {},
        submit: () => {},
    } as unknown as LoginController
})

const STARTER = `<div class="min-h-screen flex items-center justify-center" style="background:linear-gradient(135deg,{{primary}},#0f172a)">
  <div style="width:360px;background:#ffffff;border-radius:18px;padding:32px;box-shadow:0 20px 50px rgba(0,0,0,.35)">
    <img src="{{logo}}" alt="" style="height:56px;margin:0 auto 16px;display:block;object-fit:contain"/>
    <h1 style="text-align:center;color:{{primary}};font-size:20px;font-weight:700;margin-bottom:4px">{{title}}</h1>
    <p style="text-align:center;color:#64748b;font-size:13px;margin-bottom:20px">{{subtitle}}</p>
    <div data-login-form></div>
  </div>
</div>`

function loadStarterHtml() {
    cfg.customHtml = STARTER
}
</script>

<style scoped>
/* La vista previa renderiza las plantillas reales (min-h-screen) a escala. */
.preview-scale {
    width: 222%;
    height: 222%;
    transform: scale(0.45);
    transform-origin: top left;
    pointer-events: none;
}
</style>
