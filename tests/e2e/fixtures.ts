import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'

// Mesmas contas fixas de teste usadas manualmente ao longo do projeto
// (ver TASKS.md) — criadas direto no Supabase Auth, não em nenhuma
// migração.
export const TEST_PASSWORD = 'TesteAmetista123!'
export const TEST_ACCOUNTS = {
  admin: 'ametista-test-admin-1786114897252@mailinator.com',
  gestor: 'ametista-test-gestor-1786114897252@mailinator.com',
  cliente: 'ametista-test-cliente-1786125862913@mailinator.com',
} as const

export type TestRole = keyof typeof TEST_ACCOUNTS

export async function loginAs(page: Page, role: TestRole) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(TEST_ACCOUNTS[role])
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 })
}

/**
 * Cliente do supabase-js autenticado como uma das contas de teste fixas
 * — usado só pra montar/limpar dados de apoio nos testes (ex: criar um
 * cliente/projeto/workflow descartável antes do teste rodar). A
 * interação que o teste de fato verifica sempre passa pela UI de
 * verdade (`page`), nunca por aqui.
 */
export async function getAuthenticatedClient(role: TestRole) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não encontrados — confira o .env.local')
  }
  const client = createClient(supabaseUrl, supabaseAnonKey)
  const { error } = await client.auth.signInWithPassword({ email: TEST_ACCOUNTS[role], password: TEST_PASSWORD })
  if (error) throw error
  return client
}
