import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsAgeMode.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.age-mode',
    component: Component,
    hasSettings: true,
}

export default definition
