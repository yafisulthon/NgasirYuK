from io import BytesIO
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def format_rupiah(amount) -> str:
    """Format angka ke format Rupiah Indonesia."""
    if amount is None:
        return "Rp 0"
    return f"Rp {int(amount):,}".replace(",", ".")


def _base_style():
    styles = getSampleStyleSheet()
    return styles


# ─── Struk Penjualan ─────────────────────────────────────────────────────────

def generate_sale_receipt(sale_data: dict) -> bytes:
    """Generate PDF struk penjualan (thermal-style, narrow)."""
    buffer = BytesIO()
    # Lebar struk thermal: 80mm
    page_width = 80 * mm
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, 200 * mm),
        rightMargin=5 * mm,
        leftMargin=5 * mm,
        topMargin=5 * mm,
        bottomMargin=5 * mm,
    )

    styles = _base_style()
    title_style = ParagraphStyle("title", fontSize=12, fontName="Helvetica-Bold", alignment=TA_CENTER)
    center_style = ParagraphStyle("center", fontSize=8, alignment=TA_CENTER)
    normal_style = ParagraphStyle("normal", fontSize=8)
    right_style = ParagraphStyle("right", fontSize=8, alignment=TA_RIGHT)
    bold_style = ParagraphStyle("bold", fontSize=9, fontName="Helvetica-Bold")

    elements = []

    # Header toko
    elements.append(Paragraph("NgasirYuK", title_style))
    elements.append(Paragraph("Toko Material Bangunan", center_style))
    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 2 * mm))

    # Info transaksi
    elements.append(Paragraph(f"No: {sale_data.get('transaction_number', '-')}", normal_style))
    elements.append(Paragraph(f"Tanggal: {sale_data.get('date', '-')}", normal_style))
    elements.append(Paragraph(f"Kasir: {sale_data.get('kasir', '-')}", normal_style))
    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 1 * mm))

    # Items
    for item in sale_data.get("details", []):
        elements.append(Paragraph(f"{item['name']}", normal_style))
        row = f"  {item['qty']} {item['unit']} x {format_rupiah(item['price'])}"
        subtotal = format_rupiah(item['subtotal'])
        # Use table for alignment
        t = Table([[row, subtotal]], colWidths=[45 * mm, 20 * mm])
        t.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        elements.append(t)

    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))

    # Total
    total_table = [
        ["Total", format_rupiah(sale_data.get("total", 0))],
        ["Bayar", format_rupiah(sale_data.get("payment", 0))],
        ["Kembali", format_rupiah(sale_data.get("change_amount", 0))],
    ]
    t = Table(total_table, colWidths=[35 * mm, 30 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    elements.append(t)

    elements.append(Spacer(1, 3 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph("Terima kasih atas kunjungan Anda!", center_style))
    elements.append(Paragraph("Barang yang sudah dibeli tidak dapat dikembalikan.", center_style))

    doc.build(elements)
    return buffer.getvalue()


# ─── Bukti Pembelian ──────────────────────────────────────────────────────────

def generate_purchase_receipt(purchase_data: dict) -> bytes:
    """Generate PDF bukti pembelian (A4)."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = _base_style()

    title_style = ParagraphStyle("title", fontSize=16, fontName="Helvetica-Bold", alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("subtitle", fontSize=10, alignment=TA_CENTER)
    bold_style = ParagraphStyle("bold", fontSize=10, fontName="Helvetica-Bold")
    normal_style = ParagraphStyle("normal", fontSize=10)

    elements = []
    elements.append(Paragraph("NgasirYuK", title_style))
    elements.append(Paragraph("Toko Material Bangunan", subtitle_style))
    elements.append(Spacer(1, 5 * mm))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.black))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph("BUKTI PEMBELIAN", ParagraphStyle("h2", fontSize=13, fontName="Helvetica-Bold", alignment=TA_CENTER)))
    elements.append(Spacer(1, 5 * mm))

    info_data = [
        ["No. Pembelian", ":", purchase_data.get("purchase_number", "-")],
        ["Tanggal", ":", str(purchase_data.get("date", "-"))],
        ["Supplier", ":", purchase_data.get("supplier_name", "-")],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 0.5*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 5 * mm))

    # Table header
    header = ["No", "Nama Barang", "Satuan", "Qty", "Harga", "Subtotal"]
    rows = [header]
    for i, item in enumerate(purchase_data.get("details", []), 1):
        rows.append([
            str(i),
            item["name"],
            item["unit"],
            str(item["qty"]),
            format_rupiah(item["price"]),
            format_rupiah(item["subtotal"]),
        ])
    rows.append(["", "", "", "", "TOTAL", format_rupiah(purchase_data.get("total", 0))])

    col_widths = [1*cm, 6*cm, 2*cm, 1.5*cm, 3.5*cm, 3.5*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ("FONTNAME", (4, -1), (5, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)

    doc.build(elements)
    return buffer.getvalue()


# ─── Laporan Penjualan ────────────────────────────────────────────────────────

def generate_sales_report(report_data: dict) -> bytes:
    """Generate PDF laporan penjualan."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

    title_style = ParagraphStyle("title", fontSize=16, fontName="Helvetica-Bold", alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("subtitle", fontSize=10, alignment=TA_CENTER)
    normal_style = ParagraphStyle("normal", fontSize=10)

    elements = []
    elements.append(Paragraph("NgasirYuK - Laporan Penjualan", title_style))
    elements.append(Paragraph(f"Periode: {report_data.get('period', '-')}", subtitle_style))
    elements.append(Spacer(1, 5*mm))

    header = ["No", "No. Transaksi", "Tanggal", "Kasir", "Total"]
    rows = [header]
    for i, sale in enumerate(report_data.get("sales", []), 1):
        rows.append([str(i), sale["transaction_number"], str(sale["date"]), sale["kasir"], format_rupiah(sale["total"])])

    rows.append(["", "", "", "GRAND TOTAL", format_rupiah(report_data.get("grand_total", 0))])

    t = Table(rows, colWidths=[1*cm, 4.5*cm, 3*cm, 4*cm, 4*cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (4, 1), (4, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ("FONTNAME", (3, -1), (4, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)

    doc.build(elements)
    return buffer.getvalue()


def generate_purchases_report(report_data: dict) -> bytes:
    """Generate PDF laporan pembelian."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    title_style = ParagraphStyle("title", fontSize=16, fontName="Helvetica-Bold", alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("subtitle", fontSize=10, alignment=TA_CENTER)

    elements = []
    elements.append(Paragraph("NgasirYuK - Laporan Pembelian", title_style))
    elements.append(Paragraph(f"Periode: {report_data.get('period', '-')}", subtitle_style))
    elements.append(Spacer(1, 5*mm))

    header = ["No", "No. Pembelian", "Tanggal", "Supplier", "Total"]
    rows = [header]
    for i, p in enumerate(report_data.get("purchases", []), 1):
        rows.append([str(i), p["purchase_number"], str(p["date"]), p.get("supplier_name", "-"), format_rupiah(p["total"])])
    rows.append(["", "", "", "GRAND TOTAL", format_rupiah(report_data.get("grand_total", 0))])

    t = Table(rows, colWidths=[1*cm, 4.5*cm, 3*cm, 4*cm, 4*cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (4, 1), (4, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ("FONTNAME", (3, -1), (4, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    doc.build(elements)
    return buffer.getvalue()


def generate_inventory_report(report_data: dict) -> bytes:
    """Generate PDF laporan persediaan."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    title_style = ParagraphStyle("title", fontSize=16, fontName="Helvetica-Bold", alignment=TA_CENTER)

    elements = []
    elements.append(Paragraph("NgasirYuK - Laporan Persediaan", title_style))
    elements.append(Paragraph(f"Per Tanggal: {report_data.get('date', '-')}", ParagraphStyle("sub", fontSize=10, alignment=TA_CENTER)))
    elements.append(Spacer(1, 5*mm))

    header = ["No", "Kode", "Nama Barang", "Kategori", "Sat.", "Stok", "Min. Stok", "Status"]
    rows = [header]
    for i, p in enumerate(report_data.get("products", []), 1):
        status = "Normal"
        if p["stock"] == 0:
            status = "Habis"
        elif p["stock"] <= p["minimum_stock"]:
            status = "Menipis"
        rows.append([
            str(i), p["code"], p["name"], p.get("category", "-"),
            p["unit"], str(p["stock"]), str(p["minimum_stock"]), status
        ])

    col_widths = [0.7*cm, 2*cm, 4*cm, 2.5*cm, 1.5*cm, 1.5*cm, 2*cm, 2*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (5, 1), (6, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(t)
    doc.build(elements)
    return buffer.getvalue()
