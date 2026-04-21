<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">INTEGRACIONES</h1>
            <p class="text-sm text-slate-500 mt-1">
                Configura los servicios externos del college (inicio de sesión, sincronización, etc.).
            </p>
        </div>

        <!-- Tarjeta Google Workspace -->
        <section class="bg-white rounded-lg shadow">
            <div class="flex items-center justify-between px-6 py-4 border-b">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 48 48" fill="none">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <div>
                        <h2 class="text-base font-semibold text-slate-800">Google Workspace</h2>
                        <p class="text-xs text-slate-500">
                            Permite a los usuarios del college iniciar sesión con su cuenta corporativa de Google.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="flex items-center justify-center h-9 w-9 rounded-full
                           border border-gray-300 text-gray-500
                           hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 transition"
                    title="¿Cómo obtener estos datos?"
                    @click="helpOpen = true"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                    </svg>
                </button>
            </div>

            <div v-if="loading" class="px-6 py-8 text-sm text-slate-500">
                Cargando…
            </div>

            <div v-else class="px-6 py-5 space-y-4">
                <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg"
                    :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
                    {{ banner.message }}
                </div>

                <label class="block max-w-md">
                    <span class="text-sm text-gray-700">Dominio (ej: itstb.edu.mx)</span>
                    <input
                        v-model="form.domain"
                        type="text"
                        placeholder="itstb.edu.mx"
                        class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                    />
                </label>

                <label class="block max-w-md">
                    <span class="text-sm text-gray-700">OAuth Client ID</span>
                    <input
                        v-model="form.clientId"
                        type="text"
                        placeholder="xxxxx.apps.googleusercontent.com"
                        class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                    />
                </label>

                <label class="block max-w-md">
                    <span class="text-sm text-gray-700">
                        OAuth Client Secret
                        <span v-if="form.secretConfigured" class="text-xs text-green-600 ml-2">
                            (configurado — deja vacío para conservar)
                        </span>
                    </span>
                    <input
                        v-model="form.clientSecret"
                        type="password"
                        placeholder="GOCSPX-..."
                        class="mt-1 w-full h-10 border rounded-md px-3 text-sm"
                        autocomplete="new-password"
                    />
                </label>

                <div class="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        :disabled="saving"
                        class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-60"
                        @click="save"
                    >
                        {{ saving ? 'Guardando…' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </section>

        <!-- Drawer: instrucciones -->
        <teleport to="body">
            <div v-if="helpOpen" class="fixed inset-0 z-[60]">
                <div class="absolute inset-0 bg-black/40" @click="helpOpen = false"></div>
                <aside class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
                    <div class="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
                        <h3 class="text-lg font-semibold">Cómo obtener las credenciales Google</h3>
                        <button
                            type="button"
                            class="text-gray-400 hover:text-gray-700"
                            @click="helpOpen = false"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="px-6 py-5 space-y-6 text-sm text-gray-700">
                        <p>
                            Esta institución educativa requiere su propio proyecto en
                            <strong>Google Cloud Console</strong> vinculado a su cuenta
                            <strong>Google Workspace for Education</strong>. Sigue estos pasos con la
                            cuenta administradora del Workspace del college:
                        </p>

                        <section>
                            <h4 class="font-semibold text-slate-800 mb-1">1. Crear o seleccionar proyecto</h4>
                            <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                <li>
                                    Entra a
                                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                                        console.cloud.google.com
                                    </a>
                                    con la cuenta administradora del Workspace.
                                </li>
                                <li>En la barra superior, clic en el selector de proyecto → <strong>NUEVO PROYECTO</strong>.</li>
                                <li>Nómbralo por ejemplo <code class="bg-gray-100 px-1 rounded">SGI — ITSTB</code> y asóciale la organización del Workspace.</li>
                            </ol>
                        </section>

                        <section>
                            <h4 class="font-semibold text-slate-800 mb-1">2. Configurar pantalla de consentimiento</h4>
                            <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                <li>Menú lateral → <strong>APIs y servicios</strong> → <strong>Pantalla de consentimiento OAuth</strong>.</li>
                                <li>Tipo de usuario: <strong>Interno</strong> (solo cuentas del Workspace).</li>
                                <li>Nombre de la app: el de la institución. Correo de soporte: admin del Workspace.</li>
                                <li>Guarda y continúa hasta el final.</li>
                            </ol>
                        </section>

                        <section>
                            <h4 class="font-semibold text-slate-800 mb-1">3. Crear credencial OAuth 2.0</h4>
                            <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                <li>Menú → <strong>APIs y servicios</strong> → <strong>Credenciales</strong> → <strong>+ CREAR CREDENCIALES</strong> → <strong>ID de cliente de OAuth</strong>.</li>
                                <li>Tipo de aplicación: <strong>Aplicación web</strong>.</li>
                                <li>
                                    En <em>Orígenes de JavaScript autorizados</em> agrega las URLs donde vive el frontend, ejemplo:
                                    <ul class="list-disc list-inside ml-4 mt-1 font-mono text-xs">
                                        <li>http://localhost:5173</li>
                                        <li>https://sgi.tuinstitucion.edu.mx</li>
                                    </ul>
                                </li>
                                <li><em>URIs de redireccionamiento autorizadas</em> se puede dejar vacío (usamos token flow, no redirect).</li>
                                <li>Clic en <strong>Crear</strong>. Se muestran el <strong>Client ID</strong> y <strong>Client Secret</strong>.</li>
                            </ol>
                        </section>

                        <section>
                            <h4 class="font-semibold text-slate-800 mb-1">4. Pegar los datos en este formulario</h4>
                            <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                <li><strong>Dominio</strong>: el dominio principal del Workspace (ej: <code class="bg-gray-100 px-1 rounded">itstb.edu.mx</code>).</li>
                                <li><strong>OAuth Client ID</strong>: termina en <code class="bg-gray-100 px-1 rounded">.apps.googleusercontent.com</code>.</li>
                                <li><strong>OAuth Client Secret</strong>: empieza con <code class="bg-gray-100 px-1 rounded">GOCSPX-</code>. Se guarda cifrado.</li>
                            </ol>
                        </section>

                        <div class="p-3 bg-amber-50 border border-amber-200 rounded">
                            <p class="text-xs text-amber-800">
                                <strong>Política de acceso:</strong> solo users que ya existen en el
                                sistema (creados o sincronizados previamente) podrán iniciar sesión.
                                Google NO crea cuentas automáticamente.
                            </p>
                        </div>

                        <div class="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p class="text-xs text-blue-800">
                                <strong>Tip:</strong> puedes regenerar el Client Secret en Google Cloud
                                cuando quieras; solo vuelve a este formulario y pégalo. El anterior
                                queda invalidado automáticamente.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const loading  = ref(true)
const saving   = ref(false)
const helpOpen = ref(false)

const form = reactive({
    domain:           '',
    clientId:         '',
    clientSecret:     '',
    secretConfigured: false,
})

const banner = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })

function flash(ok: boolean, message: string) {
    banner.ok = ok
    banner.message = message
    setTimeout(() => { banner.message = '' }, 4000)
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.COLLEGE_API.googleWorkspace)
        form.domain           = data.google_workspace_domain ?? ''
        form.clientId         = data.google_client_id ?? ''
        form.clientSecret     = ''
        form.secretConfigured = !!data.google_client_secret_configured
    } catch (e: any) {
        flash(false, e?.response?.data?.message || 'Error al cargar la configuración.')
    } finally {
        loading.value = false
    }
}

async function save() {
    saving.value = true
    try {
        const payload: Record<string, string | null> = {
            google_workspace_domain: form.domain.trim() || null,
            google_client_id:        form.clientId.trim() || null,
        }
        const secret = form.clientSecret.trim()
        if (secret) payload.google_client_secret = secret

        const { data } = await api.patch(API.COLLEGE_API.googleWorkspace, payload)
        form.domain           = data.google_workspace_domain ?? ''
        form.clientId         = data.google_client_id ?? ''
        form.clientSecret     = ''
        form.secretConfigured = !!data.google_client_secret_configured
        flash(true, 'Configuración guardada.')
    } catch (e: any) {
        const msg = e?.response?.data?.message
            || e?.response?.data?.errors?.google_workspace_domain?.[0]
            || e?.response?.data?.errors?.google_client_id?.[0]
            || e?.response?.data?.errors?.google_client_secret?.[0]
            || 'Error al guardar la configuración.'
        flash(false, msg)
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>
