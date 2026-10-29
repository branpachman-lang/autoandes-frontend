import { test, expect, Page, APIRequestContext } from 'playwright/test';
import { mkdirSync } from 'node:fs';

const api = process.env['E2E_API_URL'] ?? 'http://localhost:8080/api/v1';
const password = process.env['E2E_PASSWORD'] ?? 'Auto2026*';
const evidence = 'docs/evidencias';

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole('heading', { name: /Bienvenido/ })).toBeVisible();
}
async function headers(request: APIRequestContext, username = 'admin') {
  const response = await request.post(`${api}/auth/login`, { data: { username, password } });
  expect(response.status()).toBe(200);
  return { Authorization: `Bearer ${(await response.json()).token}` };
}
async function shot(page: Page, name: string) {
  mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}

test('administrador: catálogo de servicios, edición, baja y eliminación', async ({
  page,
  request,
}) => {
  const auth = await headers(request);
  const services = await (await request.get(`${api}/servicios`, { headers: auth })).json();
  const used = new Set(services.map((s: any) => s.codigo));
  let n = 900;
  while (used.has(`SRV-${n}`)) n++;
  const code = `SRV-${n}`;
  await login(page, 'admin');
  await expect(page.locator('.indicador').first().locator('strong')).not.toHaveText('');
  await shot(page, '01-inicio');
  await page.goto('/servicios');
  await page.getByRole('link', { name: '+ Nuevo servicio' }).click();
  await page.getByRole('button', { name: 'Registrar servicio', exact: true }).click();
  await expect(page.getByText('Usa el formato SRV-000.')).toBeVisible();
  await page.getByLabel('Código *', { exact: true }).fill(code);
  await page.getByLabel('Nombre *', { exact: true }).fill('Diagnóstico E2E AutoAndes');
  await page.getByLabel('Precio (S/) *', { exact: true }).fill('85.50');
  await page.getByLabel('Duración (minutos) *', { exact: true }).fill('45');
  await page.getByRole('button', { name: 'Registrar servicio', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios$/);
  let row = page.getByRole('row').filter({ hasText: code });
  await expect(row).toContainText('Diagnóstico E2E AutoAndes');
  await row.getByRole('link', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue(
    'Diagnóstico E2E AutoAndes',
  );
  await page.getByLabel('Precio (S/) *', { exact: true }).fill('90');
  await page.getByRole('button', { name: 'Actualizar servicio', exact: true }).click();
  await expect(page).toHaveURL(/\/servicios$/);
  row = page.getByRole('row').filter({ hasText: code });
  await expect(row).toContainText('90.00');
  await shot(page, '02-servicios');
  await row.getByRole('button', { name: 'Dar de baja', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(row.getByText('Inactivo', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(row).toHaveCount(0);
});

test('asesor: vehículo con cliente, duplicado 409, filtro, edición y eliminación', async ({
  page,
  request,
}) => {
  const auth = await headers(request, 'asesor');
  const clients = await (await request.get(`${api}/clientes`, { headers: auth })).json();
  const vehicles = await (await request.get(`${api}/vehiculos`, { headers: auth })).json();
  let n = 900;
  while (vehicles.some((v: any) => v.placa === `TST-${n}`)) n++;
  const plate = `TST-${n}`;
  await login(page, 'asesor');
  await page.goto('/vehiculos/nuevo');
  await page.getByLabel('Placa *', { exact: true }).fill('AAA-111');
  await page
    .getByLabel('Cliente *', { exact: true })
    .selectOption({ label: `${clients[0].nombres} · ${clients[0].documento}` });
  await page.getByLabel('Marca *', { exact: true }).fill('Toyota');
  await page.getByLabel('Modelo *', { exact: true }).fill('Yaris E2E');
  await page.getByLabel('Año *', { exact: true }).fill('2024');
  await page.getByRole('button', { name: 'Registrar vehículo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Ya existe');
  await expect(page.getByLabel('Modelo *', { exact: true })).toHaveValue('Yaris E2E');
  await page.getByLabel('Placa *', { exact: true }).fill(plate);
  await page.getByRole('button', { name: 'Registrar vehículo', exact: true }).click();
  await expect(page).toHaveURL(/\/vehiculos$/);
  const row = page.getByRole('row').filter({ hasText: plate });
  await expect(row).toContainText(clients[0].nombres);
  await page
    .getByRole('combobox', { name: 'Cliente', exact: true })
    .selectOption(String(clients[0].id));
  await expect(row).toBeVisible();
  await shot(page, '03-vehiculos');
  await row.getByRole('link', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Modelo *', { exact: true })).toHaveValue('Yaris E2E');
  await page.getByLabel('Modelo *', { exact: true }).fill('Corolla E2E');
  await page.getByRole('button', { name: 'Actualizar vehículo', exact: true }).click();
  await expect(row).toContainText('Corolla E2E');
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar eliminación', exact: true })
    .click();
  await expect(row).toHaveCount(0);
});

test('orden completa: 409 conserva líneas, registro, permisos, anulación y reporte', async ({
  page,
  request,
}) => {
  const asesor = await headers(request, 'asesor');
  const jefe = await headers(request, 'jefe');
  const vehicles = await (await request.get(`${api}/vehiculos`, { headers: asesor })).json();
  const vehicle = vehicles.find((v: any) => v.placa === 'AAA-111');
  const services = await (await request.get(`${api}/servicios`, { headers: asesor })).json();
  const service = services.find((s: any) => s.codigo === 'SRV-001');
  const second = services.find((s: any) => s.codigo === 'SRV-002');
  const previous = await (
    await request.get(`${api}/ordenes?placa=AAA-111&estado=REGISTRADA`, { headers: asesor })
  ).json();
  const km = previous[0].kilometraje;
  await login(page, 'asesor');
  await expect(page.locator('app-sidebar').getByRole('link', { name: 'Reportes' })).toHaveCount(0);
  await page.goto('/ordenes/nueva');
  await page
    .getByLabel('Vehículo *', { exact: true })
    .selectOption({ label: `${vehicle.placa} · ${vehicle.clienteNombre}` });
  await page.getByLabel('Kilometraje actual *', { exact: true }).fill(String(km - 1));
  await page
    .getByLabel('Servicio 1', { exact: true })
    .selectOption({ label: `${service.codigo} · ${service.nombre}` });
  await page.getByLabel('Cantidad', { exact: true }).fill('2');
  await expect(page.getByTestId('total-orden')).toContainText((service.precio * 2).toFixed(2));
  await page.getByRole('button', { name: 'Registrar orden', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(String(km));
  await expect(page.getByLabel('Cantidad', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Servicio 1', { exact: true }).locator('option:checked')).toHaveText(
    `${service.codigo} · ${service.nombre}`,
  );
  await shot(page, '04-orden-409');
  await page.getByRole('button', { name: '+ Agregar servicio', exact: true }).click();
  await expect(
    page.locator('#servicio-1 option').filter({ hasText: service.codigo }),
  ).toBeDisabled();
  await page
    .getByLabel('Servicio 2', { exact: true })
    .selectOption({ label: `${second.codigo} · ${second.nombre}` });
  await expect(page.getByTestId('total-orden')).toContainText(
    (service.precio * 2 + second.precio).toFixed(2),
  );
  await page.getByRole('button', { name: 'Quitar servicio 2', exact: true }).click();
  await page.getByLabel('Kilometraje actual *', { exact: true }).fill(String(km + 1));
  const sent = page.waitForRequest((r) => r.method() === 'POST' && r.url() === `${api}/ordenes`);
  await page.getByRole('button', { name: 'Registrar orden', exact: true }).click();
  expect((await sent).postDataJSON()).toEqual({
    vehiculoId: vehicle.id,
    kilometraje: km + 1,
    detalles: [{ servicioId: service.id, cantidad: 2 }],
  });
  await expect(page).toHaveURL(/\/ordenes\/\d+\?nueva=1$/);
  const id = new URL(page.url()).pathname.split('/').pop();
  await expect(page.getByText(/se registró correctamente/)).toBeVisible();
  await shot(page, '05-orden-registrada');
  const incomeBefore = await (
    await request.get(`${api}/reportes/ingresos-por-servicio`, { headers: jefe })
  ).json();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login(page, 'jefe');
  await page.goto('/ordenes');
  await expect(page.getByRole('link', { name: '+ Nueva orden' })).toHaveCount(0);
  await page.goto('/ordenes/nueva');
  await expect(page.getByRole('heading', { name: 'Acceso denegado', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
  await shot(page, '06-acceso-denegado');
  await page.goto(`/ordenes/${id}`);
  await page.getByRole('button', { name: 'Anular orden', exact: true }).click();
  await page
    .getByLabel('Motivo de anulación', { exact: true })
    .fill('Verificación integral E2E de AutoAndes');
  await page.getByRole('button', { name: 'Confirmar anulación', exact: true }).click();
  await expect(
    page.getByText('Motivo de anulación: Verificación integral E2E de AutoAndes'),
  ).toBeVisible();
  const incomeAfter = await (
    await request.get(`${api}/reportes/ingresos-por-servicio`, { headers: jefe })
  ).json();
  const sum = (rows: any[]) => rows.reduce((s, r) => s + r.importeTotal, 0);
  expect(sum(incomeBefore) - sum(incomeAfter)).toBeCloseTo(service.precio * 2);
  await page.goto('/reportes/ingresos-por-servicio');
  await expect(
    page.getByRole('heading', { name: 'Ingresos por servicio', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await shot(page, '07-reporte');
});

test('sesión: usuario inactivo, token alterado, vencimiento, retorno y página 404', async ({
  page,
}) => {
  await page.goto('/ordenes/nueva');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  await page.getByLabel('Usuario', { exact: true }).fill('inactivo');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos');
  await page.getByLabel('Usuario', { exact: true }).fill('asesor');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/ordenes\/nueva$/);
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('autoandes.sesion')!);
    s.token = 'token.alterado.firma';
    sessionStorage.setItem('autoandes.sesion', JSON.stringify(s));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('autoandes.sesion'))).toBeNull();
  await login(page, 'asesor');
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('autoandes.sesion')!);
    s.expiraEn = Date.now() - 1000;
    sessionStorage.setItem('autoandes.sesion', JSON.stringify(s));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/pagina-que-no-existe');
  await expect(page.getByRole('heading', { name: /404/ })).toBeVisible();
});

test('pantalla móvil conserva navegación y no desborda el ancho', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await shot(page, '08-login');
  await login(page, 'asesor');
  await expect(page.locator('.indicador').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await shot(page, '09-movil');
});
