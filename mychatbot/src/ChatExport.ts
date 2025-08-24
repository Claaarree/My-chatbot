import jsPDF from 'jspdf';
import { ChatSession } from './types';

export async function saveFileWithPicker(blob: Blob, suggestedName: string, mimeType: string): Promise<'success' | 'cancelled' | 'unsupported'> {
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Export file',
          accept: { [mimeType]: [`.${suggestedName.split('.').pop()}`] }
        }]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'success';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
      console.error('Error saving file:', err);
      return 'unsupported';
    }
  }
  return 'unsupported';
}

export function getExportContent(currentSession: ChatSession, format: 'json' | 'txt' | 'csv') {
  let content: string;
  let mimeType: string;
  let fileExtension: string;
  switch (format) {
    case 'txt':
      content = `Chat Export: ${currentSession.name}\nExported: ${new Date().toLocaleString()}\n\n` +
        currentSession.messages.map(msg => {
          const time = new Date(msg.timestamp).toLocaleString();
          const sender = msg.sender === 'user' ? 'You' : 'Bot';
          return `[${time}] ${sender}: ${msg.text}`;
        }).join('\n\n');
      mimeType = 'text/plain';
      fileExtension = 'txt';
      break;
    case 'csv':
      const csvHeader = 'Timestamp,Sender,Message\n';
      const csvRows = currentSession.messages.map(msg => {
        const timestamp = new Date(msg.timestamp).toISOString();
        const sender = msg.sender === 'user' ? 'User' : 'Bot';
        const message = `"${msg.text.replace(/"/g, '""')}"`;
        return `${timestamp},${sender},${message}`;
      }).join('\n');
      content = csvHeader + csvRows;
      mimeType = 'text/csv';
      fileExtension = 'csv';
      break;
    default:
      const exportData = {
        sessionName: currentSession.name,
        exportDate: new Date().toISOString(),
        messages: currentSession.messages.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp
        }))
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
      break;
  }
  return { content, mimeType, fileExtension };
}

export async function exportSessionAsPDF(currentSession: ChatSession, filename: string): Promise<'success' | 'cancelled' | 'unsupported'> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - 2 * margin;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(`Chat Export: ${currentSession.name}`, margin, 30);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, 40);
  let yPosition = 60;
  const lineHeight = 6;
  const messageSpacing = 12;
  currentSession.messages.forEach((msg) => {
    const time = new Date(msg.timestamp).toLocaleString();
    const sender = msg.sender === 'user' ? 'You' : 'Bot';
    const header = `[${time}] ${sender}:`;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 30;
    }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(header, margin, yPosition);
    yPosition += lineHeight;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(msg.text, maxLineWidth) as string[];
    splitText.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += messageSpacing;
  });
  const pdfBlob = doc.output('blob');
  const saveResult = await saveFileWithPicker(pdfBlob, filename, 'application/pdf');
  if (saveResult === 'unsupported') doc.save(filename);
  return saveResult;
}