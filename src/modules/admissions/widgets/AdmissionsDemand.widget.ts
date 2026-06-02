import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsDemand.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.demand',
    component: Component,
    hasSettings: true,
}

export default definition
