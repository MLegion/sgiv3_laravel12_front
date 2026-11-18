<template>
    <dialog
        ref="dialogEl"
        class="BaseDrawer"
        :class="sizeClass"
        :aria-label="title ? undefined : ariaLabel"
        :aria-labelledby="title ? titleId : undefined"
        @close="onNativeClose"
        @cancel="onCancel"
        @click="onClick"
    >
        <div class="BaseDrawer-sheet">
            <!-- Header -->
            <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
                <slot name="header">
                    <div>
                        <h2 :id="titleId" class="text-base font-bold text-slate-800">{{ title }}</h2>
                        <p v-if="subtitle" class="text-xs text-slate-400">{{ subtitle }}</p>
                    </div>
                </slot>
                <button
                    v-if="!hideClose"
                    type="button"
                    autofocus
                    class="-mr-2 -mt-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    aria-label="Cerrar"
                    @click="close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Cuerpo (con scroll) -->
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <slot />
            </div>

            <!-- Footer (acciones, pegado abajo) -->
            <div
                v-if="$slots.footer"
                class="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4"
            >
                <slot name="footer" />
            </div>
        </div>
    </dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, useId, watch } from 'vue'

/**
 * Drawer lateral accesible construido sobre el elemento nativo `<dialog>`.
 *
 * A diferencia de los overlays `fixed inset-0` + `v-if`, delega en el navegador:
 * promoción al top-layer (sin pelear z-index/stacking contexts), `inert` sobre el
 * resto de la página, trampa de foco y restauración del foco previo al cerrar, y
 * cierre con Escape — todo nativo. El panel entra deslizándose desde el borde con
 * una transición CSS (`@starting-style` + `allow-discrete`), degradando a aparición
 * instantánea donde no haya soporte, y se respeta `prefers-reduced-motion`.
 *
 * Mismo contrato que BaseModal: `v-model` de apertura, `title`/slots, evento `close`.
 */

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    size?: Size
    /** Nombre accesible cuando no se usa `title` (p. ej. header personalizado). */
    ariaLabel?: string
    /** Si true, el click en el backdrop y Escape NO cierran (formularios con cambios). */
    persistent?: boolean
    hideClose?: boolean
}>(), {
    size: 'md',
    persistent: false,
    hideClose: false,
    ariaLabel: 'Panel',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
}>()

const titleId = `drawer-title-${useId()}`
const dialogEl = ref<HTMLDialogElement | null>(null)

const sizeClass = computed(() => `is-${props.size}`)

function close(): void {
    // Dispara el cierre nativo; la animación de salida se reproduce vía allow-discrete
    // y `onNativeClose` emite el estado una vez que el <dialog> ya cerró.
    dialogEl.value?.close()
}

/** El navegador emite `close` tras Escape, backdrop o `.close()` programático. */
function onNativeClose(): void {
    if (props.modelValue) emit('update:modelValue', false)
    emit('close')
}

/** Escape: respetar `persistent` evitando el cierre nativo. */
function onCancel(e: Event): void {
    if (props.persistent) e.preventDefault()
}

/** Light-dismiss: un click fuera del panel (sobre el ::backdrop) cierra el drawer. */
function onClick(e: MouseEvent): void {
    if (props.persistent) return
    const d = dialogEl.value
    if (!d || e.target !== d) return // clicks dentro del panel apuntan a hijos, no al <dialog>
    const r = d.getBoundingClientRect()
    const inside = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right
    if (!inside) close()
}

function sync(open: boolean): void {
    const d = dialogEl.value
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
}

watch(() => props.modelValue, sync)
onMounted(() => { if (props.modelValue) sync(true) })
// Evita dejar el <dialog> abierto en el top-layer si el componente se desmonta abierto.
onBeforeUnmount(() => { if (dialogEl.value?.open) dialogEl.value.close() })
</script>

<!-- Estilos NO scoped: el `<dialog>`/`::backdrop`, `@starting-style` y las reglas
     `allow-discrete` se mantienen a nivel raíz (recomendación de modern-web-guidance).
     Todo queda namespaced bajo `.BaseDrawer` para no filtrar. -->
<style>
.BaseDrawer {
    /* Reset de los estilos UA (centrado, tope de tamaño, borde) para fijar el panel al borde. */
    position: fixed;
    inset: 0;
    margin: 0;
    margin-inline-start: auto; /* pega el panel al borde derecho */
    max-width: none;
    max-height: none;
    width: min(var(--drawer-width, 28rem), 100dvw);
    height: 100dvh;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;

    /* Entrada/salida deslizando desde la derecha. `display`/`overlay` con
       allow-discrete permiten animar la aparición en el top-layer. */
    translate: 100% 0;
    transition:
        translate 0.25s ease,
        overlay 0.25s ease allow-discrete,
        display 0.25s ease allow-discrete;
}

.BaseDrawer.is-sm { --drawer-width: 22rem; }
.BaseDrawer.is-md { --drawer-width: 28rem; }
.BaseDrawer.is-lg { --drawer-width: 36rem; }
.BaseDrawer.is-xl { --drawer-width: 44rem; }
.BaseDrawer.is-2xl { --drawer-width: 60rem; }

.BaseDrawer[open] {
    translate: 0 0;
}

/* Posición inicial de la animación de entrada (al promover al top-layer). */
@starting-style {
    .BaseDrawer[open] {
        translate: 100% 0;
    }
}

.BaseDrawer-sheet {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    box-shadow: -4px 0 24px rgb(0 0 0 / 0.12);
}

.BaseDrawer::backdrop {
    background: rgb(0 0 0 / 0);
    transition:
        background 0.25s ease,
        overlay 0.25s ease allow-discrete,
        display 0.25s ease allow-discrete;
}

.BaseDrawer[open]::backdrop {
    background: rgb(0 0 0 / 0.4);
}

@starting-style {
    .BaseDrawer[open]::backdrop {
        background: rgb(0 0 0 / 0);
    }
}

/* Respeta la preferencia del sistema: sin deslizamiento ni fundido. */
@media (prefers-reduced-motion: reduce) {
    .BaseDrawer,
    .BaseDrawer::backdrop {
        transition: none;
    }
}
</style>
