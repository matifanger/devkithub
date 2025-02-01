import React, { useState, useCallback, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { RefreshCw } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";

type DataType = 
  | 'person'
  | 'address'
  | 'company'
  | 'product'
  | 'finance'
  | 'internet'
  | 'datetime';

interface DataField {
  name: string;
  type: string;
  format?: string;
  min?: number;
  max?: number;
  options?: string[];
  pattern?: string;
}

interface GeneratorConfig {
  dataType: DataType;
  count: number;
  seed: string;
  format: 'json' | 'csv' | 'sql' | 'xml';
  locale: string;
  fields: DataField[];
  includeId: boolean;
  idField: string;
  idType: 'number' | 'uuid' | 'custom';
  customIdPattern: string;
  nullProbability: number;
  uniqueValues: boolean;
  tableName: string;
  schemaName: string;
  useFaker: boolean;
  customTemplate: string;
}

const FIELD_TEMPLATES = {
  person: [
    { name: 'firstName', type: 'firstName' },
    { name: 'lastName', type: 'lastName' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'phone' },
    { name: 'gender', type: 'gender' },
    { name: 'dateOfBirth', type: 'date', format: 'YYYY-MM-DD' },
    { name: 'ssn', type: 'ssn' },
    { name: 'avatar', type: 'avatar' },
  ],
  address: [
    { name: 'street', type: 'streetAddress' },
    { name: 'city', type: 'city' },
    { name: 'state', type: 'state' },
    { name: 'country', type: 'country' },
    { name: 'zipCode', type: 'zipCode' },
    { name: 'latitude', type: 'latitude' },
    { name: 'longitude', type: 'longitude' },
  ],
  company: [
    { name: 'name', type: 'companyName' },
    { name: 'catchPhrase', type: 'catchPhrase' },
    { name: 'industry', type: 'industry' },
    { name: 'type', type: 'companyType' },
    { name: 'ein', type: 'ein' },
    { name: 'logo', type: 'companyLogo' },
  ],
  product: [
    { name: 'name', type: 'productName' },
    { name: 'description', type: 'productDescription' },
    { name: 'price', type: 'price', min: 0, max: 1000 },
    { name: 'category', type: 'productCategory' },
    { name: 'color', type: 'color' },
    { name: 'material', type: 'material' },
    { name: 'sku', type: 'sku' },
    { name: 'image', type: 'productImage' },
  ],
  finance: [
    { name: 'accountNumber', type: 'accountNumber' },
    { name: 'accountType', type: 'accountType' },
    { name: 'amount', type: 'amount', min: 0, max: 10000 },
    { name: 'currency', type: 'currency' },
    { name: 'creditCard', type: 'creditCard' },
    { name: 'iban', type: 'iban' },
    { name: 'bic', type: 'bic' },
  ],
  internet: [
    { name: 'username', type: 'username' },
    { name: 'password', type: 'password' },
    { name: 'email', type: 'email' },
    { name: 'domain', type: 'domain' },
    { name: 'url', type: 'url' },
    { name: 'ipv4', type: 'ipv4' },
    { name: 'ipv6', type: 'ipv6' },
    { name: 'userAgent', type: 'userAgent' },
  ],
  datetime: [
    { name: 'date', type: 'date', format: 'YYYY-MM-DD' },
    { name: 'time', type: 'time', format: 'HH:mm:ss' },
    { name: 'datetime', type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss' },
    { name: 'timestamp', type: 'timestamp' },
    { name: 'timezone', type: 'timezone' },
  ],
};

const DEFAULT_CONFIG: GeneratorConfig = {
  dataType: 'person',
  count: 10,
  seed: '',
  format: 'json',
  locale: 'en',
  fields: FIELD_TEMPLATES.person,
  includeId: true,
  idField: 'id',
  idType: 'number',
  customIdPattern: '',
  nullProbability: 0,
  uniqueValues: true,
  tableName: 'dummy_data',
  schemaName: 'public',
  useFaker: true,
  customTemplate: '',
};

export function DummyDataGeneratorPage() {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);

  const generateFieldValue = (field: DataField) => {
    if (Math.random() * 100 < config.nullProbability) {
      return null;
    }

    switch (field.type) {
      // Person
      case 'firstName': return faker.person.firstName();
      case 'lastName': return faker.person.lastName();
      case 'email': return faker.internet.email();
      case 'phone': return faker.phone.number();
      case 'gender': return faker.person.sex();
      case 'date': return faker.date.past().toISOString().split('T')[0];
      case 'ssn': return faker.string.numeric(9);
      case 'avatar': return faker.image.avatar();

      // Address
      case 'streetAddress': return faker.location.streetAddress();
      case 'city': return faker.location.city();
      case 'state': return faker.location.state();
      case 'country': return faker.location.country();
      case 'zipCode': return faker.location.zipCode();
      case 'latitude': return faker.location.latitude();
      case 'longitude': return faker.location.longitude();

      // Company
      case 'companyName': return faker.company.name();
      case 'catchPhrase': return faker.company.catchPhrase();
      case 'industry': return faker.company.buzzPhrase();
      case 'companyType': return faker.company.buzzNoun();
      case 'ein': return faker.string.numeric(9);
      case 'companyLogo': return faker.image.urlLoremFlickr({ category: 'business' });

      // Product
      case 'productName': return faker.commerce.productName();
      case 'productDescription': return faker.commerce.productDescription();
      case 'price': return faker.commerce.price();
      case 'productCategory': return faker.commerce.department();
      case 'color': return faker.color.human();
      case 'material': return faker.commerce.productMaterial();
      case 'sku': return faker.string.alphanumeric(8).toUpperCase();
      case 'productImage': return faker.image.urlLoremFlickr({ category: 'product' });

      // Finance
      case 'accountNumber': return faker.finance.accountNumber();
      case 'accountType': return faker.finance.accountName();
      case 'amount': return faker.finance.amount();
      case 'currency': return faker.finance.currencyCode();
      case 'creditCard': return faker.finance.creditCardNumber();
      case 'iban': return faker.finance.iban();
      case 'bic': return faker.finance.bic();

      // Internet
      case 'username': return faker.internet.userName();
      case 'password': return faker.internet.password();
      case 'domain': return faker.internet.domainName();
      case 'url': return faker.internet.url();
      case 'ipv4': return faker.internet.ipv4();
      case 'ipv6': return faker.internet.ipv6();
      case 'userAgent': return faker.internet.userAgent();

      // DateTime
      case 'time': return faker.date.recent().toISOString().split('T')[1].split('.')[0];
      case 'datetime': return faker.date.recent().toISOString();
      case 'timestamp': return faker.date.recent().getTime();
      case 'timezone': return faker.location.timeZone();

      default: return `Sample ${field.type}`;
    }
  };

  const generateData = useCallback(() => {
    try {
      if (config.seed) {
        // Create a consistent seed number
        const seedStr = String(config.seed);
        const seedNum = seedStr.split('').reduce((acc, char, i) => 
          acc + char.charCodeAt(0) * Math.pow(31, seedStr.length - i - 1), 0);
        faker.seed(Math.abs(seedNum));
      } else {
        faker.seed(); // Reset seed if none provided
      }

      const data: Record<string, unknown>[] = [];
      const uniqueValues: Map<string, Set<unknown>> = new Map();

      for (let i = 0; i < config.count; i++) {
        const item: Record<string, unknown> = {};
        
        // Generate ID if configured
        if (config.includeId) {
          switch (config.idType) {
            case 'number':
              item[config.idField] = i + 1;
              break;
            case 'uuid':
              item[config.idField] = faker.string.uuid();
              break;
            case 'custom':
              item[config.idField] = faker.helpers.replaceSymbols(config.customIdPattern);
              break;
          }
        }

        // Generate field values
        for (const field of config.fields) {
          let value: unknown;
          let attempts = 0;
          const maxAttempts = 100;

          do {
            value = generateFieldValue(field);
            attempts++;
          } while (
            config.uniqueValues &&
            uniqueValues.get(field.name)?.has(value) &&
            attempts < maxAttempts
          );

          if (config.uniqueValues) {
            if (!uniqueValues.has(field.name)) {
              uniqueValues.set(field.name, new Set());
            }
            uniqueValues.get(field.name)?.add(value);
          }

          item[field.name] = value;
        }

        data.push(item);
      }

      // Format output based on selected format
      let formattedOutput = '';
      switch (config.format) {
        case 'json':
          formattedOutput = JSON.stringify(data, null, 2);
          break;
        case 'csv': {
          const headers = Object.keys(data[0]);
          formattedOutput = [
            headers.join(','),
            ...data.map(row => 
              headers.map(header => 
                JSON.stringify(row[header] ?? '')
              ).join(',')
            )
          ].join('\n');
          break;
        }
        case 'sql': {
          const columns = Object.keys(data[0]);
          formattedOutput = [
            `INSERT INTO ${config.schemaName}.${config.tableName}`,
            `(${columns.join(', ')})`,
            'VALUES',
            data.map(row => 
              `(${columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'number') return value;
                return `'${String(value).replace(/'/g, "''")}'`;
              }).join(', ')})`
            ).join(',\n'),
            ';'
          ].join('\n');
          break;
        }
        case 'xml':
          formattedOutput = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<root>',
            ...data.map(item => [
              '  <item>',
              ...Object.entries(item).map(([key, value]) => 
                `    <${key}>${
                  value === null ? '' : String(value).replace(/[<>&]/g, c => ({
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;'
                  })[c] || c)
                }</${key}>`
              ),
              '  </item>'
            ].join('\n')),
            '</root>'
          ].join('\n');
          break;
      }

      setOutput(formattedOutput);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate data');
      setOutput('');
    }
  }, [config]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  // Auto-generate on config changes
  useEffect(() => {
    generateData();
  }, [config, generateData]);

  // Remove initial generation since it will be handled by the config effect
  useEffect(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleDataTypeChange = (dataType: DataType) => {
    setConfig(prev => ({
      ...prev,
      dataType,
      fields: FIELD_TEMPLATES[dataType] || [],
    }));
  };

  const updateConfig = <K extends keyof GeneratorConfig>(key: K, value: GeneratorConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dummy Data Generator</h1>
        <p className="text-muted-foreground">Generate realistic dummy data for testing and development</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 overflow-y-auto h-[calc(100vh-12rem)]">
          <div className="flex items-center justify-between">
            <Label>Configuration</Label>
            <Button variant="outline" onClick={generateData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Data Type</Label>
              <div className="col-span-2">
                <Select value={config.dataType} onValueChange={(value: DataType) => handleDataTypeChange(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Data Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="datetime">Date/Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Count</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.count]}
                  min={1}
                  max={1000}
                  step={1}
                  onValueChange={([value]) => updateConfig('count', value)}
                />
                <span className="text-sm text-muted-foreground">{config.count} records</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Format</Label>
              <div className="col-span-2">
                <Select value={config.format} onValueChange={(value: 'json' | 'csv' | 'sql' | 'xml') => updateConfig('format', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Locale</Label>
              <div className="col-span-2">
                <Select value={config.locale} onValueChange={(value) => updateConfig('locale', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Locale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Include ID Field</Label>
              <Switch
                checked={config.includeId}
                onCheckedChange={(checked) => updateConfig('includeId', checked)}
              />
            </div>

            {config.includeId && (
              <>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>ID Field Name</Label>
                  <Input
                    className="col-span-2"
                    value={config.idField}
                    onChange={(e) => updateConfig('idField', e.target.value)}
                    placeholder="id"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>ID Type</Label>
                  <div className="col-span-2">
                    <Select value={config.idType} onValueChange={(value: 'number' | 'uuid' | 'custom') => updateConfig('idType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="uuid">UUID</SelectItem>
                        <SelectItem value="custom">Custom Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {config.idType === 'custom' && (
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Custom ID Pattern</Label>
                    <Input
                      className="col-span-2"
                      value={config.customIdPattern}
                      onChange={(e) => updateConfig('customIdPattern', e.target.value)}
                      placeholder="PREFIX-{####}"
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Null Probability</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.nullProbability]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => updateConfig('nullProbability', value)}
                />
                <span className="text-sm text-muted-foreground">{config.nullProbability}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Ensure Unique Values</Label>
              <Switch
                checked={config.uniqueValues}
                onCheckedChange={(checked) => updateConfig('uniqueValues', checked)}
              />
            </div>

            {config.format === 'sql' && (
              <>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Table Name</Label>
                  <Input
                    className="col-span-2"
                    value={config.tableName}
                    onChange={(e) => updateConfig('tableName', e.target.value)}
                    placeholder="dummy_data"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Schema Name</Label>
                  <Input
                    className="col-span-2"
                    value={config.schemaName}
                    onChange={(e) => updateConfig('schemaName', e.target.value)}
                    placeholder="public"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Seed (optional)</Label>
              <Input
                className="col-span-2"
                value={config.seed}
                onChange={(e) => updateConfig('seed', e.target.value)}
                placeholder="Enter a number for reproducible results"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Output</Label>
            <Button variant="outline" onClick={copyOutput}>
              Copy
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={output}
              className='h-[calc(100vh-17rem)]'
              height="100%"
              theme={oneDark}
              extensions={[EditorView.lineWrapping]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 