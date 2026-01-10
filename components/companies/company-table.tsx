"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  GripVertical,
  Building2,
  Globe,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Business } from "@/lib/explorium/types";
import { cn } from "@/lib/utils";

// Helper to get business ID from either field
const getBusinessId = (business: Business): string => {
  return business.business_id || business.id || business.name;
};

// Helper to get company logo URL (supports both 'logo' and 'logo_url' fields)
const getCompanyLogo = (company: Business): string | undefined => {
  return company.logo || company.logo_url;
};

// Words that should not be capitalized (unless first word)
const LOWERCASE_WORDS = new Set([
  // English
  "and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by",
  // Portuguese
  "e", "ou", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas", "para", "com", "por",
  // Spanish
  "y", "o", "el", "la", "los", "las", "en", "con",
]);

// Smart capitalize function
const smartCapitalize = (text: string | undefined | null): string => {
  if (!text) return "-";

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Don't capitalize lowercase words
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

type ColumnId =
  | "select"
  | "name"
  | "description"
  | "industry"
  | "employees"
  | "revenue"
  | "location"
  | "domain"
  | "linkedin";

// Format location based on available data
const formatLocation = (company: Business): string => {
  const city = company.city_name || company.address?.city;
  const region = company.state_region_name || company.address?.state;
  const country = company.country_name || company.address?.country;

  if (city && region && country) {
    // Cidade, Regiao - Pais
    return `${smartCapitalize(city)}, ${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (region && country) {
    // Regiao - Pais
    return `${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (city && country) {
    // Cidade - Pais
    return `${smartCapitalize(city)} - ${smartCapitalize(country)}`;
  }

  if (city && region) {
    // Cidade, Regiao
    return `${smartCapitalize(city)}, ${smartCapitalize(region)}`;
  }

  // Only one value exists
  if (city) return smartCapitalize(city);
  if (region) return smartCapitalize(region);
  if (country) return smartCapitalize(country);

  return "-";
};

interface Column {
  id: ColumnId;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: boolean;
  stickyOffset?: number;
}

interface CompanyTableProps {
  companies: Business[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  hiddenColumns?: ColumnId[];
  onCompanyClick?: (company: Business) => void;
}

function SortableHeader({
  column,
  children,
  onAutoResize,
  isResizing,
  onResizeStart,
}: {
  column: Column;
  children: React.ReactNode;
  onAutoResize?: (columnId: ColumnId) => void;
  isResizing?: boolean;
  onResizeStart?: (columnId: ColumnId, startX: number, startWidth: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart?.(column.id, e.clientX, column.width || 100);
    },
    [column.id, column.width, onResizeStart]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAutoResize?.(column.id);
    },
    [column.id, onAutoResize]
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    position: "sticky" as const,
    top: 0,
    zIndex: column.sticky ? 30 : 20,
    ...(column.sticky && {
      left: column.stickyOffset ?? 0,
    }),
  };

  const isNonDraggable = column.id === "select" || column.id === "name";
  const isLastStickyColumn = column.id === "name";
  const canResize = column.id !== "select";
  const showSeparator = column.id !== "select";

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b",
        isDragging && "bg-muted z-50",
        // Separator after sticky column (full height)
        isLastStickyColumn && "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border",
        // Separator for other columns (with padding)
        showSeparator && !isLastStickyColumn && "after:absolute after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-border"
      )}
    >
      <div className="flex items-center gap-1 pr-2">
        {!isNonDraggable && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-foreground text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        {children}
      </div>
      {/* Resize handle */}
      {canResize && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "absolute right-0 top-0 h-full w-2 cursor-col-resize z-30",
            "hover:bg-primary/20",
            isResizing && "bg-primary/30"
          )}
        />
      )}
    </TableHead>
  );
}

export function CompanyTable({
  companies,
  selectedIds,
  onSelectChange,
  hiddenColumns = [],
  onCompanyClick,
}: CompanyTableProps) {

  // Resize state - managed at parent level for better performance
  const [resizingColumnId, setResizingColumnId] = useState<ColumnId | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const defaultColumns: Column[] = useMemo(
    () => [
      { id: "select", label: "", width: 40, minWidth: 40, maxWidth: 40, sticky: true, stickyOffset: 0 },
      { id: "name", label: "Company Name", width: 200, minWidth: 150, maxWidth: 400, sticky: true, stickyOffset: 40 },
      { id: "description", label: "Company Description", width: 200, minWidth: 100, maxWidth: 400 },
      { id: "industry", label: "Company Industry", width: 150, minWidth: 100, maxWidth: 250 },
      { id: "employees", label: "Company Employees", width: 110, minWidth: 80, maxWidth: 150 },
      { id: "revenue", label: "Company Revenue", width: 130, minWidth: 80, maxWidth: 200 },
      { id: "location", label: "Company Location", width: 200, minWidth: 120, maxWidth: 350 },
      { id: "domain", label: "Company Domain", width: 150, minWidth: 100, maxWidth: 250 },
      { id: "linkedin", label: "Company LinkedIn", width: 150, minWidth: 100, maxWidth: 250 },
    ],
    []
  );

  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.id === "select" || !hiddenColumns.includes(col.id)),
    [columns, hiddenColumns]
  );

  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) => {
        const defaultCol = defaultColumns.find((d) => d.id === col.id);
        return defaultCol ? { ...col, label: defaultCol.label } : col;
      })
    );
  }, [defaultColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        // Don't allow moving select, name, or actions columns (fixed columns)
        const activeItem = items[oldIndex];
        const overItem = items[newIndex];
        const fixedColumns = ["select", "name", "actions"];
        if (
          fixedColumns.includes(activeItem.id) ||
          fixedColumns.includes(overItem.id)
        ) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleColumnResize = useCallback((columnId: ColumnId, width: number) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, width } : col))
    );
  }, []);

  // Handle resize start - called from header component
  const handleResizeStart = useCallback(
    (columnId: ColumnId, startX: number, startWidth: number) => {
      setResizingColumnId(columnId);
      resizeStartXRef.current = startX;
      resizeStartWidthRef.current = startWidth;
    },
    []
  );

  // Global mouse move/up handlers for resize
  useEffect(() => {
    if (!resizingColumnId) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const column = columns.find((c) => c.id === resizingColumnId);
      if (!column) return;

      const diff = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(
        column.minWidth || 50,
        Math.min(column.maxWidth || 500, resizeStartWidthRef.current + diff)
      );
      handleColumnResize(resizingColumnId, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumnId(null);
    };

    // Add listeners to document for reliable tracking
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Change cursor globally while resizing
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumnId, columns, handleColumnResize]);

  // Auto-resize column to fit content on double-click
  const handleAutoResize = useCallback(
    (columnId: ColumnId) => {
      // Create a temporary span to measure text width
      const measureText = (text: string, fontWeight: string = "normal"): number => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return 0;
        context.font = `${fontWeight} 14px ui-sans-serif, system-ui, sans-serif`;
        return context.measureText(text).width;
      };

      let maxWidth = 0;
      const padding = 32; // Account for cell padding

      // Measure header text
      const column = columns.find((c) => c.id === columnId);
      if (column?.label) {
        maxWidth = Math.max(maxWidth, measureText(column.label, "500") + padding + 24); // Extra for grip icon
      }

      // Measure content in each row
      companies.forEach((company) => {
        let text = "";
        switch (columnId) {
          case "name":
            text = company.name || "";
            maxWidth = Math.max(maxWidth, measureText(text, "500") + padding + 44); // Extra for avatar
            break;
          case "description":
            text = company.business_description || company.description || "";
            break;
          case "industry":
            text = company.industry || "";
            break;
          case "employees":
            text = company.number_of_employees_range || company.employee_range || "";
            break;
          case "revenue":
            text = company.yearly_revenue_range || company.revenue_range || "";
            break;
          case "location":
            text = formatLocation(company);
            break;
          case "domain":
            text = company.domain || "";
            break;
          case "linkedin":
            text = (company.linkedin_company_url || company.linkedin_url || "")
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            break;
          default:
            break;
        }
        if (text && columnId !== "name") {
          maxWidth = Math.max(maxWidth, measureText(text) + padding);
        }
      });

      // Apply constraints
      const finalWidth = Math.max(
        column?.minWidth || 50,
        Math.min(column?.maxWidth || 500, maxWidth)
      );

      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, width: finalWidth } : col))
      );
    },
    [companies, columns]
  );

  const allSelected =
    companies.length > 0 &&
    companies.every((c) => selectedIds.includes(getBusinessId(c)));

  const someSelected =
    selectedIds.length > 0 &&
    !allSelected &&
    companies.some((c) => selectedIds.includes(getBusinessId(c)));

  const handleSelectAll = () => {
    const currentPageIds = companies.map((c) => getBusinessId(c));
    if (allSelected) {
      // Remove only current page IDs, keep others
      onSelectChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Add current page IDs without removing others
      const newIds = currentPageIds.filter((id) => !selectedIds.includes(id));
      onSelectChange([...selectedIds, ...newIds]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const renderCellContent = (columnId: ColumnId, company: Business) => {
    switch (columnId) {
      case "select":
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.includes(getBusinessId(company))}
              onCheckedChange={() => handleSelectOne(getBusinessId(company))}
              className="cursor-pointer"
            />
          </div>
        );
      case "name":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
              {getCompanyLogo(company) ? (
                <AvatarImage
                  src={getCompanyLogo(company)}
                  alt={company.name}
                  className="object-contain"
                />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">{company.name}</span>
          </div>
        );
      case "description": {
        const description = company.business_description || company.description || "-";
        return (
          <span className="text-sm truncate block" title={description}>
            {description}
          </span>
        );
      }
      case "industry":
        return <span className="text-sm truncate">{smartCapitalize(company.industry)}</span>;
      case "employees":
        return (
          <span className="text-sm">
            {company.number_of_employees_range ||
              company.employee_count?.toLocaleString("pt-BR") ||
              company.employee_range ||
              "-"}
          </span>
        );
      case "revenue":
        return (
          <span className="text-sm">
            {company.yearly_revenue_range ||
              company.revenue_range ||
              (company.revenue ? `$${company.revenue.toLocaleString("en-US")}` : "-")}
          </span>
        );
      case "location": {
        const location = formatLocation(company);
        return (
          <span className="text-sm truncate" title={location}>
            {location}
          </span>
        );
      }
      case "domain":
        return company.domain ? (
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{company.domain}</span>
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      case "linkedin": {
        const linkedinUrl = company.linkedin_company_url || company.linkedin_url;
        const displayUrl = linkedinUrl
          ?.replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm hover:underline cursor-pointer"
          >
            <span className="truncate">{displayUrl}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-sm">-</span>
        );
      }
      default:
        return null;
    }
  };

  const renderHeaderContent = (column: Column) => {
    if (column.id === "select") {
      return (
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement).dataset.state = someSelected
                ? "indeterminate"
                : allSelected
                ? "checked"
                : "unchecked";
            }
          }}
          onCheckedChange={handleSelectAll}
          className="cursor-pointer"
        />
      );
    }
    // Format label with chevron for prefix (e.g., "Company Name" -> "Company > Name")
    const label = column.label;
    const prefixMatch = label.match(/^(Company)\s+(.+)$/i);
    if (prefixMatch) {
      return (
        <span className="flex items-center gap-1">
          {prefixMatch[1]}
          <ChevronRight className="h-3 w-3" />
          {prefixMatch[2]}
        </span>
      );
    }
    return <span>{label}</span>;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="group hover:bg-transparent">
              <SortableContext
                items={visibleColumns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {visibleColumns.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    onAutoResize={handleAutoResize}
                    isResizing={resizingColumnId === column.id}
                    onResizeStart={handleResizeStart}
                  >
                    {renderHeaderContent(column)}
                  </SortableHeader>
                ))}
              </SortableContext>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => (
              <TableRow
                key={getBusinessId(company) || `company-${index}`}
                className="group hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onCompanyClick?.(company)}
              >
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "py-3 pr-6 overflow-hidden relative transition-colors",
                      column.sticky && "sticky bg-background group-hover:bg-muted",
                      column.id === "name" && "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border"
                    )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        ...(column.sticky && {
                          left: column.stickyOffset ?? 0,
                          zIndex: 10,
                        }),
                      }}
                    >
                      {renderCellContent(column.id, company)}
                    </TableCell>
                  ))}
                </TableRow>
            ))}
            {/* Empty row for bottom border */}
            {companies.length > 0 && (
              <TableRow className="border-b hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length} className="h-0 p-0" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
}
