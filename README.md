# La Propia Pizzería — demostración de propuesta web

**Estado:** demostración independiente para presentar al propietario. **No es la página oficial** ni está afiliada al restaurante. No se han contratado el dominio, alojamiento, analítica ni servicio de base de datos. El sitio puede publicarse como demo estática en Netlify; la carta, el carrito y la vista previa local de administración funcionan sin servicios externos. Para administración multiusuario/persistente y publicación comercial se requiere configurar Supabase.

## 1. Qué incluye

- Portada editorial responsive con identidad inspirada en el logo público rojo sobre crema.
- Catálogo de **50 productos** consultados en el menú público de Rappi, categorías, buscador, filtros y recomendados.
- Fotografías locales recortadas de CARTA PROPIA.pdf para 20 pizzas identificadas. Los demás productos conservan sus imágenes previas o ilustraciones de respaldo. **No** representar la ilustración como fotografía real.
- Precios de las pizzas seleccionadas tomados de CARTA PROPIA.pdf; el resto de productos conserva precios en pesos colombianos como **referencia publicada por Rappi** (consulta del 2 de octubre de 2026). Las tarifas oficiales, tamaños, condiciones y disponibilidad **deben confirmarse con el restaurante** antes de poner una web en producción.
- Carrito persistente en el navegador, edición de cantidades, subtotal y mensaje para solicitar un pedido por WhatsApp.
- Formulario de **solicitud** de reserva que prepara un mensaje para WhatsApp; **no reserva automáticamente** una mesa.
- Ubicación, horarios de referencia, enlaces oficiales a Instagram, Linktree, carta de Google Drive y Rappi.
- Página `qr.html` en formato A5 imprimible. Por defecto contiene el **QR real de la carta oficial de Google Drive**, no un dominio ficticio. Con un dominio HTTPS nuevo, `config.siteUrl` permite generar un QR nuevo (requiere conexión a api.qrserver.com).
- `admin/`: panel responsive para productos, precios, descripciones, imágenes, promociones, información del sitio, respaldos JSON y QR.
- `supabase/setup.sql`: esquema, políticas RLS y productos de arranque para conectar el panel a una base de datos con autenticación real.
- Analítica GA4 optativa **solo si el visitante acepta** y configuras una medición en `config.js`.

## 2. Abrir la demo en tu PC

**Sin instalar nada:** abre `index.html` en Chrome. Como la carta también existe en `data.js`, puede abrirse desde el disco, aunque algunas funcionalidades del navegador (portapapeles, rutas relativas o analítica) pueden variar con `file://`.

**Recomendado:** abre esta carpeta con VS Code + Live Server o en una terminal ejecuta:

```sh
python -m http.server 8080
```

Visita `http://localhost:8080`. El panel está en `http://localhost:8080/admin/` y el cartel de QR en `/qr.html`.

## 3. Cuidado: pedidos de prueba

`config.js` contiene `demoMode: true`. En ese modo, el botón de WhatsApp **no manda mensajes a La Propia Pizzería**: muestra un mensaje que puedes copiar. Deja esa opción activada durante la demostración. Después de que el propietario dé su autorización y confirme su teléfono, cambia `demoMode: false`. Con ello, los botones de pedido y reserva abrirán WhatsApp con el mensaje prellenado, pero **el cliente aún debe enviarlo y el local debe confirmar**.

## 4. Administración (dos modos)

**Modo demo local (sin servidor):** abre `/admin`. Puedes editar productos y precios, ocultar platos, crear promociones, actualizar enlaces e imágenes y exportar/importar tus datos. Los cambios se guardan con `localStorage` **solo en ese navegador y ese origen**. No hay contraseña en modo demo porque no representa un servicio seguro ni una administración en tiempo real. Para probar tus cambios, vuelve a abrir la página pública **en el mismo navegador y dominio local**.

**Modo real con Supabase:**

1. Crea un proyecto en [Supabase](https://supabase.com/). En SQL Editor ejecuta `supabase/setup.sql`.
2. En `Authentication → Users`, crea o invita el correo electrónico del administrador; verifica que pueda iniciar sesión.
3. Reemplaza `ADMIN@TU-DOMINIO.COM` por el correo exacto del administrador y ejecuta la línea `insert into public.admin_users(...)` que está comentada al final de `setup.sql`. No dejes libre la inserción en esa tabla; el alta debe hacerla alguien con acceso al SQL Editor.
4. En `Project Settings → API` copia **Project URL** y **anon/publishable key** en `config.js`, campos `supabaseUrl` y `supabaseAnonKey`. **Nunca** pegues la clave `service_role` ni cualquier secreto del servidor en `config.js`.
5. Abre `/admin/`, inicia sesión, edita la carta y sube imágenes desde el panel. El bucket `menu-images` tiene políticas de escritura reservadas a usuarios de `admin_users` y lectura pública para las fotos publicadas.
6. Comprueba en otra ventana privada que los cambios se ven en la web pública y que un visitante anónimo **no** puede editar datos. Revisa las políticas si agregas roles o cambias tablas.

Si se configura Supabase, el cliente consulta los productos y la configuración desde la base de datos. Si falla la conexión, la página pública vuelve a la carta inicial **de demostración** y registra el aviso en la consola; el panel de producción muestra error en lugar de fingir cambios guardados.

## 5. Publicar en Netlify

- Arrastra **el contenido de esta carpeta** al deploy manual de Netlify o sube los archivos a un repositorio GitHub y conéctalo a Netlify. No es necesario `npm build`: es HTML/CSS/JS estático.
- Si usas Supabase, configura `config.js` antes del deploy. Como es un archivo público, contiene solo campos públicos y clave anon, jamás secretos.
- El proyecto incluye `robots.txt` con `Disallow: /` para evitar indexar la **demo**. Tras obtener autorización y publicar oficialmente, cambia `robots.txt` a `Allow: /` y agrega tu `sitemap.xml` con el dominio final. También cambia título, metadescripción y la marca de demo visible.
- Rellena `siteUrl` con el URL definitivo que incluya `https://`, abre `/qr.html`, comprueba el destino escaneándolo desde el móvil e imprime el cartel.
- Antes de activar GA4, anota el identificador `G-...` en `ga4MeasurementId`. El banner pedirá consentimiento antes de cargar el script.

## 6. Revisión previa a presentarla como web oficial

Esta versión utiliza información pública para una **propuesta comercial**. Antes de ofrecerla como sitio oficial, acuerda con el dueño: uso de logo y fotografías de marca, fotos originales en alta resolución, precio y tamaño de cada plato, modificadores/extras reales, horarios vigentes, teléfono, zona/tarifa de domicilios, contacto para reservas, promociones activas, política de datos de formularios y URL del dominio. Las fotografías de Rappi se usan enlazadas **solo en esta demo** y podrían dejar de cargar. Con autorización, sustitúyelas por fotos proporcionadas por el restaurante y almacénalas en `menu-images`.

No se realizan cobros en línea, no existe servicio de repartidores ni el formulario promete una reserva confirmada. El carrito y el formulario preparan solicitudes que el personal debe validar.

## 7. Fuentes consultadas y limitaciones

- **Linktree del restaurante:** https://linktr.ee/lapropiapizzeria — teléfono, dirección de la nueva sede, carta oficial, canales de pedido y reservas.
- **Carta oficial enlazada por ellos:** https://drive.google.com/file/d/13OKa8JFlCoBSHLhA3R70J4nAkcfayBoq/view?usp=sharing — el acceso de la herramienta al contenido interno estuvo restringido; se deja enlace directo, sin afirmar que se transcribió el PDF.
- **Carta publicada en Rappi:** https://www.rappi.com.co/restaurantes/900067079-la-propia-pizzeria — base de las 50 fichas de productos, descripciones y precios de referencia.
- **Ficha pública del local:** https://es.restaurantguru.com/La-Propia-Santa-Marta — horarios de referencia; estos pueden variar.
- **Instagram:** https://www.instagram.com/lapropiapizzeria/ — referencia del nombre e identidad, sin reproducir publicaciones privadas.

Los textos promocionales de esta **propuesta** son copy creativo, no afirmaciones verificadas sobre la trayectoria, premios o técnicas del restaurante. Evita publicar reseñas ficticias o contar una historia no confirmada.

## Actualización: fotografías de la carta adjunta

Las 20 imágenes de pizzas son **recortes de fotografías que aparecen en CARTA PROPIA.pdf**, empaquetadas dentro de `assets/carta/`. La carta oficial presenta dos tamaños para varias pizzas: personal de 20 cm y mediana de 32 cm. Se muestran los dos tamaños en la selección del producto y el carrito calcula correctamente cada variante; las recargadas se ofrecen como personales de 20 cm según el documento. La web sigue siendo una demo no oficial y **no debe publicarse comercialmente sin autorización para usar logo y fotografías**. Los precios y disponibilidad están sujetos a confirmación con el restaurante. Si una versión anterior fue abierta en el mismo dominio, la nueva versión incluye una clave de almacenamiento diferente para que los precios antiguos no sustituyan la actualización.

## Mejora visual de la portada

La fotografía principal utiliza ahora una versión local optimizada de **La de Uchuva** (`assets/carta/hero-la-de-uchuva.webp`), recortada específicamente para el marco de portada. La versión anterior de La Patrona sigue disponible en su ficha de producto. Se conservan todas las fotos de las 20 pizzas extraídas del PDF, los selectores de tamaño, el carrito y la animación horizontal ultralenta de la franja.
