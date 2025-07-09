
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Loader2, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import { Pagination } from '@/components/shared/pagination';
import type { Institution } from '@/app/dashboard/admin/institutions/page';


// Augment jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


const REPORT_TYPES = [
  { value: 'serviceExtension', label: 'Ripoti ya Nyongeza ya Utumishi (Service Extension)' },
  { value: 'compulsoryRetirement', label: 'Ripoti ya Kustaafu kwa Lazima (Compulsory Retirement)' },
  { value: 'voluntaryRetirement', label: 'Ripoti ya Kustaafu kwa Hiari (Voluntary Retirement)' },
  { value: 'illnessRetirement', label: 'Ripoti ya Kustaafu kwa Ugonjwa (Illness Retirement)' },
  { value: 'lwop', label: 'Ripoti ya Likizo Bila Malipo (Leave Without Pay)' },
  { value: 'promotion', label: 'Ripoti ya Kupandishwa Cheo (Promotion)' },
  { value: 'promotionExperience', label: 'Ripoti ya Kupandishwa Cheo kwa Uzoefu (Promotion due to Experience)' },
  { value: 'promotionEducation', label: 'Ripoti ya Kupandishwa Cheo kwa Maendeleo ya Elimu (Promotion due to Education Advancement)' },
  { value: 'terminationDismissal', label: 'Ripoti ya Kufukuzwa/Kuachishwa Kazi (Termination/Dismissal)' },
  { value: 'complaints', label: 'Ripoti ya Malalamiko (Complaints)' },
  { value: 'cadreChange', label: 'Ripoti ya Kubadilishwa Kada (Change of Cadre)' },
  { value: 'resignation', label: 'Ripoti ya Kuacha Kazi (Employee Resignation)' },
  { value: 'confirmation', label: 'Ripoti ya Kuthibitishwa Kazini (Confirmation)' },
  { value: 'contractual', label: 'Ripoti ya Ajira za Mikataba (Contractual Employment)' },
];

interface ReportOutput {
  data: any[];
  headers: string[];
  title: string;
  totals?: any;
  dataKeys?: string[];
}

const ALL_INSTITUTIONS_FILTER_VALUE = "__ALL_INSTITUTIONS__";

export default function ReportsPage() {
  const { user, role } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportHeaders, setReportHeaders] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportTotals, setReportTotals] = useState<any>(null);
  const [reportDataKeys, setReportDataKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [institutionFilter, setInstitutionFilter] = useState<string>('');
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);

  const isHigherLevelUser = useMemo(() => 
    [ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.PO, ROLES.CSCS, ROLES.ADMIN].includes(role as any),
    [role]
  );
  
  useEffect(() => {
    const fetchInstitutions = async () => {
        try {
            const response = await fetch('/api/institutions');
            if (response.ok) {
                const data = await response.json();
                setAvailableInstitutions(data);
            }
        } catch (error) {
            toast({title: "Error", description: "Could not load institutions for filter.", variant: "destructive"});
        }
    };
    fetchInstitutions();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast({ title: "Kosa", description: "Tafadhali chagua aina ya ripoti.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setReportData([]);
    setReportHeaders([]);
    setReportTitle('');
    setReportTotals(null);
    setReportDataKeys([]);
    setCurrentPage(1);

    try {
        const params = new URLSearchParams({
            reportType: selectedReportType,
        });
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        if (institutionFilter && institutionFilter !== ALL_INSTITUTIONS_FILTER_VALUE) {
            params.append('institutionId', institutionFilter);
        } else if (role === ROLES.HRO && user?.institutionId) {
            params.append('institutionId', user.institutionId);
        }

        const response = await fetch(`/api/reports?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to generate report.");
        }

        const result: ReportOutput = await response.json();

        setReportData(result.data);
        setReportHeaders(result.headers);
        setReportTitle(result.title);
        setReportTotals(result.totals);
        setReportDataKeys(result.dataKeys || []);

        if (result.data.length === 0) {
            toast({ title: "Ripoti Imetolewa", description: `Hakuna taarifa kwa ${result.title} katika vigezo ulivyochagua.` });
        } else {
            toast({ title: "Ripoti Imetolewa", description: `${result.title} imetolewa kikamilifu.` });
        }

    } catch (error: any) {
        toast({ title: "Report Generation Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleExportToPdf = () => {
    if (reportData.length === 0 || reportHeaders.length === 0) {
      toast({ title: "Kosa la Kuhamisha", description: "Hakuna data ya kuhamisha.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(10);
    doc.text(`Kipindi: ${fromDate || 'N/A'} hadi ${toDate || 'N/A'}`, 14, 30);
    if(isHigherLevelUser && institutionFilter && institutionFilter !== ALL_INSTITUTIONS_FILTER_VALUE) {
        const instName = availableInstitutions.find(i => i.id === institutionFilter)?.name;
        doc.text(`Taasisi: ${instName}`, 14, 36);
    } else if(role === ROLES.HRO && user?.institution) {
        doc.text(`Taasisi: ${typeof user.institution === 'object' ? user.institution.name : user.institution}`, 14, 36);
    }

    const tableColumn = reportHeaders;
    const tableRows: any[][] = [];

    reportData.forEach(item => {
      const rowData = reportDataKeys.map(key => item[key] !== undefined ? String(item[key]) : '');
      tableRows.push(rowData);
    });

    const footRows: any[][] = [];
    if (reportTotals) {
      if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
        const emptyCells = Array(reportDataKeys.length - 2).fill('');
        footRows.push([reportTotals.descriptionMale, ...emptyCells, String(reportTotals.valueMale)]);
        footRows.push([reportTotals.descriptionFemale, ...emptyCells, String(reportTotals.valueFemale)]);
        footRows.push([reportTotals.descriptionTotal, ...emptyCells, String(reportTotals.valueTotal)]);
      } else if (Object.keys(reportTotals).length > 0) {
        const totalRow = reportDataKeys.map((key, index) => {
          if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            return String(reportTotals.sn || reportTotals.sno || reportTotals.nam);
          }
          return reportTotals[key] !== undefined ? String(reportTotals[key]) : '';
        });
        footRows.push(totalRow);
      }
    }
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      foot: footRows.length > 0 ? footRows : undefined,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      footStyles: { fillColor: [211, 211, 211], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 'auto' } },
    });
    
    doc.save(`${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
    toast({ title: "PDF Imehamishwa", description: "Ripoti imehamishwa kwenda PDF." });
  };

  const handleExportToExcel = () => {
    if (reportData.length === 0 || reportHeaders.length === 0) {
      toast({ title: "Kosa la Kuhamisha", description: "Hakuna data ya kuhamisha.", variant: "destructive" });
      return;
    }

    const wsData: any[][] = [reportHeaders];

    reportData.forEach(item => {
      const rowData = reportDataKeys.map(key => item[key] !== undefined ? item[key] : '');
      wsData.push(rowData);
    });

    if (reportTotals) {
      if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
         const emptyCells = Array(reportDataKeys.length - 2).fill('');
        wsData.push([reportTotals.descriptionMale, ...emptyCells, reportTotals.valueMale]);
        wsData.push([reportTotals.descriptionFemale, ...emptyCells, reportTotals.valueFemale]);
        wsData.push([reportTotals.descriptionTotal, ...emptyCells, reportTotals.valueTotal]);
      } else if (Object.keys(reportTotals).length > 0) {
        const totalRow = reportDataKeys.map((key, index) => {
           if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            return reportTotals.sn || reportTotals.sno || reportTotals.nam;
          }
          return reportTotals[key] !== undefined ? reportTotals[key] : '';
        });
        wsData.push(totalRow);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ripoti");
    XLSX.writeFile(wb, `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
    toast({ title: "Excel Imehamishwa", description: "Ripoti imehamishwa kwenda Excel." });
  };
  
  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const paginatedData = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableFooter = () => {
    if (!reportTotals || reportHeaders.length === 0) return null;

    if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
         return (
            <React.Fragment>
                <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionMale}</TableCell>
                    <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1) -1} className="text-right">{reportTotals.valueMale}</TableCell>
                </TableRow>
                <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionFemale}</TableCell>
                     <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1)-1} className="text-right">{reportTotals.valueFemale}</TableCell>
                </TableRow>
                 <TableRow className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionTotal}</TableCell>
                     <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1)-1} className="text-right">{reportTotals.valueTotal}</TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    
    const totalRowCells: JSX.Element[] = [];
    let totalsRendered = false;
    reportHeaders.forEach((header, index) => {
        const key = reportDataKeys[index] || header.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const totalValue = reportTotals[key];

        if (totalValue !== undefined) {
             if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam) ) {
                 totalRowCells.push(<TableCell key={`${header}-total`} className="font-bold">{reportTotals.sn || reportTotals.sno || reportTotals.nam || 'JUMLA'}</TableCell>);
             } else {
                totalRowCells.push(<TableCell key={`${header}-total`} className="font-semibold text-right">{totalValue}</TableCell>);
             }
             totalsRendered = true;
        } else if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            totalRowCells.push(<TableCell key={`${header}-total-label`} className="font-bold">{reportTotals.sn || reportTotals.sno || reportTotals.nam}</TableCell>);
        }
         else {
            totalRowCells.push(<TableCell key={`${header}-total-empty`}></TableCell>);
        }
    });

    if (!totalsRendered && Object.keys(reportTotals).length > 0 && !reportTotals.sn && !reportTotals.sno && !reportTotals.nam) {
        const firstKey = reportDataKeys[0];
        if (firstKey && totalRowCells[0]) {
             totalRowCells[0] = <TableCell key={`${firstKey}-total-label`} className="font-bold">JUMLA</TableCell>;
        }
    }


    return (
        <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
            {totalRowCells}
        </TableRow>
    );
  };


  return (
    <div>
      <PageHeader title="Ripoti na Takwimu" description="Toa na angalia ripoti za mfumo." />
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Chagua Ripoti</CardTitle>
          <CardDescription>Chagua aina ya ripoti na vigezo vingine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="reportType">Aina ya Ripoti</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Chagua aina ya ripoti" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isHigherLevelUser && (
                 <div className="space-y-1 lg:col-span-2">
                 <Label htmlFor="institutionFilter">Taasisi / Wizara</Label>
                 <Select value={institutionFilter} onValueChange={setInstitutionFilter} disabled={isGenerating}>
                     <SelectTrigger id="institutionFilter">
                         <SelectValue placeholder="Chagua taasisi (si lazima)" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value={ALL_INSTITUTIONS_FILTER_VALUE}>Taasisi Zote</SelectItem>
                         {availableInstitutions.map(inst => (
                             <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
               </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="fromDate">Kuanzia Tarehe</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={isGenerating}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="toDate">Hadi Tarehe</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={isGenerating}/>
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Toa Ripoti
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <div className="flex items-center justify-center mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Inatayarisha ripoti...</p>
        </div>
      )}

      {!isGenerating && reportTitle && (
        <Card className="shadow-lg mt-6">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>{reportTitle}</CardTitle>
              {fromDate && toDate && <CardDescription>Kipindi: {fromDate} hadi {toDate}</CardDescription>}
            </div>
            {reportData.length > 0 && (
                 <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExportToPdf}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Hamisha PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportToExcel}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Hamisha Excel
                    </Button>
                  </div>
            )}
          </CardHeader>
          <CardContent>
            {reportData.length > 0 ? (
              <>
              <Table>
                {fromDate && toDate && <TableCaption>Ripoti ya {reportTitle.toLowerCase()} kuanzia {fromDate} hadi {toDate}.</TableCaption>}
                <TableHeader>
                  <TableRow>
                    {reportHeaders.map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {reportDataKeys.map(key => (
                        <TableCell key={key}>{row[key]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {currentPage === totalPages && reportTotals && Object.keys(reportTotals).length > 0 && renderTableFooter()}
                </TableBody>
              </Table>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={reportData.length}
                itemsPerPage={itemsPerPage}
              />
              </>
            ) : (
               <p className="text-muted-foreground text-center py-4">Hakuna taarifa zilizopatikana kwa ripoti hii katika vigezo ulivyochagua.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
