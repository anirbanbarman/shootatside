"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/types/project";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/utils/status";
import { Box, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { AppButton } from "@/components/common/ui";

type SortKey = "id" | "client" | "eventType" | "eventDate";

interface ProjectTableProps {
  projects: Project[];
  onSelect: (projectId: string) => void;
  selectedProjectId?: string;
}

export function ProjectTable({ projects, onSelect, selectedProjectId }: ProjectTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("eventDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = projects.filter((project) => !normalizedQuery || [project.id, project.client.name, project.eventType, project.venue].some((value) => value.toLowerCase().includes(normalizedQuery)));
    return [...filtered].sort((first, second) => {
      const firstValue = sortKey === "client" ? first.client.name : first[sortKey];
      const secondValue = sortKey === "client" ? second.client.name : second[sortKey];
      const comparison = sortKey === "eventDate"
        ? new Date(firstValue).getTime() - new Date(secondValue).getTime()
        : String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [projects, query, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(0);
  };

  const sortLabel = (label: string, key: SortKey) => <TableSortLabel active={sortKey === key} direction={sortKey === key ? sortDirection : "asc"} onClick={() => handleSort(key)}>{label}</TableSortLabel>;

  return (
    <TableContainer component={Paper} variant="outlined" className="table-card material-project-table">
      <Box className="material-table-toolbar">
        <Box><Typography variant="subtitle1" component="h3" sx={{ fontWeight: 750 }}>Projects</Typography><Typography variant="body2" color="text.secondary">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</Typography></Box>
        <TextField size="small" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search projects" aria-label="Search projects" className="material-table-search" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      </Box>
      <Table size="medium" aria-label="Projects" className="material-project-table-grid">
        <TableHead><TableRow><TableCell>{sortLabel("Project ID", "id")}</TableCell><TableCell>{sortLabel("Client", "client")}</TableCell><TableCell>{sortLabel("Event", "eventType")}</TableCell><TableCell>{sortLabel("Event date", "eventDate")}</TableCell><TableCell>Quote amount</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
        <TableBody>{visibleProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((project) => <TableRow key={project.id} selected={project.id === selectedProjectId} hover className="material-project-row">
          <TableCell className="project-id-cell">{project.id}</TableCell><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{project.client.name}</Typography></TableCell><TableCell>{project.eventType}</TableCell><TableCell>{formatDate(project.eventDate)}</TableCell><TableCell>{project.initialQuote ? formatCurrency(project.negotiation?.amount ?? project.initialQuote.amount) : "—"}</TableCell><TableCell><StatusBadge project={project} /></TableCell>
          <TableCell align="right"><AppButton size="small" variant="contained" endIcon={<OpenInNewIcon />} onClick={() => onSelect(project.id)}>Details</AppButton></TableCell>
        </TableRow>)}
        {visibleProjects.length === 0 ? <TableRow><TableCell colSpan={7}><Box className="material-table-empty"><InboxOutlinedIcon /><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No projects found</Typography><Typography variant="body2" color="text.secondary">Try another search or clear the search field.</Typography></Box></TableCell></TableRow> : null}
        </TableBody>
      </Table>
      <TablePagination component="div" count={visibleProjects.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Rows" />
    </TableContainer>
  );
}
