import { useMemo } from "react";
import {
  allToolsMetadata,
  getToolMetadata,
  getAllToolsWithMetadata,
  ToolMetadata,
  ToolWithMetadata,
} from "../utils/tools-metadata";

export function useToolMetadata(toolIdOrSlug: string): ToolMetadata | undefined {
  return useMemo(() => getToolMetadata(toolIdOrSlug), [toolIdOrSlug]);
}

export function useAllToolsMetadata(): ToolMetadata[] {
  return allToolsMetadata;
}

export function useAllToolsWithMetadata(): ToolWithMetadata[] {
  return useMemo(() => getAllToolsWithMetadata(), []);
}
