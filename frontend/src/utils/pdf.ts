import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatExportDate = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return now.toLocaleDateString('fr-FR', options);
};

const addHeader = (pdf: jsPDF, title: string): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text('OGSL Data Portal', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, pageWidth / 2, 25, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Date d'exportation : ${formatExportDate()}`, pageWidth / 2, 32, { align: 'center' });
  
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, 35, pageWidth - 10, 35);
  
  return 40;
};

const addFooter = (pdf: jsPDF, pageNumber: number, totalPages: number): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Page ${pageNumber} sur ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  
  pdf.text(
    'Généré par OGSL Data Portal - TP02 INF37407',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );
};

export const exportToPDF = async (
  elementId: string,
  filename: string = 'export.pdf',
  title: string = 'Rapport OGSL Data Portal'
): Promise<void> => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'pdf-loading';
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      text-align: center;
      font-family: sans-serif;
    `;
    loadingDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        📄 Génération du PDF...
      </div>
      <div style="color: #666;">Veuillez patienter</div>
    `;
    document.body.appendChild(loadingDiv);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(loadingDiv);

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const startY = addHeader(pdf, title);
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const availableHeight = pageHeight - startY - 20;
    
    let heightLeft = imgHeight;
    let position = startY;
    let pageNumber = 1;
    let totalPages = Math.ceil(imgHeight / availableHeight);

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    addFooter(pdf, pageNumber, totalPages);
    
    heightLeft -= availableHeight;

    while (heightLeft > 0) {
      pageNumber++;
      position = startY - (imgHeight - heightLeft);
      pdf.addPage();
      
      addHeader(pdf, title);
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      addFooter(pdf, pageNumber, totalPages);
      
      heightLeft -= availableHeight;
    }

    pdf.save(filename);
    
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      font-family: sans-serif;
      font-weight: bold;
    `;
    successDiv.innerHTML = '✅ PDF généré avec succès !';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    const loadingDiv = document.getElementById('pdf-loading');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      font-family: sans-serif;
      font-weight: bold;
    `;
    errorDiv.innerHTML = '❌ Erreur lors de la génération du PDF';
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 3000);
    
    throw error;
  }
};

export const exportDataToPDF = (
  data: any[],
  title: string,
  filename: string = 'data-export.pdf'
): void => {
  const pdf = new jsPDF();
  
  addHeader(pdf, title);
  
  let yPosition = 45;
  pdf.setFontSize(10);
  
  data.forEach((item, index) => {
    if (yPosition > 270) {
      pdf.addPage();
      addHeader(pdf, title);
      yPosition = 45;
    }
    
    pdf.text(`${index + 1}. ${JSON.stringify(item)}`, 14, yPosition);
    yPosition += 10;
  });
  
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }
  
  pdf.save(filename);
};
