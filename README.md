La Propia Pizzería — demostración de propuesta web
​Estado: demostración independiente para presentar al propietario. No es la página oficial ni está afiliada al restaurante. No se han contratado el dominio, alojamiento, analítica ni servicio de base de datos. El sitio puede publicarse como demo estática en Netlify; la carta, el carrito y la vista previa local de administración funcionan sin servicios externos. Para administración multiusuario/persistente y publicación comercial se requiere configurar Supabase.
​1. Qué incluye
​Portada editorial responsive con identidad inspirada en el logo público rojo sobre crema.
​Catálogo de 50 productos consultados en el menú público de Rappi, categorías, buscador, filtros y recomendados.
​Fotografías locales recortadas de CARTA PROPIA.pdf para 20 pizzas identificadas. Los demás productos conservan sus imágenes previas o ilustraciones de respaldo. No representar la ilustración como fotografía real.
​Precios de las pizzas seleccionadas tomados de CARTA PROPIA.pdf; el resto de productos conserva precios en pesos colombianos como referencia publicada por Rappi (consulta del 2 de octubre de 2026). Las tarifas oficiales, tamaños, condiciones y disponibilidad deben confirmarse con el restaurante antes de poner una web en producción.
​Carrito persistente en el navegador, edición de cantidades, subtotal y mensaje para solicitar un pedido por WhatsApp.
​Formulario de solicitud de reserva que prepara un mensaje para WhatsApp; no reserva automáticamente una mesa.
​Ubicación, horarios de referencia, enlaces oficiales a Instagram, Linktree, carta de Google Drive y Rappi.
​Página qr.html en formato A5 imprimible. Por defecto contiene el QR real de la carta oficial de Google Drive, no un dominio ficticio. Con un dominio HTTPS nuevo, config.siteUrl permite generar un QR nuevo (requiere conexión a api.qrserver.com).
​admin/: panel responsive para productos, precios, descripciones, imágenes, promociones, información del sitio, respaldos JSON y QR.
​supabase/setup.sql: esquema, políticas RLS y productos de arranque para conectar el panel a una base de datos con autenticación real.
​Analítica GA4 optativa solo si el visitante acepta y configuras una medición en config.js.