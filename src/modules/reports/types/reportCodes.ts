/**
 * Catálogo BASE de reportes/formatos del sistema.
 * Espejo del enum PHP `Modules\Reports\Domain\Enums\ReportFormatCode`.
 *
 * Convención (commit 724af2a, validada por FormatKey):
 *   `<SEGMENTO>.<NOMBRE>` — NOMBRE es un solo identificador `[A-Z][A-Z0-9_]*`.
 *   Sin puntos internos en el NOMBRE.
 *
 * Cada entrada representa un reporte/formato disponible por defecto para
 * todo college. Por college se puede deshabilitar o personalizar la plantilla.
 */
export enum ReportCode {
    // Horarios (módulo SCA)
    TEACHER_SCHEDULE                = 'RPT.HORARIO_DOCENTE',
    TEACHER_SCHEDULE_BY_DATE        = 'RPT.HORARIO_DOCENTE_POR_FECHA',
    GROUP_SCHEDULE                  = 'RPT.HORARIO_GRUPO',
    GROUP_SCHEDULE_BY_DATE          = 'RPT.HORARIO_GRUPO_POR_FECHA',
    PLACE_SCHEDULE                  = 'RPT.HORARIO_AULA',
    PLACE_SCHEDULE_BY_DATE          = 'RPT.HORARIO_AULA_POR_FECHA',

    // Proyección académica
    ACADEMIC_PROJECTION_ALL_CAREERS = 'RPT.PROYECCION_TODAS',
    ACADEMIC_PROJECTION_BY_CAREER   = 'RPT.PROYECCION_CARRERA',

    // Concentrado de carga
    ACADEMIC_LOAD_BY_TEACHER        = 'RPT.CARGA_DOCENTE',
    ACADEMIC_LOAD_BY_GROUP          = 'RPT.CARGA_GRUPO',

    // Oficio / solicitudes
    ASSIGNMENT_OFFICIAL_LETTER      = 'RPT.OFICIO_ASIGNACION',
    TEACHER_SUBJECT_REQUEST         = 'RPT.SOLICITUD_MATERIA',

    // Formatos dirigidos al alumno
    ADVISING_RETICULAR_FORMAT       = 'RPT.ASESORIA_RETICULAR',
    ENROLLMENT_PROOF                = 'RPT.COMPROBANTE_REINSCRIPCION',
    INITIAL_ENROLLMENT_PROOF        = 'RPT.COMPROBANTE_INSCRIPCION',

    // Reportes admin
    TEACHER_EVALUATION              = 'RPT.EVALUACION_DOCENTE',
}
