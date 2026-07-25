import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export async function exportTaskAsPDF(task: any) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  (pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

  const dateStr = format(new Date(), 'yyyy_MM_dd');
  const filename = `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.pdf`;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DONE': return '#10b981';
      case 'REVIEW': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#374151'
    },
    header: (currentPage: number, pageCount: number) => {
      return {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'TwinPix Studio', fontSize: 14, bold: true, color: '#111827' },
          { text: `Exported: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, alignment: 'right', fontSize: 9, color: '#9ca3af' }
        ]
      };
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'TwinPix Studio Task Report', fontSize: 9, color: '#9ca3af' },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 9, color: '#9ca3af' }
        ]
      };
    },
    content: [
      { text: task.title, fontSize: 24, bold: true, color: '#111827', margin: [0, 0, 0, 10] },
      
      {
        columnGap: 10,
        columns: [
          { width: 'auto', text: task.status, fontSize: 9, bold: true, color: 'white', fillColor: getStatusColor(task.status), margin: [0, 0, 0, 15] },
        ]
      },
      
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'STATUS', fontSize: 8, bold: true, color: '#6b7280' },
              { text: 'PRIORITY', fontSize: 8, bold: true, color: '#6b7280' },
              { text: 'DUE DATE', fontSize: 8, bold: true, color: '#6b7280' },
              { text: 'ASSIGNEE', fontSize: 8, bold: true, color: '#6b7280' }
            ],
            [
              { text: task.status, bold: true, color: getStatusColor(task.status) },
              { text: task.priority, bold: true, color: getPriorityColor(task.priority) },
              { text: task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No date' },
              { text: task.assignee?.name || 'Unassigned' }
            ],
            [
              { text: 'CAMPAIGN', fontSize: 8, bold: true, color: '#6b7280', margin: [0, 10, 0, 0] },
              { text: 'PROJECT', fontSize: 8, bold: true, color: '#6b7280', margin: [0, 10, 0, 0] },
              { text: 'CLIENT', fontSize: 8, bold: true, color: '#6b7280', margin: [0, 10, 0, 0] },
              { text: 'REPORTER', fontSize: 8, bold: true, color: '#6b7280', margin: [0, 10, 0, 0] }
            ],
            [
              { text: task.campaign?.name || 'None' },
              { text: task.project?.name || 'None' },
              { text: task.campaign?.client?.companyName || task.project?.client?.companyName || 'None' },
              { text: task.reporter?.name || 'None' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      { text: 'Description', fontSize: 14, bold: true, color: '#111827', margin: [0, 10, 0, 5] },
      { text: task.description || 'No description provided.', margin: [0, 0, 0, 20], color: '#4b5563' },

      { text: 'Time Tracking', fontSize: 14, bold: true, color: '#111827', margin: [0, 10, 0, 5] },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: `Estimated: ${task.estimatedHours || 0}h`, margin: [0, 5, 0, 5] },
              { text: `Logged: ${task.actualHours || 0}h`, margin: [0, 5, 0, 5] }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      },

      ...(task.checklist && task.checklist.length > 0 ? [
        { text: 'Checklist', fontSize: 14, bold: true, color: '#111827', margin: [0, 10, 0, 5] },
        {
          ul: task.checklist.map((c: any) => ({
            text: `[${c.completed ? 'X' : ' '}] ${c.text}`,
            margin: [0, 2, 0, 2]
          })),
          margin: [0, 0, 0, 20]
        }
      ] : []),

      { text: 'Activity Timeline', fontSize: 14, bold: true, color: '#111827', margin: [0, 10, 0, 5] },
      ...((task.activities || []).map((a: any) => ({
        text: `• ${format(new Date(a.createdAt), 'MMM d, HH:mm')} - ${a.user?.name || 'System'} ${a.details}`,
        fontSize: 9,
        margin: [0, 2, 0, 2]
      }))),
      
      { text: 'Comments', fontSize: 14, bold: true, color: '#111827', margin: [0, 15, 0, 5] },
      ...((task.comments || []).map((c: any) => ({
        stack: [
          { text: `${c.user?.name || 'User'} - ${format(new Date(c.createdAt), 'MMM d, HH:mm')}`, bold: true, fontSize: 9 },
          { text: c.content, margin: [0, 2, 0, 10] }
        ]
      })))
    ]
  };

  pdfMake.createPdf(docDefinition).download(filename);
}

export async function exportTaskAsDOCX(task: any) {
  const dateStr = format(new Date(), 'yyyy_MM_dd');
  const filename = `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.docx`;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "TwinPix Studio Task Report",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `Exported: ${format(new Date(), 'MMM d, yyyy HH:mm')}`,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: task.title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.status })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Priority:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.priority })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Assignee:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.assignee?.name || 'Unassigned' })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reporter:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.reporter?.name || 'None' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Campaign:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.campaign?.name || 'None' })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: task.project?.name || 'None' })] }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: "Description",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: task.description || 'No description provided.',
          }),
          new Paragraph({
            text: "Checklist",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          ...(task.checklist || []).map((c: any) => 
            new Paragraph({ text: `[${c.completed ? 'X' : ' '}] ${c.text}` })
          ),
          new Paragraph({
            text: "Comments",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          ...(task.comments || []).map((c: any) => 
            new Paragraph({ text: `${c.user?.name || 'User'} (${format(new Date(c.createdAt), 'MMM d, HH:mm')}): ${c.content}` })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export function exportTaskAsMarkdown(task: any) {
  const dateStr = format(new Date(), 'yyyy_MM_dd');
  const filename = `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.md`;

  const md = `
# ${task.title}

**TwinPix Studio Task Report**
Exported: ${format(new Date(), 'MMM d, yyyy HH:mm')}

## Metadata
- **Status:** ${task.status}
- **Priority:** ${task.priority}
- **Assignee:** ${task.assignee?.name || 'Unassigned'}
- **Reporter:** ${task.reporter?.name || 'None'}
- **Campaign:** ${task.campaign?.name || 'None'}
- **Project:** ${task.project?.name || 'None'}
- **Client:** ${task.campaign?.client?.companyName || task.project?.client?.companyName || 'None'}
- **Due Date:** ${task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No date'}
- **Time Tracking:** ${task.estimatedHours || 0}h estimated, ${task.actualHours || 0}h logged.

## Description
${task.description || 'No description provided.'}

## Checklist
${(task.checklist || []).map((c: any) => `- [${c.completed ? 'x' : ' '}] ${c.text}`).join('\n')}

## Comments
${(task.comments || []).map((c: any) => `**${c.user?.name || 'User'}** (${format(new Date(c.createdAt), 'MMM d, HH:mm')}):  \n${c.content}`).join('\n\n')}

## Activity
${(task.activities || []).map((a: any) => `- ${format(new Date(a.createdAt), 'MMM d, HH:mm')} - ${a.user?.name || 'System'} ${a.details}`).join('\n')}
`;

  const blob = new Blob([md.trim()], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, filename);
}

export function exportTaskAsJSON(task: any) {
  const dateStr = format(new Date(), 'yyyy_MM_dd');
  const filename = `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.json`;

  const blob = new Blob([JSON.stringify(task, null, 2)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, filename);
}
