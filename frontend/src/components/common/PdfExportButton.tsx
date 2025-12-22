import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF } from '@/utils/pdf';

interface PdfExportButtonProps {
  elementId: string;
  filename?: string;
  title?: string;
  buttonText?: string;
  className?: string;
}

/**
 * Bouton pour exporter du contenu en PDF
 * Génère un PDF professionnel avec en-tête, date d'exportation et pied de page
 */
export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  elementId,
  filename = 'export.pdf',
  title = 'Rapport OGSL Data Portal',
  buttonText = 'Exporter en PDF',
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(elementId, filename, title);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exportation...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
};


