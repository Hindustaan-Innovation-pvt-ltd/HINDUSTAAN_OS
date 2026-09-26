import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Lead } from '../types/lead.types';
import { getEffectiveLocation } from './locationEngine';
import { HINDUSTAAAN_LOGO_BASE64 } from './brandLogoBase64';

export interface ExportLeadsPDFOptions {
  leads: Lead[];
  title?: string;
  subtitle?: string;
  filterDescription?: string;
  mode?: 'print' | 'download';
  filename?: string;
}

const formatCallStatus = (status?: string): string => {
  switch (status) {
    case 'not_called':
      return 'Pending Call';
    case 'called_connected':
      return 'Connected';
    case 'meeting_scheduled':
      return 'Meeting Scheduled';
    case 'follow_up':
      return 'Follow Up';
    case 'converted':
      return 'Won Deal';
    case 'not_interested':
      return 'Not Interested';
    default:
      return status?.replace(/_/g, ' ') || 'Pending Call';
  }
};

/**
 * Exports multiple leads to a multi-page, landscape PDF report.
 * Features official Hindustaan Innovations Private Limited branding, logo, and executive styling.
 */
export function exportLeadsToPDF({
  leads,
  title = 'Commercial Lead Intelligence Report',
  subtitle,
  filterDescription,
  mode = 'download',
  filename,
}: ExportLeadsPDFOptions): { success: boolean; message?: string } {
  if (!leads || leads.length === 0) {
    return { success: false, message: 'No leads available to print/export.' };
  }

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 12;
    const bannerHeight = 24;

    // Top Header Banner
    doc.setFillColor(255, 161, 74); // #ffa14a corporate orange
    doc.roundedRect(margin, margin, pageWidth - margin * 2, bannerHeight, 2, 2, 'F');

    // Company Logo (placed in front of company name)
    try {
      doc.addImage(HINDUSTAAAN_LOGO_BASE64, 'PNG', margin + 4, margin + 3.8, 11, 16.5);
    } catch (logoErr) {
      console.warn('Could not render logo in PDF:', logoErr);
    }

    const textStartX = margin + 18;

    // Company Name: HINDUSTAAAN INNOVATIONS PRIVATE LIMITED
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(255, 255, 255);
    doc.text('HINDUSTAAAN INNOVATIONS PRIVATE LIMITED', textStartX, margin + 8);

    // Report Subtitle / Type
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // deep dark slate for high contrast on orange
    doc.text(title.toUpperCase(), textStartX, margin + 14);

    // Metadata line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59); // slate-800

    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const infoLeft = subtitle || `Total Records: ${leads.length} leads  •  Generated: ${nowFormatted}`;
    doc.text(infoLeft, textStartX, margin + 19.5);

    if (filterDescription) {
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42); // deep dark slate
      doc.text(`Active Filters: ${filterDescription}`, pageWidth - margin - 6, margin + 19.5, {
        align: 'right',
      });
    }

    // Build Table Rows
    const headers = [
      '#',
      'Company & Location',
      'Industry',
      'Decision Maker',
      'Phone / WhatsApp',
      'Score',
      'Assigned Rep',
      'Status',
      'Call Notes & Insights',
    ];

    const body = leads.map((lead, idx) => {
      const location = getEffectiveLocation(lead) || lead.city || 'Location N/A';
      const companyLines = [
        lead.companyName || 'Unnamed Company',
        location,
        lead.websiteUrl ? lead.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'No Website',
      ].filter(Boolean).join('\n');

      const contactName = lead.authorizedPersonName || 'Not detected';
      const contactRole = lead.authorizedPersonRole || 'Executive';
      const contactCombined = `${contactName}\n(${contactRole})`;

      const phoneList: string[] = [];
      if (lead.primaryPhone) phoneList.push(lead.primaryPhone);
      if (lead.whatsappNumber && lead.whatsappNumber !== lead.primaryPhone) {
        phoneList.push(`WA: ${lead.whatsappNumber}`);
      }
      if (lead.primaryEmail) {
        phoneList.push(lead.primaryEmail);
      }
      const contactChannels = phoneList.length > 0 ? phoneList.join('\n') : 'No phone listed';

      const assigned = lead.assignedTo?.name
        ? `${lead.assignedTo.name}${lead.assignedTo.role ? ` (${lead.assignedTo.role})` : ''}`
        : 'Unassigned';

      const statusText = formatCallStatus(lead.callStatus);

      let notes = lead.callNotes || '';
      if (!notes && lead.clientNeeds?.recommended_solution) {
        notes = `Rec: ${lead.clientNeeds.recommended_solution}`;
      }
      if (notes.length > 120) {
        notes = notes.slice(0, 117) + '...';
      }

      return [
        String(idx + 1),
        companyLines,
        lead.industrySector || 'General Commercial',
        contactCombined,
        contactChannels,
        String(Math.round(lead.leadScore || 0)),
        assigned,
        statusText,
        notes || '—',
      ];
    });

    autoTable(doc, {
      startY: margin + bannerHeight + 4,
      head: [headers],
      body: body,
      theme: 'grid',
      margin: { left: margin, right: margin, bottom: 16 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        valign: 'middle',
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [21, 128, 61], // corporate green (#15803d)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 46, fontStyle: 'bold' },
        2: { cellWidth: 30 },
        3: { cellWidth: 38 },
        4: { cellWidth: 36, fontStyle: 'normal' },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        6: { cellWidth: 30 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        8: { cellWidth: 45 },
      },
      didParseCell: (data) => {
        // Color status column cells subtly
        if (data.section === 'body' && data.column.index === 7) {
          const val = String(data.cell.raw);
          if (val === 'Won Deal') {
            data.cell.styles.textColor = [124, 58, 237]; // purple
          } else if (val === 'Meeting Scheduled') {
            data.cell.styles.textColor = [5, 150, 105]; // emerald
          } else if (val === 'Connected') {
            data.cell.styles.textColor = [2, 132, 199]; // sky
          } else if (val === 'Follow Up') {
            data.cell.styles.textColor = [217, 119, 6]; // amber
          }
        }
        // Score highlighting
        if (data.section === 'body' && data.column.index === 5) {
          const score = Number(data.cell.raw) || 0;
          if (score >= 80) {
            data.cell.styles.textColor = [16, 185, 129]; // green
          } else if (score >= 50) {
            data.cell.styles.textColor = [59, 130, 246]; // blue
          }
        }
      },
    });

    // Add running footers with total page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      // Footer notes
      doc.text(
        'Hindustaan Innovations Private Limited • Commercial Lead Intelligence Engine • Confidential Internal Document',
        margin,
        pageHeight - 6
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, {
        align: 'right',
      });
    }

    const defaultFilename = `hindustaan_innovations_leads_${new Date().toISOString().slice(0, 10)}.pdf`;
    const finalFilename = filename || defaultFilename;

    if (mode === 'print') {
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');

      if (!printWindow) {
        // Pop-up was blocked: download fallback
        doc.save(finalFilename);
        return {
          success: true,
          message: 'Print pop-up blocked by browser. PDF downloaded directly.',
        };
      }
      return { success: true, message: 'Opening print dialog...' };
    } else {
      // Direct Download
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      return { success: true, message: 'PDF report downloaded successfully.' };
    }
  } catch (error: any) {
    console.error('Failed to export leads PDF:', error);
    return { success: false, message: error?.message || 'Failed to generate PDF.' };
  }
}

/**
 * Generates an executive 1-page Dossier PDF for a single lead.
 */
export function exportSingleLeadDossierPDF(
  lead: Lead,
  mode: 'print' | 'download' = 'print'
): { success: boolean; message?: string } {
  if (!lead) return { success: false, message: 'Lead not specified' };

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const bannerHeight = 30;

    // Header Card
    doc.setFillColor(255, 161, 74); // #ffa14a corporate orange
    doc.roundedRect(margin, margin, pageWidth - margin * 2, bannerHeight, 2, 2, 'F');

    // Logo in front of company name
    try {
      doc.addImage(HINDUSTAAAN_LOGO_BASE64, 'PNG', margin + 4, margin + 4.5, 11, 16.5);
    } catch (logoErr) {
      console.warn('Could not render logo in dossier PDF:', logoErr);
    }

    const textStartX = margin + 18;

    // Company Name: Hindustaan Innovations Private Limited
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('HINDUSTAAAN INNOVATIONS PRIVATE LIMITED', textStartX, margin + 7.5);

    // Target Lead Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // deep dark slate for high contrast on orange
    doc.text(lead.companyName || 'Commercial Lead', textStartX, margin + 14.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const effectiveLoc = getEffectiveLocation(lead) || lead.city || 'India';
    const sector = lead.industrySector || 'Commercial Enterprise';
    doc.text(`${sector}  •  ${effectiveLoc}`, textStartX, margin + 20.5);

    // Score in top-right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`Score: ${Math.round(lead.leadScore || 0)}/100`, pageWidth - margin - 6, margin + 11, {
      align: 'right',
    });
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(formatCallStatus(lead.callStatus), pageWidth - margin - 6, margin + 18, {
      align: 'right',
    });

    let currentY = margin + bannerHeight + 6;

    // Contact & Company Overview Table
    const contactRows = [
      ['Authorized Contact:', lead.authorizedPersonName || 'Not detected', 'Role:', lead.authorizedPersonRole || 'Executive'],
      ['Primary Phone:', lead.primaryPhone || 'N/A', 'WhatsApp:', lead.whatsappNumber || 'N/A'],
      ['Email Address:', lead.primaryEmail || 'N/A', 'Website:', lead.websiteUrl || 'No Website'],
      ['Physical Address:', lead.officeAddress || lead.city || 'N/A', 'Assigned To:', lead.assignedTo?.name || 'Unassigned'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['KEY CONTACT & CORPORATE PROFILE', '', '', '']],
      body: contactRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [30, 41, 59] },
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38, fillColor: [241, 245, 249] },
        1: { cellWidth: 53 },
        2: { fontStyle: 'bold', cellWidth: 28, fillColor: [241, 245, 249] },
        3: { cellWidth: 63 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // AI Commercial Intelligence & Gaps
    const painPoints = lead.clientNeeds?.pain_points || lead.clientNeeds?.current_pain_points_and_gaps || [];
    const recommendedSolution = lead.recommendedSolution || lead.clientNeeds?.recommended_solution || 'Custom Enterprise Workflow & Automation Solutions';
    const coldPitch =
      lead.clientNeeds?.cold_pitch ||
      lead.clientNeeds?.pitch ||
      lead.coldPitch ||
      (lead.clientNeeds?.calling_talking_points && lead.clientNeeds.calling_talking_points.length > 0
        ? lead.clientNeeds.calling_talking_points[0]
        : null);
    const talkingPoints = lead.clientNeeds?.calling_talking_points || [];

    const intelRows: string[][] = [
      ['Business Summary', lead.businessSummary || lead.clientNeeds?.core_business_model || 'Commercial business entity identified through AI scanning.'],
    ];

    if (coldPitch) {
      intelRows.push(['Phone Opening Pitch', coldPitch]);
    }

    if (talkingPoints.length > 0) {
      intelRows.push(['Key Talking Points', talkingPoints.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n')]);
    }

    intelRows.push([
      'Detected Pain Points',
      painPoints.length > 0 ? painPoints.map((p) => `• ${p}`).join('\n') : 'Operations scalability, manual tracking, client discovery.',
    ]);
    intelRows.push(['Recommended Solution', recommendedSolution]);

    autoTable(doc, {
      startY: currentY,
      head: [['AI COMMERCIAL INTELLIGENCE & VALUE PROPOSITION', '']],
      body: intelRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42, fillColor: [241, 245, 249] },
        1: { cellWidth: 140 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Outreach & Call Notes
    const notesContent = lead.callNotes ? lead.callNotes : 'No outreach notes recorded yet.';
    const outreachRows = [
      ['Current Call Status', formatCallStatus(lead.callStatus)],
      ['Last Updated At', lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-IN') : 'N/A'],
      ['Outreach Notes', notesContent],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['OUTREACH LOGS & ENGAGEMENT NOTES', '']],
      body: outreachRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42, fillColor: [241, 245, 249] },
        1: { cellWidth: 140 },
      },
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('Hindustaan Innovations Private Limited • Confidential Client Executive Brief', margin, pageHeight - 7);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-IN')}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );

    const filename = `${lead.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Dossier.pdf`;

    if (mode === 'print') {
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        doc.save(filename);
        return { success: true, message: 'Print pop-up blocked. PDF downloaded instead.' };
      }
      return { success: true, message: 'Opening printable dossier preview...' };
    } else {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return { success: true, message: 'Lead dossier PDF downloaded.' };
    }
  } catch (error: any) {
    console.error('Failed to export lead dossier:', error);
    return { success: false, message: error?.message || 'Failed to generate PDF' };
  }
}
