/**
 * MIME Types Reference
 *
 * Comprehensive reference for MIME types (Media Types).
 *
 * Features:
 * - All common MIME types
 * - Search functionality
 * - Category filtering
 * - File extension mapping
 *
 * How to use:
 * 1. Browse or search MIME types
 * 2. Filter by category
 * 3. View file extensions and descriptions
 */

import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const mimeTypes = [
  {
    type: "text/plain",
    extensions: [".txt"],
    category: "Text",
    description: "Plain text",
  },
  {
    type: "text/html",
    extensions: [".html", ".htm"],
    category: "Text",
    description: "HTML document",
  },
  {
    type: "text/css",
    extensions: [".css"],
    category: "Text",
    description: "Cascading Style Sheets",
  },
  {
    type: "text/javascript",
    extensions: [".js"],
    category: "Text",
    description: "JavaScript code",
  },
  {
    type: "text/xml",
    extensions: [".xml"],
    category: "Text",
    description: "XML document",
  },
  {
    type: "text/csv",
    extensions: [".csv"],
    category: "Text",
    description: "Comma-separated values",
  },
  {
    type: "application/json",
    extensions: [".json"],
    category: "Application",
    description: "JSON data",
  },
  {
    type: "application/xml",
    extensions: [".xml"],
    category: "Application",
    description: "XML data",
  },
  {
    type: "application/pdf",
    extensions: [".pdf"],
    category: "Application",
    description: "PDF document",
  },
  {
    type: "application/zip",
    extensions: [".zip"],
    category: "Application",
    description: "ZIP archive",
  },
  {
    type: "application/gzip",
    extensions: [".gz"],
    category: "Application",
    description: "GZIP archive",
  },
  {
    type: "application/x-tar",
    extensions: [".tar"],
    category: "Application",
    description: "TAR archive",
  },
  {
    type: "application/x-rar-compressed",
    extensions: [".rar"],
    category: "Application",
    description: "RAR archive",
  },
  {
    type: "application/octet-stream",
    extensions: [".bin"],
    category: "Application",
    description: "Binary data",
  },
  {
    type: "application/msword",
    extensions: [".doc"],
    category: "Application",
    description: "Microsoft Word",
  },
  {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    category: "Application",
    description: "Microsoft Word (OpenXML)",
  },
  {
    type: "application/vnd.ms-excel",
    extensions: [".xls"],
    category: "Application",
    description: "Microsoft Excel",
  },
  {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: [".xlsx"],
    category: "Application",
    description: "Microsoft Excel (OpenXML)",
  },
  {
    type: "application/vnd.ms-powerpoint",
    extensions: [".ppt"],
    category: "Application",
    description: "Microsoft PowerPoint",
  },
  {
    type: "application/javascript",
    extensions: [".js"],
    category: "Application",
    description: "JavaScript code",
  },
  {
    type: "application/typescript",
    extensions: [".ts"],
    category: "Application",
    description: "TypeScript code",
  },
  {
    type: "application/wasm",
    extensions: [".wasm"],
    category: "Application",
    description: "WebAssembly",
  },
  {
    type: "image/gif",
    extensions: [".gif"],
    category: "Image",
    description: "Graphics Interchange Format",
  },
  {
    type: "image/jpeg",
    extensions: [".jpg", ".jpeg"],
    category: "Image",
    description: "JPEG image",
  },
  {
    type: "image/png",
    extensions: [".png"],
    category: "Image",
    description: "Portable Network Graphics",
  },
  {
    type: "image/svg+xml",
    extensions: [".svg"],
    category: "Image",
    description: "Scalable Vector Graphics",
  },
  {
    type: "image/webp",
    extensions: [".webp"],
    category: "Image",
    description: "WebP image",
  },
  {
    type: "image/x-icon",
    extensions: [".ico"],
    category: "Image",
    description: "Icon file",
  },
  {
    type: "image/bmp",
    extensions: [".bmp"],
    category: "Image",
    description: "Bitmap image",
  },
  {
    type: "image/tiff",
    extensions: [".tiff", ".tif"],
    category: "Image",
    description: "Tagged Image File Format",
  },
  {
    type: "audio/mpeg",
    extensions: [".mp3"],
    category: "Audio",
    description: "MP3 audio",
  },
  {
    type: "audio/wav",
    extensions: [".wav"],
    category: "Audio",
    description: "Waveform Audio File Format",
  },
  {
    type: "audio/ogg",
    extensions: [".ogg"],
    category: "Audio",
    description: "OGG audio",
  },
  {
    type: "audio/webm",
    extensions: [".weba"],
    category: "Audio",
    description: "WebM audio",
  },
  {
    type: "video/mp4",
    extensions: [".mp4"],
    category: "Video",
    description: "MP4 video",
  },
  {
    type: "video/mpeg",
    extensions: [".mpeg", ".mpg"],
    category: "Video",
    description: "MPEG video",
  },
  {
    type: "video/webm",
    extensions: [".webm"],
    category: "Video",
    description: "WebM video",
  },
  {
    type: "video/ogg",
    extensions: [".ogv"],
    category: "Video",
    description: "OGG video",
  },
  {
    type: "video/x-msvideo",
    extensions: [".avi"],
    category: "Video",
    description: "AVI video",
  },
  {
    type: "font/woff",
    extensions: [".woff"],
    category: "Font",
    description: "Web Open Font Format",
  },
  {
    type: "font/woff2",
    extensions: [".woff2"],
    category: "Font",
    description: "Web Open Font Format 2",
  },
  {
    type: "font/ttf",
    extensions: [".ttf"],
    category: "Font",
    description: "TrueType Font",
  },
  {
    type: "font/otf",
    extensions: [".otf"],
    category: "Font",
    description: "OpenType Font",
  },
  {
    type: "application/x-httpd-php",
    extensions: [".php"],
    category: "Application",
    description: "PHP code",
  },
  {
    type: "application/x-python",
    extensions: [".py"],
    category: "Application",
    description: "Python code",
  },
  {
    type: "application/x-java",
    extensions: [".java"],
    category: "Application",
    description: "Java code",
  },
  {
    type: "application/x-csharp",
    extensions: [".cs"],
    category: "Application",
    description: "C# code",
  },
  {
    type: "application/x-shellscript",
    extensions: [".sh"],
    category: "Application",
    description: "Shell script",
  },
  {
    type: "application/x-sql",
    extensions: [".sql"],
    category: "Application",
    description: "SQL code",
  },
  {
    type: "application/ld+json",
    extensions: [".jsonld"],
    category: "Application",
    description: "JSON-LD",
  },
  {
    type: "application/manifest+json",
    extensions: [".webmanifest"],
    category: "Application",
    description: "Web App Manifest",
  },
];

export function MimeTypesReferencePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredTypes = mimeTypes.filter((mime) => {
    const matchesSearch =
      mime.type.toLowerCase().includes(search.toLowerCase()) ||
      mime.extensions.some((ext) =>
        ext.toLowerCase().includes(search.toLowerCase()),
      ) ||
      mime.description.toLowerCase().includes(search.toLowerCase());

    if (category === "all") return matchesSearch;
    return matchesSearch && mime.category === category;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">MIME Types Reference</h1>
        <p className="text-muted-foreground">
          Complete reference for MIME types (Media Types)
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by type, extension or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Text">Text</SelectItem>
            <SelectItem value="Application">Application</SelectItem>
            <SelectItem value="Image">Image</SelectItem>
            <SelectItem value="Audio">Audio</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Font">Font</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((mime) => (
          <Card key={mime.type} className="p-4">
            <div className="space-y-2">
              <div className="font-mono font-medium text-sm">{mime.type}</div>
              <div className="text-xs text-muted-foreground">
                Extensions: {mime.extensions.join(", ")}
              </div>
              <div className="text-xs text-muted-foreground">
                Category: {mime.category}
              </div>
              <p className="text-sm">{mime.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No MIME types found matching your search.
        </div>
      )}
    </div>
  );
}
