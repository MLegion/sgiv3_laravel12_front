<template>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
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

        <div v-else class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          </div>

          <!-- Personalización avanzada del login -->
          <div class="bg-white rounded-lg shadow p-6 space-y-4">
              <div class="flex items-start justify-between gap-4">
                  <div>
                      <h2 class="text-lg font-semibold text-gray-900">Personalización del login</h2>
                      <p class="text-sm text-gray-600">Elige una plantilla y ajústala: fondo, formulario, colores, tipografía o HTML libre.</p>
                  </div>
                  <button
                      type="button"
                      class="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      @click="save"
                      :disabled="saving"
                  >
                      {{ saving ? 'Guardando…' : 'Guardar login' }}
                  </button>
              </div>
              <LoginCustomizer
                  v-model:template="form.login_template"
                  v-model:config="form.login_config"
                  :branding="branding"
                  :college-name="collegeName"
              />
          </div>

          <!-- Tema de la app autenticada -->
          <div class="bg-white rounded-lg shadow p-6 space-y-4">
              <div class="flex items-start justify-between gap-4">
                  <div>
                      <h2 class="text-lg font-semibold text-gray-900">Tema de la aplicación</h2>
                      <p class="text-sm text-gray-600">Personaliza la barra superior, el menú lateral y el fondo del contenido.</p>
                  </div>
                  <button
                      type="button"
                      class="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      @click="save"
                      :disabled="saving"
                  >
                      {{ saving ? 'Guardando…' : 'Guardar tema' }}
                  </button>
              </div>
              <AppThemeCustomizer
                  v-model:theme="form.app_theme"
                  :branding="branding"
                  :college-name="collegeName"
              />
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
    type LoginTemplate,
    type LoginConfig,
    type AppTheme,
} from '@/modules/auth/services/branding.service'
import { useBrandingStore } from '@/modules/auth/stores/branding.store'
import BrandingAssetUploader from '@/modules/college/components/BrandingAssetUploader.vue'
import LoginCustomizer from '@/modules/college/components/LoginCustomizer.vue'
import AppThemeCustomizer from '@/modules/college/components/AppThemeCustomizer.vue'

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
    login_template: 'centered' as LoginTemplate,
    login_config: {} as LoginConfig,
    app_theme: {} as AppTheme,
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
        form.value.login_template = res.branding.login_template ?? 'centered'
        form.value.login_config = res.branding.login_config ?? {}
        form.value.app_theme = res.branding.app_theme ?? {}
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
            login_template: form.value.login_template,
            login_config: form.value.login_config,
            app_theme: form.value.app_theme,
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
</script>
