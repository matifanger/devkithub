import { javascript } from '@codemirror/lang-javascript';
import React, { useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CopyButton } from '../components/ui/copy-button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface CronFields {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export function CronJobParserPage() {
  const [cronExpression, setCronExpression] = useState('* * * * *');
  const [parsedResult, setParsedResult] = useState('');
  const [nextExecutions, setNextExecutions] = useState<string[]>([]);
  const [fields, setFields] = useState<CronFields>({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  });

  const parseField = (field: string): string => {
    if (field === '*') return 'every value';
    if (field.includes('/')) {
      const [, step] = field.split('/');
      return `every ${step} value(s)`;
    }
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return `from ${start} to ${end}`;
    }
    if (field.includes(',')) {
      return `at ${field.split(',').join(' and ')}`;
    }
    return `at ${field}`;
  };

  const calculateNextExecutions = (expression: string): string[] => {
    const now = new Date();
    const executions: string[] = [];
    const [minute] = expression.split(' ');

    // Simple implementation for common patterns
    let nextDate = new Date(now);
    for (let i = 0; i < 5; i++) {
      if (minute === '*') nextDate.setMinutes(nextDate.getMinutes() + 1);
      else if (minute.includes('/')) {
        const step = parseInt(minute.split('/')[1]);
        nextDate.setMinutes(nextDate.getMinutes() + step);
      } else nextDate.setMinutes(parseInt(minute));

      executions.push(nextDate.toLocaleString());
      nextDate = new Date(nextDate);
    }

    return executions;
  };

  const parseCronExpression = (expression: string) => {
    try {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = expression.split(' ');

      if (expression.split(' ').length !== 5) {
        throw new Error('Invalid cron expression format');
      }

      setFields({
        minute,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
      });

      let result = 'Schedule breakdown:\n';
      result += `Minutes: ${parseField(minute)}\n`;
      result += `Hours: ${parseField(hour)}\n`;
      result += `Day of Month: ${parseField(dayOfMonth)}\n`;
      result += `Month: ${parseField(month)}\n`;
      result += `Day of Week: ${parseField(dayOfWeek)}`;

      setParsedResult(result);
      setNextExecutions(calculateNextExecutions(expression));
    } catch (error) {
      setParsedResult('Invalid cron expression');
      setNextExecutions([]);
    }
  };

  useEffect(() => {
    parseCronExpression(cronExpression);
  }, [cronExpression]);

  const cronPresets = [
    { expression: '* * * * *', description: 'Every minute' },
    { expression: '0 * * * *', description: 'Every hour' },
    { expression: '0 0 * * *', description: 'Every day at midnight' },
    { expression: '0 0 * * 0', description: 'Every Sunday at midnight' },
    { expression: '*/15 * * * *', description: 'Every 15 minutes' },
    { expression: '0 0 1 * *', description: 'First day of every month' },
  ];

  const codeExample = `// Node.js Cron Job Example
const cron = require('node-cron');

// ${parsedResult.split('\n')[0]}
cron.schedule('${cronExpression}', () => {
  console.log('Running cron job...');
});

// Next 5 executions:
${nextExecutions.map((exec) => `// ${exec}`).join('\n')}`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Cron Job Parser</h1>
        <p className="text-muted-foreground">
          Parse and understand cron expressions with a clear breakdown and the next execution times
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Cron Expression</Label>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.readText().then(setCronExpression)}
              >
                Paste
              </Button>
              <Button variant="outline" onClick={() => setCronExpression('* * * * *')}>
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(cronExpression)}
              >
                Copy
              </Button>
            </div>
          </div>

          <Input
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="* * * * *"
            className="font-mono"
          />

          {cronExpression.trim().split(' ').length !== 5 && (
            <div className="text-sm text-destructive">
              Invalid cron expression: expected 5 fields (minute hour day-of-month month
              day-of-week)
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Minutes ({fields.minute})</Label>
              <div className="flex gap-2">
                <Input
                  value={`Minutes: ${parseField(fields.minute)}`}
                  readOnly
                  className="font-mono bg-muted flex-1"
                />
                <CopyButton value={fields.minute} src="minute" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hours ({fields.hour})</Label>
              <div className="flex gap-2">
                <Input
                  value={`Hours: ${parseField(fields.hour)}`}
                  readOnly
                  className="font-mono bg-muted flex-1"
                />
                <CopyButton value={fields.hour} src="hour" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Day of Month ({fields.dayOfMonth})</Label>
              <div className="flex gap-2">
                <Input
                  value={`Day of Month: ${parseField(fields.dayOfMonth)}`}
                  readOnly
                  className="font-mono bg-muted flex-1"
                />
                <CopyButton value={fields.dayOfMonth} src="day-of-month" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Month ({fields.month})</Label>
              <div className="flex gap-2">
                <Input
                  value={`Month: ${parseField(fields.month)}`}
                  readOnly
                  className="font-mono bg-muted flex-1"
                />
                <CopyButton value={fields.month} src="month" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Day of Week ({fields.dayOfWeek})</Label>
              <div className="flex gap-2">
                <Input
                  value={`Day of Week: ${parseField(fields.dayOfWeek)}`}
                  readOnly
                  className="font-mono bg-muted flex-1"
                />
                <CopyButton value={fields.dayOfWeek} src="day-of-week" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="next">
            <TabsList className="w-full">
              <TabsTrigger value="next" className="flex-1">
                Next Executions
              </TabsTrigger>
              <TabsTrigger value="code" className="flex-1">
                Code Example
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex-1">
                Presets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="next">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Next 5 Executions</h3>
                <div className="space-y-2">
                  {nextExecutions.map((execution, index) => (
                    <div key={index} className="p-2 bg-muted rounded-lg font-mono text-sm">
                      {execution}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card className="p-4">
                <AppCodeMirror
                  value={codeExample}
                  height="240px"
                  className="text-sm"
                  extensions={[javascript()]}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: false,
                  }}
                />
              </Card>
            </TabsContent>

            <TabsContent value="presets">
              <Card className="p-4">
                <div className="grid gap-2">
                  {cronPresets.map((preset) => (
                    <Button
                      key={preset.expression}
                      variant="outline"
                      className="w-full justify-start font-mono"
                      onClick={() => setCronExpression(preset.expression)}
                    >
                      {preset.expression} - {preset.description}
                    </Button>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
