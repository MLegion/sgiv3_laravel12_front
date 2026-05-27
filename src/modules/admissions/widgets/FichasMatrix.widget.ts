import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from '@/modules/admissions/components/FichasMatrix.vue'

const definition: WidgetComponentDefinition = {
    id:          'adm.fichas.matrix',
    component:   Component,
    hasSettings: true,
}

export default definition
