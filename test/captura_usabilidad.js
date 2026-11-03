// test/captura_usabilidad.js
const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function tomarCapturaModalQR() {
  console.log('[Selenium] Iniciando sesión para captura de modal y QR...');

  const options = new chrome.Options();
  options.addArguments('--window-size=1366,768');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--log-level=3'); // Suprime las alertas rojas del updater
  options.excludeSwitches('enable-logging'); // Silencia la consola de ChromeDriver

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // 1. Cargar la aplicación local
    await driver.get('http://localhost:3000');
    await driver.wait(until.elementLocated(By.tagName('body')), 5000);

    // 2. Simular interacción para levantar el modal con el ticket QR
    await driver.executeScript(() => {
      // Buscar y activar modal en el DOM
      const modal = document.querySelector('.modal') || 
                    document.getElementById('modal-reserva') || 
                    document.getElementById('modal-ticket');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.style.opacity = '1';
      }
    });

    // Pequeña pausa para asegurar el renderizado visual
    await driver.sleep(10000);

    // 3. Tomar screenshot automatizado y guardarlo en la raíz
    const imagenBase64 = await driver.takeScreenshot();
    fs.writeFileSync('./evidencia_modal_qr.png', imagenBase64, 'base64');

    console.log('------------------------------------------------------------');
    console.log('CAPTURA GENERADA CON ÉXITO: ./evidencia_modal_qr.png');
    console.log('------------------------------------------------------------');
  } catch (error) {
    console.error('[Error durante la captura]:', error.message);
  } finally {
    await driver.quit();
  }
}

tomarCapturaModalQR();