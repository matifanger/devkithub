/**
 * HTTP Status Codes Reference
 *
 * Comprehensive reference for HTTP status codes with descriptions.
 *
 * Features:
 * - All HTTP status codes (1xx, 2xx, 3xx, 4xx, 5xx)
 * - Search functionality
 * - Category filtering
 * - Detailed descriptions
 *
 * How to use:
 * 1. Browse or search HTTP status codes
 * 2. Filter by category
 * 3. Click on a code for more details
 */

import React, { useState } from "react";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolToolbar,
} from "../components/tool-page-layout";
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

const httpStatusCodes = [
  {
    code: 100,
    name: "Continue",
    description:
      "The server has received the request headers, and the client should proceed to send the request body.",
  },
  {
    code: 101,
    name: "Switching Protocols",
    description:
      "The requester has asked the server to switch protocols and the server has agreed to do so.",
  },
  {
    code: 102,
    name: "Processing",
    description:
      "The server is processing the request but no response is available yet.",
  },
  { code: 200, name: "OK", description: "The request has succeeded." },
  {
    code: 201,
    name: "Created",
    description:
      "The request has been fulfilled and a new resource has been created.",
  },
  {
    code: 202,
    name: "Accepted",
    description:
      "The request has been accepted for processing but has not been completed.",
  },
  {
    code: 204,
    name: "No Content",
    description:
      "The server has fulfilled the request but there is no content to return.",
  },
  {
    code: 206,
    name: "Partial Content",
    description:
      "The server is delivering only part of the resource due to a range header.",
  },
  {
    code: 301,
    name: "Moved Permanently",
    description: "The resource has been moved to a new URL permanently.",
  },
  {
    code: 302,
    name: "Found",
    description: "The resource is temporarily located at a different URL.",
  },
  {
    code: 304,
    name: "Not Modified",
    description: "The resource has not been modified since the last request.",
  },
  {
    code: 307,
    name: "Temporary Redirect",
    description:
      "The request should be repeated with another URL but future requests should still use the original URL.",
  },
  {
    code: 308,
    name: "Permanent Redirect",
    description:
      "The request and all future requests should be repeated using another URL.",
  },
  {
    code: 400,
    name: "Bad Request",
    description: "The server cannot process the request due to client error.",
  },
  {
    code: 401,
    name: "Unauthorized",
    description:
      "Authentication is required and has failed or has not been provided.",
  },
  {
    code: 403,
    name: "Forbidden",
    description:
      "The server understood the request but refuses to authorize it.",
  },
  {
    code: 404,
    name: "Not Found",
    description: "The requested resource could not be found on the server.",
  },
  {
    code: 405,
    name: "Method Not Allowed",
    description:
      "The method specified in the request is not allowed for the resource.",
  },
  {
    code: 408,
    name: "Request Timeout",
    description: "The server timed out waiting for the request.",
  },
  {
    code: 409,
    name: "Conflict",
    description: "The request conflicts with the current state of the server.",
  },
  {
    code: 410,
    name: "Gone",
    description:
      "The resource is no longer available and will not be available again.",
  },
  {
    code: 413,
    name: "Payload Too Large",
    description:
      "The request payload is larger than the server is willing or able to process.",
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    description:
      "The media format of the request is not supported by the server.",
  },
  {
    code: 422,
    name: "Unprocessable Entity",
    description:
      "The server understands the content type but was unable to process the contained instructions.",
  },
  {
    code: 429,
    name: "Too Many Requests",
    description:
      "The user has sent too many requests in a given amount of time.",
  },
  {
    code: 500,
    name: "Internal Server Error",
    description:
      "The server has encountered a situation it doesn't know how to handle.",
  },
  {
    code: 501,
    name: "Not Implemented",
    description:
      "The server does not support the functionality required to fulfill the request.",
  },
  {
    code: 502,
    name: "Bad Gateway",
    description:
      "The server was acting as a gateway and received an invalid response.",
  },
  {
    code: 503,
    name: "Service Unavailable",
    description:
      "The server is not ready to handle the request, usually due to maintenance or overload.",
  },
  {
    code: 504,
    name: "Gateway Timeout",
    description:
      "The server was acting as a gateway and did not receive a timely response.",
  },
];

export function HttpStatusCodesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredCodes = httpStatusCodes.filter((status) => {
    const matchesSearch =
      status.name.toLowerCase().includes(search.toLowerCase()) ||
      status.code.toString().includes(search) ||
      status.description.toLowerCase().includes(search.toLowerCase());

    if (category === "all") return matchesSearch;
    const codeCategory = Math.floor(status.code / 100);
    return matchesSearch && codeCategory === parseInt(category);
  });

  const getCategoryLabel = (code: number) => {
    const cat = Math.floor(code / 100);
    const labels: Record<number, string> = {
      1: "Informational",
      2: "Success",
      3: "Redirection",
      4: "Client Error",
      5: "Server Error",
    };
    return labels[cat] || "Unknown";
  };

  const getCategoryColor = (code: number) => {
    const cat = Math.floor(code / 100);
    const colors: Record<number, string> = {
      1: "bg-blue-500/10 text-blue-500",
      2: "bg-green-500/10 text-green-500",
      3: "bg-yellow-500/10 text-yellow-500",
      4: "bg-orange-500/10 text-orange-500",
      5: "bg-red-500/10 text-red-500",
    };
    return colors[cat] || "";
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="HTTP Status Codes Reference"
        description="Complete reference for HTTP status codes"
      />

      <ToolToolbar>
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by code, name or description..."
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
            <SelectItem value="1">1xx Informational</SelectItem>
            <SelectItem value="2">2xx Success</SelectItem>
            <SelectItem value="3">3xx Redirection</SelectItem>
            <SelectItem value="4">4xx Client Error</SelectItem>
            <SelectItem value="5">5xx Server Error</SelectItem>
          </SelectContent>
        </Select>
      </ToolToolbar>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCodes.map((status) => (
          <Card
            key={status.code}
            className={`p-4 ${getCategoryColor(status.code)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">{status.code}</div>
                <div className="font-medium">{status.name}</div>
              </div>
              <div className="text-xs opacity-70">
                {getCategoryLabel(status.code)}
              </div>
            </div>
            <p className="mt-2 text-sm opacity-80">{status.description}</p>
          </Card>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No status codes found matching your search.
        </div>
      )}
    </ToolPageContainer>
  );
}
