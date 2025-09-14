// import { ruby } from '@codemirror/lang-ruby';
import { html as beautifyHtml } from 'js-beautify';
import React, { useCallback, useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function ErbBeautifyPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState('2');
  const [mode, setMode] = useState('beautify');

  const formatErb = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (mode === 'beautify') {
        const formatted = beautifyHtml(input, {
          indent_size: Number(spaces),
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          indent_scripts: 'keep',
          unformatted: ['%', '<%', '%>', '<%='],
          wrap_line_length: 0,
          indent_empty_lines: false,
        });
        setOutput(formatted);
      } else {
        // For minification
        const minified = input
          .replace(/\n\s*/g, '') // Remove newlines and indentation
          .replace(/>\s+</g, '><') // Remove spaces between tags
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*([:;,{}])\s*/g, '$1') // Remove spaces around operators
          .trim();
        setOutput(minified);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid ERB');
      setOutput('');
    }
  }, [input, spaces, mode]);

  useEffect(() => {
    formatErb();
  }, [formatErb]);

  const handleSample = () => {
    const sample = `<!DOCTYPE html>
<html>
<head>
  <title><%= @page_title %></title>
  <%= csrf_meta_tags %>
  <%= stylesheet_link_tag 'application', media: 'all', 'data-turbolinks-track': 'reload' %>
</head>
<body>
  <nav class="navbar">
    <% if user_signed_in? %>
      <div class="user-menu">
        <span>Welcome, <%= current_user.name %></span>
        <%= link_to 'Profile', user_path(current_user) %>
        <%= link_to 'Logout', destroy_user_session_path, method: :delete %>
      </div>
    <% else %>
      <div class="auth-links">
        <%= link_to 'Login', new_user_session_path %>
        <%= link_to 'Register', new_user_registration_path %>
      </div>
    <% end %>
  </nav>

  <div class="container">
    <% flash.each do |name, msg| %>
      <div class="alert alert-<%= name %>">
        <%= msg %>
      </div>
    <% end %>

    <%= yield %>
  </div>

  <footer>
    <p>&copy; <%= Time.current.year %> My Application. All rights reserved.</p>
  </footer>

  <%= javascript_include_tag 'application', 'data-turbolinks-track': 'reload' %>
</body>
</html>`;
    setInput(sample.trim());
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ERB Beautify/Minify</h1>
        <p className="text-muted-foreground">Format or minify your ERB (Ruby) templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Input</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={(value) => setInput(value)}
              // extensions={[ruby()]}
              placeholder="Paste your ERB template here"
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
            <Label>Output</Label>
            <div className="flex items-center space-x-2">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beautify">Beautify</SelectItem>
                  <SelectItem value="minify">Minify</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'beautify' && (
                <Select value={spaces} onValueChange={setSpaces}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Spaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Spaces</SelectItem>
                    <SelectItem value="4">4 Spaces</SelectItem>
                    <SelectItem value="8">8 Spaces</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" onClick={() => copyToClipboard(output)}>
                Copy
              </Button>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <AppCodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                width="100%"
                // extensions={[ruby()]}
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
