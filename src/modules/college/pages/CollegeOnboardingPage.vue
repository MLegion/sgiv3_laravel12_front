<template>
    <!-- Overlay a pantalla completa: sustituye el template normal de la app -->
    <div class="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
        <div class="min-h-full flex flex-col">
            <!-- Encabezado -->
            <header class="bg-white border-b border-slate-200">
                <div class="max-w-4xl mx-auto px-6 py-5">
                    <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Configuración inicial</p>
                    <h1 class="text-xl font-bold text-slate-900 mt-1">
                        Bienvenido{{ collegeName ? ` — ${collegeName}` : '' }}
                    </h1>
                    <p class="text-sm text-slate-500 mt-1">
                        Antes de empezar, completa la información de tu institución. Este paso es obligatorio.
                    </p>

                    <!-- Stepper -->
                    <ol class="flex items-center gap-2 mt-5">
                        <li v-for="(s, i) in steps" :key="s.key" class="flex items-center gap-2 flex-1">
                            <div class="flex items-center gap-2">
                                <span
                                    class="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition"
                                    :class="stepCircleClass(i + 1)"
                                >
                                    <svg v-if="i + 1 < step" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd" />
                                    </svg>
                                    <span v-else>{{ i + 1 }}</span>
                                </span>
                                <span class="text-xs font-medium hidden sm:block" :class="i + 1 <= step ? 'text-slate-800' : 'text-slate-400'">
                                    {{ s.label }}
                                </span>
                            </div>
                            <div v-if="i < steps.length - 1" class="flex-1 h-px bg-slate-200"></div>
                        </li>
                    </ol>
                </div>
            </header>

            <!-- Contenido -->
            <main class="flex-1">
                <div class="max-w-4xl mx-auto px-6 py-8">
                    <div v-if="loading" class="text-center text-slate-400 py-20">Cargando…</div>

                    <template v-else>
                        <!-- PASO 1: Datos institucionales -->
                        <section v-show="step === 1" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-semibold text-slate-900">Datos de la institución</h2>
                                <p class="text-sm text-slate-500">Nombre, clave y domicilio oficial del plantel.</p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div class="sm:col-span-2">
                                    <FormInput label="NOMBRE DE LA INSTITUCIÓN" v-model="info.name" uppercase />
                                </div>
                                <FormInput label="CLAVE / SIGLAS" v-model="info.short_name" uppercase />
                            </div>

                            <div class="border-t border-slate-100 pt-4">
                                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Domicilio</p>
                                <GeoAddressFields
                                    :address="info.address"
                                    :geo-settlement-id="info.geo_settlement_id"
                                    :initial-postal-code="info.postal_code"
                                    @update:address="v => info.address = v"
                                    @update:geo-settlement-id="v => info.geo_settlement_id = v"
                                />
                            </div>

                            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                            <div class="flex justify-end pt-2">
                                <button
                                    type="button"
                                    class="px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }"
                                    :disabled="!step1Valid || savingInfo"
                                    @click="saveInfoAndNext"
                                >
                                    {{ savingInfo ? 'Guardando…' : 'Guardar y continuar' }}
                                </button>
                            </div>
                        </section>

                        <!-- PASO 2: Imagen del colegio -->
                        <section v-show="step === 2" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-semibold text-slate-900">Imagen del colegio</h2>
                                <p class="text-sm text-slate-500">Color institucional y logotipo. Puedes ajustarlo después.</p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Color primario</label>
                                        <div class="flex items-center gap-3">
                                            <input type="color" v-model="branding.primary_color" class="h-10 w-14 rounded border border-slate-300 cursor-pointer" />
                                            <input type="text" v-model="branding.primary_color" class="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                        </div>
                                    </div>
                                    <FormInput label="TÍTULO EN LA BARRA SUPERIOR" v-model="branding.navbar_title" />
                                </div>

                                <BrandingAssetUploader
                                    label="Logotipo del colegio"
                                    :current-url="brandingUrls.logo_url"
                                    :uploading="uploadingLogo"
                                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                    @upload="onUploadLogo"
                                    @delete="onDeleteLogo"
                                />
                            </div>

                            <div class="flex justify-between pt-2">
                                <button type="button" class="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100" @click="step = 1">
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    class="px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm disabled:opacity-50"
                                    :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }"
                                    :disabled="savingBranding"
                                    @click="saveBrandingAndNext"
                                >
                                    {{ savingBranding ? 'Guardando…' : 'Guardar y continuar' }}
                                </button>
                            </div>
                        </section>

                        <!-- PASO 3: Pantalla de acceso -->
                        <section v-show="step === 3" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-semibold text-slate-900">Pantalla de acceso</h2>
                                <p class="text-sm text-slate-500">Elige cómo se verá el login de tu institución.</p>
                            </div>

                            <LoginCustomizer
                                v-model:template="loginTemplate"
                                v-model:config="loginConfig"
                                :branding="brandingForPreview"
                                :college-name="collegeName"
                            />

                            <div class="flex justify-between pt-2">
                                <button type="button" class="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100" @click="step = 2">
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    class="px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm disabled:opacity-50"
                                    :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }"
                                    :disabled="savingLogin"
                                    @click="saveLoginAndNext"
                                >
                                    {{ savingLogin ? 'Guardando…' : 'Guardar y continuar' }}
                                </button>
                            </div>
                        </section>

                        <!-- PASO 4: Revisión -->
                        <section v-show="step === 4" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-semibold text-slate-900">Revisión</h2>
                                <p class="text-sm text-slate-500">Confirma la información antes de entrar al sistema.</p>
                            </div>

                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div><dt class="text-slate-400 text-xs uppercase tracking-widest">Institución</dt><dd class="text-slate-800 font-medium">{{ info.name || '—' }}</dd></div>
                                <div><dt class="text-slate-400 text-xs uppercase tracking-widest">Clave</dt><dd class="text-slate-800 font-medium">{{ info.short_name || '—' }}</dd></div>
                                <div class="sm:col-span-2"><dt class="text-slate-400 text-xs uppercase tracking-widest">Domicilio</dt><dd class="text-slate-800 font-medium">{{ info.address || '—' }}</dd></div>
                                <div><dt class="text-slate-400 text-xs uppercase tracking-widest">Ubicación</dt><dd class="text-slate-800 font-medium">{{ locationLabel || '—' }}</dd></div>
                                <div>
                                    <dt class="text-slate-400 text-xs uppercase tracking-widest">Color</dt>
                                    <dd class="flex items-center gap-2 text-slate-800 font-medium">
                                        <span class="h-4 w-4 rounded-full border border-slate-300" :style="{ backgroundColor: branding.primary_color }"></span>
                                        {{ branding.primary_color }}
                                    </dd>
                                </div>
                            </dl>

                            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                            <div class="flex justify-between pt-2">
                                <button type="button" class="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100" @click="step = 3">
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    class="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm disabled:opacity-50"
                                    :disabled="finishing"
                                    @click="finish"
                                >
                                    {{ finishing ? 'Finalizando…' : 'Finalizar y entrar' }}
                                </button>
                            </div>
                        </section>
                    </template>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import GeoAddressFields from '@/app/components/ui/form/GeoAddressFields.vue'
import BrandingAssetUploader from '@/modules/college/components/BrandingAssetUploader.vue'
import LoginCustomizer from '@/modules/college/components/LoginCustomizer.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBrandingStore } from '@/modules/auth/stores/branding.store'
import {
    fetchSetup,
    updateSetupInfo,
    completeSetup,
} from '@/modules/college/services/college-setup.service'
import {
    fetchAdminBranding,
    updateAdminBranding,
    uploadAdminBrandingAsset,
    deleteAdminBrandingAsset,
    type CollegeBranding,
    type LoginTemplate,
    type LoginConfig,
} from '@/modules/auth/services/branding.service'

const router = useRouter()
const auth = useAuthStore()
const brandingStore = useBrandingStore()

const steps = [
    { key: 'info',     label: 'Institución' },
    { key: 'branding', label: 'Imagen' },
    { key: 'login',    label: 'Acceso' },
    { key: 'review',   label: 'Revisión' },
] as const

const step = ref(1)
const loading = ref(true)
const error = ref<string | null>(null)

const savingInfo = ref(false)
const savingBranding = ref(false)
const savingLogin = ref(false)
const finishing = ref(false)
const uploadingLogo = ref(false)

const collegeName = ref<string | null>(null)

const info = reactive({
    name: '' as string,
    short_name: '' as string,
    address: null as string | null,
    geo_settlement_id: null as number | null,
    postal_code: null as string | null,
    // Etiquetas legibles de la ubicación (solo para la pantalla de revisión).
    colonyLabel: '',
    municipalityLabel: '',
    stateLabel: '',
})

// Copia editable del branding (solo los campos que toca el asistente).
const branding = reactive({
    primary_color: '#4f46e5',
    navbar_title: '' as string,
})
// URLs de assets (logo) devueltas por el backend.
const brandingUrls = reactive({ logo_url: null as string | null })
// Estado completo del branding para las vistas previas del LoginCustomizer.
const fullBranding = ref<CollegeBranding | null>(null)
const loginTemplate = ref<LoginTemplate>('centered')
const loginConfig = ref<LoginConfig>({})

const step1Valid = computed(() =>
    !!info.address && info.address.trim().length > 0 && info.geo_settlement_id !== null,
)

const locationLabel = computed(() => {
    const parts = [info.colonyLabel, info.municipalityLabel, info.stateLabel].filter(Boolean)
    return parts.join(', ')
})

const brandingForPreview = computed<CollegeBranding | null>(() => {
    if (!fullBranding.value) return null
    return {
        ...fullBranding.value,
        primary_color: branding.primary_color,
        navbar_title: branding.navbar_title || null,
        logo_url: brandingUrls.logo_url,
        login_template: loginTemplate.value,
        login_config: loginConfig.value,
    }
})

function stepCircleClass(n: number): string {
    if (n < step.value) return 'bg-emerald-500 border-emerald-500 text-white'
    if (n === step.value) return 'border-slate-800 text-slate-800 bg-white'
    return 'border-slate-300 text-slate-400 bg-white'
}

onMounted(async () => {
    try {
        const [setup, brand] = await Promise.all([fetchSetup(), fetchAdminBranding()])
        collegeName.value = setup.college.name
        info.name = setup.college.name ?? ''
        info.short_name = setup.college.short_name ?? ''
        info.address = setup.college.address
        info.geo_settlement_id = setup.college.geo_settlement_id
        info.postal_code = setup.college.postal_code
        info.colonyLabel = setup.college.colony ?? ''
        info.municipalityLabel = setup.college.municipality ?? ''
        info.stateLabel = setup.college.state ?? ''

        fullBranding.value = brand.branding
        branding.primary_color = brand.branding.primary_color || '#4f46e5'
        branding.navbar_title = brand.branding.navbar_title ?? ''
        brandingUrls.logo_url = brand.branding.logo_url
        loginTemplate.value = brand.branding.login_template ?? 'centered'
        loginConfig.value = brand.branding.login_config ?? {}
    } finally {
        loading.value = false
    }
})

async function saveInfoAndNext() {
    if (!step1Valid.value) return
    error.value = null
    savingInfo.value = true
    try {
        const res = await updateSetupInfo({
            name: info.name || null,
            short_name: info.short_name || null,
            address: info.address as string,
            geo_settlement_id: info.geo_settlement_id as number,
        })
        collegeName.value = res.college.name
        info.postal_code = res.college.postal_code
        info.colonyLabel = res.college.colony ?? ''
        info.municipalityLabel = res.college.municipality ?? ''
        info.stateLabel = res.college.state ?? ''
        step.value = 2
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo guardar la información.'
    } finally {
        savingInfo.value = false
    }
}

function applyBranding(b: CollegeBranding) {
    fullBranding.value = b
    brandingUrls.logo_url = b.logo_url
    brandingStore.setBranding(b)
}

async function saveBrandingAndNext() {
    savingBranding.value = true
    try {
        const res = await updateAdminBranding({
            primary_color: branding.primary_color || '#4f46e5',
            navbar_title: branding.navbar_title || null,
        })
        applyBranding(res.branding)
        step.value = 3
    } finally {
        savingBranding.value = false
    }
}

async function onUploadLogo(file: File) {
    uploadingLogo.value = true
    try {
        const res = await uploadAdminBrandingAsset('logo', file)
        applyBranding(res.branding)
    } finally {
        uploadingLogo.value = false
    }
}

async function onDeleteLogo() {
    uploadingLogo.value = true
    try {
        const res = await deleteAdminBrandingAsset('logo')
        applyBranding(res.branding)
    } finally {
        uploadingLogo.value = false
    }
}

async function saveLoginAndNext() {
    savingLogin.value = true
    try {
        const res = await updateAdminBranding({
            login_template: loginTemplate.value,
            login_config: loginConfig.value,
        })
        applyBranding(res.branding)
        step.value = 4
    } finally {
        savingLogin.value = false
    }
}

async function finish() {
    error.value = null
    finishing.value = true
    try {
        await completeSetup()
        auth.markCollegeSetupCompleted()
        router.replace('/')
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo finalizar la configuración.'
        finishing.value = false
    }
}
</script>
