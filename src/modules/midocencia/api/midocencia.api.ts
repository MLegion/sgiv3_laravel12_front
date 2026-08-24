import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'MIDOCENCIA_API',
    api: {
        rubrics: {
            context:         apiUrl('/midocencia/rubrics/context'),
            rubros:          apiUrl('/midocencia/rubrics/rubros'),
            list:            apiUrl('/midocencia/rubrics'),
            tree:            (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/tree`),
            forPeriod:       (periodId: string | number) => apiUrl(`/midocencia/rubrics/for-period/${periodId}`),
            create:          apiUrl('/midocencia/rubrics'),
            update:          (id: string | number) => apiUrl(`/midocencia/rubrics/${id}`),
            clone:           (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/clone`),
            cloneFromPeriod: (periodId: string | number) => apiUrl(`/midocencia/rubrics/clone-from-period/${periodId}`),
            publish:         (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/publish`),
            assignPeriod:    (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/assign-period`),
        },
        // F2 — Plaza (captura por jefatura).
        plaza: {
            show: apiUrl('/midocencia/plaza'),
            save: apiUrl('/midocencia/plaza'),
        },
        // F2 — Distribución del docente.
        distribution: {
            show:    apiUrl('/midocencia/distribution'),
            save:    apiUrl('/midocencia/distribution/save'),
            submit:  apiUrl('/midocencia/distribution/submit'),
            retract: apiUrl('/midocencia/distribution/retract'),
            oficio:  apiUrl('/midocencia/distribution/oficio'),
            schedule:       apiUrl('/midocencia/distribution/schedule'),
            scheduleSave:   apiUrl('/midocencia/distribution/schedule/save'),
            scheduleSubmit: apiUrl('/midocencia/distribution/schedule/submit'),
            evidences:      apiUrl('/midocencia/distribution/evidences'),
        },
        // F5.a — Archivos de evidencia.
        evidence: {
            upload:   (detailId: string | number, evidenceId: string | number) => apiUrl(`/midocencia/distribution/evidences/${detailId}/${evidenceId}/upload`),
            download: (id: string | number) => apiUrl(`/midocencia/evidence-files/${id}/download`),
            delete:   (id: string | number) => apiUrl(`/midocencia/evidence-files/${id}`),
        },
        // F5.b — Visor por sección (roles por rubro).
        sections: {
            scope:     apiUrl('/midocencia/sections/scope'),
            evidences: apiUrl('/midocencia/sections/evidences'),
            download:  (id: string | number) => apiUrl(`/midocencia/sections/files/${id}/download`),
        },
        // F2 — Aprobación (Jefatura de Carrera).
        approval: {
            inbox:   apiUrl('/midocencia/approval/inbox'),
            show:    (id: string | number) => apiUrl(`/midocencia/approval/${id}`),
            approve: (id: string | number) => apiUrl(`/midocencia/approval/${id}/approve`),
            reject:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/reject`),
            oficio:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/oficio`),
            scheduleBlocks:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule`),
            scheduleApprove: (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/approve`),
            scheduleReject:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/reject`),
        },
        // Editor fino (F1.b) — solo borradores del plantel.
        builder: {
            createCriterion: (rubricId: string | number) => apiUrl(`/midocencia/rubrics/${rubricId}/criteria`),
            updateCriterion: (id: string | number) => apiUrl(`/midocencia/criteria/${id}`),
            deleteCriterion: (id: string | number) => apiUrl(`/midocencia/criteria/${id}`),
            createProduct:   (criterionId: string | number) => apiUrl(`/midocencia/criteria/${criterionId}/products`),
            updateProduct:   (id: string | number) => apiUrl(`/midocencia/products/${id}`),
            deleteProduct:   (id: string | number) => apiUrl(`/midocencia/products/${id}`),
            createEvidence:  (criterionId: string | number) => apiUrl(`/midocencia/criteria/${criterionId}/evidences`),
            updateEvidence:  (id: string | number) => apiUrl(`/midocencia/evidences/${id}`),
            deleteEvidence:  (id: string | number) => apiUrl(`/midocencia/evidences/${id}`),
        },
    },
} satisfies ApiModule
