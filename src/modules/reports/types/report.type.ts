export interface ReportDao {
    id:         number
    name:       string
    type:       number
    varName:    string
    preScript:  string | null
    postScript: string | null
    dataSource: string
    status:     boolean
}

export interface Report {
    id:                    number
    collegeId:             number | null
    name:                  string
    code:                  string
    description:           string | null
    templatePath:          string | null
    templateOriginalName:  string | null
    hasTemplate:           boolean
    isTemplate:            boolean
    templateId:            number | null
    status:                boolean
    daos?:                 ReportDao[]
    createdAt:             string
    updatedAt:             string
}
