/**
 * PDF Export utilities for SunPath & Shadow Simulator
 * Note: Requires jsPDF and html2canvas libraries
 */

import type { SolarCalculationResponse } from './api';

export async function exportToPDF(solarData: SolarCalculationResponse): Promise<void> {
  try {
    // Dynamic import for PDF libraries (optional, only load when needed)
    const jsPDF = await import('jspdf');

    const doc = new jsPDF.default('p', 'mm', 'a4');
    const margin = 15;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 102, 204);
    doc.text('SunPath & Shadow Simulator', margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, margin, 27);

    let yPos = 35;

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    const summary = solarData.summary;
    const summaryItems = [
      `Location: ${solarData.series[0]?.shadow?.coordinates?.[0] || 'N/A'}`,
      `Sunrise: ${summary.sunrise || 'N/A'}`,
      `Sunset: ${summary.sunset || 'N/A'}`,
      `Solar Noon: ${summary.solar_noon || 'N/A'}`,
      `Day Length: ${summary.day_length || 'N/A'}`,
      `Max Altitude: ${summary.max_altitude.toFixed(1)}°`,
      `Total Irradiance: ${summary.total_irradiance?.toFixed(2) || 'N/A'} kWh/m²`
    ];

    summaryItems.forEach(item => {
      doc.text(`• ${item}`, margin + 5, yPos);
      yPos += 6;
    });

    // Add new page for chart
    doc.addPage();
    yPos = 15;

    // Note: For actual chart rendering, you would need to:
    // 1. Take screenshot of the chart component
    // 2. Convert to canvas using html2canvas
    // 3. Add to PDF
    
    // For now, add a placeholder note
    doc.setFontSize(14);
    doc.text('Solar Path Data', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text('Note: Chart rendering requires additional implementation', margin, yPos);
    yPos += 10;
    doc.text('using html2canvas for screenshot capture.', margin, yPos);

    // Save PDF
    doc.save(`sunpath-report-${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('PDF export failed. Please ensure jsPDF and html2canvas are installed.');
  }
}

/**
 * Simple text-based PDF export (lightweight, no dependencies)
 */
export async function exportToPDFSimple(solarData: SolarCalculationResponse): Promise<void> {
  try {
    const jsPDF = await import('jspdf');
    
    const doc = new jsPDF.default('p', 'mm', 'a4');
    const margin = 15;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text('SunPath & Shadow Simulator Report', margin, yPos);
    yPos += 10;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString('ko-KR')}`, margin, yPos);
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const summary = solarData.summary;
    
    const lines = [
      `Sunrise: ${summary.sunrise}`,
      `Sunset: ${summary.sunset}`,
      `Solar Noon: ${summary.solar_noon}`,
      `Day Length: ${summary.day_length}`,
      `Max Altitude: ${summary.max_altitude.toFixed(1)}°`,
      `Total Irradiance: ${summary.total_irradiance?.toFixed(2)} kWh/m²`,
      `Data Points: ${solarData.series.length}`
    ];

    lines.forEach(line => {
      doc.text(`• ${line}`, margin + 5, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Data Table Header
    doc.setFontSize(12);
    doc.text('Detailed Data', margin, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.text('Time | Altitude | Azimuth | GHI', margin, yPos);
    yPos += 5;

    // Sample data (first 20 points)
    const sampleData = solarData.series.slice(0, 20);
    sampleData.forEach((point, _idx) => {
      if (yPos > 270) { // Approx page height
        doc.addPage();
        yPos = 15;
      }

      const time = point.timestamp.split('T')[1].substring(0, 5);
      const alt = point.sun.altitude.toFixed(1);
      const azi = point.sun.azimuth.toFixed(1);
      const ghi = point.irradiance?.ghi?.toFixed(0) || 'N/A';

      doc.text(`${time} | ${alt}° | ${azi}° | ${ghi} W/m²`, margin, yPos);
      yPos += 5;
    });

    if (solarData.series.length > 20) {
      yPos += 5;
      doc.text(`... and ${solarData.series.length - 20} more data points`, margin, yPos);
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`sunpath-report-${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('PDF export error:', error);
    // Fallback to simple text format
    throw error;
  }
}

