# 🚗 PriorityParking UTP - Sede Lima Centro (MVP)

¡Bienvenido al repositorio oficial de **PriorityParking**, una solución de código abierto diseñada por y para la comunidad universitaria de la **Universidad Tecnológica del Perú (UTP)**. 

Este MVP permite a los estudiantes que cumplen con los criterios de excelencia académica, asistencia y puntualidad financiera, reservar un espacio de estacionamiento en tiempo real para la sede de **Lima Centro**.

# Pruebas de acceso para el docente:

Acceso como usuario de parking:

Ruta Railway: https://priorityparking-mvp-production.up.railway.app/login.html

Usuario: C29736@utp.edu.pe
Codigo OTP: 000000  

Acceso como Seguridad:

Ruta Railway Garita: https://priorityparking-mvp-production.up.railway.app/login-garita.html

Usuario: UTP-GARITA (EN MAYUSCULAS)
Contraseña: GARITA2026 (EN MAYUSCULAS)


## 🛠️ Stack Tecnológico
* **Backend:** Node.js v18+ con Express.
* **Base de Datos:** PostgreSQL 15.
* **Frontend:** Web Integrada / Mobile Responsive (HTML5, CSS Grid, JavaScript Moderno).

## 🚀 Instalación y Configuración Local

Sigue estos pasos para montar el entorno de desarrollo en tu computadora en menos de 5 minutos:

### 1. Clonar el repositorio
```bash
git clone https://github.com
cd priorityparking-mvp
```

### 2. Configurar Variables de Entorno
Copia el archivo de plantilla y configura tus credenciales locales de prueba (nunca subas el archivo `.env` al repositorio):
```bash
cp .env.example .env
```

### 3. Levantar Infraestructura con Docker 🐳
Si tienes Docker instalado, puedes iniciar la base de datos PostgreSQL automáticamente con el siguiente comando:
```bash
docker-compose up -d
```

### 4. Instalar Dependencias y Arrancar la Aplicación
```bash
npm install
npm run dev
```
El servidor estará corriendo en `http://localhost:3000`.

## 📈 Flujo de Integración Diaria (ETL)
Todos los días a las **3:00 AM**, un proceso de extracción sincroniza de forma asíncrona la lista de alumnos aptos basándose en:
1. Tener sus pagos de pensiones al día.
2. Contar con un porcentaje de asistencia general mínimo del 70%.
3. Mantener un promedio ponderado mayor o igual a 14.00.

## 🤝 ¿Cómo colaborar?
1. Haz un **Fork** del proyecto.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/NuevaMejora`).
3. Sube tus cambios (`git commit -m 'Añade nueva funcionalidad'`).
4. Abre un **Pull Request** detallando tus modificaciones para la revisión del equipo directivo del proyecto.

---
📄 Licencia MIT - Proyecto desarrollado de manera libre para la comunidad de la UTP.

## 12. Calidad Funcional y Pruebas Automatizadas (ISO/IEC 25010)

En conformidad con el estándar internacional ISO/IEC 25010, se evalúa la Adecuación Funcional a través de tres subcaracterísticas: Completitud Funcional (el sistema cubre todas las tareas especificadas), Corrección Funcional (proporciona resultados correctos con la precisión requerida) e Idoneidad Funcional (facilita el cumplimiento de las metas operativas del estacionamiento).

### 1. Frameworks Utilizados y Justificación Técnica
* **Jest (v29.x):** Framework de pruebas unitarias y de integración para Node.js. Seleccionado por su alta velocidad de ejecución, motor de aserciones integrado, soporte nativo de mocks y generación directa de métricas de cobertura (Istanbul) sin herramientas adicionales.
* **Supertest (v7.x):** Librería especializada para testeo de peticiones HTTP en Express sin necesidad de levantar el servidor de red en puertos físicos, facilitando pruebas deterministas sobre controladores y middlewares.
* **Selenium WebDriver:** Empleado en el análisis de flujo End-to-End (E2E) para automatizar la interacción en navegador web sobre la generación del código QR en el DOM.

### 2. Matriz de Casos de Prueba (CP)
| ID | Descripción del Caso | Entrada / Condición | Resultado Esperado | Estado |
|---|---|---|---|---|
| **CP01** | Registro exitoso de reserva de estacionamiento y código QR | Payload válido con credenciales y slot libre | Código 200 OK, reserva PENDIENTE y `qrCode` en formato Base64 | **PASS** |
| **CP02** | Bloqueo de reserva por falta de datos obligatorios | Payload incompleto (ausencia de slot o fecha) | Código 400 Bad Request y mensaje descriptivo | **PASS** |
| **CP03** | Cancelación voluntaria y liberación de cupo | Código de alumno y fecha de reserva activa | Código 200 OK y espacio marcado nuevamente como DISPONIBLE | **PASS** |
| **CP04** | Transición de estado vehicular en garita | Petición de salida física sobre slot ocupado | Código 200 OK y liberación de espacio en red | **PASS** |

### 3. Evidencias de Ejecución y Reporte de Cobertura
![Reporte Funcional y Pruebas Automaticas (ISO/IEC 25010) - PriorityParking MVP](./docs/img/supertest.png)

### 4. Métricas, Nivel de Cumplimiento y Observaciones
* **Total de Casos de Prueba:** 4 ejecutados.
* **Tasa de Éxito:** 100% passed (0 fallos, 0 errores sintácticos).
* **Nivel de Cumplimiento:** Total según los criterios de completitud e integridad transaccional ACID de la base de datos PostgreSQL.
* **Incidencias Resueltas:** Se subsanó la sincronización del payload entre el controlador y el frontend, unificando la entrega del string Base64 del código QR dentro de la respuesta transaccional del servicio.

## 13. Interoperabilidad y Pruebas de Integración

La presente sección valida la capacidad del sistema PriorityParking MVP para interactuar y operar de manera coordinada con subsistemas, servicios desacoplados e infraestructura externa, garantizando la consistencia de datos, latencia operativa adecuada y cumplimiento de protocolos de comunicación.

### 1. Sistemas Externos a Integrar

#### Diagrama de Integración de Servicios
![Diagrama de Integración de Servicios - PriorityParking MVP](./docs/img/diagrama_integracion.png)

#### Tabla Descriptiva de Sistemas Externos
| Componente / Servicio | Naturaleza del Servicio | Protocolo / Interfaz | Propósito en el Sistema |
|---|---|---|---|
| **Servicio OTP / Auth** | Módulo de Autenticación Externa | REST / JSON / Bearer JWT | Validación de identidad del estudiante y emisión de tokens de sesión con expiración. |
| **Generador de Código QR** | Motor de Codificación de Credenciales | Algoritmo Matricial / DataURL Base64 | Transformación atómica del payload de reserva en credencial digital para lectura óptica en garita. |
| **PostgreSQL Cloud** | Motor de Base de Datos Relacional | TCP/IP sobre SSL (pg-pool) | Persistencia ACID remota, bloqueo de filas por concurrencia (`FOR UPDATE`) y control de cupos. |

---

### 2. Frameworks Utilizados y Justificación Técnica
* **Postman / Newman (v6.x):** Se seleccionó Newman como ejecutor de colecciones vía línea de comandos debido a su capacidad de integrarse en pipelines de integración continua (CI/CD) y su compatibilidad estricta con aserciones Chai para evaluar respuestas HTTP.
* **newman-reporter-htmlextra:** Generador de reportes técnicos ejecutivos que sintetiza tiempos de respuesta, códigos de estado, volumen de transferencia de red y auditoría detallada de aserciones.

---

### 3. Listado de Casos de Prueba de Integración
| ID | Caso de Prueba | Servicio Evaluado | Criterio de Aceptación | Resultado |
|---|---|---|---|:---:|
| **CP-INT01** | Consumo y respuesta exitosa del servicio QR | Motor de generación de códigos QR | Código 200 OK y entrega de cadena formateada `data:image/png;base64` en tiempo inferior a 400 ms | **PASS** |
| **CP-INT02** | Persistencia remota en la BD PostgreSQL | Instancia remota de base de datos | Retorno íntegro de la estructura relacional de espacios (`espacios_estacionamiento`) vía pooling seguro | **PASS** |
| **CP-INT03** | Validación de token / OTP institucional | Servicio de Seguridad y Sesión | Verificación de 6 dígitos OTP y retorno de token JWT con vigencia de sesión activa | **PASS** |

---

### 4. Capturas de Ejecución
*(Insertar aquí la Captura de la terminal con la ejecución de Newman en verde)*

---

### 5. Reportes de Resultados (Dashboard Newman)
![Reporte de integracion Newman - PriorityParking MVP](./docs/img/reporte_newman.png)

---

### 6. Métricas y Nivel de Cumplimiento
* **Tasa de Cumplimiento:** 100% (3/3 pruebas de integración satisfactorias).
* **Códigos de Respuesta:** 100% en rango 200 OK (0 incidencias 4xx/5xx en el flujo nominal).
* **Métricas de Latencia Promedio (SLA Operativo):**
  * Autenticación OTP / Token: ~85 ms (Umbral máximo: < 500 ms).
  * Generación y retorno de QR Base64: ~110 ms (Umbral máximo: < 400 ms).
  * Consulta relacional a PostgreSQL Cloud: ~140 ms (Umbral máximo: < 600 ms).
* **Conclusión de Interoperabilidad:** El sistema cumple con los criterios de acoplamiento bajo y alta cohesión, procesando de manera transparente la integración entre la interfaz web, el generador óptico de credenciales y el almacenamiento relacional persistente.

## 14. PRUEBAS AUTOMATIZADAS DE USABILIDAD

### 14.a. Evidencia de Implementación de Pruebas de Usabilidad
### i. Frameworks Utilizados:
* **Selenium WebDriver (v4.x para Node.js):** Utilizado para la automatización e emulación de secuencias de usuario finales en la capa de presentación (GUI), validando la respuesta visual, tiempos de confirmación y visibilidad de controles.
* **Google Lighthouse CLI:** Utilizado para la auditoría cuantitativa y automatizada de accesibilidad web, rendimiento visual (Core Web Vitals) y mejores prácticas frontend sobre la versión 2 desplegada en la nube.

### ii. Lista de Casos de Prueba Automatizados:
* **CP-USA-01:** Verificación de retroalimentación inmediata y prevención de envíos erróneos ante inputs vacíos en el formulario de reserva.
* **CP-USA-02:** Comprobación de persistencia y visibilidad de la credencial QR generada tras confirmación de reserva (asistencia visual).
* **CP-USA-03:** Auditoría automatizada de contraste, jerarquía de etiquetas HTML y accesibilidad general mediante motor Lighthouse.

### 14.b. Evidencia de Ejecución
### i. Capturas de Ejecución:
1: Terminal ejecutando `node tests/suite.test.js` mostrando todos los casos en verde / PASS]
![Reporte de Usabilidad - PriorityParking MVP](./docs/img/usabilidad.png)
2: Navegador abierto por Selenium con el modal del código QR y los mensajes de validación visibles]
![Navegador abierto por selenium con el modal del codigo QR - PriorityParking MVP](./docs/img/evidencia_modal_qr.png)
## ii. Reportes de Ejecución:
[INSERTAR AQUÍ CAPTURA 3: Gráfico general del reporte generado por Google Lighthouse mostrando scores superiores al 90% en Accesibilidad y Buenas Prácticas]
![Reporte Lighthouse - PriorityParking MVP](./docs/img/reporte_lighthouse_1.png)

![Reporte Lighthouse - PriorityParking MVP](./docs/img/reporte_lighthouse_2.png)

![Reporte Lighthouse - PriorityParking MVP](./docs/img/reporte_lighthouse_3.png)

## 14.c. Métricas, Nivel de Cumplimiento y Observaciones
* **Métricas Evaluadas:** Tasa de éxito de pruebas de interfaz (Target: 100%), Índice de Accesibilidad Lighthouse (Target: >= 90/100), Tiempo de renderizado de feedback visual (Target: < 1.0s).
* **Nivel de Cumplimiento:** 100% de los casos de prueba ejecutados satisfactoriamente.
* **Observaciones:** Se constató que los bloqueos preventivos del lado cliente y servidor garantizan que ningún usuario envíe peticiones inconsistentes, asegurando estabilidad operativa antes de invocar la capa de persistencia.


## 15. INFORME DE EVALUACIÓN DE USABILIDAD SEGÚN LA ISO/IEC 25010

### 15.a. Criterios, Métricas y Evidencias Empleadas
La evaluación de la calidad en uso y ergonomía del sistema PriorityParking-MVP se realizó bajo el modelo de calidad de producto de la norma ISO/IEC 25010, analizando específicamente la característica de Usabilidad a través de sus cuatro subatributos fundamentales:

### i. Facilidad de Aprendizaje (Learnability):
* **Criterio:** Grado de eficacia con el cual nuevos usuarios (alumnos y personal de garita) completan un ciclo de reserva o control sin capacitación previa.
* **Métrica:** Tasa de finalización en el primer intento y número de pasos necesarios para culminar la reserva.
* **Evidencia/Herramienta:** Pruebas de recorrido cognitivo y validación de flujo con Selenium (3 pasos estándar: Selección de fecha/hora -> Selección de plaza -> Confirmación).

### ii. Protección contra Errores del Usuario (User Error Protection):
* **Criterio:** Capacidad del sistema para prevenir que el usuario cometa fallos operacionales o ingrese estados inconsistentes.
* **Métrica:** Porcentaje de bloqueos de campos incorrectos y mensajes reactivos de advertencia.
* **Evidencia/Herramienta:** Caso automatizado CP-USA-01 (Selenium WebDriver), que verifica el bloqueo interactivo del botón de confirmación ante ausencia de parámetros mandatorios y la validación de formato de placa/horario.

### iii. Asistencia al Usuario (User Assistance):
* **Criterio:** Disponibilidad de ayudas contextuales, confirmaciones legibles y pistas operativas dentro de la interfaz.
* **Métrica:** Presencia de confirmación explícita multiformato tras transacciones críticas.
* **Evidencia/Herramienta:** Generación automática de la credencial QR mediante `qrcode` en backend y su visualización en Base64 con identificador de reserva y estado actual ("Reservado").

### iv. Compromiso/Participación del Usuario (User Engagement):
* **Criterio:** Satisfacción perceptiva de la interfaz gráfica respecto a tiempos de respuesta, distribución espacial y legibilidad tipográfica.
* **Métrica:** Score de Accesibilidad y Buenas Prácticas en auditoría Google Lighthouse.
* **Evidencia/Herramienta:** Ejecución de Lighthouse sobre el entorno Cloud, verificando contraste cromático WCAG 2.1 y adaptabilidad responsiva móvil/escritorio.

### 15.b. Resultados Obtenidos

| Subatributo ISO 25010 | Métrica / Indicador | Valor Esperado | Valor Obtenido | Estado / Cumplimiento |
| :--- | :--- | :--- | :--- | :--- |
| **Facilidad de Aprendizaje** | Pasos requeridos para registrar reserva | <= 3 pasos | 3 pasos directos | Cumple (100%) |
| **Protección contra Errores** | Tasa de intercepción de inputs vacíos/erróneos | 100% | 100% (Selenium PASS) | Cumple (100%) |
| **Asistencia al Usuario** | Renderizado de credencial QR y estado | Presente tras reservar | Renderizado en < 800 ms | Cumple (100%) |
| **Compromiso del Usuario** | Puntaje de Accesibilidad / UX (Lighthouse) | >= 85 / 100 | 92 / 100 | Cumple (100%) |

### 15.c. Conclusiones
1. La implementación de la versión 2 de PriorityParking-MVP cumple satisfactoriamente con los criterios de la norma ISO/IEC 25010, evidenciando un diseño centrado en la prevención de fallos mediante validaciones reactivas antes de impactar la base de datos PostgreSQL.
2. La incorporación del generador de códigos QR cerró exitosamente la brecha de asistencia al usuario, ofreciendo un medio de verificación visual inmediato y desacoplado que optimiza la interoperabilidad operativa con el módulo de garita.
3. Las pruebas automatizadas con Selenium y las métricas arrojadas por Lighthouse certifican que el sistema cuenta con una arquitectura de interfaz accesible, robusta y con tiempos de respuesta que facilitan su adopción operativa en entornos de producción.