import { createClient } from '@supabase/supabase-js'

function getServerSupabase(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )
}

export type AnalysisRecord = {
  user_id: string
  platform: string
  input: string
  niche: string
  style: string
  result: unknown
}

export async function countMonthlyAnalyses(userId: string, accessToken: string): Promise<number> {
  const supabase = getServerSupabase(accessToken)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)

  if (error) throw error
  return count ?? 0
}

export async function saveAnalysis(record: AnalysisRecord, accessToken: string): Promise<void> {
  const supabase = getServerSupabase(accessToken)
  const { error } = await supabase.from('analyses').insert(record)
  if (error) throw error
}
