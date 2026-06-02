import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './AdmissionsScores.vue'

const definition: WidgetComponentDefinition = {
    id: 'adm.stats.scores',
    component: Component,
    hasSettings: true,
}

export default definition
