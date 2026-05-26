<template>
    <div class="max-w-5xl mx-auto p-6 space-y-6">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900">Imagen del Colegio</h1>
                <p class="text-sm text-gray-600 mt-1">
                    Personaliza el login y el tema de la app para tu colegio.
                    Los usuarios podrán entrar por <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/auth/login/{{ shortNameLower }}</code>.
                </p>
            </div>
            <button
                v-if="loginUrl"
                type="button"
                class="text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
                @click="copyLoginUrl"
            >
                Copiar URL de login
            </button>
        </div>

        <div v-if="loading" class="bg-white rounded-lg shadow p-6 text-gray-500">Cargando…</div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Columna izquierda: formulario -->
            <div class="bg-white rounded-lg shadow p-6 space-y-5">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
                    <div class="flex items-center gap-3">
                        <input
                            type="color"
                            v-model="form.primary_color"
                            class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            v-model="form.primary_color"
                            placeholder="#4f46e5"
                            class="flex-1 h-10 px-3 border border-gray-300 rounded"
                        />
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Hex (#RRGGBB). Se aplica al login y a la app autenticada.</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Título de bienvenida</label>
                    <input
                        v-model="form.welcome_title"
                        type="text"
                        placeholder="Bienvenido al ITSTB"
                        class="w-full h-10 px-3 border border-gray-300 rounded"
                        maxlength="120"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Sub-título de bienvenida</label>
                    <input
                        v-model="form.welcome_subtitle"
                        type="text"
                        placeholder="Acceso al Sistema Integral de Gestión"
                        class="w-full h-10 px-3 border border-gray-300 rounded"
                        maxlength="200"
                    />
                </div>

                <div class="pt-3 border-t">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">App autenticada</p>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Texto en la navbar</label>
                    <input
                        v-model="form.navbar_title"
                        type="text"
                        placeholder="ITSTB · Sistema Integral de Gestión"
                        class="w-full h-10 px-3 border border-gray-300 rounded"
                        maxlength="80"
                    />
                    <p class="text-xs text-gray-500 mt-1">Vacío = se muestra el nombre del colegio.</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Texto del footer</label>
                    <input
                        v-model="form.footer_text"
                        type="text"
                        placeholder="© ITSTB · 2026"
                        class="w-full h-10 px-3 border border-gray-300 rounded"
                        maxlength="300"
                    />
                    <p class="text-xs text-gray-500 mt-1">Vacío = no se muestra footer.</p>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t">
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                        @click="reload"
                        :disabled="saving"
                    >
                        Descartar
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        @click="save"
                        :disabled="saving"
                    >
                        {{ saving ? 'Guardando…' : 'Guardar cambios' }}
                    </button>
                </div>

                <div class="pt-4 border-t space-y-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Login</p>
                    <BrandingAssetUploader
                        label="Logo en el formulario de login"
                        :current-url="branding?.logo_url ?? null"
                        :uploading="uploading.logo"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        @upload="(f: File) => onUpload('logo', f)"
                        @delete="() => onDelete('logo')"
                    />
                    <BrandingAssetUploader
                        label="Imagen de portada / fondo del login"
                        :current-url="branding?.hero_url ?? null"
                        :uploading="uploading.hero"
                        accept="image/png,image/jpeg,image/webp"
                        @upload="(f: File) => onUpload('hero', f)"
                        @delete="() => onDelete('hero')"
                    />

                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-2">Navbar (app autenticada)</p>
                    <BrandingAssetUploader
                        label="Logo izquierdo (reemplaza TecNM)"
                        :current-url="branding?.navbar_logo_left_url ?? null"
                        :uploading="uploading.navbar_logo_left"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        @upload="(f: File) => onUpload('navbar_logo_left', f)"
                        @delete="() => onDelete('navbar_logo_left')"
                    />
                    <BrandingAssetUploader
                        label="Logo derecho (reemplaza ITSTB)"
                        :current-url="branding?.navbar_logo_right_url ?? null"
                        :uploading="uploading.navbar_logo_right"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        @upload="(f: File) => onUpload('navbar_logo_right', f)"
                        @delete="() => onDelete('navbar_logo_right')"
                    />
                </div>
            </div>

            <!-- Columna derecha: vista previa -->
            <div class="bg-white rounded-lg shadow p-6 space-y-3">
                <p class="text-sm font-medium text-gray-700">Vista previa del login</p>
                <div
                    class="border rounded-lg overflow-hidden bg-cover bg-center"
                    :style="previewBg"
                >
                    <div class="p-6 bg-white/95">
                        <div class="flex items-center justify-between mb-4">
                            <img src="/img/TecNM.png" alt="TecNM" class="h-12 object-contain" />
                            <h2 class="text-center text-sm md:text-base font-semibold leading-snug" :style="{ color: form.primary_color || '#1d4ed8' }">
                                {{ form.welcome_title || (collegeName || 'Colegio') }}
                                <span v-if="form.welcome_subtitle" class="block text-xs font-normal text-gray-500 mt-0.5">
                                    {{ form.welcome_subtitle }}
                                </span>
                            </h2>
                            <img
                                :src="branding?.logo_url || '/img/ITSTB.jpg'"
                                alt="Logo"
                                class="h-12 object-contain"
                            />
                        </div>
                        <div class="space-y-2">
                            <input type="text" placeholder="Usuario" class="w-full h-9 px-3 border border-gray-300 rounded text-sm" disabled />
                            <input type="password" placeholder="Contraseña" class="w-full h-9 px-3 border border-gray-300 rounded text-sm" disabled />
                            <button
                                type="button"
                                class="w-full h-9 text-white font-semibold rounded shadow-sm text-sm"
                                :style="{ backgroundColor: form.primary_color || '#4f46e5' }"
                                disabled
                            >
                                INGRESAR
                            </button>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-500">La portada se muestra como fondo del panel del login.</p>

                <!-- Vista previa del layout autenticado -->
                <p class="text-sm font-medium text-gray-700 pt-4 border-t mt-4">Vista previa del layout autenticado</p>
                <div class="border rounded-lg overflow-hidden bg-slate-50">
                    <!-- Navbar mock -->
                    <div class="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3">
                        <div class="flex items-center gap-2 min-w-0">
                            <img
                                v-if="branding?.navbar_logo_left_url"
                                :src="branding.navbar_logo_left_url"
                                alt="Logo"
                                class="h-7 w-auto object-contain"
                            />
                            <div
                                v-else
                                class="w-6 h-6 rounded flex items-center justify-center text-white font-black text-[10px]"
                                :style="{ backgroundColor: form.primary_color || '#4f46e5' }"
                            >S3</div>
                            <span class="text-xs font-bold text-slate-700 truncate">
                                {{ form.navbar_title || collegeName || 'SGI v3' }}
                            </span>
                            <img
                                v-if="branding?.navbar_logo_right_url"
                                :src="branding.navbar_logo_right_url"
                                alt="Logo"
                                class="h-7 w-auto object-contain"
                            />
                        </div>
                        <div
                            class="w-7 h-7 rounded-xl bg-slate-100 font-black flex items-center justify-center text-xs"
                            :style="{ color: form.primary_color || '#4f46e5' }"
                        >U</div>
                    </div>

                    <!-- Body: sidebar + contenido -->
                    <div class="flex h-40">
                        <!-- Sidebar mock -->
                        <div class="w-32 bg-white border-r border-slate-200 p-2 space-y-1 text-[10px]">
                            <div
                                class="px-2 py-1.5 rounded-lg text-white font-semibold flex items-center gap-1"
                                :style="{ backgroundColor: form.primary_color || '#4f46e5' }"
                            >
                                <span class="w-2 h-2 rounded-full bg-white/80"></span>
                                Activo
                            </div>
                            <div class="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                                Inactivo
                            </div>
                            <div class="px-2 py-1.5 rounded-lg text-slate-600 flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                                Otro
                            </div>
                            <div
                                class="px-2 pt-2 pb-0.5 text-[8px] font-black uppercase tracking-widest"
                                :style="{ color: form.primary_color || '#4f46e5' }"
                            >Grupo</div>
                            <div class="pl-2 border-l-2" :style="{ borderColor: hexWithAlpha(form.primary_color || '#4f46e5', 0.2) }">
                                <div class="px-2 py-1 text-slate-500">Sub-item</div>
                            </div>
                        </div>

                        <!-- Contenido placeholder -->
                        <div class="flex-1 p-3 space-y-2">
                            <div class="h-3 w-1/2 bg-slate-200 rounded"></div>
                            <div class="h-2 w-3/4 bg-slate-100 rounded"></div>
                            <div class="h-2 w-2/3 bg-slate-100 rounded"></div>
                            <div class="pt-2">
                                <button
                                    type="button"
                                    class="px-3 py-1 text-[10px] text-white rounded font-medium"
                                    :style="{ backgroundColor: form.primary_color || '#4f46e5' }"
                                    disabled
                                >
                                    Acción primaria
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Footer mock -->
                    <div
                        v-if="form.footer_text"
                        class="py-2 px-3 text-center text-[10px] text-slate-500 border-t border-slate-200 bg-white truncate"
                    >
                        {{ form.footer_text }}
                    </div>
                </div>
                <p class="text-xs text-gray-500">
                    Reflejo aproximado de la app autenticada: navbar, sidebar (item activo y hover) y footer.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
    fetchAdminBranding,
    updateAdminBranding,
    uploadAdminBrandingAsset,
    deleteAdminBrandingAsset,
    type BrandingAssetKind,
    type CollegeBranding,
} from '@/modules/auth/services/branding.service'
import { useBrandingStore } from '@/modules/auth/stores/branding.store'
import BrandingAssetUploader from '@/modules/college/components/BrandingAssetUploader.vue'

const brandingStore = useBrandingStore()
const loading = ref(true)
const saving = ref(false)
const uploading = reactive<Record<BrandingAssetKind, boolean>>({
    logo: false,
    hero: false,
    navbar_logo_left: false,
    navbar_logo_right: false,
})
const branding = ref<CollegeBranding | null>(null)
const collegeName = ref<string | null>(null)
const collegeShortName = ref<string | null>(null)

const form = ref({
    primary_color: '#4f46e5',
    welcome_title: '' as string | null,
    welcome_subtitle: '' as string | null,
    navbar_title: '' as string | null,
    footer_text: '' as string | null,
})

const shortNameLower = computed(() => (collegeShortName.value ?? 'shortname').toLowerCase())
const loginUrl = computed(() => collegeShortName.value
    ? `${window.location.origin}/auth/login/${shortNameLower.value}`
    : null,
)
const previewBg = computed(() => branding.value?.hero_url
    ? { backgroundImage: `url(${branding.value.hero_url})` }
    : { backgroundColor: '#f3f4f6' },
)

onMounted(reload)

async function reload() {
    loading.value = true
    try {
        const res = await fetchAdminBranding()
        branding.value = res.branding
        collegeName.value = res.college?.name ?? null
        collegeShortName.value = res.college?.short_name ?? null
        form.value.primary_color = res.branding.primary_color || '#4f46e5'
        form.value.welcome_title = res.branding.welcome_title ?? ''
        form.value.welcome_subtitle = res.branding.welcome_subtitle ?? ''
        form.value.navbar_title = res.branding.navbar_title ?? ''
        form.value.footer_text = res.branding.footer_text ?? ''
        // Sincroniza store global para que navbar/footer reflejen el estado actual.
        brandingStore.setResolved({
            college: { id: 0, name: collegeName.value ?? '', short_name: collegeShortName.value ?? '' },
            branding: res.branding,
        })
    } finally {
        loading.value = false
    }
}

async function save() {
    saving.value = true
    try {
        const res = await updateAdminBranding({
            primary_color: form.value.primary_color,
            welcome_title: form.value.welcome_title || null,
            welcome_subtitle: form.value.welcome_subtitle || null,
            navbar_title: form.value.navbar_title || null,
            footer_text: form.value.footer_text || null,
        })
        branding.value = res.branding
        brandingStore.setBranding(res.branding)
    } finally {
        saving.value = false
    }
}

async function onUpload(kind: BrandingAssetKind, file: File) {
    uploading[kind] = true
    try {
        const res = await uploadAdminBrandingAsset(kind, file)
        branding.value = res.branding
        brandingStore.setBranding(res.branding)
    } finally {
        uploading[kind] = false
    }
}

async function onDelete(kind: BrandingAssetKind) {
    const res = await deleteAdminBrandingAsset(kind)
    branding.value = res.branding
    brandingStore.setBranding(res.branding)
}

function copyLoginUrl() {
    if (!loginUrl.value) return
    navigator.clipboard?.writeText(loginUrl.value).catch(() => { /* sin clipboard = OK */ })
}

/** Devuelve el hex con alpha aplicado (#RRGGBB + AA), para bordes suaves. */
function hexWithAlpha(hex: string, alpha: number): string {
    const c = (hex || '').replace('#', '')
    if (c.length !== 6 && c.length !== 3) return hex
    const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c
    const a = Math.max(0, Math.min(255, Math.round(alpha * 255))).toString(16).padStart(2, '0')
    return `#${full}${a}`
}
</script>
