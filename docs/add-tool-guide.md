# Cómo crear una nueva herramienta

Esta guía describe los pasos necesarios para agregar una nueva herramienta a DevKitHub.

## Pasos

### 1. Crear la página de la herramienta

Crea un nuevo archivo en `src/pages/`:

```bash
cp src/pages/jwt-debug.tsx src/pages/nueva-herramienta.tsx
```

O crea uno desde cero. La página debe:

- Ser un componente de React
- Exportarse como función nombrada (ej: `export function NuevaHerramientaPage()`)
- Usar los componentes compartidos de layout (ver sección "Layout compartido")
- Usar `ToolPageContainer` como wrapper raíz (provee `ScrollArea`)
- Usar `ToolPageHeader` para título y descripción
- Usar `ToolCopyButton` y `ToolClearButton` para acciones unificadas

### 2. Registrar la herramienta en tools-data.ts

Edita `src/utils/tools-data.ts`:

```typescript
{
  id: slugify('Nombre de la Herramienta'),
  title: 'Nombre de la Herramienta',
  description: 'Descripción breve',
  url: '/ruta-url',
  icon: IconoDeLucide,
  color: 'bg-color-500/10 text-color-500',
  category: 'categoria',
}
```

**Categorías disponibles:**

- `encode-decode` - Encode & Decode
- `data-conversion` - Data Conversion
- `text-string` - Text & String
- `code-formatting` - Code Formatting
- `development` - Development
- `security` - Security
- `media` - Media
- `utilities` - Utilities

**Colores disponibles (Tailwind):**

- `bg-blue-500/10 text-blue-500`
- `bg-red-500/10 text-red-500`
- `bg-green-500/10 text-green-500`
- `bg-yellow-500/10 text-yellow-500`
- `bg-purple-500/10 text-purple-500`
- `bg-pink-500/10 text-pink-500`
- `bg-indigo-500/10 text-indigo-500`
- etc.

**Iconos disponibles (Lucide React):**

- Ver `src/utils/tools-data.ts` para la lista completa de imports
- Los más comunes: `Key`, `Hash`, `FileCode`, `FileJson`, `Database`, etc.

### 3. Agregar la ruta en app.tsx

Edita `src/app.tsx`:

1. Importa la página:

```typescript
import { NuevaHerramientaPage } from "./pages/nueva-herramienta";
```

2. Agrega la ruta:

```typescript
<Route path="/ruta-url" element={<NuevaHerramientaPage />} />
```

### 4. (Opcional) Agregar a herramientas destacadas

Edita `src/utils/tools-data.ts` y agrega la herramienta a `featuredTools`:

```typescript
export const featuredTools = [
  // ... herramientas existentes
  allTools.find((t) => t.title === "Nombre de la Herramienta")!,
];
```

## Layout compartido (Obligatorio)

Todas las herramientas DEBEN usar los componentes de layout compartidos de `src/components/tool-page-layout.tsx` y acciones de `src/components/tool-actions.tsx`.

### Componentes de layout

```typescript
import { ToolPageContainer, ToolPageHeader, ToolEditorPanel, ToolEditorGrid, ToolToolbar, ToolErrorBanner } from '../components/tool-page-layout';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
```

- **`ToolPageContainer`** - Wrapper raíz. Provee `ScrollArea`, container, padding y spacing.
- **`ToolPageHeader`** - Título (`text-2xl font-bold`) y descripción (`text-muted-foreground`).
- **`ToolEditorGrid`** - Grid de 2 columnas para editors (`grid-cols-1 md:grid-cols-2 gap-6`).
- **`ToolEditorPanel`** - Panel con label, actions y area de contenido. Props: `label`, `actions`, `heightClass`.
- **`ToolToolbar`** - Fila de controles global (`flex flex-wrap gap-4 items-center`).
- **`ToolErrorBanner`** - Banner de error. Devuelve `null` si el string está vacío.
- **`ToolCopyButton`** - Botón de copiar con animación. Props: `value` (string a copiar).
- **`ToolClearButton`** - Botón de limpiar con animación. Props: `onClear` (callback).

### Editor heights estándar

- Default: `h-[calc(100vh-17rem)]`
- Con toolbar extra (como js-obfuscator): `h-[calc(100vh-28rem)]`

### Ejemplo de estructura

```tsx
<ToolPageContainer>
  <ToolPageHeader title="Mi Herramienta" description="Descripción breve" />

  <ToolEditorGrid>
    <ToolEditorPanel
      label="Input"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleSample}>Sample</Button>
          <ToolClearButton onClear={clearState} />
        </>
      }
    >
      <AppCodeMirror ... className="h-[calc(100vh-17rem)]" />
    </ToolEditorPanel>

    <ToolEditorPanel
      label="Output"
      actions={<ToolCopyButton value={output} />}
    >
      <AppCodeMirror ... className="h-[calc(100vh-17rem)]" />
    </ToolEditorPanel>
  </ToolEditorGrid>
</ToolPageContainer>
```

## Componentes UI disponibles

Ver `src/components/ui/`:

- `Button` - Botones
- `Card` - Tarjetas
- `Input` - Campos de texto
- `Label` - Etiquetas
- `Textarea` - Áreas de texto
- `Select/SelectContent/SelectItem/SelectTrigger/SelectValue` - Selectores
- `ToolCopyButton` - Botón de copiar unificado (en `src/components/tool-actions.tsx`)
- `ToolClearButton` - Botón de limpiar unificado (en `src/components/tool-actions.tsx`)
- `AppCodeMirror` - Editor de código
- `Checkbox`, `Switch`, `Slider` - Controles de formulario
- `Progress` - Barra de progreso
- `ScrollArea` - Área de scroll personalizada (obligatorio via `ToolPageContainer`)

## Persistencia de estado (Obligatorio)

Todas las herramientas deben guardar su estado usando el hook `useToolState`. Esto permite que el estado se guarde automáticamente en `settings.json` y se restaure al reopen la aplicación.

### Uso del hook

```typescript
import { useToolState } from '../hooks/useToolState';

interface MiHerramientaState {
  input: string;
  options: string;
}

const initialState: MiHerramientaState = {
  input: '',
  options: 'default',
};

export function MiHerramientaPage() {
  const [state, setState, clearState] = useToolState('mi-herramienta', initialState);

  // state contiene el estado actual
  // setState(actualizador) para actualizar
  // clearState() para borrar y resetear

  return (
    <>
      <Button onClick={clearState}>Clear</Button>
    </>
  );
}
```

### Valor de retorno expandido

El hook devuelve 4 valores:

```typescript
const [state, setState, clearState, meta] = useToolState('mi-herramienta', initialState);

// meta contiene:
// meta.isSaving - boolean, true durante el guardado
// meta.lastSavedAt - timestamp del último guardado
// meta.autoSaveEnabled - boolean, estado actual del autosave local
// meta.setLocalAutoSave - función para activar/desactivar autosave local
```

### Opciones del hook

```typescript
const [state, setState, clearState, meta] = useToolState('mi-herramienta', initialState, {
  debounceMs: 500,    // Delay antes de guardar (default: 500)
  autoSave: true,     // Activar autosave (default: true)
});
```

### Características del hook:

- **Auto-guardado**: Guarda automáticamente con debounce de 500ms
- **Persistencia**: Guarda en `settings.json` (disponible en Electron)
- **Clear**: El botón Clear es **obligatorio** en todas las tools (usar `ToolClearButton`)
- **Test-friendly**: Funciona sin Electron en tests (no guarda nada)
- **Save status**: Expone `isSaving` y `lastSavedAt` para indicador de estado
- **Auto-save control**: Controles global (`AutosaveSettingsContext`) y local por tool

### Cómo actualizar el estado

```typescript
// Reemplazo completo
setState({ input: "nuevo valor" });

// Actualización parcial
setState((prev) => ({ ...prev, input: "nuevo valor" }));
```

## Testing (Obligatorio)

Cada herramienta debe incluir tests en `src/tests/pages/`.

### Scripts disponibles

```bash
npm run test        # Ejecutar tests en watch mode
npm run test:run   # Ejecutar tests una vez
npm run test:coverage # Ejecutar con coverage
```

### Estructura de tests

```typescript
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MiHerramientaPage } from "../../pages/mi-herramienta";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      input: '',
      options: 'default',
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: vi.fn((props) => (
    <textarea data-testid="codemirror" {...props} />
  )),
}));

vi.mock("@uiw/codemirror-themes-all", () => ({}));

describe("MiHerramientaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<MiHerramientaPage />);
    expect(screen.getByText("Mi Herramienta")).toBeDefined();
  });

  it("renders required buttons", () => {
    render(<MiHerramientaPage />);
    expect(screen.getByText("Generate")).toBeDefined();
    expect(screen.getByText("Clear")).toBeDefined();
  });

  // Agregar más tests según funcionalidad
});
```

### Requisitos mínimos de tests:

- ✅ Renderizado correcto del título y descripción
- ✅ Botones presentes (Generate, Sample, Clear)
- ✅ Funcionalidad principal (generación/output)
- ✅ Botón Clear funciona correctamente

## Documentación de Usuario (Obligatorio)

Cada herramienta debe incluir un comentario de documentación en **INGLÉS** al inicio del archivo, explicando:

- **Qué hace la herramienta** (descripción general)
- **Todas sus funcionalidades** (lista completa de features)
- **Cómo usarla** (guía de uso básica)

Este comentario es para usuarios que quieren entender la herramienta sin ver código técnico.

### Ejemplo de documentación

```typescript
/**
 * JWT Builder
 *
 * Creates and signs JSON Web Tokens (JWT) for authentication and authorization.
 *
 * Features:
 * - Support for HS256, HS384, and HS512 signing algorithms
 * - Customizable payload claims with string, number, and boolean types
 * - Pre-built buttons for standard JWT claims (exp, nbf, iat, jti)
 * - Secret key visibility toggle
 * - Real-time token generation
 * - Decoded header and payload preview
 * - Copy buttons for easy export
 *
 * How to use:
 * 1. Select the signing algorithm (HS256 recommended)
 * 2. Enter a secret key (minimum 32 characters for HS256)
 * 3. Add or modify claims as needed
 * 4. Click "Generate Token" to create the JWT
 * 5. Use copy buttons to export the token or decoded parts
 */
```

## Metadata unificada de tools

Cada herramienta tiene metadata extendida en `src/utils/tools-metadata.ts`. Este registro unifica descripciones, features y usage para:

- Mostrar descripciones en la UI
- Generación de screenshots con contexto
- API de consulta unificada

### Agregar metadata de tu nueva tool

Edita `src/utils/tools-metadata.ts` y agrega una entrada en `metadataMap`:

```typescript
"mi-herramienta": {
  longDescription: "Descripción larga de lo que hace la herramienta...",
  features: ["Feature 1", "Feature 2", "Feature 3"],
  usage: ["Paso 1", "Paso 2", "Paso 3", "Paso 4"],
},
```

### Hook de acceso

```typescript
import { useToolMetadata, useAllToolsMetadata, useAllToolsWithMetadata } from '../hooks/useToolMetadata';

// Una tool específica
const metadata = useToolMetadata('mi-herramienta');
// metadata.title, metadata.shortDescription, metadata.longDescription, metadata.features, metadata.usage

// Todas las tools
const allMeta = useAllToolsMetadata();

// Tools con metadata enriquecida
const toolsWithMeta = useAllToolsWithMetadata();
```

## Ejemplo mínimo

```typescript
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
} from '../components/tool-page-layout';
import { useToolState } from '../hooks/useToolState';

interface MiHerramientaState {
  input: string;
}

const initialState: MiHerramientaState = {
  input: '',
};

export function MiHerramientaPage() {
  const [state, setState, clearState] = useToolState('mi-herramienta', initialState);
  const [output, setOutput] = React.useState('');

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Mi Herramienta"
        description="Descripción breve de la herramienta"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleSample}>Sample</Button>
              <ToolClearButton onClear={clearState} />
            </>
          }
        >
          <AppCodeMirror
            value={state.input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            onChange={(value) => setState(prev => ({ ...prev, input: value }))}
            placeholder="Ingrese algo"
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output"
          actions={<ToolCopyButton value={output} />}
        >
          <AppCodeMirror
            value={output}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            editable={false}
          />
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
```

## Checklist antes de commit

- [ ] Página creada en `src/pages/` con componentes de layout compartidos
- [ ] Ruta agregada en `app.tsx`
- [ ] Tool registrada en `tools-data.ts`
- [ ] Metadata agregada en `tools-metadata.ts`
- [ ] `ToolPageContainer` usado como wrapper raíz (provee ScrollArea)
- [ ] `ToolPageHeader` con título y descripción
- [ ] `ToolCopyButton` para botones de copiar (con toast de Windows)
- [ ] `ToolClearButton` para botón de limpiar
- [ ] Hook `useToolState` implementado con persistencia
- [ ] Documentación JSDoc en inglés al inicio del archivo
- [ ] Tests creados en `src/tests/pages/`
- [ ] Tests pasan (`npm run test:run`)
