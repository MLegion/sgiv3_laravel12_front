export interface CurriculumItemInterface {
    id?: number;
    subjectId: number;
    subject?: SubjectType;
    period: number; // Columna
    row: number;    // Fila
    prerequisites: number[]; // IDs de otras materias
    corequisites: number[];  // IDs de otras materias
}
