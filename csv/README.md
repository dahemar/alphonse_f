# 📊 Archivos CSV para Importar a Google Sheets

Estos archivos CSV contienen los datos actuales del proyecto y están listos para importar en Google Sheets.

## 📋 Estructura de Hojas

### 1. Hoja "Articles"
**Archivo:** `Articles.csv`

**Columnas:**
- `url` - URL del artículo
- `title` - Título del artículo
- `domain` - Dominio del sitio web
- `thumbnail_url` - URL de la imagen thumbnail (Imgur, etc.) - Opcional
- `order` - Orden de visualización (números enteros)

**Importante:** 
- La columna `thumbnail_url` puede dejarse vacía si quieres usar las imágenes por defecto
- El orden determina cómo se muestran los artículos en el carrusel

### 2. Hoja "Bio"
**Archivo:** `Bio.csv`

**Columnas:**
- `subtitle` - Subtítulo que aparece debajo del título principal
- `lightbox_content` - Contenido completo que aparece en el lightbox al hacer clic en "bio"

**Nota:** El contenido puede tener múltiples párrafos. En Google Sheets, puedes usar saltos de línea dentro de las celdas (Alt+Enter).

## 🚀 Cómo Importar a Google Sheets

### Paso 1: Abrir Google Sheets
1. Ve a: https://docs.google.com/spreadsheets/d/1OLoEI-7O9YNIuI-bVig1MNe63xocs_jPS3yLTgMB4zE/edit
2. O crea una nueva hoja de cálculo

### Paso 2: Crear las Hojas
1. Si no existen, crea dos hojas (tabs) llamadas:
   - `Articles`
   - `Bio`

### Paso 3: Importar Articles.csv
1. Abre la hoja "Articles"
2. Haz clic en `Archivo` → `Importar`
3. Selecciona `Subir` y elige `Articles.csv`
4. En "Importar ubicación", selecciona "Reemplazar hoja"
5. En "Convertir texto a números, fechas y fórmulas", selecciona según prefieras
6. Haz clic en `Importar datos`

### Paso 4: Importar Bio.csv
1. Abre la hoja "Bio"
2. Repite el proceso del Paso 3 con `Bio.csv`

### Paso 5: Verificar las Columnas
Asegúrate de que la primera fila contiene los encabezados correctos:

**Articles:**
```
url | title | domain | thumbnail_url | order
```

**Bio:**
```
subtitle | lightbox_content
```

### Paso 6: Agregar Headers si Faltan
Si los CSV no incluyen headers automáticamente, agrega manualmente la primera fila con los nombres de columnas antes de importar.

## ✏️ Cómo Editar Contenido

### Editar Artículos:
1. Abre la hoja "Articles"
2. **Añadir artículo:** Agrega una nueva fila con: url, title, domain, thumbnail_url (opcional), order
3. **Eliminar artículo:** Elimina la fila completa
4. **Cambiar thumbnail:** Pega la URL de Imgur u otro servicio en la columna `thumbnail_url`
5. **Reordenar:** Cambia los números en la columna `order`

### Editar Bio:
1. Abre la hoja "Bio"
2. **Subtítulo:** Edita la celda en la columna `subtitle`
3. **Contenido del lightbox:** Edita la celda en la columna `lightbox_content`
   - Puedes usar saltos de línea (Alt+Enter) para múltiples párrafos

## 📝 Notas Importantes

- Los cambios se reflejarán automáticamente en la web (con un cache de 1 minuto)
- Las URLs de thumbnails deben ser URLs completas (ej: `https://i.imgur.com/xxxxx.jpg`)
- El orden de los artículos se basa en la columna `order` (ascendente)
- Si un artículo no tiene `thumbnail_url`, se usará la imagen por defecto
- La hoja "Bio" debe tener al menos una fila de datos

## 🔧 Solución de Problemas

### Los artículos no aparecen:
- Verifica que la hoja se llama exactamente "Articles" (mayúscula inicial)
- Verifica que la primera fila tiene los headers correctos
- Verifica que las URLs son válidas

### El contenido de Bio no aparece:
- Verifica que la hoja se llama exactamente "Bio" (mayúscula inicial)
- Verifica que hay datos en la primera fila (después del header)

### Symlinks no funcionan:
- Si usas múltiples filas en Bio, asegúrate de que están correctamente formateadas
- Google Sheets puede tener problemas con algunos caracteres especiales en CSV

