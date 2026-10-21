import React from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
import { SmartFileRenamerPage } from "../../src/pages/smart-file-renamer";
import { applyTheme, predefinedThemes } from "../../src/utils/themes";

document.documentElement.classList.add("dark");
applyTheme(predefinedThemes[0], "dark");
createRoot(document.getElementById("root")).render(<SmartFileRenamerPage />);
