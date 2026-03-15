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
- Usar los componentes UI de `src/components/ui/`
- Incluir el layout básico con `<div className="container mx-auto p-6 space-y-6">`

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

## Componentes UI disponibles

Ver `src/components/ui/`:

- `Button` - Botones
- `Card` - Tarjetas
- `Input` - Campos de texto
- `Label` - Etiquetas
- `Textarea` - Áreas de texto
- `Select/SelectContent/SelectItem/SelectTrigger/SelectValue` - Selectores
- `CopyButton` - Botón de copiar
- `AppCodeMirror` - Editor de código
- `Checkbox`, `Switch`, `Slider` - Controles de formulario

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

### Características del hook:

- **Auto-guardado**: Guarda automáticamente con debounce de 500ms
- **Persistencia**: Guarda en `settings.json` (disponible en Electron)
- **Clear**: El botón Clear es **obligatorio** en todas las tools
- **Test-friendly**: Funciona sin Electron en tests (no guarda nada)

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

## Ejemplo mínimo

```typescript
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToolState } from '../hooks/useToolState';

interface MiHerramientaState {
  input: string;
}

const initialState: MiHerramientaState = {
  input: '',
};

export function MiHerramientaPage() {
  const [state, setState, clearState] = useToolState('mi-herramienta', initialState);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Mi Herramienta</h1>
        <p className="text-muted-foreground">Descripción</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <Label>Input</Label>
          <Input
            value={state.input}
            onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
            placeholder="Ingrese algo"
          />
        </div>
        <div className="flex gap-2">
          <Button>Accionar</Button>
          <Button variant="outline" onClick={clearState}>Clear</Button>
        </div>
      </Card>
    </div>
  );
}
```

## Checklist antes de commit

- [ ] Página creada en `src/pages/`
- [ ] Ruta agregada en `app.tsx`
- [ ] Tool registrada en `tools-data.ts`
- [ ] Hook `useToolState` implementado
- [ ] Botón Clear implementado
- [ ] Tests creados en `src/tests/pages/`
- [ ] Tests pasan (`npm run test:run`)
