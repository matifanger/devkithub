/**
 * Port Kill
 *
 * A real-time port scanner and process terminator for developers.
 * Shows all listening TCP ports with associated processes and allows
 * one-click termination.
 *
 * Features:
 * - Real-time port scanning (auto-refresh every 5 seconds)
 * - Shows port, PID, process name, and address
 * - One-click kill with confirmation
 * - Search/filter by port number or process name
 * - Manual refresh button
 * - Sort by port, PID, or process name
 * - Visual indicators for common dev ports (3000, 5173, 8080, etc.)
 *
 * How to use:
 * 1. Open the tool to see all listening ports
 * 2. Use the search to filter by port or process name
 * 3. Click the Kill button to terminate a process
 * 4. Confirm the action in the dialog
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Search,
  Skull,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

interface PortEntry {
  port: number;
  pid: number;
  protocol: string;
  process: string;
  address: string;
}

type SortKey = "port" | "pid" | "process";
type SortDir = "asc" | "desc";

const KNOWN_PORTS: Record<number, string> = {
  80: "HTTP",
  443: "HTTPS",
  3000: "React/Next.js",
  3001: "Dev Server",
  4200: "Angular",
  5000: "Flask/ASP.NET",
  5173: "Vite",
  5174: "Vite",
  8000: "Django/Uvicorn",
  8080: "HTTP Alt/Spring",
  8081: "Dev Server",
  8443: "HTTPS Alt",
  8888: "Jupyter",
  9000: "Webpack/PHP",
  9090: "Prometheus",
  27017: "MongoDB",
  3306: "MySQL",
  5432: "PostgreSQL",
  6379: "Redis",
};

export function PortKillPage() {
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("port");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [killConfirm, setKillConfirm] = useState<PortEntry | null>(null);
  const [killing, setKilling] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scanPorts = useCallback(async () => {
    if (!window.electron?.portKill?.scanPorts) return;
    setLoading(true);
    try {
      const result = await window.electron.portKill.scanPorts();
      setPorts(result);
      setLastScan(new Date());
    } catch {
      setPorts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scanPorts();
  }, [scanPorts]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(scanPorts, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, scanPorts]);

  const handleKill = async () => {
    if (!killConfirm || !window.electron?.portKill?.killProcess) return;
    setKilling(true);
    try {
      const result = await window.electron.portKill.killProcess(killConfirm.pid);
      if (result.success) {
        setPorts((prev) => prev.filter((p) => p.pid !== killConfirm.pid));
      }
    } finally {
      setKilling(false);
      setKillConfirm(null);
      setTimeout(scanPorts, 500);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredPorts = ports
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(p.port).includes(q) ||
        String(p.pid).includes(q) ||
        p.process.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "port") return (a.port - b.port) * dir;
      if (sortKey === "pid") return (a.pid - b.pid) * dir;
      return a.process.localeCompare(b.process) * dir;
    });

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Port Kill"
        description="Scan listening ports and terminate processes with one click"
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by port or process..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={scanPorts}
          disabled={loading}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        <Button
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? (
            <Wifi className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 mr-1.5" />
          )}
          {autoRefresh ? "Live" : "Paused"}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
          <span className="font-mono">
            {filteredPorts.length} port{filteredPorts.length !== 1 ? "s" : ""}
          </span>
          {lastScan && (
            <span>
              · Last scan:{" "}
              {lastScan.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="text-left px-4 py-2.5 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("port")}
                >
                  Port
                  <SortIndicator col="port" />
                </th>
                <th
                  className="text-left px-4 py-2.5 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("pid")}
                >
                  PID
                  <SortIndicator col="pid" />
                </th>
                <th
                  className="text-left px-4 py-2.5 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("process")}
                >
                  Process
                  <SortIndicator col="process" />
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Address</th>
                <th className="text-right px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPorts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {loading
                      ? "Scanning ports..."
                      : searchQuery
                        ? "No ports match your filter"
                        : "No listening ports found"}
                  </td>
                </tr>
              ) : (
                filteredPorts.map((entry) => {
                  const knownLabel = KNOWN_PORTS[entry.port];
                  return (
                    <tr
                      key={`${entry.port}-${entry.pid}`}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground">
                            {entry.port}
                          </span>
                          {knownLabel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {knownLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {entry.pid}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">
                          {entry.process || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {entry.address}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setKillConfirm(entry)}
                        >
                          <Skull className="h-3.5 w-3.5 mr-1" />
                          Kill
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={!!killConfirm}
        onOpenChange={(open) => !open && setKillConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Kill Process
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate this process?
            </DialogDescription>
          </DialogHeader>
          {killConfirm && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm font-mono">
              <div>
                <span className="text-muted-foreground">Port:</span>{" "}
                <span className="font-medium">{killConfirm.port}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PID:</span>{" "}
                <span className="font-medium">{killConfirm.pid}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Process:</span>{" "}
                <span className="font-medium">
                  {killConfirm.process || "Unknown"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKillConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleKill}
              disabled={killing}
            >
              {killing ? "Killing..." : "Kill Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolPageContainer>
  );
}
