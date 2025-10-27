# Portfolio Portfolio
Un portfolio web moderno construido con React y TypeScript que presenta un reproductor de media player estético para mostrar links.

**Deployed to Vercel**: https://alphonse-f.vercel.app/

## Características

- **Diseño Responsivo**: Interfaz moderna con gradientes y efectos de glassmorphism
- **Reproductor Estético**: Diseño de media player que muestra links en lugar de canciones
- **Lista de Links**: Playlist scrolleable con thumbnails y navegación
- **Navegación Intuitiva**: Botones de navegación y selección directa de links
- **Thumbnails Personalizados**: Imágenes representativas para cada link

## Links Incluidos

El portfolio incluye una colección de artículos y entrevistas de diferentes medios:

- Palmistry Tinkerbell Interview (Paper Magazine)
- BKTHERULA Lvl5 (Paper Magazine)
- Joanne Robertson Blue Car (Paper Magazine)
- Joanne Robertson on Creating Alone (The Creative Independent)
- Julia's War Recordings (Nina Protocol)
- Building Intensity: Ouri (Office Magazine)
- Sean Kennedy Olth Interview (Alternative Press)

## Tecnologías Utilizadas

- React 18
- TypeScript
- Styled Components
- CSS3 con efectos modernos

## Instalación y Ejecución

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm start
```

3. Construir para producción:
```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── Bio.tsx          # Componente de biografía
│   └── MediaPlayer.tsx  # Reproductor de media player
├── App.tsx              # Componente principal
└── index.tsx            # Punto de entrada
```

## Personalización

- **Bio**: Edita el texto en `src/components/Bio.tsx`
- **Links**: Modifica la lista en `src/App.tsx`
- **Estilos**: Personaliza los componentes styled en cada archivo
- **Thumbnails**: Reemplaza los placeholders con imágenes reales

## Licencia

MIT
