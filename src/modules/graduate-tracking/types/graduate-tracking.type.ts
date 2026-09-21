export interface WaveCounts { invited: number; sent: number; responded: number }

export interface GraduateWave {
    id: number
    college_id: number
    name: string
    description: string | null
    form_slug: string
    target_status_ids: number[]
    career_id: number | null
    career_name: string | null
    exit_period_id: number | null
    exit_period_name: string | null
    graduation_year: number | null
    opens_at: string | null
    closes_at: string | null
    status: 'draft' | 'open' | 'closed'
    counts?: WaveCounts
}

export interface WaveInvitation {
    id: number
    student_id: number
    student_name: string
    num_control: string | null
    career_name: string | null
    contact_email: string | null
    generation: string | null
    status: 'pending' | 'sent' | 'responded'
    sent_at: string | null
    responded_at: string | null
}

export interface CohortPreview { total: number; with_email: number; sample: string[] }

export interface StatOption { label: string; count: number; pct: number }
export interface StatNumeric { avg: number; min: number; max: number; count: number }
export interface StatQuestion {
    question_id: number
    statement: string
    type: string
    answered: number
    options: StatOption[]
    numeric: StatNumeric | null
    texts: string[]
}
export interface CareerStat { career_name: string; invited: number; responded: number; rate: number }
export interface GenerationStat { generation: string; invited: number; responded: number; rate: number }
export interface WaveStatistics {
    wave: { id: number; name: string; status: string }
    counts: WaveCounts
    rate: number
    by_career: CareerStat[]
    by_generation: GenerationStat[]
    generation: string | null
    questions: StatQuestion[]
}
