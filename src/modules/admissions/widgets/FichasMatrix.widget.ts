import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from '@/modules/admissions/components/FichasMatrix.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.fichas.matrix',
    component: Component,
}

export default definition
