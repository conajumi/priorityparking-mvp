# 🚗 PriorityParking UTP - Sede Lima Centro (MVP)

¡Bienvenido al repositorio oficial de **PriorityParking**, una solución de código abierto diseñada por y para la comunidad universitaria de la **Universidad Tecnológica del Perú (UTP)**. 

Este MVP permite a los estudiantes que cumplen con los criterios de excelencia académica, asistencia y puntualidad financiera, reservar un espacio de estacionamiento en tiempo real para la sede de **Lima Centro**.

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
