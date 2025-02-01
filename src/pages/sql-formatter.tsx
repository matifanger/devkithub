import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { format } from 'sql-formatter';
import { Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Switch } from "../components/ui/switch";
import { EditorView } from '@codemirror/view';

interface FormatterConfig {
  language: 'sql' | 'bigquery' | 'db2' | 'db2i' | 'hive' | 'mariadb' | 'mysql' | 'n1ql' | 'plsql' | 'postgresql' | 'redshift' | 'singlestoredb' | 'snowflake' | 'spark' | 'sqlite' | 'tidb' | 'transactsql' | 'trino' | 'tsql';
  tabWidth: number;
  useTabs: boolean;
  keywordCase: 'upper' | 'lower' | 'preserve';
  dataTypeCase: 'upper' | 'lower' | 'preserve';
  functionCase: 'upper' | 'lower' | 'preserve';
  identifierCase: 'upper' | 'lower' | 'preserve';
  indentStyle: 'standard' | 'tabularLeft' | 'tabularRight';
  linesBetweenQueries: number;
}

type ConfigValue<K extends keyof FormatterConfig> = FormatterConfig[K];

export function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<FormatterConfig>({
    language: 'sql',
    tabWidth: 2,
    useTabs: false,
    keywordCase: 'upper',
    dataTypeCase: 'preserve',
    functionCase: 'preserve',
    identifierCase: 'preserve',
    indentStyle: 'standard',
    linesBetweenQueries: 1
  });

  const formatSql = useCallback((sql: string, newConfig = config) => {
    try {
      if (!sql.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const formatted = format(sql, {
        language: newConfig.language,
        tabWidth: newConfig.tabWidth,
        useTabs: newConfig.useTabs,
        keywordCase: newConfig.keywordCase,
        dataTypeCase: newConfig.dataTypeCase,
        functionCase: newConfig.functionCase,
        identifierCase: newConfig.identifierCase,
        indentStyle: newConfig.indentStyle,
        linesBetweenQueries: newConfig.linesBetweenQueries,
      });

      setOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid SQL');
      setOutput('');
    }
  }, [config]);

  const handleSample = () => {
    const sample = `SELECT u.id, u.name, u.email, COUNT(o.id) as total_orders, SUM(o.amount) as total_amount 
FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
GROUP BY u.id, u.name, u.email HAVING total_orders > 0 ORDER BY total_amount DESC LIMIT 10;`;
    setInput(sample);
    formatSql(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      formatSql(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updateConfig = <K extends keyof FormatterConfig>(key: K, value: ConfigValue<K>) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (input) formatSql(input, newConfig);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">SQL Formatter</h1>
        <p className="text-muted-foreground">Format and beautify SQL queries with customizable options</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Input SQL</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Formatting Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure SQL formatting options
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>SQL Dialect</Label>
                        <div className="col-span-2">
                          <Select value={config.language} onValueChange={(value) => updateConfig('language', value as FormatterConfig['language'])}>
                            <SelectTrigger>
                              <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sql">Standard SQL</SelectItem>
                              <SelectItem value="mysql">MySQL</SelectItem>
                              <SelectItem value="postgresql">PostgreSQL</SelectItem>
                              <SelectItem value="tsql">T-SQL</SelectItem>
                              <SelectItem value="plsql">PL/SQL</SelectItem>
                              <SelectItem value="mariadb">MariaDB</SelectItem>
                              <SelectItem value="sqlite">SQLite</SelectItem>
                              <SelectItem value="bigquery">BigQuery</SelectItem>
                              <SelectItem value="db2">DB2</SelectItem>
                              <SelectItem value="db2i">DB2i</SelectItem>
                              <SelectItem value="hive">Hive</SelectItem>
                              <SelectItem value="n1ql">N1QL</SelectItem>
                              <SelectItem value="redshift">Redshift</SelectItem>
                              <SelectItem value="singlestoredb">SingleStore</SelectItem>
                              <SelectItem value="snowflake">Snowflake</SelectItem>
                              <SelectItem value="spark">Spark SQL</SelectItem>
                              <SelectItem value="tidb">TiDB</SelectItem>
                              <SelectItem value="transactsql">Transact-SQL</SelectItem>
                              <SelectItem value="trino">Trino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Indent Width</Label>
                        <div className="col-span-2">
                          <Select value={config.tabWidth.toString()} onValueChange={(value) => updateConfig('tabWidth', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tab Width" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 spaces</SelectItem>
                              <SelectItem value="4">4 spaces</SelectItem>
                              <SelectItem value="8">8 spaces</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Keyword Case</Label>
                        <div className="col-span-2">
                          <Select value={config.keywordCase} onValueChange={(value: 'upper' | 'lower' | 'preserve') => updateConfig('keywordCase', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Keyword Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upper">UPPER CASE</SelectItem>
                              <SelectItem value="lower">lower case</SelectItem>
                              <SelectItem value="preserve">Preserve Case</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Data Type Case</Label>
                        <div className="col-span-2">
                          <Select value={config.dataTypeCase} onValueChange={(value: 'upper' | 'lower' | 'preserve') => updateConfig('dataTypeCase', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Data Type Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upper">UPPER CASE</SelectItem>
                              <SelectItem value="lower">lower case</SelectItem>
                              <SelectItem value="preserve">Preserve Case</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Function Case</Label>
                        <div className="col-span-2">
                          <Select value={config.functionCase} onValueChange={(value: 'upper' | 'lower' | 'preserve') => updateConfig('functionCase', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Function Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upper">UPPER CASE</SelectItem>
                              <SelectItem value="lower">lower case</SelectItem>
                              <SelectItem value="preserve">Preserve Case</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Identifier Case</Label>
                        <div className="col-span-2">
                          <Select value={config.identifierCase} onValueChange={(value: 'upper' | 'lower' | 'preserve') => updateConfig('identifierCase', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Identifier Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upper">UPPER CASE</SelectItem>
                              <SelectItem value="lower">lower case</SelectItem>
                              <SelectItem value="preserve">Preserve Case</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Indent Style</Label>
                        <div className="col-span-2">
                          <Select value={config.indentStyle} onValueChange={(value: 'standard' | 'tabularLeft' | 'tabularRight') => updateConfig('indentStyle', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Indent Style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="tabularLeft">Tabular (Left)</SelectItem>
                              <SelectItem value="tabularRight">Tabular (Right)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Lines Between Queries</Label>
                        <div className="col-span-2">
                          <Select value={config.linesBetweenQueries.toString()} onValueChange={(value) => updateConfig('linesBetweenQueries', parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Lines Between" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 line</SelectItem>
                              <SelectItem value="2">2 lines</SelectItem>
                              <SelectItem value="3">3 lines</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Use Tabs Instead of Spaces</Label>
                        <Switch
                          checked={config.useTabs}
                          onCheckedChange={(checked) => updateConfig('useTabs', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={() => {
                setInput('');
                setOutput('');
                setError('');
              }}>
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              theme={oneDark}
              extensions={[
                sql(),
                EditorView.lineWrapping
              ]}
              onChange={(value) => {
                setInput(value);
                formatSql(value);
              }}
              placeholder="Paste your SQL query here"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Formatted SQL</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>
          
          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
                theme={oneDark}
                extensions={[
                  sql(),
                  EditorView.lineWrapping
                ]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 