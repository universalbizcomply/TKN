import { jsPDF } from 'jspdf';
import { ProductItem, ProductAngle } from '../types';
import { CurrencyCode, formatMoney } from './currency';

export interface GenerateZinePdfOptions {
  product: ProductItem;
  activeAngleIndex?: number;
  selectedSize?: string;
  currency?: CurrencyCode;
  onToast?: (message: string) => void;
}

// Draw a realistic vector barcode
function drawBarcode(doc: jsPDF, x: number, y: number, width: number, height: number, codeText: string) {
  const barPattern = [
    2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 3, 2, 1, 4, 1, 2,
    3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2
  ];
  let curX = x;
  const totalUnits = barPattern.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  doc.setFillColor(20, 20, 20);
  for (let i = 0; i < barPattern.length; i++) {
    const w = barPattern[i] * unitWidth;
    if (i % 2 === 0) {
      doc.rect(curX, y, w, height, 'F');
    }
    curX += w;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(40, 40, 40);
  doc.text(codeText, x + width / 2, y + height + 3, { align: 'center' });
}

// Draw a registration print mark
function drawRegistrationMark(doc: jsPDF, cx: number, cy: number, r: number = 3) {
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, r);
  doc.line(cx - r - 1.5, cy, cx + r + 1.5, cy);
  doc.line(cx, cy - r - 1.5, cx, cy + r + 1.5);
}

// Draw masking tape effect
function drawMaskingTape(doc: jsPDF, x: number, y: number, w: number, h: number, isYellow = true) {
  if (isYellow) {
    doc.setFillColor(254, 239, 137); // #feef89
  } else {
    doc.setFillColor(235, 230, 215);
  }
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h, 'FD');

  // Tape texture lines
  doc.setDrawColor(200, 190, 160);
  doc.setLineWidth(0.15);
  doc.line(x + 2, y + 1, x + w - 2, y + 1);
  doc.line(x + 2, y + h - 1, x + w - 2, y + h - 1);
}

// Draw a technical garment illustration directly in vector on the PDF
function drawGarmentIllustration(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  type: 'hoodie' | 'shirt' | 'crew' | 'thermal' | 'pants' | 'lookbook',
  isDetail: boolean = false
) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  doc.setDrawColor(245, 245, 245);
  doc.setLineWidth(0.7);

  if (type === 'pants') {
    // Technical pants flat
    const topY = y + 12;
    const waistW = w * 0.46;
    const hemY = y + h - 10;
    const leftX = cx - waistW / 2;
    const rightX = cx + waistW / 2;

    // Waistband
    doc.setFillColor(35, 35, 38);
    doc.rect(leftX, topY, waistW, 5, 'FD');

    // Legs
    doc.setFillColor(25, 25, 28);
    doc.triangle(
      leftX, topY + 5,
      cx - 18, hemY,
      cx - 2, hemY
    );
    doc.triangle(
      rightX, topY + 5,
      cx + 2, hemY,
      cx + 18, hemY
    );

    // Outer leg lines
    doc.line(leftX, topY + 5, cx - 18, hemY);
    doc.line(cx - 18, hemY, cx - 3, hemY);
    doc.line(cx - 3, hemY, cx, topY + 18); // crotch
    doc.line(cx, topY + 18, cx + 3, hemY);
    doc.line(cx + 3, hemY, cx + 18, hemY);
    doc.line(cx + 18, hemY, rightX, topY + 5);

    // Double knee stitch lines
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(cx - 16, cy - 2, 10, 16);
    doc.rect(cx + 6, cy - 2, 10, 16);
    doc.setLineDashPattern([], 0);

    // Hammer loop
    doc.line(rightX + 1, cy - 5, rightX + 4, cy - 5);
    doc.line(rightX + 4, cy - 5, rightX + 4, cy + 5);

  } else if (type === 'hoodie') {
    // Technical Hoodie flat
    const topY = y + 18;
    const bodyW = w * 0.52;
    const hemY = y + h - 12;

    // Hood
    doc.setFillColor(35, 35, 38);
    doc.roundedRect(cx - 12, y + 8, 24, 15, 3, 3, 'FD');
    doc.line(cx - 4, y + 17, cx, y + 21);
    doc.line(cx, y + 21, cx + 4, y + 17);

    // Body & Drop shoulder sleeves
    doc.line(cx - 12, topY, cx - bodyW / 2 - 12, topY + 14); // Left shoulder drop
    doc.line(cx - bodyW / 2 - 12, topY + 14, cx - bodyW / 2 - 6, topY + 28); // Sleeve cuff
    doc.line(cx - bodyW / 2 - 6, topY + 28, cx - bodyW / 2 + 4, topY + 20); // Armpit
    doc.line(cx - bodyW / 2 + 4, topY + 20, cx - bodyW / 2 + 4, hemY); // Left side

    doc.line(cx + 12, topY, cx + bodyW / 2 + 12, topY + 14); // Right shoulder drop
    doc.line(cx + bodyW / 2 + 12, topY + 14, cx + bodyW / 2 + 6, topY + 28); // Sleeve cuff
    doc.line(cx + bodyW / 2 + 6, topY + 28, cx + bodyW / 2 - 4, topY + 20); // Armpit
    doc.line(cx + bodyW / 2 - 4, topY + 20, cx + bodyW / 2 - 4, hemY); // Right side

    // Hem rib
    doc.setFillColor(30, 30, 34);
    doc.rect(cx - bodyW / 2 + 4, hemY - 4, bodyW - 8, 5, 'FD');

    // Kangaroo Pocket
    doc.rect(cx - 12, hemY - 18, 24, 12, 'D');
    doc.line(cx - 12, hemY - 18, cx - 7, hemY - 18);
    doc.line(cx + 7, hemY - 18, cx + 12, hemY - 18);

    // Center seam / chest tag
    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(255, 239, 137);
    doc.text('500GSM TERRY', cx, cy - 2, { align: 'center' });

  } else if (type === 'lookbook') {
    // Street skater stick figure
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, y + 14, 5, 'F'); // Head
    // Cap
    doc.line(cx - 4, y + 12, cx - 8, y + 11);

    // Oversized boxy torso
    doc.rect(cx - 9, y + 20, 18, 22, 'F');

    // Arms
    doc.line(cx - 9, y + 22, cx - 16, y + 34);
    doc.line(cx + 9, y + 22, cx + 16, y + 34);

    // Wide skate pants
    doc.line(cx - 5, y + 42, cx - 9, y + 62);
    doc.line(cx + 5, y + 42, cx + 9, y + 62);

    // Skateboard deck under feet
    doc.setLineWidth(1.2);
    doc.line(cx - 16, y + 65, cx + 16, y + 65);
    doc.circle(cx - 10, y + 67, 1.2, 'FD');
    doc.circle(cx + 10, y + 67, 1.2, 'FD');

  } else {
    // Shirt / Box Tee / Thermal / Crew
    const topY = y + 16;
    const bodyW = w * 0.54;
    const hemY = y + h - 14;

    // Ribbed Collar
    doc.ellipse(cx, topY, 8, 4);

    // Box Tee Shoulders & Wide Boxy Sleeves
    doc.line(cx - 8, topY, cx - bodyW / 2 - 10, topY + 8);
    doc.line(cx - bodyW / 2 - 10, topY + 8, cx - bodyW / 2 - 6, topY + 25);
    doc.line(cx - bodyW / 2 - 6, topY + 25, cx - bodyW / 2 + 2, topY + 18);
    doc.line(cx - bodyW / 2 + 2, topY + 18, cx - bodyW / 2 + 2, hemY);

    doc.line(cx + 8, topY, cx + bodyW / 2 + 10, topY + 8);
    doc.line(cx + bodyW / 2 + 10, topY + 8, cx + bodyW / 2 + 6, topY + 25);
    doc.line(cx + bodyW / 2 + 6, topY + 25, cx + bodyW / 2 - 2, topY + 18);
    doc.line(cx + bodyW / 2 - 2, topY + 18, cx + bodyW / 2 - 2, hemY);

    // Bottom straight hem
    doc.line(cx - bodyW / 2 + 2, hemY, cx + bodyW / 2 - 2, hemY);

    // Waffle texture / detail weave lines if thermal
    if (type === 'thermal' || isDetail) {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      for (let ly = topY + 8; ly < hemY - 2; ly += 4) {
        doc.line(cx - 10, ly, cx + 10, ly);
      }
    }

    // Chest branding
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 239, 137);
    doc.text('300GSM HEAVY', cx, cy - 2, { align: 'center' });
  }

  doc.setLineWidth(0.2);
}

// Measurement tables based on product type
function getMeasurementSpecs(product: ProductItem): {
  headers: string[];
  rows: { size: string; chest: string; length: string; shoulder: string; sleeve: string }[];
} {
  const cat = product.category;
  const title = product.title.toLowerCase();

  if (cat === 'pants' || title.includes('pant')) {
    return {
      headers: ['SIZE', 'WAIST', 'INSEAM', 'RISE', 'OPENING'],
      rows: [
        { size: '30', chest: '31.5"', length: '30.0"', shoulder: '12.0"', sleeve: '9.0"' },
        { size: '32', chest: '33.5"', length: '31.0"', shoulder: '12.5"', sleeve: '9.5"' },
        { size: '34', chest: '35.5"', length: '32.0"', shoulder: '13.0"', sleeve: '10.0"' },
        { size: '36', chest: '37.5"', length: '32.5"', shoulder: '13.5"', sleeve: '10.2"' },
        { size: '38', chest: '39.5"', length: '33.0"', shoulder: '14.0"', sleeve: '10.5"' },
      ],
    };
  }

  if (cat === 'hoodies' || title.includes('hoodie')) {
    return {
      headers: ['SIZE', 'CHEST', 'LENGTH', 'SHOULDER', 'SLEEVE'],
      rows: [
        { size: 'S', chest: '24.5"', length: '26.0"', shoulder: '23.5"', sleeve: '24.0"' },
        { size: 'M', chest: '26.0"', length: '27.0"', shoulder: '25.0"', sleeve: '24.5"' },
        { size: 'L', chest: '27.5"', length: '28.0"', shoulder: '26.5"', sleeve: '25.0"' },
        { size: 'XL', chest: '29.0"', length: '29.0"', shoulder: '28.0"', sleeve: '25.5"' },
        { size: 'XXL', chest: '30.5"', length: '30.0"', shoulder: '29.5"', sleeve: '26.0"' },
      ],
    };
  }

  if (cat === 'sweatshirts' || title.includes('crew') || title.includes('sweat')) {
    return {
      headers: ['SIZE', 'CHEST', 'LENGTH', 'SHOULDER', 'SLEEVE'],
      rows: [
        { size: 'S', chest: '23.5"', length: '26.5"', shoulder: '22.5"', sleeve: '23.5"' },
        { size: 'M', chest: '25.0"', length: '27.5"', shoulder: '23.5"', sleeve: '24.0"' },
        { size: 'L', chest: '26.5"', length: '28.5"', shoulder: '25.0"', sleeve: '24.5"' },
        { size: 'XL', chest: '28.0"', length: '29.5"', shoulder: '26.5"', sleeve: '25.0"' },
        { size: 'XXL', chest: '29.5"', length: '30.5"', shoulder: '27.5"', sleeve: '25.5"' },
      ],
    };
  }

  // Box tees & thermals default
  return {
    headers: ['SIZE', 'CHEST', 'LENGTH', 'SHOULDER', 'SLEEVE'],
    rows: [
      { size: 'S', chest: '22.0"', length: '28.0"', shoulder: '21.5"', sleeve: '8.5"' },
      { size: 'M', chest: '23.5"', length: '29.0"', shoulder: '22.5"', sleeve: '9.0"' },
      { size: 'L', chest: '25.0"', length: '30.0"', shoulder: '23.5"', sleeve: '9.5"' },
      { size: 'XL', chest: '26.5"', length: '31.0"', shoulder: '24.5"', sleeve: '10.0"' },
      { size: 'XXL', chest: '28.0"', length: '32.0"', shoulder: '25.5"', sleeve: '10.5"' },
    ],
  };
}

/**
 * Generates and downloads a rich, printable A4 Zine Spec Page PDF
 * of the garment's product details and polaroid imagery.
 */
export async function generateZinePdf({
  product,
  activeAngleIndex = 0,
  selectedSize = 'L',
  currency = 'GBP',
  onToast,
}: GenerateZinePdfOptions): Promise<void> {
  try {
    // 1. Create jsPDF A4 portrait instance (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const angle = product.angles[activeAngleIndex] || product.angles[0];

    // 2. Background tint - subtle textured off-white / vintage risograph tone
    doc.setFillColor(251, 249, 243); // #fbf9f3
    doc.rect(0, 0, 210, 297, 'F');

    // Print registration corner marks
    drawRegistrationMark(doc, 8, 8);
    drawRegistrationMark(doc, 202, 8);
    drawRegistrationMark(doc, 8, 289);
    drawRegistrationMark(doc, 202, 289);

    // Outer framing boundary
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277);

    // 3. ZINE MASTHEAD HEADER BANNER
    doc.setFillColor(18, 18, 20);
    doc.rect(10, 10, 190, 16, 'F');

    // Masthead typography
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TO KNOW NOTHING ARCHIVE', 14, 18);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(254, 239, 137); // yellow highlight
    doc.text('GARMENT SPEC SHEET // ISSUE NO. 26 // LONDON STUDIO ARCHIVE', 14, 23);

    // Right-aligned header data
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`CAT #${product.id.toUpperCase()}`, 196, 17, { align: 'right' });
    doc.setFontSize(6.5);
    doc.setTextColor(200, 200, 200);
    doc.text('DISPATCH: LONDON E8 // 300-500GSM', 196, 22, { align: 'right' });

    // Perforation / scissor cut line below header
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.line(10, 29, 200, 29);
    doc.setLineDashPattern([], 0);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text('✂  - - - - - - - - - - - - - - - - - [FOLD OR CUT FOR LOOKBOOK BINDER] - - - - - - - - - - - - - - - - -', 105, 28.2, {
      align: 'center',
    });

    // 4. TWO-COLUMN LAYOUT:
    // Left Column: Main Polaroid Card & Contact Strips (x=13 to x=97)
    // Right Column: Identity, Specs, Measurement Matrix & Barcode (x=102 to x=197)

    // ==========================================
    // LEFT COLUMN: POLAROID PHOTOMETRY & CONTACT
    // ==========================================
    const polaroidX = 14;
    const polaroidY = 33;
    const polaroidW = 82;
    const polaroidH = 106;

    // Physical card shadow offset
    doc.setFillColor(220, 215, 200);
    doc.rect(polaroidX + 1.5, polaroidY + 1.5, polaroidW, polaroidH, 'F');

    // Main Polaroid white base
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.6);
    doc.rect(polaroidX, polaroidY, polaroidW, polaroidH, 'FD');

    // Masking Tape on Polaroid Top Edge
    drawMaskingTape(doc, polaroidX + polaroidW / 2 - 14, polaroidY - 3, 28, 6, true);

    // Photo Window (1:1 Square)
    const photoX = polaroidX + 4;
    const photoY = polaroidY + 5;
    const photoSize = 74;

    // Photo background fill (Charcoal darkroom look)
    doc.setFillColor(24, 25, 28);
    doc.rect(photoX, photoY, photoSize, photoSize, 'F');
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoSize, photoSize, 'D');

    // Angle indicator inside photo window
    doc.setFillColor(0, 0, 0);
    doc.rect(photoX + 2, photoY + 2, 28, 4.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(254, 239, 137);
    doc.text(`ANGLE ${activeAngleIndex + 1}/${product.angles.length}`, photoX + 3.5, photoY + 5.2);

    doc.setFillColor(254, 239, 137);
    doc.rect(photoX + photoSize - 16, photoY + 2, 14, 4.5, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6);
    doc.text('ARCHIVE', photoX + photoSize - 9, photoY + 5.2, { align: 'center' });

    // Render Garment Graphic Vector Illustration inside the photo window
    drawGarmentIllustration(
      doc,
      photoX,
      photoY,
      photoSize,
      photoSize,
      angle.type,
      angle.svgVariant?.includes('weave') || angle.svgVariant?.includes('detail')
    );

    // Angle label stamp inside photo bottom
    doc.setFillColor(0, 0, 0);
    doc.rect(photoX + 4, photoY + photoSize - 7, photoSize - 8, 5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(254, 239, 137);
    doc.text(angle.label.toUpperCase(), photoX + photoSize / 2, photoY + photoSize - 3.5, { align: 'center' });

    // Polaroid Bottom Margin / Handwriting Caption
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(`FIG 01. ${product.title.toUpperCase()}`, polaroidX + 4, polaroidY + photoSize + 11);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text(angle.sublabel.toUpperCase(), polaroidX + 4, polaroidY + photoSize + 16);

    // Red Archive Stamp
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(polaroidX + polaroidW - 25, polaroidY + photoSize + 8, 21, 9, 1, 1, 'D');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.text('ARCHIVE VERIFIED', polaroidX + polaroidW - 14.5, polaroidY + photoSize + 12.5, { align: 'center' });
    doc.text('✓ PASSED', polaroidX + polaroidW - 14.5, polaroidY + photoSize + 15.5, { align: 'center' });

    // Contact Strip: Secondary angle polaroids (Below main polaroid)
    const contactY = polaroidY + polaroidH + 4;

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 40);
    doc.text('// CONTACT STRIP: MULTI-ANGLE & WEAVE MACRO', polaroidX, contactY);

    // Render 2 mini polaroid thumbnails
    const miniW = 39;
    const miniH = 43;

    for (let i = 0; i < 2; i++) {
      const otherIdx = (activeAngleIndex + i + 1) % product.angles.length;
      const otherAngle = product.angles[otherIdx];
      const mX = polaroidX + i * (miniW + 4);
      const mY = contactY + 2.5;

      // Base card
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.4);
      doc.rect(mX, mY, miniW, miniH, 'FD');

      // Mini tape
      drawMaskingTape(doc, mX + miniW / 2 - 8, mY - 2, 16, 4, i === 0);

      // Mini photo frame
      const mPhotoW = miniW - 4;
      const mPhotoH = 29;
      doc.setFillColor(28, 29, 33);
      doc.rect(mX + 2, mY + 3, mPhotoW, mPhotoH, 'F');

      // Draw secondary mini illustration
      drawGarmentIllustration(
        doc,
        mX + 2,
        mY + 3,
        mPhotoW,
        mPhotoH,
        otherAngle.type,
        otherAngle.svgVariant?.includes('weave') || otherAngle.svgVariant?.includes('detail')
      );

      // Mini caption
      doc.setFont('courier', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(20, 20, 20);
      doc.text(otherAngle.label.slice(0, 16).toUpperCase(), mX + 2, mY + mPhotoH + 6.5);
      doc.setFont('courier', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(90, 90, 90);
      doc.text(otherAngle.sublabel.slice(0, 18).toUpperCase(), mX + 2, mY + mPhotoH + 9.5);
    }

    // Streetwear Manifesto / Zine Quote Box
    const quoteY = contactY + miniH + 6;
    doc.setFillColor(242, 239, 230);
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.rect(polaroidX, quoteY, polaroidW, 17, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 30, 30);
    doc.text('LONDON ARCHIVE MANIFESTO //', polaroidX + 3, quoteY + 4);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(50, 50, 50);
    const manifestoLines = [
      '"To know nothing is to begin everything. Heavyweight blanks crafted',
      'in small batch runs. Pre-shrunk French terry & duck canvas cut boxy',
      'for permanent drape on London concrete."',
    ];
    manifestoLines.forEach((line, lIdx) => {
      doc.text(line, polaroidX + 3, quoteY + 7.5 + lIdx * 3);
    });

    // ==========================================
    // RIGHT COLUMN: PRODUCT DATA, SPECS & MATRIX
    // ==========================================
    const rightX = 103;
    let rightY = 34;

    // Title & Category Header
    doc.setFillColor(254, 239, 137);
    doc.rect(rightX, rightY, 32, 4.5, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(rightX, rightY, 32, 4.5, 'D');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`${product.category.toUpperCase()} DROP`, rightX + 16, rightY + 3.2, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(10, 10, 10);
    const splitTitle = doc.splitTextToSize(product.title.toUpperCase(), 92);
    doc.text(splitTitle, rightX, rightY + 10);

    rightY += splitTitle.length * 5 + 7;

    // Price & Sizing Stamp Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.rect(rightX, rightY, 93, 14, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text('CATALOG PRICE:', rightX + 3, rightY + 4.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const priceText = product.price > 0 ? formatMoney(product.price, currency) : 'ON-BODY / LOOKBOOK';
    doc.text(priceText, rightX + 3, rightY + 10.5);

    // Selected size tag
    doc.setFillColor(18, 18, 20);
    doc.rect(rightX + 48, rightY + 2.5, 42, 9, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(254, 239, 137);
    doc.text(`SELECTED SIZE: [ ${selectedSize} ]`, rightX + 69, rightY + 7, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text('BOXY DROP-SHOULDER CUT', rightX + 69, rightY + 10, { align: 'center' });

    rightY += 17;

    // Technical Specifications Sheet Card
    doc.setFillColor(245, 243, 237); // #f5f3ed
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.rect(rightX, rightY, 93, 38, 'FD');

    // Title banner of specs sheet
    doc.setFillColor(20, 20, 20);
    doc.rect(rightX, rightY, 93, 5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TECHNICAL SPECIFICATION MATRIX', rightX + 3, rightY + 3.5);
    doc.setTextColor(254, 239, 137);
    doc.text('PRE-SHRUNK', rightX + 90, rightY + 3.5, { align: 'right' });

    // Specs Grid
    const specStartY = rightY + 9;
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);

    doc.text('DENSITY / GSM:', rightX + 3, specStartY);
    doc.text('FABRIC WEAVE:', rightX + 46, specStartY);
    doc.text('SILHOUETTE:', rightX + 3, specStartY + 6);
    doc.text('STITCHING:', rightX + 46, specStartY + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 15, 15);
    doc.text(product.gsm, rightX + 3, specStartY + 3);
    doc.text(product.fabric.slice(0, 24), rightX + 46, specStartY + 3);
    doc.text(product.fit.slice(0, 22), rightX + 3, specStartY + 9);
    doc.text('42-Stitch Bar Tack Twin', rightX + 46, specStartY + 9);

    // Separator line
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(150, 150, 150);
    doc.line(rightX + 3, specStartY + 12, rightX + 90, specStartY + 12);
    doc.setLineDashPattern([], 0);

    // Full Description Text
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(30, 30, 30);
    const descLines = doc.splitTextToSize(product.description, 87);
    doc.text(descLines.slice(0, 4), rightX + 3, specStartY + 15);

    rightY += 41;

    // Measurement Table (Size Matrix)
    const measurements = getMeasurementSpecs(product);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.4);
    doc.rect(rightX, rightY, 93, 34, 'FD');

    // Table Header
    doc.setFillColor(30, 30, 35);
    doc.rect(rightX, rightY, 93, 5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);

    const colWidths = [18, 18, 19, 19, 19];
    let headerX = rightX + 2;
    measurements.headers.forEach((h, hIdx) => {
      doc.text(h, headerX, rightY + 3.5);
      headerX += colWidths[hIdx];
    });

    // Table Rows
    let rowY = rightY + 8.5;
    measurements.rows.forEach((r) => {
      const isSelected = r.size === selectedSize;

      if (isSelected) {
        doc.setFillColor(254, 239, 137);
        doc.rect(rightX + 0.5, rowY - 3.2, 92, 5, 'F');
        doc.setFont('courier', 'bold');
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setFont('courier', 'normal');
        doc.setTextColor(40, 40, 40);
      }

      doc.setFontSize(6.5);
      let cellX = rightX + 2;
      doc.text(`${r.size}${isSelected ? ' *' : ''}`, cellX, rowY);
      cellX += colWidths[0];
      doc.text(r.chest, cellX, rowY);
      cellX += colWidths[1];
      doc.text(r.length, cellX, rowY);
      cellX += colWidths[2];
      doc.text(r.shoulder, cellX, rowY);
      cellX += colWidths[3];
      doc.text(r.sleeve, cellX, rowY);

      rowY += 5.2;
    });

    rightY += 37;

    // Care Directives Box
    doc.setFillColor(240, 240, 235);
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.3);
    doc.rect(rightX, rightY, 93, 13, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(20, 20, 20);
    doc.text('★ CARE & PRESERVATION DIRECTIVES:', rightX + 3, rightY + 3.8);

    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Cold wash inside-out (max 30°C / 85°F). Hang dry in shade.', rightX + 3, rightY + 7);
    doc.text('Do not tumble dry. Do not iron directly on screen printed graphic.', rightX + 3, rightY + 10);

    rightY += 16;

    // Authenticity Barcode & Inspector Signoff
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.4);
    doc.rect(rightX, rightY, 93, 20, 'FD');

    // Barcode
    drawBarcode(doc, rightX + 4, rightY + 2.5, 52, 10, `* TKN-${product.id.toUpperCase().slice(0, 10)}-2026 *`);

    // Inspector Signature Box
    doc.setDrawColor(120, 120, 120);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(rightX + 60, rightY + 2, 30, 16);
    doc.setLineDashPattern([], 0);

    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(40, 40, 40);
    doc.text('INSPECTOR SIGN-OFF:', rightX + 62, rightY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('PASS [OK]', rightX + 62, rightY + 10.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(80, 80, 80);
    doc.text('BATCH 044 // LDN', rightX + 62, rightY + 14.5);

    // ==========================================
    // 5. ZINE PAGE FOOTER / COLOPHON
    // ==========================================
    doc.setFillColor(18, 18, 20);
    doc.rect(10, 273, 190, 14, 'F');

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TO KNOW NOTHING // HEAVY APPAREL ARCHIVE', 14, 278.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(200, 200, 200);
    doc.text('OFFICIAL PRINTABLE LOOKBOOK SPEC SHEET • ALL RIGHTS RESERVED • E8 LONDON UK', 14, 283);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(254, 239, 137);
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.text(`PRINTED: ${dateStr} • SHEET NO. 26`, 196, 281, { align: 'right' });

    // 6. Save & Download PDF
    const filename = `${product.id}-zine-spec-page.pdf`;
    doc.save(filename);

    if (onToast) {
      onToast(`DOWNLOADED: ${filename.toUpperCase()}`);
    }
  } catch (error) {
    console.error('Error generating zine PDF', error);
    if (onToast) {
      onToast('FAILED TO GENERATE ZINE SPEC PAGE PDF');
    }
  }
}
