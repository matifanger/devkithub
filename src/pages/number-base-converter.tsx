import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

type NumberBase = 2 | 8 | 10 | 16 | number;

interface ConverterFieldProps {
  value: string;
  base: NumberBase;
  label: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  onCopy: () => void;
  onClear: () => void;
  showSelector?: boolean;
  onBaseChange?: (base: string) => void;
  currentBase?: string;
}

const ConverterField = React.memo(({
  value,
  base,
  label,
  onChange,
  onPaste,
  onCopy,
  onClear,
  showSelector = false,
  onBaseChange,
  currentBase
}: ConverterFieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Label>Base {base} ({label})</Label>
        {showSelector && (
          <Select value={currentBase} onValueChange={onBaseChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select base" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 35 }, (_, i) => i + 2).map(base => (
                <SelectItem key={base} value={base.toString()}>
                  Base {base}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-x-2">
        <Button variant="outline" size="sm" onClick={onPaste}>
          Clipboard
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy}>
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder={`Enter ${label.toLowerCase()} number`}
      className="font-mono"
    />
  </div>
));

export function NumberBaseConverterPage() {
  const [currentBase, setCurrentBase] = useState('36');
  const [values, setValues] = useState({
    binary: '',
    octal: '',
    decimal: '',
    hex: '',
    custom: ''
  });
  const prevBaseRef = useRef(currentBase);

  const validateInput = useCallback((value: string, base: NumberBase) => {
    const validChars = Array.from({ length: base }, (_, i) => {
      if (i < 10) return i.toString();
      return String.fromCharCode(55 + i);
    });
    return value === '' || value.split('').every(c => validChars.includes(c.toUpperCase()));
  }, []);

  const convertAll = useCallback((sourceValue: string, fromBase: number) => {
    if (!sourceValue) return { binary: '', octal: '', decimal: '', hex: '', custom: '' };
    
    const decimalValue = parseInt(sourceValue, fromBase);
    if (isNaN(decimalValue)) return null;

    return {
      binary: decimalValue.toString(2),
      octal: decimalValue.toString(8),
      decimal: decimalValue.toString(10),
      hex: decimalValue.toString(16).toUpperCase(),
      custom: decimalValue.toString(Number(currentBase)).toUpperCase()
    };
  }, [currentBase]);

  // Actualizar todos los valores cuando cambia la base
  useEffect(() => {
    if (prevBaseRef.current !== currentBase && values.custom) {
      const previousBase = parseInt(prevBaseRef.current);
      const results = convertAll(values.custom, previousBase);
      
      if (results) {
        setValues(prev => ({
          ...results,
          custom: prev.custom // Mantener el valor original para reconvertir
        }));
      }
    }
    prevBaseRef.current = currentBase;
  }, [currentBase, values.custom, convertAll]);

  const handleValueChange = useCallback((base: NumberBase) => 
    (newValue: string) => {
      if (!validateInput(newValue, base)) return;
      
      const results = convertAll(newValue, base as number);
      setValues(prev => ({
        ...prev,
        ...(results || {}),
        [baseKeyMap[base as number]]: newValue
      }));
    }, [convertAll, validateInput]);

  const handlePaste = useCallback(async (base: NumberBase, setter: (value: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (validateInput(text, base)) setter(text);
    } catch (error) {
      console.error('Failed to read clipboard');
    }
  }, [validateInput]);

  const baseKeyMap = useMemo(() => ({
    2: 'binary',
    8: 'octal',
    10: 'decimal',
    16: 'hex',
    [Number(currentBase)]: 'custom'
  }), [currentBase]);

  const fields = useMemo(() => [
    { base: 2, label: 'Binary', key: 'binary' },
    { base: 8, label: 'Octal', key: 'octal' },
    { base: 10, label: 'Decimal', key: 'decimal' },
    { base: 16, label: 'Hexadecimal', key: 'hex' },
    { 
      base: Number(currentBase), 
      label: `Custom Base`, 
      key: 'custom',
      showSelector: true 
    }
  ], [currentBase]);

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Universal Base Converter</h1>
        <p className="text-muted-foreground">
          Enter your number in any of the text fields. The other fields will automatically update.
        </p>
      </div>

      <div className="space-y-6">
        {fields.map(({ base, label, key, showSelector }) => (
          <ConverterField
            key={key}
            value={values[key as keyof typeof values]}
            base={base}
            label={label}
            onChange={handleValueChange(base)}
            onPaste={() => handlePaste(base, (v) => handleValueChange(base)(v))}
            onCopy={() => navigator.clipboard.writeText(values[key as keyof typeof values])}
            onClear={() => setValues({ binary: '', octal: '', decimal: '', hex: '', custom: '' })}
            showSelector={showSelector}
            onBaseChange={setCurrentBase}
            currentBase={currentBase}
          />
        ))}
      </div>
    </div>
  );
}