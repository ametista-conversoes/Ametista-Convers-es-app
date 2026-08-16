import { expect, test } from '@playwright/test'
import { loginAs } from './fixtures.js'

test('login, navega até uma página e faz logout', async ({ page }) => {
  await loginAs(page, 'gestor')

  await page.getByRole('link', { name: 'Clientes' }).click()
  await expect(page).toHaveURL(/\/clients$/)
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()

  await page.getByLabel('Menu do usuário').click()
  await page.getByText('Sair').click()
  await expect(page).toHaveURL(/\/login$/)
})
