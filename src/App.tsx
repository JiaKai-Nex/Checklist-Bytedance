import React, { useState } from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  User,
  Settings,
  HelpCircle,
  FileText,
  BookmarkCheck,
  RotateCcw
} from 'lucide-react';
import { 
  ChecklistData, 
  ChecklistItemState, 
  CheckStandardItem, 
  CHECKLIST_ITEMS, 
  ChecklistChoice
} from './types';

// Default state initialization helper for the 22 check items
const createInitialChecklistState = (): Record<number, ChecklistItemState> => {
  const state: Record<number, ChecklistItemState> = {};
  CHECKLIST_ITEMS.forEach(item => {
    state[item.id] = {
      status: 'Yes',
      remarks: ''
    };
  });
  return state;
};

// Merged cells calculation for HTML rendering
const getRowSpanAttrs = (index: number) => {
  // index is 0-indexed corresponding to CHECKLIST_ITEMS (0 to 21)
  let showStage = false;
  let stageSpan = 1;
  let showItem = false;
  let itemSpan = 1;

  if (index === 0) {
    showStage = true;
    stageSpan = 3; // Before service (3 items)
  }
  if (index === 3) {
    showStage = true;
    stageSpan = 13; // During service (13 items)
  }
  if (index === 16) {
    showStage = true;
    stageSpan = 6; // After service (6 items)
  }

  // Item columns
  if (index === 0) { // Ticket information
    showItem = true;
    itemSpan = 1;
  }
  if (index === 1) { // Device information
    showItem = true;
    itemSpan = 1;
  }
  if (index === 2) { // Marking information
    showItem = true;
    itemSpan = 1;
  }
  if (index === 3) { // Shut down and restart
    showItem = true;
    itemSpan = 2;
  }
  if (index === 5) { // Aware on surrounding and peripheral
    showItem = true;
    itemSpan = 2;
  }
  if (index === 7) { // Updating Firmware
    showItem = true;
    itemSpan = 4;
  }
  if (index === 11) { // Replacement of spare parts
    showItem = true;
    itemSpan = 5;
  }
  if (index === 16) { // Maintenance checks
    showItem = true;
    itemSpan = 4;
  }
  if (index === 20) { // Customer confirmation
    showItem = true;
    itemSpan = 2;
  }

  return { showStage, stageSpan, showItem, itemSpan };
};

// PDF text wrapping helper (calculates line count for height check)
const getRowHeight = (text: string, maxWidth: number, fontSize: number, font: any) => {
  const paragraphs = text.split('\n');
  let lineCount = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && n > 0) {
        lineCount++;
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lineCount++;
  }
  return 8 + lineCount * (fontSize + 1.8);
};

// PDF dynamic wrapped text drawer
const drawWrappedText = (page: any, text: string, x: number, y: number, fontSize: number, maxWidth: number, font: any) => {
  const paragraphs = text.split('\n');
  let currentY = y;
  const lines: string[] = [];
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
  }
  
  for (const line of lines) {
    page.drawText(line, { x, y: currentY, size: fontSize, font });
    currentY -= (fontSize + 1.8);
  }
};

// PDF Wrapped & Horizontally + Vertically centered drawer in a rectangular cell boundary
const drawCellWrappedCentered = (page: any, text: string, x_left: number, width: number, y_bottom: number, height: number, font: any, fontSize: number) => {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  const maxWidth = width - 6; // Padding
  
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
  }
  
  const lineHeight = fontSize + 2.0;
  const textBlockHeight = lines.length * lineHeight;
  
  // Calculate top-aligned Y to vertically center the whole block
  let startY = y_bottom + (height + textBlockHeight) / 2.0 - fontSize;
  
  for (const line of lines) {
    const lineWidth = font.widthOfTextAtSize(line, fontSize);
    const x_pos = x_left + (width - lineWidth) / 2.0;
    page.drawText(line, { x: x_pos, y: startY, size: fontSize, font });
    startY -= lineHeight;
  }
};

export default function App() {
  const [data, setData] = useState<ChecklistData>({
    ticketNo: '',
    customerName: '',
    maintenanceTime: new Date().toISOString().split('T')[0],
    serverSn: '',
    signatureName: '',
    items: createInitialChecklistState()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mark all checklist standard items as Yes
  const handleMarkAllYes = () => {
    setData(prev => {
      const updatedItems = { ...prev.items };
      CHECKLIST_ITEMS.forEach(it => {
        updatedItems[it.id] = {
          ...updatedItems[it.id],
          status: 'Yes'
        };
      });
      return { ...prev, items: updatedItems };
    });
  };

  // Reset all choices
  const handleResetAll = () => {
    setData(prev => ({
      ...prev,
      items: createInitialChecklistState()
    }));
  };

  const handleUpdateItem = (id: number, field: keyof ChecklistItemState, value: any) => {
    setData(prev => {
      const updatedItems = { ...prev.items };
      updatedItems[id] = {
        ...updatedItems[id],
        [field]: value
      };
      return { ...prev, items: updatedItems };
    });
  };

  // horizontal line boundary logic
  const getHzLineStartX = (i: number) => {
    if (i === 2 || i === 15 || i === 21) return 20; // Full table width line
    if (i === 0 || i === 1 || i === 4 || i === 6 || i === 10 || i === 19) return 100; // Medium line (spans item to remarks)
    return 185; // Short line (spans check standard to remarks)
  };

  const generatePdf = async () => {
    if (!data.customerName) {
      setError("Please select a customer (Bytedance or Speed Matrix) from the dropdown first.");
      const element = document.getElementById("customer_select_field");
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]); // Landscape A4 Format
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Title Section
      page.drawText("Server After-Sales Maintenance On-Site Risk Identification Form", {
        x: 180,
        y: 572,
        size: 11,
        font: fontBold,
        color: rgb(0.08, 0.08, 0.08)
      });
      page.drawText("(Customer Version Checklist)", {
        x: 350,
        y: 558,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3)
      });

      // Draw client selection subtitle watermark on right corner
      page.drawText(data.customerName, {
        x: 740,
        y: 572,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.1)
      });

      // Table Geometry & Width definitions
      const tableWidth = 802;
      const x_no = 20;
      const x_stage = 40;
      const x_item = 100;
      const x_standard = 185;
      const x_status = 590;
      const x_remarks = 702;
      const x_end = 822;

      // Draw Row Header 0: Ticket & Customer Info Row spanning
      const header0Top = 540;
      const header0Bottom = 522;
      const header0Height = header0Top - header0Bottom;

      // Draw outer background/boxes for Row Header 0
      page.drawRectangle({
        x: x_no,
        y: header0Bottom,
        width: tableWidth,
        height: header0Height,
        borderWidth: 0.8,
        borderColor: rgb(0.08, 0.08, 0.08),
        color: rgb(0.96, 0.96, 0.94) // Slightly warm background fill
      });

      // Internal lines for Header 0
      page.drawLine({ start: { x: x_standard, y: header0Top }, end: { x: x_standard, y: header0Bottom }, thickness: 0.8, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_status, y: header0Top }, end: { x: x_status, y: header0Bottom }, thickness: 0.8, color: rgb(0.08, 0.08, 0.08) });

      // Texts inside Header 0
      page.drawText(`Ticket NO: ${data.ticketNo || 'N/A'}`, { x: x_no + 6, y: header0Bottom + 5, size: 7.5, font: fontBold });
      page.drawText(`Client: ${data.customerName}`, { x: x_standard + 10, y: header0Bottom + 5, size: 7.5, font: fontBold });
      page.drawText(`Status (Acknowledge) Checklist`, { x: x_status + 10, y: header0Bottom + 5, size: 7.5, font: fontBold });

      // Draw Row Header 1: Column Labels
      const header1Top = 522;
      const header1Bottom = 507;
      const header1Height = header1Top - header1Bottom;

      page.drawRectangle({
        x: x_no,
        y: header1Bottom,
        width: tableWidth,
        height: header1Height,
        borderWidth: 0.8,
        borderColor: rgb(0.08, 0.08, 0.08),
        color: rgb(0.92, 0.92, 0.90)
      });

      // Headers Texts
      page.drawText("No.", { x: x_no + 4, y: header1Bottom + 4, size: 7, font: fontBold });
      page.drawText("Stage", { x: x_stage + 18, y: header1Bottom + 4, size: 7, font: fontBold });
      page.drawText("Items", { x: x_item + 25, y: header1Bottom + 4, size: 7, font: fontBold });
      page.drawText("Check Standard", { x: x_standard + 120, y: header1Bottom + 4, size: 7, font: fontBold });
      page.drawText("Acknowledge or not", { x: x_status + 18, y: header1Bottom + 4, size: 7, font: fontBold });
      page.drawText("Remarks", { x: x_remarks + 40, y: header1Bottom + 4, size: 7, font: fontBold });

      // Calculate heights and bottom Y coordinates for all content rows starting from Y=507
      let currentY = 507;
      const rowY: number[] = [];
      const rowHeights: number[] = [];

      for (let i = 0; i < CHECKLIST_ITEMS.length; i++) {
        const item = CHECKLIST_ITEMS[i];
        // Standard column width is 405 (from 185 to 590), let's wrap at width 395
        const h = Math.max(16, getRowHeight(item.standard, 395, 6, font));
        rowHeights.push(h);
        rowY.push(currentY - h);
        currentY -= h;
      }

      // Draw horizontal separators and grid cells for each row
      for (let i = 0; i < CHECKLIST_ITEMS.length; i++) {
        const item = CHECKLIST_ITEMS[i];
        const rY = rowY[i];
        const rH = rowHeights[i];
        const midY = rY + rH / 2.0;

        // Save selected choices
        const state = data.items[item.id] || { status: null, remarks: '' };

        // Draw Row Check Standard text (wrapped)
        drawWrappedText(page, item.standard, x_standard + 5, rY + rH - 10, 6, 395, font);

        // Draw Status Choice (☐ Yes   ☐ No)
        const y_chk = midY - 3;
        const x_yes_box = x_status + 22;
        const x_no_box = x_status + 66;

        // Draw "Yes" option
        page.drawRectangle({ x: x_yes_box, y: y_chk, width: 6, height: 6, borderWidth: 0.5, borderColor: rgb(0,0,0) });
        page.drawText('Yes', { x: x_yes_box + 10, y: y_chk, size: 6, font });
        if (state.status === 'Yes') {
          page.drawText('X', { x: x_yes_box + 1, y: y_chk + 1, size: 5, font: fontBold });
        }

        // Draw "No" option
        page.drawRectangle({ x: x_no_box, y: y_chk, width: 6, height: 6, borderWidth: 0.5, borderColor: rgb(0,0,0) });
        page.drawText('No', { x: x_no_box + 10, y: y_chk, size: 6, font });
        if (state.status === 'No') {
          page.drawText('X', { x: x_no_box + 1, y: y_chk + 1, size: 5, font: fontBold });
        }

        // Draw Row Remarks text (wrapped within width 110)
        if (state.remarks) {
          drawWrappedText(page, state.remarks, x_remarks + 5, rY + rH - 10, 5.5, 110, font);
        }

        // Draw Row horizontal line separator
        const startLineX = getHzLineStartX(i);
        page.drawLine({
          start: { x: startLineX, y: rY },
          end: { x: x_end, y: rY },
          thickness: 0.5,
          color: rgb(0.1, 0.1, 0.1)
        });
      }

      // Draw horizontal lines representing cell spans for Stage Column (Columns 1 & 2)
      // Top of Table line
      page.drawLine({ start: { x: x_no, y: 507 }, end: { x: x_end, y: 507 }, thickness: 0.8, color: rgb(0.08, 0.08, 0.08) });

      // Spanning column cell drawing: Stage 1 (Before service)
      const topStage1 = 507;
      const bottomStage1 = rowY[2]; // rowY of index 2
      const heightStage1 = topStage1 - bottomStage1;
      drawCellWrappedCentered(page, "1", x_no, 20, bottomStage1, heightStage1, fontBold, 7);
      drawCellWrappedCentered(page, "Before\nservice", x_stage, 60, bottomStage1, heightStage1, fontBold, 6.5);

      // Spanning column cell drawing: Stage 2 (During service)
      const topStage2 = bottomStage1;
      const bottomStage2 = rowY[15]; // rowY of index 15
      const heightStage2 = topStage2 - bottomStage2;
      drawCellWrappedCentered(page, "2", x_no, 20, bottomStage2, heightStage2, fontBold, 7);
      drawCellWrappedCentered(page, "During\nservice", x_stage, 60, bottomStage2, heightStage2, fontBold, 6.5);

      // Spanning column cell drawing: Stage 3 (After service)
      const topStage3 = bottomStage2;
      const bottomStage3 = rowY[21]; // rowY of index 21
      const heightStage3 = topStage3 - bottomStage3;
      drawCellWrappedCentered(page, "3", x_no, 20, bottomStage3, heightStage3, fontBold, 7);
      drawCellWrappedCentered(page, "After\nservice", x_stage, 60, bottomStage3, heightStage3, fontBold, 6.5);

      // Spanning ITEM cells drawing
      // 1. Ticket info
      drawCellWrappedCentered(page, "Ticket information", x_item, 85, rowY[0], 507 - rowY[0], font, 6);
      // 2. Device info
      drawCellWrappedCentered(page, "Device information", x_item, 85, rowY[1], rowY[0] - rowY[1], font, 6);
      // 3. Marking info
      drawCellWrappedCentered(page, "Marking information", x_item, 85, rowY[2], rowY[1] - rowY[2], font, 6);
      // 4. Shut down and restart
      drawCellWrappedCentered(page, "Shut down and restart", x_item, 85, rowY[4], rowY[2] - rowY[4], font, 6);
      // 5. Aware on surrounding and peripheral
      drawCellWrappedCentered(page, "Aware on surrounding\nand peripheral", x_item, 85, rowY[6], rowY[4] - rowY[6], font, 6);
      // 6. Updating Firmware
      drawCellWrappedCentered(page, "Updating Firmware", x_item, 85, rowY[10], rowY[6] - rowY[10], font, 6);
      // 7. Replacement of spare parts
      drawCellWrappedCentered(page, "Replacement of\nspare parts", x_item, 85, rowY[15], rowY[10] - rowY[15], font, 6);
      // 8. Maintenance checks
      drawCellWrappedCentered(page, "Maintenance checks", x_item, 85, rowY[19], rowY[15] - rowY[19], font, 6);
      // 9. Customer confirmation
      drawCellWrappedCentered(page, "Customer confirmation", x_item, 85, rowY[21], rowY[19] - rowY[21], font, 6);

      // Draw all vertical lines of the table
      const bottomTableY = rowY[21];
      page.drawLine({ start: { x: x_no, y: 522 }, end: { x: x_no, y: bottomTableY }, thickness: 0.8, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_stage, y: 522 }, end: { x: x_stage, y: bottomTableY }, thickness: 0.5, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_item, y: 522 }, end: { x: x_item, y: bottomTableY }, thickness: 0.5, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_standard, y: 522 }, end: { x: x_standard, y: bottomTableY }, thickness: 0.5, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_status, y: 522 }, end: { x: x_status, y: bottomTableY }, thickness: 0.5, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_remarks, y: 522 }, end: { x: x_remarks, y: bottomTableY }, thickness: 0.5, color: rgb(0.08, 0.08, 0.08) });
      page.drawLine({ start: { x: x_end, y: 522 }, end: { x: x_end, y: bottomTableY }, thickness: 0.8, color: rgb(0.08, 0.08, 0.08) });

      // Warnings & Remarks Guideline Section at bottom
      let warningsY = bottomTableY - 10;
      page.drawText("Remarks:", { x: x_no, y: warningsY, size: 6.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      warningsY -= 8;
      page.drawText("1. The operation process should not violate the regulations of the hand-written \"Red line operations\"", { x: x_no, y: warningsY, size: 5.8, font, color: rgb(0.2, 0.2, 0.2) });
      warningsY -= 8;
      page.drawText("2. The operation process should not violate the regulations of the datacenter and customer requirements", { x: x_no, y: warningsY, size: 5.8, font, color: rgb(0.2, 0.2, 0.2) });
      warningsY -= 8;
      page.drawText("3. Select \"no-operation\" in the \"complete or not\" column if the relevant operation is not performed, fill in the reason in the \"remarks\" column if \"no\" is selected for any item", { x: x_no, y: warningsY, size: 5.8, font, color: rgb(0.2, 0.2, 0.2) });
      warningsY -= 8;
      page.drawText("4. After the ticket is completed, the engineer needs to submit the PDF of the inspection checklist signed by himself or the photos for centralized filing.", { x: x_no, y: warningsY, size: 5.8, font, color: rgb(0.2, 0.2, 0.2) });

      // Symmetrically aligned metadata info at bottom right: SN & Date
      let metaY = bottomTableY - 14;
      page.drawText(`Server SN: ${data.serverSn || '--'}`, { x: 550, y: metaY, size: 6.5, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      metaY -= 8;
      page.drawText(`Maintenance Date: ${data.maintenanceTime}`, { x: 550, y: metaY, size: 6.5, font, color: rgb(0.3, 0.3, 0.3) });

      // Signatures Underline row at the absolute footer
      const sigY = 22;
      page.drawText("Signature of maintenance engineer:" + (data.signatureName || ""), { x: x_no, y: sigY, size: 7.5, font: fontBold });
      page.drawLine({ start: { x: x_no + 138, y: sigY - 2 }, end: { x: x_no + 260, y: sigY - 2 }, thickness: 0.5, color: rgb(0.1, 0.1, 0.1) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Server_Maintenance_Checklist_${data.customerName.replace(/\s+/g, '_')}_${data.maintenanceTime}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate PDF: ${err?.message || String(err)}. Please check for unsupported characters in input fields.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', color: '#111827', padding: '16px' }} className="font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Block */}
        <header className="mb-6 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-wider">Audit Desk</span>
              <span className="text-[10px] text-gray-400 font-mono">v2.1</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mt-1">Server Maintenance Inspection Checklist</h1>
            <p className="text-xs text-gray-500 mt-0.5">Dual-mode high fidelity PDF Generator & Audit Tracker conforming strictly to field requirements</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllYes}
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex items-center gap-1.5 transition-all active:scale-95"
              title="Mark all 22 standards as Yes to draft checklist quickly"
            >
              <BookmarkCheck size={14} /> Mark All Yes
            </button>
            <button 
              onClick={handleResetAll}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-1.5 transition-all active:scale-95"
              title="Reset all fields to blank"
            >
              <RotateCcw size={14} /> Reset All
            </button>
          </div>
        </header>

        {/* Outer Form & List layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Column 1: Config sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 flex items-center gap-2">
                <Settings size={14} /> Ticket Logistics
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Ticket NO</label>
                  <input 
                    type="text" 
                    value={data.ticketNo}
                    onChange={e => setData(prev => ({ ...prev, ticketNo: e.target.value }))}
                    placeholder="Enter Ticket Number"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Customer Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={15} />
                    <select 
                      id="customer_select_field"
                      value={data.customerName}
                      onChange={e => setData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-800"
                    >
                      <option value="" disabled>Select Customer</option>
                      <option value="Bytedance">Bytedance</option>
                      <option value="Speed Matrix">Speed Matrix</option>
                       <option value="Shopee">Shopee</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Server SN(s)</label>
                  <input 
                    type="text" 
                    value={data.serverSn}
                    onChange={e => setData(prev => ({ ...prev, serverSn: e.target.value }))}
                    placeholder="eg. SN1294819"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Maintenance Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={15} />
                    <input 
                      type="date" 
                      value={data.maintenanceTime}
                      onChange={e => setData(prev => ({ ...prev, maintenanceTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Engineer Signature</label>
                  <input 
                    type="text" 
                    value={data.signatureName}
                    onChange={e => setData(prev => ({ ...prev, signatureName: e.target.value }))}
                    placeholder="Enter engineer name"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
            </section>

            <button 
              onClick={generatePdf}
              disabled={isGenerating}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download size={18} />
                  Generate PDF
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 flex items-start gap-2 shadow-sm">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-amber-50/75 p-5 rounded-xl border border-amber-100 shadow-sm">
              <h3 className="text-[10px] uppercase font-bold text-amber-800 mb-2 flex items-center gap-1">
                <HelpCircle size={12} className="text-amber-700" /> Compliance Notes
              </h3>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Choose either <strong>Bytedance</strong> or <strong>Speed Matrix</strong> to enable PDF export. Make sure each row is checked <strong>Yes</strong> or <strong>No</strong> and any corrective entries are annotated in the Remarks input.
              </p>
            </div>
          </div>

          {/* Column 2: The Main Interactive Spreadsheet Table */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase w-12 text-center">No.</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase w-28 text-center border-l border-gray-200/50">Stage</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase w-44 text-center border-l border-gray-200/50">Item</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase border-l border-gray-200/50">Check Standard</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase w-48 text-center border-l border-gray-200/50">Acknowledge</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase w-44 border-l border-gray-200/50">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {CHECKLIST_ITEMS.map((item, index) => {
                      const { showStage, stageSpan, showItem, itemSpan } = getRowSpanAttrs(index);
                      const state = data.items[item.id] || { status: null, remarks: '' };

                      // Inline background based on stage
                      let bgClass = "bg-white";
                      if (item.stageNum === 1) bgClass = "bg-blue-50/5 hover:bg-blue-50/20";
                      if (item.stageNum === 2) bgClass = "bg-green-50/5 hover:bg-green-50/15";
                      if (item.stageNum === 3) bgClass = "bg-purple-50/5 hover:bg-purple-50/15";

                      return (
                        <tr key={item.id} className={`${bgClass} transition-colors align-middle`}>
                          
                          {/* Merged Stage No */}
                          {showStage ? (
                            <td 
                              rowSpan={stageSpan} 
                              className="px-3 py-2 text-center text-sm font-bold text-gray-700 bg-gray-50 border-r border-gray-250 border-b border-gray-200 align-middle"
                            >
                              {item.stageNum}
                            </td>
                          ) : null}

                          {/* Merged Stage Label */}
                          {showStage ? (
                            <td 
                              rowSpan={stageSpan} 
                              className="px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase bg-gray-50 border-r border-gray-250 border-b border-gray-200 align-middle leading-tight"
                            >
                              {item.stage}
                            </td>
                          ) : null}

                          {/* Merged Checklist Item Category */}
                          {showItem ? (
                            <td 
                              rowSpan={itemSpan} 
                              className="px-4 py-3 text-center text-[11px] font-semibold text-gray-700 bg-gray-50/40 border-r border-gray-200 border-b border-gray-200 align-middle leading-tight"
                            >
                              {item.item}
                            </td>
                          ) : null}

                          {/* General Check Standard */}
                          <td className="px-4 py-3.5 text-xs text-gray-700 leading-normal border-r border-gray-100">
                            {item.standard}
                          </td>

                          {/* Choices Selector */}
                          <td className="px-3 py-2 text-center border-r border-gray-100">
                            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 shadow-inner">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, 'status', 'Yes')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  state.status === 'Yes'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-950'
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, 'status', 'No')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  state.status === 'No'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-950'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </td>

                          {/* Inline Remarks Input */}
                          <td className="px-3 py-2">
                            <input 
                              type="text"
                              value={state.remarks}
                              onChange={e => handleUpdateItem(item.id, 'remarks', e.target.value)}
                              placeholder="Add annotations..."
                              className="w-full px-2 py-1 bg-gray-50 border border-gray-150 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-gray-800"
                            />
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Guideline Checklist Remarks in App UI too for extreme high precision */}
              <div className="bg-gray-50 p-6 border-t border-gray-200 text-xs text-gray-500 space-y-2">
                <p className="font-bold text-gray-700">Remarks:</p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>The operation process should not violate the regulations of the hand-written "Red line operations".</li>
                  <li>The operation process should not violate the regulations of the datacenter and customer requirements.</li>
                  <li>Select "no-operation" in the "complete or not" column if the relevant operation is not performed, fill in the reason in the "remarks" column if "no" is selected for any item.</li>
                  <li>After the ticket is completed, the engineer needs to submit the PDF of the inspection checklist signed by himself or the photos for centralized filing.</li>
                </ol>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
