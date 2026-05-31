import type { WidgetComponentDefinition } from '@/modules/dashboard/registry/widget-component-registry'
import Component from './PeriodsDrift.vue'

const definition: WidgetComponentDefinition = {
    id:          'ses.periods.drift',
    component:   Component,
    hasSettings: false,
}

export default definition
