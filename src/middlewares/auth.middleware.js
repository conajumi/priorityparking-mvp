// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del token JWT y autorizar según el Rol
 * @param {Array} rolesPermitidos - Lista de roles que pueden acceder (Ej: ['ADMIN', 'GARITA'])
 */
function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        // 1. Extraer el token del encabezado de la petición (Authorization: Bearer <TOKEN>)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. Token de seguridad no proporcionado.' });
        }

        try {
            // 2. Verificar la firma del JWT usando la clave secreta del .env
            const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
            
            // Inyectamos los datos del usuario descifrados en la petición para uso de los controladores
            req.usuario = datosUsuario;

            // 3. Control de Acceso Basado en Roles (RBAC)
            if (!rolesPermitidos.includes(datosUsuario.rol)) {
                return res.status(403).json({ 
                    error: `Acceso prohibido. Tu rol de '${datosUsuario.rol}' no tiene permisos para esta operación.` 
                });
            }

            // Si todo es correcto, permite el paso al controlador correspondiente
            next();

        } catch (error) {
            console.error('[JWT Middleware Error]:', error.message);
            return res.status(403).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
        }
    };
}

module.exports = { verificarRol };
