'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateShortUUID } from '@/lib/utils';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { ChevronDown, Eye } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import * as XLSX from 'xlsx';

interface QRData {
  id: string;
  content: string;
  remark: string;
}

interface QRSettings {
  size: number;
  level: 'L' | 'M' | 'Q' | 'H';
  includeText: boolean;
  fgColor: string;
  bgColor: string;
}

interface PreviewData {
  qrCode: string;
  content: string;
  remark: string;
}

export default function QRCodePage() {
  const [qrData, setQRData] = useState<QRData[]>([]);
  const [qrSettings, setQRSettings] = useState<QRSettings>({
    size: 5,
    level: 'H',
    includeText: true,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
  });
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      const response = await fetch('/fonts/NotoSansSC-Regular.ttf');
      const fontBuffer = await response.arrayBuffer();
      const font = await import('jspdf').then(({ default: jsPDF }) => {
        jsPDF.API.events.push([
          'addFonts',
          function (this: any) {
            this.addFileToVFS('NotoSansSC-Regular.ttf', Buffer.from(fontBuffer).toString('base64'));
            this.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
          },
        ]);
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      const qrResults = rows
        .filter((row) => row[0] && row[0].toString().trim() !== '')
        .map((row) => ({
          id: crypto.randomUUID(),
          content: row[0].toString(),
          remark: row[1] ? row[1].toString() : '',
        }));

      setQRData(qrResults);
    };
    reader.readAsBinaryString(file);
  };

  const updateRemark = (id: string, remark: string) => {
    setQRData(qrData.map((item) => (item.id === id ? { ...item, remark } : item)));
  };

  const downloadText = () => {
    const text = qrData.map((item) => `${item.content}${item.remark ? ` - ${item.remark}` : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-contents.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadQRCode = (content: string, id: string) => {
    const canvas = document.querySelector(`#qr-${id}`) as HTMLCanvasElement;
    if (!canvas) return;

    const item = qrData.find((d) => d.id === id);
    const fileName = item?.remark ? item.remark : content;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generatePDF = async (forPreview = false) => {
    if (!fontLoaded) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'cm',
      format: 'a4',
    });

    pdf.setFont('NotoSansSC');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 1;
    const qrSize = qrSettings.size;
    const spacing = 0.5;
    const textHeight = qrSettings.includeText ? 0.8 : 0;
    const remarkHeight = 1.0;
    const rowHeight = qrSize + textHeight + remarkHeight + spacing;
    const itemsPerRow = Math.floor((pageWidth - 2 * margin) / (qrSize + spacing));
    const itemsPerPage = itemsPerRow * Math.floor((pageHeight - 2 * margin) / rowHeight);

    for (let i = 0; i < qrData.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
      }

      const pageIndex = Math.floor(i / itemsPerPage);
      const indexOnPage = i % itemsPerPage;
      const row = Math.floor(indexOnPage / itemsPerRow);
      const col = indexOnPage % itemsPerRow;

      const totalWidth = itemsPerRow * (qrSize + spacing) - spacing;
      const startX = (pageWidth - totalWidth) / 2;
      const x = startX + col * (qrSize + spacing);
      const y = margin + row * rowHeight;

      const canvas = document.querySelector(`#qr-${qrData[i].id}`) as HTMLCanvasElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

        let currentY = y + qrSize;

        if (qrSettings.includeText) {
          pdf.setFontSize(8);
          pdf.setFont('NotoSansSC');
          const text = qrData[i].content;
          const textWidth = (pdf.getStringUnitWidth(text) * 8) / pdf.internal.scaleFactor;
          const textX = x + (qrSize - textWidth) / 2;
          currentY += 0.5;
          pdf.text(text, textX, currentY);
        }

        if (qrData[i].remark) {
          pdf.setFontSize(10);
          pdf.setFont('NotoSansSC');
          const remarkWidth = (pdf.getStringUnitWidth(qrData[i].remark) * 10) / pdf.internal.scaleFactor;
          const remarkX = x + (qrSize - remarkWidth) / 2;
          currentY += qrSettings.includeText ? 0.8 : 0.5;
          pdf.text(qrData[i].remark, remarkX, currentY);
        }
      }
    }

    if (forPreview) {
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      return url;
    }

    pdf.save('qr-codes.pdf');
  };

  const handlePreviewPDF = async () => {
    await generatePDF(true);
  };

  const downloadAllAsPDF = async () => {
    await generatePDF(false);
  };

  const downloadAsZip = async (type: 'png' | 'svg') => {
    const zip = new JSZip();

    for (const item of qrData) {
      const fileName = item.remark + generateShortUUID(5) || item.content + generateShortUUID(5);

      if (type === 'png') {
        const canvas = document.querySelector(`#qr-${item.id}`) as HTMLCanvasElement;
        if (canvas) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
          zip.file(`qrcode-${fileName}.png`, blob);
        }
      } else {
        const svg = <QRCodeSVG value={item.content} size={qrSettings.size * 37.8} level={qrSettings.level} fgColor={qrSettings.fgColor} bgColor={qrSettings.bgColor} />;
        const svgString = ReactDOMServer.renderToString(svg);
        zip.file(`qrcode-${fileName}.svg`, svgString);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcodes-${type}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = (value: string) => {
    switch (value) {
      case 'pdf':
        downloadAllAsPDF();
        break;
      case 'text':
        downloadText();
        break;
      case 'png':
        downloadAsZip('png');
        break;
      case 'svg-one-by-one':
        downloadAsZip('svg');
        break;
      default:
        break;
    }
  };

  const handlePreview = (id: string) => {
    const item = qrData.find((d) => d.id === id);

    if (!item) {
      return;
    }

    setPreviewData({
      qrCode: id,
      content: item.content,
      remark: item.remark,
    });
  };

  return (
    <div className='container mx-auto p-4'>
      <div className='hidden'>
        {qrData.map((item) => (
          <QRCodeCanvas
            key={item.id}
            id={`qr-${item.id}`}
            value={item.content}
            size={qrSettings.size * 37.8}
            level={qrSettings.level}
            marginSize={1}
            fgColor={qrSettings.fgColor}
            bgColor={qrSettings.bgColor}
          />
        ))}
      </div>

      <h1 className='mb-4 font-semibold text-2xl'>QR Code Generator</h1>

      <div className='mb-4 space-y-4'>
        <div className='flex gap-4'>
          <div className='w-1/3'>
            <Label className='mb-1 block font-medium text-sm'>QR Code Size (cm)</Label>
            <Input type='number' value={qrSettings.size} onChange={(e) => setQRSettings({ ...qrSettings, size: Number(e.target.value) })} min={1} max={10} step={0.5} />
          </div>
          <div className='w-1/3'>
            <Label className='mb-1 block font-medium text-sm'>Error Correction Level</Label>
            <Select value={qrSettings.level} onValueChange={(value) => setQRSettings({ ...qrSettings, level: value as 'L' | 'M' | 'Q' | 'H' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='L'>Low (7%)</SelectItem>
                <SelectItem value='M'>Medium (15%)</SelectItem>
                <SelectItem value='Q'>Quartile (25%)</SelectItem>
                <SelectItem value='H'>High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-1/3'>
            <Label className='mb-1 block font-medium text-sm'>Include Text in PDF</Label>
            <Select value={qrSettings.includeText.toString()} onValueChange={(value) => setQRSettings({ ...qrSettings, includeText: value === 'true' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='true'>Yes</SelectItem>
                <SelectItem value='false'>No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-1/3'>
            <Label className='mb-1 block font-medium text-sm'>QR Code Color</Label>
            <Input type='color' value={qrSettings.fgColor} onChange={(e) => setQRSettings({ ...qrSettings, fgColor: e.target.value })} className='h-10 w-full' />
          </div>
          <div className='w-1/3'>
            <Label className='mb-1 block font-medium text-sm'>Background Color</Label>
            <Input type='color' value={qrSettings.bgColor} onChange={(e) => setQRSettings({ ...qrSettings, bgColor: e.target.value })} className='h-10 w-full' />
          </div>
        </div>

        <Input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} />
      </div>

      {qrData.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-end justify-end gap-4'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' onClick={handlePreviewPDF}>
                  <Eye className='mr-2 h-4 w-4' />
                  Preview PDF
                </Button>
              </DialogTrigger>
              <DialogContent className='w-full max-w-4xl'>
                <DialogHeader>
                  <DialogTitle>PDF Preview</DialogTitle>
                </DialogHeader>
                <div className='relative w-full' style={{ height: 'calc(90vh - 80px)' }}>
                  {pdfPreviewUrl && <iframe src={pdfPreviewUrl} className='absolute inset-0 h-full w-full rounded-lg border' title='PDF Preview' />}
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  <span>Download</span>
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDownload('pdf')} className='cursor-pointer'>
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('png')} className='cursor-pointer'>
                  Download all PNGs as ZIP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('svg-one-by-one')} className='cursor-pointer'>
                  Download all SVGs as ZIP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('text')} className='cursor-pointer'>
                  Download as Text (No QR Code)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.content}</TableCell>
                    <TableCell>
                      <Input value={item.remark} onChange={(e) => updateRemark(item.id, e.target.value)} placeholder='Add a remark...' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant='outline' onClick={() => handlePreview(item.id)}>
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>QR Code Preview</DialogTitle>
                            </DialogHeader>
                            <div className='flex flex-col items-center space-y-4 p-4'>
                              {previewData && (
                                <>
                                  <p className='font-medium text-sm'>{previewData.content}</p>
                                  <QRCodeCanvas
                                    value={previewData.content}
                                    size={qrSettings.size * 37.8}
                                    level={qrSettings.level}
                                    marginSize={1}
                                    fgColor={qrSettings.fgColor}
                                    bgColor={qrSettings.bgColor}
                                  />
                                  {previewData.remark && <p className='text-gray-500 text-sm'>{previewData.remark}</p>}
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant='outline' onClick={() => downloadQRCode(item.content, item.id)}>
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className='text-right'>{qrData.length} items</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
