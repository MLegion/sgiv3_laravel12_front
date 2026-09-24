<template>
    <!-- Preview aislado en <iframe>: no puede afectar la interfaz real. -->
    <iframe
        class="w-full block"
        style="border: 0; height: 360px"
        sandbox=""
        :srcdoc="srcDoc"
        title="Vista previa del tema"
    ></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveAppThemeVars, type AppTheme, type CollegeBranding } from '@/modules/auth/services/branding.service'

const props = defineProps<{ theme: AppTheme | null; branding: CollegeBranding | null; collegeName?: string | null }>()

const primary = computed(() => props.branding?.primary_color || '#4f46e5')
const name = computed(() => props.collegeName || 'Colegio')

const srcDoc = computed(() => {
    const v = resolveAppThemeVars(props.theme ?? {}, primary.value)
    const g = (k: string) => v[k] || ''

    const navbar = g('--app-navbar-bg'), navTxt = g('--app-navbar-text'), navMuted = g('--app-navbar-muted'), navBorder = g('--app-navbar-border')
    const sbBg = g('--app-sidebar-bg'), sbTxt = g('--app-sidebar-text'), sbMuted = g('--app-sidebar-muted'), sbBorder = g('--app-sidebar-border')
    const sbActiveBg = g('--app-sidebar-active-bg'), sbActiveTxt = g('--app-sidebar-active-text'), sbHoverBg = g('--app-sidebar-hover-bg'), sbHoverTxt = g('--app-sidebar-hover-text')
    const contentBg = g('--app-content-bg')

    const body = `
    <div style="height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:${navbar};border-bottom:1px solid ${navBorder}">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:24px;height:24px;border-radius:6px;background:${primary.value};color:#fff;font-weight:800;font-size:9px;display:flex;align-items:center;justify-content:center">S3</div>
        <span style="font-size:12px;font-weight:800;color:${navTxt}">${name.value}</span>
      </div>
      <div style="text-align:right;line-height:1.1">
        <div style="font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${navMuted}">Usuario</div>
        <div style="font-size:10px;font-weight:700;color:${navTxt}">Admin</div>
      </div>
    </div>
    <div style="display:flex;height:280px;background:${contentBg}">
      <div style="width:170px;background:${sbBg};border-right:1px solid ${sbBorder};padding:8px;display:flex;flex-direction:column;gap:4px">
        <div style="font-size:8px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${sbMuted};padding:2px 8px 6px">Navegación</div>
        <div style="padding:6px 8px;border-radius:8px;font-size:11px;font-weight:600;background:${sbActiveBg};color:${sbActiveTxt};display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:${sbActiveTxt}"></span>Inicio</div>
        <div style="padding:6px 8px;border-radius:8px;font-size:11px;color:${sbTxt};display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:${sbMuted};opacity:.6"></span>Estudiantes</div>
        <div style="padding:6px 8px;border-radius:8px;font-size:11px;background:${sbHoverBg};color:${sbHoverTxt};display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:${sbHoverTxt}"></span>Reportes <span style="font-size:8px;opacity:.7">(hover)</span></div>
        <div style="font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${sbMuted};padding:8px 8px 2px">Grupo</div>
        <div style="padding:4px 8px;font-size:11px;color:${sbTxt};display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:50%;background:${sbMuted};opacity:.6"></span>Sub-item</div>
      </div>
      <div style="flex:1;padding:12px;display:flex;flex-direction:column;gap:8px">
        <div style="height:12px;width:50%;background:rgba(0,0,0,.1);border-radius:4px"></div>
        <div style="height:8px;width:75%;background:rgba(0,0,0,.06);border-radius:4px"></div>
        <div style="height:8px;width:66%;background:rgba(0,0,0,.06);border-radius:4px"></div>
        <div><span style="display:inline-block;margin-top:6px;padding:5px 12px;font-size:10px;color:#fff;border-radius:6px;background:${primary.value};font-weight:600">Acción primaria</span></div>
      </div>
    </div>
    <div style="padding:6px 12px;text-align:center;font-size:9px;background:${navbar};border-top:1px solid ${navBorder};color:${navMuted}">© ${name.value}</div>`

    const shim = `*{box-sizing:border-box;margin:0;padding:0}html,body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}`
    return `<!doctype html><html><head><meta charset="utf-8"><style>${shim}</style></head><body>${body}</body></html>`
})
</script>
