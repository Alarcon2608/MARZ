# MAR-Z: Sistema de Gestión de Soporte Interno

MAR-Z es una plataforma web desarrollada para registrar, priorizar, asignar, atender y auditar solicitudes de soporte interno en organizaciones con múltiples sedes de distribución.

## Características Principales (Historias de Usuario)

* **HU01: Autenticación y Autorización.** Acceso seguro mediante credenciales. Las rutas y vistas se adaptan al rol del usuario (solicitante, agente, coordinador, auditor).
* **HU02: Registro de Solicitudes.** Los solicitantes pueden crear tickets detallando el problema y categoría.
* **HU03: Gestión y Atención.** Los agentes de soporte pueden atender las solicitudes y cambiar su estado.
* **HU04: Priorización y Asignación.** Los coordinadores tienen un panel dedicado para evaluar el impacto y asignar la prioridad adecuada a cada caso.
* **Trazabilidad (Auditoría).** Se mantiene un historial inmutable de cambios en el estado y prioridad de las solicitudes.

## Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Base de Datos:** MySQL (con paquete `mysql2` y soporte para promesas)
* **Seguridad:** JSON Web Tokens (JWT), encriptación de contraseñas con `bcrypt`
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla, arquitectura SPA basada en hash)
* **Testing:** Jest, Supertest

## Requisitos Previos

* Node.js (v16+)
* MySQL Server (v8+)

## Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd MARZ
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar la base de datos:**
   * Crea una base de datos en MySQL llamada `marz_db`.
   * Ejecuta el script SQL para crear las tablas e insertar datos iniciales:
     ```bash
     mysql -u <usuario> -p marz_db < database/schema.sql
     ```

4. **Variables de entorno:**
   * Copia el archivo de ejemplo y configúralo con tus credenciales:
     ```bash
     cp .env.example .env
     ```
   * Asegúrate de definir correctamente `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` en el archivo `.env`.

## Ejecución

**Modo Desarrollo (con auto-recarga):**
```bash
npm run dev
```

**Modo Producción:**
```bash
npm start
```

El servidor estará corriendo por defecto en `http://localhost:3000`.

## Pruebas

Para ejecutar la suite de pruebas unitarias y de integración:
```bash
npm test
```
